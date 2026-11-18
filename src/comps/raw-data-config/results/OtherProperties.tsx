import React from "react";
import { IconTrash } from "@tabler/icons-react";
import { DraftMeasurement } from "@/utils/interface/entryDraft.types";
import { Property, Unit } from "@/utils/interface/lookup.types";
import { NumInput, UnitSelect, fieldClass } from "../stack/inputs";
import { unitsOfQuantity } from "../stack/stack";
import { isJvCell, outOfRange } from "./JvTable";

interface Props {
    measurements: DraftMeasurement[];
    properties: Property[];
    units: Unit[];
    onChange: (measurements: DraftMeasurement[]) => void;
}

/** measurement ที่ไม่อยู่ในตาราง J-V เช่น VTFL, trap density, bandgap */
export function OtherProperties({ measurements, properties, units, onChange }: Props) {
    // เก็บ index ใน measurements ทั้งหมด จะได้แก้ถูกแถว
    const rows = measurements
        .map((m, index) => ({ m, index }))
        .filter(({ m }) => !isJvCell(m, properties));

    const setRow = (index: number, patch: Partial<DraftMeasurement>) =>
        onChange(measurements.map((m, i) => (i === index ? { ...m, ...patch } : m)));

    const cell = "px-3 py-1.5";
    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="m-0 text-[16px] font-semibold">Property อื่นๆ</h3>
                <button
                    type="button"
                    // property_id 0 = ยังไม่เลือก
                    onClick={() => onChange([...measurements, { property_id: 0, statistic: "single", scan: "NA" }])}
                    className="min-h-10 px-3.5 border border-[#D4D4D4] rounded-[10px] bg-white text-[14px] cursor-pointer hover:bg-[#F5F5F5]"
                >
                    + เพิ่ม property
                </button>
            </div>

            {rows.length === 0 ? (
                <div className="text-[14px] text-[#6B6B6B] border border-dashed border-[#D4D4D4] rounded-[10px] px-4 py-3">
                    ไม่มี · เช่น VTFL, trap density, bandgap, TRPL lifetime
                </div>
            ) : (
                <div className="overflow-x-auto border border-[#ECECEC] rounded-[10px]">
                    <table className="w-full min-w-[680px] border-collapse text-[14px]">
                        <thead>
                            <tr className="bg-[#FAFAFA] text-left text-[#6B6B6B] text-[12px]">
                                <th className={cell}>Property</th>
                                <th className={cell}>Statistic</th>
                                <th className={cell}>Scan</th>
                                <th className={cell}>Value</th>
                                <th className={cell}>±</th>
                                <th className={cell}>Unit</th>
                                <th className={cell}><span className="sr-only">ลบ</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(({ m, index }, n) => {
                                const p = properties.find((x) => x.property_id === m.property_id);
                                const quantity = units.find((u) => u.unit_code === p?.unit)?.quantity;
                                const unitChoices = unitsOfQuantity(units, quantity);
                                const bad = outOfRange(p, m.value);
                                return (
                                    <tr key={index} className="border-t border-[#F0F0F0]">
                                        <td className={cell}>
                                            <select
                                                aria-label={`property แถวที่ ${n + 1}`}
                                                value={m.property_id || ""}
                                                onChange={(e) => {
                                                    const next = properties.find((x) => x.property_id === Number(e.target.value));
                                                    setRow(index, { property_id: next?.property_id ?? 0, property_code: next?.code ?? null, unit: next?.unit ?? null });
                                                }}
                                                className={`${fieldClass} min-w-[160px] ${m.property_id ? "" : "border-[#C9821A]"}`}
                                            >
                                                <option value="">เลือก property…</option>
                                                {properties.map((x) => <option key={x.property_id} value={x.property_id}>{x.code}</option>)}
                                            </select>
                                        </td>
                                        <td className={cell}>
                                            <select aria-label={`statistic แถวที่ ${n + 1}`} value={m.statistic ?? "single"} onChange={(e) => setRow(index, { statistic: e.target.value })} className={fieldClass}>
                                                <option value="single">single</option>
                                                <option value="champion">champion</option>
                                                <option value="average">average</option>
                                            </select>
                                        </td>
                                        <td className={cell}>
                                            <select aria-label={`scan แถวที่ ${n + 1}`} value={m.scan ?? "NA"} onChange={(e) => setRow(index, { scan: e.target.value })} className={fieldClass}>
                                                <option value="NA">-</option>
                                                <option value="RS">RS</option>
                                                <option value="FS">FS</option>
                                            </select>
                                        </td>
                                        <td className={cell}>
                                            <NumInput
                                                aria-label={`ค่าแถวที่ ${n + 1}`}
                                                value={{ value: m.value ?? null, min: null, max: null }}
                                                onChange={(r) => setRow(index, { value: r.value })}
                                                placeholder="เช่น 1.8e15"
                                                title={bad ? `ค่าที่เป็นไปได้ ${p?.valid_min ?? "-∞"} ถึง ${p?.valid_max ?? "∞"}` : undefined}
                                                className={`w-28 font-mono ${bad ? "!border-[#B23B3B] bg-[#FBEAEA]" : ""}`}
                                            />
                                        </td>
                                        <td className={cell}>
                                            <NumInput
                                                aria-label={`ค่าคลาดเคลื่อนแถวที่ ${n + 1}`}
                                                value={{ value: m.error ?? null, min: null, max: null }}
                                                onChange={(r) => setRow(index, { error: r.value })}
                                                className="w-20 font-mono"
                                            />
                                        </td>
                                        <td className={cell}>
                                            {unitChoices.length > 1 ? (
                                                <UnitSelect aria-label={`หน่วยแถวที่ ${n + 1}`} value={m.unit} units={unitChoices} onChange={(u) => setRow(index, { unit: u })} />
                                            ) : (
                                                <span className="text-[#6B6B6B]">{m.unit ?? p?.unit ?? "-"}</span>
                                            )}
                                        </td>
                                        <td className={`${cell} text-right`}>
                                            <button
                                                type="button"
                                                aria-label={`ลบแถวที่ ${n + 1}`}
                                                onClick={() => onChange(measurements.filter((_, i) => i !== index))}
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
                </div>
            )}
        </div>
    );
}
