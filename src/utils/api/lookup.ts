import { fetchDataApi } from "@/utils/callAPI"
import { DraftIon } from "@/utils/interface/entryDraft.types"


// ตาราง dictionary มีไม่กี่ร้อยแถว -> ดึงมาทั้งหมดทีเดียว
const ALL = { limit: 1000 };


// GET /unit - หน่วยทั้งหมด
export const getUnits = async () => {
    const data = await fetchDataApi(`GET`, "unit", { ...ALL, sort_by: "unit_code" });
    return data;
};


// GET /material - วัสดุทั้งหมด
export const getMaterials = async () => {
    const data = await fetchDataApi(`GET`, "material", { ...ALL, sort_by: "name" });
    return data;
};


// GET /process-type - ประเภท process พร้อม param_template
export const getProcessTypes = async () => {
    const data = await fetchDataApi(`GET`, "process-type", { ...ALL, sort_by: "category" });
    return data;
};


// GET /property - property ที่วัดได้ (PCE, Voc, ...) พร้อมหน่วยและช่วงค่าที่เป็นไปได้
export const getProperties = async () => {
    const data = await fetchDataApi(`GET`, "property", { ...ALL, sort_by: "property_id" });
    return data;
};


// GET /perovskite-composition/material/:id - สัดส่วน ion ของ perovskite (A, B, X)
export const getComposition = async (materialId: number) => {
    const data = await fetchDataApi(`GET`, `perovskite-composition/material/${materialId}`, {});
    return data;
};


// POST /perovskite-composition/resolve - แยกสูตรเป็น A/B/X และหาวัสดุที่มี composition เดียวกันอยู่แล้ว
export const resolveComposition = async (body: { formula?: string; composition?: DraftIon[] }) => {
    const data = await fetchDataApi(`POST`, "perovskite-composition/resolve", body);
    return data;
};
