'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Package, CheckCircle, RefreshCw, Loader2, Info, AlertTriangle, XCircle } from 'lucide-react';

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
      ? `Update ${pkg}?\n\nThis changes a component of your store's software. Only proceed if your developer has advised you to do so, or if you have a recent backup.`
      : 'Update ALL packages at once?\n\nThis is a significant change that could break parts of your store. It is strongly recommended to take a backup first and have your developer review the changes.\n\nAre you sure you want to continue?')) return;
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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Dependency Updates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Check and update the software components your store depends on</p>
        </div>
        <button onClick={check} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 transition-colors shrink-0">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Check for Updates
        </button>
      </div>

      {/* What are dependencies */}
      <div className="flex gap-3 bg-blue-50 border border-blue-200 px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>What are packages/dependencies?</strong> Your store is built using many third-party software components — for example, the code that processes payments, sends emails, or generates PDFs. These are called "packages" or "dependencies". Their developers regularly release updates to fix bugs and security vulnerabilities.</p>
          <p>This page shows you which of those components have a newer version available.</p>
        </div>
      </div>

      {/* Important warning */}
      <div className="flex gap-3 bg-red-50 border border-red-300 px-4 py-4">
        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <div className="text-sm text-red-800 space-y-1.5">
          <p><strong>Important — read before updating:</strong></p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Always take a backup first</strong> (visit Backup &amp; Download) before updating any package.</li>
            <li>Updating a package can occasionally break something on the store if the new version has changes that are not compatible. This is rare but possible.</li>
            <li>For most stores, it is safer to <strong>contact your developer</strong> and ask them to review updates before applying them.</li>
            <li><strong>Never use "Update All" without a backup.</strong> Updating individual packages one at a time and testing between each one is much safer.</li>
          </ul>
        </div>
      </div>

      {/* Check results */}
      {pkgs === null && !loading && (
        <div className="bg-white border border-[#cccacc] p-16 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">No check has been run yet</p>
          <p className="text-gray-400 text-xs mt-1">Click <strong>Check for Updates</strong> to see which packages have newer versions available.</p>
        </div>
      )}

      {pkgs !== null && (
        pkgs.length === 0 ? (
          <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 px-4 py-4">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">All packages are up to date</p>
              <p className="text-sm mt-0.5">No updates are available right now. Check again in a few weeks.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{pkgs.length} package{pkgs.length > 1 ? 's have' : ' has'} updates available</p>
              <button onClick={() => update()} disabled={updatingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
                {updatingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />} Update All (Caution)
              </button>
            </div>
            <div className="bg-white border border-[#cccacc] divide-y divide-gray-100">
              {pkgs.map(p => (
                <div key={p.name} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <span className="text-red-500 font-mono" title="Current version">{p.version}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600 font-mono" title="Latest version">{p.latest}</span>
                  </div>
                  <button onClick={() => update(p.name)} disabled={updatingPkg === p.name}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 transition-colors shrink-0">
                    {updatingPkg === p.name ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Update
                  </button>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {output && (
        <>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Update Output</p>
          <pre className="bg-gray-900 text-green-300 text-[11px] leading-relaxed p-4 overflow-auto max-h-60 font-mono whitespace-pre-wrap rounded-sm">
            {output}
          </pre>
          <p className="text-xs text-gray-500">Please test your store now — browse products, add to cart, and check checkout — to make sure everything still works correctly after the update.</p>
        </>
      )}

      {/* When to update */}
      <div className="bg-gray-50 border border-gray-200 px-4 py-4 space-y-2">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Recommended approach</p>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Create a database backup first (Backup &amp; Download)</li>
          <li>Check for updates once a month</li>
          <li>Update one package at a time</li>
          <li>Test the store after each update (browse, add to cart, checkout)</li>
          <li>If something breaks, contact your developer immediately with the update output above</li>
        </ol>
      </div>
    </div>
  );
}
