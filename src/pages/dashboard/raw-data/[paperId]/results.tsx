import React from 'react'
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import DashboardLayout from "@/comps/layouts/DashboardLayout";

// form อ่าน draft จาก localStorage -> render ฝั่ง client เท่านั้น
const ResultsForm = dynamic(
    () => import("@/comps/raw-data-config/results/ResultsForm").then((m) => m.ResultsForm),
    { ssr: false },
);

export default function EditPaperResultsPage() {
    const router = useRouter();
    const paperId = typeof router.query.paperId === "string" ? router.query.paperId : undefined;

    return (
        <DashboardLayout>
            {paperId && <ResultsForm key={paperId} paperId={paperId} />}
        </DashboardLayout>
    );
}
