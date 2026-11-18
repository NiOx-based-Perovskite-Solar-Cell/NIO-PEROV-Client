import React from "react";
import { IconTrash } from "@tabler/icons-react";
import { DraftLayer, LayerRole } from "@/utils/interface/entryDraft.types";
import { Lookups } from "@/utils/interface/lookup.types";
import { IngredientsSection } from "./IngredientsSection";
import { PerovskiteMaterial } from "./PerovskiteMaterial";
import { ProcessSteps } from "./ProcessSteps";
import { MaterialInput, NumInput, UnitSelect, fieldClass } from "./inputs";
import { ROLE_LABEL, mapRange, unitsOfQuantity } from "./stack";

interface Props {
    layer: DraftLayer;
    lookups: Lookups;
    onChange: (patch: Partial<DraftLayer>) => void;
    onRemove: () => void;
}

export function LayerDetail({ layer, lookups, onChange, onRemove }: Props) {
    const material = lookups.materials.find((m) => m.material_id === layer.material_id);
    const lengthUnits = unitsOfQuantity(lookups.units, "length").filter((u) => u.unit_code !== "mm");

    // thickness เก็บเป็น nm (จำนวนเต็ม) แต่กรอกในหน่วยที่เลือกได้
    const thicknessUnit = layer.thickness_unit ?? "nm";
    const factor = lookups.units.find((u) => u.unit_code === thicknessUnit)?.to_si_factor ?? 1;
    const thicknessNm = { value: layer.thickness_nm ?? null, min: layer.thickness_min_nm ?? null, max: layer.thickness_max_nm ?? null };

    return (
        <section aria-label="รายละเอียด layer" className="flex-[999_1_420px] min-w-0 bg-white border border-[#ECECEC] rounded-xl p-7 flex flex-col gap-6">
            <div className="flex flex-wrap gap-3 items-start justify-between">
                <div className="flex flex-col gap-0.5">
                    <div className="font-mono text-[12px] text-[#6B6B6B]">
                        LAYER {layer.position}{layer.sub_order ? `.${layer.sub_order}` : ""} · role = {layer.role ?? "-"}
                    </div>
                    <h2 className="m-0 text-[26px] leading-[34px] font-semibold" style={{ fontFamily: "Lora, serif" }}>
                        {material?.name ?? layer.material_name ?? (layer.role ? ROLE_LABEL[layer.role] : "Layer")}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    className="min-h-10 px-3.5 inline-flex items-center gap-1.5 border border-[#D4D4D4] rounded-[10px] bg-white text-[14px] text-[#B23B3B] hover:bg-[#FBEAEA] cursor-pointer"
                >
                    <IconTrash size={16} /> ลบ layer
                </button>
            </div>

            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="layer-role" className="text-[13px] font-semibold">Role</label>
                    <select
                        id="layer-role"
                        value={layer.role ?? ""}
                        onChange={(e) => onChange({ role: (e.target.value || null) as LayerRole | null })}
                        className={`${fieldClass} h-11 rounded-[10px]`}
                    >
                        <option value="">-</option>
                        {(Object.keys(ROLE_LABEL) as LayerRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="layer-thickness" className="text-[13px] font-semibold">Thickness</label>
                    <div className="flex gap-2">
                        <NumInput
                            id="layer-thickness"
                            allowRange
                            disabled={layer.thickness_unreported}
                            placeholder="450 หรือ 400-450"
                            value={mapRange(thicknessNm, (nm) => nm / factor)}
                            onChange={(r) => {
                                const nm = mapRange(r, (v) => Math.round(v * factor));
                                onChange({ thickness_nm: nm.value, thickness_min_nm: nm.min, thickness_max_nm: nm.max });
                            }}
                            className="flex-auto min-w-0 h-11 rounded-[10px] disabled:bg-[#F5F5F5]"
                        />
                        <UnitSelect
                            aria-label="หน่วย thickness"
                            value={thicknessUnit}
                            units={lengthUnits}
                            onChange={(u) => onChange({ thickness_unit: u ?? "nm" })}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-[13px] text-[#4A4A4A]">
                        <input
                            type="checkbox"
                            checked={layer.thickness_unreported ?? false}
                            onChange={(e) => onChange(e.target.checked
                                ? { thickness_unreported: true, thickness_nm: null, thickness_min_nm: null, thickness_max_nm: null }
                                : { thickness_unreported: false })}
                            className="w-[18px] h-[18px]"
                        />
                        paper ไม่ได้รายงาน
                    </label>
                </div>

                <div className="flex flex-col gap-1.5 col-span-full">
                    {layer.role === "psk" ? (
                        <PerovskiteMaterial layer={layer} materials={lookups.materials} onChange={onChange} />
                    ) : (
                        <>
                            <label htmlFor="layer-material" className="text-[13px] font-semibold">วัสดุ (ค้นจาก dictionary)</label>
                            <MaterialInput
                                id="layer-material"
                                materialId={layer.material_id}
                                materialName={layer.material_name}
                                materials={lookups.materials}
                                onChange={(v) => onChange({ ...v, composition: null, composition_manual: false })}
                                className="h-11 rounded-[10px] text-[15px]"
                            />
                        </>
                    )}
                </div>
            </div>

            <IngredientsSection layer={layer} lookups={lookups} onChange={onChange} />
            <ProcessSteps steps={layer.process_steps} lookups={lookups} onChange={(process_steps) => onChange({ process_steps })} />
        </section>
    );
}
