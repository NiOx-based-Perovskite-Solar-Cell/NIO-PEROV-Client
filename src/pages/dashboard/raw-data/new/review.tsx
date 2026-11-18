import React from 'react'
import dynamic from "next/dynamic";
import DashboardLayout from "@/comps/layouts/DashboardLayout";

// form อ่าน draft จาก localStorage -> render ฝั่ง client เท่านั้น
const ReviewForm = dynamic(
    () => import("@/comps/raw-data-config/review/ReviewForm").then((m) => m.ReviewForm),
    { ssr: false },
);

export default function NewPaperReviewPage() {
    return (
        <DashboardLayout>
            <ReviewForm />
        </DashboardLayout>
    );
}
