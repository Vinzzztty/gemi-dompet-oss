'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@/components/icons';
import { getMonthName } from '@/utils/format';

interface ReportHeaderProps {
  currentMonth: number;
  currentYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  currentMonth,
  currentYear,
  onPrevMonth,
  onNextMonth,
}) => {
  return (
    <header className="flex items-center justify-between py-4 px-6 bg-white rounded-xl mb-6 max-sm:relative max-sm:flex-row max-sm:items-center max-sm:justify-start max-sm:py-3 max-sm:px-4 max-sm:min-h-[56px]">
      <div className="flex items-center gap-3 max-sm:w-auto max-sm:flex-[0] max-sm:min-w-auto max-sm:z-[2]">
        <div className="flex flex-col max-sm:hidden">
          <h1 className="text-lg font-semibold text-gray-900 m-0 leading-tight">Laporan Bulanan</h1>
          <p className="text-xs text-gray-600 m-0">Analisis keuangan detail</p>
        </div>
      </div>
      <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 max-sm:absolute max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:justify-center max-sm:w-auto max-sm:m-0 max-sm:z-[1]">
        <button className="btn btn-icon btn-ghost" onClick={onPrevMonth}>
          <ChevronLeftIcon size={18} />
        </button>
        <div className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-gray-900 min-w-[120px] justify-center max-sm:px-2 max-sm:text-sm">
          <CalendarIcon size={16} />
          <span className="max-sm:inline max-sm:whitespace-nowrap">{getMonthName(currentMonth).slice(0, 3)} {currentYear}</span>
        </div>
        <button className="btn btn-icon btn-ghost" onClick={onNextMonth}>
          <ChevronRightIcon size={18} />
        </button>
      </div>
    </header>
  );
};

export default ReportHeader;
