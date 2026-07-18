// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import { FilterIcon, CalendarIcon, CheckIcon } from '@/components/icons';

// interface FilterDropdownProps {
//     onApplyFilter?: (filters: FilterOptions) => void;
// }

// interface FilterOptions {
//     dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
//     sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
//     categories: string[];
// }

// const dateRangeOptions = [
//     { value: 'all', label: 'Semua waktu' },
//     { value: 'today', label: 'Hari ini' },
//     { value: 'week', label: 'Minggu ini' },
//     { value: 'month', label: 'Bulan ini' },
// ];

// const sortOptions = [
//     { value: 'newest', label: 'Terbaru' },
//     { value: 'oldest', label: 'Terlama' },
//     { value: 'highest', label: 'Nominal tertinggi' },
//     { value: 'lowest', label: 'Nominal terendah' },
// ];

// export const FilterDropdown: React.FC<FilterDropdownProps> = ({ onApplyFilter }) => {
//     const [isOpen, setIsOpen] = useState(false);
//     const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
//     const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
//     const dropdownRef = useRef<HTMLDivElement>(null);

//     useEffect(() => {
//         const handleClickOutside = (event: MouseEvent) => {
//             if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//                 setIsOpen(false);
//             }
//         };

//         document.addEventListener('mousedown', handleClickOutside);
//         return () => document.removeEventListener('mousedown', handleClickOutside);
//     }, []);

//     const handleApply = () => {
//         if (onApplyFilter) {
//             onApplyFilter({ dateRange, sortBy, categories: [] });
//         }
//         setIsOpen(false);
//     };

//     const handleReset = () => {
//         setDateRange('all');
//         setSortBy('newest');
//     };

//     return (
//         <div className="filter-wrapper" ref={dropdownRef}>
//             <button
//                 className="tab filter-toggle"
//                 onClick={() => setIsOpen(!isOpen)}
//             >
//                 <FilterIcon size={16} />
//                 Filter
//             </button>

//             {isOpen && (
//                 <div className="filter-dropdown">
//                     <div className="filter-section">
//                         <h4 className="filter-section-title">
//                             <CalendarIcon size={14} />
//                             Rentang Waktu
//                         </h4>
//                         <div className="filter-options">
//                             {dateRangeOptions.map((option) => (
//                                 <button
//                                     key={option.value}
//                                     className={`filter-option ${dateRange === option.value ? 'active' : ''}`}
//                                     onClick={() => setDateRange(option.value as typeof dateRange)}
//                                 >
//                                     {dateRange === option.value && <CheckIcon size={14} />}
//                                     {option.label}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="filter-section">
//                         <h4 className="filter-section-title">Urutkan</h4>
//                         <div className="filter-options">
//                             {sortOptions.map((option) => (
//                                 <button
//                                     key={option.value}
//                                     className={`filter-option ${sortBy === option.value ? 'active' : ''}`}
//                                     onClick={() => setSortBy(option.value as typeof sortBy)}
//                                 >
//                                     {sortBy === option.value && <CheckIcon size={14} />}
//                                     {option.label}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="filter-actions">
//                         <button className="reset-btn" onClick={handleReset}>Reset</button>
//                         <button className="apply-btn" onClick={handleApply}>Terapkan</button>
//                     </div>
//                 </div>
//             )}

//             <style jsx>{`
//         .filter-wrapper {
//           position: relative;
//         }

//         .filter-toggle {
//           margin-left: auto;
//         }

//         .filter-dropdown {
//           position: absolute;
//           top: calc(100% + var(--space-2));
//           right: 0;
//           width: 280px;
//           background-color: var(--bg-card);
//           border-radius: var(--radius-xl);
//           box-shadow: var(--shadow-xl);
//           z-index: 100;
//           animation: slideDown 0.2s ease;
//           overflow: hidden;
//         }

//         @keyframes slideDown {
//           from {
//             opacity: 0;
//             transform: translateY(-8px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         .filter-section {
//           padding: var(--space-4);
//           border-bottom: 1px solid var(--gray-100);
//         }

//         .filter-section:last-of-type {
//           border-bottom: none;
//         }

//         .filter-section-title {
//           display: flex;
//           align-items: center;
//           gap: var(--space-2);
//           font-size: 0.75rem;
//           font-weight: 600;
//           color: var(--text-secondary);
//           text-transform: uppercase;
//           margin: 0 0 var(--space-3) 0;
//         }

//         .filter-options {
//           display: flex;
//           flex-direction: column;
//           gap: var(--space-1);
//         }

//         .filter-option {
//           display: flex;
//           align-items: center;
//           gap: var(--space-2);
//           padding: var(--space-2) var(--space-3);
//           background: none;
//           border: none;
//           border-radius: var(--radius-lg);
//           font-size: 0.875rem;
//           color: var(--text-primary);
//           cursor: pointer;
//           transition: all 0.2s ease;
//           text-align: left;
//         }

//         .filter-option:hover {
//           background-color: var(--gray-50);
//         }

//         .filter-option.active {
//           background-color: var(--primary-50);
//           color: var(--primary-600);
//           font-weight: 500;
//         }

//         .filter-actions {
//           display: flex;
//           gap: var(--space-2);
//           padding: var(--space-4);
//           border-top: 1px solid var(--gray-100);
//         }

//         .reset-btn {
//           flex: 1;
//           padding: var(--space-3);
//           background-color: var(--gray-100);
//           border: none;
//           border-radius: var(--radius-lg);
//           font-size: 0.875rem;
//           font-weight: 500;
//           color: var(--text-secondary);
//           cursor: pointer;
//           transition: all 0.2s ease;
//         }

//         .reset-btn:hover {
//           background-color: var(--gray-200);
//         }

//         .apply-btn {
//           flex: 1;
//           padding: var(--space-3);
//           background-color: var(--primary-500);
//           border: none;
//           border-radius: var(--radius-lg);
//           font-size: 0.875rem;
//           font-weight: 500;
//           color: white;
//           cursor: pointer;
//           transition: all 0.2s ease;
//         }

//         .apply-btn:hover {
//           background-color: var(--primary-600);
//         }
//       `}</style>
//         </div>
//     );
// };

// export default FilterDropdown;
