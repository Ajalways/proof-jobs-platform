import React, { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function Profile() {
  useEffect(() => {
    window.location.href = createPageUrl('ProfileBuilder');
  }, []);

  return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Redirecting to profile editor...</p>
      </div>
    </div>
  );
}