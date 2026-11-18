import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { IconChartLine } from "@tabler/icons-react";

const navItems = [
    { id: "graph", label: "กราฟ", route: "/graph", icon: <IconChartLine size={18} stroke={1.8} /> },
];

interface SidebarRowProps {
    label: string;
    route: string;
    icon: React.ReactNode;
}

function SidebarRow({ label, route, icon }: SidebarRowProps) {
    const router = useRouter();
    const isActive = router.asPath === route;

    return (
        <Link href={route}>
            <div
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-200 ${
                    isActive
                        ? "bg-[#12251c] text-[#34d399]"
                        : "text-[#a3aebc] hover:bg-[#151b26] hover:text-[#e6edf3] cursor-pointer"
                }`}
            >
                <span className="text-lg">{icon}</span>
                <span className={`text-sm ${isActive ? "font-semibold" : "font-normal"}`}>{label}</span>
            </div>
        </Link>
    );
}

export function AppSidebar() {
    return (
        <div className="h-screen w-64 bg-[#0a0e14] border-r border-[#1f2733] flex flex-col overflow-y-auto">
            <div className="h-16 flex items-center px-4 border-b border-[#1f2733]">
                <span className="text-lg font-bold text-[#e6edf3] font-mono">
                    Orch<span className="text-[#34d399]">MCP</span>
                </span>
            </div>

            <div className="px-2 pt-3">
                {navItems.map((item) => (
                    <SidebarRow key={item.id} label={item.label} route={item.route} icon={item.icon} />
                ))}
            </div>
        </div>
    );
}
