'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageSocialPosts } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft, Save, Send, Search, X, ImageIcon, Type, Sparkles,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Platform = 'facebook' | 'instagram' | 'twitter';

interface SearchProduct { id: number; name: string; price: string; slug: string; image: string | null }

interface Credentials { facebook: boolean; instagram: boolean; twitter: boolean; test_mode?: boolean }

// ── Platform config ────────────────────────────────────────────────────────────

const PLATFORMS: { id: Platform; label: string; letter: string; bg: string; ring: string; limit: number | null }[] = [
  { id: 'facebook',  label: 'Facebook',    letter: 'f',  bg: 'bg-blue-600',  ring: 'ring-blue-400',  limit: null },
  { id: 'instagram', label: 'Instagram',   letter: 'IG', bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400', ring: 'ring-pink-400', limit: 2200 },
  { id: 'twitter',   label: 'X / Twitter', letter: 'X',  bg: 'bg-gray-900',  ring: 'ring-gray-500',  limit: 280 },
];

// ── Quick templates ────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'text',
    icon: Type,
    label: 'Text Only',
    content: '✨ ',
    imageUrl: '',
  },
  {
    id: 'product',
    icon: ImageIcon,
    label: 'Product Feature',
    content: '📚 Now available at ATN Mega Store!\n\n[Book / Product Name]\n\n🔖 [Price]\n\nOrder now at atnmegastore.ca\n\n#ATNMegaStore #Books #Canada',
    imageUrl: '',
  },
  {
    id: 'promo',
    icon: Sparkles,
    label: 'Promotion',
    content: '🎉 SPECIAL OFFER!\n\n[Offer details — e.g. 10% off all books this weekend]\n\n🛒 Shop at atnmegastore.ca\nUse code: [CODENAME]\n\nOffer ends [date]. While supplies last.\n\n#Sale #Books #ATNMegaStore',
    imageUrl: '',
  },
];

// ── ProductPicker (same widget as campaign editor) ────────────────────────────

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function ProductPicker({
  value, onChange, onSelect,
}: {
  value: string;
  onChange: (url: string) => void;
  onSelect: (p: SearchProduct, fullUrl: string) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/products', { params: { search: query, per_page: 10 } });
        setResults(data.data ?? []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function pick(p: SearchProduct) {
    const productUrl = `${FRONTEND_URL}/products/${p.slug}`;
    onSelect(p, productUrl);
    setOpen(false); setQuery(''); setResults([]);
  }

  const inpCls = 'border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]';

  return (
    <div className="relative">
      <div className="flex gap-1.5">
        <input className={`${inpCls} flex-1 w-0`} value={value} placeholder="https://…/image.jpg — or click Search"
          onChange={e => onChange(e.target.value)} />
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs border font-medium transition-colors shrink-0 ${open ? 'bg-[#213885] text-white border-[#213885]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          <Search className="w-3.5 h-3.5" /> Search
        </button>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl z-30">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Type book or product name…" className="flex-1 text-sm outline-none" />
            {loading && <span className="text-[10px] text-gray-400 animate-pulse">Searching…</span>}
            <button onClick={() => { setOpen(false); setQuery(''); setResults([]); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {results.length > 0 ? (
            <div className="max-h-56 overflow-y-auto">
              {results.map(p => (
                <button key={p.id} type="button" onClick={() => pick(p)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f2eef8] text-left transition-colors border-b border-gray-50 last:border-0 group">
                  {p.image
                    ? <img src={p.image} alt={p.name} className="w-10 h-10 object-cover border border-gray-200 shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4 text-gray-300" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-[#213885] font-semibold mt-0.5">${parseFloat(p.price).toFixed(2)}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-[#213885] bg-[#f2eef8] border border-[#cccacc] px-2 py-0.5 shrink-0 group-hover:bg-[#213885] group-hover:text-white transition-colors">Use This</span>
                </button>
              ))}
            </div>
          ) : query.trim() && !loading ? (
            <p className="text-xs text-gray-400 text-center py-5">No products found for &ldquo;{query}&rdquo;</p>
          ) : (
            <p className="text-xs text-gray-400 text-center py-5">Start typing to search products…</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Platform preview card ──────────────────────────────────────────────────────

function PlatformPreview({ platform, content, imageUrl, storeName }: {
  platform: Platform; content: string; imageUrl: string; storeName: string;
}) {
  const date = new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

  if (platform === 'twitter') return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-[#213885] flex items-center justify-center text-white font-bold text-sm shrink-0">A</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-bold text-sm text-gray-900">{storeName}</span>
            <span className="text-xs text-gray-500">· {date}</span>
          </div>
          <p className="text-sm text-gray-900 whitespace-pre-wrap leading-snug">{content || 'Your post will appear here…'}</p>
          {imageUrl && (
            <img src={imageUrl} alt="" className="mt-3 rounded-xl w-full max-h-48 object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div className="flex gap-5 mt-3 text-xs text-gray-400">
            <span>💬 Reply</span><span>🔁 Retweet</span><span>❤️ Like</span><span>📤 Share</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (platform === 'instagram') return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 p-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-xs">A</div>
        <span className="font-semibold text-sm text-gray-900">{storeName.toLowerCase().replace(/ /g, '_')}</span>
      </div>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full max-h-72 object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
          Image will appear here
        </div>
      )}
      <div className="p-3">
        <div className="flex gap-3 mb-2 text-lg">❤️ 💬 📤</div>
        <p className="text-sm text-gray-900"><span className="font-semibold">{storeName.toLowerCase().replace(/ /g, '_')}</span>{' '}
          <span className="whitespace-pre-wrap">{content || 'Your caption will appear here…'}</span></p>
        <p className="text-xs text-gray-400 mt-1">{date}</p>
      </div>
    </div>
  );

  // Facebook
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 p-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">A</div>
        <div>
          <p className="font-semibold text-sm text-gray-900">{storeName}</p>
          <p className="text-xs text-gray-400">{date} · 🌍</p>
        </div>
      </div>
      <div className="px-3 py-2">
        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{content || 'Your post will appear here…'}</p>
      </div>
      {imageUrl && (
        <img src={imageUrl} alt="" className="w-full max-h-64 object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}
      <div className="px-3 py-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
        <span>👍 Like</span><span>💬 Comment</span><span>📤 Share</span>
      </div>
    </div>
  );
}

// ── Main composer page ─────────────────────────────────────────────────────────

export default function NewSocialPostPage() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [title, setTitle]         = useState('');
  const [content, setContent]     = useState('');
  const [imageUrl, setImageUrl]   = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['facebook']);
  const [saving, setSaving]       = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [credentials, setCredentials] = useState<Credentials>({ facebook: false, instagram: false, twitter: false });

  const storeName = 'ATN Mega Store';

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageSocialPosts(user)) { router.push('/admin'); return; }
    api.get('/admin/social-posts/credentials').then(r => setCredentials(r.data)).catch(() => {});
  }, [user]);

  function togglePlatform(id: Platform) {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setContent(t.content);
    if (t.imageUrl) setImageUrl(t.imageUrl);
  }

  async function save(): Promise<number | null> {
    if (!content.trim()) { toast.error('Content is required'); return null; }
    if (platforms.length === 0) { toast.error('Select at least one platform'); return null; }
    setSaving(true);
    try {
      const { data } = await api.post('/admin/social-posts', {
        title: title || null, content, image_url: imageUrl || null, platforms,
      });
      toast.success('Saved as draft');
      return data.id as number;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Save failed');
      return null;
    } finally { setSaving(false); }
  }

  async function handleSave() {
    const id = await save();
    if (id) router.push(`/admin/social-posts/${id}/edit`);
  }

  async function handlePublish() {
    if (!window.confirm(`Publish this post to: ${platforms.join(', ')}?`)) return;
    const id = await save();
    if (!id) return;
    setPublishing(true);
    try {
      const { data } = await api.post(`/admin/social-posts/${id}/publish`);
      const results: Record<string, { status: string; message?: string }> = data.results;
      const successes = Object.entries(results).filter(([, r]) => r.status === 'success').map(([p]) => p);
      const failures  = Object.entries(results).filter(([, r]) => r.status === 'failed').map(([, r]) => r.message ?? 'Error');
      const skipped   = Object.entries(results).filter(([, r]) => r.status === 'skipped').map(([p]) => p);
      if (successes.length) toast.success(`Posted to: ${successes.join(', ')}`);
      if (skipped.length)   toast(`Not configured: ${skipped.join(', ')}`, { icon: '⚠️' });
      if (failures.length)  toast.error(failures.join(' | '));
      router.push('/admin/social-posts');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Publish failed');
    } finally { setPublishing(false); }
  }

  const charLimit = platforms.includes('twitter') ? 280 : null;
  const charCount = content.length;
  const overLimit = charLimit !== null && charCount > charLimit;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-14 z-20">
        <Link href="/admin/social-posts" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 shrink-0">
          <ArrowLeft className="w-4 h-4" /> Posts
        </Link>
        <span className="text-gray-300">/</span>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Internal title (optional)"
          className="flex-1 text-sm font-medium text-gray-800 bg-transparent border-none outline-none min-w-0 placeholder:text-gray-400" />
        {credentials.test_mode && (
          <span className="hidden sm:inline text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-1 font-medium">
            🧪 Test Mode
          </span>
        )}
        <div className="flex gap-2 shrink-0">
          <button onClick={handleSave} disabled={saving || publishing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save Draft'}</span>
          </button>
          <button onClick={handlePublish} disabled={saving || publishing || platforms.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white font-medium transition-colors">
            <Send className="w-3.5 h-3.5" />
            <span>{publishing ? 'Publishing…' : 'Publish Now'}</span>
          </button>
        </div>
      </div>

      {/* Body — 50/50 split */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left: composer ── */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 border-r border-gray-200 space-y-6">

          {/* Quick templates */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Quick Template</p>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)}
                  className="flex flex-col items-center gap-1.5 p-3 border border-gray-200 hover:border-[#213885] hover:bg-[#f2eef8] text-center transition-colors group rounded">
                  <t.icon className="w-4 h-4 text-gray-400 group-hover:text-[#213885]" />
                  <span className="text-xs font-medium text-gray-600 group-hover:text-[#213885]">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Platform selector */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Publish To</p>
            <div className="grid grid-cols-1 gap-2">
              {PLATFORMS.map(p => {
                const selected = platforms.includes(p.id);
                const configured = credentials[p.id];
                return (
                  <label key={p.id}
                    className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-colors rounded ${selected ? 'border-[#213885] bg-[#f2eef8]' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={selected} onChange={() => togglePlatform(p.id)} className="sr-only" />
                    <div className={`w-8 h-8 rounded-full ${p.bg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {p.letter}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                      {p.limit && <p className="text-xs text-gray-400">{p.limit} char limit</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {!configured && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Not configured</span>
                      )}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected ? 'bg-[#213885] border-[#213885]' : 'border-gray-300'}`}>
                        {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {platforms.length === 0 && (
              <p className="text-xs text-red-500 mt-1.5">Select at least one platform</p>
            )}
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Post Content *</label>
              {charLimit && (
                <span className={`text-xs font-mono ${overLimit ? 'text-red-500 font-bold' : charCount > charLimit * 0.8 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {charCount} / {charLimit}
                </span>
              )}
            </div>
            <textarea
              rows={9}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your post here. Use emojis, hashtags, and line breaks for better engagement."
              className={`w-full border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 resize-y leading-relaxed ${overLimit ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-[#213885]'}`}
            />
            {overLimit && (
              <p className="text-xs text-red-500 mt-1">Over X/Twitter limit by {charCount - (charLimit ?? 0)} characters. The post will be truncated on Twitter.</p>
            )}
          </div>

          {/* Image */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
              Image (optional)
              <span className="ml-2 text-[10px] text-amber-600 font-normal normal-case">Required for Instagram</span>
            </label>
            <ProductPicker
              value={imageUrl}
              onChange={setImageUrl}
              onSelect={(p) => {
                setImageUrl(p.image ?? '');
                // auto-append product name + link to content if content is light
                if (content.length < 20 && p.name) {
                  setContent(`📚 ${p.name}\n\n$${parseFloat(p.price).toFixed(2)}\n\nShop now: ${FRONTEND_URL}/products/${p.slug}\n\n#ATNMegaStore #Books`);
                }
              }}
            />
            {imageUrl && (
              <img src={imageUrl} alt="" className="mt-2 max-h-32 object-cover border border-gray-200 rounded"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            {platforms.includes('instagram') && !imageUrl && (
              <p className="text-xs text-amber-600 mt-1">⚠ Instagram requires an image to publish.</p>
            )}
          </div>

        </div>

        {/* ── Right: per-platform preview ── */}
        <div className="hidden lg:flex flex-col flex-1 min-w-0 bg-white">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
            {platforms.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">Select a platform to see a preview</p>
            ) : (
              platforms.map(p => (
                <div key={p}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
                    {PLATFORMS.find(pl => pl.id === p)?.label}
                  </p>
                  <PlatformPreview platform={p} content={content} imageUrl={imageUrl} storeName={storeName} />
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
