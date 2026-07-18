'use client';

import React, { useEffect, useState } from 'react';
import { CheckIcon } from '@/components/icons';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    isVisible,
    onClose,
    duration = 3000,
}) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const bgColorClass =
        type === 'success' ? 'bg-success' :
        type === 'error' ? 'bg-danger' :
        'bg-primary-500';

    return (
        <div className={`fixed bottom-[calc(1.5rem+70px)] left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl z-[200] animate-slideUp ${bgColorClass} text-white`}>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                {type === 'success' && <CheckIcon size={20} />}
                {type === 'error' && <span>✕</span>}
                {type === 'info' && <span>ℹ</span>}
            </div>
            <span className="text-sm font-medium">{message}</span>
            <button
                className="bg-transparent border-0 text-white/80 cursor-pointer p-1 text-xs transition-colors duration-200 hover:text-white"
                onClick={onClose}
            >
                ✕
            </button>
        </div>
    );
};

export default Toast;
