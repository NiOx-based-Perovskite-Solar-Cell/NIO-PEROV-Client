import React from 'react'
import dynamic from "next/dynamic";
import DashboardLayout from "@/comps/layouts/DashboardLayout";

// form อ่าน draft จาก localStorage -> render ฝั่ง client เท่านั้น
const ResultsForm = dynamic(
    () => import("@/comps/raw-data-config/results/ResultsForm").then((m) => m.ResultsForm),
    { ssr: false },
);

export default function NewPaperResultsPage() {
    return (
        <DashboardLayout>
            <ResultsForm />
        </DashboardLayout>
    );
}
