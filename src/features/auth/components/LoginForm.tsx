'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface LoginFormProps {
    onLoginSuccess?: () => void;
    redirectTo?: string;
}

export default function LoginForm({
    onLoginSuccess,
    redirectTo = '/'
}: LoginFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Login gagal');
                return;
            }

            if (data.data?.user) {
                localStorage.setItem('user', JSON.stringify(data.data.user));
            }

            toast.success(`Selamat datang, ${data.data.user.fullName}!`);

            if (onLoginSuccess) onLoginSuccess();

            setTimeout(() => {
                router.push(redirectTo);
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
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

    return (
        <div className="w-full max-w-[500px] mx-auto bg-white p-8 rounded-[20px] shadow-xl animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h1 className="text-[1.75rem] font-bold mb-2 text-[#1A1A2E]">
                    Selamat Datang Kembali
                </h1>
                <p className="text-sm text-gray-500">
                    Masuk ke akun Gemi Dompet Anda
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-5">
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
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        placeholder="nama@email.com"
                        className={inputClasses}
                    />
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-[#1A1A2E]"
                        >
                            Password
                        </label>
                        <a
                            href="/forgot-password"
                            className="text-xs text-[#4176ED] font-medium hover:underline decoration-[#4176ED]"
                        >
                            Lupa Password?
                        </a>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            placeholder="Masukkan password"
                            className={`${inputClasses} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 p-1 hover:text-gray-600 transition-colors"
                        >
                            {/* Icon Mata */}
                            {showPassword ? (
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
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 text-base font-semibold text-white bg-[#4176ED] rounded-xl hover:bg-[#3160D8] transition-all shadow-[0_4px_12px_rgba(65,118,237,0.4)] hover:shadow-[0_6px_16px_rgba(65,118,237,0.5)] hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                >
                    {isLoading ? 'Masuk...' : 'Masuk'}
                </button>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Belum punya akun?{' '}
                        <a
                            href="/register"
                            className="text-[#4176ED] font-semibold hover:underline decoration-[#4176ED]"
                        >
                            Daftar sekarang
                        </a>
                    </p>
                </div>
            </form>
        </div>
    );
}
