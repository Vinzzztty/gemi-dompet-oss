import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getIconByName } from '@/lib/font-awesome-icons';
import { faWallet } from '@fortawesome/free-solid-svg-icons';

interface FontAwesomeIconDisplayProps {
  iconName: string;
  size?: 'sm' | 'lg' | '1x' | '2x' | '3x';
  className?: string;
}

export const FontAwesomeIconDisplay: React.FC<FontAwesomeIconDisplayProps> = ({ 
  iconName, 
  size = '1x',
  className = '' 
}) => {
  const icon = getIconByName(iconName);
  
  // Fallback to wallet icon if not found
  const displayIcon = icon || faWallet;

  return (
    <FontAwesomeIcon 
      icon={displayIcon} 
      size={size}
      className={className}
    />
  );
};
