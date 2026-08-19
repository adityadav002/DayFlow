import React from 'react';
import { cn } from '../../utils/helpers';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-200/60', className)}
      {...props}
    />
  );
};

export default Skeleton;
