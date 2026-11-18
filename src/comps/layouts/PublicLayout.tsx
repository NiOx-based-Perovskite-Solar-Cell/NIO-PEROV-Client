import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { IconSearch, IconLogout, IconLayoutDashboard } from "@tabler/icons-react";
import { NioPerovLogo, NIO_PEROV_COLORS } from "./NioPerovLogo";
import { decodeToken, removeToken } from "@/utils/authToken";

const NAV_ITEMS = [
    { label: "Visualize", route: "/visualize" },
    { label: "Methods", route: "/methods" },
    { label: "Raw Data", route: "/raw-data" },
    { label: "Feature Data", route: "/feature-data" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [search, setSearch] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const token = decodeToken();
        const fullName = [token?.first_name, token?.last_name].filter(Boolean).join(" ");
        setUsername(fullName || token?.email || "");
    }, [router.pathname]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        removeToken();
        setUsername("");
        setMenuOpen(false);
        router.push("/login");
    };

    return (
        <>
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400;1,500&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-white">
                <header className="border-b" style={{ borderColor: NIO_PEROV_COLORS.border }}>
                    <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
                        <Link href="/" className="shrink-0">
                            <NioPerovLogo size="sm" />
                        </Link>

                        <nav className="flex items-center gap-6 flex-1">
                            {NAV_ITEMS.map((item) => {
                                const isActive = router.pathname === item.route || router.pathname.startsWith(item.route + "/");
                                return (
                                    <Link
                                        key={item.route}
                                        href={item.route}
                                        className="text-[13.5px] transition-colors"
                                        style={{ color: isActive ? NIO_PEROV_COLORS.ink : NIO_PEROV_COLORS.muted, fontWeight: isActive ? 600 : 400 }}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex items-center gap-5 shrink-0">
                            <div className="relative">
                                <IconSearch
                                    size={14}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2"
                                    style={{ color: NIO_PEROV_COLORS.muted }}
                                />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search ..."
                                    className="text-[13px] rounded-md pl-8 pr-3 py-1.5 outline-none border w-44"
                                    style={{ borderColor: NIO_PEROV_COLORS.border, color: NIO_PEROV_COLORS.ink }}
                                />
                            </div>

                            {username ? (
                                <div className="relative" ref={menuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setMenuOpen((open) => !open)}
                                        className="flex items-center gap-1.5 cursor-pointer"
                                        style={{ color: NIO_PEROV_COLORS.ink }}
                                    >
                                        <span className="text-[13.5px]">{username}</span>
                                    </button>

                                    {menuOpen && (
                                        <div
                                            className="absolute right-0 top-full mt-2 w-40 rounded-md border bg-white py-1 shadow-sm z-10"
                                            style={{ borderColor: NIO_PEROV_COLORS.border }}
                                        >
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setMenuOpen(false)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] cursor-pointer hover:bg-gray-50"
                                                style={{ color: NIO_PEROV_COLORS.ink }}
                                            >
                                                <IconLayoutDashboard size={15} />
                                                Dashboard
                                            </Link>
                                            <div className="my-1 border-t" style={{ borderColor: NIO_PEROV_COLORS.border }} />
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] cursor-pointer hover:bg-gray-50"
                                                style={{ color: NIO_PEROV_COLORS.errorText }}
                                            >
                                                <IconLogout size={15} />
                                                ออกจากระบบ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => router.push("/login")}
                                    className="text-[13.5px] font-medium cursor-pointer"
                                    style={{ color: NIO_PEROV_COLORS.ink }}
                                >
                                    Sign in
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main>{children}</main>
            </div>
        </>
    );
}
