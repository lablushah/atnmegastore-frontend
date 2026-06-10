'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageCustomers } from '@/lib/types';
import api from '@/lib/api';
import { Search, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface Customer { id: number; name: string; email: string; orders_count: number; created_at: string; }
interface Paginated { data: Customer[]; current_page: number; last_page: number; total: number; }

export default function AdminCustomersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageCustomers(user)) { router.push('/admin'); return; }
    load(1);
  }, [user]);

  async function load(p: number, q?: string) {
    setLoading(true);
    try {
      const params: any = { page: p, per_page: 20 };
      const q2 = q !== undefined ? q : search;
      if (q2) params.search = q2;
      const { data } = await api.get('/admin/customers', { params });
      const d: Paginated = data;
      setCustomers(d.data); setPage(d.current_page); setLastPage(d.last_page); setTotal(d.total);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this customer and all their data?')) return;
    try { await api.delete(`/admin/customers/${id}`); toast.success('Customer deleted'); load(page); }
    catch { toast.error('Delete failed'); }
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Customers</h1>
        <p className="text-[#6b6b6b] mt-1">{total} registered customers</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1, search)} placeholder="Search by name or email…" className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
        <button onClick={() => load(1, search)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm flex items-center gap-1"><Search className="w-4 h-4" /></button>
        {search && <button onClick={() => { setSearch(''); load(1, ''); }} className="text-sm text-gray-500 hover:text-gray-700 px-2 flex items-center gap-1"><X className="w-3 h-3" /> Clear</button>}
      </div>

      {loading ? <Spinner className="py-16" label="Loading customers…" /> : (
        <>
          <div className="bg-white border border-[#cccacc]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Name', 'Email', 'Orders', 'Joined', ''].map(h => (
                    <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-[#6b6b6b]">No customers found.</td></tr>
                ) : customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-indigo-700 font-bold text-xs">{c.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-[#1a1a1a]">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{c.email}</td>
                    <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{c.orders_count ?? 0}</td>
                    <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b] text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 border-b border-gray-50">
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
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
    </div>
  );
}
