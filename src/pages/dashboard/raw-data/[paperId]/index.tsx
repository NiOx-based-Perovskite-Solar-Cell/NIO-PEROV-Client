import React from 'react'
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import DashboardLayout from "@/comps/layouts/DashboardLayout";

// form อ่าน draft จาก localStorage -> render ฝั่ง client เท่านั้น
const PaperEntryForm = dynamic(
    () => import("@/comps/raw-data-config/PaperEntryForm").then((m) => m.PaperEntryForm),
    { ssr: false },
);

export default function EditPaperEntryPage() {
    const router = useRouter();
    const paperId = typeof router.query.paperId === "string" ? router.query.paperId : undefined;

    return (
        <DashboardLayout>
            {/* key: เปลี่ยน paper (เช่นกดลิงก์ paper ที่ DOI ซ้ำ) ให้ form โหลด draft ของ paper นั้นใหม่ */}
            {paperId && <PaperEntryForm key={paperId} paperId={paperId} />}
        </DashboardLayout>
    );
}
