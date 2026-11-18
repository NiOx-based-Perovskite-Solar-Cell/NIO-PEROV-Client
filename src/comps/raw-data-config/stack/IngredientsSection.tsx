import React from "react";
import { IconTrash, IconX } from "@tabler/icons-react";
import { DraftIngredient, DraftLayer, DraftSolvent } from "@/utils/interface/entryDraft.types";
import { Lookups } from "@/utils/interface/lookup.types";
import { MaterialInput, NumInput, UnitSelect, fieldClass } from "./inputs";
import { AMOUNT_QUANTITIES, INGREDIENT_ROLES } from "./stack";

const th = "px-3.5 py-2.5 text-[12px] font-semibold";
const td = "px-3.5 py-2 align-top";
const smallBtn = "min-h-10 px-3.5 border border-[#D4D4D4] rounded-[10px] bg-white text-[14px] cursor-pointer hover:bg-[#F5F5F5]";

interface Props {
    layer: DraftLayer;
    lookups: Lookups;
    onChange: (patch: Partial<DraftLayer>) => void;
}

/** สารตั้งต้นของ layer + ตัวทำละลาย */
export function IngredientsSection({ layer, lookups, onChange }: Props) {
    const amountUnits = lookups.units.filter((u) => AMOUNT_QUANTITIES.includes(u.quantity));
    const solventMaterials = lookups.materials.filter((m) => m.category === "solvent");

    const setIngredient = (index: number, patch: Partial<DraftIngredient>) =>
        onChange({ ingredients: layer.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)) });

    const solvent: DraftSolvent = layer.solvent ?? { basis: "v/v", components: [] };
    const setSolvent = (patch: Partial<DraftSolvent>) => {
        const next = { ...solvent, ...patch };
        onChange({ solvent: next.components.length ? next : null });
    };
    const setComponent = (index: number, patch: Partial<DraftSolvent["components"][number]>) =>
        setSolvent({ components: solvent.components.map((c, i) => (i === index ? { ...c, ...patch } : c)) });

    // สัดส่วนที่จะเก็บจริง (รวม = 1)
    const ratioSum = solvent.components.reduce((sum, c) => sum + (c.ratio ?? 0), 0);
    const fractions = ratioSum > 0 && solvent.components.every((c) => c.ratio != null)
        ? solvent.components.map((c) => `${c.material_name ?? "?"} ${((c.ratio ?? 0) / ratioSum).toFixed(2)}`).join(" + ")
        : null;

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="m-0 text-[16px] font-semibold">สารตั้งต้น (Materials)</h3>
                <button
                    type="button"
                    onClick={() => onChange({ ingredients: [...layer.ingredients, { role: "precursor" }] })}
                    className={smallBtn}
                >
                    + เพิ่มสาร
                </button>
            </div>

            {layer.ingredients.length > 0 ? (
                <div className="overflow-x-auto border border-[#ECECEC] rounded-[10px]">
                    <table className="w-full min-w-[600px] border-collapse text-[14px]">
                        <thead>
                            <tr className="bg-[#FAFAFA] text-left text-[#6B6B6B]">
                                <th className={th}>สาร</th>
                                <th className={th}>Role</th>
                                <th className={th}>Amount</th>
                                <th className={th}>Unit</th>
                                <th className={th}><span className="sr-only">ลบ</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {layer.ingredients.map((ing, i) => (
                                <tr key={i} className="border-t border-[#F0F0F0]">
                                    <td className={td}>
                                        <MaterialInput
                                            aria-label={`สารที่ ${i + 1}`}
                                            materialId={ing.material_id}
                                            materialName={ing.material_name}
                                            materials={lookups.materials}
                                            onChange={(v) => setIngredient(i, v)}
                                            className="w-full min-w-[160px]"
                                        />
                                    </td>
                                    <td className={td}>
                                        <select
                                            aria-label={`role ของสารที่ ${i + 1}`}
                                            value={ing.role ?? ""}
                                            onChange={(e) => setIngredient(i, { role: e.target.value || null })}
                                            className={fieldClass}
                                        >
                                            <option value="">-</option>
                                            {INGREDIENT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </td>
                                    <td className={td}>
                                        <NumInput
                                            aria-label={`ปริมาณสารที่ ${i + 1}`}
                                            value={{ value: ing.amount ?? null, min: null, max: null }}
                                            onChange={(r) => setIngredient(i, { amount: r.value })}
                                            className="w-24 font-mono"
                                        />
                                    </td>
                                    <td className={td}>
                                        <UnitSelect
                                            aria-label={`หน่วยของสารที่ ${i + 1}`}
                                            value={ing.unit}
                                            units={amountUnits}
                                            grouped
                                            onChange={(unit) => setIngredient(i, { unit })}
                                        />
                                    </td>
                                    <td className={`${td} text-right`}>
                                        <button
                                            type="button"
                                            aria-label={`ลบสารที่ ${i + 1}`}
                                            onClick={() => onChange({ ingredients: layer.ingredients.filter((_, j) => j !== i) })}
                                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#B23B3B] hover:bg-[#FBEAEA] cursor-pointer"
                                        >
                                            <IconTrash size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-[14px] text-[#6B6B6B] border border-dashed border-[#D4D4D4] rounded-[10px] px-4 py-3">
                    ยังไม่มีสาร · layer ที่ทำจากวัสดุสำเร็จรูป (เช่น FTO, Ag) ไม่ต้องใส่
                </div>
            )}

            {/* Solvent */}
            <div className="flex flex-wrap gap-2.5 items-center bg-[#FAFAFA] border border-[#ECECEC] rounded-[10px] px-4 py-3 text-[14px]">
                <b>Solvent</b>
                {solvent.components.map((c, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <span>:</span>}
                        <span className="inline-flex items-start gap-1">
                            <MaterialInput
                                aria-label={`ตัวทำละลายที่ ${i + 1}`}
                                materialId={c.material_id}
                                materialName={c.material_name}
                                materials={solventMaterials}
                                onChange={(v) => setComponent(i, v)}
                                className="w-28"
                            />
                            <NumInput
                                aria-label={`สัดส่วนตัวทำละลายที่ ${i + 1}`}
                                value={{ value: c.ratio ?? null, min: null, max: null }}
                                onChange={(r) => setComponent(i, { ratio: r.value })}
                                className="w-14 text-center"
                            />
                            <button
                                type="button"
                                aria-label={`ลบตัวทำละลายที่ ${i + 1}`}
                                onClick={() => setSolvent({ components: solvent.components.filter((_, j) => j !== i) })}
                                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#6B6B6B] hover:bg-[#EFEFEF] cursor-pointer"
                            >
                                <IconX size={14} />
                            </button>
                        </span>
                    </React.Fragment>
                ))}
                {solvent.components.length > 0 && (
                    <select
                        aria-label="หน่วยสัดส่วนตัวทำละลาย"
                        value={solvent.basis}
                        onChange={(e) => setSolvent({ basis: e.target.value as DraftSolvent["basis"] })}
                        className={fieldClass}
                    >
                        <option value="v/v">v/v</option>
                        <option value="w/w">w/w</option>
                    </select>
                )}
                <button
                    type="button"
                    onClick={() => setSolvent({ components: [...solvent.components, { ratio: 1 }] })}
                    className="min-h-9 px-3 border border-[#D4D4D4] rounded-lg bg-white text-[14px] cursor-pointer hover:bg-[#F5F5F5]"
                >
                    + ตัวทำละลาย
                </button>
                {solvent.components.length === 0 && <span className="text-[#6B6B6B]">ไม่มี</span>}
                {fractions && <span className="text-[#6B6B6B]">→ เก็บเป็น {fractions}</span>}
            </div>
        </div>
    );
}
