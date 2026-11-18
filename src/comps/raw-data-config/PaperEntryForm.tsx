import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { IconAlertTriangle, IconCheck, IconPlus } from "@tabler/icons-react";
import { useNotification } from "@/comps/noti/notiComp";
import { DraftLoading, EntryHeader } from "./EntryHeader";
import { SamplesTable } from "./SamplesTable";
import { fetchCrossref, searchPapers } from "@/utils/api/paper";
import { normalizeDoi } from "@/utils/doi";
import { emptySample, useEntryDraftPage } from "@/utils/entryDraft";
import { DraftSample, EntryDraft } from "@/utils/interface/entryDraft.types";
import { Architecture, PaperListItem } from "@/utils/interface/paper.types";

// ผลเช็ค DOI ซ้ำ: duplicate = null แปลว่ายังไม่มีในฐานข้อมูล
interface DoiCheck {
    doi: string;
    duplicate: PaperListItem | null;
}

const inputClass = "h-11 px-3 border rounded-[10px] text-[15px]";
const autoInputClass = `${inputClass} border-[#D4D4D4] bg-[#FAFAFA]`;

function Field({ id, label, auto, className = "", children }: {
    id: string;
    label: string;
    auto?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={id} className="text-[13px] font-semibold">
                {label} {auto && <span className="font-normal text-[#6B6B6B]">· auto</span>}
            </label>
            {children}
        </div>
    );
}

interface PaperEntryFormProps {
    paperId?: string; // ไม่มี = เพิ่ม paper ใหม่
}

/**
 * ขั้น 1-2 (Paper & Samples): ทุกอย่างที่กรอกเก็บใน draft JSON ในเครื่อง
 * ยังไม่ส่งไปหลังบ้าน - ส่งทีเดียวตอนขั้น Review
 */
export function PaperEntryForm({ paperId }: PaperEntryFormProps) {
    const router = useRouter();
    const { showNotification } = useNotification();

    const { draft, update, clear, restored, loadError, basePath } = useEntryDraftPage(paperId);

    const [fetchingCrossref, setFetchingCrossref] = useState(false);
    const [doiCheck, setDoiCheck] = useState<DoiCheck | null>(null);

    const normalizedDoi = normalizeDoi(draft?.paper.doi ?? "");
    const doiChecked = doiCheck?.doi === normalizedDoi ? doiCheck : null;

    // เช็คว่ามี paper ที่ใช้ DOI นี้อยู่แล้วหรือยัง (รอพิมพ์เสร็จก่อน)
    useEffect(() => {
        if (!normalizedDoi.startsWith("10.")) return;
        const timer = setTimeout(async () => {
            const res = await searchPapers({ doi: normalizedDoi, limit: 1 });
            const found: PaperListItem | undefined = res?.data?.[0];
            setDoiCheck({
                doi: normalizedDoi,
                duplicate: found && found.paper_id !== paperId ? found : null,
            });
        }, 400);
        return () => clearTimeout(timer);
    }, [normalizedDoi, paperId]);

    if (!draft) return <DraftLoading error={loadError} />;

    const setPaper = (patch: Partial<EntryDraft["paper"]>) =>
        update((d) => ({ ...d, paper: { ...d.paper, ...patch } }));

    const updateSample = (key: string, patch: Partial<DraftSample>) =>
        update((d) => ({ ...d, samples: d.samples.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));

    const removeSample = (key: string) =>
        update((d) => ({
            ...d,
            samples: d.samples
                .filter((s) => s.key !== key)
                // sample ที่คัดลอกมาจากอันที่ลบ ยังเก็บ layers ไว้ แค่ไม่แสดงว่ามาจากไหน
                .map((s) => (s.copied_from_key === key ? { ...s, copied_from_key: undefined } : s)),
        }));

    const handleCrossref = async () => {
        setFetchingCrossref(true);
        try {
            const meta = await fetchCrossref(normalizedDoi);
            if (!meta) {
                showNotification("ไม่พบ DOI", "Crossref ไม่มีข้อมูลของ DOI นี้ กรอกเองได้", "error");
                return;
            }
            setPaper({
                title: meta.title ?? "",
                journal: meta.journal ?? "",
                year: meta.year ? String(meta.year) : "",
            });
        } catch {
            showNotification("ดึงข้อมูลไม่สำเร็จ", "เชื่อมต่อ Crossref ไม่ได้", "error");
        } finally {
            setFetchingCrossref(false);
        }
    };

    const handleClear = async () => {
        await clear();
        setDoiCheck(null);
    };

    const handleNext = () => {
        if (!normalizedDoi.startsWith("10.")) {
            showNotification("DOI ไม่ถูกต้อง", "DOI ต้องขึ้นต้นด้วย 10.", "error");
            return;
        }
        if (doiChecked?.duplicate) {
            showNotification("DOI ซ้ำ", "มี paper นี้ในฐานข้อมูลแล้ว", "error");
            return;
        }
        if (draft.samples.length === 0) {
            showNotification("ยังไม่มี sample", "เพิ่ม sample อย่างน้อย 1 อัน", "error");
            return;
        }
        router.push(`${basePath}/stack`);
    };

    return (
        <div className="flex flex-col gap-6 text-[#1F1F1F] max-w-[1080px]">
            <EntryHeader
                draft={draft}
                crumb={paperId ? "แก้ไข paper" : "เพิ่ม paper"}
                title={{ base: paperId ? "Edit " : "New ", accent: "Entry" }}
                step={[0, 1]}
                restored={restored}
                onClear={handleClear}
            />

            {/* Paper */}
            <section className="bg-white border border-[#ECECEC] rounded-xl p-7 flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                    <h2 className="m-0 text-[26px] leading-[34px] font-semibold" style={{ fontFamily: "Lora, serif" }}>Paper</h2>
                    <p className="m-0 text-[14px] leading-[22px] text-[#6B6B6B]">
                        ใส่แค่ DOI ระบบเติมข้อมูลที่เหลือให้ และตรวจว่ามี paper นี้อยู่แล้วหรือยัง
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 items-end">
                    <Field id="doi" label="DOI" className="flex-[1_1_320px]">
                        <input
                            id="doi"
                            value={draft.paper.doi}
                            onChange={(e) => setPaper({ doi: e.target.value })}
                            placeholder="10.xxxx/xxxxx"
                            className={`${inputClass} border-[#949494] font-mono`}
                        />
                    </Field>
                    <button
                        type="button"
                        onClick={handleCrossref}
                        disabled={!normalizedDoi.startsWith("10.") || fetchingCrossref}
                        className="h-11 px-[18px] rounded-[10px] border border-[#2F6FDB] bg-white text-[#2F6FDB] font-semibold text-[14px] cursor-pointer disabled:opacity-50 disabled:cursor-default"
                    >
                        {fetchingCrossref ? "กำลังดึงข้อมูล…" : "ดึงข้อมูลจาก Crossref"}
                    </button>
                </div>

                {doiChecked && !doiChecked.duplicate && (
                    <div className="flex gap-2.5 items-start bg-[#EEF7F1] rounded-[10px] px-4 py-3 text-[14px] leading-[22px] text-[#1E6B3A]">
                        <IconCheck size={18} stroke={2.5} className="shrink-0 mt-0.5" />
                        <span>
                            {paperId ? "DOI นี้ไม่ซ้ำกับ paper อื่น" : "ยังไม่มีในฐานข้อมูล"} ·
                            ระบบ normalize DOI ก่อนเทียบ ดังนั้นชื่อแบบ 10_1002_advs_… ก็จะถูกจับว่าซ้ำ
                            {normalizedDoi !== draft.paper.doi.trim() && <> (จะบันทึกเป็น <span className="font-mono">{normalizedDoi}</span>)</>}
                        </span>
                    </div>
                )}
                {doiChecked?.duplicate && (
                    <div className="flex gap-2.5 items-start bg-[#FFF4EA] rounded-[10px] px-4 py-3 text-[14px] leading-[22px] text-[#9A450C]">
                        <IconAlertTriangle size={18} stroke={2.2} className="shrink-0 mt-0.5" />
                        <span>
                            มี paper นี้ในฐานข้อมูลแล้ว ({doiChecked.duplicate.sample_count} samples) ·{" "}
                            <Link href={`/dashboard/raw-data/${doiChecked.duplicate.paper_id}`} className="font-semibold text-[#9A450C] underline">
                                เปิด paper เดิม
                            </Link>
                        </span>
                    </div>
                )}

                <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                    <Field id="title" label="Title" auto className="col-span-full">
                        <input id="title" value={draft.paper.title} onChange={(e) => setPaper({ title: e.target.value })} className={autoInputClass} />
                    </Field>
                    <Field id="journal" label="Journal" auto>
                        <input id="journal" value={draft.paper.journal} onChange={(e) => setPaper({ journal: e.target.value })} className={autoInputClass} />
                    </Field>
                    <Field id="year" label="Year" auto>
                        <input
                            id="year"
                            inputMode="numeric"
                            value={draft.paper.year}
                            onChange={(e) => setPaper({ year: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                            className={autoInputClass}
                        />
                    </Field>
                    <fieldset className="m-0 border-0 p-0 flex flex-col">
                        <legend className="text-[13px] font-semibold p-0 mb-1.5">Architecture</legend>
                        <div className="flex gap-2">
                            {(["pin", "nip"] as Architecture[]).map((arch) => {
                                const checked = draft.architecture === arch;
                                return (
                                    <label
                                        key={arch}
                                        className={`flex items-center gap-2 min-h-11 px-3.5 rounded-[10px] text-[14px] cursor-pointer ${checked ? "border-2 border-[#2F6FDB] bg-[#EEF4FD]" : "border border-[#D4D4D4]"}`}
                                    >
                                        <input
                                            type="radio"
                                            name="arch"
                                            checked={checked}
                                            onChange={() => update((d) => ({ ...d, architecture: arch }))}
                                        />
                                        {arch === "pin" ? "p-i-n" : "n-i-p"}
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>
                </div>
            </section>

            {/* Samples */}
            <section className="bg-white border border-[#ECECEC] rounded-xl p-7 flex flex-col gap-4">
                <div className="flex flex-wrap gap-3 items-end justify-between">
                    <div className="flex flex-col gap-1">
                        <h2 className="m-0 text-[26px] leading-[34px] font-semibold" style={{ fontFamily: "Lora, serif" }}>Samples</h2>
                        <p className="m-0 text-[14px] leading-[22px] text-[#6B6B6B]">
                            1 sample = 1 เงื่อนไขของ device · sample ใหม่คัดลอก stack มาจาก sample ที่เลือกได้
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => update((d) => ({ ...d, samples: [...d.samples, emptySample()] }))}
                        className="h-11 px-[18px] rounded-[10px] bg-[#2F6FDB] hover:bg-[#1F55B0] text-white font-semibold text-[14px] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <IconPlus size={16} stroke={2.5} />
                        เพิ่ม sample
                    </button>
                </div>
                <SamplesTable samples={draft.samples} onChange={updateSample} onRemove={removeSample} />
            </section>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-end">
                <Link
                    href="/dashboard/raw-data"
                    className="inline-flex items-center h-11 px-5 rounded-[10px] border border-[#D4D4D4] bg-white text-[#2B2B2B] text-[14px]"
                >
                    พักไว้แล้วออก
                </Link>
                <button
                    type="button"
                    onClick={handleNext}
                    className="h-11 px-[22px] rounded-[10px] bg-[#2F6FDB] hover:bg-[#1F55B0] text-white font-semibold text-[14px] cursor-pointer"
                >
                    ถัดไป: Device stack →
                </button>
            </div>
        </div>
    );
}
