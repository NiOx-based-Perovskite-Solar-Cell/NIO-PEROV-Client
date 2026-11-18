import { useEffect } from "react";
import { useRouter } from "next/router";
import { setToken } from "@/utils/authToken";
import { useNotification } from "@/comps/noti/notiComp";

// Server redirects here after Google login: /auth/callback#token=<jwt>
export default function AuthCallbackPage() {
    const router = useRouter();
    const { showNotification } = useNotification();

    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const token = params.get("token");

        if (token) {
            setToken(token);
            showNotification("สำเร็จ", "เข้าสู่ระบบสำเร็จ", "success");
            router.replace("/");
        } else {
            router.replace("/login?error=login_failed");
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
            กำลังเข้าสู่ระบบ...
        </div>
    );
}
