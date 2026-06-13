'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2, Info } from 'lucide-react';

type HealthStatus = 'ok' | 'warn' | 'error';
interface HealthCheck { status: HealthStatus; label: string; detail?: string }

const checkGuide: Record<string, string> = {
  Database:      'Your store data — products, orders, customers — lives here. If this shows an error, orders cannot be placed.',
  Storage:       'Where uploaded images and files are kept. An error here means product photos may not display.',
  Cache:         'Temporary files that speed up your store. A warning here is safe to fix by visiting Cache Management.',
  Queue:         'Background tasks like sending confirmation emails. An error means emails may be delayed.',
  'PHP Version': 'The programming language version running your store. A warning just means an upgrade is available.',
};

export default function HealthPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [health,  setHealth]  = useState<Record<string, HealthCheck> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get('/admin/site-tools/health'); setHealth(data); }
    catch { toast.error('Health check failed'); }
    finally { setLoading(false); }
  }

  const hasError = health && Object.values(health).some(c => c.status === 'error');
  const hasWarn  = health && Object.values(health).some(c => c.status === 'warn');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>System Health</h1>
          <p className="text-sm text-gray-500 mt-0.5">A quick check-up of all the services that keep your store running</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 transition-colors shrink-0">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
        </button>
      </div>

      {/* What this page does */}
      <div className="flex gap-3 bg-blue-50 border border-blue-200 px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          This page shows whether the key parts of your store are working correctly. Run it any time something seems wrong — slow pages, missing images, emails not arriving, or checkout issues. <strong>No action here changes anything on your store</strong> — it is read-only.
        </p>
      </div>

      {/* Status banner */}
      {health && (
        hasError ? (
          <div className="flex gap-3 bg-red-50 border border-red-300 px-4 py-3">
            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              <strong>One or more services have an error.</strong> Your store may be affected. Please contact your developer and share a screenshot of this page.
            </p>
          </div>
        ) : hasWarn ? (
          <div className="flex gap-3 bg-amber-50 border border-amber-300 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>There are some warnings.</strong> Your store is running, but some things could be improved. See the guide below each item for what to do.
            </p>
          </div>
        ) : (
          <div className="flex gap-3 bg-green-50 border border-green-300 px-4 py-3">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800"><strong>Everything looks good!</strong> All services are running normally.</p>
          </div>
        )
      )}

      {/* Health cards */}
      {!health ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.values(health).map((c, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 border ${
              c.status === 'ok'   ? 'border-green-200 bg-green-50' :
              c.status === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
            }`}>
              {c.status === 'ok'    && <CheckCircle   className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
              {c.status === 'warn'  && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
              {c.status === 'error' && <XCircle       className="w-5 h-5 text-red-500   shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold text-sm text-gray-800">{c.label}</p>
                {c.detail && <p className="text-xs text-gray-600 mt-0.5">{c.detail}</p>}
                {checkGuide[c.label] && (
                  <p className="text-xs text-gray-400 mt-1 italic">{checkGuide[c.label]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* When to check */}
      <div className="bg-gray-50 border border-gray-200 px-4 py-4 space-y-1.5">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">When should I run this?</p>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>When customers report they cannot complete a purchase</li>
          <li>When product images are not showing up</li>
          <li>When order confirmation emails are not being received</li>
          <li>After your hosting provider does maintenance work</li>
          <li>As a routine check once a week</li>
        </ul>
      </div>
    </div>
  );
}
