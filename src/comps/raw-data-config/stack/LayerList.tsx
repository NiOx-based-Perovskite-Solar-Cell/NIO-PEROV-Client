import React from "react";
import { DraftLayer } from "@/utils/interface/entryDraft.types";
import { Material } from "@/utils/interface/lookup.types";
import { ROLE_BG, ROLE_LABEL, formatRange, isEmptyLayer } from "./stack";

interface LayerListProps {
    layers: DraftLayer[]; // index 0 = ล่างสุด
    materials: Material[];
    selected: number;
    diffs: boolean[]; // layer นี้ต่างจาก sample control (index ตรงกับ layers)
    onSelect: (index: number) => void;
    onAddSubLayer: () => void;
}

export function LayerList({ layers, materials, selected, diffs, onSelect, onAddSubLayer }: LayerListProps) {
    const materialName = (l: DraftLayer) =>
        l.material_name ?? materials.find((m) => m.material_id === l.material_id)?.name;

    // แสดงบนสุดก่อน (deposit ทีหลังสุด)
    const order = layers.map((_, i) => i).reverse();

    return (
        <section aria-label="Layer stack" className="flex-[1_1_260px] max-w-[320px] bg-white border border-[#ECECEC] rounded-xl p-5 flex flex-col gap-1.5">
            <h2 className="m-0 mb-0.5 text-[20px] leading-7 font-semibold" style={{ fontFamily: "Lora, serif" }}>Layers</h2>
            <div className="text-[12px] text-[#6B6B6B] pb-1.5">บนสุด = deposit ทีหลังสุด</div>

            {order.map((i) => {
                const l = layers[i];
                const empty = isEmptyLayer(l);
                const active = i === selected;
                const thickness = formatRange({ value: l.thickness_nm ?? null, min: l.thickness_min_nm ?? null, max: l.thickness_max_nm ?? null });
                const label = `${l.role ? ROLE_LABEL[l.role] : "ไม่ระบุ role"}${l.sub_order ? ` (${l.sub_order + 1})` : ""}`;
                return (
                    <button
                        key={i}
                        type="button"
                        aria-current={active || undefined}
                        onClick={() => onSelect(i)}
                        className={`flex items-center justify-between gap-2 px-3 rounded-[10px] text-[14px] text-left cursor-pointer ${active ? "min-h-14 border-2 border-[#E8711C]" : `min-h-11 border ${empty ? "border-dashed border-[#D4D4D4]" : "border-[#E3E3E3]"}`}`}
                        style={{ background: active ? "#FFF4EA" : empty ? "#FFFFFF" : l.role ? ROLE_BG[l.role] : "#FFFFFF" }}
                    >
                        <span className={empty && !active ? "text-[#6B6B6B]" : ""}>
                            <b>{label}</b> · {empty ? "ไม่มี" : materialName(l) ?? "ยังไม่ระบุวัสดุ"}
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                            {diffs[i] && (
                                <span className="px-2 py-px rounded-full bg-[#EEF4FD] text-[#1F55B0] text-[12px] font-semibold">ต่าง</span>
                            )}
                            {thickness && <span className="font-mono text-[12px] text-[#6B6B6B]">{thickness} nm</span>}
                        </span>
                    </button>
                );
            })}

            <button
                type="button"
                onClick={onAddSubLayer}
                disabled={layers.length === 0}
                className="min-h-11 mt-1.5 border border-dashed border-[#2F6FDB] rounded-[10px] bg-white text-[#2F6FDB] text-[14px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
                + เพิ่ม sub-layer
            </button>
            <div className="text-[12px] text-[#6B6B6B]">เพิ่ม layer role เดียวกันซ้อนเหนือ layer ที่เลือก</div>
        </section>
    );
}
