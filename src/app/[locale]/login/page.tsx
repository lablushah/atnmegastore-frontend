'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, MailCheck, RefreshCw } from 'lucide-react';
import Logo from '@/components/Logo';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { setAuth, setPending } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/login', form);
      if (data.two_factor_required) {
        setPending(data.pending_token, data.two_factor_method);
        router.push('/2fa/verify');
      } else {
        setAuth(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name}!`);
        if (data.user.type === 'employee') {
          window.location.href = redirect !== '/' ? redirect : '/admin';
        } else {
          router.push(redirect as any);
        }
      }
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.email_not_verified) {
        setUnverifiedEmail(data.email ?? form.email);
      } else {
        toast.error(data?.message || t('login_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#f9f5f2]">
      <div className="w-full max-w-md">

        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center mb-6">
            <Logo size="md" />
          </Link>
          <h1 className="text-2xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            {t('welcome_back')}
          </h1>
          <p className="text-[#6b6b6b] mt-1 text-sm">{t('sign_in_subtitle')}</p>
        </div>

        {/* Form card */}
        <div className="bg-white border border-[#cccacc] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                {t('email')}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885] focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1a1a1a]">{t('password')}</label>
                <Link href="/forgot-password" className="text-xs text-[#213885] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {unverifiedEmail && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                <div className="flex items-start gap-2 mb-2">
                  <MailCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-800 font-medium">Email not verified</p>
                </div>
                <p className="text-amber-700 text-xs mb-2">
                  Please check <strong>{unverifiedEmail}</strong> for your verification link.
                </p>
                <button
                  type="button"
                  disabled={resendBusy}
                  onClick={async () => {
                    setResendBusy(true);
                    try {
                      await api.post('/email/resend', { email: unverifiedEmail });
                      toast.success('Verification email resent!');
                    } catch {
                      toast.error('Could not resend. Please try again shortly.');
                    } finally {
                      setResendBusy(false);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#213885] hover:underline disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendBusy ? 'Sending…' : 'Resend verification email'}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white font-bold py-3 text-sm transition-colors"
            >
              {loading ? t('signing_in') : t('sign_in')}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#cccacc] text-center text-sm text-[#6b6b6b]">
            {t('no_account')}{' '}
            <Link href="/register" className="text-[#213885] font-semibold hover:underline">
              {t('create_one')}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
