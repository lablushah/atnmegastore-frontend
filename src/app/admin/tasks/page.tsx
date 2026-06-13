'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { isStaff, canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, CheckCircle, Circle, Clock, AlertTriangle,
  ChevronDown, X, Pencil, Loader, Users,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status   = 'open' | 'in_progress' | 'done';
type Category = 'general' | 'feature' | 'bug' | 'marketing' | 'sales';

interface Employee { id: number; name: string }

interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  category: Category;
  created_by: number | null;
  due_date: string | null;
  completed_at: string | null;
  creator?: Employee | null;
  assignees?: Employee[];
  created_at: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const PRIORITY_META: Record<Priority, { label: string; dot: string; badge: string }> = {
  low:    { label: 'Low',    dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  high:   { label: 'High',   dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
};

const STATUS_META: Record<Status, { label: string; icon: React.ElementType; cls: string }> = {
  open:        { label: 'Open',        icon: Circle,      cls: 'text-gray-400' },
  in_progress: { label: 'In Progress', icon: Clock,       cls: 'text-blue-500' },
  done:        { label: 'Done',        icon: CheckCircle, cls: 'text-green-500' },
};

const CATEGORY_LABELS: Record<Category, string> = {
  general: 'General', feature: 'Feature Request', bug: 'Bug', marketing: 'Marketing', sales: 'Sales',
};

const EMPTY_FORM = {
  title: '', description: '', priority: 'medium' as Priority,
  category: 'general' as Category, assigned_to: [] as number[], due_date: '',
};

// ── Assignee picker (multi-checkbox dropdown) ─────────────────────────────────

function AssigneePicker({
  employees, selected, onChange,
}: { employees: Employee[]; selected: number[]; onChange: (ids: number[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  const label = selected.length === 0
    ? '— Unassigned —'
    : selected.length === 1
      ? employees.find(e => e.id === selected[0])?.name ?? '1 person'
      : `${selected.length} people`;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full text-left border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] flex items-center justify-between">
        <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-800'}>{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 shadow-lg mt-0.5 max-h-48 overflow-y-auto">
          {employees.map(e => (
            <label key={e.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
              <input type="checkbox" className="accent-[#213885]" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} />
              {e.name}
            </label>
          ))}
          {employees.length === 0 && <p className="text-xs text-gray-400 px-3 py-2">No employees available</p>}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [tasks, setTasks]         = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<'all' | 'mine' | 'open' | 'urgent' | 'done'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Task | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!isStaff(user)) { router.push('/'); return; }
    load();
    // Load employees for assignee picker — all staff can assign tasks
    api.get('/admin/employees').then(r => setEmployees(r.data.data ?? r.data)).catch(() => {});
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/tasks');
      setTasks(data);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, assigned_to: user ? [user.id] : [] });
    setShowModal(true);
  }

  function openEdit(t: Task) {
    setEditing(t);
    setForm({
      title: t.title, description: t.description ?? '', priority: t.priority,
      category: t.category, due_date: t.due_date ?? '',
      assigned_to: (t.assignees ?? []).map(a => a.id),
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        title:       form.title,
        description: form.description || null,
        priority:    form.priority,
        category:    form.category,
        due_date:    form.due_date || null,
        assigned_to: form.assigned_to,
      };
      if (editing) {
        const { data } = await api.put(`/admin/tasks/${editing.id}`, payload);
        setTasks(ts => ts.map(t => t.id === editing.id ? data : t));
        toast.success('Task updated');
      } else {
        const { data } = await api.post('/admin/tasks', payload);
        setTasks(ts => [data, ...ts]);
        toast.success('Task created');
      }
      setShowModal(false);
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleStatus(task: Task, status: Status) {
    try {
      const { data } = await api.put(`/admin/tasks/${task.id}`, { status });
      setTasks(ts => ts.map(t => t.id === task.id ? data : t));
    } catch { toast.error('Failed to update status'); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/admin/tasks/${id}`); setTasks(ts => ts.filter(t => t.id !== id)); toast.success('Deleted'); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Delete failed'); }
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  const isAssignedToMe = (t: Task) => (t.assignees ?? []).some(a => a.id === user?.id);

  const filtered = tasks.filter(t => {
    if (filter === 'mine')   return isAssignedToMe(t);
    if (filter === 'open')   return t.status === 'open';
    if (filter === 'urgent') return t.priority === 'urgent' && t.status !== 'done';
    if (filter === 'done')   return t.status === 'done';
    return true;
  });

  const counts = {
    all:    tasks.length,
    mine:   tasks.filter(isAssignedToMe).length,
    open:   tasks.filter(t => t.status === 'open').length,
    urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
    done:   tasks.filter(t => t.status === 'done').length,
  };

  const isOverdue = (t: Task) => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Task Board</h1>
          <p className="text-[#6b6b6b] mt-1 text-sm">{counts.open} open · {tasks.filter(t => t.status === 'in_progress').length} in progress · {counts.done} done</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 flex-wrap">
        {([['all','All'],['open','Open'],['mine','Assigned to Me'],['urgent','Urgent'],['done','Done']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex-1 justify-center sm:flex-initial ${filter === id ? 'bg-white text-[#213885] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === id ? 'bg-[#f0e0e6] text-[#213885]' : 'bg-gray-200 text-gray-500'}`}>{counts[id]}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-10 justify-center"><Loader className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No tasks here. {filter !== 'all' && <button onClick={() => setFilter('all')} className="underline">View all</button>}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const pm  = PRIORITY_META[task.priority]  ?? PRIORITY_META.medium;
            const sm  = STATUS_META[task.status]       ?? STATUS_META.open;
            const StatusIcon = sm.icon;
            const expanded = expandedId === task.id;
            const overdue  = isOverdue(task);
            const assignees = task.assignees ?? [];

            return (
              <div key={task.id} className={`bg-white border transition-colors ${task.status === 'done' ? 'border-gray-100 opacity-60' : overdue ? 'border-red-200' : 'border-[#cccacc] hover:border-[#c09080]'}`}>
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Status cycle */}
                  <button title={`Status: ${sm.label} — click to advance`}
                    onClick={() => handleStatus(task, task.status === 'open' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'open')}
                    className={`shrink-0 ${sm.cls} hover:scale-110 transition-transform`}>
                    <StatusIcon className="w-5 h-5" />
                  </button>

                  {/* Priority dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${pm.dot}`} title={pm.label} />

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${pm.badge}`}>{pm.label}</span>
                      <span className="text-[10px] text-gray-400">{CATEGORY_LABELS[task.category]}</span>
                      {assignees.length > 0 && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          {assignees.length === 1 ? assignees[0].name : `${assignees.map(a => a.name).join(', ')}`}
                        </span>
                      )}
                      {task.creator && <span className="text-[10px] text-gray-400">by {task.creator.name}</span>}
                      {task.due_date && (
                        <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                          {overdue && <AlertTriangle className="w-2.5 h-2.5" />}
                          {overdue ? 'Overdue · ' : ''}{new Date(task.due_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {task.description && (
                      <button onClick={() => setExpandedId(expanded ? null : task.id)}
                        className={`p-1.5 text-gray-400 hover:text-gray-700 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {task.status !== 'done' && (
                      <button onClick={() => openEdit(task)} className="p-1.5 text-gray-400 hover:text-[#213885]"><Pencil className="w-3.5 h-3.5" /></button>
                    )}
                    <button onClick={() => handleDelete(task.id)} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {/* Expanded description */}
                {expanded && task.description && (
                  <div className="px-4 pb-3 pt-0 border-t border-gray-50">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed pl-8">{task.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-lg shadow-2xl z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="What needs to be done?"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Add details, context, or links…"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] resize-y" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]">
                    <option value="general">General</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Assign To</label>
                  <AssigneePicker
                    employees={employees}
                    selected={form.assigned_to}
                    onChange={ids => setForm(f => ({ ...f, assigned_to: ids }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving}
                className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-5 py-2 text-sm font-medium transition-colors flex items-center gap-2">
                {saving && <Loader className="w-3.5 h-3.5 animate-spin" />}
                {editing ? 'Save Changes' : 'Create Task'}
              </button>
              <button onClick={() => setShowModal(false)} className="border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
