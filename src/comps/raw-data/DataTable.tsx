import React, { useMemo } from "react";
import { NIO_PEROV_COLORS } from "@/comps/layouts/NioPerovLogo";

function formatCell(value: unknown) {
    if (value === undefined || value === null || value === "") return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

interface DataTableProps {
    rows: Record<string, unknown>[];
}

export function DataTable({ rows }: DataTableProps) {
    const columns = useMemo(() => {
        const set = new Set<string>();
        rows.forEach((row) => Object.keys(row).forEach((key) => set.add(key)));
        return Array.from(set);
    }, [rows]);

    if (rows.length === 0) {
        return (
            <p className="text-[13px] py-8 text-center" style={{ color: NIO_PEROV_COLORS.muted }}>
                No data
            </p>
        );
    }

    return (
        <div className="overflow-x-auto border rounded-md" style={{ borderColor: NIO_PEROV_COLORS.border }}>
            <table className="min-w-full text-[13px]">
                <thead>
                    <tr style={{ backgroundColor: NIO_PEROV_COLORS.fieldBg }}>
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="text-left px-3 py-2 font-medium whitespace-nowrap"
                                style={{ color: NIO_PEROV_COLORS.ink }}
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: NIO_PEROV_COLORS.border }}>
                            {columns.map((col) => (
                                <td key={col} className="px-3 py-2 whitespace-nowrap" style={{ color: NIO_PEROV_COLORS.ink }}>
                                    {formatCell(row[col])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
