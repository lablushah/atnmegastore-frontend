'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Package, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';

interface ComposerPkg { name: string; version: string; latest: string; description?: string }

export default function DependenciesPage() {
  const { user }  = useAuthStore();
  const router    = useRouter();
  const [pkgs,         setPkgs]         = useState<ComposerPkg[] | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [updatingPkg,  setUpdatingPkg]  = useState<string | null>(null);
  const [updatingAll,  setUpdatingAll]  = useState(false);
  const [output,       setOutput]       = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
  }, [user]);

  async function check() {
    setLoading(true); setPkgs(null); setOutput(null);
    try {
      const { data } = await api.get('/admin/site-tools/composer/outdated');
      setPkgs(data.packages);
      if (data.packages.length === 0) toast.success('All packages are up to date');
    } catch { toast.error('Could not check packages'); }
    finally { setLoading(false); }
  }

  async function update(pkg?: string) {
    if (!window.confirm(pkg
      ? `Update ${pkg}? This modifies production dependencies.`
      : 'Update ALL packages? This may introduce breaking changes.')) return;
    setOutput(null);
    if (pkg) setUpdatingPkg(pkg); else setUpdatingAll(true);
    try {
      const { data } = await api.post('/admin/site-tools/composer/update', pkg ? { package: pkg } : {});
      setOutput(data.output);
      toast.success(data.message);
      check();
    } catch { toast.error('Update failed'); }
    finally { setUpdatingPkg(null); setUpdatingAll(false); }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Dependency Updates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Check and update Composer (PHP) packages</p>
        </div>
        <div className="flex gap-2">
          <button onClick={check} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Check for Updates
          </button>
          {pkgs && pkgs.length > 0 && (
            <button onClick={() => update()} disabled={updatingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
              {updatingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />} Update All
            </button>
          )}
        </div>
      </div>

      {pkgs === null && !loading && (
        <div className="bg-white border border-[#cccacc] p-16 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Click <strong>Check for Updates</strong> to see which packages are outdated.</p>
        </div>
      )}

      {pkgs !== null && (
        pkgs.length === 0 ? (
          <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 px-4 py-3">
            <CheckCircle className="w-5 h-5" /> All packages are up to date.
          </div>
        ) : (
          <div className="bg-white border border-[#cccacc] divide-y divide-gray-100">
            {pkgs.map(p => (
              <div key={p.name} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
                </div>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <span className="text-red-500 font-mono">{p.version}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600 font-mono">{p.latest}</span>
                </div>
                <button onClick={() => update(p.name)} disabled={updatingPkg === p.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 transition-colors shrink-0">
                  {updatingPkg === p.name ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Update
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {output && (
        <pre className="mt-4 bg-gray-900 text-green-300 text-[11px] leading-relaxed p-4 overflow-auto max-h-60 font-mono whitespace-pre-wrap rounded-sm">
          {output}
        </pre>
      )}
      <p className="text-xs text-gray-400 mt-4">Always review changes carefully — updates may introduce breaking changes.</p>
    </div>
  );
}
