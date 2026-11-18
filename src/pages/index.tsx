import React from 'react'
import PublicLayout from "@/comps/layouts/PublicLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


function PageContent() {

    const router = useRouter();

    useEffect(() => {
        router.push("/visualize");
    }, [router]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">Home Page</div>
    );
}

export default function Home() {
    return (
        <PublicLayout>
            <PageContent></PageContent>
        </PublicLayout>
    );
}
