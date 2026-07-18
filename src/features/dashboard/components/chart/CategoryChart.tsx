'use client';

import React, { useState } from 'react';
import { CategorySpending } from '@/types';
import { formatNumber } from '@/utils/format';

interface CategoryChartProps {
  data: CategorySpending[];
  selectedMonth: number;
  selectedYear: number;
  spendingType: 'income' | 'expense';
  onFilterChange: (month: number, year: number) => void;
  onTypeChange: (type: 'income' | 'expense') => void;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ 
  data,
  selectedMonth,
  selectedYear,
  spendingType,
  onFilterChange,
  onTypeChange
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Find max value for scaling
  const maxAmount = Math.max(...data.map(item => item.amount));

  // Calculate scale markers
  const scaleMarkers = [0, 150000, 300000, 450000, 600000];

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 m-0">
            {spendingType === 'income' ? 'Pemasukan per Kategori' : 'Pengeluaran per Kategori'}
          </h3>
          <p className="text-xs text-gray-600 mt-1">Total Keseluruhan</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
            {/* Type Dropdown */}
            <select
              value={spendingType}
              onChange={(e) => onTypeChange(e.target.value as 'income' | 'expense')}
              className="bg-transparent border-none text-gray-700 text-xs font-medium focus:ring-0 cursor-pointer p-1 outline-none"
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>

            <div className="w-[1px] h-4 bg-gray-300"></div>

            {/* Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => onFilterChange(Number(e.target.value), selectedYear)}
              className="bg-transparent border-none text-gray-700 text-xs font-medium focus:ring-0 cursor-pointer p-1 outline-none"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
            
            <div className="w-[1px] h-4 bg-gray-300"></div>
            
            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => onFilterChange(selectedMonth, Number(e.target.value))}
              className="bg-transparent border-none text-gray-700 text-xs font-medium focus:ring-0 cursor-pointer p-1 outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
          <div className="w-20 h-20 mb-4 bg-gray-50 rounded-full flex items-center justify-center animate-bounce duration-[2000ms]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
              <path d="M9 10h.01" />
              <path d="M15 10h.01" />
              <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">Belum ada transaksi</p>
          <p className="text-xs text-gray-400 mt-1">Coba pilih periode atau filter lain</p>
        </div>
      ) : (
        <>
          <div className={`max-h-[560px] mb-4 scroll-smooth scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 ${
            data.length > 8 ? 'overflow-y-auto overflow-x-hidden pr-2' : 'overflow-visible'
          }`}>
            <div className="relative">
              {data.map((item, index) => (
                <div
                  key={item.category}
                  className="flex items-center gap-3 mb-4 p-2 -mx-2 rounded-lg transition-all cursor-pointer hover:bg-gray-50 last:mb-0 group"
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="w-20 text-xs text-gray-600 shrink-0 text-right transition-all group-hover:text-gray-900 group-hover:font-medium">{item.name}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-visible">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded transition-all origin-left animate-[growBar_0.6s_ease-out_forwards] group-hover:brightness-110 group-hover:shadow-[0_0_12px_rgba(74,144,226,0.4)]"
                      style={{
                        width: `${(item.amount / (maxAmount * 1.2)) * 100}%`,
                        animationDelay: `${index * 0.1}s`,
                        background: item.color || undefined
                      }}
                    />
                    {hoveredCategory === item.category && (
                      <div className={`absolute left-1/2 -translate-x-1/2 bg-gray-800 text-white py-2 px-3 rounded text-xs font-semibold whitespace-nowrap z-10 animate-in fade-in duration-150 shadow-lg ${
                        index === 0 
                          ? 'top-[calc(100%+8px)] after:content-[\'\'] after:absolute after:-top-1.5 after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-b-gray-800' 
                          : '-top-9 after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-gray-800'
                      }`}>
                        Rp {formatNumber(item.amount)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pl-[92px]">
            {scaleMarkers.map((value) => (
              <span key={value} className="text-[10px] text-gray-400 max-[480px]:text-[8px] max-[480px]:even:hidden">
                {value === 0 ? '0' : `${value / 1000}rb`}
              </span>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .category-chart {
          background-color: var(--bg-card);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          box-shadow: var(--shadow);
        }

        .chart-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .chart-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: var(--space-1) 0 var(--space-4) 0;
        }

        .chart-scroll-container {
          max-height: 560px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: var(--space-2);
          margin-bottom: var(--space-4);
          scroll-behavior: smooth;
        }

        /* Custom scrollbar styling */
        .chart-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .chart-scroll-container::-webkit-scrollbar-track {
          background: var(--gray-100);
          border-radius: var(--radius);
        }

        .chart-scroll-container::-webkit-scrollbar-thumb {
          background: var(--gray-300);
          border-radius: var(--radius);
        }

        .chart-scroll-container::-webkit-scrollbar-thumb:hover {
          background: var(--gray-400);
        }

        .chart-container {
          position: relative;
        }

        .chart-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
          padding: var(--space-2);
          margin-left: calc(-1 * var(--space-2));
          margin-right: calc(-1 * var(--space-2));
          border-radius: var(--radius-lg);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .chart-row:hover {
          background-color: var(--gray-50);
        }

        .chart-row:last-of-type {
          margin-bottom: 0;
        }

        .chart-label {
          width: 80px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          flex-shrink: 0;
          text-align: right;
          transition: all 0.2s ease;
        }

        .chart-row:hover .chart-label {
          color: var(--text-primary);
          font-weight: 500;
        }

        .chart-bar-container {
          flex: 1;
          height: 24px;
          background-color: var(--gray-100);
          border-radius: var(--radius);
          overflow: visible;
          position: relative;
        }

        .chart-bar {
          height: 100%;
          background: linear-gradient(90deg, #4A90E2 0%, #3B7DD8 100%);
          border-radius: var(--radius);
          animation: growBar 0.6s ease-out forwards;
          transform-origin: left;
          transition: all 0.2s ease;
        }

        .chart-row:hover .chart-bar {
          filter: brightness(1.1);
          box-shadow: 0 0 12px rgba(74, 144, 226, 0.4);
        }

        .tooltip {
          position: absolute;
          top: -36px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--gray-800);
          color: white;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius);
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          z-index: 10;
          animation: fadeIn 0.15s ease-out;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .tooltip::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px 6px 0 6px;
          border-style: solid;
          border-color: var(--gray-800) transparent transparent transparent;
        }

        /* Prevent tooltip clipping for the first item by showing it below */
        .chart-row:first-of-type .tooltip {
          top: calc(100% + 8px);
          bottom: auto;
          animation: fadeInBottom 0.15s ease-out;
        }

        .chart-row:first-of-type .tooltip::after {
          top: -6px;
          bottom: auto;
          border-width: 0 6px 6px 6px;
          border-color: transparent transparent var(--gray-800) transparent;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes fadeInBottom {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes growBar {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        .chart-scale {
          display: flex;
          justify-content: space-between;
          padding-left: calc(80px + var(--space-3));
        }

        .scale-marker {
          font-size: 0.625rem;
          color: var(--text-muted);
        }

        @media (max-width: 480px) {
          .category-chart {
            padding: var(--space-3);
          }

          .chart-scroll-container {
            max-height: 240px;
            padding-right: var(--space-1);
          }

          .chart-label {
            width: 60px;
            font-size: 0.65rem;
            line-height: 1.2;
          }
          
          .chart-scale {
            padding-left: calc(60px + var(--space-2));
          }

          .scale-marker {
            font-size: 0.5rem;
          }

          .scale-marker:nth-child(2),
          .scale-marker:nth-child(4) {
            display: none;
          }

          .chart-row {
            gap: var(--space-2);
            margin-bottom: var(--space-3);
          }

          .chart-bar-container {
            height: 20px;
          }

          .tooltip {
            font-size: 0.625rem;
            padding: var(--space-1) var(--space-2);
            top: -32px;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryChart;