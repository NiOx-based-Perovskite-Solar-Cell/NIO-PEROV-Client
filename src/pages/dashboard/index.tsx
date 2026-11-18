import React from 'react'
import DashboardLayout from "@/comps/layouts/DashboardLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


function PageContent() {

    const router = useRouter();

    useEffect(() => {
        router.push("/dashboard/visualize");
    }, [router]);

    return (
        <div className="w-[80%] h-full">Home Page</div>
    );
}

export default function DashboardHome() {
    return (
        <DashboardLayout>
            <PageContent></PageContent>
        </DashboardLayout>
    );
}
