'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  isStaff, canManageProducts, canManageOrders,
  canManageEmployees, canManageCustomers, canManageCampaigns, canManageSocialPosts,
} from '@/lib/types';
import {
  Package, ShoppingBag, DollarSign, Clock, Users, UserCircle,
  Mail, Newspaper, Tag, Image, Wrench, ToggleLeft, ToggleRight,
  Share2, Ticket, CheckCircle, Circle, AlertTriangle, ClipboardList,
  TrendingUp, TrendingDown, Truck, Settings, Gift, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const DashboardCharts = dynamic(() => import('@/components/admin/DashboardCharts'), { ssr: false });

interface OrderStats   { total_orders: number; total_revenue: number; awaiting_payment_orders: number; paid_orders: number }
interface ExtStats     { newsletter_subscribers: number | null; social_posts_published: number | null; discount_codes: number | null }
type TaskStatus        = 'open' | 'in_progress' | 'done';
interface DashTask     { id: number; title: string; description: string | null; priority: string; status: TaskStatus; category: string; due_date: string | null }
interface TaskStats    { open: number; urgent: number; overdue: number }
interface Kpi          { revenue_this_month: number; revenue_last_month: number; orders_this_month: number; new_customers_month: number }

const PRI_DOT:   Record<string, string> = { low: 'bg-gray-300', medium: 'bg-blue-400', high: 'bg-orange-400', urgent: 'bg-red-500' };
const PRI_COLOR: Record<string, string> = { low: 'text-gray-400', medium: 'text-blue-500', high: 'text-orange-500', urgent: 'text-red-500' };

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [orderStats,  setOrderStats]  = useState<OrderStats | null>(null);
  const [extStats,    setExtStats]    = useState<ExtStats>({ newsletter_subscribers: null, social_posts_published: null, discount_codes: null });
  const [tasks,        setTasks]        = useState<DashTask[]>([]);
  const [taskStats,    setTaskStats]    = useState<TaskStats | null>(null);
  const [maintenance,  setMaintenance]  = useState<boolean | null>(null);
  const [toggling,     setToggling]     = useState(false);
  const [kpi,          setKpi]          = useState<Kpi | null>(null);
  const [selectedTask, setSelectedTask] = useState<DashTask | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!isStaff(user)) { router.push('/'); return; }

    const calls: Promise<void>[] = [
      api.get('/maintenance').then(r => setMaintenance(r.data.enabled)).catch(() => {}),
      api.get('/admin/tasks').then(r => setTasks((r.data as DashTask[]).filter(t => t.status !== 'done'))).catch(() => {}),
      api.get('/admin/tasks/stats').then(r => setTaskStats(r.data)).catch(() => {}),
    ];

    if (canManageOrders(user)) {
      calls.push(
        api.get('/admin/orders/stats').then(r => setOrderStats(r.data)).catch(() => {}),
        api.get('/admin/analytics').then(r => setKpi(r.data.kpi)).catch(() => {}),
      );
    }
    if (canManageCampaigns(user)) {
      calls.push(
        api.get('/admin/newsletter-subscribers')
          .then(r => setExtStats(s => ({ ...s, newsletter_subscribers: Array.isArray(r.data) ? r.data.length : 0 })))
          .catch(() => {}),
      );
    }
    if (canManageSocialPosts(user)) {
      calls.push(
        api.get('/admin/social-posts', { params: { status: 'published', per_page: 1 } })
          .then(r => setExtStats(s => ({ ...s, social_posts_published: r.data.total ?? 0 })))
          .catch(() => {}),
      );
    }
    if (canManageProducts(user)) {
      calls.push(
        api.get('/admin/discount-codes', { params: { per_page: 1 } })
          .then(r => setExtStats(s => ({ ...s, discount_codes: r.data.total ?? r.data.meta?.total ?? 0 })))
          .catch(() => {}),
      );
    }

    Promise.all(calls);
  }, [user]);

  async function cycleTaskStatus(t: DashTask) {
    const next: TaskStatus = t.status === 'open' ? 'in_progress' : 'done';
    try {
      await api.put(`/admin/tasks/${t.id}`, { status: next });
      if (next === 'done') {
        setTasks(ts => ts.filter(x => x.id !== t.id));
      } else {
        setTasks(ts => ts.map(x => x.id === t.id ? { ...x, status: next } : x));
      }
    } catch { toast.error('Could not update task'); }
  }

  async function toggleMaintenance() {
    if (maintenance === null) return;
    setToggling(true);
    const next = !maintenance;
    try {
      await api.put('/admin/site-settings', { settings: [{ key: 'maintenance_enabled', value: next ? 'true' : 'false' }] });
      setMaintenance(next);
      toast.success(next ? 'Maintenance mode ON — store hidden.' : 'Maintenance mode OFF — store live.');
    } catch { toast.error('Failed to update.'); }
    finally { setToggling(false); }
  }

  if (!user || !isStaff(user)) return null;

  /* ── Stat cards ── */
  const statCards = [
    canManageOrders(user) && orderStats && {
      icon: DollarSign, color: 'bg-green-50 text-green-600',
      label: 'Total Revenue',
      value: '$' + parseFloat(String(orderStats.total_revenue)).toLocaleString('en-CA', { maximumFractionDigits: 0 }),
      sub: kpi ? (
        kpi.revenue_last_month > 0
          ? { pct: ((kpi.revenue_this_month - kpi.revenue_last_month) / kpi.revenue_last_month * 100).toFixed(0), up: kpi.revenue_this_month >= kpi.revenue_last_month }
          : null
      ) : null,
    },
    canManageOrders(user) && orderStats && {
      icon: Package, color: 'bg-blue-50 text-blue-600',
      label: 'Total Orders', value: orderStats.total_orders, sub: null,
    },
    canManageOrders(user) && orderStats && {
      icon: CheckCircle, color: 'bg-purple-50 text-purple-600',
      label: 'Paid Orders', value: orderStats.paid_orders, sub: null,
    },
    canManageOrders(user) && orderStats && {
      icon: Clock, color: 'bg-orange-50 text-orange-600',
      label: 'Awaiting Payment', value: orderStats.awaiting_payment_orders ?? 0, sub: null,
    },
    canManageOrders(user) && kpi && {
      icon: Users, color: 'bg-teal-50 text-teal-600',
      label: 'New Customers', value: kpi.new_customers_month, sub: null,
    },
    canManageCampaigns(user) && extStats.newsletter_subscribers !== null && {
      icon: Newspaper, color: 'bg-rose-50 text-rose-600',
      label: 'Subscribers', value: extStats.newsletter_subscribers, sub: null,
    },
    canManageSocialPosts(user) && extStats.social_posts_published !== null && {
      icon: Share2, color: 'bg-sky-50 text-sky-600',
      label: 'Posts Published', value: extStats.social_posts_published, sub: null,
    },
    canManageProducts(user) && extStats.discount_codes !== null && {
      icon: Ticket, color: 'bg-amber-50 text-amber-600',
      label: 'Promo Codes', value: extStats.discount_codes, sub: null,
    },
  ].filter(Boolean) as {
    icon: React.ElementType; color: string; label: string;
    value: number | string;
    sub: { pct: string; up: boolean } | null;
  }[];

  /* ── Quick links ── */
  const quickLinks = [
    canManageProducts(user) && { href: '/admin/products',    icon: ShoppingBag, color: 'bg-purple-50 text-purple-600', title: 'Products',       desc: 'Add, edit, remove products' },
    canManageProducts(user) && { href: '/admin/categories',  icon: Tag,         color: 'bg-indigo-50 text-indigo-600', title: 'Categories',      desc: 'Manage categories' },
    canManageProducts(user) && { href: '/admin/slides',      icon: Image,       color: 'bg-rose-50 text-rose-600',    title: 'Hero Slides',     desc: 'Homepage slideshow' },
    canManageOrders(user)   && { href: '/admin/orders',      icon: Package,     color: 'bg-green-50 text-green-600',  title: 'Orders',          desc: 'View & update orders' },
    canManageEmployees(user)&& { href: '/admin/employees',   icon: Users,       color: 'bg-blue-50 text-blue-600',    title: 'Employees',       desc: 'Staff accounts & roles' },
    canManageCustomers(user)&& { href: '/admin/customers',   icon: UserCircle,  color: 'bg-orange-50 text-orange-600',title: 'Customers',       desc: 'Customer profiles' },
    canManageProducts(user) && { href: '/admin/discount-codes',icon: Ticket,    color: 'bg-amber-50 text-amber-600',  title: 'Discount Codes',  desc: 'Promo & discount codes' },
    canManageOrders(user)   && { href: '/admin/gift-cards',   icon: Gift,       color: 'bg-pink-50 text-pink-600',    title: 'Gift Cards',       desc: 'Digital gift cards' },
    canManageProducts(user) && { href: '/admin/shipping',    icon: Truck,       color: 'bg-cyan-50 text-cyan-600',    title: 'Shipping',        desc: 'Zones & rates' },
    canManageCampaigns(user)&& { href: '/admin/campaigns',   icon: Mail,        color: 'bg-teal-50 text-teal-600',    title: 'Campaigns',       desc: 'Email campaigns' },
    canManageCampaigns(user)&& { href: '/admin/newsletter-subscribers', icon: Newspaper, color: 'bg-rose-50 text-rose-600', title: 'Newsletter', desc: 'Subscribers list' },
    canManageSocialPosts(user) && { href: '/admin/social-posts', icon: Share2,  color: 'bg-sky-50 text-sky-600',      title: 'Social Posts',    desc: 'Facebook, Instagram & X' },
    canManageEmployees(user)&& { href: '/admin/settings',    icon: Settings,    color: 'bg-gray-50 text-gray-600',    title: 'Site Settings',   desc: 'Store configuration' },
  ].filter(Boolean) as { href: string; icon: React.ElementType; color: string; title: string; desc: string }[];

  const showCharts = canManageOrders(user);

  return (
    <>
    <div className="max-w-full p-4 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Dashboard</h1>
          <p className="text-sm text-[#6b6b6b] mt-0.5">
            Welcome back, <span className="font-semibold text-[#213885]">{user.name}</span>
            <span className="ml-2 text-xs bg-[#e8e3f0] text-[#6b6b6b] px-2 py-0.5 rounded-full">
              {user.role_label ?? user.role}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageEmployees(user) && maintenance !== null && (
            <button onClick={toggleMaintenance} disabled={toggling}
              className={`flex items-center gap-2 px-3 py-2 border text-sm font-medium transition-colors disabled:opacity-50 ${
                maintenance
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                  : 'bg-white border-[#cccacc] text-[#6b6b6b] hover:border-[#213885] hover:text-[#213885]'
              }`}>
              <Wrench className="w-4 h-4" />
              {maintenance
                ? <><span>Maintenance: <strong>ON</strong></span><ToggleRight className="w-5 h-5 text-amber-600" /></>
                : <><span>Maintenance: <strong>OFF</strong></span><ToggleLeft className="w-5 h-5" /></>}
            </button>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {statCards.map(({ icon: Icon, color, label, value, sub }) => (
            <div key={label} className="bg-white border border-[#cccacc] p-4">
              <div className={`inline-flex p-1.5 mb-2 ${color}`}><Icon className="w-5 h-5" /></div>
              <p className="text-xs text-[#6b6b6b] leading-tight">{label}</p>
              <p className="text-xl font-bold text-[#1a1a1a] mt-0.5 leading-tight">{value}</p>
              {sub && (
                <span className={`text-[10px] flex items-center gap-0.5 font-medium mt-0.5 ${sub.up ? 'text-green-600' : 'text-red-500'}`}>
                  {sub.up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Math.abs(Number(sub.pct))}% vs last mo
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Charts row (horizontal) ── */}
      {showCharts && <DashboardCharts />}

      {/* ── Bottom: Quick links (3 cols) + Task board (1 col) ── */}
      <div className="grid grid-cols-4 gap-4">

        {/* Quick links — 3 left columns */}
        <div className="col-span-3">
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map(({ href, icon: Icon, color, title, desc }) => (
              <Link key={href} href={href}
                className="bg-white border border-[#cccacc] p-4 flex items-center gap-3 hover:shadow-md hover:border-[#213885] transition-all group">
                <div className={`p-2.5 ${color} shrink-0`}><Icon className="w-5 h-5" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a] group-hover:text-[#213885] truncate">{title}</p>
                  <p className="text-xs text-[#6b6b6b] truncate">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Task board — 1 right column */}
        <div className="col-span-1 bg-white border border-[#cccacc] flex flex-col" style={{ maxHeight: 380 }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ClipboardList className="w-3.5 h-3.5 text-[#213885] shrink-0" />
              <span className="text-xs font-semibold text-gray-800">Task Board</span>
              {taskStats && (
                <div className="flex gap-1 flex-wrap">
                  {taskStats.open   > 0 && <span className="text-[10px] bg-blue-50   text-blue-600  px-1.5 py-0.5 rounded-full font-semibold">{taskStats.open} open</span>}
                  {taskStats.urgent > 0 && <span className="text-[10px] bg-red-50    text-red-600   px-1.5 py-0.5 rounded-full font-semibold">{taskStats.urgent} urgent</span>}
                  {taskStats.overdue> 0 && <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">{taskStats.overdue} overdue</span>}
                </div>
              )}
            </div>
            <Link href="/admin/tasks" className="text-[10px] text-[#213885] hover:underline font-medium shrink-0">View all →</Link>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {tasks.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                {taskStats ? 'All caught up!' : 'Loading tasks…'}
              </p>
            ) : tasks.map(t => {
              const overdue = t.due_date && new Date(t.due_date) < new Date();
              return (
                <div key={t.id}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTask(t)}>
                  <button onClick={e => { e.stopPropagation(); cycleTaskStatus(t); }}
                    title={t.status === 'open' ? 'Mark in progress' : 'Mark done'}
                    className="shrink-0 hover:scale-110 transition-transform">
                    {t.status === 'in_progress'
                      ? <Clock  className="w-3.5 h-3.5 text-blue-400" />
                      : <Circle className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500" />}
                  </button>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRI_DOT[t.priority] ?? 'bg-gray-300'}`} />
                  <p className="flex-1 text-xs text-gray-800 truncate">{t.title}</p>
                  <span className={`text-[10px] font-semibold shrink-0 ${PRI_COLOR[t.priority] ?? 'text-gray-400'}`}>{t.priority}</span>
                  {t.due_date && (
                    <span className={`text-[10px] shrink-0 flex items-center gap-0.5 ${overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                      {overdue && <AlertTriangle className="w-3 h-3" />}
                      {new Date(t.due_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>

    {/* ── Task detail popup ─────────────────────────────────────────────── */}
    {selectedTask && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        onClick={() => setSelectedTask(null)}>
        <div className="bg-white w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 leading-snug">{selectedTask.title}</h2>
            <button onClick={() => setSelectedTask(null)} className="shrink-0 text-gray-400 hover:text-gray-700 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-gray-100">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              selectedTask.status === 'done'        ? 'bg-green-100 text-green-700' :
              selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-700'  :
                                                      'bg-gray-100 text-gray-600'
            }`}>
              {selectedTask.status === 'in_progress' ? 'In Progress' : selectedTask.status === 'done' ? 'Done' : 'Open'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              selectedTask.priority === 'urgent' ? 'bg-red-100 text-red-700'    :
              selectedTask.priority === 'high'   ? 'bg-orange-100 text-orange-700' :
              selectedTask.priority === 'medium' ? 'bg-blue-100 text-blue-700'  :
                                                   'bg-gray-100 text-gray-500'
            }`}>{selectedTask.priority}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
              {selectedTask.category}
            </span>
            {selectedTask.due_date && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                new Date(selectedTask.due_date) < new Date() && selectedTask.status !== 'done'
                  ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
              }`}>
                Due {new Date(selectedTask.due_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="px-6 py-4 min-h-[80px]">
            {selectedTask.description
              ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
              : <p className="text-sm text-gray-400 italic">No description provided.</p>}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
            <button onClick={() => { cycleTaskStatus(selectedTask); setSelectedTask(null); }}
              className="text-xs text-[#213885] hover:underline font-medium">
              {selectedTask.status === 'open' ? 'Mark in progress →' : 'Mark done →'}
            </button>
            <Link href="/admin/tasks" className="text-xs text-gray-500 hover:text-[#213885] hover:underline">
              Open Task Board →
            </Link>
          </div>

        </div>
      </div>
    )}
    </>
  );
}
