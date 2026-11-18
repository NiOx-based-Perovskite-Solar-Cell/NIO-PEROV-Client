import React from "react";
import { IconTrash } from "@tabler/icons-react";
import { DraftSample } from "@/utils/interface/entryDraft.types";

interface SamplesTableProps {
    samples: DraftSample[];
    onChange: (key: string, patch: Partial<DraftSample>) => void;
    onRemove: (key: string) => void;
}

const sampleName = (samples: DraftSample[], s: DraftSample) =>
    `Sample ${samples.indexOf(s) + 1}${s.label ? ` · ${s.label}` : ""}`;

export function SamplesTable({ samples, onChange, onRemove }: SamplesTableProps) {
    const th = "px-4 py-3 text-[12px] font-semibold";

    // คัดลอก stack = copy layers ทั้งชุดใน JSON (ไม่ต้องรอบันทึก)
    const copyStack = (target: DraftSample, sourceKey: string) => {
        const source = samples.find((s) => s.key === sourceKey);
        onChange(target.key, {
            copied_from_key: source?.key,
            layers: source ? structuredClone(source.layers) : [],
        });
    };

    return (
        <div className="overflow-x-auto border border-[#ECECEC] rounded-[10px]">
            <table className="w-full min-w-[640px] border-collapse text-[14px]">
                <thead>
                    <tr className="bg-[#FAFAFA] text-left text-[#6B6B6B]">
                        <th className={th}>#</th>
                        <th className={th}>ชื่อ sample</th>
                        <th className={th}>Control</th>
                        <th className={th}>คัดลอก stack จาก</th>
                        <th className={th}>Device stack</th>
                        <th className={th}><span className="sr-only">ลบ</span></th>
                    </tr>
                </thead>
                <tbody>
                    {samples.map((sample, i) => {
                        const others = samples.filter((s) => s.key !== sample.key);
                        return (
                            <tr key={sample.key} className="border-t border-[#F0F0F0]">
                                <td className="px-4 py-3 font-mono">{i + 1}</td>
                                <td className="px-4 py-2">
                                    <input
                                        aria-label={`ชื่อ sample ${i + 1}`}
                                        value={sample.label}
                                        onChange={(e) => onChange(sample.key, { label: e.target.value })}
                                        placeholder="เช่น Control (NiOx)"
                                        className="w-full h-10 px-2.5 border border-[#D4D4D4] rounded-lg text-[14px]"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        aria-label={`sample ${i + 1} เป็น control`}
                                        checked={sample.is_control}
                                        onChange={(e) => onChange(sample.key, { is_control: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <select
                                        aria-label={`sample ${i + 1} คัดลอก stack จาก`}
                                        value={sample.copied_from_key ?? ""}
                                        onChange={(e) => copyStack(sample, e.target.value)}
                                        disabled={others.length === 0}
                                        className="h-10 px-2 border border-[#D4D4D4] rounded-lg text-[14px] bg-white disabled:text-[#6B6B6B]"
                                    >
                                        <option value="">ไม่คัดลอก</option>
                                        {others.map((s) => (
                                            <option key={s.key} value={s.key}>{sampleName(samples, s)}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3 text-[#4A4A4A]">
                                    {sample.layers.length ? `${sample.layers.length} layers` : "ยังไม่มี stack"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {/* sample ที่อยู่ในฐานข้อมูลแล้วลบจากหน้านี้ไม่ได้ */}
                                    {!sample.sample_id && (
                                        <button
                                            type="button"
                                            aria-label={`ลบ sample ${i + 1}`}
                                            onClick={() => onRemove(sample.key)}
                                            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#B23B3B] hover:bg-[#FBEAEA] cursor-pointer"
                                        >
                                            <IconTrash size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
