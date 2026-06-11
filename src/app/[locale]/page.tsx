import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/navigation';
import Image from 'next/image';
import { storageUrl } from '@/lib/imageUrl';
import { ArrowRight, Truck, Shield, RefreshCw, CalendarDays, MapPin, Clock, BookOpen } from 'lucide-react';
import { Product, Category } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import HeroSection from '@/components/HeroSection';
import NewsletterForm from '@/components/NewsletterForm';

const SERVER_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api';
const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atnmegastore.ca';

export const metadata: Metadata = {
  title:       'ATN Book & Crafts — Bengali Books & Gifts | Toronto',
  description: "Toronto's largest Bengali bookstore and gift shop. Browse books, Islamic literature, cultural crafts, and unique gifts. Shop online or visit us in Bangla Town.",
  keywords:    'Bengali books Toronto, Islamic books Toronto, South Asian gifts, Bengali bookstore Canada, ATN Book & Crafts, Bangla Town Toronto',
  openGraph: {
    title:       'ATN Book & Crafts — Bengali Books & Gifts | Toronto',
    description: "Toronto's largest Bengali bookstore. Books, Islamic literature, cultural crafts, and gifts — online and in Bangla Town.",
    url:         SITE_URL,
    siteName:    'ATN Book & Crafts',
    locale:      'en_CA',
    type:        'website',
  },
  alternates: { canonical: SITE_URL },
};

async function serverFetch(path: string, fallback: any = [], revalidate = 300) {
  try {
    const r = await fetch(`${SERVER_API}${path}`, { next: { revalidate } });
    return r.ok ? r.json() : fallback;
  } catch { return fallback; }
}

// Shorter TTL for content that changes more often
async function serverFetchLive(path: string, fallback: any = []) {
  return serverFetch(path, fallback, 30);
}

async function getFeaturedProducts(): Promise<Product[]> { return serverFetch('/products/featured'); }           // 5 min
async function getCategories(): Promise<Category[]>      { return serverFetch('/categories'); }                  // 5 min
async function getSlides(): Promise<any[]>               { return serverFetch('/slides'); }                      // 5 min
async function getEvents(): Promise<any>                 { return serverFetchLive('/events', { upcoming: [], past: [] }); }  // 1 min
async function getLatestPosts(): Promise<any>            { return serverFetchLive('/posts?per_page=3', { data: [] }); }     // 1 min
async function getNewestProduct(): Promise<any>          { return serverFetch('/products?sort=created_at&dir=desc&per_page=1', { data: [] }); }

function fmtEventDate(d: string) {
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function fmtPostDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');

  const [featured, categories, slides, eventsData, postsData, newestData] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getSlides(),
    getEvents(),
    getLatestPosts(),
    getNewestProduct(),
  ]);

  const upcomingEvents: any[] = (eventsData.upcoming ?? []).slice(0, 3);
  const latestPosts: any[]    = postsData.data ?? [];
  const heroPost    = latestPosts[0]             ?? null;
  const heroProduct = (newestData.data ?? [])[0] ?? null;
  const heroEvent   = upcomingEvents[0]          ?? null;

  return (
    <div className="bg-[#ecdfd2]">

      {/* ── Hero: Slideshow + Sidebar ── */}
      <HeroSection
        slides={slides}
        latestPost={heroPost}
        newProduct={heroProduct}
        upcomingEvent={heroEvent}
      />

      {/* ── Trust bar ── */}
      <section className="bg-white border-y border-[#cccacc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: Truck,     text: t('trust_shipping') },
            { icon: Shield,    text: t('trust_secure') },
            { icon: RefreshCw, text: t('trust_returns') },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2">
              <Icon className="w-4 h-4 text-[#213885] shrink-0" />
              <span className="text-xs sm:text-sm text-[#6b6b6b] font-medium">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shop by Category ── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              {t('shop_by_category')}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden aspect-[16/7] bg-[#213885]">
                {cat.image && (
                  <Image src={cat.image} alt={cat.name} fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#213885]/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-white text-2xl sm:text-3xl font-bold mb-1"
                    style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                    {cat.name}
                  </h3>
                  <p className="text-[#893172] text-sm font-medium flex items-center gap-1">
                    {t('shop_now')} <ArrowRight className="w-3.5 h-3.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      {featured.length > 0 && (
        <section className="bg-white border-y border-[#cccacc] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[#213885] text-xs tracking-[0.2em] uppercase font-semibold mb-2">{t('hand_picked')}</p>
                <h2 className="text-3xl font-bold text-[#1a1a1a]"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  {t('featured_picks')}
                </h2>
              </div>
              <Link href="/products?featured=true"
                className="text-sm font-medium text-[#213885] hover:text-[#893172] flex items-center gap-1 border-b border-[#213885] pb-0.5">
                {t('view_all')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {featured.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Upcoming Events ── */}
      {upcomingEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[#213885] text-xs tracking-[0.2em] uppercase font-semibold mb-2">{t('whats_on')}</p>
              <h2 className="text-3xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                {t('upcoming_events')}
              </h2>
            </div>
            <Link href="/events"
              className="text-sm font-medium text-[#213885] hover:text-[#893172] flex items-center gap-1 border-b border-[#213885] pb-0.5">
              {t('all_events')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingEvents.map((ev: any) => (
              <Link key={ev.id} href={`/events/${ev.slug}`}
                className="group block bg-white rounded-xl border hover:border-[#213885]/40 hover:shadow-md transition-all overflow-hidden">
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  {ev.image_url ? (
                    <Image src={storageUrl(ev.image_url)!} alt={ev.title} fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#213885] to-[#5f3475]">
                      <CalendarDays size={36} className="text-white/30" />
                    </div>
                  )}
                  {ev.is_featured && (
                    <span className="absolute top-2 left-2 bg-[#893172] text-[#213885] text-xs font-bold px-2 py-0.5 rounded-full">{t('featured_event_label')}</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-[#213885] transition-colors line-clamp-2">
                    {ev.title}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <CalendarDays size={12} className="text-[#213885]" />
                      {fmtEventDate(ev.date)}
                    </div>
                    {ev.start_time && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock size={12} className="text-[#213885]" />
                        {fmtTime(ev.start_time)}{ev.end_time ? ` – ${fmtTime(ev.end_time)}` : ''}
                      </div>
                    )}
                    {ev.location && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin size={12} className="text-[#213885]" />
                        {ev.location}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Editorial Banner ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/products?category=books"
          className="group relative overflow-hidden bg-[#e8e3f0] flex flex-col justify-between p-8 min-h-56">
          <div>
            <p className="text-[#213885] text-xs tracking-[0.2em] uppercase font-semibold mb-3">{t('for_readers')}</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] mb-2 leading-tight"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              {t('books_for_every_mood')}
            </h3>
            <p className="text-[#6b6b6b] text-sm">{t('fiction_tagline')}</p>
          </div>
          <div className="flex items-center gap-2 text-[#213885] text-sm font-semibold mt-6 border-b-2 border-[#213885] w-fit pb-0.5
            group-hover:border-[#893172] group-hover:text-[#893172] transition-colors">
            {t('shop_books')} <ArrowRight className="w-4 h-4" />
          </div>
          <Image src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300" alt=""
            width={144} height={144}
            className="absolute right-0 bottom-0 h-36 w-36 object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
        </Link>

        <Link href="/products?category=gifts"
          className="group relative overflow-hidden bg-[#213885] flex flex-col justify-between p-8 min-h-56">
          <div>
            <p className="text-[#893172] text-xs tracking-[0.2em] uppercase font-semibold mb-3">{t('gift_ideas')}</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              {t('gifts_they_love')}
            </h3>
            <p className="text-gray-300 text-sm">{t('gifts_tagline')}</p>
          </div>
          <div className="flex items-center gap-2 text-[#893172] text-sm font-semibold mt-6 border-b-2 border-[#893172] w-fit pb-0.5
            group-hover:border-white group-hover:text-white transition-colors">
            {t('shop_gifts')} <ArrowRight className="w-4 h-4" />
          </div>
          <Image src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=300" alt=""
            width={144} height={144}
            className="absolute right-0 bottom-0 h-36 w-36 object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
        </Link>
      </section>

      {/* ── Bestsellers ── */}
      <section className="bg-[#e8e3f0] border-y border-[#cccacc] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#893172] text-xs tracking-[0.2em] uppercase font-semibold mb-2">{t('most_popular')}</p>
              <h2 className="text-3xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                {t('bestsellers')}
              </h2>
            </div>
            <Link href="/products?sort=name&dir=asc"
              className="text-sm font-medium text-[#213885] hover:text-[#893172] flex items-center gap-1 border-b border-[#213885] pb-0.5">
              {t('see_all')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#cccacc]">
            {featured.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── From Our Blog ── */}
      {latestPosts.length > 0 && (
        <section className="bg-white border-b border-[#cccacc] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[#213885] text-xs tracking-[0.2em] uppercase font-semibold mb-2">{t('reading_culture')}</p>
                <h2 className="text-3xl font-bold text-[#1a1a1a]"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  {t('from_our_blog')}
                </h2>
              </div>
              <Link href="/blog"
                className="text-sm font-medium text-[#213885] hover:text-[#893172] flex items-center gap-1 border-b border-[#213885] pb-0.5">
                {t('all_articles')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestPosts.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`}
                  className="group block bg-[#ecdfd2] rounded-xl border border-[#e8ddd5] hover:border-[#213885]/30 hover:shadow-md transition-all overflow-hidden">
                  <div className="relative h-44 bg-[#e8e3f0] overflow-hidden">
                    {post.cover_image_url ? (
                      <Image src={storageUrl(post.cover_image_url)!} alt={post.title} fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={36} className="text-[#c4945a]" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-400 mb-2">{fmtPostDate(post.published_at)}</p>
                    <h3 className="font-bold text-[#1a1a1a] leading-snug mb-2 group-hover:text-[#213885] transition-colors line-clamp-2"
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                    )}
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#213885]">
                      {t('read_more')} <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter ── */}
      <section className="bg-[#213885] py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-[#893172] text-xs tracking-[0.2em] uppercase font-semibold mb-3">{t('stay_in_loop')}</p>
          <h2 className="text-white text-3xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            {t('get_newsletter')}
          </h2>
          <p className="text-gray-300 text-sm mb-8">
            {t('newsletter_tagline')}
          </p>
          <NewsletterForm />
        </div>
      </section>

    </div>
  );
}
