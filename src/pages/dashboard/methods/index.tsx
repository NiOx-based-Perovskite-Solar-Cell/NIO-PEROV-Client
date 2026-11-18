import React from 'react'
import DashboardLayout from "@/comps/layouts/DashboardLayout";
import { SectionHeading } from "@/comps/layouts/SectionHeading";

function PageContent() {
    return (
        <div className="w-full">
            <SectionHeading base="Methods" />
        </div>
    );
}

export default function DashboardMethodsPage() {
    return (
        <DashboardLayout>
            <PageContent></PageContent>
        </DashboardLayout>
    );
}
