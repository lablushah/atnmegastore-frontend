'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canAccessSiteTools } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { RefreshCw, Trash2, Loader2, Info, AlertTriangle } from 'lucide-react';

export default function CachePage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [clearing,   setClearing]   = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [clearedAt,  setClearedAt]  = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canAccessSiteTools(user)) { router.push('/admin'); return; }
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Cache Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Speed up your store or clear stale data after making changes</p>
      </div>

      {/* What is cache */}
      <div className="flex gap-3 bg-blue-50 border border-blue-200 px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>What is cache?</strong> Your store saves a temporary copy of settings, menus, and other data so it does not have to re-calculate them on every page load. This makes the store faster for visitors.</p>
          <p>Sometimes, after you make changes (update settings, add products, change prices), the store keeps showing the old cached version. Clearing the cache forces the store to re-read the latest data.</p>
        </div>
      </div>

      {/* Safe to use */}
      <div className="flex gap-3 bg-green-50 border border-green-200 px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
        <p className="text-sm text-green-800">
          <strong>Safe to use anytime.</strong> Clearing the cache does not delete any products, orders, or customer data. It only removes temporary speed files. The store will rebuild them automatically as visitors browse.
        </p>
      </div>

      {/* Actions */}
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

        {/* Explanation of each button */}
        <div className="border-t border-gray-100 pt-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Clear All Cache</p>
            <p className="text-sm text-gray-600">Removes all temporary files. The store will run a little slower for the next few minutes while it rebuilds them, but this is normal and temporary. <strong>Use this when changes you made are not showing up on the store.</strong></p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Rebuild Cache</p>
            <p className="text-sm text-gray-600">Re-generates the speed files immediately. Run this after clearing, or after any technical updates are deployed to the server. It makes the store fast right away instead of waiting for the first visitor to trigger it.</p>
          </div>
        </div>
      </div>

      {/* When to use */}
      <div className="bg-gray-50 border border-gray-200 px-4 py-4 space-y-1.5">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">When should I clear the cache?</p>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>A price or product description you updated is not showing the new value</li>
          <li>A setting (like store name or logo) was changed but the old one still appears</li>
          <li>After a developer deploys code changes to the server</li>
          <li>If the store feels slow or unresponsive</li>
        </ul>
      </div>
    </div>
  );
}
