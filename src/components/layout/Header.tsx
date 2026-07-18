'use client';

import React, { useState, useEffect } from 'react';
import { LogoIcon } from '@/components/icons';
import { formatFullDate } from '@/utils/format';
import NotificationDropdown from '../../features/dashboard/components/notification/NotificationDropdown';
import ProfileDropdown from '../../features/dashboard/components/profile/ProfileDropdown';

export const Header: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Set date on client side only
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  return (
    <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-white rounded-[20px] shadow-sm mb-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <LogoIcon size={40} />
        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 m-0 leading-tight">GEMIKU</h1>
          <p className="hidden sm:block text-xs text-gray-500 m-0">{currentDate ? formatFullDate(currentDate) : ''}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationDropdown />
        <ProfileDropdown />
      </div>
    </header>
  );
};

export default Header;
