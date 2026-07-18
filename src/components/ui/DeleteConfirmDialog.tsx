'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  loading?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus transaksi ini?',
  itemName,
  loading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[450px] animate-in slide-in-from-bottom-5 duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 relative">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 m-0 flex-1">{title}</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-transparent border-none text-gray-400 cursor-pointer p-2 rounded-lg transition-all hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-[0.938rem] text-gray-600 m-0 mb-4 leading-relaxed">{message}</p>
          {itemName && (
            <div className="bg-gray-50 p-3 px-4 rounded-lg mb-4 text-sm text-gray-900 font-medium border border-gray-100">
              {itemName}
            </div>
          )}
          <p className="text-[0.813rem] text-red-600 m-0 font-medium">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg text-[0.938rem] font-medium cursor-pointer transition-all border-none flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-lg text-[0.938rem] font-medium cursor-pointer transition-all border-none flex items-center justify-center bg-red-600 text-white shadow-lg shadow-red-500/20 hover:-translate-y-px hover:shadow-xl hover:shadow-red-500/30 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
};
