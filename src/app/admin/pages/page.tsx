'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageProducts } from '@/lib/types';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface CmsPage { id: number; title: string; slug: string; meta_title: string | null; is_published: boolean; sort_order: number; }

const EMPTY = { title: '', slug: '', content: '', meta_title: '', meta_description: '', meta_keywords: '', is_published: true, sort_order: 0 };

export default function AdminPagesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageProducts(user)) { router.push('/admin'); return; }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get('/admin/cms-pages'); setPages(data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(p: any) {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, content: p.content ?? '', meta_title: p.meta_title ?? '', meta_description: p.meta_description ?? '', meta_keywords: p.meta_keywords ?? '', is_published: p.is_published, sort_order: p.sort_order });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await api.put(`/admin/cms-pages/${editing.id}`, form); toast.success('Updated'); }
      else { await api.post('/admin/cms-pages', form); toast.success('Created'); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this page?')) return;
    try { await api.delete(`/admin/cms-pages/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>CMS Pages</h1>
          <p className="text-[#6b6b6b] mt-1">{pages.length} pages</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Page
        </button>
      </div>

      {loading ? <Spinner className="py-16" label="Loading pages…" /> : (
        <div className="bg-white border border-[#cccacc]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['#', 'Title', 'Slug', 'Status', ''].map(h => (
                  <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{p.sort_order}</td>
                  <td className="py-3 px-4 border-b border-gray-50 font-medium text-[#1a1a1a]">{p.title}</td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <a href={`/pages/${p.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#213885] hover:underline text-xs font-mono">
                      /{p.slug} <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <span className={`text-xs px-2 py-0.5 ${p.is_published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.is_published ? 'Published' : 'Draft'}</span>
                  </td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-[#213885] hover:text-[#081849]"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">{editing ? 'Edit Page' : 'Add Page'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                  <input required value={form.title} onChange={e => set('title', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Slug (auto if empty)</label>
                  <input value={form.slug} onChange={e => set('slug', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Content (HTML)</label>
                <textarea rows={8} value={form.content} onChange={e => set('content', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
                  <input value={form.meta_title} onChange={e => set('meta_title', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => set('sort_order', +e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
                  <textarea rows={2} value={form.meta_description} onChange={e => set('meta_description', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Published
              </label>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Page'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
