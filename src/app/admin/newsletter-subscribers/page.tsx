'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageCampaigns } from '@/lib/types';
import api from '@/lib/api';
import { Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface Subscriber { id: number; email: string; name: string | null; created_at: string; }

export default function AdminNewsletterPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filtered, setFiltered] = useState<Subscriber[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageCampaigns(user)) { router.push('/admin'); return; }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get('/admin/newsletter-subscribers'); setSubscribers(data); setFiltered(data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function handleSearch(q: string) {
    setSearch(q);
    if (!q) { setFiltered(subscribers); return; }
    const lq = q.toLowerCase();
    setFiltered(subscribers.filter(s => s.email.toLowerCase().includes(lq) || (s.name?.toLowerCase().includes(lq))));
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Remove this subscriber?')) return;
    try {
      await api.delete(`/admin/newsletter-subscribers/${id}`);
      toast.success('Removed');
      const updated = subscribers.filter(s => s.id !== id);
      setSubscribers(updated);
      setFiltered(updated.filter(s => !search || s.email.toLowerCase().includes(search.toLowerCase())));
    } catch { toast.error('Failed'); }
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Newsletter Subscribers</h1>
        <p className="text-[#6b6b6b] mt-1">{subscribers.length} total subscribers</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Filter by email or name…" className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
        <Search className="self-center w-4 h-4 text-gray-400 -ml-8 pointer-events-none" />
        {search && <button onClick={() => handleSearch('')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2"><X className="w-3 h-3" /> Clear</button>}
      </div>

      {loading ? <Spinner className="py-16" label="Loading subscribers…" /> : (
        <div className="bg-white border border-[#cccacc]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Email', 'Name', 'Subscribed', ''].map(h => (
                  <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-[#6b6b6b]">No subscribers found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b border-gray-50 font-medium text-[#1a1a1a]">{s.email}</td>
                  <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{s.name ?? '—'}</td>
                  <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b] text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 border-b border-gray-50">
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
