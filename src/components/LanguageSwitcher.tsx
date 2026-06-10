'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/navigation';
import { useTransition, useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'English',  short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'bn', label: 'বাংলা',    short: 'বাং' },
] as const;

export default function LanguageSwitcher() {
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen]             = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLocale = (next: string) => {
    setOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-label="Switch language"
        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{current.short}</span>
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded shadow-xl border border-gray-200 overflow-hidden z-50">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => switchLocale(l.code)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className={l.code === 'bn' ? 'font-bengali' : ''}>{l.label}</span>
              {l.code === locale && <Check className="w-3.5 h-3.5 text-[#213885]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
