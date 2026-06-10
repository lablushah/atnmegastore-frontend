'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageProducts } from '@/lib/types';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface Popup { id: number; title: string; subtitle: string | null; body: string | null; discount_code: string | null; button_text: string | null; image_url: string | null; delay_seconds: number; show_once: boolean; is_active: boolean; }

const EMPTY = { title: '', subtitle: '', body: '', discount_code: '', button_text: 'Subscribe', image_url: '', delay_seconds: 3, show_once: true, is_active: true };

export default function AdminPopupsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageProducts(user)) { router.push('/admin'); return; }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get('/admin/popups'); setPopups(data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(p: Popup) {
    setEditing(p);
    setForm({ title: p.title, subtitle: p.subtitle ?? '', body: p.body ?? '', discount_code: p.discount_code ?? '', button_text: p.button_text ?? '', image_url: p.image_url ?? '', delay_seconds: p.delay_seconds, show_once: p.show_once, is_active: p.is_active });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await api.put(`/admin/popups/${editing.id}`, form); toast.success('Updated'); }
      else { await api.post('/admin/popups', form); toast.success('Created'); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function toggleActive(p: Popup) {
    try {
      await api.put(`/admin/popups/${p.id}`, { ...p, is_active: !p.is_active });
      setPopups(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    } catch { toast.error('Update failed'); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this popup?')) return;
    try { await api.delete(`/admin/popups/${id}`); toast.success('Deleted'); setPopups(prev => prev.filter(p => p.id !== id)); }
    catch { toast.error('Delete failed'); }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Popups</h1>
          <p className="text-[#6b6b6b] mt-1">{popups.filter(p => p.is_active).length} active popup(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Popup
        </button>
      </div>

      {loading ? <Spinner className="py-16" label="Loading popups…" /> : (
        <div className="bg-white border border-[#cccacc]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Title', 'Discount Code', 'Delay', 'Show Once', 'Status', ''].map(h => (
                  <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {popups.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b border-gray-50">
                    <p className="font-medium text-[#1a1a1a]">{p.title}</p>
                    {p.subtitle && <p className="text-xs text-[#6b6b6b]">{p.subtitle}</p>}
                  </td>
                  <td className="py-3 px-4 border-b border-gray-50 font-mono text-[#213885] text-xs">{p.discount_code ?? '—'}</td>
                  <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{p.delay_seconds}s</td>
                  <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{p.show_once ? 'Yes' : 'No'}</td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <button onClick={() => toggleActive(p)} className={`flex items-center gap-1 text-xs px-2 py-1 ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {p.is_active ? 'Active' : 'Hidden'}
                    </button>
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
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">{editing ? 'Edit Popup' : 'Add Popup'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Body Text</label>
                <textarea rows={3} value={form.body} onChange={e => set('body', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Discount Code</label>
                  <input value={form.discount_code} onChange={e => set('discount_code', e.target.value.toUpperCase())} className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                  <input value={form.button_text} onChange={e => set('button_text', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Delay (seconds)</label>
                  <input type="number" min="0" value={form.delay_seconds} onChange={e => set('delay_seconds', +e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                <input value={form.image_url} onChange={e => set('image_url', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" placeholder="https://..." />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.show_once} onChange={e => set('show_once', e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Show once per visitor
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Active
                </label>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Popup'}
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
