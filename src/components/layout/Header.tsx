'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Menu, X, ChevronDown, Package, LayoutDashboard, LogOut, CircleUserRound, Users, UserCircle, Mail, Newspaper, Tag, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/navigation';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { canManageProducts, canManageOrders, canManageEmployees, canManageCustomers, canManageCampaigns, isStaff } from '@/lib/types';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';

export default function Header() {
  const t      = useTranslations();
  const router = useRouter();
  const [search, setSearch]             = useState('');
  const [mounted, setMounted]           = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const count    = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { user, logout } = useAuthStore();
  const settings = useSiteSettingsStore((s) => s.settings);
  const { ids: wishlistIds, load: loadWishlist, clear: clearWishlist } = useWishlistStore();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (user && !isStaff(user)) loadWishlist();
    else clearWishlist();
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMobileOpen(false);
    }
  };

  const handleLogout = () => { setDropdownOpen(false); logout(); };

  const CATEGORIES = [
    { label: t('nav.books'),        href: '/products?category=books' },
    { label: t('nav.gifts'),        href: '/products?category=gifts' },
    { label: t('nav.bestsellers'),  href: '/products?sort=name&dir=asc&featured=true' },
    { label: t('nav.new_arrivals'), href: '/products?sort=created_at&dir=desc' },
    { label: t('nav.sale'),         href: '/products?max_price=12' },
    { label: t('nav.gift_cards'),   href: '/gift-cards' },
    { label: t('nav.events'),       href: '/events' },
    { label: t('nav.blog'),         href: '/blog' },
  ];

  return (
    <header className="sticky top-0 z-50">

      {/* ── Top utility bar ── */}
      <div className="bg-gray-900 text-gray-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          <span className="hidden sm:block tracking-wide">{t('nav.store_info')}</span>
          <div className="flex items-center gap-5 ml-auto">
            <Link href="/events"        className="hover:text-white transition-colors">{t('nav.events_plain')}</Link>
            <Link href="/blog"          className="hover:text-white transition-colors">{t('nav.blog_plain')}</Link>
            <Link href="/gift-cards"    className="hover:text-white transition-colors">{t('nav.gift_cards_plain')}</Link>
            <Link href="/orders/lookup" className="hover:text-white transition-colors hidden sm:block">{t('nav.track_order')}</Link>
            <Link href="/contact"       className="hover:text-white transition-colors hidden md:block">{t('nav.contact_us')}</Link>
            <div className="border-l border-gray-700 pl-4 ml-1">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main header ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-20">

            <Link href="/" className="shrink-0 flex items-center py-1">
              {settings.logo_url
                ? <img src={settings.logo_url} alt={settings.site_name} className="h-16 sm:h-20 w-auto object-contain" />
                : <Logo size="sm" />}
            </Link>

            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto hidden sm:flex">
              <div className="flex w-full rounded-full overflow-hidden border border-gray-300 focus-within:border-gray-500 transition-colors">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('header.search_placeholder')}
                  className="flex-1 px-5 py-2.5 bg-gray-50 text-gray-800 text-sm placeholder-gray-400 focus:outline-none"
                />
                <button type="submit" className="bg-gray-800 hover:bg-gray-700 px-5 flex items-center justify-center transition-colors">
                  <Search className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>

            <div className="flex items-center gap-4 ml-auto sm:ml-0">

              {/* Wishlist */}
              {mounted && user && !isStaff(user) && (
                <Link href="/wishlist" className="relative flex flex-col items-center group">
                  <Heart className={`w-5 h-5 transition-colors ${wishlistIds.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-gray-600 group-hover:text-rose-500'}`} />
                  {wishlistIds.length > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {wishlistIds.length > 9 ? '9+' : wishlistIds.length}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500 group-hover:text-rose-500 hidden sm:block mt-0.5">{t('header.saved')}</span>
                </Link>
              )}

              {/* Cart */}
              <Link href="/cart" className="relative flex flex-col items-center group">
                <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                {mounted && count > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {count}
                  </span>
                )}
                <span className="text-[10px] text-gray-500 group-hover:text-gray-800 hidden sm:block mt-0.5">{t('header.cart')}</span>
              </Link>

              {/* User */}
              {!mounted ? (
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen((v) => !v)} className="flex flex-col items-center group">
                    <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 group-hover:text-gray-800 hidden sm:flex items-center gap-0.5 mt-0.5">
                      {user.name.split(' ')[0]}
                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/account" onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{t('header.my_account')}</Link>
                        <Link href="/orders" onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{t('header.my_orders')}</Link>
                        {!isStaff(user) && (
                          <Link href="/wishlist" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <Heart className="w-3.5 h-3.5 text-rose-400" /> {t('header.my_wishlist')}
                            {wishlistIds.length > 0 && <span className="ml-auto text-xs bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">{wishlistIds.length}</span>}
                          </Link>
                        )}
                        {isStaff(user) && (
                          <>
                            <div className="border-t border-gray-200 my-1" />
                            {/* Admin links: plain <a> to avoid locale prefix from @/navigation Link */}
                            <a href="/admin" onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 font-medium hover:bg-gray-50">
                              <LayoutDashboard className="w-3.5 h-3.5" /> {t('header.dashboard')}
                            </a>
                            {canManageProducts(user) && (
                              <a href="/admin/products" onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Package className="w-3.5 h-3.5" /> {t('header.products')}
                              </a>
                            )}
                            {canManageProducts(user) && (
                              <a href="/admin/categories" onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Tag className="w-3.5 h-3.5" /> {t('header.categories')}
                              </a>
                            )}
                            {canManageOrders(user) && (
                              <a href="/admin/orders" onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Package className="w-3.5 h-3.5" /> {t('header.orders')}
                              </a>
                            )}
                            {canManageEmployees(user) && (
                              <a href="/admin/employees" onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Users className="w-3.5 h-3.5" /> {t('header.employees')}
                              </a>
                            )}
                            {canManageCustomers(user) && (
                              <a href="/admin/customers" onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <UserCircle className="w-3.5 h-3.5" /> {t('header.customers')}
                              </a>
                            )}
                            {canManageCampaigns(user) && (
                              <a href="/admin/campaigns" onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Mail className="w-3.5 h-3.5" /> {t('header.email_campaigns')}
                              </a>
                            )}
                            {canManageCampaigns(user) && (
                              <a href="/admin/newsletter-subscribers" onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Newspaper className="w-3.5 h-3.5" /> {t('header.newsletter')}
                              </a>
                            )}
                          </>
                        )}
                      </div>
                      <div className="border-t border-gray-200">
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                          <LogOut className="w-4 h-4" /> {t('header.sign_out')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="flex flex-col items-center group">
                  <CircleUserRound className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-800 hidden sm:block mt-0.5">{t('header.sign_in')}</span>
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button className="sm:hidden text-gray-600" onClick={() => setMobileOpen((v) => !v)}>
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="sm:hidden pb-3">
            <form onSubmit={handleSearch} className="flex rounded-full overflow-hidden border border-gray-300 focus-within:border-gray-500">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('header.search_placeholder_short')}
                className="flex-1 px-4 py-2 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              <button type="submit" className="bg-gray-800 px-4 flex items-center">
                <Search className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Category nav ── */}
      <nav className="bg-white border-b border-gray-200 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-0">
            {CATEGORIES.map((cat) => (
              <li key={cat.href}>
                <Link
                  href={cat.href}
                  className="block px-5 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent hover:border-gray-800 transition-all"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
            <li className="ml-auto">
              <Link href="/products" className="block px-5 py-3 text-sm font-medium text-gray-400 hover:text-gray-700">
                {t('nav.all_products')}
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── Mobile nav drawer ── */}
      {mobileOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200 shadow-lg">
          <nav className="flex flex-col">
            {CATEGORIES.map((cat) => (
              <Link key={cat.href} href={cat.href} onClick={() => setMobileOpen(false)}
                className="px-6 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                {cat.label}
              </Link>
            ))}
            {/* Language switcher in mobile menu */}
            <div className="px-6 py-3.5 border-b border-gray-100 flex items-center gap-3">
              <LanguageSwitcher />
            </div>
            {mounted && !user && (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="px-6 py-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50">
                {t('header.sign_in_register')}
              </Link>
            )}
            {mounted && user && (
              <>
                <Link href="/account" onClick={() => setMobileOpen(false)}
                  className="px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">{t('header.my_account')}</Link>
                <Link href="/orders" onClick={() => setMobileOpen(false)}
                  className="px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">{t('header.my_orders')}</Link>
                {isStaff(user) && (
                  <a href="/admin" onClick={() => setMobileOpen(false)}
                    className="block px-6 py-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50 border-b border-gray-100">{t('header.admin_panel')}</a>
                )}
                <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="px-6 py-3.5 text-sm text-red-600 text-left hover:bg-red-50">{t('header.sign_out')}</button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
