'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { useAuthStore } from '@/store/authStore';
import {
  canManageProducts, canManageOrders, canManageEmployees,
  canManageCustomers, canManageCampaigns, canManageSocialPosts,
} from '@/lib/types';
import {
  LayoutDashboard, ShoppingBag, Tag, Package, Users,
  UserCircle, Mail, Newspaper, ChevronRight, Menu,
  LogOut, Image, FileText, Megaphone, Ticket, Truck, Settings, ShieldAlert,
  Store, ExternalLink, CreditCard, Share2, ClipboardList, Gift, CalendarDays, BookOpen, Hash, HardDrive, HelpCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname                        = usePathname();
  const { user, logout, _hasHydrated }  = useAuthStore();
  const [open, setOpen]                 = useState(false);
  const [openGroups, setOpenGroups]     = useState<Set<string>>(new Set());

  const handleLogout = () => { logout(); window.location.href = '/'; };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { window.location.href = '/login'; return; }
    if (user.must_change_password && pathname !== '/admin/change-password') {
      window.location.href = '/admin/change-password'; return;
    }
    if (user.type === 'employee' && user.two_factor_setup_required && pathname !== '/2fa/setup') {
      window.location.href = '/2fa/setup';
    }
  }, [_hasHydrated, user, pathname]);

  // Auto-open the group that contains the currently active route
  useEffect(() => {
    if (!user) return;
    const groupPaths: Record<string, string[]> = {
      Catalog:        ['/admin/products', '/admin/categories'],
      Content:        ['/admin/slides', '/admin/pages', '/admin/popups', '/admin/events', '/admin/blog', '/admin/tags'],
      Sales:          ['/admin/orders', '/admin/customers', '/admin/discount-codes', '/admin/shipping', '/admin/gift-cards'],
      Marketing:      ['/admin/campaigns', '/admin/newsletter-subscribers', '/admin/social-posts'],
      Administration: ['/admin/employees', '/admin/settings', '/admin/payment-settings', '/admin/storage'],
    };
    const active = Object.keys(groupPaths).find(g => groupPaths[g].some(p => pathname.startsWith(p)));
    if (active) setOpenGroups(new Set([active]));
  }, [pathname, user]);

  if (!_hasHydrated) return null;
  if (!user) return null;
  if (user.must_change_password && pathname !== '/admin/change-password') return null;

  if (user.type === 'employee' && user.two_factor_setup_required) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white border border-[#cccacc] max-w-sm">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">2FA Setup Required</h2>
          <p className="text-sm text-[#6b6b6b] mb-4">Two-factor authentication is mandatory for staff accounts. Redirecting you to setup…</p>
          <Link href="/2fa/setup" className="text-sm text-[#213885] hover:underline">Go to 2FA Setup →</Link>
        </div>
      </div>
    );
  }

  type NavItem = { href: string; icon: React.ElementType; label: string };
  type NavGroup = { title: string; items: NavItem[] };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Catalog',
      items: [
        canManageProducts(user) && { href: '/admin/products',    icon: ShoppingBag, label: 'Products' },
        canManageProducts(user) && { href: '/admin/categories',  icon: Tag,         label: 'Categories' },
      ].filter(Boolean) as NavItem[],
    },
    {
      title: 'Content',
      items: [
        canManageProducts(user) && { href: '/admin/slides',  icon: Image,        label: 'Hero Slides' },
        canManageProducts(user) && { href: '/admin/pages',   icon: FileText,     label: 'Pages' },
        canManageProducts(user) && { href: '/admin/popups',  icon: Megaphone,    label: 'Popups' },
        canManageProducts(user) && { href: '/admin/events',  icon: CalendarDays, label: 'Events' },
        canManageProducts(user) && { href: '/admin/blog',    icon: BookOpen,     label: 'Blog' },
        canManageProducts(user) && { href: '/admin/tags',    icon: Hash,         label: 'Tags' },
      ].filter(Boolean) as NavItem[],
    },
    {
      title: 'Sales',
      items: [
        canManageOrders(user)    && { href: '/admin/orders',         icon: Package,    label: 'Orders' },
        canManageCustomers(user) && { href: '/admin/customers',      icon: UserCircle, label: 'Customers' },
        canManageProducts(user)  && { href: '/admin/discount-codes', icon: Ticket,     label: 'Discount Codes' },
        canManageProducts(user)  && { href: '/admin/shipping',       icon: Truck,      label: 'Shipping' },
        canManageOrders(user)    && { href: '/admin/gift-cards',     icon: Gift,       label: 'Gift Cards' },
      ].filter(Boolean) as NavItem[],
    },
    {
      title: 'Marketing',
      items: [
        canManageCampaigns(user)   && { href: '/admin/campaigns',              icon: Mail,      label: 'Email Campaigns' },
        canManageCampaigns(user)   && { href: '/admin/newsletter-subscribers', icon: Newspaper, label: 'Subscribers' },
        canManageSocialPosts(user) && { href: '/admin/social-posts',           icon: Share2,    label: 'Social Posts' },
      ].filter(Boolean) as NavItem[],
    },
    {
      title: 'Administration',
      items: [
        canManageEmployees(user) && { href: '/admin/employees',        icon: Users,      label: 'Employees' },
        canManageEmployees(user) && { href: '/admin/settings',         icon: Settings,   label: 'Site Settings' },
        canManageEmployees(user) && { href: '/admin/payment-settings', icon: CreditCard, label: 'Payment Methods' },
        canManageProducts(user)  && { href: '/admin/storage',          icon: HardDrive,  label: 'Storage Cleanup' },
      ].filter(Boolean) as NavItem[],
    },
  ].filter(g => g.items.length > 0);

  const NavLink = ({ href, icon: Icon, label }: NavItem) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors group
        ${isActive(href)
          ? 'bg-[#213885] text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${isActive(href) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
      <span className="truncate">{label}</span>
      {isActive(href) && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
    </Link>
  );

  const SidebarNav = () => (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className="px-4 py-4 border-b border-gray-200 shrink-0">
        <Link href="/admin" onClick={() => setOpen(false)}>
          <Logo size="lg" />
        </Link>
        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {/* Dashboard + Tasks — always visible */}
        <NavLink href="/admin"       icon={LayoutDashboard} label="Dashboard" />
        <NavLink href="/admin/tasks" icon={ClipboardList}   label="Tasks" />
        <NavLink href="/admin/help"  icon={HelpCircle}      label="Help Centre" />

        {/* Divider */}
        <div className="pt-2 pb-1">
          <div className="border-t border-gray-100" />
        </div>

        {/* Collapsible groups */}
        {navGroups.map(group => (
          <div key={group.title}>
            <button
              onClick={() => toggleGroup(group.title)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors
                ${openGroups.has(group.title)
                  ? 'text-[#213885] bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              <span>{group.title}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${openGroups.has(group.title) ? 'rotate-90' : ''}`}
              />
            </button>
            {openGroups.has(group.title) && (
              <div className="mt-0.5 mb-1 space-y-0.5">
                {group.items.map(item => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User badge */}
      <div className="px-4 py-3 border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#e8e3f0] flex items-center justify-center shrink-0">
            <span className="text-[#213885] font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.role_label}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar — full width, always visible ───────────────────────── */}
      <header className="fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center px-4 gap-3">

        {/* Mobile: hamburger */}
        <button onClick={() => setOpen(true)} className="md:hidden text-gray-500 hover:text-gray-800 shrink-0">
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile: logo */}
        <div className="md:hidden shrink-0">
          <Logo size="lg" />
        </div>

        {/* Desktop: spacer that aligns with sidebar width */}
        <div className="hidden md:block w-56 shrink-0" />

        {/* Centre label */}
        <span className="hidden md:block text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Admin Panel
        </span>

        <div className="flex-1" />

        {/* Right-side actions */}
        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-[#213885] hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Store className="w-4 h-4" />
          <span>Visit Store</span>
          <ExternalLink className="w-3 h-3 opacity-50" />
        </Link>

        <Link
          href="/orders"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-[#213885] hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Package className="w-4 h-4" />
          <span>My Orders</span>
        </Link>

        <Link
          href="/admin/help"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-[#213885] hover:bg-gray-50 rounded-lg transition-colors"
          title="Help Centre"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Help</span>
        </Link>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-gray-200" />

        {/* User name */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#e8e3f0] flex items-center justify-center">
            <span className="text-[#213885] font-bold text-xs">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">{user.name}</span>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </header>

      {/* ── Desktop sidebar — sits below the top bar ───────────────────── */}
      <aside className="hidden md:flex flex-col w-56 fixed top-14 left-0 bottom-0 bg-white border-r border-gray-200 z-30">
        <SidebarNav />
      </aside>

      {/* ── Mobile drawer overlay ───────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-white border-r border-gray-200">
            <SidebarNav />
          </aside>
        </div>
      )}

      {/* ── Main content — offset for top bar + sidebar ─────────────────── */}
      <div className="pt-14 md:ml-56 min-w-0">
        <main className="min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
