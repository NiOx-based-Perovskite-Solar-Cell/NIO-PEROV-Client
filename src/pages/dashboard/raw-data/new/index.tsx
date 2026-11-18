import React from 'react'
import dynamic from "next/dynamic";
import DashboardLayout from "@/comps/layouts/DashboardLayout";

// form อ่าน draft จาก localStorage -> render ฝั่ง client เท่านั้น
const PaperEntryForm = dynamic(
    () => import("@/comps/raw-data-config/PaperEntryForm").then((m) => m.PaperEntryForm),
    { ssr: false },
);

export default function NewPaperEntryPage() {
    return (
        <DashboardLayout>
            <PaperEntryForm />
        </DashboardLayout>
    );
}
