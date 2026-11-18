import React, { useState } from "react";
import { IconTrash, IconWand } from "@tabler/icons-react";
import { DraftStabilityTest } from "@/utils/interface/entryDraft.types";
import { NumInput, fieldClass } from "../stack/inputs";
import { ATMOSPHERES, LIGHTS, MODES, parseEnvironment, suggestIsos } from "./stability";

const control = `${fieldClass} h-11 rounded-[10px] w-full`;
const one = (value?: number | null) => ({ value: value ?? null, min: null, max: null });

function Field({ id, label, hint, children }: { id?: string; label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 min-w-0">
            <label htmlFor={id} className="text-[13px] font-semibold">
                {label} {hint && <span className="font-normal text-[#6B6B6B]">· {hint}</span>}
            </label>
            {children}
        </div>
    );
}

function Choice({ id, value, options, onChange }: {
    id: string;
    value?: string | null;
    options: { value: string; label: string }[];
    onChange: (v: string | null) => void;
}) {
    return (
        <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={control}>
            <option value="">ไม่ระบุ</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            {/* ค่าเก่าจาก import ที่ไม่อยู่ในรายการ */}
            {value && !options.some((o) => o.value === value) && <option value={value}>{value}</option>}
        </select>
    );
}

/** 1 การทดสอบ stability */
function StabilityCard({ index, test, onChange, onRemove }: {
    index: number;
    test: DraftStabilityTest;
    onChange: (patch: Partial<DraftStabilityTest>) => void;
    onRemove: () => void;
}) {
    // ข้อความจาก paper ใช้ช่วยกรอกเท่านั้น ไม่ได้เก็บลงฐานข้อมูล
    const [raw, setRaw] = useState("");
    const [filled, setFilled] = useState<string[] | null>(null);
    const id = (name: string) => `st${index}-${name}`;
    const suggested = suggestIsos(test);

    const fillFromText = () => {
        const parsed = parseEnvironment(raw);
        onChange(parsed);
        setFilled(Object.keys(parsed));
    };

    return (
        <section className="bg-white border border-[#ECECEC] rounded-xl p-7 flex flex-col gap-5">
            <div className="flex flex-wrap gap-3 items-start justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="m-0 text-[22px] leading-[30px] font-semibold" style={{ fontFamily: "Lora, serif" }}>Stability test #{index + 1}</h2>
                    <p className="m-0 text-[14px] text-[#6B6B6B]">เลือกจาก dropdown แทนการพิมพ์ข้อความเอง ระบบเสนอ ISOS code ให้</p>
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    className="min-h-10 px-3.5 inline-flex items-center gap-1.5 border border-[#D4D4D4] rounded-[10px] bg-white text-[14px] text-[#B23B3B] hover:bg-[#FBEAEA] cursor-pointer"
                >
                    <IconTrash size={16} /> ลบ
                </button>
            </div>

            {/* ช่วยกรอกจากข้อความ */}
            <div className="flex flex-col gap-1.5">
                <label htmlFor={id("raw")} className="text-[13px] font-semibold">
                    ข้อความเดิมจาก paper <span className="font-normal text-[#6B6B6B]">· optional ใช้ช่วยกรอกช่องด้านล่าง ไม่ได้บันทึก</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    <input
                        id={id("raw")}
                        value={raw}
                        onChange={(e) => { setRaw(e.target.value); setFilled(null); }}
                        placeholder="เช่น MPP tracking, 1 Sun, ambient air, 65 °C (ISOS-L-2)"
                        className={`${fieldClass} h-11 rounded-[10px] flex-[1_1_320px] min-w-0`}
                    />
                    <button
                        type="button"
                        onClick={fillFromText}
                        disabled={!raw.trim()}
                        className="h-11 px-4 inline-flex items-center gap-1.5 rounded-[10px] border border-[#2F6FDB] bg-white text-[#2F6FDB] text-[14px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-default"
                    >
                        <IconWand size={16} /> กรอกจากข้อความ
                    </button>
                </div>
                {filled && (
                    <span className="text-[13px] text-[#6B6B6B]">
                        {filled.length ? `กรอกให้แล้ว: ${filled.join(", ")} · ตรวจอีกครั้งด้านล่าง` : "อ่านข้อความนี้ไม่ออก กรอกเองด้านล่าง"}
                    </span>
                )}
            </div>

            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                <Field id={id("atm")} label="Atmosphere">
                    <Choice id={id("atm")} value={test.atmosphere} options={ATMOSPHERES} onChange={(v) => onChange({ atmosphere: v })} />
                </Field>
                <Field id={id("light")} label="Light">
                    <Choice id={id("light")} value={test.light} options={LIGHTS} onChange={(v) => onChange({ light: v })} />
                </Field>
                <Field id={id("mode")} label="Mode">
                    <Choice id={id("mode")} value={test.mode} options={MODES} onChange={(v) => onChange({ mode: v })} />
                </Field>
                <Field id={id("isos")} label="ISOS" hint={suggested ? "เสนอให้" : undefined}>
                    <input
                        id={id("isos")}
                        value={test.isos_code ?? ""}
                        placeholder={suggested ?? "เช่น ISOS-D-1"}
                        onChange={(e) => onChange({ isos_code: e.target.value.toUpperCase() || null })}
                        className={`${control} font-mono`}
                    />
                    {suggested && suggested !== test.isos_code && (
                        <button
                            type="button"
                            onClick={() => onChange({ isos_code: suggested })}
                            className="self-start text-[13px] text-[#2F6FDB] font-semibold cursor-pointer hover:underline"
                        >
                            ใช้ {suggested}
                        </button>
                    )}
                </Field>
                <Field id={id("temp")} label="Temperature (°C)">
                    <NumInput id={id("temp")} value={one(test.temperature_c)} onChange={(r) => onChange({ temperature_c: r.value })} className={control} />
                </Field>
                <Field id={id("rh")} label="RH (%)" hint="ช่วงได้ เช่น 30-40">
                    <NumInput
                        id={id("rh")}
                        allowRange
                        value={{ value: test.rh_pct ?? null, min: test.rh_min_pct ?? null, max: test.rh_max_pct ?? null }}
                        onChange={(r) => onChange({ rh_pct: r.value, rh_min_pct: r.min, rh_max_pct: r.max })}
                        className={control}
                    />
                </Field>
                <Field id={id("dur")} label="Duration (h)">
                    <NumInput id={id("dur")} value={one(test.duration_h)} onChange={(r) => onChange({ duration_h: r.value })} className={control} />
                </Field>
                <Field id={id("ret")} label="Retention (%)" hint="ของ PCE เริ่มต้น">
                    <NumInput id={id("ret")} value={one(test.retention_pct)} onChange={(r) => onChange({ retention_pct: r.value })} className={control} />
                </Field>
                <Field id={id("t80")} label="T80 (h)">
                    <NumInput id={id("t80")} value={one(test.t80_h)} placeholder="ไม่รายงาน" onChange={(r) => onChange({ t80_h: r.value })} className={control} />
                </Field>
                <Field id={id("enc")} label="Encapsulated">
                    <select
                        id={id("enc")}
                        value={test.encapsulated == null ? "" : String(test.encapsulated)}
                        onChange={(e) => onChange({ encapsulated: e.target.value === "" ? null : e.target.value === "true" })}
                        className={control}
                    >
                        <option value="">ไม่ระบุ</option>
                        <option value="true">มี encapsulation</option>
                        <option value="false">ไม่มี</option>
                    </select>
                </Field>
            </div>
        </section>
    );
}

interface Props {
    tests: DraftStabilityTest[];
    onChange: (tests: DraftStabilityTest[]) => void;
}

export function StabilityTests({ tests, onChange }: Props) {
    return (
        <>
            {tests.map((t, i) => (
                <StabilityCard
                    key={`${i}-${tests.length}`}
                    index={i}
                    test={t}
                    onChange={(patch) => onChange(tests.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
                    onRemove={() => onChange(tests.filter((_, j) => j !== i))}
                />
            ))}
            <button
                type="button"
                onClick={() => onChange([...tests, {}])}
                className="self-start min-h-11 px-4 rounded-[10px] border border-dashed border-[#2F6FDB] bg-white text-[#2F6FDB] text-[14px] font-semibold cursor-pointer"
            >
                + เพิ่ม stability test
            </button>
        </>
    );
}
