'use client';

import React from 'react';
import { formatCurrency } from '@/utils/format';

type GoalAccent = 'emerald' | 'blue';

interface SavingsGoal {
  id: string;
  name: string;
  current: number;
  target: number;
  accent: GoalAccent;
}

/** Placeholder data — nanti bisa diganti API / pengaturan user */
const DEFAULT_GOALS: SavingsGoal[] = [
  {
    id: '1',
    name: 'Mobil baru',
    current: 12_000_000,
    target: 25_000_000,
    accent: 'emerald',
  },
  {
    id: '2',
    name: 'Liburan Jepang',
    current: 4_200_000,
    target: 5_000_000,
    accent: 'blue',
  },
];

const barClass: Record<GoalAccent, string> = {
  emerald: 'bg-emerald-600',
  blue: 'bg-[#3b82f6]',
};

export const SavingsGoalsWidget: React.FC = () => {
  return (
    <section className="rounded-[20px] bg-white p-4 sm:p-5 shadow-sm border border-gray-100">
      <h3 className="text-base font-bold text-gray-900 m-0 mb-5">Target tabungan</h3>
      <ul className="space-y-5">
        {DEFAULT_GOALS.map((goal) => {
          const pct = Math.min(
            100,
            Math.round((goal.current / goal.target) * 100)
          );
          return (
            <li key={goal.id}>
              <div className="flex justify-between items-baseline gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {goal.name}
                </span>
                <span className="text-xs text-gray-500 shrink-0 tabular-nums">
                  {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barClass[goal.accent]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
