import React from "react";
import { DraftSample } from "@/utils/interface/entryDraft.types";

export const sampleTitle = (s: DraftSample, i: number) =>
    `Sample ${i + 1}${s.label ? ` · ${s.label}` : ""}${s.is_control ? " · Control" : ""}`;

interface SampleTabsProps {
    samples: DraftSample[];
    activeKey: string;
    onSelect: (key: string) => void;
    badge: (s: DraftSample) => string; // ข้อความเล็กท้ายแท็บ เช่น "8 layers"
}

/** แท็บเลือก sample ในขั้นที่กรอกทีละ sample (Device stack, Results) */
export function SampleTabs({ samples, activeKey, onSelect, badge }: SampleTabsProps) {
    return (
        <div role="tablist" aria-label="เลือก sample" className="self-start flex flex-wrap gap-1 bg-[#EFEFEF] p-1 rounded-[10px]">
            {samples.map((s, i) => {
                const active = s.key === activeKey;
                return (
                    <button
                        key={s.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onSelect(s.key)}
                        className={`min-h-10 px-4 rounded-lg text-[14px] cursor-pointer ${active ? "bg-white font-semibold" : "text-[#4A4A4A]"}`}
                    >
                        {sampleTitle(s, i)}
                        <span className="ml-1.5 text-[12px] text-[#6B6B6B] font-normal">{badge(s)}</span>
                    </button>
                );
            })}
        </div>
    );
}
