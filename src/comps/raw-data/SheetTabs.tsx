import React from "react";
import { NIO_PEROV_COLORS } from "@/comps/layouts/NioPerovLogo";

interface SheetTabsProps {
    sheetNames: string[];
    selectedSheet: string | null;
    onSelect: (name: string) => void;
}

export function SheetTabs({ sheetNames, selectedSheet, onSelect }: SheetTabsProps) {
    return (
        <div className="flex items-center gap-6 mt-5 border-b" style={{ borderColor: NIO_PEROV_COLORS.border }}>
            {sheetNames.map((name) => {
                const isActive = name === selectedSheet;
                return (
                    <button
                        key={name}
                        type="button"
                        onClick={() => onSelect(name)}
                        className="text-[13px] pb-2.5 -mb-px border-b-2 cursor-pointer whitespace-nowrap"
                        style={{
                            color: isActive ? NIO_PEROV_COLORS.ink : NIO_PEROV_COLORS.muted,
                            fontWeight: isActive ? 600 : 400,
                            borderColor: isActive ? NIO_PEROV_COLORS.ink : "transparent",
                        }}
                    >
                        {name}
                    </button>
                );
            })}
        </div>
    );
}
