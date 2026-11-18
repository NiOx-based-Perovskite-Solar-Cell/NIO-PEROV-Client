import React from "react";
import { NIO_PEROV_COLORS } from "@/comps/layouts/NioPerovLogo";
import { RawDataPaper } from "@/utils/interface/rawData.types";

interface PaperSidebarProps {
    papers: RawDataPaper[];
    selectedPaper: string | null;
    onSelect: (paper: RawDataPaper) => void;
}

export function PaperSidebar({ papers, selectedPaper, onSelect }: PaperSidebarProps) {
    return (
        <aside className="w-44 shrink-0">
            <p className="text-[12px] mb-3" style={{ color: NIO_PEROV_COLORS.muted }}>
                Paper Name
            </p>
            <ul className="flex flex-col gap-2.5">
                {papers.map((paper) => {
                    const isActive = paper.paper === selectedPaper;
                    return (
                        <li key={paper.paper}>
                            <button
                                type="button"
                                title={paper.paper}
                                onClick={() => onSelect(paper)}
                                className="block w-full truncate text-[13.5px] text-left cursor-pointer"
                                style={{
                                    color: isActive ? NIO_PEROV_COLORS.ink : NIO_PEROV_COLORS.muted,
                                    fontWeight: isActive ? 600 : 400,
                                }}
                            >
                                {paper.paper}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}
