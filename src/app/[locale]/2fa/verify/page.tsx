'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const { pendingToken, twoFactorMethod, setAuth, clearPending } = useAuthStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const verified = useRef(false);

  // Only redirect to login if we land here without a pending token AND haven't just verified.
  // Must NOT watch pendingToken changes — setAuth clears it on success, which would
  // otherwise race with the outbound router.push and send the user back to /login.
  useEffect(() => {
    if (!pendingToken) router.replace('/login');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingToken) return;
    setLoading(true);
    try {
      const { data } = await api.post('/2fa/verify', { pending_token: pendingToken, code: code.trim() });
      verified.current = true;   // prevent the mount-guard from firing on pendingToken clear
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push(data.user.type === 'employee' ? '/admin' : '/');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid code');
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!pendingToken || cooldown > 0) return;
    setResending(true);
    try {
      await api.post('/2fa/send-otp', { pending_token: pendingToken });
      toast.success('New code sent to your email.');
      setCooldown(60);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send code');
    } finally {
      setResending(false);
    }
  }

  if (!pendingToken) return null;

  const isEmail = twoFactorMethod === 'email';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
              <span>Password</span>
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className="flex items-center gap-1.5 text-xs text-[#213885] font-semibold">
              <span className="w-5 h-5 rounded-full bg-[#213885] text-white flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Verification</span>
            </div>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#fdf4f0] border border-[#cccacc] mb-4">
            <ShieldCheck className="w-8 h-8 text-[#213885]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            One more step
          </h1>
          <p className="text-[#6b6b6b] mt-2 text-sm">
            {isEmail
              ? <>A 6-digit code was sent to your email. <strong>Check your inbox</strong> and enter it below.</>
              : 'Enter the 6-digit code from your authenticator app.'}
          </p>
        </div>

        <div className="bg-white border border-[#cccacc] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                pattern="[0-9A-Za-z\-]{6,11}"
                maxLength={11}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\s/g, ''))}
                placeholder="000000"
                className="w-full border border-gray-300 px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#213885]"
                required
              />
              <p className="text-xs text-[#6b6b6b] mt-2 text-center">
                You can also enter a recovery code (e.g. XXXXX-XXXXX)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.trim().length < 6}
              className="w-full bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white font-bold py-3 transition-colors"
            >
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
          </form>

          {isEmail && (
            <div className="mt-4 text-center">
              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="flex items-center gap-1.5 mx-auto text-sm text-[#213885] hover:text-[#081849] disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={() => { clearPending(); router.push('/login'); }}
              className="text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
