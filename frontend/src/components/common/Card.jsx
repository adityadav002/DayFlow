import React from 'react';
import { cn } from '../../utils/helpers';

export const Card = ({ className, children, hoverable = false, ...props }) => {
  return (
    <div
      className={cn(
        'card',
        hoverable && 'interactive',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-surface-200 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className, children, ...props }) => {
  return (
    <h3 className={cn('text-[15px] font-medium text-surface-900', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};
