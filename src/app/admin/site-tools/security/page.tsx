'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, Trash2, Loader2 } from 'lucide-react';

interface SuspiciousFile { path: string; ext: string; size_kb: number; modified: string }

export default function SecurityPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [result,   setResult]   = useState<{ found: SuspiciousFile[]; scanned: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
  }, [user]);

  async function scan() {
    setScanning(true); setResult(null);
    try {
      const { data } = await api.get('/admin/site-tools/security/scan');
      setResult(data);
      if (data.found.length === 0) toast.success(`${data.scanned} files scanned — nothing suspicious`);
      else toast.error(`${data.found.length} suspicious file(s) found`);
    } catch { toast.error('Scan failed'); }
    finally { setScanning(false); }
  }

  async function deleteFile(path: string) {
    if (!window.confirm(`Delete ${path}?`)) return;
    setDeleting(path);
    try {
      await api.delete('/admin/site-tools/security/file', { data: { path } });
      setResult(r => r ? { ...r, found: r.found.filter(f => f.path !== path) } : r);
      toast.success('File deleted');
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Security Scan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Scan uploaded files for malicious extensions</p>
        </div>
        <button onClick={scan} disabled={scanning}
          className="flex items-center gap-2 bg-[#213885] hover:bg-[#1a2d6b] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors">
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {scanning ? 'Scanning…' : 'Scan Now'}
        </button>
      </div>

      {!result && !scanning && (
        <div className="bg-white border border-[#cccacc] p-16 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Click <strong>Scan Now</strong> to check for suspicious files in the uploads directory.</p>
          <p className="text-xs text-gray-400 mt-1">Flags .php, .exe, .sh, .phar and similar extensions.</p>
        </div>
      )}

      {result && (
        <>
          <p className="text-xs text-gray-500 mb-3">Scanned {result.scanned} files in storage/app/public</p>
          {result.found.length === 0 ? (
            <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 px-4 py-3">
              <CheckCircle className="w-5 h-5" /> No suspicious files found. Storage is clean.
            </div>
          ) : (
            <div className="bg-white border border-red-200 divide-y divide-red-100">
              <div className="px-4 py-2 bg-red-50 text-xs font-semibold text-red-700 uppercase tracking-wide">
                {result.found.length} suspicious file(s) found
              </div>
              {result.found.map(f => (
                <div key={f.path} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-red-800 truncate">{f.path}</p>
                    <p className="text-xs text-red-400">.{f.ext} · {f.size_kb} KB · {f.modified}</p>
                  </div>
                  <button onClick={() => deleteFile(f.path)} disabled={deleting === f.path}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-semibold shrink-0 disabled:opacity-50 transition-colors">
                    {deleting === f.path ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
