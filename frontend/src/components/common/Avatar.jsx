import React from 'react';
import { cn } from '../../utils/helpers';

const Avatar = ({ user, size = 'md', className, onClick }) => {
  if (!user) return null;

  // Determine dimensions based on size
  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]', // 24px
    sm: 'h-8 w-8 text-[11px]', // 32px
    md: 'h-10 w-10 text-xs', // 40px
    lg: 'h-12 w-12 text-sm', // 48px
    xl: 'h-16 w-16 text-lg', // 64px
  };

  const containerClasses = cn(
    'relative flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary-100',
    sizeClasses[size] || sizeClasses.md,
    className,
    onClick && 'cursor-pointer hover:opacity-90 transition-opacity'
  );

  const isDicebear = user.avatar && user.avatar.includes('dicebear');
  const hasAvatar = user.avatar && !isDicebear;

  return (
    <div className={containerClasses} onClick={onClick}>
      {hasAvatar ? (
        <img 
          src={user.avatar} 
          alt={user.name || 'User Avatar'} 
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-bold text-primary-700 uppercase">
          {user.name?.charAt(0) || 'U'}
        </span>
      )}
      
      {user.isOnline && (
        <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-primary-500 ring-2 ring-white" />
      )}
    </div>
  );
};

export default Avatar;
