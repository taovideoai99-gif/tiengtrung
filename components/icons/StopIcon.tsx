
import React from 'react';

interface StopIconProps {
  className?: string;
}

export const StopIcon: React.FC<StopIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M6 6h12v12H6z" />
  </svg>
);
