'use client';

import Image from 'next/image';
import { storageUrl } from '@/lib/imageUrl';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from '@/navigation';
import { ChevronLeft, ChevronRight, ArrowRight, CalendarDays, BookOpen } from 'lucide-react';

interface Slide {
  id: number;
  badge: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  cta_text: string;
  cta_link: string;
  bg_color: string;
  accent_color: string;
  image_url: string | null;
}

interface HeroSectionProps {
  slides: Slide[];
  latestPost: any | null;
  newProduct: any | null;
  upcomingEvent: any | null;
}

const INTERVAL = 6000;

function fmtEventDate(d: string) {
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
function fmtPostDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

export default function HeroSection({ slides, latestPost, newProduct, upcomingEvent }: HeroSectionProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => setCurrent(idx), []);
  const next = useCallback(() => goTo((current + 1) % Math.max(slides.length, 1)), [current, goTo, slides.length]);
  const prev = useCallback(() => goTo((current - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1)), [current, goTo, slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timer.current = setTimeout(next, INTERVAL);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [current, paused, next, slides.length]);

  const slide = slides[current];

  return (
    <section className="bg-[#ecdfd2] border-b border-[#cccacc]">
      <style>{`
        @keyframes heroFadeProgress { from { width: 0% } to { width: 100% } }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">

          {/* ── Slideshow — 3 / 5 ─────────────────────────────────────── */}
          {slides.length > 0 && (
            <div
              className="lg:col-span-3 relative overflow-hidden rounded-lg select-none"
              style={{ minHeight: '340px', height: 'clamp(340px, 45vw, 480px)' }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {/* All slides stacked — fade via opacity transition */}
              {slides.map((s, i) => (
                <div
                  key={s.id}
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: i === current ? 1 : 0, backgroundColor: s.bg_color }}
                >
                  {s.image_url && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.image_url}
                        alt={s.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading={i === 0 ? 'eager' : 'lazy'}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to right,
                            ${s.bg_color}f0 0%,
                            ${s.bg_color}c0 40%,
                            ${s.bg_color}50 72%,
                            transparent 100%)`,
                        }}
                      />
                    </>
                  )}

                  {/* Text content — positioned at bottom-left */}
                  <div className="relative h-full flex flex-col justify-end p-6 sm:p-8">
                    {s.badge && (
                      <span
                        className="self-start mb-3 text-sm font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-sm"
                        style={{
                          color:           s.accent_color,
                          backgroundColor: `${s.accent_color}25`,
                          border:          `1px solid ${s.accent_color}50`,
                        }}
                      >
                        {s.badge}
                      </span>
                    )}
                    <h2
                      className="font-bold leading-tight mb-2"
                      style={{
                        fontFamily:  'var(--font-playfair), Georgia, serif',
                        color:       '#fff',
                        fontSize:    'clamp(1.8rem, 3.5vw, 2.8rem)',
                        textShadow:  '0 2px 16px rgba(0,0,0,0.45)',
                      }}
                    >
                      {s.title}
                    </h2>
                    {s.subtitle && (
                      <p
                        className="text-sm font-semibold mb-1.5 drop-shadow"
                        style={{ color: s.accent_color }}
                      >
                        {s.subtitle}
                      </p>
                    )}
                    {s.description && (
                      <p
                        className="text-sm mb-5 max-w-xs leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.82)' }}
                      >
                        {s.description}
                      </p>
                    )}
                    <Link
                      href={s.cta_link}
                      className="self-start inline-flex items-center gap-2 font-bold px-5 py-2.5 text-xs tracking-widest uppercase transition-all duration-200 hover:gap-3 rounded-sm shadow-md"
                      style={{ backgroundColor: s.accent_color, color: s.bg_color }}
                    >
                      {s.cta_text}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Prev / Next arrows */}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    aria-label="Previous slide"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/25 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={next}
                    aria-label="Next slide"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/25 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {slides.length > 1 && slide && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width:           i === current ? 20 : 6,
                        height:          6,
                        backgroundColor: i === current ? slide.accent_color : 'rgba(255,255,255,0.45)',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Progress bar */}
              {slides.length > 1 && !paused && slide && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/15 z-10">
                  <div
                    key={`p-${current}`}
                    className="h-full"
                    style={{
                      backgroundColor: slide.accent_color,
                      animation:       `heroFadeProgress ${INTERVAL}ms linear`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Sidebar — 2 / 5 ───────────────────────────────────────── */}
          {(latestPost || newProduct || upcomingEvent) && (
            <div className="lg:col-span-2 flex flex-col sm:flex-row lg:flex-col gap-3">

              {/* Latest Blog Post */}
              {latestPost && (
                <Link
                  href={`/blog/${latestPost.slug}`}
                  className="group flex-1 flex gap-3 bg-white rounded-md border border-[#e8ddd5] hover:border-[#213885]/40 hover:shadow-sm transition-all p-3 overflow-hidden min-w-0"
                >
                  {/* Thumbnail */}
                  <div className="w-[72px] h-[72px] shrink-0 rounded overflow-hidden bg-[#e8e3f0]">
                    {latestPost.cover_image_url ? (
                      <Image
                        src={storageUrl(latestPost.cover_image_url)!}
                        alt={latestPost.title}
                        width={72} height={72}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={20} className="text-[#c4945a]" />
                      </div>
                    )}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#213885]">
                      Latest Article
                    </span>
                    <h3
                      className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#213885] transition-colors"
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                    >
                      {latestPost.title}
                    </h3>
                    {latestPost.excerpt && (
                      <p className="text-xs text-gray-400 line-clamp-1 leading-snug">
                        {latestPost.excerpt}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">{fmtPostDate(latestPost.published_at)}</p>
                  </div>
                </Link>
              )}

              {/* New Arrival Product */}
              {newProduct && (
                <Link
                  href={`/products/${newProduct.slug}`}
                  className="group flex-1 flex gap-3 bg-white rounded-md border border-[#e8ddd5] hover:border-[#213885]/40 hover:shadow-sm transition-all p-3 overflow-hidden min-w-0"
                >
                  {/* Thumbnail */}
                  <div className="relative w-[72px] h-[72px] shrink-0 rounded overflow-hidden bg-[#ede8f8]">
                    {newProduct.image ? (
                      <Image
                        src={storageUrl(newProduct.image)!}
                        alt={newProduct.name}
                        fill
                        sizes="72px"
                        className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-2xl">📚</span>
                    )}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#893172]">
                      New Arrival
                    </span>
                    <h3
                      className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#213885] transition-colors"
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                    >
                      {newProduct.name}
                    </h3>
                    {newProduct.author && (
                      <p className="text-xs text-gray-400 line-clamp-1">by {newProduct.author}</p>
                    )}
                    <p className="text-sm font-bold text-[#1a1a1a]">
                      ${parseFloat(newProduct.price).toFixed(2)}
                    </p>
                  </div>
                </Link>
              )}

              {/* Upcoming Event */}
              {upcomingEvent && (
                <Link
                  href={`/events/${upcomingEvent.slug}`}
                  className="group flex-1 flex gap-3 bg-white rounded-md border border-[#e8ddd5] hover:border-[#213885]/40 hover:shadow-sm transition-all p-3 overflow-hidden min-w-0"
                >
                  {/* Thumbnail */}
                  <div className="w-[72px] h-[72px] shrink-0 rounded overflow-hidden">
                    {upcomingEvent.image_url ? (
                      <Image
                        src={storageUrl(upcomingEvent.image_url)!}
                        alt={upcomingEvent.title}
                        width={72} height={72}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center rounded bg-gradient-to-br from-[#213885] to-[#8b3050]">
                        <CalendarDays size={22} className="text-white/60" />
                      </div>
                    )}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#213885]">
                      Upcoming Event
                    </span>
                    <h3
                      className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#213885] transition-colors"
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                    >
                      {upcomingEvent.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <CalendarDays size={10} className="text-[#213885] shrink-0" />
                      {fmtEventDate(upcomingEvent.date)}
                    </div>
                    {upcomingEvent.location && (
                      <p className="text-xs text-gray-400 line-clamp-1">{upcomingEvent.location}</p>
                    )}
                  </div>
                </Link>
              )}

            </div>
          )}

        </div>
      </div>
    </section>
  );
}
