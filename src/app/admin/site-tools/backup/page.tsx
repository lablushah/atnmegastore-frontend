'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Archive, Database, FileText, HardDrive, Download,
  Trash2, RefreshCw, Clock, Loader2, Info, AlertTriangle, CheckCircle,
} from 'lucide-react';

interface DiskInfo   { total_gb: number; used_gb: number; free_gb: number; used_pct: number; backup_size_mb: number }
interface BackupFile { filename: string; size_mb: number; created_at: string; type: 'database' | 'media' | 'code' | 'other' }

const backupTypes = [
  {
    type: 'database' as const,
    label: 'Database',
    icon: Database,
    desc: 'SQL dump (.sql.gz)',
    explain: 'All your orders, products, customers, settings, and store content. This is your most critical backup — if your store is hacked or data is accidentally deleted, this is what restores it.',
    recommended: true,
  },
  {
    type: 'media' as const,
    label: 'Media Files',
    icon: Archive,
    desc: 'Uploaded images (.zip)',
    explain: 'All photos you have uploaded — product images, banners, blog images. Without this backup, you would need to re-upload all images manually.',
    recommended: false,
  },
  {
    type: 'code' as const,
    label: 'App Code',
    icon: FileText,
    desc: 'Backend source (.zip)',
    explain: 'The PHP source code that runs your store (not including third-party libraries). Useful if a developer makes changes and something breaks — you can restore the previous working code.',
    recommended: false,
  },
];

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
      toast.success('Download started');
    } catch { toast.error('Download failed'); }
    finally { setDownloadingFile(null); }
  }

  async function deleteBackup(filename: string) {
    if (!window.confirm(`Permanently delete this backup?\n\n${filename}\n\nThis cannot be undone.`)) return;
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
    if (!window.confirm(`Delete all backups older than ${cleanupDays} day(s)?\n\nThis is permanent and cannot be undone. Make sure you have downloaded any backups you want to keep.`)) return;
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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair,Georgia,serif)' }}>Backup & Download</h1>
        <p className="text-sm text-gray-500 mt-0.5">Protect your store by saving copies of your data</p>
      </div>

      {/* Why backup */}
      <div className="flex gap-3 bg-blue-50 border border-blue-200 px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Why should I back up?</strong> Backups are your safety net. If your store is ever hacked, if a product or order is accidentally deleted, or if a software update goes wrong, a recent backup lets you restore everything to how it was.</p>
          <p>It is recommended to back up your database <strong>at least once a week</strong>, and before making any major changes like updating software or changing store settings.</p>
        </div>
      </div>

      {/* Disk usage */}
      {diskInfo && (
        <div className="bg-white border border-[#cccacc] p-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span className="flex items-center gap-1.5 font-semibold"><HardDrive className="w-3.5 h-3.5" /> Server Disk Usage</span>
            <span>{diskInfo.used_gb} GB used of {diskInfo.total_gb} GB total &nbsp;·&nbsp; <span className="text-amber-600">{diskInfo.backup_size_mb} MB used by backups</span></span>
          </div>
          <div className="w-full bg-gray-200 h-2">
            <div className={`h-2 transition-all ${diskInfo.used_pct > 85 ? 'bg-red-500' : diskInfo.used_pct > 65 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(diskInfo.used_pct, 100)}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{diskInfo.free_gb} GB free ({100 - diskInfo.used_pct}% remaining)</p>
          {diskInfo.used_pct > 85 && (
            <p className="text-xs text-red-600 mt-2 font-medium">Disk space is running low. Delete old backups below or download them to your computer and then delete them from the server.</p>
          )}
        </div>
      )}

      {/* Create backup */}
      <div className="bg-white border border-[#cccacc]">
        <div className="px-5 py-3 border-b border-[#cccacc] bg-gray-50">
          <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">Create a Backup</h2>
          <p className="text-xs text-gray-500 mt-0.5">Choose what you want to back up. Each backup is saved on the server and can be downloaded to your computer.</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {backupTypes.map(({ type, label, icon: Icon, desc, explain, recommended }) => (
            <div key={type} className={`border ${recommended ? 'border-[#213885]' : 'border-[#cccacc]'} flex flex-col`}>
              {recommended && (
                <div className="bg-[#213885] text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider">Recommended weekly</div>
              )}
              <button onClick={() => createBackup(type)} disabled={creatingBackup !== null}
                className="flex flex-col items-center gap-2 p-4 hover:bg-blue-50 transition-colors disabled:opacity-50 text-center flex-1">
                {creatingBackup === type
                  ? <Loader2 className="w-6 h-6 text-[#213885] animate-spin" />
                  : <Icon className="w-6 h-6 text-[#213885]" />}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-[10px] text-gray-400">{desc}</p>
                </div>
              </button>
              <p className="text-xs text-gray-500 px-3 pb-3 text-center">{explain}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-cleanup */}
      <div className="bg-white border border-[#cccacc]">
        <div className="px-5 py-3 border-b border-[#cccacc] bg-gray-50">
          <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">Auto-Cleanup Old Backups</h2>
          <p className="text-xs text-gray-500 mt-0.5">Backups take up server disk space. Clean up old ones you no longer need.</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-3 bg-amber-50 border border-amber-200 px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800"><strong>Download first.</strong> Once deleted, backups cannot be recovered. If you want to keep an old backup, download it to your computer before running cleanup.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-sm text-gray-700">Delete all backups older than</span>
            <select value={cleanupDays} onChange={e => setCleanupDays(Number(e.target.value))}
              className="border border-gray-300 bg-white text-sm px-2 py-1 focus:outline-none">
              {[1,3,7,14,30,60,90].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
            </select>
            <button onClick={runCleanup} disabled={cleaningUp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {cleaningUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Run Cleanup
            </button>
          </div>
        </div>
      </div>

      {/* Backup history */}
      <div className="bg-white border border-[#cccacc]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#cccacc] bg-gray-50">
          <div>
            <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">Backup History</h2>
            <p className="text-xs text-gray-500 mt-0.5">All backups saved on the server. Download to your computer for safe off-site storage.</p>
          </div>
          <button onClick={loadBackups} className="text-gray-400 hover:text-gray-700"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div>
          {backups === null ? (
            <p className="text-xs text-gray-400 p-5">Loading…</p>
          ) : backups.length === 0 ? (
            <div className="p-12 text-center">
              <Archive className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No backups yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first backup above. It is good practice to keep at least one recent database backup on hand.</p>
            </div>
          ) : (
            <>
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
                          {b.size_mb} MB &nbsp;·&nbsp; Created {new Date(b.created_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => downloadBackup(b.filename)} disabled={downloadingFile === b.filename}
                          title="Download to your computer"
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 transition-colors">
                          {downloadingFile === b.filename ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download
                        </button>
                        <button onClick={() => deleteBackup(b.filename)} disabled={deletingBackup === b.filename}
                          title="Delete from server"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
                          {deletingBackup === b.filename ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600"><strong>Tip:</strong> Keep at least one copy of each backup downloaded to your computer or cloud storage (Google Drive, Dropbox). Server-only backups are lost if the server itself has a problem.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
