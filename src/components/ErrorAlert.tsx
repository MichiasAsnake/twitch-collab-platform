import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useStore } from '../store';

export function ErrorAlert() {
  const error = useStore((state) => state.error);
  const setError = useStore((state) => state.setError);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 p-4 rounded-lg shadow-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium">Error</h3>
          <p className="text-sm mt-1 text-red-800 dark:text-red-200">{error}</p>
        </div>
        <button
          onClick={() => setError(null)}
          className="flex-shrink-0 text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}