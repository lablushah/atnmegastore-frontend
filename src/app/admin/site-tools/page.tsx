'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Trash2, Shield,
  Database, FileText, Package, Zap, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type HealthStatus = 'ok' | 'warn' | 'error';
interface HealthCheck { status: HealthStatus; label: string; detail?: string }
interface DbStats     { expired_tokens: number; failed_jobs: number }
interface SuspiciousFile { path: string; ext: string; size_kb: number; modified: string }
interface ComposerPkg { name: string; version: string; latest: string; description?: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusIcon({ s }: { s: HealthStatus }) {
  if (s === 'ok')    return <CheckCircle   className="w-4 h-4 text-green-500 shrink-0" />;
  if (s === 'warn')  return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
  return                    <XCircle       className="w-4 h-4 text-red-500   shrink-0" />;
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#cccacc]">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[#cccacc] bg-gray-50">
        <Icon className="w-4 h-4 text-[#213885]" />
        <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Btn({ onClick, loading, variant = 'primary', children, disabled }: {
  onClick: () => void; loading?: boolean; variant?: 'primary' | 'danger' | 'ghost';
  children: React.ReactNode; disabled?: boolean;
}) {
  const cls = variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white'
            : variant === 'ghost'  ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            :                        'bg-[#213885] hover:bg-[#1a2d6b] text-white';
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${cls}`}>
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SiteToolsPage() {
  const { user }  = useAuthStore();
  const router    = useRouter();

  // Health
  const [health,       setHealth]       = useState<Record<string, HealthCheck> | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Cache
  const [cacheClearing,  setCacheClearing]  = useState(false);
  const [cacheRebuilding,setCacheRebuilding] = useState(false);
  const [clearedAt,      setClearedAt]      = useState<string | null>(null);

  // DB
  const [dbStats,      setDbStats]      = useState<DbStats | null>(null);
  const [dbCleaning,   setDbCleaning]   = useState(false);

  // Logs
  const [logLines,     setLogLines]     = useState<string[] | null>(null);
  const [logSizeKb,    setLogSizeKb]    = useState(0);
  const [logLoading,   setLogLoading]   = useState(false);
  const [logClearing,  setLogClearing]  = useState(false);
  const [logsExpanded, setLogsExpanded] = useState(false);

  // Security
  const [scanResult,   setScanResult]   = useState<{ found: SuspiciousFile[]; scanned: number } | null>(null);
  const [scanning,     setScanning]     = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // Composer
  const [composerPkgs,    setComposerPkgs]    = useState<ComposerPkg[] | null>(null);
  const [composerLoading, setComposerLoading] = useState(false);
  const [updatingPkg,     setUpdatingPkg]     = useState<string | null>(null);
  const [updatingAll,     setUpdatingAll]     = useState(false);
  const [updateOutput,    setUpdateOutput]    = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
    loadAll();
  }, [user]);

  function loadAll() {
    loadHealth();
    loadCacheStatus();
    loadDbStats();
  }

  async function loadHealth() {
    setHealthLoading(true);
    try { const { data } = await api.get('/admin/site-tools/health'); setHealth(data); }
    catch { toast.error('Health check failed'); }
    finally { setHealthLoading(false); }
  }

  async function loadCacheStatus() {
    try { const { data } = await api.get('/admin/site-tools/cache/status'); setClearedAt(data.cleared_at); }
    catch {}
  }

  async function loadDbStats() {
    try { const { data } = await api.get('/admin/site-tools/db/stats'); setDbStats(data); }
    catch {}
  }

  async function clearCache() {
    setCacheClearing(true);
    try {
      const { data } = await api.post('/admin/site-tools/cache/clear');
      setClearedAt(data.cleared_at);
      toast.success('All caches cleared');
    } catch { toast.error('Cache clear failed'); }
    finally { setCacheClearing(false); }
  }

  async function rebuildCache() {
    setCacheRebuilding(true);
    try {
      await api.post('/admin/site-tools/cache/rebuild');
      toast.success('Cache rebuilt');
    } catch { toast.error('Cache rebuild failed'); }
    finally { setCacheRebuilding(false); }
  }

  async function cleanDb() {
    setDbCleaning(true);
    try {
      const { data } = await api.post('/admin/site-tools/db/cleanup');
      toast.success(`Cleanup done — ${data.deleted.expired_tokens} tokens, ${data.deleted.failed_jobs} failed jobs removed`);
      loadDbStats();
    } catch { toast.error('DB cleanup failed'); }
    finally { setDbCleaning(false); }
  }

  async function loadLogs() {
    setLogLoading(true);
    setLogsExpanded(true);
    try {
      const { data } = await api.get('/admin/site-tools/logs');
      setLogLines(data.lines);
      setLogSizeKb(data.size_kb);
    } catch { toast.error('Could not load logs'); }
    finally { setLogLoading(false); }
  }

  async function clearLogs() {
    setLogClearing(true);
    try {
      await api.post('/admin/site-tools/logs/clear');
      setLogLines([]);
      setLogSizeKb(0);
      toast.success('Log file cleared');
    } catch { toast.error('Could not clear logs'); }
    finally { setLogClearing(false); }
  }

  async function runScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const { data } = await api.get('/admin/site-tools/security/scan');
      setScanResult(data);
      if (data.found.length === 0) toast.success(`Scan complete — ${data.scanned} files checked, nothing suspicious`);
      else toast.error(`${data.found.length} suspicious file(s) found`);
    } catch { toast.error('Scan failed'); }
    finally { setScanning(false); }
  }

  async function deleteFile(path: string) {
    if (!window.confirm(`Delete ${path}?`)) return;
    setDeletingFile(path);
    try {
      await api.delete('/admin/site-tools/security/file', { data: { path } });
      setScanResult(r => r ? { ...r, found: r.found.filter(f => f.path !== path) } : r);
      toast.success('File deleted');
    } catch { toast.error('Delete failed'); }
    finally { setDeletingFile(null); }
  }

  async function checkComposer() {
    setComposerLoading(true);
    setComposerPkgs(null);
    setUpdateOutput(null);
    try {
      const { data } = await api.get('/admin/site-tools/composer/outdated');
      setComposerPkgs(data.packages);
      if (data.packages.length === 0) toast.success('All packages are up to date');
    } catch { toast.error('Could not check packages'); }
    finally { setComposerLoading(false); }
  }

  async function updatePackage(pkg?: string) {
    const confirm = window.confirm(
      pkg ? `Update ${pkg}? This modifies production dependencies.`
          : 'Update ALL packages? This modifies production dependencies and may cause breaking changes.'
    );
    if (!confirm) return;

    setUpdateOutput(null);
    if (pkg) setUpdatingPkg(pkg); else setUpdatingAll(true);

    try {
      const { data } = await api.post('/admin/site-tools/composer/update', pkg ? { package: pkg } : {});
      setUpdateOutput(data.output);
      toast.success(data.message);
      checkComposer();
    } catch { toast.error('Update failed'); }
    finally { setUpdatingPkg(null); setUpdatingAll(false); }
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Site Tools
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Cache, security, logs, and dependency management</p>
        </div>
        <Btn onClick={loadAll} variant="ghost" loading={healthLoading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh all
        </Btn>
      </div>

      {/* ── System Health ──────────────────────────────────────────────────── */}
      <SectionCard icon={Zap} title="System Health">
        {!health ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.values(health).map((c, i) => (
              <div key={i} className={`flex items-center gap-2 p-3 border rounded-sm text-sm ${
                c.status === 'ok' ? 'border-green-200 bg-green-50' :
                c.status === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
              }`}>
                <StatusIcon s={c.status} />
                <div className="min-w-0">
                  <p className="font-medium text-xs text-gray-800 truncate">{c.label}</p>
                  {c.detail && <p className="text-[10px] text-gray-500 truncate">{c.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Cache Management ───────────────────────────────────────────────── */}
      <SectionCard icon={RefreshCw} title="Cache Management">
        <div className="flex flex-wrap items-center gap-3">
          <Btn onClick={clearCache} loading={cacheClearing} variant="danger">
            <Trash2 className="w-3.5 h-3.5" /> Clear All Cache
          </Btn>
          <Btn onClick={rebuildCache} loading={cacheRebuilding}>
            <RefreshCw className="w-3.5 h-3.5" /> Rebuild Cache
          </Btn>
          {clearedAt && (
            <p className="text-xs text-gray-400 ml-2">
              Last cleared: {new Date(clearedAt).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          <strong>Clear</strong> removes app, config, route, and view caches.
          <strong className="ml-1">Rebuild</strong> re-generates config and route caches for production performance.
        </p>
      </SectionCard>

      {/* ── Database Cleanup ───────────────────────────────────────────────── */}
      <SectionCard icon={Database} title="Database Cleanup">
        {dbStats ? (
          <div className="flex flex-wrap items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#213885]">{dbStats.expired_tokens}</p>
              <p className="text-xs text-gray-500">Expired reset tokens</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{dbStats.failed_jobs}</p>
              <p className="text-xs text-gray-500">Failed jobs</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-4">Loading stats…</p>
        )}
        <Btn onClick={cleanDb} loading={dbCleaning} variant="danger"
          disabled={dbStats ? (dbStats.expired_tokens === 0 && dbStats.failed_jobs === 0) : false}>
          <Trash2 className="w-3.5 h-3.5" /> Run Cleanup
        </Btn>
      </SectionCard>

      {/* ── Log Viewer ─────────────────────────────────────────────────────── */}
      <SectionCard icon={FileText} title="Log Viewer">
        <div className="flex flex-wrap gap-2 mb-3">
          <Btn onClick={loadLogs} loading={logLoading} variant="ghost">
            <FileText className="w-3.5 h-3.5" /> {logLines === null ? 'Load Logs' : 'Refresh'}
            {logSizeKb > 0 && <span className="ml-1 text-gray-400">({logSizeKb} KB)</span>}
          </Btn>
          {logLines !== null && logLines.length > 0 && (
            <Btn onClick={clearLogs} loading={logClearing} variant="danger">
              <Trash2 className="w-3.5 h-3.5" /> Clear Log File
            </Btn>
          )}
          {logLines !== null && (
            <Btn onClick={() => setLogsExpanded(e => !e)} variant="ghost">
              {logsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {logsExpanded ? 'Collapse' : 'Expand'}
            </Btn>
          )}
        </div>
        {logsExpanded && logLines !== null && (
          logLines.length === 0
            ? <p className="text-xs text-gray-400 italic">Log file is empty.</p>
            : <pre className="bg-gray-900 text-green-300 text-[11px] leading-relaxed p-4 overflow-auto max-h-80 rounded-sm font-mono whitespace-pre-wrap">
                {logLines.join('\n')}
              </pre>
        )}
      </SectionCard>

      {/* ── Security Scan ──────────────────────────────────────────────────── */}
      <SectionCard icon={Shield} title="Security Scan">
        <div className="flex flex-wrap gap-2 mb-3">
          <Btn onClick={runScan} loading={scanning}>
            <Shield className="w-3.5 h-3.5" /> Scan Uploaded Files
          </Btn>
        </div>
        {scanResult && (
          <>
            <p className="text-xs text-gray-500 mb-2">
              Scanned {scanResult.scanned} files in storage/app/public
            </p>
            {scanResult.found.length === 0 ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-3 py-2 text-sm">
                <CheckCircle className="w-4 h-4" /> No suspicious files found.
              </div>
            ) : (
              <div className="border border-red-200 divide-y divide-red-100">
                {scanResult.found.map(f => (
                  <div key={f.path} className="flex items-center justify-between gap-3 px-3 py-2 bg-red-50">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-red-800 truncate">{f.path}</p>
                      <p className="text-[10px] text-red-500">.{f.ext} · {f.size_kb} KB · {f.modified}</p>
                    </div>
                    <Btn onClick={() => deleteFile(f.path)} variant="danger"
                      loading={deletingFile === f.path}>
                      <Trash2 className="w-3 h-3" /> Delete
                    </Btn>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Flags .php, .exe, .sh, .phar and similar files found in the public uploads directory.
        </p>
      </SectionCard>

      {/* ── Composer / Dependency Updates ──────────────────────────────────── */}
      <SectionCard icon={Package} title="Dependency Updates (Composer)">
        <div className="flex flex-wrap gap-2 mb-3">
          <Btn onClick={checkComposer} loading={composerLoading} variant="ghost">
            <RefreshCw className="w-3.5 h-3.5" /> Check for Updates
          </Btn>
          {composerPkgs !== null && composerPkgs.length > 0 && (
            <Btn onClick={() => updatePackage()} loading={updatingAll} variant="danger">
              <Package className="w-3.5 h-3.5" /> Update All
            </Btn>
          )}
        </div>

        {composerPkgs !== null && (
          composerPkgs.length === 0
            ? <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-3 py-2 text-sm">
                <CheckCircle className="w-4 h-4" /> All packages are up to date.
              </div>
            : <div className="border border-[#cccacc] divide-y divide-gray-100">
                {composerPkgs.map(p => (
                  <div key={p.name} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800">{p.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="text-red-500 font-mono">{p.version}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600 font-mono">{p.latest}</span>
                    </div>
                    <Btn onClick={() => updatePackage(p.name)} loading={updatingPkg === p.name} variant="ghost">
                      Update
                    </Btn>
                  </div>
                ))}
              </div>
        )}

        {updateOutput && (
          <pre className="mt-3 bg-gray-900 text-green-300 text-[11px] leading-relaxed p-4 overflow-auto max-h-60 rounded-sm font-mono whitespace-pre-wrap">
            {updateOutput}
          </pre>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Runs <code className="bg-gray-100 px-1">composer update</code> on the server.
          Always review changes carefully — updating may introduce breaking changes.
        </p>
      </SectionCard>

    </div>
  );
}
