'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from '@/navigation';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import NewsletterPopup from '@/components/NewsletterPopup';
import AnnouncementBar from '@/components/AnnouncementBar';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import { useAuthStore } from '@/store/authStore';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';

const IDLE_MS = 15 * 60 * 1000;

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const pathname      = usePathname();
  const router        = useRouter();
  const fetchSettings = useSiteSettingsStore((s) => s.fetch);
  const { user, logout } = useAuthStore();

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleIdleLogout = useCallback(() => {
    logout();
    router.replace('/login');
  }, [logout, router]);

  useIdleTimeout(handleIdleLogout, IDLE_MS, !!user);

  // Admin routes are served outside [locale] and never reach StoreLayout,
  // but keep this guard as a safety net.
  if (pathname.startsWith('/admin')) return <>{children}</>;

  return (
    <>
      <Header />
      <AnnouncementBar />
      <main className="flex-1">{children}</main>
      <Footer />
      <NewsletterPopup />
    </>
  );
}
