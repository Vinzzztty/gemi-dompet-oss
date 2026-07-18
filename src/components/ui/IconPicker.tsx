'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { searchIcons, getIconsByCategory, FONT_AWESOME_ICONS, IconData } from '@/lib/font-awesome-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  maxDisplay?: number;
}

export const IconPicker: React.FC<IconPickerProps> = ({ 
  value, 
  onChange,
  maxDisplay = 50 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'income' | 'expense' | 'general'>('all');

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let icons = searchQuery ? searchIcons(searchQuery) : FONT_AWESOME_ICONS;
    
    if (selectedCategory !== 'all') {
      icons = icons.filter(icon => icon.category === selectedCategory);
    }
    
    return icons.slice(0, maxDisplay);
  }, [searchQuery, selectedCategory, maxDisplay]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleIconSelect = useCallback((iconName: string) => {
    onChange(iconName);
  }, [onChange]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-gray-400 pointer-events-none z-10">
          <FontAwesomeIcon icon={faSearch} size="sm" />
        </div>
        <input
          type="text"
          className="w-full py-3 px-4 pl-10 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white placeholder:text-gray-400"
          placeholder="Cari icon... (contoh: makanan, transport)"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'income', label: 'Pemasukan' },
          { id: 'expense', label: 'Pengeluaran' },
          { id: 'general', label: 'Umum' }
        ].map((category) => (
          <button
            key={category.id}
            type="button"
            className={`flex-1 py-2 px-3 border-none rounded bg-transparent text-xs font-medium text-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-200 ${
              selectedCategory === category.id 
                ? 'bg-white text-blue-600 shadow-sm shadow-black/5' 
                : ''
            }`}
            onClick={() => setSelectedCategory(category.id as any)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Icons Grid */}
      <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
        {filteredIcons.length === 0 ? (
          <div className="py-8 px-4 text-center text-gray-400">
            <p className="m-0">Tidak ada icon ditemukan</p>
            <p className="text-xs mt-1">Coba kata kunci lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] gap-2">
            {filteredIcons.map((iconData) => (
              <button
                key={iconData.name}
                type="button"
                className={`relative flex flex-col items-center justify-center gap-1 py-3 px-2 border-2 rounded-lg bg-white cursor-pointer transition-all duration-200 min-h-[70px] ${
                  value === iconData.name 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:-translate-y-0.5'
                }`}
                onClick={() => handleIconSelect(iconData.name)}
                title={iconData.displayName}
              >
                {value === iconData.name && (
                  <span className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-blue-500 text-white text-[11px] flex items-center justify-center font-semibold">
                    ✓
                  </span>
                )}
                <div className="text-blue-600">
                  <FontAwesomeIcon icon={iconData.icon} size="lg" />
                </div>
                <span className="text-[0.65rem] text-gray-600 text-center leading-tight max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {iconData.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

