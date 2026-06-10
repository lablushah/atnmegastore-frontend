'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, CalendarDays, MapPin, ExternalLink, Search } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

type Event = {
  id: number;
  title: string;
  slug: string;
  short_description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address: string | null;
  image: string | null;
  image_url: string | null;
  tickets_url: string | null;
  is_featured: boolean;
  status: 'draft' | 'published';
};

const EMPTY: Partial<Event> = {
  title: '', short_description: '', date: '', start_time: '', end_time: '',
  location: '', address: '', image: '', tickets_url: '',
  is_featured: false, status: 'draft',
};

export default function AdminEventsPage() {
  const [events, setEvents]     = useState<Event[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing]   = useState<Partial<Event>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [description, setDescription]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/events', { params });
      setEvents(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing({ ...EMPTY });
    setDescription('');
    setModal('create');
  };
  const openEdit = (ev: Event) => {
    setEditing({ ...ev, date: ev.date.slice(0, 10) });
    setDescription((ev as any).description ?? '');
    setModal('edit');
  };

  const save = async () => {
    if (!editing.title || !editing.date) { toast.error('Title and date are required'); return; }
    setSaving(true);
    try {
      const payload = { ...editing, description };
      if (modal === 'create') {
        await api.post('/admin/events', payload);
        toast.success('Event created');
      } else {
        await api.put(`/admin/events/${editing.id}`, payload);
        toast.success('Event updated');
      }
      setModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this event?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success('Event deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const toggle = async (ev: Event, field: 'status' | 'is_featured') => {
    try {
      const val = field === 'status'
        ? (ev.status === 'published' ? 'draft' : 'published')
        : !ev.is_featured;
      await api.put(`/admin/events/${ev.id}`, { [field]: val });
      load();
    } catch { toast.error('Update failed'); }
  };

  const fmt = (d: string) => new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total event{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#213885] text-white px-4 py-2 rounded text-sm font-semibold hover:bg-[#5f3475]">
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search events…" className="w-full pl-9 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm focus:outline-none">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Event</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Featured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12"><Spinner className="mx-auto" label="Loading events…" /></td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No events found.</td></tr>
            ) : events.map(ev => (
              <tr key={ev.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {ev.image_url ? (
                      <img src={ev.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                        <CalendarDays size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{ev.title}</p>
                      {ev.short_description && <p className="text-xs text-gray-400 truncate max-w-[220px]">{ev.short_description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  <div className="flex items-center gap-1"><CalendarDays size={13} className="text-gray-400" />{fmt(ev.date)}</div>
                  {ev.start_time && <div className="text-xs text-gray-400 mt-0.5">{ev.start_time}{ev.end_time ? ` – ${ev.end_time}` : ''}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {ev.location
                    ? <div className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" />{ev.location}</div>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(ev, 'status')}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ev.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ev.status === 'published' ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(ev, 'is_featured')}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ev.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                    {ev.is_featured ? '★ Featured' : 'No'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    {ev.tickets_url && (
                      <a href={ev.tickets_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500" title="Ticket link">
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button onClick={() => openEdit(ev)} className="text-gray-400 hover:text-[#213885]"><Pencil size={15} /></button>
                    <button onClick={() => remove(ev.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-600">Page {page}</span>
          <button disabled={events.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold">{modal === 'create' ? 'New Event' : 'Edit Event'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={editing.title ?? ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <input value={editing.short_description ?? ''} onChange={e => setEditing(p => ({ ...p, short_description: e.target.value }))}
                    maxLength={500} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={editing.date ?? ''} onChange={e => setEditing(p => ({ ...p, date: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="time" value={editing.start_time ?? ''} onChange={e => setEditing(p => ({ ...p, start_time: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input type="time" value={editing.end_time ?? ''} onChange={e => setEditing(p => ({ ...p, end_time: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location / Venue</label>
                  <input value={editing.location ?? ''} onChange={e => setEditing(p => ({ ...p, location: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input value={editing.address ?? ''} onChange={e => setEditing(p => ({ ...p, address: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input value={editing.image ?? ''} onChange={e => setEditing(p => ({ ...p, image: e.target.value }))}
                    placeholder="https://… or /storage/…" className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tickets / Registration URL</label>
                  <input value={editing.tickets_url ?? ''} onChange={e => setEditing(p => ({ ...p, tickets_url: e.target.value }))}
                    placeholder="https://eventbrite.com/…" className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                </div>
                <div className="col-span-2">
                  <button onClick={() => setDescExpanded(p => !p)} className="text-sm text-[#213885] font-medium mb-2">
                    {descExpanded ? '▲ Hide' : '▼ Add'} Full Description
                  </button>
                  {descExpanded && (
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={editing.is_featured ?? false} onChange={e => setEditing(p => ({ ...p, is_featured: e.target.checked }))} />
                    Featured event
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={editing.status === 'published'} onChange={e => setEditing(p => ({ ...p, status: e.target.checked ? 'published' : 'draft' }))} />
                    Published
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-5 py-2 bg-[#213885] text-white rounded text-sm font-semibold hover:bg-[#5f3475] disabled:opacity-50">
                {saving ? 'Saving…' : modal === 'create' ? 'Create Event' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
