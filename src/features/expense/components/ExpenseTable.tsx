'use client';

import React from 'react';
import Lottie from 'lottie-react';
import { FileText, Edit2, Trash2 } from 'lucide-react';
import { FontAwesomeIconDisplay } from '@/components/ui/FontAwesomeIconDisplay';
import { formatCurrency } from '@/utils/format';
import { ExpenseTransaction } from '@/features/expense/types/expense';
import searchingAnimation from '../../../../public/animations/Searching.json';

interface ExpenseTableProps {
  data: ExpenseTransaction[];
  loading?: boolean;
  onEdit?: (transaction: ExpenseTransaction) => void;
  onDelete?: (id: string) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex justify-center items-center mb-2">
            <Lottie 
              animationData={searchingAnimation} 
              loop={true}
              style={{ width: 200, height: 200 }}
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 m-0 mb-2">Belum Ada Pengeluaran</h3>
          <p className="text-sm text-gray-500 m-0">Transaksi pengeluaran akan muncul di sini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm animate-in fade-in duration-300 max-md:p-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 px-4 text-left text-[0.813rem] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Tanggal</th>
              <th className="py-3 px-4 text-left text-[0.813rem] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Kategori</th>
              <th className="py-3 px-4 text-left text-[0.813rem] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Dompet</th>
              <th className="py-3 px-4 text-left text-[0.813rem] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Nama</th>
              <th className="py-3 px-4 text-left text-[0.813rem] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Catatan</th>
              <th className="py-3 px-4 text-right text-[0.813rem] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Nominal</th>
              {(onEdit || onDelete) && <th className="py-3 px-4 text-center text-[0.813rem] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((transaction) => (
              <tr key={transaction.id} className="border-b border-gray-200 transition-colors duration-200 hover:bg-gray-50 last:border-b-0">
                <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span>{formatDate(transaction.tanggal)}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {transaction.category?.icon && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center text-red-600 shrink-0 max-md:w-7 max-md:h-7">
                        <FontAwesomeIconDisplay iconName={transaction.category.icon} />
                      </div>
                    )}
                    <span>{transaction.category?.name || 'Tanpa Kategori'}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{transaction.wallet?.namaDompet || 'Tanpa Dompet'}</span>
                      {transaction.wallet?.norek && (
                        <span className="text-xs text-gray-400">{transaction.wallet.norek}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                  <span className="font-medium text-gray-900">{transaction.nama}</span>
                </td>
                <td className="p-4 text-sm text-gray-900">
                  {transaction.catatan ? (
                    <div className="flex items-center gap-2 text-gray-500 text-[0.813rem]">
                      <FileText size={14} className="shrink-0" />
                      <span className="max-w-[200px] truncate max-md:max-w-[100px]">{transaction.catatan}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-4 text-sm text-right whitespace-nowrap">
                  <span className="font-semibold text-[0.938rem] text-red-600">{formatCurrency(transaction.nominal)}</span>
                </td>
                {(onEdit || onDelete) && (
                  <td className="p-4 text-sm whitespace-nowrap">
                    <div className="flex gap-2 justify-center">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(transaction)}
                          className="p-2 border-none rounded-lg bg-transparent cursor-pointer transition-all duration-200 flex items-center justify-center text-blue-500 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(transaction.id)}
                          className="p-2 border-none rounded-lg bg-transparent cursor-pointer transition-all duration-200 flex items-center justify-center text-red-600 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
