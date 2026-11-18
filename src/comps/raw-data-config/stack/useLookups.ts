import { useEffect, useState } from "react";
import { getMaterials, getProcessTypes, getProperties, getUnits } from "@/utils/api/lookup";
import { Lookups } from "@/utils/interface/lookup.types";

// dictionary แทบไม่เปลี่ยน -> โหลดครั้งเดียวต่อการเปิดเว็บ ใช้ร่วมกันทุกหน้า
let cache: Promise<Lookups> | null = null;

function loadLookups(): Promise<Lookups> {
    cache ??= Promise.all([getUnits(), getMaterials(), getProcessTypes(), getProperties()]).then(
        ([units, materials, processTypes, properties]) => {
            if (![units, materials, processTypes, properties].every((r) => r?.success)) throw new Error("load lookups failed");
            return { units: units.data, materials: materials.data, processTypes: processTypes.data, properties: properties.data };
        },
    );
    cache.catch(() => { cache = null; }); // โหลดไม่สำเร็จ -> ครั้งหน้าลองใหม่
    return cache;
}

/** unit, material, process type, property จากฐานข้อมูล (null = กำลังโหลด) */
export function useLookups() {
    const [lookups, setLookups] = useState<Lookups | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        loadLookups()
            .then((data) => { if (!cancelled) setLookups(data); })
            .catch(() => { if (!cancelled) setError(true); });
        return () => { cancelled = true; };
    }, []);

    return { lookups, error };
}
