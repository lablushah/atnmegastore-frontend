'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const INTERVAL   = 5000;
const SESSION_KEY = 'atn_ann_dismissed';

export default function AnnouncementBar() {
  const t = useTranslations('announcement');

  const MESSAGES = [
    { text: t('free_shipping'),    link: '/products' as string | null },
    { text: t('books_collection'), link: '/products?sort=created_at&dir=desc' as string | null },
    { text: t('gift_cards'),       link: '/gift-cards' as string | null },
    { text: t('local_pickup'),     link: null },
  ];

  const [idx,     setIdx]     = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading,  setFading]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) setVisible(true);
  }, []);

  const goTo = useCallback((next: number) => {
    setFading(true);
    setTimeout(() => { setIdx(next); setFading(false); }, 250);
  }, []);

  const prev = () => goTo((idx - 1 + MESSAGES.length) % MESSAGES.length);
  const next = useCallback(() => goTo((idx + 1) % MESSAGES.length), [idx, goTo, MESSAGES.length]);

  useEffect(() => {
    if (!visible) return;
    timerRef.current = setTimeout(next, INTERVAL);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, visible, next]);

  const dismiss = () => { setVisible(false); sessionStorage.setItem(SESSION_KEY, '1'); };

  if (!visible) return null;

  const msg = MESSAGES[idx];

  return (
    <div className="bg-[#213885] text-white select-none" role="region" aria-label="Announcements">
      <div className="max-w-7xl mx-auto px-3 h-10 flex items-center gap-2">

        <button onClick={prev} aria-label="Previous announcement"
          className="shrink-0 p-1 text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <p className={`text-xs font-medium tracking-wide text-center whitespace-nowrap overflow-hidden text-ellipsis transition-opacity duration-250
            ${fading ? 'opacity-0' : 'opacity-100'}`}>
            {msg.link ? (
              <Link href={msg.link} className="hover:text-[#893172] transition-colors">{msg.text}</Link>
            ) : (
              <span>{msg.text}</span>
            )}
          </p>
        </div>

        <div className="shrink-0 hidden sm:flex items-center gap-1">
          {MESSAGES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Go to announcement ${i + 1}`}
              className={`rounded-full transition-all duration-300
                ${i === idx ? 'w-3.5 h-1.5 bg-[#893172]' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'}`} />
          ))}
        </div>

        <button onClick={next} aria-label="Next announcement"
          className="shrink-0 p-1 text-white/50 hover:text-white transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button onClick={dismiss} aria-label="Dismiss announcements"
          className="shrink-0 p-1 text-white/40 hover:text-white transition-colors ml-1">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
