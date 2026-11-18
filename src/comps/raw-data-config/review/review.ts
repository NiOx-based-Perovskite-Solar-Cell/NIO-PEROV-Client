import { normalizeDoi } from "@/utils/doi";
import { DraftLayer, DraftSample, EntryDraft } from "@/utils/interface/entryDraft.types";
import { Lookups } from "@/utils/interface/lookup.types";
import { SavePaperEntryBody, SubmitLayer } from "@/utils/interface/paper.types";
import { JV_CODES, PCE_TOLERANCE_PCT, outOfRange, pceChecks } from "../results/JvTable";
import { ROLE_LABEL, formatRange, isEmptyLayer, layerSignature, renumber } from "../stack/stack";

// ---------- draft -> body ที่ส่งไป server ----------

const hasValue = (v: unknown) => v !== null && v !== undefined && v !== "";

/** layer ที่จะส่ง: ตัด layer ว่าง / แถวว่าง / ช่องที่ใช้แสดงผลอย่างเดียวออก แล้วนับ position ใหม่ */
export const submittedLayers = (s: DraftSample) => renumber(s.layers.filter((l) => !isEmptyLayer(l)));

function toSubmitLayer(l: DraftLayer): SubmitLayer {
    const newPerovskite = l.role === "psk" && !l.material_id;
    const solvent = l.solvent?.components
        .filter((c) => c.material_id && c.ratio != null && c.ratio > 0)
        .map((c) => ({ material_id: c.material_id!, ratio: c.ratio! }));
    return {
        position: l.position,
        sub_order: l.sub_order ?? 0,
        role: l.role ?? null,
        material_id: l.material_id ?? null,
        material_name: l.material_id ? null : l.material_name ?? null,
        composition: newPerovskite ? l.composition ?? null : null,
        thickness_nm: l.thickness_nm ?? null,
        thickness_min_nm: l.thickness_min_nm ?? null,
        thickness_max_nm: l.thickness_max_nm ?? null,
        solvent: solvent?.length ? { basis: l.solvent!.basis, components: solvent } : null,
        ingredients: l.ingredients
            .filter((i) => i.material_id || i.amount != null)
            .map((i) => ({ material_id: i.material_id ?? null, role: i.role ?? null, amount: i.amount ?? null, unit: i.unit ?? null })),
        process_steps: l.process_steps
            .filter((st) => st.process_type_id)
            .map((st, k) => ({
                step_order: k + 1,
                process_type_id: st.process_type_id,
                scope: st.scope ?? "layer",
                description: st.description ?? null,
                params: st.params
                    .filter((p) => p.value != null || p.value_min != null || p.value_max != null)
                    .map((p) => ({
                        param: p.param,
                        value: p.value ?? null,
                        value_min: p.value_min ?? null,
                        value_max: p.value_max ?? null,
                        qualifier: p.qualifier || "=",
                        unit: p.unit ?? null,
                    })),
            })),
    };
}

export function buildSubmitBody(draft: EntryDraft): SavePaperEntryBody {
    const year = parseInt(draft.paper.year, 10);
    return {
        paper: {
            doi: normalizeDoi(draft.paper.doi),
            title: draft.paper.title.trim() || null,
            journal: draft.paper.journal.trim() || null,
            year: Number.isFinite(year) ? year : null,
        },
        architecture: draft.architecture,
        samples: draft.samples.map((s) => ({
            sample_id: s.sample_id,
            label: s.label.trim() || null,
            is_control: s.is_control,
            layers: submittedLayers(s).map(toSubmitLayer),
            measurements: s.measurements
                .filter((m) => m.property_id && (m.value != null || m.error != null))
                .map((m) => ({
                    property_id: m.property_id,
                    statistic: m.statistic ?? null,
                    scan: m.scan ?? "NA",
                    value: m.value ?? null,
                    error: m.error ?? null,
                    unit: m.unit ?? null,
                })),
            stability_tests: s.stability_tests.filter((t) => Object.values(t).some(hasValue)),
        })),
    };
}

// ---------- QC ----------

export type Step = "" | "stack" | "results"; // หน้าที่ต้องไปแก้ ("" = Paper & samples)

export interface Issue {
    id: string; // ใช้จำว่ายืนยัน warning ข้อไหนแล้ว
    level: "error" | "warning";
    title: string;
    detail?: string;
    step: Step;
}

const SITE_SUM = { A: 1, B: 1, X: 3 } as const;

/**
 * error = ส่งไม่ได้ (เช่นวัสดุไม่อยู่ใน dictionary)
 * warning = ส่งได้หลังยืนยันว่า paper ไม่ได้รายงาน / ค่าถูกแล้ว
 */
export function reviewDraft(draft: EntryDraft, lookups: Lookups): Issue[] {
    const issues: Issue[] = [];
    const add = (issue: Issue) => issues.push(issue);

    if (!normalizeDoi(draft.paper.doi).startsWith("10.")) {
        add({ id: "doi", level: "error", title: "DOI ไม่ถูกต้อง", detail: "DOI ต้องขึ้นต้นด้วย 10.", step: "" });
    }
    if (draft.samples.length === 0) {
        add({ id: "samples", level: "error", title: "ยังไม่มี sample", step: "" });
    }

    draft.samples.forEach((s, si) => {
        const who = `Sample ${si + 1}${s.label ? ` · ${s.label}` : ""}`;
        const id = (key: string) => `${s.key}:${key}`;
        const layers = submittedLayers(s);

        // ----- stack -----
        if (layers.length === 0) {
            add({ id: id("no-layers"), level: "warning", title: `${who} · ยังไม่มี layer`, detail: "ยืนยันว่าจะส่งโดยไม่มี device stack", step: "stack" });
        } else if (!layers.some((l) => l.role === "psk")) {
            add({ id: id("no-psk"), level: "warning", title: `${who} · ไม่มี layer PSK`, step: "stack" });
        }

        layers.forEach((l) => {
            const name = `${l.role ? ROLE_LABEL[l.role] : "Layer"} ${l.position}${l.sub_order ? `.${l.sub_order}` : ""}`;
            const where = `${who} · ${name}`;
            const lid = (key: string) => id(`L${l.position}.${l.sub_order}:${key}`);

            if (l.role === "psk" && !l.material_id) {
                const ions = l.composition ?? [];
                if (!ions.length) {
                    if (l.material_name) {
                        add({ id: lid("psk"), level: "error", title: `${where} · "${l.material_name}" แยกเป็นสูตรไม่ได้`, detail: "กรอกไอออนเอง หรือเลือกวัสดุจาก dictionary", step: "stack" });
                    }
                } else if (ions.some((r) => !r.ion.trim() || r.fraction == null)) {
                    add({ id: lid("ions"), level: "error", title: `${where} · กรอกไอออนไม่ครบ`, step: "stack" });
                } else {
                    const bad = (["A", "B", "X"] as const).filter((site) =>
                        Math.abs(ions.filter((r) => r.site === site).reduce((sum, r) => sum + (r.fraction ?? 0), 0) - SITE_SUM[site]) >= 0.005);
                    if (bad.length) {
                        add({ id: lid("sum"), level: "warning", title: `${where} · ผลรวมสัดส่วนไอออนไม่ได้ ABX3`, detail: `site ${bad.join(", ")} รวมไม่ได้ตามที่ควร (A = 1, B = 1, X = 3)`, step: "stack" });
                    }
                    if (!l.material_name?.trim()) {
                        add({ id: lid("psk-name"), level: "error", title: `${where} · ใส่ชื่อวัสดุ perovskite ใหม่`, step: "stack" });
                    }
                }
            } else if (l.material_name && !l.material_id) {
                add({ id: lid("material"), level: "error", title: `${where} · วัสดุ "${l.material_name}" ไม่อยู่ใน dictionary`, detail: "เลือกจากรายการ หรือเพิ่มวัสดุในฐานข้อมูลก่อน", step: "stack" });
            }
            if (!l.material_id && !l.material_name) {
                add({ id: lid("no-material"), level: "warning", title: `${where} · ไม่ระบุวัสดุ`, step: "stack" });
            }
            if (l.role === "psk" && !l.thickness_unreported && l.thickness_nm == null && l.thickness_min_nm == null) {
                add({ id: lid("thickness"), level: "warning", title: `${where} · ไม่ระบุ thickness`, detail: "ยืนยันว่า paper ไม่ได้รายงาน (หรือติ๊ก \"paper ไม่ได้รายงาน\" ในหน้า stack)", step: "stack" });
            }
            if (l.ingredients.some((i) => i.material_name && !i.material_id)) {
                add({ id: lid("ingredient"), level: "error", title: `${where} · มีสารที่ไม่อยู่ใน dictionary`, step: "stack" });
            }
            if (l.ingredients.some((i) => !i.material_id && i.amount != null)) {
                add({ id: lid("ingredient-empty"), level: "error", title: `${where} · มีแถวสารที่ใส่ปริมาณแต่ไม่ระบุสาร`, step: "stack" });
            }
            if (l.solvent?.components.some((c) => !c.material_id || c.ratio == null || c.ratio <= 0)) {
                add({ id: lid("solvent"), level: "error", title: `${where} · ตัวทำละลายไม่ครบ`, detail: "ทุกตัวต้องเลือกจาก dictionary และมีสัดส่วนมากกว่า 0", step: "stack" });
            }
            if (l.process_steps.some((st) => !st.process_type_id)) {
                add({ id: lid("step"), level: "error", title: `${where} · มีขั้นตอนที่ยังไม่เลือกประเภท`, step: "stack" });
            }
        });

        // ----- results -----
        if (s.measurements.some((m) => !m.property_id && (m.value != null || m.error != null))) {
            add({ id: id("no-property"), level: "error", title: `${who} · มีค่าที่ยังไม่เลือก property`, step: "results" });
        }
        const missing = JV_CODES.filter((code) => {
            const p = lookups.properties.find((x) => x.code === code);
            return !s.measurements.some((m) => m.property_id === p?.property_id && m.value != null);
        });
        if (missing.length) {
            add({ id: id("jv"), level: "warning", title: `${who} · ไม่มีค่า ${missing.join(", ")}`, detail: "ยืนยันว่า paper ไม่ได้รายงาน", step: "results" });
        }
        for (const c of pceChecks(s.measurements, lookups.properties)) {
            if (c.diff > PCE_TOLERANCE_PCT) {
                add({ id: id(`pce-${c.scan}`), level: "warning", title: `${who} · PCE ${c.scan} ไม่ตรงกับ Voc × Jsc × FF`, detail: `คำนวณได้ ${c.calc.toFixed(2)} % ต่างจากที่กรอก ${c.diff.toFixed(1)} %`, step: "results" });
            }
        }
        const outside = s.measurements.filter((m) => outOfRange(lookups.properties.find((p) => p.property_id === m.property_id), m.value));
        if (outside.length) {
            const codes = outside.map((m) => lookups.properties.find((p) => p.property_id === m.property_id)?.code).join(", ");
            add({ id: id("range"), level: "warning", title: `${who} · ค่าเกินช่วงที่เป็นไปได้: ${codes}`, step: "results" });
        }
    });

    return issues;
}

// ---------- ความต่างระหว่าง sample ----------

const materialName = (l: DraftLayer, lookups: Lookups) =>
    l.material_name ?? lookups.materials.find((m) => m.material_id === l.material_id)?.name ?? "?";

function describeLayer(l: DraftLayer | undefined, lookups: Lookups) {
    if (!l) return "—";
    const thickness = formatRange({ value: l.thickness_nm ?? null, min: l.thickness_min_nm ?? null, max: l.thickness_max_nm ?? null });
    const ingredients = l.ingredients
        .map((i) => [i.material_name ?? lookups.materials.find((m) => m.material_id === i.material_id)?.name, i.amount != null ? `${i.amount} ${i.unit ?? ""}` : ""].filter(Boolean).join(" "))
        .filter(Boolean)
        .join(", ");
    const steps = l.process_steps.map((st) => lookups.processTypes.find((t) => t.process_type_id === st.process_type_id)?.code.toLowerCase().replace(/_/g, " ")).filter(Boolean).join(" → ");
    return [materialName(l, lookups) + (thickness ? ` ${thickness} nm` : ""), ingredients, steps].filter(Boolean).join(" · ");
}

export interface DiffRow {
    field: string;
    cells: string[]; // 1 ช่องต่อ sample
    differs: boolean[]; // ช่องที่ต่างจาก sample แรก (control ถ้ามี)
}

/** แถวที่ sample ต่างกัน: layer ที่ไม่เหมือนกัน + PCE champion + retention */
export function sampleDiff(draft: EntryDraft, lookups: Lookups): DiffRow[] {
    const samples = draft.samples.map(submittedLayers);
    const baseIndex = Math.max(0, draft.samples.findIndex((s) => s.is_control));
    const rows: DiffRow[] = [];

    // จับคู่ layer ด้วย role + sub_order (position เลื่อนได้เมื่อ sample หนึ่งมี treatment อีกอันไม่มี)
    const slots = new Map<string, { order: number; sub: number; role: DraftLayer["role"] }>();
    samples.flat().forEach((l) => {
        const key = `${l.role}.${l.sub_order ?? 0}`;
        const order = l.position + (l.sub_order ?? 0) / 100;
        const prev = slots.get(key);
        if (!prev || order < prev.order) slots.set(key, { order, sub: l.sub_order ?? 0, role: l.role });
    });

    [...slots.values()].sort((a, b) => a.order - b.order).forEach(({ sub, role }) => {
        const layers = samples.map((ls) => ls.find((l) => l.role === role && (l.sub_order ?? 0) === sub));
        const sigs = layers.map(layerSignature);
        if (sigs.every((x) => x === sigs[0])) return;
        rows.push({
            field: `${role ? ROLE_LABEL[role] : "Layer"}${sub ? ` (${sub + 1})` : ""}`,
            cells: layers.map((l) => describeLayer(l, lookups)),
            differs: sigs.map((x) => x !== sigs[baseIndex]),
        });
    });

    const pce = lookups.properties.find((p) => p.code === "PCE");
    const pceText = draft.samples.map((s) => {
        const pick = (stat: string, scan: string) => s.measurements.find((m) => m.property_id === pce?.property_id && m.statistic === stat && m.scan === scan)?.value;
        const v = pick("champion", "RS") ?? pick("champion", "FS") ?? pick("average", "NA");
        return v == null ? "—" : `${v} %`;
    });
    rows.push({ field: "PCE champion", cells: pceText, differs: pceText.map((x) => x !== pceText[baseIndex]) });

    const retention = draft.samples.map((s) => {
        const t = s.stability_tests.find((x) => x.retention_pct != null);
        if (!t) return "—";
        const cond = [t.duration_h != null ? `${t.duration_h} h` : null, t.mode].filter(Boolean).join(", ");
        return `${t.retention_pct} %${cond ? ` (${cond})` : ""}`;
    });
    rows.push({ field: "Retention", cells: retention, differs: retention.map((x) => x !== retention[baseIndex]) });

    return rows;
}

/** perovskite ใหม่ที่จะสร้างตอนส่ง (ยังไม่มี material ที่ composition ตรงกัน) */
export function newPerovskites(draft: EntryDraft) {
    const found = new Map<string, { name: string; ions: string; samples: number[] }>();
    draft.samples.forEach((s, si) => {
        submittedLayers(s)
            .filter((l) => l.role === "psk" && !l.material_id && l.composition?.length && l.material_name)
            .forEach((l) => {
                const name = l.material_name!.trim();
                const entry = found.get(name.toLowerCase()) ?? {
                    name,
                    ions: (["A", "B", "X"] as const)
                        .map((site) => `${site}: ${l.composition!.filter((r) => r.site === site).map((r) => `${r.ion} ${r.fraction}`).join(" · ")}`)
                        .join("  "),
                    samples: [],
                };
                if (!entry.samples.includes(si + 1)) entry.samples.push(si + 1);
                found.set(name.toLowerCase(), entry);
            });
    });
    return [...found.values()];
}
