'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewsletterForm() {
  const [email,     setEmail]     = useState('');
  const [honeypot,  setHoneypot]  = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email, website: honeypot || undefined });
      toast.success('Subscribed! Thank you.');
      setEmail('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Already subscribed or invalid email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      {/* Honeypot — hidden from humans, bots will fill it */}
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
        <label htmlFor="nl-website">Website</label>
        <input id="nl-website" type="text" name="website" tabIndex={-1} autoComplete="off"
          value={honeypot} onChange={e => setHoneypot(e.target.value)} />
      </div>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        required
        className="flex-1 px-5 py-3.5 bg-white text-[#1a1a1a] text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#893172]"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-[#893172] hover:bg-[#c09828] disabled:opacity-60 text-[#213885] font-bold px-6 py-3.5 text-sm tracking-wide uppercase transition-colors whitespace-nowrap"
      >
        {loading ? 'Subscribing…' : 'Subscribe'}
      </button>
    </form>
  );
}
