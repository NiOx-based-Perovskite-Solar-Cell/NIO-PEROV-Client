import React from "react";
import { useMediaQuery } from "@/comps/public/useMediaQuery";
import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const isLargerThanSm = useMediaQuery("(min-width: 768px)");

    return (
        <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
            {isLargerThanSm && <AppSidebar />}

            <main className="flex-1 h-screen overflow-y-auto bg-[#0a0e14]">
                {children}
            </main>
        </div>
    );
}
