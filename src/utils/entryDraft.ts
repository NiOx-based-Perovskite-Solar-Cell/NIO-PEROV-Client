import { useEffect, useState } from "react";
import { DraftLayer, DraftSample, EntryDraft } from "@/utils/interface/entryDraft.types";
import { PaperDetail } from "@/utils/interface/paper.types";
import { getDevice, getPaperDetail } from "@/utils/api/paper";

// เก็บข้อมูลที่กรอกค้างไว้ใน localStorage: รีเฟรช / ปิดแท็บแล้วไม่หาย
// หมดอายุเมื่อไม่ได้แก้ไขเกิน 3 ชั่วโมง (นับจากแก้ล่าสุด)
const PREFIX = "nio-perov:entry-draft:";
export const DRAFT_TTL_MS = 3 * 60 * 60 * 1000;

// key ของ draft: "new" = paper ใหม่, ไม่งั้นเป็น paper_id ที่กำลังแก้
export const NEW_DRAFT_KEY = "new";

let keySeq = 0;
export const newSampleKey = () => `s-${Date.now().toString(36)}-${keySeq++}`;

export const emptySample = (): DraftSample => ({
    key: newSampleKey(),
    label: "",
    is_control: false,
    layers: [],
    measurements: [],
    stability_tests: [],
});

export const emptyDraft = (paperId: string | null = null): EntryDraft => ({
    version: 1,
    paper_id: paperId,
    paper: { doi: "", title: "", journal: "", year: "" },
    architecture: null,
    samples: [emptySample()],
    updated_at: new Date().toISOString(),
});

export const draftExpiresAt = (draft: EntryDraft) =>
    new Date(Date.parse(draft.updated_at) + DRAFT_TTL_MS);

const isExpired = (draft: EntryDraft) => draftExpiresAt(draft).getTime() <= Date.now();

// localStorage อาจใช้ไม่ได้ (private mode, ถูกบล็อก) - ทุกจุดจึงห่อ try/catch แล้วทำงานต่อแบบไม่เก็บ
export function loadDraft(key: string): EntryDraft | null {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        if (!raw) return null;
        const draft = JSON.parse(raw) as EntryDraft;
        if (draft.version !== 1 || isExpired(draft)) {
            localStorage.removeItem(PREFIX + key);
            return null;
        }
        return draft;
    } catch {
        return null;
    }
}

function saveDraft(key: string, draft: EntryDraft) {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(draft));
    } catch {
        // เต็ม / ถูกบล็อก - ข้อมูลยังอยู่ในหน้าจอ แค่รีเฟรชแล้วจะหาย
    }
}

export function clearDraft(key: string) {
    try {
        localStorage.removeItem(PREFIX + key);
    } catch {
        // ไม่มีอะไรต้องทำ
    }
}

// draft ที่ยังไม่หมดอายุทั้งหมด (ลบอันที่หมดอายุทิ้งไปด้วย)
export function listDrafts(): { key: string; draft: EntryDraft }[] {
    const result: { key: string; draft: EntryDraft }[] = [];
    try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
        for (const fullKey of keys) {
            const key = fullKey.slice(PREFIX.length);
            const draft = loadDraft(key);
            if (draft) result.push({ key, draft });
        }
    } catch {
        // ใช้ localStorage ไม่ได้
    }
    return result;
}

/**
 * draft ของ 1 paper: อ่านจาก localStorage ตอนเปิดหน้า และเขียนกลับทุกครั้งที่แก้
 * ใช้ในหน้าที่ render ฝั่ง client เท่านั้น (dynamic import ssr: false)
 *
 * restored = เปิดหน้ามาแล้วเจอข้อมูลที่กรอกค้างไว้
 * fallback = draft เริ่มต้นถ้ายังไม่มีในเครื่อง (ไม่ใส่ = draft เป็น null จนกว่าจะ replace)
 */
export function useEntryDraft(key: string, fallback?: () => EntryDraft) {
    const [initial] = useState(() => loadDraft(key));
    const [draft, setDraft] = useState<EntryDraft | null>(() => initial ?? fallback?.() ?? null);
    const [restored, setRestored] = useState(initial !== null);
    // เก็บลงเครื่องเฉพาะเมื่อผู้ใช้แก้จริง - ฟอร์มว่าง / ค่าที่โหลดจาก server ไม่นับเป็นข้อมูลค้าง
    const [dirty, setDirty] = useState(initial !== null);

    useEffect(() => {
        if (draft && dirty) saveDraft(key, draft);
    }, [key, draft, dirty]);

    // แก้ draft (ต่ออายุ 3 ชั่วโมงทุกครั้ง)
    const update = (fn: (prev: EntryDraft) => EntryDraft) => {
        setDirty(true);
        setDraft((prev) => (prev ? { ...fn(prev), updated_at: new Date().toISOString() } : prev));
    };

    // ตั้งค่าใหม่ทั้งก้อน เช่น โหลดจาก server หรือหลังล้างค่า -> ยังไม่ได้แก้ จึงลบออกจากเครื่อง
    const replace = (next: EntryDraft | null) => {
        clearDraft(key);
        setDirty(false);
        setDraft(next);
        setRestored(false);
    };

    return { draft, update, replace, restored };
}

// ค่าจาก server (numeric ของ postgres อาจมาเป็น string)
const num = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : Number(v));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerRow = Record<string, any>;

// layer จาก GET /device/:id -> DraftLayer (ตัด id ของฐานข้อมูลออก, ย้าย solvent ขึ้นมาไว้ที่ layer)
function layerFromServer(layer: ServerRow): DraftLayer {
    const ingredients: ServerRow[] = layer.ingredients ?? [];
    const withSolvent = ingredients.find((i) => i.solvent_components?.length);
    return {
        position: layer.position,
        sub_order: layer.sub_order ?? 0,
        role: layer.role,
        material_id: layer.material_id,
        material_name: layer.material_name,
        thickness_nm: num(layer.thickness_nm),
        thickness_min_nm: num(layer.thickness_min_nm),
        thickness_max_nm: num(layer.thickness_max_nm),
        solvent: withSolvent
            ? {
                basis: withSolvent.solvent_basis ?? "v/v",
                components: withSolvent.solvent_components.map((c: ServerRow) => ({
                    material_id: c.material_id,
                    material_name: c.name,
                    ratio: num(c.fraction),
                })),
            }
            : null,
        ingredients: ingredients.map((i) => ({
            material_id: i.material_id,
            material_name: i.material_name,
            role: i.role,
            amount: num(i.amount),
            unit: i.unit,
        })),
        process_steps: (layer.process_steps ?? []).map((st: ServerRow) => ({
            step_order: st.step_order,
            process_type_id: st.process_type_id,
            process_type_code: st.process_type_code,
            scope: st.scope,
            description: st.description,
            params: (st.params ?? []).map((pp: ServerRow) => ({
                param: pp.param,
                value: num(pp.value),
                value_min: num(pp.value_min),
                value_max: num(pp.value_max),
                qualifier: pp.qualifier,
                unit: pp.unit,
            })),
        })),
    };
}

/**
 * สร้าง draft จาก paper ที่อยู่ในฐานข้อมูลแล้ว (หน้าแก้ไข) - ดึงทุก sample แบบเต็ม
 * คืน null ถ้าโหลดไม่สำเร็จ
 */
export async function fetchDraftFromServer(paperId: string): Promise<EntryDraft | null> {
    const res = await getPaperDetail(paperId);
    if (!res?.success) return null;
    const paper: PaperDetail = res.data;

    const devices = await Promise.all(paper.samples.map((s) => getDevice(s.sample_id)));
    if (devices.some((d) => !d?.success)) return null;

    return {
        version: 1,
        paper_id: paper.paper_id,
        paper: {
            doi: paper.doi ?? "",
            title: paper.title ?? "",
            journal: paper.journal ?? "",
            year: paper.year ? String(paper.year) : "",
        },
        architecture: paper.samples[0]?.architecture ?? null,
        samples: devices.map(({ data }) => ({
            key: newSampleKey(),
            sample_id: data.sample_id,
            label: data.label ?? "",
            is_control: data.is_control,
            layers: (data.layers ?? []).map(layerFromServer),
            measurements: (data.measurements ?? []).map((m: ServerRow) => ({
                property_id: m.property_id,
                property_code: m.property_code,
                statistic: m.statistic,
                scan: m.scan ?? "NA",
                value: num(m.value),
                error: num(m.error),
                unit: m.unit,
            })),
            stability_tests: (data.stability_tests ?? []).map((t: ServerRow) => ({
                atmosphere: t.atmosphere,
                light: t.light,
                mode: t.mode,
                isos_code: t.isos_code,
                encapsulated: t.encapsulated,
                temperature_c: num(t.temperature_c),
                rh_pct: num(t.rh_pct),
                rh_min_pct: num(t.rh_min_pct),
                rh_max_pct: num(t.rh_max_pct),
                duration_h: num(t.duration_h),
                retention_pct: num(t.retention_pct),
                t80_h: num(t.t80_h),
            })),
        })),
        updated_at: new Date().toISOString(),
    };
}

/**
 * draft ของหน้ากรอกข้อมูลแต่ละขั้น (paperId ไม่มี = paper ใหม่)
 * - paper ใหม่: ไม่มี draft ในเครื่อง -> เริ่มจากฟอร์มว่าง
 * - แก้ paper เดิม: ไม่มี draft ในเครื่อง -> โหลดจากฐานข้อมูล
 * clear() = ล้างค่าที่กรอก (paper ใหม่กลับเป็นฟอร์มว่าง, paper เดิมกลับเป็นค่าในฐานข้อมูล)
 */
export function useEntryDraftPage(paperId?: string) {
    const key = paperId ?? NEW_DRAFT_KEY;
    const { draft, update, replace, restored } = useEntryDraft(key, paperId ? undefined : () => emptyDraft());
    const [loadError, setLoadError] = useState(false);

    const loadFromServer = (id: string) =>
        fetchDraftFromServer(id).then((fromServer) => {
            if (fromServer) replace(fromServer);
            else setLoadError(true);
        });

    useEffect(() => {
        if (paperId && !draft) loadFromServer(paperId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paperId]);

    const clear = async () => {
        if (paperId) {
            replace(null);
            await loadFromServer(paperId);
        } else {
            replace(emptyDraft());
        }
    };

    return { draft, update, clear, restored, loadError, basePath: `/dashboard/raw-data/${paperId ?? "new"}` };
}
