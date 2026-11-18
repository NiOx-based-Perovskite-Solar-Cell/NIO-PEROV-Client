import { DraftStabilityTest } from "@/utils/interface/entryDraft.types";

// ค่าที่ใช้ได้ = ค่าเดียวกับที่ pipeline import Excel ใช้ (stability_keyword.csv) เพื่อให้ค้น / เทียบข้ามกันได้
export const ATMOSPHERES = [
    { value: "air", label: "Ambient air" },
    { value: "N2", label: "N2 / glove box" },
    { value: "humidity_box", label: "Humidity box" },
    { value: "desiccator", label: "Desiccator" },
];
export const LIGHTS = [
    { value: "1-sun", label: "1-sun (AM1.5G)" },
    { value: "dark", label: "Dark" },
    { value: "LED", label: "LED" },
    { value: "outdoor", label: "Outdoor" },
];
export const MODES = [
    { value: "MPPT", label: "MPP tracking" },
    { value: "light_soaking", label: "Light soaking" },
    { value: "storage", label: "Shelf storage" },
    { value: "thermal", label: "Thermal" },
];

// กฎเดียวกับ stability_keyword.csv (priority ต่ำชนะ = ลำดับใน array)
const RULES: { field: "atmosphere" | "light" | "mode"; pattern: RegExp; value: string }[] = [
    { field: "atmosphere", pattern: /\bN2\b|nitrogen|glove ?box/i, value: "N2" },
    { field: "atmosphere", pattern: /humidity box/i, value: "humidity_box" },
    { field: "atmosphere", pattern: /desiccator/i, value: "desiccator" },
    { field: "atmosphere", pattern: /ambient|\bair\b|outdoor/i, value: "air" },
    { field: "light", pattern: /\bdark\b/i, value: "dark" },
    { field: "light", pattern: /\bLED\b/i, value: "LED" },
    { field: "light", pattern: /outdoor/i, value: "outdoor" },
    { field: "light", pattern: /1[- ]?sun|AM ?1\.5|illuminat/i, value: "1-sun" },
    { field: "mode", pattern: /\bMPPT?\b|MPP tracking|operational/i, value: "MPPT" },
    { field: "mode", pattern: /thermal/i, value: "thermal" },
    { field: "mode", pattern: /storage|shelf/i, value: "storage" },
];

/**
 * ข้อความจาก paper -> atmosphere / light / mode / ISOS / อุณหภูมิ / RH
 * (ตรรกะเดียวกับ 03-standardize ของ pipeline) คืนเฉพาะช่องที่อ่านออก
 */
export function parseEnvironment(raw: string): Partial<DraftStabilityTest> {
    const out: Partial<DraftStabilityTest> = {};
    for (const rule of RULES) {
        if (out[rule.field] == null && rule.pattern.test(raw)) out[rule.field] = rule.value;
    }

    const isos = /ISOS\s*-?\s*([DLTO])\s*-?\s*(\d)([A-Za-z]?)/i.exec(raw);
    if (isos) {
        const kind = isos[1].toUpperCase();
        out.isos_code = `ISOS-${kind}-${isos[2]}${isos[3].toUpperCase()}`;
        if (kind === "D") { out.light ??= "dark"; out.mode ??= "storage"; }
        if (kind === "L") { out.light ??= "1-sun"; out.mode ??= "light_soaking"; }
        if (kind === "T") out.mode ??= "thermal";
        if (kind === "O") out.light ??= "outdoor";
    }
    if (out.mode === "MPPT") out.light ??= "1-sun";
    if (out.mode == null && out.atmosphere != null && out.light == null) out.mode = "storage";

    const temp = /(-?\d+(?:\.\d+)?)\s*°?\s*C\b/.exec(raw);
    if (temp) out.temperature_c = Number(temp[1]);
    const rh = /(\d+(?:\.\d+)?)(?:\s*[-–~]\s*(\d+(?:\.\d+)?))?\s*%\s*RH|RH\s*(?:of|=|:)?\s*(?:~\s*)?(\d+(?:\.\d+)?)(?:\s*[-–~]\s*(\d+(?:\.\d+)?))?\s*%/i.exec(raw);
    if (rh) {
        const [a, b] = rh[1] ? [rh[1], rh[2]] : [rh[3], rh[4]];
        if (b) { out.rh_min_pct = Number(a); out.rh_max_pct = Number(b); out.rh_pct = null; }
        else out.rh_pct = Number(a);
    }
    return out;
}

/**
 * เสนอ ISOS code จากเงื่อนไขที่กรอก (ISOS consensus, Khenkin et al. 2020)
 * D = dark storage, L = light soaking, T = thermal cycling, O = outdoor
 * ระดับ 1 = ห้อง, 2 = อุณหภูมิสูง (≥ 45 °C), 3 = ความชื้น (D-3: 85 °C / 85 % RH, L-3: มี RH ควบคุม)
 */
export function suggestIsos(t: DraftStabilityTest): string | null {
    const rh = t.rh_pct ?? t.rh_max_pct ?? null;
    const hot = (t.temperature_c ?? 0) >= 45;
    if (t.light === "outdoor") return "ISOS-O-1";
    if (t.mode === "thermal") return "ISOS-T-1";
    if (t.light === "dark" || t.mode === "storage") {
        if ((t.temperature_c ?? 0) >= 85 && (rh ?? 0) >= 85) return "ISOS-D-3";
        return hot ? "ISOS-D-2" : "ISOS-D-1";
    }
    if (t.light === "1-sun" || t.light === "LED" || t.mode === "MPPT" || t.mode === "light_soaking") {
        if ((rh ?? 0) >= 50) return "ISOS-L-3";
        return hot ? "ISOS-L-2" : "ISOS-L-1";
    }
    return null;
}
