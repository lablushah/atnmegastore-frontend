'use client';

import { useEffect, useState } from 'react';
import {
  HardDrive, Trash2, RefreshCw, CheckSquare, Square, AlertTriangle, ImageIcon, Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface OrphanedFile {
  path: string;
  size: number;
  url:  string;
}

interface ScanResult {
  orphaned_count: number;
  orphaned_size:  number;
  total_used:     number;
  files:          OrphanedFile[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function StorageCleanupPage() {
  const [result,    setResult]    = useState<ScanResult | null>(null);
  const [scanning,  setScanning]  = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  async function scan() {
    setScanning(true);
    setSelected(new Set());
    try {
      const res = await api.get('/admin/storage/scan');
      setResult(res.data);
    } catch {
      toast.error('Failed to scan storage.');
    } finally {
      setScanning(false);
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      const res = await api.delete('/admin/storage/cleanup', {
        data: { paths: Array.from(selected) },
      });
      toast.success(res.data.message);
      // Remove deleted files from the result
      setResult(prev => prev ? {
        ...prev,
        files:          prev.files.filter(f => !selected.has(f.path)),
        orphaned_count: prev.orphaned_count - selected.size,
        orphaned_size:  prev.orphaned_size  - Array.from(selected).reduce((sum, p) => {
          const f = prev.files.find(f => f.path === p);
          return sum + (f?.size ?? 0);
        }, 0),
        total_used: prev.total_used - Array.from(selected).reduce((sum, p) => {
          const f = prev.files.find(f => f.path === p);
          return sum + (f?.size ?? 0);
        }, 0),
      } : prev);
      setSelected(new Set());
    } catch {
      toast.error('Failed to delete files.');
    } finally {
      setDeleting(false);
    }
  }

  function toggleFile(path: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  function toggleAll() {
    if (!result) return;
    if (selected.size === result.files.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(result.files.map(f => f.path)));
    }
  }

  const allSelected = result ? result.files.length > 0 && selected.size === result.files.length : false;

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HardDrive className="w-6 h-6 text-[#213885]" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Storage Cleanup</h1>
            <p className="text-sm text-gray-500">Find and delete image files no longer linked to any product</p>
          </div>
        </div>
        <button
          onClick={scan}
          disabled={scanning}
          className="flex items-center gap-2 bg-[#213885] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a2d6b] disabled:opacity-60 transition-colors"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {scanning ? 'Scanning…' : 'Scan Storage'}
        </button>
      </div>

      {/* Stats */}
      {result && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Used</p>
            <p className="text-2xl font-bold text-gray-900">{formatBytes(result.total_used)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Orphaned Files</p>
            <p className="text-2xl font-bold text-orange-500">{result.orphaned_count}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Reclaimable</p>
            <p className="text-2xl font-bold text-green-600">{formatBytes(result.orphaned_size)}</p>
          </div>
        </div>
      )}

      {/* Empty state before scan */}
      {!result && !scanning && (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <HardDrive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Click <strong>Scan Storage</strong> to check for orphaned image files.</p>
          <p className="text-xs text-gray-400">This will compare files on disk against all products in the database.</p>
        </div>
      )}

      {/* No orphans found */}
      {result && result.files.length === 0 && (
        <div className="bg-white border border-green-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <HardDrive className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-green-700 font-semibold mb-1">Storage is clean!</p>
          <p className="text-sm text-gray-400">No orphaned image files found.</p>
        </div>
      )}

      {/* File list */}
      {result && result.files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <button onClick={toggleAll} className="text-gray-500 hover:text-gray-700">
                {allSelected
                  ? <CheckSquare className="w-5 h-5 text-[#213885]" />
                  : <Square className="w-5 h-5" />}
              </button>
              <span className="text-sm text-gray-600">
                {selected.size > 0 ? `${selected.size} of ${result.files.length} selected` : `${result.files.length} orphaned file${result.files.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            {selected.size > 0 && (
              <button
                onClick={deleteSelected}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete {selected.size} file{selected.size !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100 text-amber-700 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Deletion is permanent. Verify each image below before deleting.
          </div>

          {/* Files */}
          <ul className="divide-y divide-gray-100">
            {result.files.map(file => (
              <li key={file.path}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors ${selected.has(file.path) ? 'bg-blue-50' : ''}`}
              >
                <button onClick={() => toggleFile(file.path)} className="shrink-0 text-gray-400 hover:text-[#213885]">
                  {selected.has(file.path)
                    ? <CheckSquare className="w-5 h-5 text-[#213885]" />
                    : <Square className="w-5 h-5" />}
                </button>

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center border border-gray-200">
                  {imgErrors.has(file.path) ? (
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setImgErrors(p => new Set(p).add(file.path))}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-gray-700 truncate">{file.path}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
                </div>

                <button
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await api.delete('/admin/storage/cleanup', { data: { paths: [file.path] } });
                      toast.success('File deleted.');
                      setResult(prev => prev ? {
                        ...prev,
                        files:          prev.files.filter(f => f.path !== file.path),
                        orphaned_count: prev.orphaned_count - 1,
                        orphaned_size:  prev.orphaned_size  - file.size,
                        total_used:     prev.total_used     - file.size,
                      } : prev);
                      setSelected(prev => { const n = new Set(prev); n.delete(file.path); return n; });
                    } catch {
                      toast.error('Failed to delete file.');
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  className="shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                  title="Delete this file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
