'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('Token tidak valid');
            router.push('/login');
        }
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Password tidak cocok');
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Terjadi kesalahan');
                return;
            }

            toast.success(data.message);

            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error) {
            console.error('Reset password error:', error);
            toast.error('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const inputClasses = `
        w-full p-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 
        transition-all duration-200 outline-none bg-white
        focus:border-[#4176ED] focus:ring-4 focus:ring-[#4176ED]/10 
        disabled:bg-gray-50 disabled:cursor-not-allowed
        [&:-webkit-autofill]:shadow-[0_0_0_100px_white_inset] 
        [&:-webkit-autofill]:-webkit-text-fill-color-gray-900
    `;

    const EyeIcon = ({ show }: { show: boolean }) => (
        show ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
            </svg>
        )
    );

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
                        <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 00-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 00-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 00.75-.75v-1.5h1.5A.75.75 0 009 19.5V18h1.5a.75.75 0 00.53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1015.75 1.5zm0 3a.75.75 0 000 1.5A2.25 2.25 0 0118 8.25a.75.75 0 001.5 0 3.75 3.75 0 00-3.75-3.75z" clipRule="evenodd" />
                    </svg>
                </div>

                <h1 className="text-[1.75rem] font-bold mb-2 text-[#1A1A2E]">
                    Buat Password Baru
                </h1>
                <p className="text-sm text-gray-500">
                    Masukkan password baru untuk akun Anda
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-5">
                    <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium mb-2 text-[#1A1A2E]"
                    >
                        Password Baru
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            placeholder="Minimal 6 karakter"
                            className={`${inputClasses} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 p-1 hover:text-gray-600 transition-colors"
                        >
                            <EyeIcon show={showPassword} />
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium mb-2 text-[#1A1A2E]"
                    >
                        Konfirmasi Password
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            placeholder="Ulangi password baru"
                            className={`${inputClasses} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isLoading}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 p-1 hover:text-gray-600 transition-colors"
                        >
                            <EyeIcon show={showConfirmPassword} />
                        </button>
                    </div>
                </div>

                {/* Password Requirements */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-gray-700 mb-2 font-medium">Password harus:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center gap-2">
                            <span className={formData.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'}>
                                {formData.newPassword.length >= 6 ? '✓' : '○'}
                            </span>
                            Minimal 6 karakter
                        </li>
                        <li className="flex items-center gap-2">
                            <span className={formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '' ? 'text-green-600' : 'text-gray-400'}>
                                {formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '' ? '✓' : '○'}
                            </span>
                            Password cocok
                        </li>
                    </ul>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 text-base font-semibold text-white bg-[#4176ED] rounded-xl hover:bg-[#3160D8] transition-all shadow-[0_4px_12px_rgba(65,118,237,0.4)] hover:shadow-[0_6px_16px_rgba(65,118,237,0.5)] hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                >
                    {isLoading ? 'Mereset Password...' : 'Reset Password'}
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
