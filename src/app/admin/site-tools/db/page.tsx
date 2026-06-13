'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Trash2, Loader2, RefreshCw } from 'lucide-react';

interface DbStats { expired_tokens: number; failed_jobs: number }

export default function DbCleanupPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [stats,    setStats]    = useState<DbStats | null>(null);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
    load();
  }, [user]);

  async function load() {
    try { const { data } = await api.get('/admin/site-tools/db/stats'); setStats(data); }
    catch {}
  }

  async function clean() {
    setCleaning(true);
    try {
      const { data } = await api.post('/admin/site-tools/db/cleanup');
      toast.success(`Done — ${data.deleted.expired_tokens} tokens, ${data.deleted.failed_jobs} failed jobs removed`);
      load();
    } catch { toast.error('Cleanup failed'); }
    finally { setCleaning(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Database Cleanup</h1>
          <p className="text-sm text-gray-500 mt-0.5">Remove expired records to keep the database tidy</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-gray-700"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="bg-white border border-[#cccacc] p-6">
        {stats ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-[#213885]">{stats.expired_tokens}</p>
              <p className="text-xs text-gray-500 mt-1">Expired password reset tokens</p>
            </div>
            <div className="border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{stats.failed_jobs}</p>
              <p className="text-xs text-gray-500 mt-1">Failed queue jobs</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-6">Loading stats…</p>
        )}

        <button onClick={clean} disabled={cleaning || (stats ? stats.expired_tokens === 0 && stats.failed_jobs === 0 : false)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors">
          {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Run Cleanup
        </button>
      </div>
    </div>
  );
}
