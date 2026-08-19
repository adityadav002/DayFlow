import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-surface-50/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      {content}
    </div>
  );
};

export default Loader;
