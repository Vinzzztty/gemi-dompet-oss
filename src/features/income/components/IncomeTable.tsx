'use client';

import React from 'react';
import Lottie from 'lottie-react';
import { FileText, Edit2, Trash2 } from 'lucide-react';
import { FontAwesomeIconDisplay } from '@/components/ui/FontAwesomeIconDisplay';
import { formatCurrency } from '@/utils/format';
import type { IncomeTransaction } from '@/features/income/types/income';
import searchingAnimation from '../../../../public/animations/Searching.json';

interface IncomeTableProps {
  data: IncomeTransaction[];
  loading?: boolean;
  onEdit?: (transaction: IncomeTransaction) => void;
  onDelete?: (id: string) => void;
}

export const IncomeTable: React.FC<IncomeTableProps> = ({
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
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#4a90e2] rounded-full animate-spin mb-4"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="text-center py-12 text-gray-400">
          <div className="flex justify-center items-center mb-2">
            <Lottie 
              animationData={searchingAnimation} 
              loop={true}
              style={{ width: 200, height: 200 }}
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 m-0 mb-2">Belum ada transaksi</h3>
          <p className="text-sm m-0">Transaksi pemasukan akan muncul di sini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm max-md:p-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="bg-gray-50 p-4 text-left font-semibold text-gray-900 text-sm max-md:p-3">Tanggal</th>
              <th className="bg-gray-50 p-4 text-left font-semibold text-gray-900 text-sm max-md:p-3">Kategori</th>
              <th className="bg-gray-50 p-4 text-left font-semibold text-gray-900 text-sm max-md:p-3">Dompet</th>
              <th className="bg-gray-50 p-4 text-left font-semibold text-gray-900 text-sm max-md:p-3">Nama</th>
              <th className="bg-gray-50 p-4 text-left font-semibold text-gray-900 text-sm max-md:p-3">Nominal</th>
              <th className="bg-gray-50 p-4 text-left font-semibold text-gray-900 text-sm max-md:p-3">Catatan</th>
              {(onEdit || onDelete) && <th className="bg-gray-50 p-4 text-left font-semibold text-gray-900 text-sm max-md:p-3">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="p-4 border-t border-gray-100 text-gray-600 text-sm max-md:p-3">
                  <div className="flex items-center">
                    <span>{formatDate(transaction.tanggal)}</span>
                  </div>
                </td>
                <td className="p-4 border-t border-gray-100 text-gray-600 text-sm max-md:p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-blue-500 text-sm shrink-0">
                      <FontAwesomeIconDisplay
                        iconName={transaction.category?.icon || 'wallet'}
                        size="sm"
                      />
                    </div>
                    <span>{transaction.category?.name || 'Tidak ada kategori'}</span>
                  </div>
                </td>
                <td className="p-4 border-t border-gray-100 text-gray-600 text-sm max-md:p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{transaction.wallet?.namaDompet || 'Tanpa Dompet'}</span>
                      {transaction.wallet?.norek && (
                        <span className="text-xs text-gray-400">{transaction.wallet.norek}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 border-t border-gray-100 text-gray-600 text-sm max-md:p-3">
                  <div className="font-semibold text-gray-900 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {transaction.nama || transaction.category?.name || '-'}
                  </div>
                </td>
                <td className="p-4 border-t border-gray-100 text-gray-600 text-sm max-md:p-3">
                  <span className="font-semibold text-green-500">{formatCurrency(transaction.nominal)}</span>
                </td>
                <td className="p-4 border-t border-gray-100 text-gray-600 text-sm max-md:p-3">
                  <div className="flex items-center gap-2 text-gray-600 max-w-[300px] max-md:max-w-[150px]">
                    {transaction.catatan ? (
                      <>
                        <FileText size={14} className="shrink-0" />
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{transaction.catatan}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                {(onEdit || onDelete) && (
                  <td className="p-4 border-t border-gray-100 text-gray-600 text-sm max-md:p-3">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(transaction)}
                          className="p-2 border-none bg-transparent cursor-pointer rounded-md transition-all flex items-center justify-center text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(transaction.id)}
                          className="p-2 border-none bg-transparent cursor-pointer rounded-md transition-all flex items-center justify-center text-red-500 hover:bg-red-50"
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

export default IncomeTable;
