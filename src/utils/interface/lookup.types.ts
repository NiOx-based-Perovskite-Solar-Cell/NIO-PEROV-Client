// ข้อมูล seed (dictionary) จากฐานข้อมูล ใช้เป็นตัวเลือกในฟอร์มกรอกข้อมูล

export interface Unit {
    unit_code: string;
    quantity: string; // เช่น length, time - หน่วยที่ quantity เดียวกันแปลงกันได้
    to_si_factor: number; // ค่า x factor + offset = ค่าในหน่วยหลักของ quantity
    to_si_offset: number;
}

export interface Material {
    material_id: number;
    name: string;
    category: string | null;
    formula: string | null;
    is_perovskite: boolean;
}

export interface ParamTemplateItem {
    param: string;
    unit: string; // หน่วยเริ่มต้น
}

export interface ProcessType {
    process_type_id: number;
    code: string;
    category: string | null;
    param_template: { params?: ParamTemplateItem[] };
}

export interface CompositionRow {
    material_id: number;
    site: "A" | "B" | "X";
    ion: string;
    fraction: number;
}

export interface Property {
    property_id: number;
    code: string; // เช่น PCE, Voc
    unit: string | null; // หน่วยมาตรฐานของ property
    valid_min: number | null; // ช่วงค่าที่เป็นไปได้ ไว้เตือนตอนกรอก
    valid_max: number | null;
}

export interface Lookups {
    units: Unit[];
    properties: Property[];
    materials: Material[];
    processTypes: ProcessType[];
}

export interface ResolvedComposition {
    composition: Omit<CompositionRow, "material_id">[] | null; // null = แยกสูตรไม่ได้
    sums: Record<"A" | "B" | "X", number> | null;
    material: { material_id: number; name: string } | null; // null = ยังไม่มีวัสดุที่ composition นี้
}
