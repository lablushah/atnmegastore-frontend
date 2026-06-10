'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageProducts } from '@/lib/types';
import api from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface DiscountCode { id: number; code: string; type: 'percent' | 'fixed'; amount: string; min_order_amount: string | null; max_uses: number | null; uses_count: number; expires_at: string | null; is_active: boolean; }
interface Paginated { data: DiscountCode[]; current_page: number; last_page: number; total: number; }

const EMPTY = { code: '', type: 'percent' as 'percent' | 'fixed', amount: '', min_order_amount: '', max_uses: '', expires_at: '', is_active: true };

export default function AdminDiscountCodesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageProducts(user)) { router.push('/admin'); return; }
    load(1);
  }, [user]);

  async function load(p: number) {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/discount-codes', { params: { page: p } });
      const d: Paginated = data;
      setCodes(d.data); setPage(d.current_page); setLastPage(d.last_page);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(c: DiscountCode) {
    setEditing(c);
    setForm({ code: c.code, type: c.type, amount: c.amount, min_order_amount: c.min_order_amount ?? '', max_uses: c.max_uses ? String(c.max_uses) : '', expires_at: c.expires_at ? c.expires_at.substring(0, 10) : '', is_active: c.is_active });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const payload: any = { ...form, amount: parseFloat(form.amount), min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null, max_uses: form.max_uses ? parseInt(form.max_uses) : null, expires_at: form.expires_at || null };
      if (editing) { await api.put(`/admin/discount-codes/${editing.id}`, payload); toast.success('Updated'); }
      else { await api.post('/admin/discount-codes', payload); toast.success('Created'); }
      setShowModal(false); load(page);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this discount code?')) return;
    try { await api.delete(`/admin/discount-codes/${id}`); toast.success('Deleted'); load(page); }
    catch { toast.error('Delete failed'); }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Discount Codes</h1>
          <p className="text-[#6b6b6b] mt-1">{codes.length} codes</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Code
        </button>
      </div>

      {loading ? <Spinner className="py-16" label="Loading discount codes…" /> : (
        <>
          <div className="bg-white border border-[#cccacc]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Code', 'Discount', 'Min Order', 'Uses', 'Expires', 'Status', ''].map(h => (
                    <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b border-gray-50 font-mono font-medium text-[#213885]">{c.code}</td>
                    <td className="py-3 px-4 border-b border-gray-50">{c.type === 'percent' ? `${parseFloat(c.amount)}%` : `$${parseFloat(c.amount).toFixed(2)}`}</td>
                    <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{c.min_order_amount ? `$${parseFloat(c.min_order_amount).toFixed(2)}` : '—'}</td>
                    <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                    <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b] text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 border-b border-gray-50">
                      <span className={`text-xs px-2 py-0.5 ${c.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="py-3 px-4 border-b border-gray-50">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-[#213885] hover:text-[#081849]"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">{editing ? 'Edit Code' : 'Add Discount Code'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                  <input required value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className="w-full border border-gray-300 px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#213885]" placeholder="SUMMER20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]">
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount *</label>
                  <input required type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Order Amount</label>
                  <input type="number" step="0.01" min="0" value={form.min_order_amount} onChange={e => set('min_order_amount', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Uses</label>
                  <input type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expires At</label>
                  <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Active
              </label>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Code'}
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
