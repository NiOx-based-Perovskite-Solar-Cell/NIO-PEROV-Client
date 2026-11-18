import React from "react";
import { IconArrowDown, IconArrowUp, IconTrash } from "@tabler/icons-react";
import { DraftProcessParam, DraftProcessStep } from "@/utils/interface/entryDraft.types";
import { Lookups, Unit } from "@/utils/interface/lookup.types";
import { NumInput, UnitSelect, fieldClass } from "./inputs";
import { baseUnit, formatRange, humanize, unitsOfQuantity } from "./stack";

const iconBtn = "w-9 h-9 inline-flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-default";

interface Props {
    steps: DraftProcessStep[];
    lookups: Lookups;
    onChange: (steps: DraftProcessStep[]) => void;
}

/** "= 900 s" เมื่อกรอกในหน่วยที่ไม่ใช่หน่วยหลัก */
function baseValueText(units: Unit[], p: DraftProcessParam) {
    const unit = units.find((u) => u.unit_code === p.unit);
    if (p.value == null || !unit || (unit.to_si_factor === 1 && unit.to_si_offset === 0)) return null;
    const base = baseUnit(units, unit.quantity);
    if (!base) return null;
    return `= ${formatRange({ value: p.value * unit.to_si_factor + unit.to_si_offset, min: null, max: null })} ${base.unit_code}`;
}

/** ขั้นตอนการทำ layer: ช่องกรอกมาจาก param_template ของ process type */
export function ProcessSteps({ steps, lookups, onChange }: Props) {
    const { units, processTypes } = lookups;
    const categories = [...new Set(processTypes.map((t) => t.category ?? "other"))];

    // step_order = ลำดับใน array เสมอ
    const commit = (next: DraftProcessStep[]) => onChange(next.map((s, i) => ({ ...s, step_order: i + 1 })));
    const setStep = (index: number, patch: Partial<DraftProcessStep>) =>
        commit(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    const move = (index: number, by: number) => {
        const next = [...steps];
        [next[index], next[index + by]] = [next[index + by], next[index]];
        commit(next);
    };

    const setParam = (index: number, name: string, defaultUnit: string | null, patch: Partial<DraftProcessParam>) => {
        const step = steps[index];
        const exists = step.params.some((p) => p.param === name);
        const params = exists
            ? step.params.map((p) => (p.param === name ? { ...p, ...patch } : p))
            : [...step.params, { param: name, qualifier: "=", unit: defaultUnit, ...patch }];
        setStep(index, { params });
    };

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="m-0 text-[16px] font-semibold">ขั้นตอน (Process)</h3>
                <button
                    type="button"
                    onClick={() => commit([...steps, { step_order: steps.length + 1, scope: "layer", params: [] }])}
                    className="min-h-10 px-3.5 border border-[#D4D4D4] rounded-[10px] bg-white text-[14px] cursor-pointer hover:bg-[#F5F5F5]"
                >
                    + เพิ่มขั้นตอน
                </button>
            </div>

            {steps.length === 0 && (
                <div className="text-[14px] text-[#6B6B6B] border border-dashed border-[#D4D4D4] rounded-[10px] px-4 py-3">
                    ยังไม่มีขั้นตอน
                </div>
            )}

            {steps.map((step, i) => {
                const type = processTypes.find((t) => t.process_type_id === step.process_type_id);
                const template = type?.param_template.params ?? [];
                // param ตาม template ก่อน แล้วต่อด้วย param อื่นที่มีอยู่แล้ว (เช่นมาจาก Excel import)
                const rows = [
                    ...template.map((t) => ({ name: t.param, defaultUnit: t.unit })),
                    ...step.params
                        .filter((p) => !template.some((t) => t.param === p.param))
                        .map((p) => ({ name: p.param, defaultUnit: p.unit ?? null })),
                ];

                return (
                    <div key={i} className="flex flex-col gap-3 border border-[#ECECEC] rounded-[10px] px-4 py-3">
                        <div className="flex flex-wrap gap-3 items-center">
                            <span className="w-6 h-6 rounded-full bg-[#F0F0F0] inline-flex items-center justify-center text-[12px]">{i + 1}</span>
                            <select
                                aria-label={`ประเภทขั้นตอนที่ ${i + 1}`}
                                value={step.process_type_id ?? ""}
                                onChange={(e) => {
                                    const next = processTypes.find((t) => t.process_type_id === Number(e.target.value));
                                    // เปลี่ยนประเภท -> ช่องกรอกเปลี่ยนตาม template ใหม่ ค่าเดิมไม่ใช้แล้ว
                                    setStep(i, { process_type_id: next?.process_type_id ?? null, process_type_code: next?.code ?? null, params: [] });
                                }}
                                className={`${fieldClass} font-semibold min-w-[170px]`}
                            >
                                <option value="">เลือกประเภท…</option>
                                {categories.map((c) => (
                                    <optgroup key={c} label={c}>
                                        {processTypes.filter((t) => (t.category ?? "other") === c).map((t) => (
                                            <option key={t.process_type_id} value={t.process_type_id}>{humanize(t.code)}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <input
                                aria-label={`หมายเหตุขั้นตอนที่ ${i + 1}`}
                                placeholder="หมายเหตุ (ถ้ามี)"
                                value={step.description ?? ""}
                                onChange={(e) => setStep(i, { description: e.target.value || null })}
                                className={`${fieldClass} flex-[1_1_180px] min-w-0`}
                            />
                            <span className="flex">
                                <button type="button" aria-label="เลื่อนขึ้น" disabled={i === 0} onClick={() => move(i, -1)} className={`${iconBtn} hover:bg-[#F0F0F0]`}>
                                    <IconArrowUp size={16} />
                                </button>
                                <button type="button" aria-label="เลื่อนลง" disabled={i === steps.length - 1} onClick={() => move(i, 1)} className={`${iconBtn} hover:bg-[#F0F0F0]`}>
                                    <IconArrowDown size={16} />
                                </button>
                                <button
                                    type="button"
                                    aria-label={`ลบขั้นตอนที่ ${i + 1}`}
                                    onClick={() => commit(steps.filter((_, j) => j !== i))}
                                    className={`${iconBtn} text-[#B23B3B] hover:bg-[#FBEAEA]`}
                                >
                                    <IconTrash size={16} />
                                </button>
                            </span>
                        </div>

                        {rows.length > 0 && (
                            <div className="flex flex-wrap gap-x-5 gap-y-2 items-center pl-9">
                                {rows.map(({ name, defaultUnit }) => {
                                    const p = step.params.find((x) => x.param === name);
                                    const unit = p?.unit ?? defaultUnit;
                                    const quantity = units.find((u) => u.unit_code === unit)?.quantity;
                                    const choices = unitsOfQuantity(units, quantity);
                                    const base = p ? baseValueText(units, p) : null;
                                    return (
                                        <label key={name} className="flex items-center gap-1.5 text-[13px]">
                                            {humanize(name)}
                                            <NumInput
                                                allowRange
                                                value={{ value: p?.value ?? null, min: p?.value_min ?? null, max: p?.value_max ?? null }}
                                                onChange={(r) => setParam(i, name, defaultUnit, { value: r.value, value_min: r.min, value_max: r.max })}
                                                placeholder="—"
                                                className="w-20"
                                            />
                                            {choices.length > 1 ? (
                                                <UnitSelect
                                                    aria-label={`หน่วย ${humanize(name)}`}
                                                    value={unit}
                                                    units={choices}
                                                    onChange={(u) => setParam(i, name, defaultUnit, { unit: u })}
                                                />
                                            ) : (
                                                <span>{unit}</span>
                                            )}
                                            {base && <span className="font-mono text-[12px] text-[#6B6B6B]">{base}</span>}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            <p className="m-0 text-[13px] leading-5 text-[#6B6B6B]">
                ช่องกรอกมาจาก template ของ process type แต่ละแบบ (ค่าแบบ &quot;4000, 30&quot; ในช่องเดียวจึงเกิดไม่ได้) ·
                ช่องตัวเลขรับช่วงได้ เช่น 100-150 · ช่องที่เว้นว่างจะไม่ถูกส่ง
            </p>
        </div>
    );
}
