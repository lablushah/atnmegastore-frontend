'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import Logo from '@/components/Logo';
import api from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [showPw, setShowPw]     = useState(false);
  const [showCPw, setShowCPw]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [errors, setErrors]     = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');

  const strength = (() => {
    const pw = form.password;
    let score = 0;
    if (pw.length >= 8)   score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[\W_]/.test(pw)) score++;
    return score;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');

    if (!token || !email) {
      setGlobalError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, token, ...form });
      setDone(true);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setGlobalError(data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#f9f5f2]">
        <div className="w-full max-w-md bg-white border border-[#cccacc] p-8 text-center">
          <p className="text-sm text-red-600 mb-4">This reset link is invalid or incomplete.</p>
          <Link href="/forgot-password" className="text-sm text-[#213885] hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#f9f5f2]">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center mb-6">
            <Logo size="md" />
          </Link>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#fdf4f0] border border-[#cccacc] mb-4">
            <KeyRound className="w-6 h-6 text-[#213885]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Set a new password
          </h1>
          <p className="text-[#6b6b6b] mt-1 text-sm">Resetting password for <strong>{email}</strong></p>
        </div>

        <div className="bg-white border border-[#cccacc] p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Password updated!</h2>
              <p className="text-sm text-[#6b6b6b] mb-6">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-block w-full bg-[#213885] hover:bg-[#081849] text-white font-bold py-3 text-sm text-center transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {globalError && (
                <div className="bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {globalError}{' '}
                  {globalError.includes('expired') && (
                    <Link href="/forgot-password" className="underline font-medium">Request a new link</Link>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    autoFocus
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1.5">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{strengthLabel} — must include uppercase, number, and symbol</p>
                  </div>
                )}
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showCPw ? 'text' : 'password'}
                    value={form.password_confirmation}
                    onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCPw(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password_confirmation && (
                  <p className="text-xs text-red-600 mt-1">{errors.password_confirmation[0]}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || strength < 3}
                className="w-full bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white font-bold py-3 text-sm transition-colors"
              >
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}

          {!done && (
            <div className="mt-6 pt-5 border-t border-[#cccacc] text-center">
              <Link href="/login" className="text-sm text-[#213885] hover:underline">
                ← Back to sign in
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
