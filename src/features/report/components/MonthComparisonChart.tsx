'use client';

import React, { useState } from 'react';
import { ChartIcon } from '@/components/icons';
import { formatNumber } from '@/utils/format';

interface MonthlyComparisonData {
    currentMonth: {
        income: number;
        expense: number;
    };
    previousMonth: {
        income: number;
        expense: number;
    };
}

interface MonthComparisonChartProps {
    data: MonthlyComparisonData;
}

interface TooltipData {
    value: number;
    label: string;
    type: string;
    x: number;
    y: number;
}

export const MonthComparisonChart: React.FC<MonthComparisonChartProps> = ({ data }) => {
    const [hoveredBar, setHoveredBar] = useState<TooltipData | null>(null);

    // Calculate max value for scaling
    const maxValue = Math.max(
        data.currentMonth.income,
        data.currentMonth.expense,
        data.previousMonth.income,
        data.previousMonth.expense
    );

    // Scale to percentage of max (with headroom)
    const scale = (value: number) => (value / (maxValue * 1.2)) * 100;

    // Y-axis labels
    const yLabels = ['12.0jt', '9.0jt', '6.0jt', '3.0jt', '0'];

    const handleBarHover = (e: React.MouseEvent, value: number, label: string, type: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredBar({
            value,
            label,
            type,
            x: rect.left + rect.width / 2,
            y: rect.top
        });
    };

    const handleBarLeave = () => {
        setHoveredBar(null);
    };

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                    <ChartIcon size={18} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 m-0">Perbandingan Bulan</h3>
            </div>

            <div className="flex gap-4 h-[200px] mb-4">
                <div className="flex flex-col justify-between pb-6">
                    {yLabels.map((label, index) => (
                        <span key={index} className="text-[10px] text-gray-400">{label}</span>
                    ))}
                </div>

                <div className="flex-1 flex justify-around items-end pb-6 border-b border-gray-200">
                    <div className="relative flex flex-col items-center gap-2">
                        <div className="flex gap-2 items-end h-40">
                            <div
                                className="w-8 rounded-t transition-all cursor-pointer bg-gradient-to-b from-blue-500 to-blue-600 hover:brightness-125 hover:scale-y-[1.02] hover:shadow-[0_-4px_12px_rgba(74,144,226,0.3)]"
                                style={{ height: `${scale(data.currentMonth.income)}%` }}
                                onMouseEnter={(e) => handleBarHover(e, data.currentMonth.income, 'Pemasukan', 'Bulan Ini')}
                                onMouseLeave={handleBarLeave}
                            />
                            <div
                                className="w-8 rounded-t transition-all cursor-pointer bg-gray-200 hover:bg-gray-300 hover:scale-y-[1.02] hover:shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
                                style={{ height: `${scale(data.previousMonth.income)}%` }}
                                onMouseEnter={(e) => handleBarHover(e, data.previousMonth.income, 'Pemasukan', 'Bulan Lalu')}
                                onMouseLeave={handleBarLeave}
                            />
                        </div>
                        <span className="absolute -bottom-5 text-xs text-gray-600 whitespace-nowrap">Pemasukan</span>
                    </div>

                    <div className="relative flex flex-col items-center gap-2">
                        <div className="flex gap-2 items-end h-40">
                            <div
                                className="w-8 rounded-t transition-all cursor-pointer bg-gradient-to-b from-blue-500 to-blue-600 hover:brightness-125 hover:scale-y-[1.02] hover:shadow-[0_-4px_12px_rgba(74,144,226,0.3)]"
                                style={{ height: `${scale(data.currentMonth.expense)}%` }}
                                onMouseEnter={(e) => handleBarHover(e, data.currentMonth.expense, 'Pengeluaran', 'Bulan Ini')}
                                onMouseLeave={handleBarLeave}
                            />
                            <div
                                className="w-8 rounded-t transition-all cursor-pointer bg-gray-200 hover:bg-gray-300 hover:scale-y-[1.02] hover:shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
                                style={{ height: `${scale(data.currentMonth.expense)}%` }}
                                onMouseEnter={(e) => handleBarHover(e, data.previousMonth.expense, 'Pengeluaran', 'Bulan Lalu')}
                                onMouseLeave={handleBarLeave}
                            />
                        </div>
                        <span className="absolute -bottom-5 text-xs text-gray-600 whitespace-nowrap">Pengeluaran</span>
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredBar && (
                <div
                    className="bg-gradient-to-br from-gray-900/98 to-gray-950/98 backdrop-blur-xl text-white py-3 px-3 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-white/10 min-w-[140px] animate-in fade-in duration-200"
                    style={{
                        position: 'fixed',
                        left: `${hoveredBar.x}px`,
                        top: `${hoveredBar.y - 10}px`,
                        transform: 'translate(-50%, -100%)',
                        pointerEvents: 'none',
                        zIndex: 1000
                    }}
                >
                    <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">{hoveredBar.type}</div>
                    <div className="text-xs font-medium mb-1 text-blue-300">{hoveredBar.label}</div>
                    <div className="text-sm font-bold">Rp {formatNumber(hoveredBar.value)}</div>
                </div>
            )}

            <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Bulan Ini</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                    <span>Bulan Lalu</span>
                </div>
            </div>
        </div>
    );
};

export default MonthComparisonChart;
