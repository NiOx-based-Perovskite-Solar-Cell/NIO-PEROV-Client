import { Architecture } from "./paper.types";

// ข้อมูลที่กรอกทั้งหมดของ 1 paper เก็บเป็น JSON ก้อนเดียวในเครื่อง แล้วส่งไปหลังบ้านทีเดียวตอน Review
// field ของ layer / measurement / stability ตรงกับ CreateDeviceDto ฝั่ง server
// (field ที่ server ไม่รู้จัก เช่น material_name จะถูกตัดทิ้งตอนส่ง)

export interface DraftProcessParam {
    param: string;
    value?: number | null;
    value_min?: number | null;
    value_max?: number | null;
    qualifier?: string;
    unit?: string | null;
}

export interface DraftProcessStep {
    step_order: number;
    process_type_id?: number | null;
    process_type_code?: string | null; // ไว้แสดงผล
    scope?: string | null;
    description?: string | null;
    params: DraftProcessParam[];
}

export interface DraftIngredient {
    material_id?: number | null;
    material_name?: string | null; // ไว้แสดงผล
    role?: string | null;
    solvent_system_id?: number | null;
    amount?: number | null;
    unit?: string | null;
}

export interface DraftSolventComponent {
    material_id?: number | null;
    material_name?: string | null;
    ratio?: number | null; // สัดส่วนที่กรอก เช่น DMF 4 : DMSO 1 (ตอนส่งแปลงเป็น fraction รวม = 1)
}

// ตัวทำละลายของ layer - ฐานข้อมูลเก็บเป็น solvent_system แล้วผูกกับ ingredient ของ layer นั้น
export interface DraftSolvent {
    basis: "v/v" | "w/w";
    components: DraftSolventComponent[];
}

// ไอออน 1 ตัวของ perovskite (A = cation, B = metal, X = halide) -> perovskite_composition
export interface DraftIon {
    site: "A" | "B" | "X";
    ion: string;
    fraction: number | null;
}

export type LayerRole =
    | "anode" | "htl" | "htl_treatment" | "psk" | "psk_treatment"
    | "etl" | "etl_treatment" | "cathode";

export interface DraftLayer {
    position: number; // ล่างสุด = 1 (คำนวณจากลำดับใน array)
    sub_order?: number; // layer role เดียวกันที่ซ้อนกัน เช่น ETL ชั้นที่ 2
    role?: LayerRole | null;
    material_id?: number | null;
    material_name?: string | null; // ไว้แสดงผล / ชื่อที่พิมพ์แต่ยังไม่เจอใน dictionary
    // layer PSK: สัดส่วนไอออนของสูตร - material_id ว่าง = ยังไม่มีวัสดุนี้ จะสร้างพร้อม composition ตอนส่ง
    composition?: DraftIon[] | null;
    composition_manual?: boolean; // กรอกไอออนเอง (ชื่อแยกเป็นสูตรไม่ได้ เช่น "CsFAMA")
    thickness_nm?: number | null;
    thickness_min_nm?: number | null;
    thickness_max_nm?: number | null;
    thickness_unit?: string; // หน่วยที่ใช้กรอก (เก็บจริงเป็น nm)
    thickness_unreported?: boolean; // paper ไม่ได้รายงาน
    solvent?: DraftSolvent | null;
    ingredients: DraftIngredient[];
    process_steps: DraftProcessStep[];
}

export interface DraftMeasurement {
    property_id: number;
    property_code?: string | null; // ไว้แสดงผล
    statistic?: string | null;
    scan?: string;
    value?: number | null;
    error?: number | null;
    unit?: string | null;
}

export interface DraftStabilityTest {
    atmosphere?: string | null;
    light?: string | null;
    mode?: string | null;
    isos_code?: string | null;
    encapsulated?: boolean | null;
    temperature_c?: number | null;
    rh_pct?: number | null;
    rh_min_pct?: number | null;
    rh_max_pct?: number | null;
    duration_h?: number | null;
    retention_pct?: number | null;
    t80_h?: number | null;
}

export interface DraftSample {
    key: string; // id ในหน้าบ้าน (sample ใหม่ยังไม่มี sample_id)
    sample_id?: string; // มี = sample ที่อยู่ในฐานข้อมูลแล้ว
    label: string;
    is_control: boolean;
    copied_from_key?: string; // คัดลอก stack มาจาก sample ไหน (ไว้แสดงผล)
    layers: DraftLayer[];
    measurements: DraftMeasurement[];
    stability_tests: DraftStabilityTest[];
}

export interface EntryDraft {
    version: 1;
    paper_id: string | null; // null = paper ใหม่
    paper: {
        doi: string;
        title: string;
        journal: string;
        year: string;
    };
    architecture: Architecture | null;
    samples: DraftSample[];
    updated_at: string; // ISO - หมดอายุหลังจากนี้ DRAFT_TTL_MS
}
