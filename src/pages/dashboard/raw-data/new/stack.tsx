import React from 'react'
import dynamic from "next/dynamic";
import DashboardLayout from "@/comps/layouts/DashboardLayout";

// form อ่าน draft จาก localStorage -> render ฝั่ง client เท่านั้น
const DeviceStackForm = dynamic(
    () => import("@/comps/raw-data-config/stack/DeviceStackForm").then((m) => m.DeviceStackForm),
    { ssr: false },
);

export default function NewPaperStackPage() {
    return (
        <DashboardLayout>
            <DeviceStackForm />
        </DashboardLayout>
    );
}
