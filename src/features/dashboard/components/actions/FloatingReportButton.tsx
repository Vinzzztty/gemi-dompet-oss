'use client';

import React from 'react';
import Link from 'next/link';
import { ChartIcon } from '@/components/icons';

export const FloatingReportButton: React.FC = () => {
  return (
    <>
      <Link href="/laporan" className="fab-report" aria-label="Lihat Laporan">
        <ChartIcon size={24} />
      </Link>

      <style jsx>{`
        .fab-report {
          position: fixed;
          bottom: calc(var(--space-6) + 56px + var(--space-4));
          right: var(--space-6);
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background-color: var(--bg-card);
          color: var(--primary-500);
          display: none; /* Hidden by default on desktop */
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--gray-100);
          z-index: 49;
        }

        .fab-report:hover {
          background-color: var(--gray-50);
          transform: scale(1.05);
        }

        .fab-report:active {
          transform: scale(0.95);
        }

        @media (max-width: 640px) {
          .fab-report {
            display: flex;
          }
        }
      `}</style>
    </>
  );
};

export default FloatingReportButton;
