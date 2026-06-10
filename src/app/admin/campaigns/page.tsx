'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageCampaigns } from '@/lib/types';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface Campaign {
  id: number; title: string; subject: string; from_name: string;
  status: string; recipients_count: number | null; sent_at: string | null;
}
interface Paginated { data: Campaign[]; current_page: number; last_page: number; total: number; }

const STATUS_COLORS: Record<string, string> = {
  draft:   'bg-gray-100 text-gray-600',
  sending: 'bg-yellow-50 text-yellow-700',
  sent:    'bg-green-50 text-green-700',
};

export default function AdminCampaignsPage() {
  const { user }  = useAuthStore();
  const router    = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState<number | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageCampaigns(user)) { router.push('/admin'); return; }
    load(1);
    api.get('/admin/campaigns/recipient-count').then(r => setRecipientCount(r.data.count)).catch(() => {});
  }, [user]);

  async function load(p: number) {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/campaigns', { params: { page: p } });
      const d: Paginated = data;
      setCampaigns(d.data); setPage(d.current_page); setLastPage(d.last_page); setTotal(d.total);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }


  async function handleSend(id: number) {
    if (!window.confirm(`Send this campaign to ${recipientCount ?? 'all'} subscribers? This cannot be undone.`)) return;
    setSending(id);
    try {
      const { data } = await api.post(`/admin/campaigns/${id}/send`);
      toast.success(data.message); load(page);
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Send failed'); }
    finally { setSending(null); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this campaign?')) return;
    try { await api.delete(`/admin/campaigns/${id}`); toast.success('Deleted'); load(page); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Delete failed'); }
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Email Campaigns</h1>
          <p className="text-[#6b6b6b] mt-1 text-sm">{total} campaigns · {recipientCount ?? '—'} subscribers</p>
        </div>
        <button onClick={() => router.push('/admin/campaigns/new')}
          className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {loading ? (
        <Spinner className="py-16" label="Loading campaigns…" />
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No campaigns yet. Create your first one.</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-[#cccacc] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Title', 'Subject', 'Status', 'Recipients', 'Sent', ''].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs uppercase tracking-wide text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    <td className="py-3 px-4 font-medium text-[#1a1a1a]">{c.title}</td>
                    <td className="py-3 px-4 text-[#6b6b6b] max-w-xs truncate">{c.subject}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6b6b6b]">{c.recipients_count ?? '—'}</td>
                    <td className="py-3 px-4 text-[#6b6b6b] text-xs">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 items-center">
                        <button onClick={() => router.push(`/admin/campaigns/${c.id}/edit`)}
                          className="text-[#213885] hover:text-[#081849]" title={c.status === 'sent' ? 'View' : 'Edit'}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        {c.status === 'draft' && (
                          <button disabled={sending === c.id} onClick={() => handleSend(c.id)}
                            className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2 py-1 transition-colors">
                            <Send className="w-3 h-3" /> {sending === c.id ? '…' : 'Send'}
                          </button>
                        )}
                        {c.status !== 'sent' && (
                          <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
    </div>
  );
}
