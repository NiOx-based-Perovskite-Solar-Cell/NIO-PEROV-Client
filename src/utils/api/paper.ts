import { fetchDataApi } from "@/utils/callAPI"
import { SavePaperEntryBody, SearchPaperParams } from "@/utils/interface/paper.types"


// GET /paper - ค้นหา paper (keyword = DOI, journal, title, ชื่อวัสดุ)
export const searchPapers = async (params: SearchPaperParams) => {
    const data = await fetchDataApi(`GET`, "paper", { ...params });
    return data;
};


// GET /paper/summary - จำนวน papers, samples และจำนวน paper แยกตามสถานะ
export const getPaperSummary = async () => {
    const data = await fetchDataApi(`GET`, "paper/summary", {});
    return data;
};


// GET /paper-detail/:id - paper พร้อม samples ทั้งหมด
export const getPaperDetail = async (id: string) => {
    const data = await fetchDataApi(`GET`, `paper-detail/${id}`, {});
    return data;
};


// POST /paper-detail - สร้าง paper พร้อม samples, stack, ผลวัด (transaction เดียว)
export const createPaperEntry = async (body: SavePaperEntryBody) => {
    const data = await fetchDataApi(`POST`, "paper-detail", body);
    return data;
};


// PUT /paper-detail/:id - แก้ paper และแทนที่ stack / ผลวัดของทุก sample ที่ส่งไป
export const updatePaperEntry = async (id: string, body: SavePaperEntryBody) => {
    const data = await fetchDataApi(`PUT`, `paper-detail/${id}`, body);
    return data;
};


// ดึง title / journal / year จาก Crossref (public API, ส่งแค่ DOI)
export const fetchCrossref = async (doi: string) => {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!res.ok) return null;
    const { message } = await res.json();
    return {
        title: (message.title?.[0] as string | undefined) ?? null,
        journal: (message["container-title"]?.[0] as string | undefined) ?? null,
        year: (message.issued?.["date-parts"]?.[0]?.[0] as number | undefined) ?? null,
    };
};


// GET /device/:sample_id - sample พร้อม layers (ingredients, process steps), measurements, stability tests
export const getDevice = async (sampleId: string) => {
    const data = await fetchDataApi(`GET`, `device/${sampleId}`, {});
    return data;
};
