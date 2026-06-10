'use client';

import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import Logo from '@/components/Logo';

export default function Footer() {
  const t = useTranslations('footer');
  const s = useSiteSettingsStore((st) => st.settings);

  const LINKS = [
    {
      group: t('group_shop'),
      links: [
        { label: t('books'),        href: '/products?category=books' },
        { label: t('gifts'),        href: '/products?category=gifts' },
        { label: t('bestsellers'),  href: '/products?featured=true' },
        { label: t('new_arrivals'), href: '/products?sort=created_at&dir=desc' },
        { label: t('sale'),         href: '/products?max_price=12' },
      ],
    },
    {
      group: t('group_account'),
      links: [
        { label: t('sign_in'),       href: '/login' },
        { label: t('register'),      href: '/register' },
        { label: t('my_orders'),     href: '/orders' },
        { label: t('my_account'),    href: '/account' },
        { label: t('shopping_cart'), href: '/cart' },
      ],
    },
    {
      group: t('group_info'),
      links: [
        { label: t('about_us'),          href: '/about' },
        { label: t('contact_us'),        href: '/contact' },
        { label: t('store_location'),    href: '/store-location' },
        { label: t('shipping_policy'),   href: '/shipping' },
        { label: t('return_policy'),     href: '/returns' },
      ],
    },
  ];

  const socials = [
    { url: s.facebook_url,  label: 'Facebook'  },
    { url: s.instagram_url, label: 'Instagram' },
    { url: s.twitter_url,   label: 'X'         },
    { url: s.youtube_url,   label: 'YouTube'   },
  ].filter((item) => item.url);

  return (
    <footer className="bg-gray-50 border-t border-gray-200 text-gray-600">

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              {s.logo_url
                ? <img src={s.logo_url} alt={s.site_name} className="h-10 w-auto object-contain mb-3" />
                : <div className="mb-3"><Logo size="sm" /></div>}
              {s.site_tagline && (
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{s.site_tagline}</p>
              )}
            </div>

            {/* Address & Contact */}
            <div className="mt-4 space-y-1 text-sm text-gray-500">
              {s.site_address && <p className="font-medium text-gray-700">{s.site_address}</p>}
              {s.site_city    && <p>{s.site_city}</p>}
              <p className="pt-1">
                {s.site_phone && (
                  <a href={`tel:${s.site_phone.replace(/\D/g,'')}`} className="hover:text-gray-800 transition-colors">{s.site_phone}</a>
                )}
                {s.site_phone && s.site_phone_2 && <span className="mx-2 text-gray-300">|</span>}
                {s.site_phone_2 && (
                  <a href={`tel:${s.site_phone_2.replace(/\D/g,'')}`} className="hover:text-gray-800 transition-colors">{s.site_phone_2}</a>
                )}
              </p>
              {s.site_email && (
                <p>
                  <a href={`mailto:${s.site_email}`} className="hover:text-gray-800 transition-colors">{s.site_email}</a>
                </p>
              )}
              {s.site_hours && <p className="text-xs text-gray-400 pt-1">{s.site_hours}</p>}
            </div>

            {/* Social icons */}
            {socials.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socials.map(({ url, label }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-800 hover:text-white text-gray-600 text-xs font-semibold transition-colors rounded">
                    {label}
                  </a>
                ))}
              </div>
            )}

            {/* Payment methods */}
            <div className="flex gap-2 mt-5 flex-wrap">
              {['Visa', 'Mastercard', 'Amex', 'Interac', 'Pay in Store'].map((m) => (
                <span key={m} className="bg-white text-gray-500 text-[10px] px-2.5 py-1 font-medium tracking-wide border border-gray-300 rounded">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          {LINKS.map(({ group, links }) => (
            <div key={group}>
              <h4 className="text-gray-900 font-semibold text-sm uppercase tracking-wider mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {s.site_name}. {t('all_rights')}
          </p>
          <div className="flex gap-5 flex-wrap justify-center">
            {[
              { label: t('privacy'),       href: '/privacy-policy' },
              { label: t('terms'),         href: '/terms' },
              { label: t('cookies'),       href: '/cookies' },
              { label: t('accessibility'), href: '/accessibility' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
