'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { RefreshCw, Trash2, Loader2 } from 'lucide-react';

export default function CachePage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [clearing,   setClearing]   = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [clearedAt,  setClearedAt]  = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
    api.get('/admin/site-tools/cache/status').then(r => setClearedAt(r.data.cleared_at)).catch(() => {});
  }, [user]);

  async function clearCache() {
    setClearing(true);
    try {
      const { data } = await api.post('/admin/site-tools/cache/clear');
      setClearedAt(data.cleared_at);
      toast.success('All caches cleared');
    } catch { toast.error('Cache clear failed'); }
    finally { setClearing(false); }
  }

  async function rebuildCache() {
    setRebuilding(true);
    try { await api.post('/admin/site-tools/cache/rebuild'); toast.success('Cache rebuilt'); }
    catch { toast.error('Cache rebuild failed'); }
    finally { setRebuilding(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Cache Management</h1>
      <p className="text-sm text-gray-500 mb-8">Clear or rebuild Laravel application caches</p>

      <div className="bg-white border border-[#cccacc] p-6 space-y-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={clearCache} disabled={clearing || rebuilding}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors">
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Clear All Cache
          </button>
          <button onClick={rebuildCache} disabled={clearing || rebuilding}
            className="flex items-center gap-2 bg-[#213885] hover:bg-[#1a2d6b] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors">
            {rebuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Rebuild Cache
          </button>
        </div>

        {clearedAt && (
          <p className="text-xs text-gray-400">
            Last cleared: {new Date(clearedAt).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-600">
          <p><strong>Clear All Cache</strong> — removes app cache, config cache, route cache, and compiled views.</p>
          <p><strong>Rebuild Cache</strong> — re-generates config and route caches for production performance. Run this after deploying changes.</p>
        </div>
      </div>
    </div>
  );
}
