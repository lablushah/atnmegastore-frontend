'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  lastPage: number;
  onPageChange: (p: number) => void;
}

export default function Pagination({ page, lastPage, onPageChange }: Props) {
  if (lastPage <= 1) return null;

  const pages = buildPages(page, lastPage);

  return (
    <div className="flex items-center justify-center gap-1 mt-10 flex-wrap">

      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((item, i) =>
        item === '...' ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">
            &hellip;
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item as number)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
              ${item === page
                ? 'bg-[#213885] text-white'
                : 'bg-white border text-gray-700 hover:bg-[#ecdfd2]'
              }`}
          >
            {item}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === lastPage}
        className="w-9 h-9 flex items-center justify-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function buildPages(current: number, total: number): (number | '...')[] {
  // Always show: first, last, current, and 1 neighbour on each side
  const delta = 1;
  const range: number[] = [];

  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    range.push(i);
  }

  const pages: (number | '...')[] = [1];

  if (range[0] > 2) pages.push('...');
  pages.push(...range);
  if (range[range.length - 1] < total - 1) pages.push('...');
  if (total > 1) pages.push(total);

  return pages;
}
