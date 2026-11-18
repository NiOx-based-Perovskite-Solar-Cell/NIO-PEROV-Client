import React from "react";

export const NIO_PEROV_COLORS = {
    bg: "#FAF9F5",
    border: "#E6E4DC",
    ink: "#1C1C1A",
    muted: "#8A8A7E",
    accent: "#3F6B6B",
    fieldBg: "#F5F4EF",
    errorBg: "#FBEAEA",
    errorText: "#B23B3B",
};

interface NioPerovLogoProps {
    size?: "sm" | "lg";
}

const SIZES = {
    sm: { name: "text-[15px]", divider: "h-6", sub: "text-[8.5px]", gap: "gap-2.5" },
    lg: { name: "text-[32px]", divider: "h-9", sub: "text-[14px]", gap: "gap-4" },
};

export function NioPerovLogo({ size = "sm" }: NioPerovLogoProps) {
    const s = SIZES[size];

    return (
        <span className={`flex items-center ${s.gap}`}>
            <span
                style={{ fontFamily: "Lora, serif", color: NIO_PEROV_COLORS.ink }}
                className={`${s.name} font-bold leading-none tracking-tight whitespace-nowrap`}
            >
                NIO-PEROV
            </span>
            <span className={`w-px ${s.divider}`} style={{ backgroundColor: NIO_PEROV_COLORS.border }} />
            <span
                style={{ fontFamily: "Lora, serif", color: NIO_PEROV_COLORS.muted }}
                className={`${s.sub} leading-[1.25] whitespace-nowrap`}
            >
                NiOx-based Perovskite
                <br />
                Solar Cell Database
            </span>
        </span>
    );
}
