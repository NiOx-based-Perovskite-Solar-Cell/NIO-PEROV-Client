import React from "react";
import { NIO_PEROV_COLORS } from "./NioPerovLogo";

interface SectionHeadingProps {
    base: string;
    accent?: string;
}

export function SectionHeading({ base, accent }: SectionHeadingProps) {
    return (
        <h1
            style={{ fontFamily: "Lora, serif", color: NIO_PEROV_COLORS.ink }}
            className="text-[40px] leading-tight"
        >
            {base}
            {accent && <span style={{ color: "#3B82F6" }}>{accent}</span>}
        </h1>
    );
}
