import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEntryDraftPage } from "@/utils/entryDraft";
import { DraftLayer, DraftSample } from "@/utils/interface/entryDraft.types";
import { Architecture } from "@/utils/interface/paper.types";
import { DraftLoading, EntryHeader } from "../EntryHeader";
import { SampleTabs, sampleTitle } from "../SampleTabs";
import { LayerDetail } from "./LayerDetail";
import { LayerList } from "./LayerList";
import { applyTemplate, emptyLayer, isEmptyLayer, layerSignature, renumber, stackArchitecture } from "./stack";
import { useLookups } from "./useLookups";

/** sample ที่ยังไม่ได้กรอก layer: คัดลอก stack จาก sample อื่นแล้วแก้เฉพาะจุดที่ต่าง */
function CopyFromSample({ others, onCopy }: {
    others: { index: number; sample: DraftSample }[];
    onCopy: (layers: DraftLayer[]) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
            <span className="text-[#6B6B6B]">หรือคัดลอกจาก:</span>
            {others.map(({ index, sample }) => (
                <button
                    key={sample.key}
                    type="button"
                    onClick={() => onCopy(structuredClone(sample.layers))}
                    className="min-h-9 px-3.5 rounded-[10px] border border-[#D4D4D4] bg-white text-[#2B2B2B] cursor-pointer"
                >
                    {sampleTitle(sample, index)}
                </button>
            ))}
        </div>
    );
}

/** ขั้น 3 (Device stack): layer, สาร, ตัวทำละลาย, ขั้นตอน ของทุก sample - เก็บใน draft เดียวกัน */
export function DeviceStackForm({ paperId }: { paperId?: string }) {
    const router = useRouter();
    const { draft, update, clear, restored, loadError, basePath } = useEntryDraftPage(paperId);
    const { lookups, error: lookupError } = useLookups();

    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [selected, setSelected] = useState(0);

    if (!draft) return <DraftLoading error={loadError} />;
    if (lookupError) return <div className="py-20 text-center text-[#B23B3B]">โหลด dictionary (unit, material, process type) ไม่สำเร็จ</div>;
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

    // sample ที่ยังไม่มี layer: แสดงโครง stack มาตรฐานให้กรอกได้เลย (ยังไม่บันทึกจนกว่าจะแก้)
    const template = () => applyTemplate(draft.architecture ?? "pin");
    const layers = sample.layers.length ? sample.layers : template();
    const current = Math.min(selected, layers.length - 1);

    const setLayers = (next: DraftLayer[]) =>
        update((d) => ({ ...d, samples: d.samples.map((s) => (s.key === sample.key ? { ...s, layers: renumber(next) } : s)) }));
    // แก้ layer จาก draft ล่าสุด (ผลจาก server ที่ตอบกลับช้าจะไม่ทับค่าที่พิมพ์ระหว่างรอ)
    const layerIndex = current;
    const setLayer = (patch: Partial<DraftLayer>) =>
        update((d) => ({
            ...d,
            samples: d.samples.map((s) => (s.key === sample.key
                ? { ...s, layers: renumber((s.layers.length ? s.layers : template()).map((l, i) => (i === layerIndex ? { ...l, ...patch } : l))) }
                : s)),
        }));

    const addSubLayer = () => {
        const next = [...layers];
        next.splice(current + 1, 0, emptyLayer(layers[current]?.role ?? null));
        setLayers(next);
        setSelected(current + 1);
    };
    const removeLayer = () => {
        if (!isEmptyLayer(layers[current]) && !window.confirm("ลบ layer นี้พร้อมสารและขั้นตอนทั้งหมด?")) return;
        setLayers(layers.filter((_, i) => i !== current));
        setSelected(Math.max(0, current - 1));
    };

    const others = draft.samples
        .map((s, index) => ({ index, sample: s }))
        .filter(({ sample: s }) => s.key !== sample.key && s.layers.length > 0);

    // เทียบกับ sample control: layer role เดียวกันที่ไม่เหมือนกัน
    const control = draft.samples.find((s) => s.is_control && s.key !== sample.key);
    const diffs = layers.map((l) => {
        if (!control) return false;
        // จับคู่ด้วย role + sub_order (position เลื่อนได้ถ้า sample หนึ่งมี layer เพิ่ม)
        const same = control.layers.find((c) => c.role === l.role && (c.sub_order ?? 0) === (l.sub_order ?? 0));
        return layerSignature(same) !== layerSignature(l);
    });

    return (
        <div className="flex flex-col gap-6 text-[#1F1F1F] max-w-[1120px]">
            <EntryHeader
                draft={draft}
                crumb={draft.paper.doi || "(ยังไม่ใส่ DOI)"}
                title={{ base: "Device ", accent: "Stack" }}
                step={[2]}
                restored={restored}
                onClear={async () => { await clear(); setActiveKey(null); setSelected(0); }}
            />

            <SampleTabs
                samples={draft.samples}
                activeKey={sample.key}
                onSelect={(key) => { setActiveKey(key); setSelected(0); }}
                badge={(s) => `${s.layers.filter((l) => !isEmptyLayer(l)).length} layers`}
            />

            {sample.layers.length === 0 && others.length > 0 && (
                <CopyFromSample others={others} onCopy={(next) => { setLayers(next); setSelected(0); }} />
            )}
                <div className="flex flex-wrap items-center gap-2 text-[14px]">
                    <span className="text-[#6B6B6B]">โครง stack:</span>
                    {(["pin", "nip"] as Architecture[]).map((arch) => {
                        const active = stackArchitecture(layers) === arch;
                        return (
                            <button
                                key={arch}
                                type="button"
                                aria-pressed={active}
                                onClick={() => { if (!active) { setLayers(applyTemplate(arch, layers)); setSelected(0); } }}
                                className={`min-h-9 px-3.5 rounded-[10px] font-semibold cursor-pointer ${active ? "bg-[#2F6FDB] text-white" : "border border-[#2F6FDB] bg-white text-[#2F6FDB]"}`}
                            >
                                {arch === "pin" ? "p-i-n" : "n-i-p"}
                            </button>
                        );
                    })}
                    <span className="text-[12px] text-[#6B6B6B]">สลับแล้วข้อมูลที่กรอกไว้ยังอยู่ (เรียงใหม่ตาม role)</span>
                </div>
                <div className="flex flex-wrap gap-5 items-start">
                    <LayerList
                        layers={layers}
                        materials={lookups.materials}
                        selected={current}
                        diffs={diffs}
                        onSelect={setSelected}
                        onAddSubLayer={addSubLayer}
                    />
                    <LayerDetail key={`${sample.key}:${current}`} layer={layers[current]} lookups={lookups} onChange={setLayer} onRemove={removeLayer} />
                </div>

            <div className="flex flex-wrap gap-3 justify-end">
                <Link
                    href={basePath}
                    className="inline-flex items-center h-11 px-5 rounded-[10px] border border-[#D4D4D4] bg-white text-[#2B2B2B] text-[14px]"
                >
                    ← ย้อนกลับ
                </Link>
                <button
                    type="button"
                    onClick={() => router.push(`${basePath}/results`)}
                    className="h-11 px-[22px] rounded-[10px] bg-[#2F6FDB] hover:bg-[#1F55B0] text-white font-semibold text-[14px] cursor-pointer"
                >
                    ถัดไป: Results →
                </button>
            </div>
        </div>
    );
}
