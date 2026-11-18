import { DraftLayer, LayerRole } from "@/utils/interface/entryDraft.types";
import { Architecture } from "@/utils/interface/paper.types";
import { Unit } from "@/utils/interface/lookup.types";

export const ROLE_LABEL: Record<LayerRole, string> = {
    anode: "Anode",
    htl: "HTL",
    htl_treatment: "HTL treatment",
    psk: "PSK",
    psk_treatment: "PSK treatment",
    etl: "ETL",
    etl_treatment: "ETL treatment",
    cathode: "Cathode",
};

// สีพื้นของ layer ในรายการ แยกตามกลุ่ม
export const ROLE_BG: Record<LayerRole, string> = {
    anode: "#F4F4F4",
    cathode: "#F4F4F4",
    htl: "#EFF6F4",
    htl_treatment: "#EFF6F4",
    psk: "#FFF4EA",
    psk_treatment: "#FFF4EA",
    etl: "#F5F2FA",
    etl_treatment: "#F5F2FA",
};

// stack มาตรฐาน เรียงจากล่าง (deposit ก่อน) ขึ้นบน
export const STACK_TEMPLATE: Record<Architecture, LayerRole[]> = {
    pin: ["anode", "htl", "htl_treatment", "psk", "psk_treatment", "etl", "etl_treatment", "cathode"],
    nip: ["cathode", "etl", "etl_treatment", "psk", "psk_treatment", "htl", "htl_treatment", "anode"],
};

// layer_ingredient.role (จาก ingredient_role_alias.csv)
export const INGREDIENT_ROLES = [
    "precursor", "additive", "dopant", "antisolvent", "solution", "sam", "treatment",
    "nanoparticle", "interlayer", "sputter_target", "evaporation", "thin_film", "substrate",
];

// quantity ของหน่วยที่ใช้บอกปริมาณสาร
export const AMOUNT_QUANTITIES = [
    "mass", "amount", "volume", "concentration_molar", "concentration_mass",
    "mole_fraction", "mass_fraction", "volume_fraction", "percent", "ratio",
];

export const emptyLayer = (role: LayerRole | null): DraftLayer => ({
    position: 0,
    sub_order: 0,
    role,
    ingredients: [],
    process_steps: [],
});

/**
 * ตั้ง position / sub_order ตามลำดับใน array (index 0 = ล่างสุด)
 * layer role เดียวกันที่ติดกันนับเป็น position เดียว แยกด้วย sub_order (เหมือน ETL, ETL2 ใน Excel)
 */
export function renumber(layers: DraftLayer[]): DraftLayer[] {
    let position = 0;
    let subOrder = 0;
    return layers.map((layer, i) => {
        if (i > 0 && layer.role && layer.role === layers[i - 1].role) subOrder += 1;
        else { position += 1; subOrder = 0; }
        return { ...layer, position, sub_order: subOrder };
    });
}

/** ดูโครงของ stack ปัจจุบันจากลำดับ HTL กับ ETL (HTL อยู่ล่าง = p-i-n) */
export function stackArchitecture(layers: DraftLayer[]): Architecture | null {
    const htl = layers.findIndex((l) => l.role === "htl");
    const etl = layers.findIndex((l) => l.role === "etl");
    if (htl < 0 || etl < 0) return null;
    return htl < etl ? "pin" : "nip";
}

/**
 * เรียง layer ตาม template ของ architecture โดยเก็บข้อมูลที่กรอกไว้ (จับคู่ด้วย role รวม sub-layer)
 * role ที่ยังไม่มีจะเติม layer ว่างให้ · layer ที่ไม่ระบุ role ต่อไว้บนสุด
 */
export function applyTemplate(arch: Architecture, layers: DraftLayer[] = []): DraftLayer[] {
    const ordered = STACK_TEMPLATE[arch].flatMap((role) => {
        const same = layers.filter((l) => l.role === role);
        return same.length ? same : [emptyLayer(role)];
    });
    return renumber([...ordered, ...layers.filter((l) => !l.role)]);
}

/** layer ที่ยังไม่ได้กรอกอะไรเลย (เช่น treatment ที่ paper ไม่มี) - ไม่ถูกส่งตอน Review */
export const isEmptyLayer = (l: DraftLayer) =>
    !l.material_id && !l.material_name && l.thickness_nm == null && l.thickness_min_nm == null &&
    l.ingredients.length === 0 && l.process_steps.length === 0 && !l.solvent?.components.length;

/** ไว้เทียบว่า layer ต่างจาก sample control หรือไม่ (ไม่สนช่องที่ใช้แสดงผลอย่างเดียว) */
export function layerSignature(l: DraftLayer | undefined) {
    if (!l) return "";
    return JSON.stringify([
        l.role, l.material_id ?? l.material_name ?? null,
        l.material_id ? null : l.composition?.map((c) => [c.site, c.ion, c.fraction]) ?? null,
        l.thickness_nm ?? null, l.thickness_min_nm ?? null, l.thickness_max_nm ?? null,
        l.solvent?.components.map((c) => [c.material_id ?? c.material_name, c.ratio]) ?? null,
        l.ingredients.map((i) => [i.material_id ?? i.material_name, i.role, i.amount, i.unit]),
        l.process_steps.map((s) => [s.process_type_id, s.params.map((p) => [p.param, p.value, p.value_min, p.value_max, p.unit])]),
    ]);
}

// ---------- ค่าตัวเลข / ช่วง ----------

export interface Range {
    value: number | null;
    min: number | null;
    max: number | null;
}

export const EMPTY_RANGE: Range = { value: null, min: null, max: null };

// ตัวเลข 1 ตัว: 450, 4.5, .5, -3, 1.8e15 (เช่น trap density)
const NUM = String.raw`-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?`;
const RANGE_RE = new RegExp(String.raw`^(${NUM})(?:\s*[-–~]\s*(${NUM}))?$`, "i");

/** "450" -> value, "400-450" -> min/max, "1.8e15" -> value, "" -> ว่าง, รูปแบบอื่น -> undefined (ยังพิมพ์ไม่เสร็จ) */
export function parseRange(text: string, allowRange = true): Range | undefined {
    const t = text.trim();
    if (!t) return EMPTY_RANGE;
    const m = t.match(RANGE_RE);
    if (!m) return undefined;
    if (!m[2]) return { value: Number(m[1]), min: null, max: null };
    if (!allowRange) return undefined;
    const [a, b] = [Number(m[1]), Number(m[2])];
    return { value: null, min: Math.min(a, b), max: Math.max(a, b) };
}

// ตัดเศษทศนิยมจากการแปลงหน่วย · ค่าใหญ่ / เล็กมากแสดงแบบ 1.8e15
const fmt = (n: number) => {
    const abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e6 || abs < 1e-4)) return Number(n.toPrecision(10)).toExponential().replace("e+", "e");
    return String(Number(n.toPrecision(10)));
};

export function formatRange(r: Range): string {
    if (r.value != null) return fmt(r.value);
    if (r.min != null && r.max != null) return `${fmt(r.min)}-${fmt(r.max)}`;
    return "";
}

export const mapRange = (r: Range, fn: (n: number) => number): Range => ({
    value: r.value == null ? null : fn(r.value),
    min: r.min == null ? null : fn(r.min),
    max: r.max == null ? null : fn(r.max),
});

// ---------- หน่วย ----------

export const unitsOfQuantity = (units: Unit[], quantity: string | undefined) =>
    units.filter((u) => u.quantity === quantity);

/** หน่วยหลักของ quantity (factor 1, offset 0) เช่น time -> s */
export const baseUnit = (units: Unit[], quantity: string) =>
    units.find((u) => u.quantity === quantity && u.to_si_factor === 1 && u.to_si_offset === 0);

/** "spin_speed" / "SPIN_COAT" -> "Spin speed" / "Spin coat" */
export const humanize = (code: string) => {
    const t = code.toLowerCase().replace(/_/g, " ");
    return t.charAt(0).toUpperCase() + t.slice(1);
};
