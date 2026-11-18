import React, { useEffect, useState } from "react";
import PublicLayout from "@/comps/layouts/PublicLayout";
import { SectionHeading } from "@/comps/layouts/SectionHeading";
import { NIO_PEROV_COLORS } from "@/comps/layouts/NioPerovLogo";
import { PaperSidebar } from "@/comps/raw-data/PaperSidebar";
import { SampleTabs } from "@/comps/raw-data/SampleTabs";
import { SheetTabs } from "@/comps/raw-data/SheetTabs";
import { DataTable } from "@/comps/raw-data/DataTable";
import { getRawData } from "@/utils/api/rawData";
import { RawDataPaper, RawDataSample } from "@/utils/interface/rawData.types";

function PageContent() {
    const [papers, setPapers] = useState<RawDataPaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
    const [selectedSample, setSelectedSample] = useState<string | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await getRawData();
                const data: RawDataPaper[] = res?.data ?? [];
                setPapers(data);

                const firstPaper = data[0];
                const firstSample = firstPaper?.samples?.[0];
                const firstSheet = firstSample ? Object.keys(firstSample.data)[0] : undefined;

                setSelectedPaper(firstPaper?.paper ?? null);
                setSelectedSample(firstSample?.sample ?? null);
                setSelectedSheet(firstSheet ?? null);
            } catch (err) {
                console.error(err);
                setError("Failed to load raw data");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const currentPaper = papers.find((p) => p.paper === selectedPaper);
    const currentSample: RawDataSample | undefined = currentPaper?.samples.find(
        (s) => s.sample === selectedSample,
    );
    const sheetNames = currentSample ? Object.keys(currentSample.data) : [];
    const sheetRows = selectedSheet && currentSample ? currentSample.data[selectedSheet] ?? [] : [];

    const handleSelectPaper = (paper: RawDataPaper) => {
        setSelectedPaper(paper.paper);
        const firstSample = paper.samples[0];
        const firstSheet = firstSample ? Object.keys(firstSample.data)[0] : undefined;
        setSelectedSample(firstSample?.sample ?? null);
        setSelectedSheet(firstSheet ?? null);
    };

    const handleSelectSample = (sample: RawDataSample) => {
        setSelectedSample(sample.sample);
        setSelectedSheet(Object.keys(sample.data)[0] ?? null);
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-5">
            <SectionHeading base="Raw " accent="Data" />

            {loading && (
                <p className="text-[13px] mt-6" style={{ color: NIO_PEROV_COLORS.muted }}>
                    Loading...
                </p>
            )}

            {error && (
                <p className="text-[13px] mt-6" style={{ color: NIO_PEROV_COLORS.errorText }}>
                    {error}
                </p>
            )}

            {!loading && !error && (
                <div className="flex gap-12 mt-6">
                    <PaperSidebar papers={papers} selectedPaper={selectedPaper} onSelect={handleSelectPaper} />

                    <section className="flex-1 min-w-0">
                        {currentPaper ? (
                            <>
                                <div className="flex items-center justify-between gap-4">
                                    <h2
                                        style={{ fontFamily: "Lora, serif", color: NIO_PEROV_COLORS.ink }}
                                        className="text-[22px]"
                                    >
                                        {currentPaper.paper}
                                    </h2>

                                    <SampleTabs
                                        samples={currentPaper.samples}
                                        selectedSample={selectedSample}
                                        onSelect={handleSelectSample}
                                    />
                                </div>

                                <SheetTabs
                                    sheetNames={sheetNames}
                                    selectedSheet={selectedSheet}
                                    onSelect={setSelectedSheet}
                                />

                                <div className="mt-5">
                                    <DataTable rows={sheetRows} />
                                </div>
                            </>
                        ) : (
                            <p className="text-[13px]" style={{ color: NIO_PEROV_COLORS.muted }}>
                                No raw data available
                            </p>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

export default function RawDataPage() {
    return (
        <PublicLayout>
            <PageContent></PageContent>
        </PublicLayout>
    );
}
