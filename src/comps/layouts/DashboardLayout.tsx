import { NotificationProvider } from "@/comps/noti/notiComp";

import React, { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Sidebar, MobileTopBar } from "./_mainLink";

import { decodeToken } from "@/utils/authToken";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();

    useEffect(() => {
        const token = decodeToken();

        if (!token) {
            router.push("/visualize");
        }
    }, [router.pathname]);

    return (
        <>
            <Head>
                <title>Dashboard | NIO-PEROV</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400;1,500&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="flex min-h-screen w-full bg-white">
                <Sidebar />

                <div className="flex-1 min-w-0 flex flex-col">
                    <MobileTopBar />

                    <NotificationProvider>
                        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 py-8 md:py-10">
                            {children}
                        </main>
                    </NotificationProvider>
                </div>
            </div>
        </>
    );
};

export default DashboardLayout;
