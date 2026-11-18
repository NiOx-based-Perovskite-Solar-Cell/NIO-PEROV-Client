import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { listDrafts, draftExpiresAt } from "@/utils/entryDraft";
import Link from "next/link";
import { IconPlus, IconSearch, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { SectionHeading } from "@/comps/layouts/SectionHeading";
import { useNotification } from "@/comps/noti/notiComp";
import { PaperTable } from "./PaperTable";
import { getPaperSummary, searchPapers } from "@/utils/api/paper";
import {
    PaperListItem,
    PaperSourceType,
    PaperStatus,
    PaperSummary,
} from "@/utils/interface/paper.types";

const PAGE_SIZE = 10;

function StatCard({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
    return (
        <div
            className="bg-white rounded-xl px-5 py-[18px] flex flex-col gap-1 border"
            style={{ borderColor: highlight ? "#F3D9C2" : "#ECECEC" }}
        >
            <div className="text-[13px] text-[#6B6B6B]">{label}</div>
            <div
                className="text-[32px] leading-10"
                style={{ fontFamily: "Lora, serif", color: highlight ? "#B8530F" : "#1F1F1F" }}
            >
                {value ?? "-"}
            </div>
        </div>
    );
}

// draft ที่กรอกค้างไว้ในเบราว์เซอร์นี้ (string เพื่อให้ useSyncExternalStore เทียบค่าได้)
const subscribeStorage = (onChange: () => void) => {
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
};
const draftsSnapshot = () =>
    JSON.stringify(listDrafts().map(({ key, draft }) => ({
        key,
        doi: draft.paper.doi,
        samples: draft.samples.length,
        expires_at: draftExpiresAt(draft).toISOString(),
    })));

function PendingDrafts() {
    const snapshot = useSyncExternalStore(subscribeStorage, draftsSnapshot, () => "[]");
    const drafts: { key: string; doi: string; samples: number; expires_at: string }[] = useMemo(
        () => JSON.parse(snapshot),
        [snapshot],
    );
    if (drafts.length === 0) return null;

    return (
        <section className="bg-[#EEF4FD] rounded-xl px-5 py-4 flex flex-col gap-2 text-[14px] text-[#1F4F9E]">
            <div className="font-semibold">ข้อมูลที่กรอกค้างไว้ในเบราว์เซอร์นี้ (ยังไม่ได้ส่งเข้าฐานข้อมูล)</div>
            {drafts.map((d) => (
                <div key={d.key} className="flex flex-wrap gap-x-3 gap-y-1 items-center">
                    <span className="font-mono">{d.doi || "(ยังไม่ใส่ DOI)"}</span>
                    <span>
                        {d.key === "new" ? "paper ใหม่" : "แก้ paper เดิม"} · {d.samples} samples · เก็บถึง{" "}
                        {new Date(d.expires_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Link href={`/dashboard/raw-data/${d.key}`} className="font-semibold text-[#2F6FDB] hover:text-[#1F55B0]">
                        กรอกต่อ →
                    </Link>
                </div>
            ))}
        </section>
    );
}

export function RawDataConfigList() {
    const { showNotification } = useNotification();

    const [summary, setSummary] = useState<PaperSummary | null>(null);
    const [papers, setPapers] = useState<PaperListItem[]>([]);
    const [total, setTotal] = useState(0);

    const [status, setStatus] = useState<PaperStatus | "">("");
    const [sourceType, setSourceType] = useState<PaperSourceType | "">("");
    const [search, setSearch] = useState("");
    const [keyword, setKeyword] = useState(""); // search หลัง debounce
    const [page, setPage] = useState(0);

    // loading = ผลที่แสดงอยู่ยังไม่ใช่ของ filter ปัจจุบัน
    const queryKey = JSON.stringify({ keyword, status, sourceType, page });
    const [loadedKey, setLoadedKey] = useState<string | null>(null);
    const loading = loadedKey !== queryKey;

    const tabs: { value: PaperStatus | ""; label: string; count?: number }[] = [
        { value: "", label: "ทั้งหมด", count: summary?.papers },
        { value: "draft", label: "Draft", count: summary?.by_status.draft },
        { value: "review", label: "รอตรวจ", count: summary?.by_status.review },
        { value: "published", label: "Published", count: summary?.by_status.published },
    ];

    useEffect(() => {
        getPaperSummary()
            .then((res) => setSummary(res?.data ?? null))
            .catch(() => showNotification("โหลดข้อมูลไม่สำเร็จ", "ดึงสรุปจำนวน paper ไม่ได้", "error"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // รอพิมพ์เสร็จก่อนค่อยค้นหา
    useEffect(() => {
        const timer = setTimeout(() => {
            setKeyword(search.trim());
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        let cancelled = false; // ทิ้งผลของ request เก่าถ้า filter เปลี่ยนระหว่างรอ
        searchPapers({
            keyword: keyword || undefined,
            status: status || undefined,
            source_type: sourceType || undefined,
            sort_by: "updated_at",
            sort_order: "DESC",
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
        })
            .then((res) => {
                if (cancelled) return;
                const rows: PaperListItem[] = res?.data ?? [];
                setPapers(rows);
                setTotal(rows.length ? Number(rows[0].total_count) : 0);
            })
            .catch(() => {
                if (!cancelled) showNotification("โหลดข้อมูลไม่สำเร็จ", "ดึงรายการ paper ไม่ได้", "error");
            })
            .finally(() => {
                if (!cancelled) setLoadedKey(queryKey);
            });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryKey]);

    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="flex flex-col gap-6 text-[#1F1F1F]">
            {/* Header */}
            <div className="flex flex-wrap gap-4 items-end justify-between">
                <div className="flex flex-col gap-1">
                    <div className="text-[13px] text-[#6B6B6B]">Admin / Raw Data Config</div>
                    <SectionHeading base="Raw " accent="Data" />
                </div>
                <Link
                    href="/dashboard/raw-data/new"
                    className="h-11 px-5 rounded-[10px] bg-[#2F6FDB] hover:bg-[#1F55B0] text-white text-[14px] font-semibold inline-flex items-center gap-2"
                >
                    <IconPlus size={16} stroke={2.5} />
                    เพิ่ม paper
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                <StatCard label="Papers" value={summary?.papers} />
                <StatCard label="Samples" value={summary?.samples} />
                <StatCard label="Draft" value={summary?.by_status.draft} />
                <StatCard label="รอตรวจ" value={summary?.by_status.review} highlight />
            </div>

            <PendingDrafts />

            {/* List */}
            <section className="bg-white border border-[#ECECEC] rounded-xl flex flex-col">
                <div className="flex flex-wrap gap-3 items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
                    <div role="tablist" aria-label="กรองตามสถานะ" className="flex flex-wrap gap-1">
                        {tabs.map((tab) => {
                            const active = status === tab.value;
                            return (
                                <button
                                    key={tab.label}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => { setStatus(tab.value); setPage(0); }}
                                    className={`min-h-10 px-3.5 rounded-lg text-[14px] cursor-pointer ${active ? "bg-[#1F1F1F] text-white" : "text-[#4A4A4A] hover:bg-[#F5F5F5]"}`}
                                >
                                    {tab.label} {tab.count ?? ""}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <label className="flex items-center gap-2 h-10 px-3 border border-[#949494] rounded-lg text-[#6B6B6B]">
                            <IconSearch size={14} />
                            <input
                                aria-label="ค้นหา DOI หรือวัสดุ"
                                placeholder="ค้นหา DOI, วัสดุ …"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border-0 outline-none text-[14px] w-[180px] bg-transparent text-[#1F1F1F]"
                            />
                        </label>
                        <select
                            aria-label="ที่มาของข้อมูล"
                            value={sourceType}
                            onChange={(e) => { setSourceType(e.target.value as PaperSourceType | ""); setPage(0); }}
                            className="h-10 px-2.5 border border-[#949494] rounded-lg text-[14px] bg-white"
                        >
                            <option value="">ทุกแหล่ง</option>
                            <option value="excel">Excel import</option>
                            <option value="manual">กรอกผ่าน UI</option>
                        </select>
                    </div>
                </div>

                <PaperTable papers={papers} loading={loading} />

                <div className="flex flex-wrap gap-3 items-center justify-between px-5 py-3.5 border-t border-[#F0F0F0] text-[13px] text-[#6B6B6B]">
                    <span>{loading ? "กำลังโหลด…" : `แสดง ${papers.length} จาก ${total} papers`}</span>
                    <div className="flex items-center gap-1.5">
                        <span className="mr-2">หน้า {page + 1} / {pageCount}</span>
                        <button
                            type="button"
                            aria-label="หน้าก่อน"
                            disabled={page === 0 || loading}
                            onClick={() => setPage((p) => p - 1)}
                            className="w-10 h-10 flex items-center justify-center border border-[#D4D4D4] rounded-lg bg-white cursor-pointer disabled:opacity-40 disabled:cursor-default"
                        >
                            <IconChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            aria-label="หน้าถัดไป"
                            disabled={page + 1 >= pageCount || loading}
                            onClick={() => setPage((p) => p + 1)}
                            className="w-10 h-10 flex items-center justify-center border border-[#D4D4D4] rounded-lg bg-white cursor-pointer disabled:opacity-40 disabled:cursor-default"
                        >
                            <IconChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
