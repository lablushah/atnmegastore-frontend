import { Link } from '@/navigation';
import { ChevronRight } from 'lucide-react';
import { getSettings } from '@/lib/settings';

interface Props {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  breadcrumb?: string;
  children: React.ReactNode;
}

export default async function PolicyLayout({ title, subtitle, lastUpdated, breadcrumb, children }: Props) {
  const s = await getSettings();
  return (
    <div className="bg-[#ecdfd2] min-h-screen">
      {/* Hero */}
      <div className="bg-[#213885] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-4">
            <Link href="/" className="text-white/70 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#f0c0a0]">{breadcrumb ?? title}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 leading-tight"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            {title}
          </h1>
          {subtitle && <p className="text-[#f0c0a0] text-base mt-2 max-w-xl">{subtitle}</p>}
          <p className="text-[#5f3475] text-xs mt-4">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-[#cccacc] p-8 sm:p-12 prose-policy">
          {children}
        </div>

        {/* Footer note */}
        <p className="text-xs text-[#9b9590] text-center mt-8">
          Questions about this policy?{' '}
          <a href={`mailto:${s.site_email}`} className="text-[#213885] hover:underline font-medium">
            Contact us at {s.site_email}
          </a>
        </p>
      </div>
    </div>
  );
}
