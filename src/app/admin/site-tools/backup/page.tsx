'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Archive, Database, FileText, HardDrive, Download,
  Trash2, RefreshCw, Clock, Loader2,
} from 'lucide-react';

interface DiskInfo   { total_gb: number; used_gb: number; free_gb: number; used_pct: number; backup_size_mb: number }
interface BackupFile { filename: string; size_mb: number; created_at: string; type: 'database' | 'media' | 'code' | 'other' }

export default function BackupPage() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [diskInfo,        setDiskInfo]        = useState<DiskInfo | null>(null);
  const [backups,         setBackups]         = useState<BackupFile[] | null>(null);
  const [creatingBackup,  setCreatingBackup]  = useState<'database' | 'media' | 'code' | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [deletingBackup,  setDeletingBackup]  = useState<string | null>(null);
  const [cleanupDays,     setCleanupDays]     = useState(7);
  const [cleaningUp,      setCleaningUp]      = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
    loadDisk();
    loadBackups();
  }, [user]);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Backup & Download</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create and download backups of your database, media, and code</p>
      </div>

      {/* Disk usage */}
      {diskInfo && (
        <div className="bg-white border border-[#cccacc] p-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span className="flex items-center gap-1.5 font-semibold"><HardDrive className="w-3.5 h-3.5" /> Disk Usage</span>
            <span>{diskInfo.used_gb} GB / {diskInfo.total_gb} GB · <span className="text-amber-600">{diskInfo.backup_size_mb} MB in backups</span></span>
          </div>
          <div className="w-full bg-gray-200 h-2">
            <div className={`h-2 transition-all ${diskInfo.used_pct > 85 ? 'bg-red-500' : diskInfo.used_pct > 65 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(diskInfo.used_pct, 100)}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{diskInfo.free_gb} GB free ({100 - diskInfo.used_pct}% remaining)</p>
        </div>
      )}

      {/* Create backup */}
      <div className="bg-white border border-[#cccacc]">
        <div className="px-5 py-3 border-b border-[#cccacc] bg-gray-50">
          <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">Create Backup</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      </div>

      {/* Auto-cleanup */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-50 border border-amber-200">
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-xs text-amber-800 font-medium">Auto-cleanup:</span>
        <span className="text-xs text-amber-700">Delete backups older than</span>
        <select value={cleanupDays} onChange={e => setCleanupDays(Number(e.target.value))}
          className="border border-amber-300 bg-white text-xs px-2 py-1 focus:outline-none">
          {[1,3,7,14,30,60,90].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
        </select>
        <button onClick={runCleanup} disabled={cleaningUp}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
          {cleaningUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Clean Up
        </button>
      </div>

      {/* Backup history */}
      <div className="bg-white border border-[#cccacc]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#cccacc] bg-gray-50">
          <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">Backup History</h2>
          <button onClick={loadBackups} className="text-gray-400 hover:text-gray-700"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div>
          {backups === null ? (
            <p className="text-xs text-gray-400 p-5">Loading…</p>
          ) : backups.length === 0 ? (
            <div className="p-12 text-center">
              <Archive className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No backups yet. Create one above.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {backups.map(b => {
                const typeColor = b.type === 'database' ? 'bg-blue-100 text-blue-700'
                                : b.type === 'media'    ? 'bg-purple-100 text-purple-700'
                                :                         'bg-gray-100 text-gray-600';
                return (
                  <div key={b.filename} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <span className={`text-[10px] font-bold px-2 py-0.5 uppercase shrink-0 ${typeColor}`}>{b.type}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono text-gray-800 truncate">{b.filename}</p>
                      <p className="text-[10px] text-gray-400">
                        {b.size_mb} MB · {new Date(b.created_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => downloadBackup(b.filename)} disabled={downloadingFile === b.filename}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 transition-colors">
                        {downloadingFile === b.filename ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download
                      </button>
                      <button onClick={() => deleteBackup(b.filename)} disabled={deletingBackup === b.filename}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
                        {deletingBackup === b.filename ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
