import React, { useEffect, useId, useState } from "react";
import { IconCheck, IconInfoCircle, IconAlertTriangle, IconTrash } from "@tabler/icons-react";
import { getComposition, resolveComposition } from "@/utils/api/lookup";
import { DraftIon, DraftLayer } from "@/utils/interface/entryDraft.types";
import { Material, ResolvedComposition } from "@/utils/interface/lookup.types";
import { NumInput, fieldClass } from "./inputs";

/**
 * วัสดุของ layer PSK = material (is_perovskite) 1 ตัว + สัดส่วนไอออนหลายแถว (perovskite_composition)
 *
 * - พิมพ์สูตร -> server แยกเป็น A/B/X แล้วหาวัสดุที่ composition ตรงกัน (เทียบ composition ไม่ใช่ชื่อ)
 * - เจอ  -> ใช้ material_id เดิม
 * - ไม่เจอ -> เก็บ composition ไว้ใน draft ตอนส่งค่อยสร้าง material ใหม่
 * - ชื่อที่แยกเป็นสูตรไม่ได้ (เช่น "CsFAMA") -> กรอกไอออนเอง
 */

const SITES = ["A", "B", "X"] as const;
const EXPECTED_SUM = { A: 1, B: 1, X: 3 }; // ABX3
const SITE_HINT = { A: "cation เช่น FA, MA, Cs", B: "metal เช่น Pb, Sn", X: "halide เช่น I, Br" };

const chip = "px-2.5 py-[3px] rounded-full";
const fmt = (n: number) => String(Number(n.toFixed(4)));

// งานที่รอส่งไป server (debounce): แยกสูตรจากชื่อ หรือหาวัสดุจากไอออนที่กรอกเอง
type Pending = { kind: "formula"; text: string } | { kind: "composition"; rows: DraftIon[] } | null;

interface Props {
    layer: DraftLayer;
    materials: Material[];
    onChange: (patch: Partial<DraftLayer>) => void;
}

export function PerovskiteMaterial({ layer, materials, onChange }: Props) {
    const listId = useId();
    const perovskites = materials.filter((m) => m.is_perovskite);
    const manual = layer.composition_manual ?? false;

    const [pending, setPending] = useState<Pending>(null);
    const [checking, setChecking] = useState(false);
    // composition ในฐานข้อมูลของวัสดุที่เลือก (ใช้แสดงเมื่อ draft ไม่มี composition เช่นเลือกจากรายการ)
    const [dbComposition, setDbComposition] = useState<{ id: number; rows: DraftIon[] } | null>(null);

    const shownName = layer.material_name ?? materials.find((m) => m.material_id === layer.material_id)?.name ?? "";
    const composition: DraftIon[] = layer.composition
        ?? (dbComposition && dbComposition.id === layer.material_id ? dbComposition.rows : []);

    // ส่งไป server หลังพิมพ์เสร็จ 400ms
    useEffect(() => {
        if (!pending) return;
        let cancelled = false;
        const timer = setTimeout(async () => {
            setChecking(true);
            const body = pending.kind === "formula"
                ? { formula: pending.text }
                : { composition: pending.rows.filter((r) => r.ion.trim() && r.fraction != null) };
            const res = await resolveComposition(body).catch(() => null);
            if (cancelled) return;
            setChecking(false);
            setPending(null);
            const data: ResolvedComposition | null = res?.success ? res.data : null;
            if (!data) return;

            if (pending.kind === "formula") {
                const byName = materials.find((m) => m.name.toLowerCase() === pending.text.trim().toLowerCase());
                onChange({
                    composition: data.composition,
                    material_id: data.material?.material_id ?? byName?.material_id ?? null,
                });
            } else {
                onChange({ material_id: data.material?.material_id ?? null });
            }
        }, 400);
        return () => { cancelled = true; clearTimeout(timer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pending]);

    // วัสดุที่มีอยู่แล้วแต่ draft ยังไม่มี composition -> ดึงจากฐานข้อมูลมาแสดง
    useEffect(() => {
        const id = layer.material_id;
        if (!id || layer.composition) return;
        let cancelled = false;
        getComposition(id).then((res) => {
            if (!cancelled && res?.success) setDbComposition({ id, rows: res.data });
        });
        return () => { cancelled = true; };
    }, [layer.material_id, layer.composition]);

    const handleName = (text: string) => {
        const byName = materials.find((m) => m.name.toLowerCase() === text.trim().toLowerCase());
        if (manual) {
            // กรอกไอออนเองอยู่ -> ชื่อเป็นแค่ป้าย ไม่ต้องแยกสูตร
            onChange({ material_name: text || null });
            return;
        }
        onChange({ material_name: text || null, material_id: byName?.material_id ?? null, composition: null });
        setPending(text.trim() ? { kind: "formula", text } : null);
    };

    const setRows = (rows: DraftIon[]) => {
        onChange({ composition: rows, material_id: null });
        setPending({ kind: "composition", rows });
    };

    const setManual = (on: boolean) => {
        if (on) {
            onChange({
                composition_manual: true,
                composition: composition.length ? composition : SITES.map((site) => ({ site, ion: "", fraction: null })),
            });
        } else {
            onChange({ composition_manual: false, composition: null, material_id: null });
            setPending(shownName.trim() ? { kind: "formula", text: shownName } : null);
        }
    };

    // ผลรวมแต่ละ site ต้องได้ A = 1, B = 1, X = 3
    const sums = Object.fromEntries(SITES.map((s) => [
        s, composition.filter((r) => r.site === s).reduce((sum, r) => sum + (r.fraction ?? 0), 0),
    ])) as Record<(typeof SITES)[number], number>;
    const sumsOk = SITES.every((s) => Math.abs(sums[s] - EXPECTED_SUM[s]) < 0.005);
    const hasComposition = composition.some((r) => r.ion.trim());
    const existing = layer.material_id ? materials.find((m) => m.material_id === layer.material_id) : undefined;

    let status: { tone: "ok" | "new" | "warn"; text: React.ReactNode } | null = null;
    if (checking) status = null;
    else if (existing) {
        status = { tone: "ok", text: <>ตรงกับวัสดุในฐานข้อมูล <b className="font-mono">{existing.name}</b> · ใช้ material เดิม</> };
    } else if (hasComposition && shownName.trim()) {
        status = {
            tone: "new",
            text: <>ยังไม่มีในฐานข้อมูล · ตอนส่งจะสร้างวัสดุใหม่ <b className="font-mono">{shownName.trim()}</b> พร้อมสัดส่วน {composition.filter((r) => r.ion.trim()).length} ไอออน</>,
        };
    } else if (hasComposition) {
        status = { tone: "warn", text: "ใส่ชื่อวัสดุด้วย (ใช้เป็นชื่อของวัสดุใหม่)" };
    } else if (shownName.trim() && !manual && !pending) {
        status = { tone: "warn", text: "แยกสูตรไม่ได้และไม่มีชื่อนี้ใน dictionary · กดกรอกไอออนเอง" };
    }
    const toneClass = { ok: "bg-[#EEF7F1] text-[#1E6B3A]", new: "bg-[#EEF4FD] text-[#1F4F9E]", warn: "bg-[#FFF4EA] text-[#9A450C]" };
    const ToneIcon = { ok: IconCheck, new: IconInfoCircle, warn: IconAlertTriangle };

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <label htmlFor="psk-material" className="text-[13px] font-semibold">
                    Perovskite <span className="font-normal text-[#6B6B6B]">· พิมพ์สูตร หรือเลือกจาก dictionary</span>
                </label>
                <label className="flex items-center gap-2 text-[13px] text-[#4A4A4A] cursor-pointer">
                    <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} className="w-[18px] h-[18px]" />
                    กรอกไอออนเอง
                </label>
            </div>

            <input
                id="psk-material"
                list={listId}
                value={shownName}
                onChange={(e) => handleName(e.target.value)}
                placeholder={manual ? "ชื่อที่ paper ใช้ เช่น CsFAMA" : "เช่น Cs0.05MA0.05FA0.9PbI3"}
                className={`${fieldClass} h-11 rounded-[10px] font-mono text-[15px]`}
            />
            <datalist id={listId}>
                {perovskites.map((m) => <option key={m.material_id} value={m.name} />)}
            </datalist>

            {/* สัดส่วนไอออน */}
            {manual ? (
                <div className="overflow-x-auto border border-[#ECECEC] rounded-[10px]">
                    <table className="w-full min-w-[420px] border-collapse text-[14px]">
                        <thead>
                            <tr className="bg-[#FAFAFA] text-left text-[#6B6B6B] text-[12px]">
                                <th className="px-3.5 py-2">Site</th>
                                <th className="px-3.5 py-2">Ion</th>
                                <th className="px-3.5 py-2">Fraction</th>
                                <th className="px-3.5 py-2"><span className="sr-only">ลบ</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {composition.map((r, i) => {
                                const setRow = (patch: Partial<DraftIon>) => setRows(composition.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                                return (
                                    <tr key={i} className="border-t border-[#F0F0F0]">
                                        <td className="px-3.5 py-1.5">
                                            <select aria-label={`site ของไอออนที่ ${i + 1}`} value={r.site} onChange={(e) => setRow({ site: e.target.value as DraftIon["site"] })} className={fieldClass}>
                                                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-3.5 py-1.5">
                                            <input
                                                aria-label={`ไอออนที่ ${i + 1}`}
                                                value={r.ion}
                                                placeholder={SITE_HINT[r.site]}
                                                onChange={(e) => setRow({ ion: e.target.value.trim() })}
                                                className={`${fieldClass} w-full min-w-[140px] font-mono`}
                                            />
                                        </td>
                                        <td className="px-3.5 py-1.5">
                                            <NumInput
                                                aria-label={`สัดส่วนไอออนที่ ${i + 1}`}
                                                value={{ value: r.fraction, min: null, max: null }}
                                                onChange={(v) => setRow({ fraction: v.value })}
                                                className="w-24 font-mono"
                                            />
                                        </td>
                                        <td className="px-3.5 py-1.5 text-right">
                                            <button
                                                type="button"
                                                aria-label={`ลบไอออนที่ ${i + 1}`}
                                                onClick={() => setRows(composition.filter((_, j) => j !== i))}
                                                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#B23B3B] hover:bg-[#FBEAEA] cursor-pointer"
                                            >
                                                <IconTrash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <button
                        type="button"
                        onClick={() => setRows([...composition, { site: "A", ion: "", fraction: null }])}
                        className="w-full min-h-10 border-t border-[#F0F0F0] text-[14px] text-[#2F6FDB] font-semibold cursor-pointer hover:bg-[#F7FAFF]"
                    >
                        + เพิ่มไอออน
                    </button>
                </div>
            ) : null}

            {hasComposition && (
                <div className="flex flex-wrap gap-1.5 font-mono text-[12px]">
                    {SITES.map((site) => {
                        const ions = composition.filter((r) => r.site === site && r.ion.trim());
                        if (ions.length === 0) return null;
                        return (
                            <span key={site} className={`${chip} bg-[#EEF4FD] text-[#1F55B0]`}>
                                {site}: {ions.map((r) => `${r.ion} ${r.fraction == null ? "?" : fmt(r.fraction)}`).join(" · ")}
                            </span>
                        );
                    })}
                    <span className={`${chip} ${sumsOk ? "bg-[#E8F5EC] text-[#1E6B3A]" : "bg-[#FFF4EA] text-[#9A450C]"}`}>
                        ΣA = {fmt(sums.A)} · ΣB = {fmt(sums.B)} · ΣX = {fmt(sums.X)} {sumsOk ? "✓" : "(ควรเป็น 1 · 1 · 3)"}
                    </span>
                </div>
            )}

            {checking && <div className="text-[13px] text-[#6B6B6B]">กำลังตรวจสูตร…</div>}
            {status && (() => {
                const Icon = ToneIcon[status.tone];
                return (
                    <div className={`flex gap-2 items-start rounded-[10px] px-3.5 py-2.5 text-[13px] leading-5 ${toneClass[status.tone]}`}>
                        <Icon size={16} stroke={2.2} className="shrink-0 mt-0.5" />
                        <span>{status.text}</span>
                    </div>
                );
            })()}

            <p className="m-0 text-[12px] leading-[18px] text-[#6B6B6B]">
                สูตรนี้คือองค์ประกอบของฟิล์มตามที่ paper รายงาน · สารที่ชั่งมาผสม (PbI2, FAI, CsCl …) และสารเติมกรอกในตาราง &quot;สารตั้งต้น&quot; ด้านล่าง ·
                perovskite 2 เฟส (เช่น 3D + 2D) ให้กด &quot;+ เพิ่ม sub-layer&quot; แล้วใส่สูตรแยกกัน
            </p>
        </div>
    );
}
