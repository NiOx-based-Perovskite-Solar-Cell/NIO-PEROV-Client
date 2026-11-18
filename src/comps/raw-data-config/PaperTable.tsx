import React from "react";
import Link from "next/link";
import { PaperListItem, PaperStatus } from "@/utils/interface/paper.types";

const STATUS_STYLE: Record<PaperStatus, { label: string; bg: string; color: string }> = {
    draft: { label: "Draft", bg: "#F0F0F0", color: "#3D3D3D" },
    review: { label: "รอตรวจ", bg: "#FFF4EA", color: "#9A450C" },
    published: { label: "Published", bg: "#E8F5EC", color: "#1E6B3A" },
};

// ปุ่มท้ายแถวเปลี่ยนตามสถานะ
const ACTION_LABEL: Record<PaperStatus, string> = {
    draft: "กรอกต่อ →",
    review: "ตรวจ →",
    published: "ดู",
};

interface PaperTableProps {
    papers: PaperListItem[];
    loading: boolean;
}

export function PaperTable({ papers, loading }: PaperTableProps) {
    const th = "px-5 py-3 text-[12px] font-semibold";
    const td = "px-5 py-3.5";

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-[14px]">
                <thead>
                    <tr className="text-left text-[#6B6B6B]">
                        <th className={th}>DOI</th>
                        <th className={th}>Journal</th>
                        <th className={th}>Samples</th>
                        <th className={th}>ที่มา</th>
                        <th className={th}>สถานะ</th>
                        <th className={th}><span className="sr-only">การทำงาน</span></th>
                    </tr>
                </thead>
                <tbody>
                    {papers.map((paper) => {
                        const status = STATUS_STYLE[paper.status];
                        const isExcel = paper.source_type === "excel";

                        return (
                            <tr key={paper.paper_id} className="border-t border-[#F0F0F0]">
                                <td className={`${td} font-mono text-[13px]`}>
                                    {paper.doi ?? <span className="text-[#6B6B6B]">ไม่มี DOI</span>}
                                    {isExcel && paper.source.length > 1 && (
                                        <div className="font-sans text-[12px] text-[#6B6B6B]">
                                            รวมจาก {paper.source.length} ชื่อไฟล์
                                        </div>
                                    )}
                                </td>
                                <td className={td}>{paper.journal ?? "-"}</td>
                                <td className={td}>{paper.sample_count}</td>
                                <td className={`${td} text-[#4A4A4A]`}>
                                    {isExcel ? "Excel import" : "กรอกผ่าน UI"}
                                </td>
                                <td className={td}>
                                    <span
                                        className="px-2.5 py-[3px] rounded-full text-[12px] font-semibold"
                                        style={{ backgroundColor: status.bg, color: status.color }}
                                    >
                                        {status.label}
                                    </span>
                                </td>
                                <td className={`${td} text-right`}>
                                    <Link
                                        href={`/dashboard/raw-data/${paper.paper_id}`}
                                        className={`text-[#2F6FDB] hover:text-[#1F55B0] ${paper.status === "published" ? "" : "font-semibold"}`}
                                    >
                                        {ACTION_LABEL[paper.status]}
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}

                    {!loading && papers.length === 0 && (
                        <tr className="border-t border-[#F0F0F0]">
                            <td colSpan={6} className="px-5 py-12 text-center text-[#6B6B6B]">
                                ไม่พบ paper
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
