import React from 'react'
import PublicLayout from "@/comps/layouts/PublicLayout";
import { SectionHeading } from "@/comps/layouts/SectionHeading";

function PageContent() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-5">
            <SectionHeading base="Visua" accent="lize" />
        </div>
    );
}

export default function VisualizePage() {
    return (
        <PublicLayout>
            <PageContent></PageContent>
        </PublicLayout>
    );
}
