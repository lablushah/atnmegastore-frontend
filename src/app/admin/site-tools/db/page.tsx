'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canAccessSiteTools } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Trash2, Loader2, RefreshCw, Info, CheckCircle } from 'lucide-react';

interface DbStats { expired_tokens: number; failed_jobs: number }

export default function DbCleanupPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [stats,    setStats]    = useState<DbStats | null>(null);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canAccessSiteTools(user)) { router.push('/admin'); return; }
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

  const nothingToClean = stats ? stats.expired_tokens === 0 && stats.failed_jobs === 0 : false;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Database Cleanup</h1>
        <p className="text-sm text-gray-500 mt-0.5">Remove expired records to keep your database running efficiently</p>
      </div>

      {/* What is this */}
      <div className="flex gap-3 bg-blue-50 border border-blue-200 px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>What does this do?</strong> Over time, your database accumulates leftover records that are no longer needed — like expired password-reset links and background tasks that failed. This tool removes them safely.</p>
          <p>Think of it like clearing out old sticky notes from a desk: the important work stays untouched, and the desk becomes easier to work with.</p>
        </div>
      </div>

      {/* Safe notice */}
      <div className="flex gap-3 bg-green-50 border border-green-200 px-4 py-3">
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
        <p className="text-sm text-green-800">
          <strong>Completely safe.</strong> This cleanup only removes expired and failed records — nothing that affects your products, orders, customers, or any business data.
        </p>
      </div>

      {/* Stats + button */}
      <div className="bg-white border border-[#cccacc] p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-gray-700">Records ready to be removed</p>
          <button onClick={load} className="text-gray-400 hover:text-gray-700"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {stats ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-[#213885]">{stats.expired_tokens}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">Expired password reset links</p>
              <p className="text-xs text-gray-400 mt-1">Links sent when users forgot their password, now past their expiry time</p>
            </div>
            <div className="border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{stats.failed_jobs}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">Failed background tasks</p>
              <p className="text-xs text-gray-400 mt-1">Background tasks (like sending emails) that did not complete successfully</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-6">Loading stats…</p>
        )}

        {nothingToClean ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 mb-4">
            <CheckCircle className="w-4 h-4" /> Your database is already clean — nothing to remove.
          </div>
        ) : null}

        <button onClick={clean} disabled={cleaning || nothingToClean}
          className="flex items-center gap-2 bg-[#213885] hover:bg-[#1a2d6b] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors">
          {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Run Cleanup
        </button>
      </div>

      {/* When to use */}
      <div className="bg-gray-50 border border-gray-200 px-4 py-4 space-y-1.5">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">How often should I run this?</p>
        <p className="text-sm text-gray-600">Once a month is plenty for most stores. If you see large numbers in the counters above, run it sooner. There is no harm in running it more frequently — it is always safe.</p>
      </div>
    </div>
  );
}
