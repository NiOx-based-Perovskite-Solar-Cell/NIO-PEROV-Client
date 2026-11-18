import { DraftLayer, DraftMeasurement, DraftStabilityTest } from "./entryDraft.types";
export type PaperStatus = "draft" | "review" | "published";
export type PaperSourceType = "excel" | "manual";

// แถวจาก GET /paper (paper + ค่าที่ server คำนวณให้)
export interface PaperListItem {
    paper_id: string;
    doi: string | null;
    journal: string | null;
    year: number | null;
    title: string | null;
    source: string[];
    created_by: string | null;
    created_at: string;
    updated_at: string;
    sample_count: number;
    source_type: PaperSourceType;
    status: PaperStatus;
    total_count: string;
}

export interface SearchPaperParams {
    doi?: string;
    keyword?: string;
    source_type?: PaperSourceType;
    status?: PaperStatus;
    sort_by?: string;
    sort_order?: "ASC" | "DESC";
    limit?: number;
    offset?: number;
}

// GET /paper/summary
export interface PaperSummary {
    papers: number;
    samples: number;
    by_status: Record<PaperStatus, number>;
}

export type Architecture = "pin" | "nip";

// sample ใน GET /paper-detail/:id (device summary)
export interface PaperDetailSample {
    sample_id: string;
    sample_no: number | null;
    label: string | null;
    architecture: Architecture | null;
    is_control: boolean;
    layer_count: number;
}

// GET /paper-detail/:id
export interface PaperDetail {
    paper_id: string;
    doi: string | null;
    title: string | null;
    journal: string | null;
    year: number | null;
    source: string[];
    updated_at: string;
    samples: PaperDetailSample[];
}

export type SubmitLayer = Omit<DraftLayer, "thickness_unit" | "thickness_unreported" | "composition_manual" | "solvent"> & {
    solvent?: { basis: "v/v" | "w/w"; components: { material_id: number; ratio: number }[] } | null;
};

// POST /paper-detail, PUT /paper-detail/:id - ส่งข้อมูลทั้งก้อนทีเดียวจากขั้น Review
// layer: material_id หรือ (perovskite ใหม่) material_name + composition, solvent ใช้ ratio
export interface SavePaperEntryBody {
    paper: {
        doi: string;
        title?: string | null;
        journal?: string | null;
        year?: number | null;
    };
    architecture?: Architecture | null;
    samples: {
        sample_id?: string;
        label?: string | null;
        is_control?: boolean;
        layers?: SubmitLayer[];
        measurements?: DraftMeasurement[];
        stability_tests?: DraftStabilityTest[];
    }[];
}
