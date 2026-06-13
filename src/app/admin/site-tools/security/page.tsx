'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, Trash2, Loader2, Info, AlertTriangle } from 'lucide-react';

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
    if (!window.confirm(`Delete this file?\n\n${path}\n\nThis cannot be undone.`)) return;
    setDeleting(path);
    try {
      await api.delete('/admin/site-tools/security/file', { data: { path } });
      setResult(r => r ? { ...r, found: r.found.filter(f => f.path !== path) } : r);
      toast.success('File deleted');
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Security Scan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Check your uploads folder for files that should not be there</p>
        </div>
        <button onClick={scan} disabled={scanning}
          className="flex items-center gap-2 bg-[#213885] hover:bg-[#1a2d6b] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors shrink-0">
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {scanning ? 'Scanning…' : 'Scan Now'}
        </button>
      </div>

      {/* What is this */}
      <div className="flex gap-3 bg-blue-50 border border-blue-200 px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>What does this scan for?</strong> Your store allows customers and staff to upload images (for products, etc.). Sometimes, malicious individuals try to upload hidden script files instead of images. These files could give an attacker control over your website.</p>
          <p>This scan checks your uploads folder for files with dangerous extensions like <strong>.php, .exe, .sh</strong> — file types that should never appear in an image upload folder.</p>
        </div>
      </div>

      {/* Warning about deleting */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 space-y-1">
          <p><strong>Before deleting flagged files:</strong> If you are unsure whether a file is genuinely harmful, take a screenshot and contact your developer first. Deleting the wrong file is permanent. That said, <em>images</em> in your uploads folder should never have .php, .exe, or .sh extensions — those are always suspicious.</p>
        </div>
      </div>

      {/* Scan results */}
      {!result && !scanning && (
        <div className="bg-white border border-[#cccacc] p-16 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">No scan has been run yet</p>
          <p className="text-gray-400 text-xs mt-1">Click <strong>Scan Now</strong> to check your uploads folder for suspicious files.</p>
        </div>
      )}

      {result && (
        <>
          <p className="text-xs text-gray-500">{result.scanned} files scanned in the uploads folder</p>
          {result.found.length === 0 ? (
            <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 px-4 py-4">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">No suspicious files found</p>
                <p className="text-sm mt-0.5">Your uploads folder is clean. All files look like normal images and documents.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-red-200">
              <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                <p className="text-sm font-semibold text-red-700">{result.found.length} suspicious file(s) detected</p>
                <p className="text-xs text-red-600 mt-0.5">These files have extensions that should not appear in an uploads folder. Review each one and delete if you did not intentionally upload it.</p>
              </div>
              {result.found.map(f => (
                <div key={f.path} className="flex items-center justify-between gap-3 px-4 py-4 border-b border-red-100 last:border-b-0">
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-red-800 truncate">{f.path}</p>
                    <p className="text-xs text-red-400 mt-0.5">
                      Type: <strong>.{f.ext}</strong> &nbsp;·&nbsp; Size: {f.size_kb} KB &nbsp;·&nbsp; Last modified: {f.modified}
                    </p>
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

      {/* When to scan */}
      <div className="bg-gray-50 border border-gray-200 px-4 py-4 space-y-1.5">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">How often should I scan?</p>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Once a week as a routine check</li>
          <li>After you notice any unusual activity on the store</li>
          <li>After giving a new staff member access to upload files</li>
          <li>If a customer or employee reports something strange on the site</li>
        </ul>
      </div>
    </div>
  );
}
