"use client";

import React, { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getToken, removeToken } from "@/utils/authToken";
import jwt from "jsonwebtoken";
import { tabDashboard } from "@/comps/layouts/tabRoute";
import { NioPerovLogo, NIO_PEROV_COLORS } from "@/comps/layouts/NioPerovLogo";
import { IconLogout, IconArrowLeft } from "@tabler/icons-react";

interface MainLinkProps {
  label: string;
  route: string;
  icon?: React.ReactNode;
}

interface SidebarUser {
  name: string;
  email: string;
  role: string;
}

function SidebarLink({ label, route, icon }: MainLinkProps) {
  const router = useRouter();

  // เช็คว่า Route ปัจจุบันตรงกับปุ่มนี้ไหม เพื่อทำ Highlight
  const isActive = router.pathname === route || router.pathname.startsWith(route + "/");

  return (
    <Link
      href={route}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] transition-colors hover:bg-[#F0EFE9]"
      style={{
        color: isActive ? NIO_PEROV_COLORS.ink : NIO_PEROV_COLORS.muted,
        fontWeight: isActive ? 600 : 400,
        backgroundColor: isActive ? "#FFFFFF" : undefined,
        boxShadow: isActive ? `inset 0 0 0 1px ${NIO_PEROV_COLORS.border}` : undefined,
      }}
    >
      {icon && (
        <span style={{ color: isActive ? NIO_PEROV_COLORS.accent : NIO_PEROV_COLORS.muted }}>
          {icon}
        </span>
      )}
      {label}
    </Link>
  );
}

const subscribeToken = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

// ชื่อผู้ใช้จาก JWT (first_name / last_name จาก Google)
export function useSidebarUser(): SidebarUser | null {
  // server render = null, client = token ใน localStorage
  const token = useSyncExternalStore(subscribeToken, getToken, () => null);

  return useMemo(() => {
    const payload = token ? (jwt.decode(token) as Record<string, string> | null) : null;
    if (!payload) return null;
    const fullName = [payload.first_name, payload.last_name].filter(Boolean).join(" ");
    return {
      name: fullName || payload.email || "ผู้ใช้",
      email: payload.email || "",
      role: payload.role || "",
    };
  }, [token]);
}

function UserCard({ user }: { user: SidebarUser | null }) {
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  if (!user) return null;

  const initial = user.name.trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[14px] font-semibold text-white"
        style={{ backgroundColor: NIO_PEROV_COLORS.accent, fontFamily: "Lora, serif" }}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium truncate" style={{ color: NIO_PEROV_COLORS.ink }} title={user.name}>
          {user.name}
        </p>
        <p className="text-[11.5px] truncate" style={{ color: NIO_PEROV_COLORS.muted }} title={user.email}>
          {user.role ? `${user.role} · ${user.email}` : user.email}
        </p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        title="ออกจากระบบ"
        aria-label="ออกจากระบบ"
        className="p-1.5 rounded-md cursor-pointer hover:bg-[#F0EFE9]"
        style={{ color: NIO_PEROV_COLORS.errorText }}
      >
        <IconLogout size={17} />
      </button>
    </div>
  );
}

export function Sidebar() {
  const user = useSidebarUser();

  return (
    <aside
      className="hidden md:flex h-screen w-64 shrink-0 flex-col justify-between sticky top-0 border-r overflow-y-auto"
      style={{ backgroundColor: NIO_PEROV_COLORS.bg, borderColor: NIO_PEROV_COLORS.border }}
    >
      {/* Top Section: Logo & Menu */}
      <div>
        <div className="h-20 px-6 flex items-center border-b" style={{ borderColor: NIO_PEROV_COLORS.border }}>
          <Link href="/dashboard">
            <NioPerovLogo size="sm" />
          </Link>
        </div>

        <p
          className="px-6 pt-6 pb-2 text-[11px] tracking-[0.16em] uppercase"
          style={{ color: NIO_PEROV_COLORS.muted }}
        >
          Dashboard
        </p>

        <nav className="flex flex-col gap-1 px-3">
          {tabDashboard.map((link) => (
            <SidebarLink key={link.label} {...link} />
          ))}
        </nav>
      </div>

      {/* Bottom Section: back to site & user profile */}
      <div className="border-t px-4 py-4 flex flex-col gap-4" style={{ borderColor: NIO_PEROV_COLORS.border }}>
        <Link
          href="/"
          className="flex items-center gap-2 text-[12.5px] px-2"
          style={{ color: NIO_PEROV_COLORS.muted }}
        >
          <IconArrowLeft size={14} />
          กลับหน้าเว็บไซต์
        </Link>
        <UserCard user={user} />
      </div>
    </aside>
  );
}

// แถบด้านบนสำหรับจอเล็ก (sidebar ถูกซ่อน)
export function MobileTopBar() {
  const router = useRouter();
  const user = useSidebarUser();

  return (
    <div className="md:hidden border-b bg-white" style={{ borderColor: NIO_PEROV_COLORS.border }}>
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        <Link href="/dashboard">
          <NioPerovLogo size="sm" />
        </Link>
        {user && (
          <span className="text-[13px] truncate" style={{ color: NIO_PEROV_COLORS.ink }}>
            {user.name}
          </span>
        )}
      </div>
      <nav className="flex gap-5 px-4 overflow-x-auto">
        {tabDashboard.map((link) => {
          const isActive = router.pathname.startsWith(link.route);
          return (
            <Link
              key={link.route}
              href={link.route}
              className="py-2.5 text-[13px] whitespace-nowrap border-b-2"
              style={{
                color: isActive ? NIO_PEROV_COLORS.ink : NIO_PEROV_COLORS.muted,
                fontWeight: isActive ? 600 : 400,
                borderColor: isActive ? NIO_PEROV_COLORS.accent : "transparent",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
