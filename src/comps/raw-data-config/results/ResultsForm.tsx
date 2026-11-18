import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEntryDraftPage } from "@/utils/entryDraft";
import { DraftSample } from "@/utils/interface/entryDraft.types";
import { DraftLoading, EntryHeader } from "../EntryHeader";
import { SampleTabs } from "../SampleTabs";
import { useLookups } from "../stack/useLookups";
import { JvTable } from "./JvTable";
import { OtherProperties } from "./OtherProperties";
import { StabilityTests } from "./StabilityTests";

/** ขั้น 4-5 (Results & Stability): measurement และ stability test ของแต่ละ sample - เก็บใน draft เดียวกัน */
export function ResultsForm({ paperId }: { paperId?: string }) {
    const router = useRouter();
    const { draft, update, clear, restored, loadError, basePath } = useEntryDraftPage(paperId);
    const { lookups, error: lookupError } = useLookups();
    const [activeKey, setActiveKey] = useState<string | null>(null);

    if (!draft) return <DraftLoading error={loadError} />;
    if (lookupError) return <div className="py-20 text-center text-[#B23B3B]">โหลด dictionary (property, unit) ไม่สำเร็จ</div>;
    if (!lookups) return <DraftLoading error={false} />;

    const sampleIndex = Math.max(0, draft.samples.findIndex((s) => s.key === activeKey));
    const sample = draft.samples[sampleIndex];
    if (!sample) {
        return (
            <div className="py-20 text-center text-[#6B6B6B]">
                ยังไม่มี sample · <Link href={basePath} className="underline">กลับไปเพิ่ม sample</Link>
            </div>
        );
    }

    // แก้จาก draft ล่าสุดของ sample นี้
    const setSample = (patch: Partial<DraftSample>) =>
        update((d) => ({ ...d, samples: d.samples.map((s) => (s.key === sample.key ? { ...s, ...patch } : s)) }));

    return (
        <div className="flex flex-col gap-6 text-[#1F1F1F] max-w-[1120px]">
            <EntryHeader
                draft={draft}
                crumb={`${draft.paper.doi || "(ยังไม่ใส่ DOI)"} · Sample ${sampleIndex + 1}`}
                title={{ base: "Device ", accent: "Results" }}
                step={[3, 4]}
                restored={restored}
                onClear={async () => { await clear(); setActiveKey(null); }}
            />

            <SampleTabs
                samples={draft.samples}
                activeKey={sample.key}
                onSelect={setActiveKey}
                badge={(s) => `${s.measurements.length} ค่า · ${s.stability_tests.length} stability`}
            />

            <section key={sample.key} className="bg-white border border-[#ECECEC] rounded-xl p-7 flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                    <h2 className="m-0 text-[26px] leading-[34px] font-semibold" style={{ fontFamily: "Lora, serif" }}>J-V parameters</h2>
                    <p className="m-0 text-[14px] text-[#6B6B6B]">
                        หน่วยล็อกตาม property · กรอกเฉพาะช่องที่ paper รายงาน · ช่องสีแดง = ค่าเกินช่วงที่เป็นไปได้ของ property
                    </p>
                </div>
                <JvTable
                    measurements={sample.measurements}
                    properties={lookups.properties}
                    onChange={(measurements) => setSample({ measurements })}
                />
                <OtherProperties
                    measurements={sample.measurements}
                    properties={lookups.properties}
                    units={lookups.units}
                    onChange={(measurements) => setSample({ measurements })}
                />
            </section>

            <StabilityTests
                key={`stability-${sample.key}`}
                tests={sample.stability_tests}
                onChange={(stability_tests) => setSample({ stability_tests })}
            />

            <div className="flex flex-wrap gap-3 justify-end">
                <Link
                    href={`${basePath}/stack`}
                    className="inline-flex items-center h-11 px-5 rounded-[10px] border border-[#D4D4D4] bg-white text-[#2B2B2B] text-[14px]"
                >
                    ← ย้อนกลับ
                </Link>
                <button
                    type="button"
                    onClick={() => router.push(`${basePath}/review`)}
                    className="h-11 px-[22px] rounded-[10px] bg-[#2F6FDB] hover:bg-[#1F55B0] text-white font-semibold text-[14px] cursor-pointer"
                >
                    ถัดไป: Review →
                </button>
            </div>
        </div>
    );
}
