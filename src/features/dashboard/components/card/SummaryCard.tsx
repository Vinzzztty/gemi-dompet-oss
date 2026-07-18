'use client';

import React from 'react';
import { TrendingUpIcon, TrendingDownIcon } from '@/components/icons';
import { formatCurrency } from '@/utils/format';

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  period: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  type,
  period
}) => {
  const isIncome = type === 'income';
  const Icon = isIncome ? TrendingUpIcon : TrendingDownIcon;
  const colorClass = isIncome ? 'income' : 'expense';

  return (
    <div className="summary-card card">
      <div className="summary-header">
        <span className="summary-title">{title}</span>
        <div className={`summary-icon ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className={`summary-amount ${colorClass}`}>
        {formatCurrency(amount)}
      </div>
      <div className="summary-period">{period}</div>

      <style jsx>{`
        .summary-card {
          background-color: var(--bg-card);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          box-shadow: var(--shadow);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .summary-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
        }

        .summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }

        .summary-title {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .summary-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .summary-card:hover .summary-icon {
          transform: scale(1.15) rotate(5deg);
        }

        .summary-icon.income {
          background-color: var(--success-light);
          color: var(--success);
        }

        .summary-icon.expense {
          background-color: var(--primary-100);
          color: var(--primary-600);
        }

        .summary-amount {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--space-1);
        }

        .summary-amount.income {
          color: var(--success);
        }

        .summary-amount.expense {
          color: var(--danger);
        }

        .summary-period {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default SummaryCard;
