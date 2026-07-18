'use client';

import React, { useState } from 'react';
import { CoinIcon } from '@/components/icons';
import { CategorySpending } from '@/types';
import { formatNumber } from '@/utils/format';

interface CategoryPieChartProps {
    data: CategorySpending[];
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.amount, 0);

    // Calculate cumulative percentages for the donut chart segments
    let cumulativePercent = 0;
    const segments = data.map((item) => {
        const percent = (item.amount / total) * 100;
        const startPercent = cumulativePercent;
        cumulativePercent += percent;
        return {
            ...item,
            percent,
            startPercent,
            endPercent: cumulativePercent,
        };
    });

    // Generate conic gradient with hover effect
    const gradientStops = segments.map((seg) => {
        const color = hoveredCategory === seg.category 
            ? `color-mix(in srgb, ${seg.color} 85%, white)`
            : seg.color;
        return `${color} ${seg.startPercent}% ${seg.endPercent}%`;
    }).join(', ');

    const hoveredSegment = segments.find(seg => seg.category === hoveredCategory);

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                    <CoinIcon size={18} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 m-0">Pengeluaran per Kategori</h3>
            </div>

            <div className="flex justify-center items-center p-4">
                <div
                    className="w-[200px] h-[200px] rounded-full relative flex items-center justify-center transition-all"
                    style={{
                        background: `conic-gradient(${gradientStops})`
                    }}
                >
                    <div className="w-[120px] h-[120px] rounded-full bg-white flex items-center justify-center relative z-[1]">
                        {hoveredSegment && (
                            <div className="text-center p-2 animate-in fade-in zoom-in-95 duration-200">
                                <div className="text-[10px] text-gray-600 mb-1 font-medium">{hoveredSegment.name}</div>
                                <div className="text-xl font-bold text-blue-600 mb-0.5">{hoveredSegment.percent.toFixed(1)}%</div>
                                <div className="text-[10px] text-gray-400 font-medium">Rp {formatNumber(hoveredSegment.amount)}</div>
                            </div>
                        )}
                        {!hoveredSegment && (
                            <div className="text-center p-2 animate-in fade-in zoom-in-95 duration-200">
                                <div className="text-xs text-gray-600 mb-1">Total</div>
                                <div className="text-sm font-bold text-gray-900">Rp {formatNumber(total)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-center flex-wrap gap-4 mt-4">
                {data.map((item) => {
                    const segment = segments.find(s => s.category === item.category);
                    return (
                        <div 
                            key={item.category} 
                            className={`flex items-center gap-2 text-xs text-gray-600 py-2 px-2 rounded cursor-pointer transition-all bg-transparent hover:bg-gray-50 hover:text-gray-900 ${
                                hoveredCategory === item.category ? 'bg-gray-50 text-gray-900 translate-x-1' : ''
                            }`}
                            onMouseEnter={() => setHoveredCategory(item.category)}
                            onMouseLeave={() => setHoveredCategory(null)}
                        >
                            <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                                    hoveredCategory === item.category ? 'scale-[1.3] shadow-[0_0_8px_currentColor]' : ''
                                }`}
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="flex-1">{item.name}</span>
                            <span className="font-semibold text-blue-600 ml-2">{segment?.percent.toFixed(1)}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CategoryPieChart;
