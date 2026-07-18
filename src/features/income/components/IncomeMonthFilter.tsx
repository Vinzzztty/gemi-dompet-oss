'use client';

import React from 'react';
import { Filter } from 'lucide-react';

interface IncomeMonthFilterProps {
  selectedMonth: number | null;
  selectedYear: number;
  onMonthChange: (month: number | null) => void;
  onYearChange: (year: number) => void;
}

export const IncomeMonthFilter: React.FC<IncomeMonthFilterProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}) => {
  const months = [
    { value: null, label: 'Semua Bulan' },
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 mt-6">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-900">
        <Filter size={18} />
        <span>Filter</span>
      </div>
      <div className="flex gap-3 max-[480px]:flex-col">
        <select
          value={selectedMonth ?? ''}
          onChange={(e) => onMonthChange(e.target.value ? parseInt(e.target.value) : null)}
          className="flex-1 p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white cursor-pointer transition-all hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 max-[480px]:w-full"
        >
          {months.map((month) => (
            <option key={month.value ?? 'all'} value={month.value ?? ''}>
              {month.label}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="flex-1 p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white cursor-pointer transition-all hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 max-[480px]:w-full"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
};

export default IncomeMonthFilter;
