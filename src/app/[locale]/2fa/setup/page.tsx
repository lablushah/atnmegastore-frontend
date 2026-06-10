'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Copy, Check, RefreshCw, Smartphone, Mail } from 'lucide-react';
import QRCode from 'qrcode';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

type Step = 'choose' | 'totp-scan' | 'email-sent' | 'confirm' | 'recovery';

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const { user, setAuth, token, _hasHydrated } = useAuthStore();

  const [step, setStep] = useState<Step>('choose');
  const [method, setMethod] = useState<'totp' | 'email'>('totp');
  const [secret, setSecret] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.replace('/login'); return; }
  }, [_hasHydrated, user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleChooseMethod() {
    setLoading(true);
    try {
      const { data } = await api.post('/2fa/setup', { method });
      if (method === 'totp') {
        setSecret(data.secret);
        const url = await QRCode.toDataURL(data.qr_uri, { width: 240, margin: 2 });
        setQrDataUrl(url);
        setStep('totp-scan');
      } else {
        setStep('email-sent');
        setCooldown(60);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/2fa/setup/confirm', { code: code.trim() });
      setRecoveryCodes(data.recovery_codes);
      // Refresh user data so two_factor_enabled is updated
      const meRes = await api.get('/me');
      setAuth(meRes.data, token!);
      setStep('recovery');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid code');
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await api.post('/2fa/setup/send-otp');
      toast.success('New code sent to your email.');
      setCooldown(60);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send code');
    } finally {
      setResending(false);
    }
  }

  function copyRecoveryCodes() {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!user) return null;

  const inputCls = 'w-full border border-gray-300 px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#213885]';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#fdf4f0] border border-[#cccacc] mb-4">
            <ShieldCheck className="w-8 h-8 text-[#213885]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Set Up Two-Factor Authentication
          </h1>
          {user.type === 'employee' && !user.two_factor_enabled && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 mt-3">
              2FA is required for staff accounts. Please complete setup to access the admin panel.
            </p>
          )}
        </div>

        <div className="bg-white border border-[#cccacc] p-8">

          {/* Step 1 — Choose method */}
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="text-sm text-[#6b6b6b] mb-4">Choose how you want to receive your verification codes:</p>

              <button
                onClick={() => setMethod('totp')}
                className={`w-full flex items-center gap-4 p-4 border text-left transition-colors ${method === 'totp' ? 'border-[#213885] bg-[#fdf4f0]' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className={`p-2 ${method === 'totp' ? 'bg-[#213885] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a1a] text-sm">Authenticator App</p>
                  <p className="text-xs text-[#6b6b6b]">Google Authenticator, Authy, 1Password, etc.</p>
                </div>
                {method === 'totp' && <Check className="w-4 h-4 text-[#213885] ml-auto" />}
              </button>

              <button
                onClick={() => setMethod('email')}
                className={`w-full flex items-center gap-4 p-4 border text-left transition-colors ${method === 'email' ? 'border-[#213885] bg-[#fdf4f0]' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className={`p-2 ${method === 'email' ? 'bg-[#213885] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a1a] text-sm">Email OTP</p>
                  <p className="text-xs text-[#6b6b6b]">Receive a code at {user.email}</p>
                </div>
                {method === 'email' && <Check className="w-4 h-4 text-[#213885] ml-auto" />}
              </button>

              <button
                onClick={handleChooseMethod}
                disabled={loading}
                className="w-full mt-2 bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white font-bold py-3 transition-colors"
              >
                {loading ? 'Setting up…' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 2a — TOTP QR code */}
          {step === 'totp-scan' && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-[#1a1a1a] mb-1">1. Scan this QR code</p>
                <p className="text-xs text-[#6b6b6b] mb-3">Open your authenticator app and scan the QR code below.</p>
                {qrDataUrl && (
                  <div className="flex justify-center">
                    <img src={qrDataUrl} alt="2FA QR Code" className="w-48 h-48 border border-gray-200" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a] mb-1">Can't scan? Enter this key manually:</p>
                <code className="block bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-mono text-center tracking-widest break-all">{secret}</code>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a] mb-2">2. Enter the 6-digit code from your app</p>
                <form onSubmit={handleConfirm} className="space-y-3">
                  <input autoFocus type="text" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" className={inputCls} required />
                  <button type="submit" disabled={loading || code.length !== 6} className="w-full bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white font-bold py-3 transition-colors">
                    {loading ? 'Verifying…' : 'Confirm & Enable 2FA'}
                  </button>
                </form>
              </div>
              <button onClick={() => setStep('choose')} className="w-full text-sm text-[#6b6b6b] hover:text-[#1a1a1a]">← Change method</button>
            </div>
          )}

          {/* Step 2b — Email OTP */}
          {step === 'email-sent' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                A verification code has been sent to <strong>{user.email}</strong>.
              </div>
              <form onSubmit={handleConfirm} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Enter the 6-digit code</label>
                  <input autoFocus type="text" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" className={inputCls} required />
                </div>
                <button type="submit" disabled={loading || code.length !== 6} className="w-full bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white font-bold py-3 transition-colors">
                  {loading ? 'Verifying…' : 'Confirm & Enable 2FA'}
                </button>
              </form>
              <div className="text-center">
                <button onClick={handleResend} disabled={resending || cooldown > 0} className="flex items-center gap-1.5 mx-auto text-sm text-[#213885] hover:text-[#081849] disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
              <button onClick={() => setStep('choose')} className="w-full text-sm text-[#6b6b6b] hover:text-[#1a1a1a]">← Change method</button>
            </div>
          )}

          {/* Step 3 — Recovery codes */}
          {step === 'recovery' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <strong>Save these recovery codes</strong> in a safe place. Each code can be used once if you lose access to your {method === 'totp' ? 'authenticator app' : 'email'}.
              </div>
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((c) => (
                  <code key={c} className="bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-mono text-center">{c}</code>
                ))}
              </div>
              <button onClick={copyRecoveryCodes} className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy all codes'}
              </button>
              <button
                onClick={() => router.push(user?.type === 'employee' ? '/admin' : '/account')}
                className="w-full bg-[#213885] hover:bg-[#081849] text-white font-bold py-3 transition-colors"
              >
                Done — I've saved my codes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
