import type { Metadata } from 'next';
import { Clock, Mail, Phone, Wrench } from 'lucide-react';
import Logo from '@/components/Logo';

export const metadata: Metadata = { title: 'Site Maintenance — ATN Book & Crafts' };

interface Props {
  searchParams: Promise<{ msg?: string; eta?: string }>;
}

export default async function MaintenancePage({ searchParams }: Props) {
  const params  = await searchParams;
  const message = params.msg ?? 'We are currently performing scheduled maintenance. We will be back online shortly.';
  const eta     = params.eta ?? null;

  return (
    <div className="min-h-screen bg-[#f9f5f2] flex flex-col items-center justify-center px-4">

      {/* Animated wrench icon */}
      <div className="mb-8 relative">
        <div className="w-24 h-24 bg-white border-2 border-[#cccacc] flex items-center justify-center">
          <Wrench className="w-12 h-12 text-[#213885]" style={{ animation: 'spin 3s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }`}</style>
      </div>

      {/* Logo / brand */}
      <div className="mb-6 flex justify-center">
        <Logo size="lg" />
      </div>

      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] text-center mb-4"
          style={{ fontFamily: 'Georgia, serif' }}>
        We&apos;ll Be Back Soon
      </h1>

      {/* Message card */}
      <div className="bg-white border border-[#cccacc] p-8 max-w-lg w-full text-center mb-6">
        <p className="text-[#6b6b6b] leading-relaxed">{message}</p>

        {eta && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[#213885] font-medium text-sm">
            <Clock className="w-4 h-4" />
            <span>Expected back: {eta}</span>
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className="flex flex-col sm:flex-row gap-4 text-sm text-[#6b6b6b]">
        <a href="mailto:info@atnmegastore.ca" className="flex items-center gap-2 hover:text-[#213885] transition-colors">
          <Mail className="w-4 h-4" /> info@atnmegastore.ca
        </a>
        <a href="tel:4166716382" className="flex items-center gap-2 hover:text-[#213885] transition-colors">
          <Phone className="w-4 h-4" /> 416-671-6382
        </a>
      </div>

      {/* Admin link — subtle, bottom of page */}
      <a href="/admin" className="mt-16 text-xs text-gray-300 hover:text-gray-400 transition-colors">
        Admin
      </a>
    </div>
  );
}
