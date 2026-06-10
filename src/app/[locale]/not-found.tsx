import Link from 'next/link';
import { BookOpen, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-[#213885]/10 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-[#213885]" />
          </div>
        </div>

        <h1 className="text-7xl font-bold text-[#213885] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
          404
        </h1>
        <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">
          Page Not Found
        </h2>
        <p className="text-[#555] mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back to the books.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#213885] text-white px-6 py-3 rounded font-medium hover:bg-[#1a2d6b] transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 border border-[#213885] text-[#213885] px-6 py-3 rounded font-medium hover:bg-[#213885]/5 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
