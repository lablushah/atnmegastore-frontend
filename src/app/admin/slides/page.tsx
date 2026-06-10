'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageProducts } from '@/lib/types';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface Slide {
  id: number;
  badge: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  cta_text: string;
  cta_link: string;
  bg_color: string;
  accent_color: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const EMPTY = {
  badge: '', title: '', subtitle: '', description: '',
  cta_text: 'Shop Now', cta_link: '/products',
  bg_color: '#1c3a2d', accent_color: '#e8c96a',
  image_url: '', is_active: true, sort_order: 0,
};

export default function AdminSlidesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageProducts(user)) { router.push('/admin'); return; }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get('/admin/slides'); setSlides(data); }
    catch { toast.error('Failed to load slides'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(s: Slide) {
    setEditing(s);
    setForm({ ...s, badge: s.badge ?? '', subtitle: s.subtitle ?? '', description: s.description ?? '', image_url: s.image_url ?? '' });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await api.put(`/admin/slides/${editing.id}`, form); toast.success('Slide updated'); }
      else { await api.post('/admin/slides', form); toast.success('Slide created'); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function toggleActive(s: Slide) {
    try {
      await api.put(`/admin/slides/${s.id}`, { ...s, is_active: !s.is_active });
      setSlides(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
    } catch { toast.error('Update failed'); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this slide?')) return;
    try { await api.delete(`/admin/slides/${id}`); toast.success('Deleted'); setSlides(prev => prev.filter(s => s.id !== id)); }
    catch { toast.error('Delete failed'); }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Hero Slides</h1>
          <p className="text-[#6b6b6b] mt-1">{slides.filter(s => s.is_active).length} of {slides.length} active</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Slide
        </button>
      </div>

      {loading ? <Spinner className="py-16" label="Loading slides…" /> : slides.length === 0 ? (
        <div className="bg-white border border-[#cccacc] p-12 text-center"><p className="text-[#6b6b6b]">No slides yet.</p></div>
      ) : (
        <div className="bg-white border border-[#cccacc]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['#', 'Preview', 'Title / Badge', 'CTA Link', 'Colors', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slides.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b border-gray-50 text-gray-400">{s.sort_order}</td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <div className="w-24 h-14 relative overflow-hidden" style={{ backgroundColor: s.bg_color }}>
                      {s.image_url && <img src={s.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                      <div className="absolute inset-0 flex items-center justify-center px-1">
                        <span className="text-[7px] font-bold text-white text-center leading-tight drop-shadow">{s.title.substring(0, 25)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <p className="font-medium text-[#1a1a1a]">{s.title}</p>
                    {s.badge && <span className="text-xs text-[#6b6b6b]">{s.badge}</span>}
                  </td>
                  <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b] text-xs">{s.cta_link}</td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <div className="flex gap-1">
                      <div className="w-5 h-5 border border-gray-200" style={{ backgroundColor: s.bg_color }} title={s.bg_color} />
                      <div className="w-5 h-5 border border-gray-200" style={{ backgroundColor: s.accent_color }} title={s.accent_color} />
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <button onClick={() => toggleActive(s)} className={`flex items-center gap-1 text-xs px-2 py-1 ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {s.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-[#213885] hover:text-[#081849]"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-semibold text-[#1a1a1a]">{editing ? 'Edit Slide' : 'Add Slide'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Badge (optional)</label>
                  <input value={form.badge} onChange={e => set('badge', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" placeholder="শুভ নববর্ষ" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => set('sort_order', +e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CTA Button Text</label>
                  <input value={form.cta_text} onChange={e => set('cta_text', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CTA Link</label>
                  <input value={form.cta_link} onChange={e => set('cta_link', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" placeholder="/products?category=bengali" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                <input value={form.image_url} onChange={e => set('image_url', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" placeholder="https://images.unsplash.com/..." />
                {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-20 w-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.bg_color} onChange={e => set('bg_color', e.target.value)} className="h-9 w-14 border border-gray-300 cursor-pointer p-0.5" />
                    <input value={form.bg_color} onChange={e => set('bg_color', e.target.value)} className="flex-1 border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Accent Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.accent_color} onChange={e => set('accent_color', e.target.value)} className="h-9 w-14 border border-gray-300 cursor-pointer p-0.5" />
                    <input value={form.accent_color} onChange={e => set('accent_color', e.target.value)} className="flex-1 border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-[#213885]" />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active (visible on homepage)</label>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Live Preview</p>
                <div className="relative h-28 overflow-hidden" style={{ backgroundColor: form.bg_color }}>
                  {form.image_url && <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" onError={e => (e.currentTarget.style.display = 'none')} />}
                  <div className="absolute inset-0 p-4 flex flex-col justify-center gap-0.5">
                    {form.badge && <span className="text-xs font-semibold" style={{ color: form.accent_color }}>{form.badge}</span>}
                    <p className="text-white font-bold text-lg leading-tight drop-shadow">{form.title || 'Title'}</p>
                    {form.subtitle && <p className="text-xs text-white/80">{form.subtitle}</p>}
                    {form.cta_text && (
                      <span className="mt-1 inline-block text-xs px-3 py-1 font-semibold w-fit" style={{ backgroundColor: form.accent_color, color: form.bg_color }}>{form.cta_text}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Slide'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
