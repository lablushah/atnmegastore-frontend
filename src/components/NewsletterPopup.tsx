'use client';

import { useEffect, useState } from 'react';
import { X, Tag, Mail, CheckCircle, Copy, Check } from 'lucide-react';
import api from '@/lib/api';

interface PopupData {
  id: number;
  title: string;
  subtitle: string | null;
  body: string | null;
  discount_code: string | null;
  button_text: string;
  image_url: string | null;
  delay_seconds: number;
  show_once: boolean;
}

const STORAGE_KEY = (id: number) => `atn_popup_dismissed_${id}`;

export default function NewsletterPopup() {
  const [popup,     setPopup]     = useState<PopupData | null>(null);
  const [visible,   setVisible]   = useState(false);

  // Form state
  const [email,     setEmail]     = useState('');
  const [honeypot,  setHoneypot]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');

  // Discount code copy state
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch the active popup
    api.get('/popup').then((r) => {
      const data: PopupData | null = r.data;
      if (!data) return;

      // Check if already dismissed (show_once logic)
      if (data.show_once && localStorage.getItem(STORAGE_KEY(data.id))) return;

      // Schedule the popup to appear after delay
      const timer = setTimeout(() => {
        setPopup(data);
        setVisible(true);
      }, (data.delay_seconds ?? 4) * 1000);

      return () => clearTimeout(timer);
    }).catch(() => {/* silently ignore — popup is optional */});
  }, []);

  const dismiss = () => {
    setVisible(false);
    if (popup?.show_once) {
      localStorage.setItem(STORAGE_KEY(popup.id), '1');
    }
    // Fade out then remove
    setTimeout(() => setPopup(null), 300);
  };

  const copyCode = () => {
    if (!popup?.discount_code) return;
    navigator.clipboard.writeText(popup.discount_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setSubmitting(true);
    try {
      await api.post('/newsletter/subscribe', { email: email.trim(), website: honeypot || undefined });
      setSuccess(true);
      if (popup?.show_once) {
        localStorage.setItem(STORAGE_KEY(popup!.id), '1');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Something went wrong. Please try again.';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (!popup) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[999] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={dismiss}
      />

      {/* Popup panel */}
      <div
        className={`fixed z-[1000] inset-x-4 bottom-4 sm:inset-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-lg transition-all duration-300 ${
          visible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={popup.title}
      >
        <div className="bg-white shadow-2xl overflow-hidden">

          {/* Optional image banner */}
          {popup.image_url && (
            <div className="relative h-40 bg-[#e8e3f0] overflow-hidden">
              <img
                src={popup.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
            </div>
          )}

          {/* Content */}
          <div className="relative p-7 sm:p-8">

            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {!success ? (
              <>
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#e8e3f0] text-[#213885] mb-4">
                  <Mail className="w-6 h-6" />
                </div>

                {/* Headline */}
                <h2
                  className="text-2xl font-bold text-[#1a1a1a] leading-tight mb-2 pr-6"
                  style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}
                >
                  {popup.title}
                </h2>

                {popup.subtitle && (
                  <p className="text-sm font-semibold text-[#213885] mb-2">{popup.subtitle}</p>
                )}

                {popup.body && (
                  <p className="text-sm text-[#6b6b6b] leading-relaxed mb-4">{popup.body}</p>
                )}

                {/* Discount code */}
                {popup.discount_code && (
                  <div className="flex items-center gap-2 bg-[#e8e3f0] border border-[#cccacc] px-4 py-3 mb-5">
                    <Tag className="w-4 h-4 text-[#213885] shrink-0" />
                    <span className="flex-1 font-mono font-bold text-[#213885] tracking-widest text-sm">
                      {popup.discount_code}
                    </span>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="flex items-center gap-1 text-xs font-semibold text-[#213885] hover:underline shrink-0"
                    >
                      {copied
                        ? <><Check className="w-3.5 h-3.5" /> Copied!</>
                        : <><Copy className="w-3.5 h-3.5" /> Copy</>
                      }
                    </button>
                  </div>
                )}

                {/* Newsletter form */}
                <form onSubmit={handleSubscribe} className="space-y-3">
                  {/* Honeypot — hidden from humans, bots will fill it */}
                  <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                    <label htmlFor="popup-website">Website</label>
                    <input id="popup-website" type="text" name="website" tabIndex={-1} autoComplete="off"
                      value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      className="flex-1 border border-[#cccacc] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#213885] bg-white"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-[#213885] hover:bg-[#081849] text-white font-semibold px-5 py-2.5 text-sm tracking-wide uppercase disabled:opacity-50 transition-colors shrink-0 flex items-center gap-2"
                    >
                      {submitting && (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {popup.button_text || 'Subscribe'}
                    </button>
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                </form>

                <button
                  onClick={dismiss}
                  className="mt-4 text-xs text-[#9b9590] hover:text-[#6b6b6b] underline block mx-auto"
                >
                  No thanks, I don't want exclusive offers
                </button>
              </>
            ) : (
              /* Success state */
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 text-green-600 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3
                  className="text-xl font-bold text-[#1a1a1a] mb-2"
                  style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}
                >
                  You're subscribed!
                </h3>
                <p className="text-sm text-[#6b6b6b] mb-2">
                  Welcome to the ATN Book & Crafts family. Look out for exclusive deals in your inbox.
                </p>
                {popup.discount_code && (
                  <p className="text-sm font-semibold text-[#213885]">
                    Use code <span className="font-mono bg-[#e8e3f0] px-2 py-0.5">{popup.discount_code}</span> on your next order!
                  </p>
                )}
                <button
                  onClick={dismiss}
                  className="mt-5 bg-[#213885] hover:bg-[#081849] text-white font-semibold px-8 py-3 text-sm tracking-wide uppercase transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
