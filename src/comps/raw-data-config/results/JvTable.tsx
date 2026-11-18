import React from "react";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";
import { DraftMeasurement } from "@/utils/interface/entryDraft.types";
import { Property } from "@/utils/interface/lookup.types";
import { NumInput } from "../stack/inputs";

export const JV_CODES = ["Voc", "Jsc", "FF", "PCE"];

// คอลัมน์ของตาราง = (statistic, scan) ใน measurement
const COLUMNS = [
    { label: "Champion · RS", statistic: "champion", scan: "RS" },
    { label: "Champion · FS", statistic: "champion", scan: "FS" },
    { label: "Average", statistic: "average", scan: "NA" },
] as const;

/** measurement นี้แสดงอยู่ในตาราง J-V (ที่เหลือไปอยู่ใน "Property อื่นๆ") */
export const isJvCell = (m: DraftMeasurement, properties: Property[]) => {
    const code = properties.find((p) => p.property_id === m.property_id)?.code;
    return !!code && JV_CODES.includes(code)
        && COLUMNS.some((c) => c.statistic === m.statistic && c.scan === (m.scan ?? "NA"));
};

export const outOfRange = (p: Property | undefined, v: number | null | undefined) =>
    p != null && v != null && ((p.valid_min != null && v < p.valid_min) || (p.valid_max != null && v > p.valid_max));

export const PCE_TOLERANCE_PCT = 3;
const tolerancePct = PCE_TOLERANCE_PCT;

const champion = (measurements: DraftMeasurement[], properties: Property[], code: string, scan: string) => {
    const p = properties.find((x) => x.code === code);
    return p ? measurements.find((m) => m.property_id === p.property_id && m.statistic === "champion" && m.scan === scan)?.value ?? null : null;
};

/** Voc x Jsc x FF / 100 ควรได้ PCE (แสง 100 mW/cm²) - เช็คแยก RS / FS เมื่อกรอกครบ 4 ค่า */
export function pceChecks(measurements: DraftMeasurement[], properties: Property[]) {
    return (["RS", "FS"] as const).flatMap((scan) => {
        const [voc, jsc, ff, pce] = JV_CODES.map((code) => champion(measurements, properties, code, scan));
        if (voc == null || jsc == null || ff == null || pce == null || pce === 0) return [];
        const calc = (voc * jsc * ff) / 100;
        return [{ scan, calc, diff: (Math.abs(calc - pce) / pce) * 100 }];
    });
}

interface Props {
    measurements: DraftMeasurement[];
    properties: Property[];
    onChange: (measurements: DraftMeasurement[]) => void;
}

export function JvTable({ measurements, properties, onChange }: Props) {
    const rows = JV_CODES.map((code) => properties.find((p) => p.code === code)).filter((p): p is Property => !!p);

    const find = (p: Property, statistic: string, scan: string) =>
        measurements.find((m) => m.property_id === p.property_id && m.statistic === statistic && (m.scan ?? "NA") === scan);

    // เพิ่ม / แก้ / ลบ (ว่างทั้ง value และ error = ลบแถวนั้น)
    const setCell = (p: Property, statistic: string, scan: string, patch: Partial<DraftMeasurement>) => {
        const current = find(p, statistic, scan);
        const merged: DraftMeasurement = {
            ...(current ?? { property_id: p.property_id, property_code: p.code, statistic, scan, unit: p.unit }),
            ...patch,
        };
        const rest = measurements.filter((m) => m !== current);
        onChange(merged.value == null && merged.error == null ? rest : [...rest, merged]);
    };

    const checks = pceChecks(measurements, properties);

    const cell = "px-3.5 py-2";
    return (
        <div className="flex flex-col gap-3">
            <div className="overflow-x-auto border border-[#ECECEC] rounded-[10px]">
                <table className="w-full min-w-[640px] border-collapse text-[14px]">
                    <thead>
                        <tr className="bg-[#FAFAFA] text-left text-[#6B6B6B] text-[12px]">
                            <th className={cell}>Property</th>
                            <th className={cell}>Unit</th>
                            {COLUMNS.map((c) => <th key={c.label} className={cell}>{c.label}</th>)}
                            <th className={cell}>± SD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((p) => {
                            const input = (statistic: string, scan: string, field: "value" | "error", label: string) => {
                                const m = find(p, statistic, scan);
                                const v = m?.[field] ?? null;
                                const bad = field === "value" && outOfRange(p, v);
                                return (
                                    <NumInput
                                        aria-label={`${p.code} ${label}`}
                                        value={{ value: v, min: null, max: null }}
                                        onChange={(r) => setCell(p, statistic, scan, { [field]: r.value })}
                                        title={bad ? `ค่าที่เป็นไปได้ ${p.valid_min ?? "-∞"} ถึง ${p.valid_max ?? "∞"}` : undefined}
                                        className={`w-24 font-mono ${bad ? "!border-[#B23B3B] bg-[#FBEAEA]" : ""}`}
                                    />
                                );
                            };
                            return (
                                <tr key={p.property_id} className="border-t border-[#F0F0F0]">
                                    <th scope="row" className={`${cell} text-left font-semibold`}>{p.code}</th>
                                    <td className={`${cell} text-[#6B6B6B]`}>{p.unit}</td>
                                    {COLUMNS.map((c) => <td key={c.label} className={cell}>{input(c.statistic, c.scan, "value", c.label)}</td>)}
                                    <td className={cell}>{input("average", "NA", "error", "SD")}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {checks.map(({ scan, calc, diff }) => {
                const ok = diff <= tolerancePct;
                return (
                    <div
                        key={scan}
                        className={`flex gap-2 items-start rounded-[10px] px-4 py-2.5 text-[14px] ${ok ? "bg-[#EEF7F1] text-[#1E6B3A]" : "bg-[#FFF4EA] text-[#9A450C]"}`}
                    >
                        {ok ? <IconCheck size={18} className="shrink-0 mt-0.5" /> : <IconAlertTriangle size={18} className="shrink-0 mt-0.5" />}
                        <span>
                            {scan}: Voc × Jsc × FF / 100 = <b>{calc.toFixed(2)} %</b> ต่างจาก PCE ที่กรอก {diff.toFixed(1)} %
                            {ok ? ` ซึ่งอยู่ในเกณฑ์ (ไม่เกิน ${tolerancePct} %)` : ` เกินเกณฑ์ ${tolerancePct} % · ตรวจค่าที่กรอกอีกครั้ง`}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
