import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Shop All Products',
  description: 'Browse our full collection of Bengali books, Islamic literature, cultural crafts, and gift items. Filter by category, price, and more.',
  keywords:    'buy Bengali books online, Islamic books Canada, cultural gifts Toronto, South Asian books, book store online',
  openGraph: {
    title:       'Shop All Products — ATN Mega Store',
    description: 'Browse Bengali books, Islamic literature, and unique gifts from ATN Mega Store in Toronto.',
    type:        'website',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
