'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, BookOpen, Search, Eye, EyeOff, Upload, Link as LinkIcon, X } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import TagInput from '@/components/TagInput';
import RichEditor from '@/components/RichEditor';

type Tag = { id: number; name: string; slug: string };
type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_image: string | null;
  cover_image_url: string | null;
  author_name: string;
  status: 'draft' | 'published';
  published_at: string | null;
  tags?: Tag[];
};

const EMPTY: Partial<Post> = {
  title: '', excerpt: '', body: '', cover_image: '',
  author_name: 'ATN Mega Store', status: 'draft',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminBlogPage() {
  const [posts, setPosts]             = useState<Post[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing]         = useState<Partial<Post>>(EMPTY);
  const [saving, setSaving]           = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Cover image upload state
  const [imageMode, setImageMode]       = useState<'upload' | 'url'>('upload');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/posts', { params });
      setPosts(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load articles'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing({ ...EMPTY });
    setSelectedTags([]);
    setImageMode('upload');
    setModal('create');
  };
  const openEdit = (p: Post) => {
    setEditing({ ...p });
    setSelectedTags((p.tags ?? []).map(t => t.slug));
    setImageMode('upload');
    setModal('edit');
  };

  const save = async () => {
    if (!editing.title || !editing.body) { toast.error('Title and body are required'); return; }
    setSaving(true);
    try {
      const payload = { ...editing, tags: selectedTags };
      if (modal === 'create') {
        await api.post('/admin/posts', payload);
        toast.success('Article created');
      } else {
        await api.put(`/admin/posts/${editing.id}`, payload);
        toast.success('Article updated');
      }
      setModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this article?')) return;
    try { await api.delete(`/admin/posts/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const toggleStatus = async (post: Post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try { await api.put(`/admin/posts/${post.id}`, { status: newStatus }); load(); }
    catch { toast.error('Update failed'); }
  };

  const field = (key: keyof Post, value: any) => setEditing(p => ({ ...p, [key]: value }));

  // ── Image upload helpers ──────────────────────────────────────────────────
  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await api.post('/admin/upload/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      field('cover_image', res.data.url);
      field('cover_image_url', res.data.url);
    } catch { toast.error('Image upload failed'); }
    finally { setUploadingImage(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    field('cover_image', '');
    field('cover_image_url', null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  // Resolved preview URL (works for both uploaded paths and external URLs)
  const previewUrl = editing.cover_image_url ?? editing.cover_image ?? null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Articles</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total article{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#213885] text-white px-4 py-2 rounded text-sm font-semibold hover:bg-[#5f3475]">
          <Plus size={16} /> New Article
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search articles…" className="w-full pl-9 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm focus:outline-none">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Article</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Published</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Author</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12"><Spinner className="mx-auto" label="Loading posts…" /></td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">No articles found.</td></tr>
            ) : posts.map(post => (
              <tr key={post.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {post.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.cover_image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-[#ede8f8] flex items-center justify-center flex-shrink-0">
                        <BookOpen size={16} className="text-[#213885]" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 line-clamp-1">{post.title}</p>
                      {post.excerpt && <p className="text-xs text-gray-400 truncate max-w-[260px]">{post.excerpt}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                  {post.published_at ? fmtDate(post.published_at) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{post.author_name}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(post)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {post.status === 'published' ? <><Eye size={11} /> Published</> : <><EyeOff size={11} /> Draft</>}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-500 text-xs">View</a>
                    <button onClick={() => openEdit(post)} className="text-gray-400 hover:text-[#213885]"><Pencil size={15} /></button>
                    <button onClick={() => remove(post.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-600">Page {page}</span>
          <button disabled={posts.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">{modal === 'create' ? 'New Article' : 'Edit Article'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={editing.title ?? ''} onChange={e => field('title', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                <input value={editing.author_name ?? ''} onChange={e => field('author_name', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
              </div>

              {/* ── Cover Image ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Cover Image</label>
                  <button
                    type="button"
                    onClick={() => setImageMode(m => m === 'upload' ? 'url' : 'upload')}
                    className="flex items-center gap-1 text-xs text-[#213885] font-medium hover:underline"
                  >
                    {imageMode === 'upload'
                      ? <><LinkIcon size={11} /> Use URL instead</>
                      : <><Upload size={11} /> Upload file</>}
                  </button>
                </div>

                {imageMode === 'url' ? (
                  /* URL input */
                  <input
                    value={editing.cover_image ?? ''}
                    onChange={e => { field('cover_image', e.target.value); field('cover_image_url', e.target.value || null); }}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30"
                  />
                ) : (
                  /* Drag-and-drop zone */
                  <>
                    <div
                      className={`relative border-2 border-dashed rounded-lg transition-colors cursor-pointer
                        ${dragOver ? 'border-[#213885] bg-[#f2eef8]' : 'border-gray-200 hover:border-[#213885]/50 bg-gray-50'}`}
                      onClick={() => !previewUrl && coverInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      {previewUrl ? (
                        /* Preview */
                        <div className="relative p-2 flex items-center gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt="Cover preview"
                            className="h-28 w-44 object-cover rounded border border-gray-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-green-600 font-semibold mb-1">✓ Image selected</p>
                            <p className="text-xs text-gray-400 break-all line-clamp-2">{editing.cover_image}</p>
                            <div className="flex gap-2 mt-3">
                              <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={clearImage}
                                className="text-xs px-3 py-1.5 border border-red-200 rounded hover:bg-red-50 text-red-500 flex items-center gap-1"
                              >
                                <X size={11} /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : uploadingImage ? (
                        <div className="py-10 text-center text-sm text-gray-400">
                          <div className="w-6 h-6 border-2 border-[#213885] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          Uploading…
                        </div>
                      ) : (
                        <div
                          className="py-10 text-center select-none"
                          onClick={() => coverInputRef.current?.click()}
                        >
                          <Upload size={28} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-sm font-medium text-gray-500">
                            Drag & drop an image here
                          </p>
                          <p className="text-xs text-gray-400 mt-1">or click to browse — JPG, PNG, WebP</p>
                        </div>
                      )}
                    </div>

                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                    />
                  </>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt <span className="text-gray-400 font-normal">(shown in listing)</span>
                </label>
                <textarea value={editing.excerpt ?? ''} onChange={e => field('excerpt', e.target.value)}
                  rows={2} maxLength={500}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30 resize-none" />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
                <RichEditor
                  value={editing.body ?? ''}
                  onChange={html => field('body', html)}
                  placeholder="Write your article here…"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <TagInput selected={selectedTags} onChange={setSelectedTags} />
              </div>

              {/* Publish toggle */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pub" checked={editing.status === 'published'}
                  onChange={e => field('status', e.target.checked ? 'published' : 'draft')} />
                <label htmlFor="pub" className="text-sm cursor-pointer">Published (visible on site)</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t sticky bottom-0 bg-white">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-5 py-2 bg-[#213885] text-white rounded text-sm font-semibold hover:bg-[#5f3475] disabled:opacity-50">
                {saving ? 'Saving…' : modal === 'create' ? 'Publish Article' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
