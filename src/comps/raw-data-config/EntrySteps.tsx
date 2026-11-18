import React from "react";

// ขั้นตอนกรอกข้อมูล 1 paper (หน้า 07-10 ใน design)
const STEPS = ["Paper", "Samples", "Device stack", "Results", "Stability", "Review"];

interface EntryStepsProps {
    // ขั้นที่ทำอยู่ (index ใน STEPS) - หน้า Paper & samples ทำขั้น 0 และ 1 พร้อมกัน
    current: number[];
}

export function EntrySteps({ current }: EntryStepsProps) {
    return (
        <ol aria-label="ขั้นตอน" className="flex flex-wrap gap-2 list-none m-0 p-0">
            {STEPS.map((label, i) => {
                const active = current.includes(i);
                return (
                    <li
                        key={label}
                        aria-current={active ? "step" : undefined}
                        className={`inline-flex items-center gap-2 min-h-10 pl-1.5 pr-3.5 rounded-full text-[14px] ${active ? "bg-[#1F1F1F] text-white font-semibold" : "bg-white border border-[#E3E3E3] text-[#4A4A4A]"}`}
                    >
                        <span
                            className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-[13px] ${active ? "bg-white text-[#1F1F1F]" : "bg-[#F0F0F0]"}`}
                        >
                            {i + 1}
                        </span>
                        {label}
                    </li>
                );
            })}
        </ol>
    );
}
