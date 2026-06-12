'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import {
  ShoppingCart, Star, ChevronRight, ChevronDown,
  Minus, Plus, Bell, Truck, RefreshCw, Package, BookOpen,
} from 'lucide-react';
import api from '@/lib/api';
import { Product } from '@/lib/types';
import Image from 'next/image';
import { storageUrl } from '@/lib/imageUrl';
import { useCartStore } from '@/store/cartStore';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import toast from 'react-hot-toast';

interface Review {
  id: number; rating: number; title: string | null; body: string | null;
  reviewer_name: string | null; display_name: string; created_at: string;
  user?: { name: string } | null;
}
interface TagItem    { id: number; name: string; slug: string; }
interface GalleryImg { id: number; url: string; sort_order: number; }
interface ProductDetail extends Product {
  average_rating: number; review_count: number;
  reviews: Review[]; tags?: TagItem[]; images?: GalleryImg[];
}

// ── Stars helper ─────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} style={{ width: size, height: size }}
          className={s <= Math.round(rating) ? 'fill-[#893172] text-[#893172]' : 'fill-gray-200 text-gray-200'} />
      ))}
    </span>
  );
}

// ── Accordion item ────────────────────────────────────────────────────────────
function AccordionItem({ title, icon, children, defaultOpen = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#e8e3f0] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 px-1 text-left group"
      >
        <span className="flex items-center gap-2.5 font-semibold text-[#1a1a1a] text-sm">
          <span className="text-[#213885]">{icon}</span>
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[600px] pb-5' : 'max-h-0'}`}>
        <div className="px-1 text-sm text-gray-600 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Similar product card ──────────────────────────────────────────────────────
function SimilarCard({ p }: { p: Product }) {
  const addItem = useCartStore(s => s.addItem);
  return (
    <Link href={`/products/${p.slug}`}
      className="group bg-white border border-[#e8ddd5] rounded-xl overflow-hidden hover:shadow-md hover:border-[#213885]/30 transition-all flex flex-col">
      <div className="relative bg-[#ede8f8] h-40 overflow-hidden">
        {p.image
          ? <Image src={storageUrl(p.image)!} alt={p.name} fill sizes="(max-width: 640px) 50vw, 25vw"
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-500" />
          : <div className="flex items-center justify-center h-full"><BookOpen className="w-10 h-10 text-[#c9a88a]" /></div>}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-[#213885] font-semibold mb-0.5 truncate">{p.author ?? p.category?.name}</p>
        <p className="text-sm font-bold text-[#1a1a1a] leading-snug line-clamp-2 flex-1">{p.name}</p>
        <p className="text-sm font-bold text-[#1a1a1a] mt-2">${parseFloat(p.price).toFixed(2)}</p>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();
  const addItem   = useCartStore(s => s.addItem);
  const { settings: siteSettings, fetch: fetchSiteSettings } = useSiteSettingsStore();
  useEffect(() => { fetchSiteSettings(); }, [fetchSiteSettings]);
  const freeShippingAmount = Math.round(siteSettings.free_shipping_threshold || 49);

  const [product,      setProduct]      = useState<ProductDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [quantity,     setQuantity]     = useState(1);
  const [imgError,     setImgError]     = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [similar,      setSimilar]      = useState<Product[]>([]);

  // back-in-stock notify
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyName,  setNotifyName]  = useState('');
  const [notifyDone,  setNotifyDone]  = useState(false);
  const [notifyBusy,  setNotifyBusy]  = useState(false);
  const [notifyOpen,  setNotifyOpen]  = useState(false);

  // write a review
  const [reviewRating,    setReviewRating]    = useState(0);
  const [reviewHover,     setReviewHover]     = useState(0);
  const [reviewTitle,     setReviewTitle]     = useState('');
  const [reviewBody,      setReviewBody]      = useState('');
  const [reviewName,      setReviewName]      = useState('');
  const [reviewHoneypot,  setReviewHoneypot]  = useState('');
  const [reviewBusy,      setReviewBusy]      = useState(false);
  const [reviewSuccess,   setReviewSuccess]   = useState(false);

  useEffect(() => {
    setLoading(true); setImgError(false); setActiveImgIdx(0); setSimilar([]);
    api.get(`/products/${slug}`)
      .then(r => {
        setProduct(r.data);
        // Fetch similar products (same category)
        const cat = r.data.category?.slug;
        if (cat) {
          api.get('/products', { params: { category: cat, per_page: 7 } })
            .then(r2 => setSimilar((r2.data.data ?? []).filter((p: Product) => p.slug !== slug).slice(0, 6)))
            .catch(() => {});
        }
      })
      .catch(() => router.replace('/products'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-[#e8e3f0] rounded-2xl h-96" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-10 bg-gray-200 rounded w-1/4 mt-4" />
          <div className="h-12 bg-gray-200 rounded mt-6" />
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const price   = parseFloat(product.price);
  const inStock = product.stock > 0;
  const isBook  = !!product.author || !!product.genre;

  const allImages = [
    ...(product.image ? [storageUrl(product.image)] : []),
    ...(product.images ?? []).map(i => storageUrl(i.url)),
  ].filter((url, idx, arr) => url && arr.indexOf(url) === idx) as string[];

  // Rating distribution
  const ratingDist = [5,4,3,2,1].map(n => ({
    n,
    count: product.reviews.filter(r => r.rating === n).length,
  }));

  return (
    <div className="bg-[#ecdfd2] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-8 flex-wrap">
          <Link href="/" className="hover:text-[#213885] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/products" className="hover:text-[#213885] transition-colors">Products</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={`/products?category=${product.category.slug}`}
                className="hover:text-[#213885] transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-700 line-clamp-1 max-w-[220px]">{product.name}</span>
        </nav>

        {/* ── Two-column: image + info ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 mb-12">

          {/* Left: image + thumbnails */}
          <div className="flex flex-col gap-3">
            <div className="bg-[#e8e3f0] rounded-2xl p-6 min-h-72 relative overflow-hidden">
              {allImages.length > 0 && !imgError ? (
                <div className="relative h-80 w-full">
                  <Image key={allImages[activeImgIdx]} src={allImages[activeImgIdx]} alt={product.name}
                    fill priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain transition-opacity duration-300"
                    onError={() => setImgError(true)} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-8xl text-[#c9a88a]">📚</div>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <span className="bg-[#1a1a1a] text-white text-sm font-semibold px-4 py-2 tracking-wide uppercase rounded">
                    Out of Stock
                  </span>
                </div>
              )}
              {product.featured && (
                <span className="absolute top-4 left-4 bg-[#213885] text-[#893172] text-xs px-3 py-1 font-semibold tracking-widest uppercase rounded-sm">
                  Featured
                </span>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((url, idx) => (
                  <button key={url} type="button"
                    onClick={() => { setActiveImgIdx(idx); setImgError(false); }}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200
                      ${idx === activeImgIdx ? 'border-[#213885] shadow-md' : 'border-[#cccacc] hover:border-[#213885]/50 opacity-70 hover:opacity-100'}`}>
                    <Image src={url} alt={`View ${idx + 1}`} width={64} height={64}
                      className="w-full h-full object-cover bg-[#ede8f8]" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: info + buy */}
          <div className="flex flex-col">
            {product.category && (
              <Link href={`/products?category=${product.category.slug}`}
                className="text-xs font-semibold tracking-widest uppercase text-[#213885] hover:text-[#081849] mb-2 transition-colors">
                {product.category.name}
              </Link>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] leading-tight mb-1"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              {product.name}
            </h1>

            {product.name_secondary && (
              <p className="text-lg text-[#6b6b6b] mb-2 leading-snug">{product.name_secondary}</p>
            )}
            {product.author && (
              <p className="text-sm text-gray-500 italic mb-3">by {product.author}</p>
            )}
            {product.genre && (
              <span className="inline-block text-xs bg-[#ede8f8] text-[#213885] px-2.5 py-1 rounded font-medium mb-4 self-start">
                {product.genre}
              </span>
            )}

            {/* Rating summary (compact) */}
            {product.review_count > 0 && (
              <a href="#reviews" className="flex items-center gap-2 mb-4 group self-start">
                <Stars rating={product.average_rating} />
                <span className="text-sm text-gray-500 group-hover:text-[#213885] transition-colors">
                  {product.average_rating.toFixed(1)} · {product.review_count} review{product.review_count !== 1 ? 's' : ''}
                </span>
              </a>
            )}

            <div className="text-3xl font-bold text-[#1a1a1a] mb-1">${price.toFixed(2)}</div>

            {/* Stock */}
            <div className="mb-5">
              {inStock ? (
                <p className="text-sm">
                  {product.stock <= 5
                    ? <span className="text-orange-600 font-semibold">Only {product.stock} left in stock</span>
                    : <span className="text-green-600 font-semibold">In Stock</span>}
                </p>
              ) : (
                <div>
                  <p className="text-sm text-red-500 font-semibold mb-3">Out of Stock</p>
                  {notifyDone ? (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <Bell size={15} /> You&apos;re on the list! We&apos;ll email you when it&apos;s back.
                    </div>
                  ) : notifyOpen ? (
                    <div className="bg-[#ecdfd2] border border-[#cccacc] rounded-lg p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-800">Notify me when available</p>
                      <input value={notifyName} onChange={e => setNotifyName(e.target.value)}
                        placeholder="Your name (optional)" className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                      <input value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)}
                        placeholder="Your email *" type="email" className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
                      <div className="flex gap-2">
                        <button disabled={notifyBusy || !notifyEmail} onClick={async () => {
                          setNotifyBusy(true);
                          try {
                            await api.post(`/stock-notifications/${product.slug}`, { email: notifyEmail, name: notifyName || undefined });
                            setNotifyDone(true);
                          } catch (err: any) {
                            toast.error(err.response?.data?.message ?? 'Could not subscribe');
                          } finally { setNotifyBusy(false); }
                        }} className="flex-1 bg-[#213885] text-white rounded py-2 text-sm font-semibold disabled:opacity-50 hover:bg-[#5f3475]">
                          {notifyBusy ? 'Subscribing…' : 'Notify Me'}
                        </button>
                        <button onClick={() => setNotifyOpen(false)} className="px-3 py-2 border rounded text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setNotifyOpen(true)}
                      className="flex items-center gap-2 border border-[#213885] text-[#213885] rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#213885] hover:text-white transition-colors">
                      <Bell size={15} /> Notify Me When Available
                    </button>
                  )}
                </div>
              )}
            </div>

            {inStock && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border border-[#cccacc] rounded overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-2.5 hover:bg-[#ede8f8] transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="w-10 text-center text-sm font-semibold select-none">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="px-3 py-2.5 hover:bg-[#ede8f8] transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                </div>
                <button onClick={() => { addItem(product, quantity); toast.success(`Added ${quantity} × "${product.name}" to cart`); }}
                  className="flex-1 bg-[#213885] hover:bg-[#081849] text-white font-semibold py-3 px-6 flex items-center justify-center gap-2 transition-colors tracking-wide text-sm uppercase">
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </button>
              </div>
            )}

            <Link href="/cart"
              className="text-sm text-[#213885] underline underline-offset-2 hover:text-[#081849] transition-colors self-start mb-5">
              View Cart →
            </Link>

            {/* Tags */}
            {(product.tags ?? []).length > 0 && (
              <div className="border-t border-[#e8e3f0] pt-4 flex flex-wrap gap-2">
                {product.tags!.map(tag => (
                  <a key={tag.slug} href={`/products?tag=${tag.slug}`}
                    className="bg-[#ede8f8] hover:bg-[#e8e3f0] text-[#213885] text-xs px-3 py-1 rounded-full font-medium transition-colors">
                    #{tag.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Full-width: Description + Accordion ───────────────────────── */}
        <div className="max-w-3xl">

          {/* Description (always visible, not in accordion) */}
          {product.description && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3"
                style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                About This {isBook ? 'Book' : 'Product'}
              </h2>
              <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Accordion */}
          <div className="border border-[#e8e3f0] rounded-xl bg-white divide-y divide-[#e8e3f0] px-4 mb-12">

            {/* Book / Product Details */}
            <AccordionItem
              title={isBook ? 'Book Information' : 'Product Details'}
              icon={<BookOpen size={15} />}
              defaultOpen
            >
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mt-1">
                {product.author && (
                  <><dt className="text-gray-400 font-medium">Author</dt><dd className="text-gray-700">{product.author}</dd></>
                )}
                {product.genre && (
                  <><dt className="text-gray-400 font-medium">Genre</dt><dd className="text-gray-700">{product.genre}</dd></>
                )}
                {product.category && (
                  <><dt className="text-gray-400 font-medium">Category</dt>
                  <dd><Link href={`/products?category=${product.category.slug}`} className="text-[#213885] hover:underline">{product.category.name}</Link></dd></>
                )}
                <dt className="text-gray-400 font-medium">Format</dt>
                <dd className="text-gray-700">{isBook ? 'Paperback' : 'Physical Item'}</dd>

                <dt className="text-gray-400 font-medium">Availability</dt>
                <dd className={inStock ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                  {inStock ? `In Stock (${product.stock} units)` : 'Out of Stock'}
                </dd>

                {product.name_secondary && (
                  <><dt className="text-gray-400 font-medium">{isBook ? 'Original Title' : 'Alt. Name'}</dt>
                  <dd className="text-gray-700">{product.name_secondary}</dd></>
                )}
              </dl>
            </AccordionItem>

            {/* About the Author — books only */}
            {product.author && (
              <AccordionItem title="About the Author" icon={<span className="text-base leading-none">✍</span>}>
                <p className="text-gray-600">
                  <span className="font-semibold text-[#1a1a1a]">{product.author}</span> is a celebrated author
                  whose works have resonated deeply with Bengali and South Asian readers. Known for compelling
                  storytelling and vivid prose, their books explore themes of identity, culture, and the human
                  experience.
                </p>
              </AccordionItem>
            )}

            {/* Shipping */}
            <AccordionItem title="Shipping & Delivery" icon={<Truck size={15} />}>
              <ul className="space-y-2 mt-1">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#213885] mt-2 shrink-0" />
                  <span><strong>Standard Shipping</strong> — 3–7 business days within Canada. Free on orders over ${freeShippingAmount}.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#213885] mt-2 shrink-0" />
                  <span><strong>Express Shipping</strong> — 1–3 business days. Additional charges apply.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#213885] mt-2 shrink-0" />
                  <span><strong>Local Pickup</strong> — Available at our Toronto store. Ready within 24 hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#213885] mt-2 shrink-0" />
                  <span>Orders placed before 2 PM EST ship the same business day.</span>
                </li>
              </ul>
            </AccordionItem>

            {/* Returns */}
            <AccordionItem title="Returns & Exchanges" icon={<RefreshCw size={15} />}>
              {isBook ? (
                <div className="flex items-start gap-3 bg-[#f2eef8] border border-[#cccacc] rounded-lg px-4 py-3 mt-1">
                  <span className="text-lg leading-none mt-0.5">📚</span>
                  <div>
                    <p className="font-semibold text-[#1a1a1a] mb-1">All book sales are final — no returns or exchanges.</p>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Because books can be read and returned, we are unable to accept returns on any book purchases.
                      Please review the title, author, and description carefully before ordering.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Received a damaged or incorrect item?{' '}
                      <a href="mailto:support@atnmegastore.ca" className="text-[#213885] underline">Contact us</a>
                      {' '}within 7 days and we will make it right.
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2 mt-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#213885] mt-2 shrink-0" />
                    <span>We accept returns within <strong>30 days</strong> of delivery for items in original, unused condition.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#213885] mt-2 shrink-0" />
                    <span>Items must be unopened and in their original packaging.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#213885] mt-2 shrink-0" />
                    <span>To initiate a return, email <a href="mailto:returns@atnmegastore.ca" className="text-[#213885] underline">returns@atnmegastore.ca</a> with your order number.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#213885] mt-2 shrink-0" />
                    <span>Refunds are processed within 5–7 business days of receiving the item.</span>
                  </li>
                </ul>
              )}
            </AccordionItem>

          </div>
        </div>

        {/* ── Similar Products ───────────────────────────────────────────── */}
        {similar.length > 0 && (
          <section className="mb-14">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-5"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {similar.map(p => <SimilarCard key={p.id} p={p} />)}
            </div>
          </section>
        )}

        {/* ── Reviews ───────────────────────────────────────────────────── */}
        <section id="reviews" className="border-t border-[#e8e3f0] pt-10">

          {product.reviews.length > 0 && (
            <>
              {/* Rating summary */}
              <div className="flex flex-col sm:flex-row gap-8 mb-10">
                <div className="flex flex-col items-center justify-center bg-white border border-[#e8ddd5] rounded-xl px-8 py-6 shrink-0">
                  <span className="text-6xl font-bold text-[#1a1a1a] leading-none">{product.average_rating.toFixed(1)}</span>
                  <Stars rating={product.average_rating} size={18} />
                  <span className="text-xs text-gray-400 mt-1">{product.review_count} review{product.review_count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
                  {ratingDist.map(({ n, count }) => (
                    <div key={n} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-3 text-right font-medium">{n}</span>
                      <Star className="w-3 h-3 fill-[#893172] text-[#893172] shrink-0" />
                      <div className="flex-1 bg-[#e8e3f0] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-[#893172] rounded-full transition-all duration-500"
                          style={{ width: product.review_count ? `${(count / product.review_count) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="w-5 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                {product.reviews.map(review => (
                  <div key={review.id} className="bg-white border border-[#e8ddd5] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Stars rating={review.rating} size={13} />
                      {review.rating >= 4 && (
                        <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    {review.title && (
                      <p className="font-semibold text-sm text-[#1a1a1a] mb-1">{review.title}</p>
                    )}
                    {review.body && (
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">{review.body}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {review.display_name || review.user?.name || review.reviewer_name || 'Anonymous'}
                      {' · '}
                      {new Date(review.created_at).toLocaleDateString('en-CA', { year:'numeric', month:'short', day:'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Write a review form */}
          <div className="max-w-xl">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-5"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              {product.reviews.length === 0 ? 'Be the first to review this product' : 'Write a Review'}
            </h3>

            {reviewSuccess ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-green-800 text-sm font-medium">
                <Star className="w-4 h-4 fill-green-600 text-green-600 shrink-0" />
                Thank you! Your review has been submitted.
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!reviewRating) { toast.error('Please select a star rating.'); return; }
                  setReviewBusy(true);
                  try {
                    const res = await api.post(`/products/${product.slug}/reviews`, {
                      rating:         reviewRating,
                      title:          reviewTitle  || undefined,
                      body:           reviewBody   || undefined,
                      reviewer_name:  reviewName   || undefined,
                      website:        reviewHoneypot || undefined,
                    });
                    setProduct(prev => prev ? {
                      ...prev,
                      reviews: [...prev.reviews, { ...res.data, display_name: res.data.reviewer_name || 'You' }],
                      review_count: prev.review_count + 1,
                      average_rating: parseFloat(
                        ((prev.average_rating * prev.review_count + reviewRating) / (prev.review_count + 1)).toFixed(1)
                      ),
                    } : prev);
                    setReviewSuccess(true);
                  } catch (err: any) {
                    toast.error(err.response?.data?.message ?? 'Could not submit review. Please try again.');
                  } finally {
                    setReviewBusy(false);
                  }
                }}
                className="bg-white border border-[#e8ddd5] rounded-xl p-6 space-y-4"
              >
                {/* Star picker */}
                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Your Rating *</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n} type="button"
                        onClick={() => setReviewRating(n)}
                        onMouseEnter={() => setReviewHover(n)}
                        onMouseLeave={() => setReviewHover(0)}
                        className="p-0.5 transition-transform hover:scale-110"
                        aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                      >
                        <Star
                          className="w-7 h-7 transition-colors"
                          style={{
                            fill: n <= (reviewHover || reviewRating) ? '#893172' : '#e5e7eb',
                            color: n <= (reviewHover || reviewRating) ? '#893172' : '#e5e7eb',
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-1">Review Title <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    value={reviewTitle}
                    onChange={e => setReviewTitle(e.target.value)}
                    maxLength={255}
                    placeholder="Summarise your review in one line"
                    className="w-full border border-[#cccacc] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-1">Your Review <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    value={reviewBody}
                    onChange={e => setReviewBody(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="Tell others about your experience with this product…"
                    className="w-full border border-[#cccacc] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-1">Your Name <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    value={reviewName}
                    onChange={e => setReviewName(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. Fatima A."
                    className="w-full border border-[#cccacc] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30"
                  />
                </div>

                {/* Honeypot — hidden from humans, bots will fill it */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                  <label htmlFor="review-website">Website</label>
                  <input id="review-website" type="text" name="website" tabIndex={-1} autoComplete="off"
                    value={reviewHoneypot} onChange={e => setReviewHoneypot(e.target.value)} />
                </div>

                <button
                  type="submit"
                  disabled={reviewBusy || !reviewRating}
                  className="w-full bg-[#213885] text-white font-semibold py-3 rounded-lg hover:bg-[#081849] disabled:opacity-50 transition-colors text-sm tracking-wide"
                >
                  {reviewBusy ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>

        </section>

      </div>
    </div>
  );
}
