import React from 'react';
import { Layers } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ 
  icon: Icon = Layers, 
  title = 'No items found', 
  description = 'Get started by creating a new one.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] p-12 text-center w-full">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-100 text-surface-400 rotate-3 transition-transform hover:rotate-0 duration-300">
        <Icon className="h-10 w-10" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 text-[20px] font-medium text-surface-900">{title}</h3>
      <p className="mb-8 text-[14px] text-surface-500 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};

export default EmptyState;
