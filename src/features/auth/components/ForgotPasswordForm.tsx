'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Terjadi kesalahan');
                return;
            }

            setIsSuccess(true);
            toast.success(data.message);

        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = `
        w-full p-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 
        transition-all duration-200 outline-none bg-white
        focus:border-[#4176ED] focus:ring-4 focus:ring-[#4176ED]/10 
        disabled:bg-gray-50 disabled:cursor-not-allowed
        [&:-webkit-autofill]:shadow-[0_0_0_100px_white_inset] 
        [&:-webkit-autofill]:-webkit-text-fill-color-gray-900
    `;

    if (isSuccess) {
        return (
            <div className="w-full max-w-[500px] mx-auto bg-white p-8 rounded-[20px] shadow-xl animate-in fade-in duration-500">
                <div className="text-center">
                    {/* Success Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="white"
                            className="w-10 h-10"
                        >
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <h1 className="text-[1.75rem] font-bold mb-3 text-[#1A1A2E]">
                        Email Terkirim! 📧
                    </h1>

                    <p className="text-sm text-gray-600 mb-2">
                        Kami telah mengirim link reset password ke:
                    </p>

                    <p className="text-base font-semibold text-[#4176ED] mb-6">
                        {email}
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            💡 <strong>Catatan:</strong> Cek folder spam jika email tidak muncul dalam beberapa menit. Link berlaku selama 1 jam.
                        </p>
                    </div>

                    <Link
                        href="/login"
                        className="inline-block w-full py-3.5 px-4 text-base font-semibold text-white bg-[#4176ED] rounded-xl hover:bg-[#3160D8] transition-all shadow-[0_4px_12px_rgba(65,118,237,0.4)] hover:shadow-[0_6px_16px_rgba(65,118,237,0.5)] hover:-translate-y-[1px] active:translate-y-0"
                    >
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[500px] mx-auto bg-white p-8 rounded-[20px] shadow-xl animate-in fade-in duration-500">
            <div className="text-center mb-8">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#4176ED] to-[#3160D8] rounded-full flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="white"
                        className="w-8 h-8"
                    >
                        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                    </svg>
                </div>

                <h1 className="text-[1.75rem] font-bold mb-2 text-[#1A1A2E]">
                    Lupa Password?
                </h1>
                <p className="text-sm text-gray-500">
                    Masukkan email Anda dan kami akan mengirimkan link untuk reset password
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2 text-[#1A1A2E]"
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="nama@email.com"
                        className={inputClasses}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 text-base font-semibold text-white bg-[#4176ED] rounded-xl hover:bg-[#3160D8] transition-all shadow-[0_4px_12px_rgba(65,118,237,0.4)] hover:shadow-[0_6px_16px_rgba(65,118,237,0.5)] hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                >
                    {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                </button>

                <div className="mt-6 text-center">
                    <Link
                        href="/login"
                        className="text-sm text-gray-600 hover:text-[#4176ED] transition-colors inline-flex items-center gap-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                        >
                            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                        </svg>
                        Kembali ke Login
                    </Link>
                </div>
            </form>
        </div>
    );
}
