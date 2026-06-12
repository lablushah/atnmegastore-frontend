'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import { Plus, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

interface Employee { id: number; name: string; email: string; role: string; job_title: string | null; phone: string | null; is_active: boolean; created_at: string; }
interface Paginated { data: Employee[]; current_page: number; last_page: number; total: number; }

const ROLE_LABELS: Record<string, string> = { admin: 'Administrator', product_manager: 'Product Manager', sales: 'Sales' };
const ROLE_COLORS: Record<string, string> = { admin: 'bg-red-50 text-red-700', product_manager: 'bg-purple-50 text-purple-700', sales: 'bg-blue-50 text-blue-700' };
const EMPTY = { name: '', email: '', role: 'sales', job_title: '', phone: '', is_active: true };

type EditCell = { id: number; field: string } | null;

const INPUT_CLS  = 'bg-transparent border-0 border-b border-[#213885] outline-none text-sm py-0.5 w-full min-w-[6rem]';
const CELL_CLS   = 'cursor-pointer hover:border-b hover:border-dashed hover:border-gray-400 inline-block w-full';

export default function AdminEmployeesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  // Inline edit
  const [editCell, setEditCell] = useState<EditCell>(null);
  const [editValue, setEditValue] = useState('');
  const [patchingCell, setPatchingCell] = useState<EditCell>(null);
  const [savedCell, setSavedCell] = useState<EditCell>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
    load(1);
  }, [user]);

  async function load(p: number, q?: string) {
    setLoading(true);
    try {
      const params: any = { page: p, per_page: 20 };
      const q2 = q !== undefined ? q : search;
      if (q2) params.search = q2;
      const { data } = await api.get('/admin/employees', { params });
      const d: Paginated = data;
      setEmployees(d.data); setPage(d.current_page); setLastPage(d.last_page); setTotal(d.total);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  async function handleCreate(ev: React.FormEvent) {
    ev.preventDefault(); setSaving(true);
    try {
      await api.post('/admin/employees', form);
      toast.success('Employee created');
      setShowModal(false); load(page);
    } catch (err: any) {
      const errs = err?.response?.data?.errors;
      toast.error(errs ? Object.values(errs).flat().join(', ') : err?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this employee?')) return;
    try { await api.delete(`/admin/employees/${id}`); toast.success('Deleted'); load(page); }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Delete failed'); }
  }

  // ── Inline edit ──────────────────────────────────────────────────────────────

  function startEdit(id: number, field: string, currentValue: any) {
    setEditCell({ id, field });
    setEditValue(String(currentValue ?? ''));
  }

  function cancelEdit() { setEditCell(null); setEditValue(''); }

  async function patchEmployee(id: number, field: string, value: any) {
    // Optimistic update
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    setPatchingCell({ id, field });
    try {
      const { data } = await api.put(`/admin/employees/${id}`, { [field]: value });
      setEmployees(prev => prev.map(e => e.id === id ? data : e));
      setSavedCell({ id, field });
      setTimeout(() => setSavedCell(null), 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
      load(page); // revert on error
    } finally {
      setPatchingCell(null);
    }
  }

  async function commitText(id: number, field: string, original: any) {
    cancelEdit();
    if (editValue === String(original ?? '')) return;
    await patchEmployee(id, field, editValue || null);
  }

  async function commitSelect(id: number, field: string, value: string) {
    cancelEdit();
    await patchEmployee(id, field, value);
  }

  async function toggleActive(emp: Employee) {
    await patchEmployee(emp.id, 'is_active', !emp.is_active);
  }

  const isEditing  = (id: number, field: string) => editCell?.id === id && editCell?.field === field;
  const isPatching = (id: number, field: string) => patchingCell?.id === id && patchingCell?.field === field;
  const isSaved    = (id: number, field: string) => savedCell?.id === id && savedCell?.field === field;
  const set        = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Employees</h1>
          <p className="text-[#6b6b6b] mt-1">{total} staff accounts · <span className="text-xs text-gray-400">click Role, Job Title or Status to edit inline</span></p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowModal(true); }} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1, search)} placeholder="Search by name or email…" className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
        <button onClick={() => load(1, search)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm"><Search className="w-4 h-4" /></button>
      </div>

      {loading ? <Spinner className="py-16" label="Loading employees…" /> : (
        <>
          <div className="bg-white border border-[#cccacc]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Name', 'Email', 'Role', 'Job Title', 'Status', ''].map(h => (
                    <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/60 group">
                    <td className="py-3 px-4 border-b border-gray-50 font-medium text-[#1a1a1a]">{e.name}</td>
                    <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{e.email}</td>

                    {/* ── Role inline select ── */}
                    <td className="py-3 px-4 border-b border-gray-50 min-w-[140px]" onClick={() => !isEditing(e.id, 'role') && startEdit(e.id, 'role', e.role)}>
                      {isEditing(e.id, 'role') ? (
                        <select
                          autoFocus value={editValue}
                          onChange={ev => commitSelect(e.id, 'role', ev.target.value)}
                          onBlur={() => { if (editValue !== e.role) commitSelect(e.id, 'role', editValue); else cancelEdit(); }}
                          onKeyDown={ev => ev.key === 'Escape' && cancelEdit()}
                          className={INPUT_CLS}
                        >
                          <option value="admin">Administrator</option>
                          <option value="product_manager">Product Manager</option>
                          <option value="sales">Sales</option>
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 cursor-pointer transition-opacity ${isPatching(e.id, 'role') ? 'opacity-40' : ''} ${isSaved(e.id, 'role') ? 'bg-green-50 text-green-600' : ROLE_COLORS[e.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {isPatching(e.id, 'role') ? '…' : isSaved(e.id, 'role') ? '✓ Saved' : (ROLE_LABELS[e.role] ?? e.role)}
                        </span>
                      )}
                    </td>

                    {/* ── Job Title inline text ── */}
                    <td className="py-3 px-4 border-b border-gray-50 min-w-[140px]" onClick={() => !isEditing(e.id, 'job_title') && startEdit(e.id, 'job_title', e.job_title ?? '')}>
                      {isEditing(e.id, 'job_title') ? (
                        <input
                          autoFocus value={editValue}
                          onChange={ev => setEditValue(ev.target.value)}
                          onBlur={() => commitText(e.id, 'job_title', e.job_title)}
                          onKeyDown={ev => { if (ev.key === 'Enter') ev.currentTarget.blur(); if (ev.key === 'Escape') cancelEdit(); }}
                          className={INPUT_CLS}
                          placeholder="Job title…"
                        />
                      ) : (
                        <span className={`${CELL_CLS} ${isPatching(e.id, 'job_title') ? 'opacity-40 text-[#6b6b6b]' : 'text-[#6b6b6b]'}`}>
                          {isPatching(e.id, 'job_title') ? '…' : isSaved(e.id, 'job_title') ? <span className="text-green-600 font-semibold text-xs">✓ Saved</span> : (e.job_title ?? <span className="text-gray-300 italic text-xs">click to set</span>)}
                        </span>
                      )}
                    </td>

                    {/* ── Status toggle ── */}
                    <td className="py-3 px-4 border-b border-gray-50">
                      <button
                        onClick={() => toggleActive(e)}
                        disabled={isPatching(e.id, 'is_active')}
                        className={`text-xs px-2 py-0.5 transition-colors disabled:opacity-40 ${e.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                      >
                        {isPatching(e.id, 'is_active') ? '…' : isSaved(e.id, 'is_active') ? '✓ Saved' : (e.is_active ? 'Active' : 'Inactive')}
                      </button>
                    </td>

                    <td className="py-3 px-4 border-b border-gray-50">
                      {e.id !== user.id && (
                        <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      )}
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

      {/* Create modal — password only needed on create */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Add Employee</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                  <p className="text-xs text-gray-400 mt-1">A temporary password will be generated and emailed to the employee automatically.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
                  <select required value={form.role} onChange={e => set('role', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]">
                    <option value="admin">Administrator</option>
                    <option value="product_manager">Product Manager</option>
                    <option value="sales">Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
                  <input value={form.job_title} onChange={e => set('job_title', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Active
              </label>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors">
                  {saving ? 'Saving…' : 'Create Employee'}
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
