'use client';

import React from 'react';
import { WalletIcon } from '@/components/icons';

interface ModalHeaderProps {
    onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose }) => {
    return (
        <div className="flex items-start justify-between mb-6 max-sm:mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <WalletIcon size={20} />
                </div>
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-900 m-0 max-sm:text-base">Catat Transaksi</h2>
                    <p className="text-xs text-gray-500 m-0 max-sm:hidden">Tambahkan transaksi baru dengan mudah</p>
                </div>
            </div>
            <button className="bg-transparent border-none text-gray-400 cursor-pointer p-1 rounded transition-all duration-200 hover:bg-gray-100 hover:text-gray-900" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
};
