import React from 'react'
import DashboardLayout from "@/comps/layouts/DashboardLayout";
import { SectionHeading } from "@/comps/layouts/SectionHeading";

function PageContent() {
    return (
        <div className="w-full">
            <SectionHeading base="Visua" accent="lize" />
        </div>
    );
}

export default function DashboardVisualizePage() {
    return (
        <DashboardLayout>
            <PageContent></PageContent>
        </DashboardLayout>
    );
}
