import React from "react";
import { NIO_PEROV_COLORS } from "@/comps/layouts/NioPerovLogo";
import { RawDataSample } from "@/utils/interface/rawData.types";

function formatSampleLabel(sample: string) {
    return sample.replace(/([a-zA-Z])(\d)/, "$1 $2");
}

interface SampleTabsProps {
    samples: RawDataSample[];
    selectedSample: string | null;
    onSelect: (sample: RawDataSample) => void;
}

export function SampleTabs({ samples, selectedSample, onSelect }: SampleTabsProps) {
    return (
        <div className="flex items-center gap-1.5 shrink-0">
            {samples.map((sample) => {
                const isActive = sample.sample === selectedSample;
                return (
                    <button
                        key={sample.sample}
                        type="button"
                        onClick={() => onSelect(sample)}
                        className="text-[12px] px-2.5 py-1 rounded-md cursor-pointer whitespace-nowrap"
                        style={{
                            backgroundColor: isActive ? NIO_PEROV_COLORS.ink : NIO_PEROV_COLORS.fieldBg,
                            color: isActive ? "#fff" : NIO_PEROV_COLORS.muted,
                        }}
                    >
                        {formatSampleLabel(sample.sample)}
                    </button>
                );
            })}
        </div>
    );
}
