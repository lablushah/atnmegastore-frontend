'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageOrders } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Gift, Plus, Search, X, CheckCircle, Clock, Ban, Eye, ChevronLeft, ChevronRight, Zap, Smartphone, Store, CreditCard } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  stripe: 'Credit Card',
  interac_etransfer: 'Interac e-Transfer',
  pay_at_store: 'Pay at Store',
};

interface GiftCard {
  id: number; code: string; amount: string; balance: string; status: string;
  payment_method: string;
  purchaser_name: string; purchaser_email: string;
  send_to_recipient: boolean; recipient_name: string | null; recipient_email: string | null;
  message: string | null; expires_at: string | null; created_at: string;
  usages: { id: number; amount_used: string; created_at: string; order?: { id: number } | null }[];
}
interface Stats { total: number; active: number; pending: number; redeemed: number; void: number; total_issued: number; total_redeemed: number; outstanding: number }
interface Meta  { current_page: number; last_page: number; total: number; per_page: number }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:   { label: 'Active',   color: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle },
  pending:  { label: 'Pending',  color: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  redeemed: { label: 'Redeemed', color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: CheckCircle },
  void:     { label: 'Void',     color: 'bg-red-50 text-red-600 border-red-200',        icon: Ban },
};

export default function AdminGiftCardsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [cards,   setCards]   = useState<GiftCard[]>([]);
  const [meta,    setMeta]    = useState<Meta | null>(null);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);
  const [detail,  setDetail]  = useState<GiftCard | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [form, setForm] = useState({
    amount: '50', purchaser_name: '', purchaser_email: '',
    send_to_recipient: false, recipient_name: '', recipient_email: '',
    message: '', send_email: true,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user || !canManageOrders(user)) { router.push('/admin'); return; }
    loadStats();
  }, [user]);

  useEffect(() => { loadCards(); }, [search, status, page]);

  async function loadStats() {
    const { data } = await api.get('/admin/gift-cards/stats').catch(() => ({ data: null }));
    if (data) setStats(data);
  }

  async function loadCards() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/gift-cards', {
        params: { search: search || undefined, status: status || undefined, page },
      });
      setCards(data.data);
      setMeta(data.meta ?? { current_page: data.current_page, last_page: data.last_page, total: data.total, per_page: data.per_page });
    } catch { toast.error('Failed to load gift cards.'); }
    finally { setLoading(false); }
  }

  async function activateCard(id: number) {
    if (!confirm('Activate this gift card? This will send the gift card email to the recipient.')) return;
    await api.put(`/admin/gift-cards/${id}`, { status: 'active' });
    toast.success('Gift card activated and email sent!');
    loadCards(); loadStats();
    if (detail?.id === id) setDetail(prev => prev ? { ...prev, status: 'active' } : null);
  }

  async function voidCard(id: number) {
    if (!confirm('Void this gift card? This cannot be undone.')) return;
    await api.put(`/admin/gift-cards/${id}`, { status: 'void' });
    toast.success('Gift card voided.');
    loadCards(); loadStats();
    if (detail?.id === id) setDetail(prev => prev ? { ...prev, status: 'void' } : null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/gift-cards', {
        ...form,
        amount: parseFloat(form.amount),
        send_to_recipient: form.send_to_recipient,
      });
      toast.success('Gift card created!');
      setShowCreate(false);
      setForm({ amount: '50', purchaser_name: '', purchaser_email: '', send_to_recipient: false, recipient_name: '', recipient_email: '', message: '', send_email: true });
      loadCards(); loadStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create gift card.');
    } finally { setCreating(false); }
  }

  if (!user || !canManageOrders(user)) return null;

  return (
    <div className="max-w-full p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#213885] flex items-center justify-center">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Gift Cards</h1>
            {meta && <p className="text-xs text-[#6b6b6b]">{meta.total} total</p>}
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#213885] text-white px-4 py-2 text-sm font-semibold hover:bg-[#7a2340] transition-colors">
          <Plus className="w-4 h-4" /> Create Gift Card
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active', value: stats.active, color: 'text-green-600' },
            { label: 'Outstanding Balance', value: '$' + stats.outstanding.toFixed(2), color: 'text-[#213885]' },
            { label: 'Total Issued', value: '$' + stats.total_issued.toFixed(2), color: 'text-blue-600' },
            { label: 'Total Redeemed', value: '$' + stats.total_redeemed.toFixed(2), color: 'text-gray-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#cccacc] p-4">
              <p className="text-xs text-[#6b6b6b]">{s.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search code, email…"
            className="w-full pl-9 pr-3 py-2 border border-[#cccacc] text-sm focus:outline-none focus:border-[#213885]" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="border border-[#cccacc] text-sm px-3 py-2 focus:outline-none focus:border-[#213885] bg-white">
          <option value="">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#cccacc] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#cccacc] bg-[#ecdfd2]">
            <tr>
              {['Code', 'Amount', 'Balance', 'Status', 'Purchaser', 'Recipient', 'Expires', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8"><Spinner className="mx-auto" label="Loading gift cards…" /></td></tr>
            ) : cards.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-[#6b6b6b]">No gift cards found.</td></tr>
            ) : cards.map(c => {
              const sc = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.void;
              const Icon = sc.icon;
              return (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#213885] text-xs">{c.code}</td>
                  <td className="px-4 py-3 font-semibold">${parseFloat(c.amount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={parseFloat(c.balance) === 0 ? 'text-gray-400' : 'text-green-700 font-semibold'}>
                      ${parseFloat(c.balance).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 border ${sc.color}`}>
                      <Icon className="w-3 h-3" />{sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1a1a1a]">{c.purchaser_name}</p>
                    <p className="text-xs text-[#6b6b6b]">{c.purchaser_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {c.send_to_recipient && c.recipient_email ? (
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{c.recipient_name}</p>
                        <p className="text-xs text-[#6b6b6b]">{c.recipient_email}</p>
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6b6b6b]">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDetail(c)} className="p-1 text-[#213885] hover:bg-[#ecdfd2]" title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {c.status === 'pending' && (
                        <button onClick={() => activateCard(c.id)} className="p-1 text-green-600 hover:bg-green-50" title="Activate">
                          <Zap className="w-4 h-4" />
                        </button>
                      )}
                      {c.status === 'active' && (
                        <button onClick={() => voidCard(c.id)} className="p-1 text-red-500 hover:bg-red-50" title="Void">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6b6b6b] text-xs">{meta.total} gift cards</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 border border-[#cccacc] disabled:opacity-40 hover:border-[#213885]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 border border-[#cccacc] text-xs">{page} / {meta.last_page}</span>
            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
              className="p-1.5 border border-[#cccacc] disabled:opacity-40 hover:border-[#213885]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetail(null)} />
          <div className="w-full max-w-md bg-white overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#cccacc] bg-[#ecdfd2] shrink-0">
              <h2 className="text-sm font-bold text-[#1a1a1a]">Gift Card Details</h2>
              <button onClick={() => setDetail(null)}><X className="w-5 h-5 text-[#6b6b6b]" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Card visual */}
              <div className="bg-gradient-to-br from-[#213885] to-[#8b2444] p-5 text-white">
                <p className="text-[#893172] text-xs tracking-widest uppercase mb-3">ATN Mega Store Gift Card</p>
                <p className="text-2xl font-bold font-mono tracking-wider mb-1">{detail.code}</p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xs text-gray-300">Original</p>
                    <p className="text-lg font-bold">${parseFloat(detail.amount).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-300">Balance</p>
                    <p className="text-lg font-bold text-[#893172]">${parseFloat(detail.balance).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Status + Payment method */}
              <div className="flex items-start gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#6b6b6b] uppercase mb-1">Status</p>
                  {(() => { const sc = STATUS_CONFIG[detail.status] ?? STATUS_CONFIG.void; const Icon = sc.icon;
                    return <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border ${sc.color}`}><Icon className="w-3.5 h-3.5" />{sc.label}</span>;
                  })()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6b6b6b] uppercase mb-1">Payment</p>
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border border-gray-200 bg-gray-50 text-gray-700">
                    {detail.payment_method === 'stripe' && <CreditCard className="w-3.5 h-3.5" />}
                    {detail.payment_method === 'interac_etransfer' && <Smartphone className="w-3.5 h-3.5" />}
                    {detail.payment_method === 'pay_at_store' && <Store className="w-3.5 h-3.5" />}
                    {PAYMENT_METHOD_LABEL[detail.payment_method] ?? detail.payment_method}
                  </span>
                </div>
              </div>

              {/* Pending notice */}
              {detail.status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-0.5">Awaiting payment confirmation</p>
                  {detail.payment_method === 'interac_etransfer' && (
                    <p>Check your Interac account for reference <strong>GC-{detail.id}</strong>. Click Activate once payment is received.</p>
                  )}
                  {detail.payment_method === 'pay_at_store' && (
                    <p>Customer will pay in-store with reference <strong>GC-{detail.id}</strong>. Click Activate when they visit.</p>
                  )}
                </div>
              )}

              {/* Purchaser */}
              <div>
                <p className="text-xs font-semibold text-[#6b6b6b] uppercase mb-1">Purchased by</p>
                <p className="text-sm font-medium">{detail.purchaser_name}</p>
                <p className="text-xs text-[#6b6b6b]">{detail.purchaser_email}</p>
                <p className="text-xs text-[#b0a098] mt-0.5">{new Date(detail.created_at).toLocaleString('en-CA')}</p>
              </div>

              {/* Recipient */}
              {detail.send_to_recipient && detail.recipient_email && (
                <div>
                  <p className="text-xs font-semibold text-[#6b6b6b] uppercase mb-1">Sent to</p>
                  <p className="text-sm font-medium">{detail.recipient_name}</p>
                  <p className="text-xs text-[#6b6b6b]">{detail.recipient_email}</p>
                  {detail.message && (
                    <p className="text-xs text-[#6b6b6b] mt-1 italic border-l-2 border-[#893172] pl-2">"{detail.message}"</p>
                  )}
                </div>
              )}

              {/* Expiry */}
              {detail.expires_at && (
                <div>
                  <p className="text-xs font-semibold text-[#6b6b6b] uppercase mb-1">Expires</p>
                  <p className="text-sm">{new Date(detail.expires_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              )}

              {/* Usage history */}
              <div>
                <p className="text-xs font-semibold text-[#6b6b6b] uppercase mb-2">Usage History</p>
                {detail.usages.length === 0 ? (
                  <p className="text-xs text-gray-400">Not used yet.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.usages.map(u => (
                      <div key={u.id} className="flex items-center justify-between text-sm border border-[#f0e8e0] px-3 py-2">
                        <div>
                          <p className="font-medium text-[#1a1a1a]">−${parseFloat(u.amount_used).toFixed(2)}</p>
                          {u.order && <p className="text-xs text-[#6b6b6b]">Order #{u.order.id}</p>}
                        </div>
                        <p className="text-xs text-[#6b6b6b]">{new Date(u.created_at).toLocaleDateString('en-CA')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {(detail.status === 'pending' || detail.status === 'active') && (
              <div className="shrink-0 px-5 py-4 border-t border-[#cccacc] flex gap-3">
                {detail.status === 'pending' && (
                  <button onClick={() => activateCard(detail.id)}
                    className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Activate &amp; Send Email
                  </button>
                )}
                {detail.status === 'active' && (
                  <button onClick={() => voidCard(detail.id)}
                    className="flex-1 py-2.5 border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                    <Ban className="w-4 h-4" /> Void This Gift Card
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-[#cccacc] w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#cccacc] bg-[#ecdfd2]">
              <h2 className="text-sm font-bold text-[#1a1a1a]">Create Gift Card</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-[#6b6b6b]" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6b6b6b] mb-1 uppercase">Amount (CAD) *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 200].map(d => (
                    <button key={d} type="button" onClick={() => setForm(f => ({ ...f, amount: String(d) }))}
                      className={`py-2 text-sm font-bold border-2 transition-colors ${form.amount === String(d) ? 'border-[#213885] bg-[#213885] text-white' : 'border-[#cccacc] hover:border-[#213885]'}`}>
                      ${d}
                    </button>
                  ))}
                </div>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="1" max="1000"
                  className="w-full mt-2 border border-[#cccacc] px-3 py-2 text-sm focus:outline-none focus:border-[#213885]"
                  placeholder="Or enter custom amount" />
              </div>
              {[
                { key: 'purchaser_name',  label: 'Purchaser Name *',  type: 'text',  req: true },
                { key: 'purchaser_email', label: 'Purchaser Email *', type: 'email', req: true },
              ].map(({ key, label, type, req }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-[#6b6b6b] mb-1 uppercase">{label}</label>
                  <input type={type} required={req} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-[#cccacc] px-3 py-2 text-sm focus:outline-none focus:border-[#213885]" />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="send_to_recipient" checked={form.send_to_recipient}
                  onChange={e => setForm(f => ({ ...f, send_to_recipient: e.target.checked }))}
                  className="accent-[#213885]" />
                <label htmlFor="send_to_recipient" className="text-sm text-[#1a1a1a]">Send to a recipient</label>
              </div>
              {form.send_to_recipient && (
                <>
                  {[
                    { key: 'recipient_name',  label: 'Recipient Name',  type: 'text'  },
                    { key: 'recipient_email', label: 'Recipient Email', type: 'email' },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-[#6b6b6b] mb-1 uppercase">{label}</label>
                      <input type={type} value={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-[#cccacc] px-3 py-2 text-sm focus:outline-none focus:border-[#213885]" />
                    </div>
                  ))}
                </>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#6b6b6b] mb-1 uppercase">Message (optional)</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2}
                  className="w-full border border-[#cccacc] px-3 py-2 text-sm focus:outline-none focus:border-[#213885] resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="send_email" checked={form.send_email}
                  onChange={e => setForm(f => ({ ...f, send_email: e.target.checked }))}
                  className="accent-[#213885]" />
                <label htmlFor="send_email" className="text-sm text-[#1a1a1a]">Send gift card by email immediately</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-[#cccacc] text-sm font-semibold text-[#6b6b6b] hover:border-[#213885]">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-[#213885] text-white text-sm font-semibold hover:bg-[#7a2340] disabled:opacity-50 transition-colors">
                  {creating ? 'Creating…' : 'Create Gift Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
