'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees, isDeveloper, EMPLOYEE_ROLE_COLORS } from '@/lib/types';
import api from '@/lib/api';
import { Plus, Trash2, Search, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

// ── Config ────────────────────────────────────────────────────────────────────

const ALL_ROLES = [
  { value: 'owner',           label: 'Store Owner' },
  { value: 'product_manager', label: 'Product Manager' },
  { value: 'sales',           label: 'Sales' },
  { value: 'marketing',       label: 'Marketing' },
];
const DEV_ROLE = { value: 'developer', label: 'Developer' };

const ROLE_LABEL: Record<string, string> = {
  developer: 'Developer', owner: 'Store Owner', product_manager: 'Product Manager',
  sales: 'Sales', marketing: 'Marketing',
};

const EMPTY_FORM = { name: '', email: '', roles: ['sales'] as string[], job_title: '', phone: '', is_active: true };

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  id: number; name: string; email: string; roles: string[];
  job_title: string | null; phone: string | null; is_active: boolean; created_at: string;
}
interface Paginated { data: Employee[]; current_page: number; last_page: number; total: number; }

type EditCell = { id: number; field: string } | null;

const INPUT_CLS = 'bg-transparent border-0 border-b border-[#213885] outline-none text-sm py-0.5 w-full min-w-[6rem]';
const CELL_CLS  = 'cursor-pointer hover:border-b hover:border-dashed hover:border-gray-400 inline-block w-full';

// ── Role Badges ───────────────────────────────────────────────────────────────

function RoleBadges({ roles }: { roles: string[] }) {
  if (!roles?.length) return <span className="text-xs text-gray-300 italic">No role</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map(r => (
        <span key={r} className={`text-[10px] px-2 py-0.5 font-semibold ${EMPLOYEE_ROLE_COLORS[r as keyof typeof EMPLOYEE_ROLE_COLORS] ?? 'bg-gray-100 text-gray-600'}`}>
          {ROLE_LABEL[r] ?? r}
        </span>
      ))}
    </div>
  );
}

// ── Role Popover (for inline role editing) ────────────────────────────────────

function RolePopover({
  currentRoles, onApply, onClose, canAssignDeveloper,
}: {
  currentRoles: string[]; onApply: (roles: string[]) => void; onClose: () => void; canAssignDeveloper: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(currentRoles);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  function toggle(role: string) {
    setSelected(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  }

  const visibleRoles = canAssignDeveloper ? [DEV_ROLE, ...ALL_ROLES] : ALL_ROLES;

  return (
    <div ref={ref} className="absolute z-50 bg-white border border-gray-200 shadow-lg p-3 min-w-[180px] space-y-1.5 top-full left-0 mt-1">
      {visibleRoles.map(({ value, label }) => (
        <label key={value} className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#213885]">
          <input type="checkbox" className="accent-[#213885]" checked={selected.includes(value)} onChange={() => toggle(value)} />
          {label}
        </label>
      ))}
      <div className="pt-2 border-t border-gray-100 flex gap-2">
        <button
          onClick={() => { if (selected.length === 0) { toast.error('Select at least one role'); return; } onApply(selected); }}
          className="flex-1 bg-[#213885] text-white text-xs py-1 hover:bg-[#081849] transition-colors"
        >Apply</button>
        <button onClick={onClose} className="flex-1 border border-gray-300 text-xs py-1 hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );
}

// ── Role checkboxes (used in create modal) ────────────────────────────────────

function RoleCheckboxes({
  selected, onChange, canAssignDeveloper,
}: {
  selected: string[]; onChange: (roles: string[]) => void; canAssignDeveloper: boolean;
}) {
  const visibleRoles = canAssignDeveloper ? [DEV_ROLE, ...ALL_ROLES] : ALL_ROLES;
  function toggle(role: string) {
    onChange(selected.includes(role) ? selected.filter(r => r !== role) : [...selected, role]);
  }
  return (
    <div className="flex flex-wrap gap-3">
      {visibleRoles.map(({ value, label }) => (
        <label key={value} className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" className="accent-[#213885]" checked={selected.includes(value)} onChange={() => toggle(value)} />
          {label}
        </label>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminEmployeesPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  // Inline edits
  const [editCell, setEditCell]       = useState<EditCell>(null);
  const [editValue, setEditValue]     = useState('');
  const [patchingCell, setPatchingCell] = useState<EditCell>(null);
  const [savedCell, setSavedCell]     = useState<EditCell>(null);
  const [rolePopoverFor, setRolePopoverFor] = useState<number | null>(null);

  const iAmDeveloper = isDeveloper(user);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
    load(1);
  }, [user]);

  async function load(p: number, q?: string) {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: p, per_page: 20 };
      const q2 = q !== undefined ? q : search;
      if (q2) params.search = q2;
      const { data } = await api.get('/admin/employees', { params });
      const d: Paginated = data;
      setEmployees(d.data); setPage(d.current_page); setLastPage(d.last_page); setTotal(d.total);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  async function handleCreate(ev: React.FormEvent) {
    ev.preventDefault();
    if (form.roles.length === 0) { toast.error('Select at least one role'); return; }
    setSaving(true);
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

  // ── Inline text/select edits ─────────────────────────────────────────────

  function startEdit(id: number, field: string, currentValue: unknown) {
    setEditCell({ id, field });
    setEditValue(String(currentValue ?? ''));
  }
  function cancelEdit() { setEditCell(null); setEditValue(''); }

  async function patchEmployee(id: number, field: string, value: unknown) {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    setPatchingCell({ id, field });
    try {
      const { data } = await api.put(`/admin/employees/${id}`, { [field]: value });
      setEmployees(prev => prev.map(e => e.id === id ? data : e));
      setSavedCell({ id, field });
      setTimeout(() => setSavedCell(null), 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
      load(page);
    } finally { setPatchingCell(null); }
  }

  async function commitText(id: number, field: string, original: unknown) {
    cancelEdit();
    if (editValue === String(original ?? '')) return;
    await patchEmployee(id, field, editValue || null);
  }

  async function toggleActive(emp: Employee) {
    await patchEmployee(emp.id, 'is_active', !emp.is_active);
  }

  const isEditing  = (id: number, field: string) => editCell?.id === id && editCell?.field === field;
  const isPatching = (id: number, field: string) => patchingCell?.id === id && patchingCell?.field === field;
  const isSaved    = (id: number, field: string) => savedCell?.id === id && savedCell?.field === field;
  const set        = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Employees</h1>
          <p className="text-[#6b6b6b] mt-1">{total} staff accounts</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
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
                  {['Name', 'Email', 'Roles', 'Job Title', 'Status', ''].map(h => (
                    <th key={h} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(e => {
                  const empIsDev     = (e.roles ?? []).includes('developer');
                  const canEditRoles = !empIsDev || iAmDeveloper;
                  const canDelete    = e.id !== user.id && (!empIsDev || iAmDeveloper);

                  return (
                    <tr key={e.id} className="hover:bg-gray-50/60 group">
                      <td className="py-3 px-4 border-b border-gray-50 font-medium text-[#1a1a1a]">{e.name}</td>
                      <td className="py-3 px-4 border-b border-gray-50 text-[#6b6b6b]">{e.email}</td>

                      {/* ── Roles cell ── */}
                      <td className="py-3 px-4 border-b border-gray-50 min-w-[180px]">
                        <div className="relative">
                          {canEditRoles ? (
                            <button
                              type="button"
                              onClick={() => setRolePopoverFor(rolePopoverFor === e.id ? null : e.id)}
                              className="text-left"
                              title="Click to edit roles"
                            >
                              {isPatching(e.id, 'roles')
                                ? <span className="text-xs text-gray-400">Saving…</span>
                                : isSaved(e.id, 'roles')
                                  ? <span className="text-xs text-green-600 font-semibold">✓ Saved</span>
                                  : <RoleBadges roles={e.roles} />
                              }
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <RoleBadges roles={e.roles} />
                              <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                            </div>
                          )}
                          {rolePopoverFor === e.id && (
                            <RolePopover
                              currentRoles={e.roles ?? []}
                              canAssignDeveloper={iAmDeveloper}
                              onApply={async roles => {
                                setRolePopoverFor(null);
                                await patchEmployee(e.id, 'roles', roles);
                              }}
                              onClose={() => setRolePopoverFor(null)}
                            />
                          )}
                        </div>
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
                          disabled={isPatching(e.id, 'is_active') || (empIsDev && !iAmDeveloper)}
                          className={`text-xs px-2 py-0.5 transition-colors disabled:opacity-40 ${e.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                        >
                          {isPatching(e.id, 'is_active') ? '…' : isSaved(e.id, 'is_active') ? '✓ Saved' : (e.is_active ? 'Active' : 'Inactive')}
                        </button>
                      </td>

                      <td className="py-3 px-4 border-b border-gray-50">
                        {canDelete && (
                          <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                        )}
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

      {/* Create modal */}
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
                  <p className="text-xs text-gray-400 mt-1">A temporary password will be generated and emailed automatically.</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Roles * (select one or more)</label>
                  <RoleCheckboxes
                    selected={form.roles}
                    onChange={roles => set('roles', roles)}
                    canAssignDeveloper={iAmDeveloper}
                  />
                  {form.roles.length === 0 && <p className="text-xs text-red-500 mt-1">At least one role is required.</p>}
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
                <button type="submit" disabled={saving || form.roles.length === 0} className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors">
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
