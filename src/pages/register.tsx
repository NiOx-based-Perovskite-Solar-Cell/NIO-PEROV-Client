import { useState } from "react";
import Link from "next/link";
import AuthLayout, { GoogleButton, AUTH_COLORS, getGoogleLoginUrl } from "@/comps/layouts/AuthLayout";

// Sign-up is the same Google flow as login: the first sign-in creates the account (role = user)
export default function RegisterPage() {
    const [loading, setLoading] = useState(false);

    const handleGoogleRegister = () => {
        setLoading(true);
        window.location.href = getGoogleLoginUrl();
    };

    return (
        <AuthLayout
            title="สร้างบัญชีใหม่ | NIO-PEROV"
            eyebrow="NiOx-based Perovskite Solar Cell Database"
            heading={
                <>
                    Create{" "}
                    <em className="italic font-normal" style={{ color: AUTH_COLORS.accent }}>
                        account
                    </em>
                </>
            }
            subtitle="สมัครสมาชิกเพื่อเริ่มจัดเก็บและจัดการข้อมูลงานวิจัย"
            footer={
                <>
                    มีบัญชีผู้ใช้อยู่แล้ว?{" "}
                    <Link href="/login" className="font-medium underline underline-offset-2" style={{ color: AUTH_COLORS.accent }}>
                        เข้าสู่ระบบ
                    </Link>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <GoogleButton onClick={handleGoogleRegister} disabled={loading}>
                    {loading ? "กำลังไปที่ Google..." : "สมัครด้วย Google"}
                </GoogleButton>
            </div>
        </AuthLayout>
    );
}
