import React, { useId, useState } from "react";
import { Material, Unit } from "@/utils/interface/lookup.types";
import { Range, formatRange, parseRange } from "./stack";

// ช่องกรอกที่ใช้ซ้ำในหน้า Device stack

export const fieldClass = "h-9 px-2 border border-[#949494] rounded-lg text-[14px] bg-white";

/**
 * ช่องตัวเลข (allowRange: รับ "400-450" ได้)
 * เก็บข้อความที่พิมพ์ไว้เอง ส่งค่าออกเมื่อ parse ได้ เช่นพิมพ์ "400-" ค้างไว้ยังไม่ส่ง
 */
export function NumInput({ value, onChange, allowRange = false, className = "", ...rest }: {
    value: Range;
    onChange: (r: Range) => void;
    allowRange?: boolean;
    className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
    const external = formatRange(value);
    const [text, setText] = useState(external);
    const [prevExternal, setPrevExternal] = useState(external);

    // ค่าเปลี่ยนจากข้างนอก (เช่นเปลี่ยน layer / หน่วย) -> แสดงค่าใหม่ ยกเว้นเป็นค่าเดียวกับที่พิมพ์อยู่ ("4.0" = 4)
    if (external !== prevExternal) {
        setPrevExternal(external);
        const typed = parseRange(text, allowRange);
        if (!typed || formatRange(typed) !== external) setText(external);
    }

    const invalid = parseRange(text, allowRange) === undefined;

    return (
        <input
            {...rest}
            inputMode="decimal"
            value={text}
            aria-invalid={invalid}
            onChange={(e) => {
                setText(e.target.value);
                const parsed = parseRange(e.target.value, allowRange);
                if (parsed) onChange(parsed);
            }}
            className={`${fieldClass} ${invalid ? "border-[#B23B3B]" : ""} ${className}`}
        />
    );
}

/**
 * ชื่อวัสดุ: พิมพ์แล้วเลือกจาก dictionary (datalist)
 * ชื่อตรงกับ dictionary -> ได้ material_id, ไม่ตรง -> เก็บชื่อที่พิมพ์ไว้และเตือน
 */
export function MaterialInput({ materialId, materialName, materials, onChange, className = "", ...rest }: {
    materialId?: number | null;
    materialName?: string | null;
    materials: Material[];
    onChange: (v: { material_id: number | null; material_name: string | null }) => void;
    className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
    const listId = useId();
    const shown = materialName ?? materials.find((m) => m.material_id === materialId)?.name ?? "";
    const unknown = shown.trim() !== "" && !materialId;

    return (
        <div className="flex flex-col gap-1 min-w-0">
            <input
                {...rest}
                list={listId}
                value={shown}
                aria-invalid={unknown}
                onChange={(e) => {
                    const text = e.target.value;
                    const found = materials.find((m) => m.name.toLowerCase() === text.trim().toLowerCase());
                    onChange({ material_id: found?.material_id ?? null, material_name: found ? found.name : text || null });
                }}
                className={`${fieldClass} font-mono ${unknown ? "border-[#C9821A] bg-[#FFFBF3]" : ""} ${className}`}
            />
            <datalist id={listId}>
                {materials.map((m) => <option key={m.material_id} value={m.name}>{m.category ?? ""}</option>)}
            </datalist>
            {unknown && <span className="text-[12px] text-[#9A450C]">ไม่พบใน dictionary · ต้องเพิ่มวัสดุนี้ในฐานข้อมูลก่อนส่ง</span>}
        </div>
    );
}

/** เลือกหน่วย (ส่ง units ที่กรองแล้ว เช่นเฉพาะ quantity เดียวกัน) */
export function UnitSelect({ value, units, onChange, grouped = false, ...rest }: {
    value?: string | null;
    units: Unit[];
    onChange: (unit: string | null) => void;
    grouped?: boolean; // แยก optgroup ตาม quantity
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">) {
    const quantities = [...new Set(units.map((u) => u.quantity))];
    const options = (list: Unit[]) => list.map((u) => <option key={u.unit_code} value={u.unit_code}>{u.unit_code}</option>);

    return (
        <select {...rest} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={fieldClass}>
            <option value="">-</option>
            {grouped
                ? quantities.map((q) => (
                    <optgroup key={q} label={q}>{options(units.filter((u) => u.quantity === q))}</optgroup>
                ))
                : options(units)}
        </select>
    );
}
