import Head from "next/head";
import React, { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { NioPerovLogo, NIO_PEROV_COLORS } from "./NioPerovLogo";

export const AUTH_COLORS = NIO_PEROV_COLORS;

interface AuthLayoutProps {
    title: string;
    eyebrow: string;
    heading: React.ReactNode;
    subtitle: string;
    children: React.ReactNode;
    footer?: React.ReactNode; // ไม่ส่ง = ไม่แสดงส่วนท้าย (เช่นหน้า login ที่ปิดการสมัครไว้)
}

export default function AuthLayout({ title, eyebrow, heading, subtitle, children, footer }: AuthLayoutProps) {
    return (
        <>
            <Head>
                <title>{title}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400;1,500&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen flex flex-col" style={{ backgroundColor: AUTH_COLORS.bg }}>
                <header className="border-b" style={{ borderColor: AUTH_COLORS.border }}>
                    <div className="max-w-6xl mx-auto px-6 h-20 flex items-center">
                        <NioPerovLogo size="lg" />
                    </div>
                </header>

                <main className="flex-1 flex items-center justify-center px-4 py-14">
                    <div className="w-full max-w-[420px]">
                        <div className="text-center mb-8">
                            <p
                                className="text-[11px] tracking-[0.16em] uppercase mb-3"
                                style={{ color: AUTH_COLORS.muted }}
                            >
                                {eyebrow}
                            </p>
                            <h1
                                style={{ fontFamily: "Lora, serif", color: AUTH_COLORS.ink }}
                                className="text-[32px] leading-tight mb-2"
                            >
                                {heading}
                            </h1>
                            <p
                                className="text-[14px] italic"
                                style={{ fontFamily: "Lora, serif", color: AUTH_COLORS.muted }}
                            >
                                {subtitle}
                            </p>
                        </div>

                        <div
                            className="bg-white border rounded-xl px-7 py-8"
                            style={{ borderColor: AUTH_COLORS.border, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
                        >
                            {children}
                        </div>

                        {footer && (
                            <div className="text-center mt-6 text-sm" style={{ color: AUTH_COLORS.muted }}>
                                {footer}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}

interface AuthFieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoComplete?: string;
    name: string;
}

export function AuthField({ label, type = "text", value, onChange, placeholder, autoComplete, name }: AuthFieldProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: AUTH_COLORS.ink }}>
                {label}
            </span>
            <div className="relative">
                <input
                    name={name}
                    type={resolvedType}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="w-full text-sm rounded-md px-3 py-2.5 outline-none border transition-colors"
                    style={{
                        backgroundColor: AUTH_COLORS.fieldBg,
                        borderColor: AUTH_COLORS.border,
                        color: AUTH_COLORS.ink,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = AUTH_COLORS.ink)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = AUTH_COLORS.border)}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                        style={{ color: AUTH_COLORS.muted }}
                        tabIndex={-1}
                    >
                        {showPassword ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                    </button>
                )}
            </div>
        </label>
    );
}

interface AuthButtonProps {
    children: React.ReactNode;
    disabled?: boolean;
    type?: "submit" | "button";
}

export function AuthButton({ children, disabled, type = "submit" }: AuthButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled}
            className="w-full rounded-md py-2.5 text-sm font-medium text-white transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: AUTH_COLORS.ink }}
        >
            {children}
        </button>
    );
}

// Starts the server-side Google OAuth flow (GET /auth/google, not under /v1)
export const getGoogleLoginUrl = () => `${process.env.NEXT_PUBLIC_BASE_URL}/auth/google`;

export function GoogleButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-3 rounded-md py-2.5 text-sm font-medium border bg-white transition-colors cursor-pointer hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ borderColor: AUTH_COLORS.border, color: AUTH_COLORS.ink }}
        >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
            </svg>
            {children}
        </button>
    );
}

export function AuthError({ message }: { message: string }) {
    if (!message) return null;
    return (
        <div
            className="text-sm rounded-md px-3 py-2"
            style={{ backgroundColor: AUTH_COLORS.errorBg, color: AUTH_COLORS.errorText }}
        >
            {message}
        </div>
    );
}
