import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react";
import { useNotification } from "@/comps/noti/notiComp";
import { createPaperEntry, searchPapers, updatePaperEntry } from "@/utils/api/paper";
import { normalizeDoi } from "@/utils/doi";
import { NEW_DRAFT_KEY, clearDraft, useEntryDraftPage } from "@/utils/entryDraft";
import { PaperListItem } from "@/utils/interface/paper.types";
import { DraftLoading, EntryHeader } from "../EntryHeader";
import { sampleTitle } from "../SampleTabs";
import { useLookups } from "../stack/useLookups";
import { Issue, buildSubmitBody, newPerovskites, reviewDraft, sampleDiff, submittedLayers } from "./review";

const serif = { fontFamily: "Lora, serif" };

function Stat({ label, value, tone }: { label: string; value: number; tone?: "error" | "warning" }) {
    const color = tone === "error" && value > 0 ? "#B23B3B" : tone === "warning" && value > 0 ? "#B8530F" : "#1F1F1F";
    return (
        <div className="bg-white rounded-xl px-5 py-[18px] border" style={{ borderColor: tone && value > 0 ? "#F3D9C2" : "#ECECEC" }}>
            <div className="text-[13px] text-[#6B6B6B]">{label}</div>
            <div className="text-[32px] leading-10" style={{ ...serif, color }}>{value}</div>
        </div>
    );
}

/** ขั้น 6 (Review & submit): ตรวจ QC แล้วส่ง draft ทั้งก้อนเข้าฐานข้อมูลใน request เดียว */
export function ReviewForm({ paperId }: { paperId?: string }) {
    const router = useRouter();
    const { showNotification } = useNotification();
    const { draft, clear, restored, loadError, basePath } = useEntryDraftPage(paperId);
    const { lookups, error: lookupError } = useLookups();

    const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
    const [duplicate, setDuplicate] = useState<{ doi: string; paper: PaperListItem | null } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const doi = normalizeDoi(draft?.paper.doi ?? "");

    // DOI ซ้ำกับ paper อื่นในฐานข้อมูล -> ส่งไม่ได้ (server ก็กันซ้ำอีกชั้น)
    useEffect(() => {
        if (!doi.startsWith("10.")) return;
        let cancelled = false;
        searchPapers({ doi, limit: 1 }).then((res) => {
            const found: PaperListItem | undefined = res?.data?.[0];
            if (!cancelled) setDuplicate({ doi, paper: found && found.paper_id !== paperId ? found : null });
        });
        return () => { cancelled = true; };
    }, [doi, paperId]);

    if (!draft) return <DraftLoading error={loadError} />;
    if (lookupError) return <div className="py-20 text-center text-[#B23B3B]">โหลด dictionary ไม่สำเร็จ</div>;
    if (!lookups) return <DraftLoading error={false} />;

    const issues: Issue[] = reviewDraft(draft, lookups);
    if (duplicate?.doi === doi && duplicate.paper) {
        issues.unshift({
            id: "doi-duplicate",
            level: "error",
            title: `DOI ซ้ำกับ paper ที่มีอยู่แล้ว (paper ${duplicate.paper.paper_id})`,
            detail: "เปิดแก้ paper เดิมแทนการเพิ่มใหม่",
            step: "",
        });
    }
    const errors = issues.filter((i) => i.level === "error");
    const warnings = issues.filter((i) => i.level === "warning");
    const unconfirmed = warnings.filter((w) => !confirmed.has(w.id));
    const layerCount = draft.samples.reduce((n, s) => n + submittedLayers(s).length, 0);
    const diff = draft.samples.length > 1 ? sampleDiff(draft, lookups) : [];
    const created = newPerovskites(draft);
    const canSubmit = errors.length === 0 && unconfirmed.length === 0 && !submitting;

    const toggle = (id: string) => setConfirmed((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
    const fixLink = (issue: Issue) => (issue.step ? `${basePath}/${issue.step}` : basePath);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const body = buildSubmitBody(draft);
            const res = paperId ? await updatePaperEntry(paperId, body) : await createPaperEntry(body);
            if (!res?.success) {
                showNotification("ส่งไม่สำเร็จ", String(res?.message ?? "เกิดข้อผิดพลาดจาก server"), "error");
                return;
            }
            clearDraft(paperId ?? NEW_DRAFT_KEY); // ส่งแล้ว ไม่ต้องเก็บในเครื่องอีก
            showNotification("บันทึกแล้ว", `paper ${res.data.doi} · ${res.data.sample_count} samples เข้าฐานข้อมูลแล้ว`, "success");
            router.push("/dashboard/raw-data");
        } catch {
            showNotification("ส่งไม่สำเร็จ", "เชื่อมต่อ server ไม่ได้ ข้อมูลยังอยู่ในเครื่อง ลองใหม่ได้", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 text-[#1F1F1F] max-w-[1080px]">
            <EntryHeader
                draft={draft}
                crumb={draft.paper.doi || "(ยังไม่ใส่ DOI)"}
                title={{ base: "Review ", accent: "& Submit" }}
                step={[5]}
                restored={restored}
                onClear={async () => { await clear(); setConfirmed(new Set()); }}
            />

            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
                <Stat label="Samples" value={draft.samples.length} />
                <Stat label="Layers" value={layerCount} />
                <Stat label="Errors" value={errors.length} tone="error" />
                <Stat label="Warnings ต้องยืนยัน" value={unconfirmed.length} tone="warning" />
            </div>

            {/* QC */}
            <section className="bg-white border border-[#ECECEC] rounded-xl p-7 flex flex-col gap-3">
                <h2 className="m-0 text-[24px] leading-8 font-semibold" style={serif}>QC checklist</h2>

                {errors.map((issue) => (
                    <div key={issue.id} className="flex gap-3 items-start px-4 py-3 bg-[#FBEAEA] border border-[#F1C7C7] rounded-[10px] text-[14px] leading-[22px] text-[#8A2B2B]">
                        <IconX size={18} stroke={2.5} className="shrink-0 mt-0.5" />
                        <span>
                            <b>{issue.title}</b>{issue.detail && <> · {issue.detail}</>} ·{" "}
                            <Link href={fixLink(issue)} className="font-semibold text-[#8A2B2B] underline">ไปแก้</Link>
                        </span>
                    </div>
                ))}

                {warnings.map((issue) => (
                    <label key={issue.id} className="flex gap-3 items-start px-4 py-3 bg-[#FFF8F2] border border-[#F3D9C2] rounded-[10px] text-[14px] leading-[22px] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={confirmed.has(issue.id)}
                            onChange={() => toggle(issue.id)}
                            className="w-5 h-5 mt-px shrink-0"
                        />
                        <span>
                            <b>{issue.title}</b>{issue.detail && <> · {issue.detail}</>} ·{" "}
                            <Link href={fixLink(issue)}>ไปแก้</Link>
                        </span>
                    </label>
                ))}

                {issues.length === 0 && (
                    <div className="flex gap-3 items-start px-4 py-3 bg-[#EEF7F1] rounded-[10px] text-[14px] leading-[22px] text-[#1E6B3A]">
                        <IconCheck size={18} stroke={2.5} className="shrink-0 mt-0.5" />
                        <span>วัสดุทุกตัวอยู่ใน dictionary · ค่าทุกตัวอยู่ในช่วงที่เป็นไปได้ · J-V ครบและสอดคล้องกัน</span>
                    </div>
                )}
            </section>

            {/* ความต่างระหว่าง sample */}
            {diff.length > 0 && (
                <section className="bg-white border border-[#ECECEC] rounded-xl p-7 flex flex-col gap-3">
                    <h2 className="m-0 text-[24px] leading-8 font-semibold" style={serif}>ความต่างระหว่าง sample</h2>
                    <div className="overflow-x-auto border border-[#ECECEC] rounded-[10px]">
                        <table className="w-full min-w-[560px] border-collapse text-[14px]">
                            <thead>
                                <tr className="bg-[#FAFAFA] text-left text-[#6B6B6B] text-[12px]">
                                    <th className="px-3.5 py-2.5">Field</th>
                                    {draft.samples.map((s, i) => <th key={s.key} className="px-3.5 py-2.5">{sampleTitle(s, i)}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {diff.map((row) => (
                                    <tr key={row.field} className="border-t border-[#F0F0F0] align-top">
                                        <td className="px-3.5 py-2.5 font-semibold whitespace-nowrap">{row.field}</td>
                                        {row.cells.map((cell, i) => (
                                            <td
                                                key={i}
                                                className={`px-3.5 py-2.5 ${cell === "—" ? "text-[#6B6B6B]" : ""}`}
                                                style={{ background: row.differs[i] ? "#EEF4FD" : undefined }}
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="m-0 text-[13px] text-[#6B6B6B]">แสดงเฉพาะ layer ที่ต่างกัน · ช่องสีฟ้า = ต่างจาก {draft.samples.some((s) => s.is_control) ? "sample control" : "sample แรก"}</p>
                </section>
            )}

            <div className="flex flex-wrap gap-6">
                {/* วัสดุใหม่ */}
                <section className="flex-[1_1_320px] bg-white border border-[#ECECEC] rounded-xl p-7 flex flex-col gap-3">
                    <h2 className="m-0 text-[22px] leading-[30px] font-semibold" style={serif}>วัสดุใหม่ที่จะสร้าง</h2>
                    {created.length === 0 ? (
                        <p className="m-0 text-[14px] text-[#6B6B6B]">ไม่มี · ทุก layer ใช้วัสดุที่มีในฐานข้อมูลแล้ว</p>
                    ) : created.map((m) => (
                        <div key={m.name} className="flex flex-col gap-1 px-3.5 py-2.5 border border-[#ECECEC] rounded-[10px] text-[14px]">
                            <span><b className="font-mono">{m.name}</b> · perovskite · sample {m.samples.join(", ")}</span>
                            <span className="font-mono text-[12px] text-[#1F55B0]">{m.ions}</span>
                        </div>
                    ))}
                    <p className="m-0 text-[13px] leading-5 text-[#6B6B6B]">
                        perovskite ที่ยังไม่มี composition นี้ในฐานข้อมูลจะถูกสร้างเป็น material ใหม่พร้อมสัดส่วนไอออนตอนส่ง
                        ถ้ามีคนเพิ่มสูตรเดียวกันไว้ก่อน ระบบจะใช้ของเดิมแทน
                    </p>
                </section>

                {/* สิ่งที่จะเกิดตอนส่ง */}
                <section className="flex-[1_1_320px] bg-white border border-[#ECECEC] rounded-xl p-7 flex flex-col gap-3">
                    <h2 className="m-0 text-[22px] leading-[30px] font-semibold" style={serif}>เมื่อกดส่ง</h2>
                    <ul className="m-0 pl-5 flex flex-col gap-1.5 text-[14px] leading-[22px]">
                        <li>{paperId ? "แก้ข้อมูล paper เดิม" : "สร้าง paper ใหม่"} <span className="font-mono">{doi || "-"}</span></li>
                        <li>
                            {draft.samples.filter((s) => !s.sample_id).length} sample ใหม่
                            {draft.samples.some((s) => s.sample_id) && <> · {draft.samples.filter((s) => s.sample_id).length} sample เดิม (stack และผลวัดเดิม<b>ถูกแทนที่</b>ด้วยค่าในหน้านี้)</>}
                        </li>
                        <li>บันทึกทั้งหมดใน transaction เดียว ถ้ามีจุดไหนผิด จะไม่มีอะไรถูกบันทึก</li>
                        <li>ส่งสำเร็จแล้ว ข้อมูลที่พักไว้ในเครื่องจะถูกลบ</li>
                    </ul>
                </section>
            </div>

            <div className="flex flex-wrap gap-3 justify-end items-center">
                {errors.length > 0 ? (
                    <span className="text-[13px] text-[#B23B3B] inline-flex items-center gap-1"><IconAlertTriangle size={14} /> แก้ error อีก {errors.length} ข้อก่อนจึงส่งได้</span>
                ) : unconfirmed.length > 0 && (
                    <span className="text-[13px] text-[#9A450C]">ยืนยัน warning อีก {unconfirmed.length} ข้อก่อนจึงส่งได้</span>
                )}
                <Link
                    href={`${basePath}/results`}
                    className="inline-flex items-center h-11 px-5 rounded-[10px] border border-[#D4D4D4] bg-white text-[#2B2B2B] text-[14px]"
                >
                    ← ย้อนกลับ
                </Link>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="h-11 px-[22px] rounded-[10px] bg-[#2F6FDB] hover:bg-[#1F55B0] text-white font-semibold text-[14px] cursor-pointer disabled:bg-[#A8C0EC] disabled:cursor-default"
                >
                    {submitting ? "กำลังส่ง…" : "ส่งเข้าฐานข้อมูล"}
                </button>
            </div>
        </div>
    );
}
