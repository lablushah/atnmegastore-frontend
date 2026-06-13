'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { setAuth }  = useAuthStore();

  useEffect(() => {
    const code  = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      toast.error(decodeURIComponent(error));
      router.replace('/login');
      return;
    }

    if (!code) {
      router.replace('/login');
      return;
    }

    api.post('/auth/social/exchange', { code })
      .then(({ data }) => {
        setAuth(data.user, data.token);
        toast.success(`Welcome, ${data.user.name}!`);
        if (data.user.type === 'employee') {
          window.location.href = '/admin';
        } else {
          router.replace('/');
        }
      })
      .catch(() => {
        toast.error('Sign-in failed. Please try again.');
        router.replace('/login');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f9f5f2]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#213885] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#6b6b6b]">Completing sign-in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center bg-[#f9f5f2]">
        <div className="w-10 h-10 border-4 border-[#213885] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
