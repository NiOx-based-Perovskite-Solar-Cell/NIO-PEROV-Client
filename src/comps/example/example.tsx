// LoginPage.tsx
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';




const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [token, setToken] = useState('');

    const router = useRouter();

    const [otpPage, setOtpPage] = useState<boolean>(false);

    const [verificationResult, setVerificationResult] = useState<boolean | null>(null);

    useEffect(() => {
        console.log("Router pathname changed:", router.pathname);

        if (router.pathname == "/registration/login" && token) {
            router.push("/registration/home");
        }
    }, [router.pathname]);


    const handleVerificationComplete = (verified: boolean) => {
        setVerificationResult(verified);
    };


    const isLargerThanSm = window.innerWidth >= 640; // Example breakpoint for small screens

    return (
        <div className="flex min-h-screen bg-linear-to-br from-[#FFFFFF] to-[#FFFFFF] relative overflow-hidden">

            {/* Login Form */}
            {!otpPage ? (
                <div className={`
          flex flex-col justify-center w-full z-10
          ${isLargerThanSm ? 'items-center' : 'items-center'}
       `}>
                    <div className={`
            flex flex-col w-full max-w-md p-8 rounded-lg
            ${isLargerThanSm ? 'mr-0' : 'mr-0'}
          `}>
                        <h1 className="text-2xl font-bold text-center mb-8 text-[#000000]">การเข้าสู่ระบบ</h1>

                    </div>
                </div>
            ) : (
                <></>
            )}
        </div>
    );
};

export default AdminLoginPage;