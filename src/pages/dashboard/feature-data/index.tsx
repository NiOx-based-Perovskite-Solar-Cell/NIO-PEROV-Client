import React from 'react'
import DashboardLayout from "@/comps/layouts/DashboardLayout";
import { SectionHeading } from "@/comps/layouts/SectionHeading";

function PageContent() {
    return (
        <div className="w-full">
            <SectionHeading base="Feature " accent="Data" />
        </div>
    );
}

export default function DashboardFeatureDataPage() {
    return (
        <DashboardLayout>
            <PageContent></PageContent>
        </DashboardLayout>
    );
}
