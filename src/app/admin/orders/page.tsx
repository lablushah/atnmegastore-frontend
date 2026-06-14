'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageOrders } from '@/lib/types';
import api from '@/lib/api';
import { Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface OrderItem { id: number; product: { name: string } | null; quantity: number; price: string; }
interface Order {
  id: number; status: string; total: string; notes: string | null;
  guest_name: string | null; guest_email: string | null;
  delivery_method: string;
  user: { name: string; email: string } | null;
  items: OrderItem[]; created_at: string;
}
interface Paginated { data: Order[]; current_page: number; last_page: number; total: number; }

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: 'bg-yellow-50 text-yellow-700',
  pending: 'bg-orange-50 text-orange-700',
  paid: 'bg-blue-50 text-blue-700',
  shipped: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};
const ALL_STATUSES = ['awaiting_payment', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];

function getStatusLabel(status: string, deliveryMethod?: string): string {
  if (status === 'delivered' && deliveryMethod === 'pickup') return 'Customer Picked Up';
  const labels: Record<string, string> = {
    awaiting_payment: 'Awaiting Payment', pending: 'Pending', paid: 'Paid',
    shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
  };
  return labels[status] ?? status.replace(/_/g, ' ');
}

function availableStatuses(deliveryMethod: string): string[] {
  return deliveryMethod === 'pickup'
    ? ALL_STATUSES.filter(s => s !== 'shipped')
    : ALL_STATUSES;
}

export default function AdminOrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageOrders(user)) { router.push('/admin'); return; }
    load(1);
  }, [user]);

  async function load(p: number, q?: string, s?: string) {
    setLoading(true);
    try {
      const params: any = { page: p, per_page: 20 };
      const q2 = q !== undefined ? q : search;
      const s2 = s !== undefined ? s : statusFilter;
      if (q2) params.search = q2;
      if (s2) params.status = s2;
      const { data } = await api.get('/admin/orders', { params });
      const d: Paginated = data;
      setOrders(d.data); setPage(d.current_page); setLastPage(d.last_page); setTotal(d.total);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }

  async function handleUpdateStatus(e: { preventDefault(): void }) {
    e.preventDefault(); if (!selected) return; setUpdating(true);
    try {
      await api.put(`/admin/orders/${selected.id}`, { status: newStatus, notes });
      toast.success('Order updated');
      setSelected(null); load(page);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Update failed'); }
    finally { setUpdating(false); }
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Orders</h1>
        <p className="text-[#6b6b6b] mt-1">{total} total orders</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1, search)} placeholder="Search by name or email…" className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); load(1, search, e.target.value); }} className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]">
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
        </select>
        <button onClick={() => load(1, search)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm flex items-center gap-1"><Search className="w-4 h-4" /></button>
      </div>

      {loading ? <Spinner className="py-16" label="Loading orders…" /> : (
        <>
          <div className="bg-white border border-[#cccacc]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const name = o.user?.name ?? o.guest_name ?? 'Guest';
                  const email = o.user?.email ?? o.guest_email ?? '';
                  return (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b border-gray-50 font-mono text-xs text-[#6b6b6b]">#{o.id}</td>
                      <td className="py-3 px-4 border-b border-gray-50">
                        <p className="font-medium text-[#1a1a1a]">{name}</p>
                        <p className="text-xs text-[#6b6b6b]">{email}</p>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{o.items?.length ?? 0} item(s)</td>
                      <td className="py-3 px-4 border-b border-gray-50 font-medium">${parseFloat(o.total).toFixed(2)}</td>
                      <td className="py-3 px-4 border-b border-gray-50">
                        <span className={`text-xs px-2 py-0.5 ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{getStatusLabel(o.status, o.delivery_method)}</span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b] text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 border-b border-gray-50">
                        <button onClick={() => { setSelected(o); setNewStatus(o.status); setNotes(o.notes ?? ''); }} className="text-[#213885] hover:text-[#081849] text-xs underline">Manage</button>
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

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Order #{selected.id}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-gray-50 p-3 text-sm space-y-1">
                <p><span className="text-[#6b6b6b]">Customer:</span> {selected.user?.name ?? selected.guest_name ?? 'Guest'}</p>
                <p><span className="text-[#6b6b6b]">Email:</span> {selected.user?.email ?? selected.guest_email ?? '—'}</p>
                <p><span className="text-[#6b6b6b]">Total:</span> ${parseFloat(selected.total).toFixed(2)}</p>
                <p><span className="text-[#6b6b6b]">Fulfillment:</span> {selected.delivery_method === 'pickup' ? 'Store Pickup' : 'Delivery'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Items</p>
                {selected.items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span>{item.product?.name ?? 'Product'} × {item.quantity}</span>
                    <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleUpdateStatus} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Update Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]">
                    {availableStatuses(selected.delivery_method).map(s => (
                      <option key={s} value={s}>{getStatusLabel(s, selected.delivery_method)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={updating} className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors">
                    {updating ? 'Saving…' : 'Update Order'}
                  </button>
                  <button type="button" onClick={() => setSelected(null)} className="border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
