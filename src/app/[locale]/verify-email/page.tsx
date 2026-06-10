'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import Logo from '@/components/Logo';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const token = searchParams.get('token') ?? '';
  const emailParam = searchParams.get('email') ?? '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendBusy, setResendBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Verification token is missing. Please use the link from your email.');
      setStatus('error');
      return;
    }

    api.post('/email/verify', { token })
      .then(({ data }) => {
        setAuth(data.user, data.token);
        setStatus('success');
        toast.success('Email verified! Welcome to ATN Mega Store.');
        setTimeout(() => router.push('/'), 2500);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message ?? 'Verification failed. The link may have expired.';
        setErrorMsg(msg);
        setStatus('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    if (!emailParam) {
      toast.error('Please go back to the login page and request a new verification link.');
      return;
    }
    setResendBusy(true);
    try {
      await api.post('/email/resend', { email: emailParam });
      toast.success('Verification email resent! Check your inbox.');
    } catch {
      toast.error('Could not resend. Please try again shortly.');
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#f9f5f2]">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex justify-center mb-8">
          <Logo size="md" />
        </Link>

        <div className="bg-white border border-[#cccacc] p-8">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-[#213885] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-2"
                style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
                Verifying your email…
              </h2>
              <p className="text-sm text-[#6b6b6b]">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-2"
                style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
                Email Verified!
              </h2>
              <p className="text-sm text-[#6b6b6b] mb-4">
                Your account is now active. Redirecting you to the homepage…
              </p>
              <Link
                href="/"
                className="inline-block bg-[#213885] hover:bg-[#081849] text-white text-sm font-bold px-6 py-2.5 transition-colors"
              >
                Go to Homepage
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-2"
                style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
                Verification Failed
              </h2>
              <p className="text-sm text-[#6b6b6b] mb-4">{errorMsg}</p>

              <button
                onClick={handleResend}
                disabled={resendBusy}
                className="flex items-center justify-center gap-2 mx-auto text-sm text-[#213885] hover:underline disabled:opacity-50 mb-4"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {resendBusy ? 'Sending…' : 'Resend verification email'}
              </button>

              <div className="pt-4 border-t border-[#cccacc] text-sm text-[#6b6b6b]">
                Already verified?{' '}
                <Link href="/login" className="text-[#213885] font-semibold hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
