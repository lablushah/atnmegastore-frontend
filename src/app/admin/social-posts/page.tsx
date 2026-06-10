'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageSocialPosts } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Send, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

interface SocialPost {
  id: number;
  title: string | null;
  content: string;
  image_url: string | null;
  platforms: string[];
  status: 'draft' | 'published' | 'failed' | 'partial';
  platform_results: Record<string, { status: string; message?: string }> | null;
  published_at: string | null;
  created_at: string;
  employee?: { name: string };
}

interface Paginated { data: SocialPost[]; current_page: number; last_page: number; total: number; }

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; letter: string }> = {
  facebook:  { label: 'Facebook',  color: 'text-blue-700',  bg: 'bg-blue-100',  letter: 'f' },
  instagram: { label: 'Instagram', color: 'text-pink-700',  bg: 'bg-pink-100',  letter: 'IG' },
  twitter:   { label: 'X / Twitter', color: 'text-gray-800', bg: 'bg-gray-100', letter: 'X' },
};

const STATUS_META: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-600',   Icon: Clock },
  published: { label: 'Published', cls: 'bg-green-100 text-green-700', Icon: CheckCircle },
  failed:    { label: 'Failed',    cls: 'bg-red-100 text-red-700',     Icon: XCircle },
  partial:   { label: 'Partial',   cls: 'bg-yellow-100 text-yellow-700', Icon: AlertCircle },
};

function PlatformBadge({ platform }: { platform: string }) {
  const m = PLATFORM_META[platform];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded ${m.bg} ${m.color}`}>
      {m.letter}
    </span>
  );
}

export default function SocialPostsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [posts, setPosts]     = useState<SocialPost[]>([]);
  const [page, setPage]       = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageSocialPosts(user)) { router.push('/admin'); return; }
    load(1);
  }, [user]);

  async function load(p: number) {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/social-posts', { params: { page: p } });
      const d: Paginated = data;
      setPosts(d.data); setPage(d.current_page); setLastPage(d.last_page); setTotal(d.total);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }

  async function handlePublish(post: SocialPost) {
    if (!window.confirm(`Publish "${post.title || 'this post'}" to ${post.platforms.join(', ')}?`)) return;
    setPublishing(post.id);
    try {
      const { data } = await api.post(`/admin/social-posts/${post.id}/publish`);
      const results: Record<string, { status: string; message?: string }> = data.results;
      const successes = Object.entries(results).filter(([, r]) => r.status === 'success').map(([p]) => p);
      const failures  = Object.entries(results).filter(([, r]) => r.status === 'failed').map(([p, r]) => `${p}: ${r.message}`);
      const skipped   = Object.entries(results).filter(([, r]) => r.status === 'skipped').map(([p]) => p);
      if (successes.length) toast.success(`Posted to: ${successes.join(', ')}`);
      if (failures.length)  toast.error(`Failed: ${failures.join(' | ')}`);
      if (skipped.length)   toast(`Skipped (not configured): ${skipped.join(', ')}`, { icon: '⚠️' });
      load(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Publish failed');
    } finally { setPublishing(null); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this post?')) return;
    try { await api.delete(`/admin/social-posts/${id}`); toast.success('Deleted'); load(page); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Delete failed'); }
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Social Posts</h1>
          <p className="text-[#6b6b6b] mt-1 text-sm">{total} posts · Create and publish to Facebook, Instagram & X</p>
        </div>
        <button onClick={() => router.push('/admin/social-posts/new')}
          className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Configuration notice */}
      <div className="mb-5 p-4 bg-blue-50 border border-blue-200 text-sm text-blue-800">
        <strong>Setup required:</strong> To enable live posting, add your Facebook Page ID, Instagram Business Account ID, and Twitter/X API keys in{' '}
        <a href="/admin/settings" className="underline font-medium">Site Settings → Social Media</a>.
      </div>

      {loading ? (
        <Spinner className="py-16" label="Loading social posts…" />
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No social posts yet. Create your first one.</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-[#cccacc] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Content', 'Platforms', 'Status', 'Created by', 'Date', ''].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs uppercase tracking-wide text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map(post => {
                  const sm = STATUS_META[post.status] ?? STATUS_META.draft;
                  return (
                    <tr key={post.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                      <td className="py-3 px-4 max-w-xs">
                        {post.title && <p className="font-medium text-[#1a1a1a] truncate">{post.title}</p>}
                        <p className="text-[#6b6b6b] text-xs truncate mt-0.5">{post.content.slice(0, 80)}{post.content.length > 80 ? '…' : ''}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {post.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                        </div>
                        {post.platform_results && (
                          <div className="mt-1 space-y-0.5">
                            {Object.entries(post.platform_results).map(([p, r]) => (
                              <p key={p} className={`text-[10px] ${r.status === 'success' ? 'text-green-600' : r.status === 'failed' ? 'text-red-500' : 'text-gray-400'}`}>
                                {PLATFORM_META[p]?.label ?? p}: {r.status}{r.status === 'failed' && r.message ? ` — ${r.message.slice(0, 40)}` : ''}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sm.cls}`}>
                          <sm.Icon className="w-3 h-3" /> {sm.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6b6b6b] text-xs">{post.employee?.name ?? '—'}</td>
                      <td className="py-3 px-4 text-[#6b6b6b] text-xs">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 items-center">
                          {post.status !== 'published' && (
                            <>
                              <button onClick={() => router.push(`/admin/social-posts/${post.id}/edit`)}
                                className="text-[#213885] hover:text-[#081849]" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button disabled={publishing === post.id} onClick={() => handlePublish(post)}
                                className="flex items-center gap-1 text-xs bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-2 py-1 transition-colors">
                                <Send className="w-3 h-3" />
                                {publishing === post.id ? '…' : 'Publish'}
                              </button>
                              <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && (
            <div className="flex gap-2 mt-4 items-center text-sm">
              <button disabled={page === 1} onClick={() => load(page - 1)} className="px-3 py-1 border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <span className="text-[#6b6b6b]">Page {page} of {lastPage}</span>
              <button disabled={page === lastPage} onClick={() => load(page + 1)} className="px-3 py-1 border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
