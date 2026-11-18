import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AuthLayout, { GoogleButton, AuthError, AUTH_COLORS, getGoogleLoginUrl } from "@/comps/layouts/AuthLayout";

// error codes sent back by the server's /auth/google/callback
const LOGIN_ERRORS: Record<string, string> = {
    access_denied: "ยกเลิกการเข้าสู่ระบบด้วย Google",
    invalid_state: "เซสชันการเข้าสู่ระบบหมดอายุ กรุณาลองใหม่อีกครั้ง",
    inactive: "บัญชีผู้ใช้นี้ถูกระงับการใช้งาน",
};

export default function LoginPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    const errorCode = router.query.error;
    const error =
        typeof errorCode === "string" && errorCode
            ? LOGIN_ERRORS[errorCode] || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
            : "";

    const handleGoogleLogin = () => {
        setLoading(true);
        window.location.href = getGoogleLoginUrl();
    };

    return (
        <AuthLayout
            title="เข้าสู่ระบบ | NIO-PEROV"
            eyebrow="NiOx-based Perovskite Solar Cell Database"
            heading={
                <>
                    Sign{" "}
                    <em className="italic font-normal" style={{ color: AUTH_COLORS.accent }}>
                        in
                    </em>
                </>
            }
            subtitle="เข้าสู่ระบบเพื่อจัดการข้อมูลงานวิจัยของคุณ"
            // footer={
            //     <>
            //         ยังไม่มีบัญชีผู้ใช้?{" "}
            //         <Link href="/register" className="font-medium underline underline-offset-2" style={{ color: AUTH_COLORS.accent }}>
            //             สร้างบัญชีใหม่
            //         </Link>
            //     </>
            // }
        >
            <div className="flex flex-col gap-4">
                <AuthError message={error} />

                <GoogleButton onClick={handleGoogleLogin} disabled={loading}>
                    {loading ? "กำลังไปที่ Google..." : "เข้าสู่ระบบด้วย Google"}
                </GoogleButton>
            </div>
        </AuthLayout>
    );
}
