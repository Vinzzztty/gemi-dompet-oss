'use client';

import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, logout } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function ProfileDropdown() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [user, setUser] = useState<{ fullName: string; email: string } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Get user data from localStorage
        const userData = getCurrentUser();
        setUser(userData);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleLogoutClick = () => {
        setShowLogoutDialog(true);
    };

    const handleConfirmLogout = () => {
        setShowLogoutDialog(false);
        setIsOpen(false);
        toast.success('Logout berhasil. Sampai jumpa!');
        setTimeout(() => {
            logout();
            router.push('/login');
        }, 1000);
    };

    const handleCancelLogout = () => {
        setShowLogoutDialog(false);
    };

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Profile Button */}
            <button
                className="w-10 h-10 rounded-full bg-blue-600 text-white border-none cursor-pointer text-sm font-semibold flex items-center justify-center transition-all hover:bg-blue-700 hover:scale-105"
                onClick={() => setIsOpen(!isOpen)}
            >
                {user ? getInitials(user.fullName) : 'U'}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-[calc(100%+12px)] right-0 w-[280px] bg-white rounded-3xl shadow-xl z-[1000] overflow-hidden animate-in fade-in duration-200 ring-1 ring-black/5">
                    {/* User Info Header */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white flex items-center gap-3 rounded-t-3xl">
                        <div className="w-12 h-12 rounded-full bg-blue-400/40 flex items-center justify-center text-lg font-bold backdrop-blur-sm">
                            {user ? getInitials(user.fullName) : 'U'}
                        </div>
                        <div className="flex-1">
                            <h3 className="m-0 text-base font-bold leading-tight">{user?.fullName || 'User'}</h3>
                            <p className="m-0 text-xs opacity-90 font-normal">{user?.email || 'user@example.com'}</p>
                        </div>
                    </div>



                    {/* Menu Items */}
                    <div className="py-3 px-4 flex flex-col gap-0">
                        <button
                            className="w-full py-3 px-2 bg-transparent border-none cursor-pointer transition-all flex items-center gap-3 text-sm text-gray-800 font-medium hover:bg-gray-50 rounded-lg"
                            onClick={() => {
                                router.push('/');
                                setIsOpen(false);
                            }}
                        >
                            <span className="text-xl flex items-center justify-center w-7">🏠</span>
                            <span className="flex-1 text-left font-medium">Home</span>
                            <span className="text-gray-300 text-xl font-light">›</span>
                        </button>

                        <button
                            className="w-full py-3 px-2 bg-transparent border-none cursor-pointer transition-all flex items-center gap-3 text-sm text-gray-800 font-medium hover:bg-gray-50 rounded-lg"
                            onClick={() => {
                                router.push('/report');
                                setIsOpen(false);
                            }}
                        >
                            <span className="text-xl flex items-center justify-center w-7">📊</span>
                            <span className="flex-1 text-left font-medium">Laporan</span>
                            <span className="text-gray-300 text-xl font-light">›</span>
                        </button>

                        <button
                            className="w-full py-3 px-2 bg-transparent border-none cursor-pointer transition-all flex items-center gap-3 text-sm text-gray-800 font-medium hover:bg-gray-50 rounded-lg"
                            onClick={() => {
                                router.push('/group-expense');
                                setIsOpen(false);
                            }}
                        >
                            <span className="text-xl flex items-center justify-center w-7">🤝</span>
                            <span className="flex-1 text-left font-medium">Split Bill</span>
                            <span className="text-gray-300 text-xl font-light">›</span>
                        </button>
                    </div>



                    {/* Logout Button */}
                    <div className="px-4 pb-4">
                        <button className="w-full py-2.5 bg-white border-2 border-orange-500 rounded-full text-orange-600 text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2 hover:bg-orange-50" onClick={handleLogoutClick}>
                            🚪 Keluar
                        </button>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Dialog */}
            {showLogoutDialog && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center animate-in fade-in duration-200 backdrop-blur-sm" onClick={handleCancelLogout}>
                    <div className="bg-white rounded-2xl p-8 max-w-md w-[90%] shadow-2xl animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="text-[3.5rem] mb-4 block">⚠️</div>
                            <h3 className="m-0 mb-2 text-2xl font-bold text-gray-900">Konfirmasi Logout</h3>
                            <p className="m-0 text-gray-600">Apakah Anda yakin ingin keluar?</p>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 py-3 rounded-xl text-[15px] font-semibold cursor-pointer transition-all bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100" onClick={handleCancelLogout}>
                                Batal
                            </button>
                            <button className="flex-1 py-3 rounded-xl text-[15px] font-semibold cursor-pointer transition-all bg-red-500 border-none text-white shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(239,68,68,0.3)]" onClick={handleConfirmLogout}>
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfileDropdown;
