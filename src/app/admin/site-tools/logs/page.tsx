'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FileText, Trash2, Loader2, RefreshCw } from 'lucide-react';

export default function LogsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [lines,    setLines]    = useState<string[] | null>(null);
  const [sizeKb,   setSizeKb]   = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/site-tools/logs');
      setLines(data.lines);
      setSizeKb(data.size_kb);
    } catch { toast.error('Could not load logs'); }
    finally { setLoading(false); }
  }

  async function clear() {
    setClearing(true);
    try {
      await api.post('/admin/site-tools/logs/clear');
      setLines([]); setSizeKb(0);
      toast.success('Log file cleared');
    } catch { toast.error('Could not clear logs'); }
    finally { setClearing(false); }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Log Viewer</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Last 150 lines of laravel.log {sizeKb > 0 && <span className="text-amber-600">({sizeKb} KB)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
          </button>
          {lines && lines.length > 0 && (
            <button onClick={clear} disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
              {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Clear Log
            </button>
          )}
        </div>
      </div>

      {lines === null ? (
        <div className="flex items-center justify-center h-40 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : lines.length === 0 ? (
        <div className="bg-white border border-[#cccacc] p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Log file is empty.</p>
        </div>
      ) : (
        <pre className="bg-gray-900 text-green-300 text-[11px] leading-relaxed p-5 overflow-auto max-h-[70vh] font-mono whitespace-pre-wrap rounded-sm">
          {lines.join('\n')}
        </pre>
      )}
    </div>
  );
}
