import type { Metadata } from 'next';
import { Inter, Playfair_Display, Noto_Sans_Bengali } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { getSettings } from '@/lib/settings';
import TopProgressBar from '@/components/ui/TopProgressBar';

const inter    = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const bengali  = Noto_Sans_Bengali({ subsets: ['bengali'], weight: ['400', '700'], variable: '--font-bengali' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atnmegastore.ca'),
  title: {
    default:  'ATN Mega Store — Bengali Books & Gifts | Toronto',
    template: '%s | ATN Mega Store',
  },
  description: "Toronto's destination for Bengali books, Islamic literature, cultural crafts, and unique gifts. Shop online or visit us in Bangla Town.",
  keywords:    ['Bengali books', 'Islamic books', 'Toronto bookstore', 'Bengali gifts', 'ATN Mega Store', 'Bangla Town'],
  authors:     [{ name: 'ATN Mega Store' }],
  openGraph: {
    siteName: 'ATN Mega Store',
    type:     'website',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // getLocale() reads the locale set by middleware; falls back to 'en' for admin/unlocalised routes
  let locale = 'en';
  try { locale = await getLocale(); } catch {}

  const s = await getSettings();

  const cityParts      = s.site_city.split(/,\s*/);
  const addressLocality = cityParts[0]?.trim() ?? 'Toronto';
  const regionPostal   = (cityParts[1] ?? 'ON M4C 1M6').trim().split(/\s+/);
  const addressRegion  = regionPostal[0] ?? 'ON';
  const postalCode     = regionPostal.slice(1).join(' ') || 'M4C 1M6';

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type':    'BookStore',
    name:       s.site_name,
    description: "Toronto's largest Bengali bookstore and gift shop, located in Bangla Town (Danforth & Victoria Park).",
    url:        process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atnmegastore.ca',
    address: {
      '@type':        'PostalAddress',
      streetAddress:  s.site_address,
      addressLocality,
      addressRegion,
      postalCode,
      addressCountry: 'CA',
    },
    openingHours: 'Mo-Su 14:00-20:00',
    telephone:    s.site_phone,
    email:        s.site_email,
  };

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable} ${bengali.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#ecdfd2] text-[#1a1a1a] font-sans" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <TopProgressBar />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '4px', fontSize: '14px', background: '#213885', color: '#fff' },
            success: { iconTheme: { primary: '#893172', secondary: '#213885' } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
