'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from '@/navigation';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

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

const INTERVAL   = 6000;
const ANIM_MS    = 700;

export default function HeroSlideshow({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [anim, setAnim]       = useState<'idle' | 'enter-right' | 'enter-left'>('idle');
  const [paused, setPaused]   = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number, dir: 'next' | 'prev' = 'next') => {
    if (anim !== 'idle') return;
    setAnim(dir === 'next' ? 'enter-right' : 'enter-left');
    setTimeout(() => { setCurrent(idx); setAnim('idle'); }, ANIM_MS);
  }, [anim]);

  const next = useCallback(() => goTo((current + 1) % slides.length, 'next'), [current, goTo, slides.length]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length, 'prev'), [current, goTo, slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1 || anim !== 'idle') return;
    timer.current = setTimeout(next, INTERVAL);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [current, paused, next, slides.length, anim]);

  if (!slides.length) return null;

  const slide = slides[current];

  return (
    <section
      className="relative overflow-hidden select-none"
      style={{ minHeight: 640 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`
        @keyframes heroSlideInRight {
          from { transform: translateX(8%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes heroSlideInLeft {
          from { transform: translateX(-8%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes heroProgress {
          from { width: 0% }
          to   { width: 100% }
        }
        .hero-enter-right { animation: heroSlideInRight ${ANIM_MS}ms cubic-bezier(.22,.68,0,1.2) forwards; }
        .hero-enter-left  { animation: heroSlideInLeft  ${ANIM_MS}ms cubic-bezier(.22,.68,0,1.2) forwards; }
      `}</style>

      {/* Slide */}
      <div
        key={`${slide.id}-${anim}`}
        className={`absolute inset-0 ${anim === 'enter-right' ? 'hero-enter-right' : anim === 'enter-left' ? 'hero-enter-left' : ''}`}
        style={{ backgroundColor: slide.bg_color }}
      >
        {/* Background image with dark overlay for text contrast */}
        {slide.image_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image_url}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient overlay — darker on left for text, lighter on right */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(
                  to right,
                  ${slide.bg_color}f0 0%,
                  ${slide.bg_color}cc 35%,
                  ${slide.bg_color}66 65%,
                  ${slide.bg_color}22 100%
                )`,
              }}
            />
          </>
        )}

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center" style={{ minHeight: 640 }}>
          <div className="max-w-xl py-28">

            {/* Badge */}
            {slide.badge && (
              <div className="mb-5">
                <span
                  className="inline-block text-xs font-bold tracking-[0.3em] uppercase px-4 py-1.5 rounded-full"
                  style={{
                    color: slide.accent_color,
                    backgroundColor: `${slide.accent_color}20`,
                    border: `1px solid ${slide.accent_color}50`,
                  }}
                >
                  {slide.badge}
                </span>
              </div>
            )}

            {/* Title */}
            <h1
              className="font-bold leading-tight mb-3 drop-shadow-lg"
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                color: '#ffffff',
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                textShadow: '0 2px 20px rgba(0,0,0,0.4)',
              }}
            >
              {slide.title}
            </h1>

            {/* Subtitle */}
            {slide.subtitle && (
              <p
                className="text-lg font-semibold mb-3 drop-shadow"
                style={{ color: slide.accent_color, textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
              >
                {slide.subtitle}
              </p>
            )}

            {/* Description */}
            {slide.description && (
              <p
                className="text-base mb-8 leading-relaxed max-w-md"
                style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
              >
                {slide.description}
              </p>
            )}

            {/* CTA */}
            <Link
              href={slide.cta_link}
              className="inline-flex items-center gap-2.5 font-bold px-8 py-4 text-sm tracking-widest uppercase transition-all duration-200 hover:gap-4 shadow-lg"
              style={{
                backgroundColor: slide.accent_color,
                color: slide.bg_color,
                boxShadow: `0 4px 24px ${slide.accent_color}55`,
              }}
            >
              {slide.cta_text}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Decorative slide counter */}
          <div className="absolute right-10 bottom-10 hidden lg:block pointer-events-none">
            <span
              className="font-bold opacity-10 leading-none"
              style={{ fontSize: 120, fontFamily: 'Georgia, serif', color: '#ffffff' }}
            >
              {String(current + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 'next' : 'prev')}
              aria-label={`Slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width:           i === current ? 28 : 8,
                height:          8,
                backgroundColor: i === current ? slide.accent_color : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {slides.length > 1 && !paused && anim === 'idle' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20 z-10">
          <div
            key={`progress-${current}`}
            className="h-full"
            style={{
              backgroundColor: slide.accent_color,
              animation: `heroProgress ${INTERVAL}ms linear`,
            }}
          />
        </div>
      )}
    </section>
  );
}
