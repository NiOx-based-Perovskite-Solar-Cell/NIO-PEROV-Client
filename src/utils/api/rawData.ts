import { fetchDataApi } from "@/utils/callAPI"


// GET /raw-data ดึงข้อมูล raw data ทั้งหมด
export const getRawData = async () => {
    const data = await fetchDataApi(`GET`, "raw-data", {});
    return data;
}