'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
          Something went wrong
        </h2>
        <p className="text-[#555] mb-8 leading-relaxed">
          An unexpected error occurred. You can try refreshing the page or go back to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-[#213885] text-white px-6 py-3 rounded font-medium hover:bg-[#1a2d6b] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-[#213885] text-[#213885] px-6 py-3 rounded font-medium hover:bg-[#213885]/5 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-[#999]">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
