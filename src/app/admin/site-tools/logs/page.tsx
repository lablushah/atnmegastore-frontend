'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canAccessSiteTools } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FileText, Trash2, Loader2, RefreshCw, Info, AlertTriangle } from 'lucide-react';

export default function LogsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [lines,    setLines]    = useState<string[] | null>(null);
  const [sizeKb,   setSizeKb]   = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canAccessSiteTools(user)) { router.push('/admin'); return; }
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
    if (!window.confirm('Clear the log file? You will not be able to recover these entries.')) return;
    setClearing(true);
    try {
      await api.post('/admin/site-tools/logs/clear');
      setLines([]); setSizeKb(0);
      toast.success('Log file cleared');
    } catch { toast.error('Could not clear logs'); }
    finally { setClearing(false); }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Log Viewer</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Read the store's error diary — last 150 lines
            {sizeKb > 0 && <span className="text-amber-600 ml-1">({sizeKb} KB on disk)</span>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
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

      {/* What are logs */}
      <div className="flex gap-3 bg-blue-50 border border-blue-200 px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>What are logs?</strong> Every time something unexpected happens on your store — an error, a failed payment, a missing file — the system quietly writes a note to this log file. It is like a diary of problems.</p>
          <p>You do not need to read or understand the technical details. The most useful thing is to <strong>copy this log and send it to your developer</strong> when you need to report a problem. It helps them diagnose the issue quickly.</p>
        </div>
      </div>

      {/* Warning about clearing */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Before clearing:</strong> If you are troubleshooting an issue, take a screenshot or copy the log contents first. Once cleared, the entries are permanently gone and cannot be recovered.
        </p>
      </div>

      {/* Log output */}
      {lines === null ? (
        <div className="flex items-center justify-center h-40 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : lines.length === 0 ? (
        <div className="bg-white border border-[#cccacc] p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Log file is empty</p>
          <p className="text-gray-400 text-xs mt-1">No errors have been recorded. That is a good sign!</p>
        </div>
      ) : (
        <pre className="bg-gray-900 text-green-300 text-[11px] leading-relaxed p-5 overflow-auto max-h-[60vh] font-mono whitespace-pre-wrap rounded-sm">
          {lines.join('\n')}
        </pre>
      )}

      {/* Guidance */}
      <div className="bg-gray-50 border border-gray-200 px-4 py-4 space-y-3">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">How to use this page</p>
        <div className="grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
          <div className="bg-white border border-gray-200 p-3">
            <p className="font-semibold text-gray-800 mb-1">Troubleshooting</p>
            <p>When something goes wrong, open this page and take a screenshot to share with your developer.</p>
          </div>
          <div className="bg-white border border-gray-200 p-3">
            <p className="font-semibold text-gray-800 mb-1">Large file warning</p>
            <p>If the file size shown above is over 5,000 KB, consider clearing it — old logs take up disk space.</p>
          </div>
          <div className="bg-white border border-gray-200 p-3">
            <p className="font-semibold text-gray-800 mb-1">Routine clearing</p>
            <p>Once a month, after reviewing, you can safely clear the log to free up server disk space.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
