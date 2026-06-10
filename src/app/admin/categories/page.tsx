'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageProducts } from '@/lib/types';
import api from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface Category { id: number; name: string; slug: string; description: string | null; image: string | null; parent_id: number | null; products_count?: number; children?: Category[]; }

const EMPTY = { name: '', slug: '', description: '', image: '', parent_id: '' };
type EditCell = { id: number; field: string } | null;

const INPUT_CLS = 'bg-transparent border-0 border-b border-[#213885] outline-none text-sm py-0.5 w-full min-w-[4rem]';
const CELL_CLS  = 'cursor-pointer hover:border-b hover:border-dashed hover:border-gray-400 inline-block w-full';

export default function AdminCategoriesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  // Inline edit
  const [editCell, setEditCell] = useState<EditCell>(null);
  const [editValue, setEditValue] = useState('');
  const [patchingCell, setPatchingCell] = useState<EditCell>(null);
  const [savedCell, setSavedCell] = useState<EditCell>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageProducts(user)) { router.push('/admin'); return; }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get('/admin/categories'); setCategories(data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, parent_id: form.parent_id ? Number(form.parent_id) : null };
      await api.post('/admin/categories', payload);
      toast.success('Category created');
      setShowModal(false); load();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this category? Products in it will be uncategorized.')) return;
    try { await api.delete(`/admin/categories/${id}`); toast.success('Deleted'); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Delete failed'); }
  }

  // ── Inline edit ──────────────────────────────────────────────────────────────

  function startEdit(id: number, field: string, currentValue: any) {
    setEditCell({ id, field });
    setEditValue(String(currentValue ?? ''));
  }

  function cancelEdit() { setEditCell(null); setEditValue(''); }

  async function patchCategory(id: number, field: string, value: any) {
    // Optimistic update
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    setPatchingCell({ id, field });
    try {
      const payload: Record<string, any> = {};
      if (field === 'parent_id') payload.parent_id = value ? Number(value) : null;
      else payload[field] = value;
      const { data } = await api.put(`/admin/categories/${id}`, payload);
      setCategories(prev => prev.map(c => c.id === id ? { ...data, products_count: c.products_count } : c));
      setSavedCell({ id, field });
      setTimeout(() => setSavedCell(null), 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
      load(); // revert on error
    } finally {
      setPatchingCell(null);
    }
  }

  async function commitText(id: number, field: string, original: any) {
    cancelEdit();
    if (editValue === String(original ?? '')) return; // no change
    await patchCategory(id, field, editValue);
  }

  async function commitSelect(id: number, field: string, value: string) {
    cancelEdit();
    await patchCategory(id, field, value);
  }

  const isEditing  = (id: number, field: string) => editCell?.id === id && editCell?.field === field;
  const isPatching = (id: number, field: string) => patchingCell?.id === id && patchingCell?.field === field;
  const isSaved    = (id: number, field: string) => savedCell?.id === id && savedCell?.field === field;
  const topLevel   = categories.filter(c => !c.parent_id);
  const set        = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Categories</h1>
          <p className="text-[#6b6b6b] mt-1">{categories.length} categories · <span className="text-xs text-gray-400">click Name, Slug or Parent to edit inline</span></p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowModal(true); }} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? <Spinner className="py-16" label="Loading categories…" /> : (
        <div className="bg-white border border-[#cccacc]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Image', 'Name', 'Slug', 'Products', 'Parent', ''].map(h => (
                  <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className={`hover:bg-gray-50/60 group ${c.parent_id ? 'bg-gray-50/30' : ''}`}>

                  {/* Image (not editable inline) */}
                  <td className="py-2 px-4 border-b border-gray-50">
                    {c.image ? <img src={c.image} alt="" className="w-10 h-10 object-cover" onError={e => (e.currentTarget.style.display = 'none')} /> : <div className="w-10 h-10 bg-gray-100" />}
                  </td>

                  {/* Name */}
                  <td className="py-2 px-4 border-b border-gray-50 min-w-[140px]" onClick={() => !isEditing(c.id, 'name') && startEdit(c.id, 'name', c.name)}>
                    {isEditing(c.id, 'name') ? (
                      <input
                        autoFocus value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => commitText(c.id, 'name', c.name)}
                        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') cancelEdit(); }}
                        className={INPUT_CLS + (c.parent_id ? '' : ' font-medium')}
                      />
                    ) : (
                      <span className={`${CELL_CLS} ${isPatching(c.id, 'name') ? 'opacity-40' : c.parent_id ? 'pl-4 text-[#6b6b6b]' : 'font-medium text-[#1a1a1a]'}`}>
                        {c.parent_id ? '└ ' : ''}{isPatching(c.id, 'name') ? '…' : isSaved(c.id, 'name') ? <span className="text-green-600 font-semibold text-xs">✓ Saved</span> : c.name}
                      </span>
                    )}
                  </td>

                  {/* Slug */}
                  <td className="py-2 px-4 border-b border-gray-50 min-w-[120px]" onClick={() => !isEditing(c.id, 'slug') && startEdit(c.id, 'slug', c.slug)}>
                    {isEditing(c.id, 'slug') ? (
                      <input
                        autoFocus value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => commitText(c.id, 'slug', c.slug)}
                        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') cancelEdit(); }}
                        className={INPUT_CLS + ' font-mono text-xs'}
                      />
                    ) : (
                      <span className={`${CELL_CLS} font-mono text-xs ${isPatching(c.id, 'slug') ? 'opacity-40 text-[#6b6b6b]' : 'text-[#6b6b6b]'}`}>
                        {isPatching(c.id, 'slug') ? '…' : isSaved(c.id, 'slug') ? <span className="text-green-600 font-semibold not-italic">✓ Saved</span> : c.slug}
                      </span>
                    )}
                  </td>

                  {/* Products count (read-only) */}
                  <td className="py-2 px-4 border-b border-gray-50 text-[#6b6b6b]">{c.products_count ?? 0}</td>

                  {/* Parent */}
                  <td className="py-2 px-4 border-b border-gray-50 min-w-[120px]" onClick={() => !isEditing(c.id, 'parent_id') && startEdit(c.id, 'parent_id', c.parent_id ?? '')}>
                    {isEditing(c.id, 'parent_id') ? (
                      <select
                        autoFocus value={editValue}
                        onChange={e => commitSelect(c.id, 'parent_id', e.target.value)}
                        onBlur={() => commitSelect(c.id, 'parent_id', editValue)}
                        onKeyDown={e => e.key === 'Escape' && cancelEdit()}
                        className={INPUT_CLS}
                      >
                        <option value="">— top-level —</option>
                        {topLevel.filter(x => x.id !== c.id).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </select>
                    ) : (
                      <span className={`${CELL_CLS} ${isPatching(c.id, 'parent_id') ? 'opacity-40 text-[#6b6b6b]' : 'text-[#6b6b6b]'}`}>
                        {isPatching(c.id, 'parent_id') ? '…' : isSaved(c.id, 'parent_id') ? <span className="text-green-600 font-semibold text-xs">✓ Saved</span> : (c.parent_id ? categories.find(x => x.id === c.parent_id)?.name ?? '—' : '—')}
                      </span>
                    )}
                  </td>

                  <td className="py-2 px-4 border-b border-gray-50">
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Add Category</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input required value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slug (auto-generated if empty)</label>
                <input value={form.slug} onChange={e => set('slug', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parent Category</label>
                <select value={form.parent_id} onChange={e => set('parent_id', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]">
                  <option value="">None (top-level)</option>
                  {topLevel.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                <input value={form.image} onChange={e => set('image', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" placeholder="https://..." />
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors">
                  {saving ? 'Saving…' : 'Create Category'}
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
