'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@/components/icons';

interface NotificationDropdownProps {
    onClose?: () => void;
}

const notifications = [
    {
        id: '1',
        title: 'Pengeluaran tinggi',
        message: 'Pengeluaran bulan ini 30% lebih tinggi dari bulan lalu',
        time: '2 jam lalu',
        isRead: false,
        type: 'warning',
    },
    {
        id: '2',
        title: 'Target tercapai',
        message: 'Selamat! Anda berhasil mencapai target tabungan bulan ini',
        time: '1 hari lalu',
        isRead: true,
        type: 'success',
    },
    {
        id: '3',
        title: 'Reminder',
        message: 'Jangan lupa catat pengeluaran hari ini',
        time: '2 hari lalu',
        isRead: true,
        type: 'info',
    },
];

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <BellIcon size={20} />
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h3 className="text-[15px] font-semibold m-0">Notifikasi</h3>
                        <button className="bg-transparent border-none text-blue-600 text-xs cursor-pointer p-0 hover:underline">Tandai semua dibaca</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex gap-3 p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 last:border-b-0 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                            >
                                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                                    notification.type === 'warning' ? 'bg-amber-500' :
                                    notification.type === 'success' ? 'bg-green-500' :
                                    'bg-blue-600'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[13px] font-semibold m-0 mb-1 text-gray-900">{notification.title}</h4>
                                    <p className="text-xs text-gray-600 m-0 mb-1 leading-relaxed">{notification.message}</p>
                                    <span className="text-[11px] text-gray-400">{notification.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full p-3 bg-transparent border-none border-t border-gray-100 text-blue-600 text-[13px] font-medium cursor-pointer transition-all hover:bg-gray-50">Lihat semua notifikasi</button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
