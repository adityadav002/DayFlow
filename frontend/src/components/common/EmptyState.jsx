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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 bg-surface-50/50 p-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100">
        <Icon className="h-6 w-6 text-surface-500" />
      </div>
      <h3 className="mb-1 text-lg font-medium text-surface-900">{title}</h3>
      <p className="mb-6 text-sm text-surface-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};

export default EmptyState;
