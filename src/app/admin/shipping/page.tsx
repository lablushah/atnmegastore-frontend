'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageProducts } from '@/lib/types';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface ShippingZone { id: number; name: string; country_code: string; province_code: string | null; rate: string; is_active: boolean; sort_order: number; }
interface ShippingSettings { free_shipping_enabled: boolean; free_shipping_threshold: string; }

const EMPTY_ZONE = { name: '', country_code: 'CA', province_code: '', rate: '', is_active: true, sort_order: 0 };

export default function AdminShippingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [form, setForm] = useState(EMPTY_ZONE);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [freeEnabled, setFreeEnabled] = useState(false);
  const [freeThreshold, setFreeThreshold] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageProducts(user)) { router.push('/admin'); return; }
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    try {
      const [zonesRes, settingsRes] = await Promise.all([api.get('/admin/shipping/zones'), api.get('/admin/shipping/settings')]);
      setZones(zonesRes.data);
      setSettings(settingsRes.data);
      setFreeEnabled(settingsRes.data.free_shipping_enabled);
      setFreeThreshold(settingsRes.data.free_shipping_threshold);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm(EMPTY_ZONE); setShowModal(true); }
  function openEdit(z: ShippingZone) {
    setEditing(z);
    setForm({ name: z.name, country_code: z.country_code, province_code: z.province_code ?? '', rate: z.rate, is_active: z.is_active, sort_order: z.sort_order });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, rate: parseFloat(form.rate as string), province_code: form.province_code || null };
      if (editing) { await api.put(`/admin/shipping/zones/${editing.id}`, payload); toast.success('Zone updated'); }
      else { await api.post('/admin/shipping/zones', payload); toast.success('Zone created'); }
      setShowModal(false); loadAll();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this shipping zone?')) return;
    try { await api.delete(`/admin/shipping/zones/${id}`); toast.success('Deleted'); setZones(prev => prev.filter(z => z.id !== id)); }
    catch { toast.error('Delete failed'); }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault(); setSavingSettings(true);
    try {
      await api.put('/admin/shipping/settings', { free_shipping_enabled: freeEnabled, free_shipping_threshold: parseFloat(freeThreshold) });
      toast.success('Settings saved');
    } catch { toast.error('Save failed'); }
    finally { setSavingSettings(false); }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Shipping</h1>

      {/* Free shipping settings */}
      {!loading && settings && (
        <div className="bg-white border border-[#cccacc] p-6 mb-8">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Free Shipping</h2>
          <form onSubmit={handleSaveSettings} className="flex flex-wrap gap-4 items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={freeEnabled} onChange={e => setFreeEnabled(e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Enable free shipping
            </label>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Minimum order amount ($)</label>
              <input type="number" step="0.01" min="0" value={freeThreshold} onChange={e => setFreeThreshold(e.target.value)} disabled={!freeEnabled} className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] disabled:opacity-50 w-36" />
            </div>
            <button type="submit" disabled={savingSettings} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors">
              <Save className="w-4 h-4" /> {savingSettings ? 'Saving…' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Shipping zones */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">Shipping Zones</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Zone
        </button>
      </div>

      {loading ? <Spinner className="py-16" label="Loading shipping settings…" /> : (
        <div className="bg-white border border-[#cccacc]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Zone Name', 'Country', 'Province', 'Rate', 'Status', ''].map(h => (
                  <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[#6b6b6b]">No shipping zones. Add one to enable shipping.</td></tr>
              ) : zones.map(z => (
                <tr key={z.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b border-gray-50 font-medium text-[#1a1a1a]">{z.name}</td>
                  <td className="py-3 px-4 border-b border-gray-50 font-mono text-xs text-[#6b6b6b]">{z.country_code}</td>
                  <td className="py-3 px-4 border-b border-gray-50 font-mono text-xs text-[#6b6b6b]">{z.province_code ?? 'All'}</td>
                  <td className="py-3 px-4 border-b border-gray-50 font-medium">${parseFloat(z.rate).toFixed(2)}</td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <span className={`text-xs px-2 py-0.5 ${z.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{z.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(z)} className="text-[#213885] hover:text-[#081849]"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(z.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
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
          <div className="bg-white w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">{editing ? 'Edit Zone' : 'Add Shipping Zone'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Zone Name *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" placeholder="Ontario Standard" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Country Code *</label>
                  <input required maxLength={2} value={form.country_code} onChange={e => set('country_code', e.target.value.toUpperCase())} className="w-full border border-gray-300 px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#213885]" placeholder="CA" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Province Code (optional)</label>
                  <input value={form.province_code} onChange={e => set('province_code', e.target.value.toUpperCase())} className="w-full border border-gray-300 px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#213885]" placeholder="ON" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rate ($) *</label>
                  <input required type="number" step="0.01" min="0" value={form.rate} onChange={e => set('rate', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => set('sort_order', +e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Active
              </label>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Zone'}
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
