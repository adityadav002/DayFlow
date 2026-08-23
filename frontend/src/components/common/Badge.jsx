import React from 'react';
import { cn } from '../../utils/helpers';

export const Badge = ({ children, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'bg-surface-200 text-surface-900', // Completed/Default
    active: 'bg-primary-500 text-white', // Active
    'in-progress': 'bg-amber-100 text-amber-900', // In Progress
    overdue: 'bg-red-600 text-white', // Overdue
    paused: 'bg-accent-200 text-surface-900', // Paused
    outline: 'bg-transparent border border-surface-300 text-surface-700',
    primary: 'bg-primary-50 text-primary-700 border border-primary-200',
    success: 'bg-primary-500 text-white',
    warning: 'bg-amber-100 text-amber-900',
    danger: 'bg-red-600 text-white',
    accent: 'bg-accent-50 text-accent-700 border border-accent-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-[6px] text-[11px] font-medium tracking-wide',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
