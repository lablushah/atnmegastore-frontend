'use client';

import { useState } from 'react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, MailCheck, RefreshCw } from 'lucide-react';
import Logo from '@/components/Logo';
import SocialAuthButtons from '@/components/SocialAuthButtons';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error(t('passwords_mismatch'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/register', form);
      setRegisteredEmail(form.email);
      setVerificationSent(true);
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach((msgs: any) => toast.error(msgs[0]));
      } else {
        toast.error(t('register_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name',                  label: t('full_name'),        type: 'text',     placeholder: 'John Doe',         autoComplete: 'name' },
    { name: 'email',                 label: t('email'),            type: 'email',    placeholder: 'you@example.com',  autoComplete: 'email' },
    { name: 'password',              label: t('password'),         type: 'password', placeholder: '••••••••',         autoComplete: 'new-password' },
    { name: 'password_confirmation', label: t('confirm_password'), type: 'password', placeholder: '••••••••',         autoComplete: 'new-password' },
  ] as const;

  // Show email verification pending screen after successful registration
  if (verificationSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#f9f5f2]">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-flex justify-center mb-8"><Logo size="md" /></Link>
          <div className="bg-white border border-[#cccacc] p-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-8 h-8 text-[#213885]" />
            </div>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
              Check Your Email
            </h2>
            <p className="text-sm text-[#6b6b6b] mb-1">We sent a verification link to:</p>
            <p className="font-semibold text-[#213885] mb-4">{registeredEmail}</p>
            <p className="text-sm text-[#6b6b6b] mb-6">
              Click the link in the email to activate your account. The link expires in 24 hours.
            </p>
            <button
              onClick={async () => {
                try {
                  await api.post('/email/resend', { email: registeredEmail });
                  toast.success('Verification email resent!');
                } catch {
                  toast.error('Could not resend. Please try again shortly.');
                }
              }}
              className="flex items-center justify-center gap-2 mx-auto text-sm text-[#213885] hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resend verification email
            </button>
            <div className="mt-6 pt-5 border-t border-[#cccacc] text-sm text-[#6b6b6b]">
              Already verified?{' '}
              <Link href="/login" className="text-[#213885] font-semibold hover:underline">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {t('create_account')}
          </h1>
          <p className="text-[#6b6b6b] mt-1 text-sm">{t('register_subtitle')}</p>
        </div>

        {/* Form card */}
        <div className="bg-white border border-[#cccacc] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map(({ name, label, type, placeholder, autoComplete }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                    value={(form as any)[name]}
                    onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                    required
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885] focus:border-transparent"
                  />
                  {type === 'password' && name === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 -mt-2">
              Password must be at least 8 characters and include an uppercase letter, a number, and a special character (e.g. !@#$).
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white font-bold py-3 text-sm transition-colors"
            >
              {loading ? t('creating') : t('create')}
            </button>
          </form>

          <SocialAuthButtons />

          <div className="mt-5 pt-5 border-t border-[#cccacc] text-center text-sm text-[#6b6b6b]">
            {t('have_account')}{' '}
            <Link href="/login" className="text-[#213885] font-semibold hover:underline">
              {t('sign_in_link')}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
