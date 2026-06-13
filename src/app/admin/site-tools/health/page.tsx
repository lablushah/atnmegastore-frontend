'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

type HealthStatus = 'ok' | 'warn' | 'error';
interface HealthCheck { status: HealthStatus; label: string; detail?: string }

export default function HealthPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [health,   setHealth]   = useState<Record<string, HealthCheck> | null>(null);
  const [loading,  setLoading]  = useState(false);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>System Health</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live status of all critical services</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 transition-colors">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
        </button>
      </div>
      {!health ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.values(health).map((c, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 border rounded-sm ${
              c.status === 'ok'   ? 'border-green-200 bg-green-50' :
              c.status === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
            }`}>
              {c.status === 'ok'   && <CheckCircle   className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
              {c.status === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
              {c.status === 'error'&& <XCircle       className="w-5 h-5 text-red-500   shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold text-sm text-gray-800">{c.label}</p>
                {c.detail && <p className="text-xs text-gray-500 mt-0.5">{c.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
