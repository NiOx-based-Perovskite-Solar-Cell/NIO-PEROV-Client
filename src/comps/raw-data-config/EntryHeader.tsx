import React from "react";
import Link from "next/link";
import { IconHistory } from "@tabler/icons-react";
import { SectionHeading } from "@/comps/layouts/SectionHeading";
import { useNotification } from "@/comps/noti/notiComp";
import { draftExpiresAt } from "@/utils/entryDraft";
import { EntryDraft } from "@/utils/interface/entryDraft.types";
import { EntrySteps } from "./EntrySteps";

const timeText = (d: Date) => d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

interface EntryHeaderProps {
    draft: EntryDraft;
    crumb: string; // ต่อท้าย "Raw Data Config / "
    title: { base: string; accent: string };
    step: number[]; // ขั้นที่ทำอยู่ใน EntrySteps
    restored: boolean;
    onClear: () => Promise<void> | void;
}

/** ส่วนหัวของทุกขั้นการกรอก: breadcrumb, สถานะ draft ในเครื่อง, ปุ่มล้างค่า, stepper */
export function EntryHeader({ draft, crumb, title, step, restored, onClear }: EntryHeaderProps) {
    const { showNotification } = useNotification();

    const handleClear = async () => {
        if (!window.confirm("ล้างข้อมูลที่กรอกไว้ทั้งหมดของ paper นี้? (ทุกขั้น ทุก sample)")) return;
        await onClear();
        showNotification("ล้างค่าแล้ว", "ข้อมูลที่กรอกค้างไว้ถูกลบแล้ว", "success");
    };

    return (
        <>
            <div className="flex flex-wrap gap-4 items-end justify-between">
                <div className="flex flex-col gap-1">
                    <div className="text-[13px] text-[#6B6B6B]">
                        <Link href="/dashboard/raw-data" className="text-[#6B6B6B] underline">Raw Data Config</Link>
                        {" / "}{crumb}
                    </div>
                    <SectionHeading base={title.base} accent={title.accent} />
                </div>
                <div className="flex items-center gap-3 text-[13px] text-[#6B6B6B]">
                    <span>
                        บันทึกในเครื่องแล้ว {timeText(new Date(draft.updated_at))} · เก็บถึง {timeText(draftExpiresAt(draft))}
                    </span>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="h-9 px-3 rounded-lg border border-[#D4D4D4] bg-white text-[#B23B3B] hover:bg-[#FBEAEA] cursor-pointer"
                    >
                        ล้างค่า
                    </button>
                </div>
            </div>

            {restored && (
                <div className="flex gap-2.5 items-start bg-[#EEF4FD] rounded-[10px] px-4 py-3 text-[14px] leading-[22px] text-[#1F4F9E]">
                    <IconHistory size={18} className="shrink-0 mt-0.5" />
                    <span>
                        กู้คืนข้อมูลที่กรอกค้างไว้แล้ว · ข้อมูลอยู่ในเบราว์เซอร์นี้เท่านั้น และหายเองถ้าไม่ได้แก้ไขเกิน 3 ชั่วโมง
                        ยังไม่ถูกส่งเข้าฐานข้อมูลจนกว่าจะกดส่งในขั้น Review
                    </span>
                </div>
            )}

            <EntrySteps current={step} />
        </>
    );
}

/** ข้อความระหว่างโหลด draft / โหลดไม่สำเร็จ */
export function DraftLoading({ error }: { error: boolean }) {
    return error
        ? <div className="py-20 text-center text-[#B23B3B]">โหลดข้อมูล paper ไม่สำเร็จ</div>
        : <div className="py-20 text-center text-[#6B6B6B]">กำลังโหลด…</div>;
}
