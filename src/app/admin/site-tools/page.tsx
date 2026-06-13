'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Trash2, Shield,
  Database, FileText, Package, Zap, ChevronDown, ChevronUp, Loader2,
  HardDrive, Download, Archive, Clock, ArrowRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type HealthStatus = 'ok' | 'warn' | 'error';
interface HealthCheck { status: HealthStatus; label: string; detail?: string }
interface DbStats     { expired_tokens: number; failed_jobs: number }
interface SuspiciousFile { path: string; ext: string; size_kb: number; modified: string }
interface ComposerPkg { name: string; version: string; latest: string; description?: string }
interface DiskInfo    { total_gb: number; used_gb: number; free_gb: number; used_pct: number; backup_size_mb: number }
interface BackupFile  { filename: string; size_mb: number; created_at: string; type: 'database' | 'media' | 'code' | 'other' }

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

  // Backup
  const [diskInfo,        setDiskInfo]        = useState<DiskInfo | null>(null);
  const [backups,         setBackups]         = useState<BackupFile[] | null>(null);
  const [creatingBackup,  setCreatingBackup]  = useState<'database' | 'media' | 'code' | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [deletingBackup,  setDeletingBackup]  = useState<string | null>(null);
  const [cleanupDays,     setCleanupDays]     = useState(7);
  const [cleaningUp,      setCleaningUp]      = useState(false);

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
    loadDisk();
    loadBackups();
  }

  async function loadDisk() {
    try { const { data } = await api.get('/admin/backup/disk'); setDiskInfo(data); } catch {}
  }

  async function loadBackups() {
    try { const { data } = await api.get('/admin/backup/list'); setBackups(data.backups); } catch {}
  }

  async function createBackup(type: 'database' | 'media' | 'code') {
    setCreatingBackup(type);
    try {
      const { data } = await api.post(`/admin/backup/${type}`);
      toast.success(data.message + ` (${data.size_mb} MB)`);
      loadBackups();
      loadDisk();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? `${type} backup failed`);
    } finally { setCreatingBackup(null); }
  }

  async function downloadBackup(filename: string) {
    setDownloadingFile(filename);
    try {
      const response = await api.get(`/admin/backup/download/${encodeURIComponent(filename)}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a   = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
    finally { setDownloadingFile(null); }
  }

  async function deleteBackup(filename: string) {
    if (!window.confirm(`Delete ${filename}?`)) return;
    setDeletingBackup(filename);
    try {
      await api.delete(`/admin/backup/${encodeURIComponent(filename)}`);
      setBackups(bs => bs ? bs.filter(b => b.filename !== filename) : bs);
      toast.success('Backup deleted');
      loadDisk();
    } catch { toast.error('Delete failed'); }
    finally { setDeletingBackup(null); }
  }

  async function runCleanup() {
    if (!window.confirm(`Delete all backups older than ${cleanupDays} day(s)?`)) return;
    setCleaningUp(true);
    try {
      const { data } = await api.post('/admin/backup/cleanup', { days: cleanupDays });
      toast.success(data.message);
      loadBackups();
      loadDisk();
    } catch { toast.error('Cleanup failed'); }
    finally { setCleaningUp(false); }
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

      {/* ── Storage Cleanup ───────────────────────────────────────────────── */}
      <SectionCard icon={HardDrive} title="Storage Cleanup">
        <p className="text-sm text-gray-600 mb-4">
          Scan for image files on disk that are no longer linked to any product — then selectively delete them to reclaim space.
        </p>
        <Link href="/admin/storage"
          className="inline-flex items-center gap-2 bg-[#213885] hover:bg-[#1a2d6b] text-white text-xs font-semibold px-4 py-2 transition-colors">
          <HardDrive className="w-3.5 h-3.5" /> Open Storage Cleanup <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </SectionCard>

      {/* ── Backup & Restore ───────────────────────────────────────────────── */}
      <SectionCard icon={Archive} title="Backup & Download">

        {/* Disk usage bar */}
        {diskInfo && (
          <div className="mb-5 p-3 border border-[#cccacc] bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
              <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Disk Usage</span>
              <span>{diskInfo.used_gb} GB / {diskInfo.total_gb} GB used · <span className="text-amber-600">{diskInfo.backup_size_mb} MB in backups</span></span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${diskInfo.used_pct > 85 ? 'bg-red-500' : diskInfo.used_pct > 65 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(diskInfo.used_pct, 100)}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{diskInfo.free_gb} GB free ({100 - diskInfo.used_pct}%)</p>
          </div>
        )}

        {/* Create backup buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {([
            { type: 'database', label: 'Database',    icon: Database,  desc: 'SQL dump (.sql.gz)' },
            { type: 'media',    label: 'Media Files', icon: Archive,   desc: 'Uploaded images (.zip)' },
            { type: 'code',     label: 'App Code',    icon: FileText,  desc: 'Backend source (.zip)' },
          ] as const).map(({ type, label, icon: Icon, desc }) => (
            <button key={type} onClick={() => createBackup(type)}
              disabled={creatingBackup !== null}
              className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-[#cccacc] hover:border-[#213885] hover:bg-blue-50 transition-colors disabled:opacity-50 text-center">
              {creatingBackup === type
                ? <Loader2 className="w-6 h-6 text-[#213885] animate-spin" />
                : <Icon className="w-6 h-6 text-[#213885]" />}
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-[10px] text-gray-400">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Auto-cleanup */}
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-amber-50 border border-amber-200">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-800 font-medium">Auto-cleanup:</span>
          <span className="text-xs text-amber-700">Delete backups older than</span>
          <select value={cleanupDays} onChange={e => setCleanupDays(Number(e.target.value))}
            className="border border-amber-300 bg-white text-xs px-2 py-1 rounded focus:outline-none">
            {[1,3,7,14,30,60,90].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
          </select>
          <Btn onClick={runCleanup} loading={cleaningUp} variant="danger">
            <Trash2 className="w-3.5 h-3.5" /> Clean Up
          </Btn>
        </div>

        {/* Backup history */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Backup History</p>
            <Btn onClick={loadBackups} variant="ghost">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Btn>
          </div>
          {backups === null ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : backups.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No backups yet. Create one above.</p>
          ) : (
            <div className="border border-[#cccacc] divide-y divide-gray-100">
              {backups.map(b => {
                const typeColor = b.type === 'database' ? 'bg-blue-100 text-blue-700'
                                : b.type === 'media'    ? 'bg-purple-100 text-purple-700'
                                :                         'bg-gray-100 text-gray-600';
                return (
                  <div key={b.filename} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${typeColor}`}>{b.type}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono text-gray-800 truncate">{b.filename}</p>
                      <p className="text-[10px] text-gray-400">{b.size_mb} MB · {new Date(b.created_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Btn onClick={() => downloadBackup(b.filename)} loading={downloadingFile === b.filename} variant="ghost">
                        <Download className="w-3.5 h-3.5" /> Download
                      </Btn>
                      <Btn onClick={() => deleteBackup(b.filename)} loading={deletingBackup === b.filename} variant="danger">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>

    </div>
  );
}
