// DOI แบบเดียวกับที่ server เก็บ: ตัด https://doi.org/ และ doi:, ตัวเล็ก
// ชื่อแบบไฟล์ (10_1002_advs_202309111) แปลงกลับเป็น 10.1002/advs.202309111
export function normalizeDoi(input: string): string {
    const doi = input
        .trim()
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
        .replace(/^doi:\s*/i, "")
        .toLowerCase();
    if (doi.includes("/")) return doi;

    const fileStyle = /^10_(\d{4,9})_?(.+)$/.exec(doi);
    return fileStyle ? `10.${fileStyle[1]}/${fileStyle[2].replace(/_/g, ".")}` : doi;
}
