import React from 'react'
import DashboardLayout from "@/comps/layouts/DashboardLayout";
import { RawDataConfigList } from "@/comps/raw-data-config/RawDataConfigList";

export default function DashboardRawDataPage() {
    return (
        <DashboardLayout>
            <RawDataConfigList />
        </DashboardLayout>
    );
}
