'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageCampaigns } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Send, Eye, Plus, Trash2, ChevronUp, ChevronDown,
  Type, AlignLeft, Tag, ImageIcon, LayoutGrid, MousePointer, Minus, MoveVertical,
  Search, X,
} from 'lucide-react';
import PageLoader from '@/components/ui/PageLoader';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

type Align = 'left' | 'center';

interface HeadingBlock  { type: 'heading';  content: string; align: Align }
interface TextBlock     { type: 'text';     content: string }
interface PromoBlock    { type: 'promo';    content: string; code: string; subtext: string; bg: string }
interface ImageBlock    { type: 'image';    url: string; alt: string; link: string }
interface ProductItem   { image: string; title: string; price: string; link: string }
interface ProductsBlock { type: 'products'; items: ProductItem[] }
interface ButtonBlock   { type: 'button';   content: string; url: string; align: Align }
interface DividerBlock  { type: 'divider' }
interface SpacerBlock   { type: 'spacer' }

type Block =
  | HeadingBlock | TextBlock | PromoBlock | ImageBlock
  | ProductsBlock | ButtonBlock | DividerBlock | SpacerBlock;

interface CampaignMeta {
  title: string; subject: string; preview_text: string;
  from_name: string; from_email: string;
}

interface SearchProduct {
  id: number;
  name: string;
  price: string;
  slug: string;
  image: string | null;
}

// ── Block type definitions (for the picker) ────────────────────────────────────

const BLOCK_DEFS = [
  { type: 'promo',    icon: Tag,          label: 'Promo Banner',  desc: 'Discount offer or announcement' },
  { type: 'heading',  icon: Type,         label: 'Heading',       desc: 'Section title' },
  { type: 'text',     icon: AlignLeft,    label: 'Text',          desc: 'Paragraph of body text' },
  { type: 'image',    icon: ImageIcon,    label: 'Image',         desc: 'Full-width photo with optional link' },
  { type: 'products', icon: LayoutGrid,   label: 'Products',      desc: '1–3 product cards with image, price, link' },
  { type: 'button',   icon: MousePointer, label: 'Button',        desc: 'Call-to-action button' },
  { type: 'divider',  icon: Minus,        label: 'Divider',       desc: 'Thin horizontal line' },
  { type: 'spacer',   icon: MoveVertical, label: 'Spacer',        desc: 'Empty vertical space' },
] as const;

const PROMO_COLORS = [
  { value: '#213885', label: 'Maroon (brand)' },
  { value: '#3d0f1e', label: 'Dark Maroon' },
  { value: '#1d4e3a', label: 'Forest Green' },
  { value: '#1d3557', label: 'Navy Blue' },
  { value: '#b5451b', label: 'Burnt Orange' },
  { value: '#1a1a1a', label: 'Charcoal' },
];

function emptyBlock(type: string): Block {
  switch (type) {
    case 'heading':  return { type: 'heading',  content: 'New Heading', align: 'center' };
    case 'text':     return { type: 'text',     content: 'Write your message here...' };
    case 'promo':    return { type: 'promo',    content: '🎉 Special Offer!', code: '', subtext: '', bg: '#213885' };
    case 'image':    return { type: 'image',    url: '', alt: '', link: '' };
    case 'products': return { type: 'products', items: [{ image: '', title: 'Product Name', price: '$0.00', link: '' }] };
    case 'button':   return { type: 'button',   content: 'Shop Now', url: 'http://localhost:3000/products', align: 'center' };
    case 'divider':  return { type: 'divider' };
    case 'spacer':   return { type: 'spacer' };
    default:         return { type: 'text', content: '' };
  }
}

const BLOCK_COLORS: Record<string, string> = {
  heading:  'bg-purple-50 border-purple-200',
  text:     'bg-white border-gray-200',
  promo:    'bg-amber-50 border-amber-200',
  image:    'bg-blue-50 border-blue-200',
  products: 'bg-green-50 border-green-200',
  button:   'bg-pink-50 border-pink-200',
  divider:  'bg-gray-50 border-gray-200',
  spacer:   'bg-gray-50 border-gray-200',
};

const BLOCK_LABELS: Record<string, string> = {
  heading: 'Heading', text: 'Text', promo: 'Promo Banner',
  image: 'Image', products: 'Products', button: 'Button',
  divider: 'Divider', spacer: 'Spacer',
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CampaignEditorPage() {
  const params  = useParams();
  const router  = useRouter();
  const { user } = useAuthStore();
  const id = params?.id as string;

  const [meta, setMeta]         = useState<CampaignMeta>({
    title: '', subject: '', preview_text: '', from_name: 'ATN Book & Crafts', from_email: 'info@atnmegastore.ca',
  });
  const [blocks, setBlocks]     = useState<Block[]>([]);
  const [status, setStatus]     = useState('draft');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [sending, setSending]   = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [recipientCount, setRecipientCount]  = useState<number | null>(null);
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageCampaigns(user)) { router.push('/admin'); return; }
    load();
    api.get('/admin/campaigns/recipient-count').then(r => setRecipientCount(r.data.count)).catch(() => {});
  }, [user]);

  // Auto-refresh preview 1.5 s after any change
  useEffect(() => {
    if (loading) return;
    if (previewDebounce.current) clearTimeout(previewDebounce.current);
    previewDebounce.current = setTimeout(refreshPreview, 1500);
    return () => { if (previewDebounce.current) clearTimeout(previewDebounce.current); };
  }, [blocks, meta, loading]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/campaigns/${id}`);
      setMeta({
        title:        data.title        ?? '',
        subject:      data.subject      ?? '',
        preview_text: data.preview_text ?? '',
        from_name:    data.from_name    ?? 'ATN Book & Crafts',
        from_email:   data.from_email   ?? 'info@atnmegastore.ca',
      });
      setBlocks(data.content ?? []);
      setStatus(data.status  ?? 'draft');
    } catch { toast.error('Failed to load campaign'); }
    finally { setLoading(false); }
  }

  async function save(silent = false) {
    setSaving(true);
    try {
      await api.put(`/admin/campaigns/${id}`, { ...meta, content: blocks });
      if (!silent) toast.success('Saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Save failed');
    } finally { setSaving(false); }
  }

  async function refreshPreview() {
    setPreviewLoading(true);
    try {
      const { data } = await api.post('/admin/campaigns/preview-content', {
        ...meta, content: blocks,
      });
      setPreviewHtml(data.html);
    } catch { /* silent */ }
    finally { setPreviewLoading(false); }
  }

  async function handleSend() {
    if (!window.confirm(`Send "${meta.subject}" to ${recipientCount ?? 'all'} subscribers? This cannot be undone.`)) return;
    await save(true);
    setSending(true);
    try {
      const { data } = await api.post(`/admin/campaigns/${id}/send`);
      toast.success(data.message);
      setStatus('sent');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Send failed');
    } finally { setSending(false); }
  }

  // ── Block CRUD ───────────────────────────────────────────────────────────────

  function addBlock(type: string) {
    setBlocks(b => [...b, emptyBlock(type)]);
    setShowBlockPicker(false);
  }

  function removeBlock(i: number) {
    setBlocks(b => b.filter((_, idx) => idx !== i));
  }

  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks(b => {
      const nb = [...b];
      const j  = i + dir;
      if (j < 0 || j >= nb.length) return b;
      [nb[i], nb[j]] = [nb[j], nb[i]];
      return nb;
    });
  }

  function updateBlock(i: number, patch: Partial<Block>) {
    setBlocks(b => b.map((blk, idx) => idx === i ? { ...blk, ...patch } as Block : blk));
  }

  if (!user || loading) return <PageLoader fullScreen />;

  const isSent = status === 'sent';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-14 z-20">
        <Link href="/admin/campaigns" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 shrink-0">
          <ArrowLeft className="w-4 h-4" /> Campaigns
        </Link>
        <span className="text-gray-300">/</span>
        <input
          value={meta.title}
          onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
          disabled={isSent}
          placeholder="Campaign title (internal)"
          className="flex-1 text-sm font-medium text-gray-800 bg-transparent border-none outline-none min-w-0 placeholder:text-gray-400"
        />
        <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium ${
          status === 'sent' ? 'bg-green-100 text-green-700' :
          status === 'sending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-500'
        }`}>{status}</span>
        <div className="flex gap-2 shrink-0">
          {!isSent && (
            <button onClick={() => save()} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
            </button>
          )}
          {!isSent && (
            <button onClick={handleSend} disabled={sending || saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium transition-colors">
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending…' : `Send to ${recipientCount ?? '—'}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main layout — 50/50 split ── */}
      <div className="flex flex-1 min-h-0">

        {/* Left: editor — half width */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-5 border-r border-gray-200">

          {/* Campaign metadata */}
          <div className="bg-white border border-gray-200 mb-6">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Campaign Details</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Subject *</label>
                <input value={meta.subject} disabled={isSent}
                  onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))}
                  placeholder="What subscribers see in their inbox"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] disabled:bg-gray-50" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Preview Text</label>
                <input value={meta.preview_text} disabled={isSent}
                  onChange={e => setMeta(m => ({ ...m, preview_text: e.target.value }))}
                  placeholder="Short summary shown after the subject line in inbox"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Name</label>
                <input value={meta.from_name} disabled={isSent}
                  onChange={e => setMeta(m => ({ ...m, from_name: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Email</label>
                <input type="email" value={meta.from_email} disabled={isSent}
                  onChange={e => setMeta(m => ({ ...m, from_email: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] disabled:bg-gray-50" />
              </div>
            </div>
          </div>

          {/* Block list */}
          <div className="space-y-3">
            {blocks.map((block, i) => (
              <BlockCard
                key={i}
                block={block}
                index={i}
                total={blocks.length}
                disabled={isSent}
                onUpdate={patch => updateBlock(i, patch)}
                onRemove={() => removeBlock(i)}
                onMove={dir => moveBlock(i, dir)}
              />
            ))}
          </div>

          {/* Add block */}
          {!isSent && (
            <div className="mt-4 relative">
              <button
                onClick={() => setShowBlockPicker(p => !p)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-[#213885] hover:bg-[#f2eef8] py-4 text-sm text-gray-500 hover:text-[#213885] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Block
              </button>

              {showBlockPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-10 grid grid-cols-2 sm:grid-cols-4 gap-1 p-2">
                  {BLOCK_DEFS.map(({ type, icon: Icon, label, desc }) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type)}
                      className="flex flex-col items-start gap-1 p-3 rounded hover:bg-[#f2eef8] hover:text-[#213885] text-left transition-colors group"
                    >
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#213885]" />
                      <span className="text-xs font-semibold text-gray-700 group-hover:text-[#213885]">{label}</span>
                      <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right: preview — equal half width, visible from lg */}
        <div className="hidden lg:flex flex-col flex-1 min-w-0 bg-white">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Preview</span>
            </div>
            {previewLoading && <span className="text-[10px] text-gray-400 animate-pulse">Refreshing…</span>}
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-100 p-3">
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                sandbox=""
                title="Email preview"
                className="w-full bg-white"
                style={{ height: '1000px', border: 'none', display: 'block' }}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-gray-400">
                Preview loads automatically…
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── ProductPicker ─────────────────────────────────────────────────────────────

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function ProductPicker({
  disabled, value, onUrlChange, onSelect,
}: {
  disabled: boolean;
  value: string;
  onUrlChange: (url: string) => void;
  onSelect: (p: SearchProduct) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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
    onSelect(p);
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  const inpCls = 'border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] disabled:bg-gray-50';

  return (
    <div className="relative">
      <div className="flex gap-1.5">
        <input
          disabled={disabled}
          className={`${inpCls} flex-1 w-0`}
          value={value}
          placeholder="https://…/product.jpg  — or click Search"
          onChange={e => onUrlChange(e.target.value)}
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            title="Search products by name"
            className={`flex items-center gap-1 px-3 py-1.5 text-xs border font-medium transition-colors shrink-0 ${
              open ? 'bg-[#213885] text-white border-[#213885]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl z-30">
          {/* Search input row */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type book or product name…"
              className="flex-1 text-sm outline-none"
            />
            {loading && <span className="text-[10px] text-gray-400 animate-pulse">Searching…</span>}
            <button onClick={() => { setOpen(false); setQuery(''); setResults([]); }}
              className="text-gray-400 hover:text-gray-600 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {results.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick(p)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f2eef8] text-left transition-colors border-b border-gray-50 last:border-0 group"
                >
                  {p.image ? (
                    <img src={p.image} alt={p.name}
                      className="w-10 h-10 object-cover border border-gray-200 shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-[#213885] font-semibold mt-0.5">
                      ${parseFloat(p.price).toFixed(2)}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-[#213885] bg-[#f2eef8] border border-[#cccacc] px-2 py-0.5 shrink-0 group-hover:bg-[#213885] group-hover:text-white transition-colors">
                    Use This
                  </span>
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

// ── BlockCard ─────────────────────────────────────────────────────────────────

function BlockCard({
  block, index, total, disabled,
  onUpdate, onRemove, onMove,
}: {
  block: Block; index: number; total: number; disabled: boolean;
  onUpdate: (p: Partial<Block>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const colors = BLOCK_COLORS[block.type] ?? 'bg-white border-gray-200';
  const label  = BLOCK_LABELS[block.type]  ?? block.type;
  const Def    = BLOCK_DEFS.find(d => d.type === block.type);
  const Icon   = Def?.icon ?? AlignLeft;

  return (
    <div className={`border ${colors} overflow-hidden`}>
      {/* Block header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-inherit bg-white/60">
        <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-xs font-semibold text-gray-600 flex-1">{label}</span>
        {!disabled && (
          <div className="flex items-center gap-0.5">
            <button onClick={() => onMove(-1)} disabled={index === 0}
              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
            <button onClick={() => onMove(1)} disabled={index === total - 1}
              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
            <button onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-500 ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* Block body */}
      <div className="p-4">
        <BlockEditor block={block} disabled={disabled} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

// ── BlockEditor ───────────────────────────────────────────────────────────────

function BlockEditor({ block, disabled, onUpdate }: {
  block: Block; disabled: boolean;
  onUpdate: (p: Partial<Block>) => void;
}) {
  const inp = 'w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] disabled:bg-gray-50';
  const lbl = 'block text-xs font-medium text-gray-500 mb-1';
  const row = 'space-y-3';

  if (block.type === 'heading') return (
    <div className={row}>
      <div>
        <label className={lbl}>Heading Text</label>
        <input disabled={disabled} className={inp} value={block.content}
          onChange={e => onUpdate({ content: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Alignment</label>
        <select disabled={disabled} className={inp} value={block.align}
          onChange={e => onUpdate({ align: e.target.value as Align })}>
          <option value="center">Center</option>
          <option value="left">Left</option>
        </select>
      </div>
    </div>
  );

  if (block.type === 'text') return (
    <div>
      <label className={lbl}>Content</label>
      <textarea disabled={disabled} rows={4} className={`${inp} resize-y`} value={block.content}
        onChange={e => onUpdate({ content: e.target.value })} />
    </div>
  );

  if (block.type === 'promo') return (
    <div className={row}>
      <div>
        <label className={lbl}>Banner Text *</label>
        <input disabled={disabled} className={inp} value={block.content} placeholder="e.g. Free Shipping on Orders Over $50!"
          onChange={e => onUpdate({ content: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Coupon Code (optional)</label>
          <input disabled={disabled} className={inp} value={block.code} placeholder="e.g. SAVE10"
            onChange={e => onUpdate({ code: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Sub-text (optional)</label>
          <input disabled={disabled} className={inp} value={block.subtext} placeholder="e.g. Ends Sunday"
            onChange={e => onUpdate({ subtext: e.target.value })} />
        </div>
      </div>
      <div>
        <label className={lbl}>Background Colour</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {PROMO_COLORS.map(c => (
            <button key={c.value} disabled={disabled} title={c.label}
              onClick={() => onUpdate({ bg: c.value })}
              style={{ background: c.value }}
              className={`w-7 h-7 rounded-full border-2 transition-all ${block.bg === c.value ? 'border-white ring-2 ring-gray-400 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (block.type === 'image') return (
    <div className={row}>
      <div>
        <label className={lbl}>Image URL *</label>
        <input disabled={disabled} className={inp} value={block.url} placeholder="https://…/image.jpg"
          onChange={e => onUpdate({ url: e.target.value })} />
        {block.url && (
          <img src={block.url} alt="preview" className="mt-2 max-h-28 object-cover border border-gray-200"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Alt Text</label>
          <input disabled={disabled} className={inp} value={block.alt} placeholder="Describe the image"
            onChange={e => onUpdate({ alt: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Link (optional)</label>
          <input disabled={disabled} className={inp} value={block.link} placeholder="https://…"
            onChange={e => onUpdate({ link: e.target.value })} />
        </div>
      </div>
    </div>
  );

  if (block.type === 'products') {
    const items = block.items;
    function updateItem(i: number, patch: Partial<ProductItem>) {
      const next = items.map((it, idx) => idx === i ? { ...it, ...patch } : it);
      onUpdate({ items: next });
    }
    function addItem() {
      if (items.length >= 3) return;
      onUpdate({ items: [...items, { image: '', title: 'Product Name', price: '$0.00', link: '' }] });
    }
    function removeItem(i: number) {
      onUpdate({ items: items.filter((_, idx) => idx !== i) });
    }
    return (
      <div className={row}>
        <p className="text-xs text-gray-500">1 product = large horizontal card. 2 products = side-by-side columns.</p>
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600">Product {i + 1}</span>
              {!disabled && items.length > 1 && (
                <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div>
              <label className={lbl}>Image URL</label>
              <ProductPicker
                disabled={disabled}
                value={item.image}
                onUrlChange={url => updateItem(i, { image: url })}
                onSelect={p => updateItem(i, {
                  image: p.image ?? '',
                  title: p.name,
                  price: `$${parseFloat(p.price).toFixed(2)}`,
                  link: `${FRONTEND_URL}/products/${p.slug}`,
                })}
              />
              {item.image && (
                <img src={item.image} alt="" className="mt-1.5 h-16 object-cover border border-gray-200"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>Title</label>
                <input disabled={disabled} className={inp} value={item.title}
                  onChange={e => updateItem(i, { title: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Price</label>
                <input disabled={disabled} className={inp} value={item.price} placeholder="$19.99"
                  onChange={e => updateItem(i, { price: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={lbl}>Product Link</label>
              <input disabled={disabled} className={inp} value={item.link} placeholder="https://…/products/slug"
                onChange={e => updateItem(i, { link: e.target.value })} />
            </div>
          </div>
        ))}
        {!disabled && items.length < 2 && (
          <button onClick={addItem}
            className="w-full border border-dashed border-gray-300 hover:border-[#213885] text-xs text-gray-500 hover:text-[#213885] py-2 transition-colors">
            + Add Second Product
          </button>
        )}
      </div>
    );
  }

  if (block.type === 'button') return (
    <div className={row}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Button Label *</label>
          <input disabled={disabled} className={inp} value={block.content} placeholder="e.g. Shop Now"
            onChange={e => onUpdate({ content: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Alignment</label>
          <select disabled={disabled} className={inp} value={block.align}
            onChange={e => onUpdate({ align: e.target.value as Align })}>
            <option value="center">Center</option>
            <option value="left">Left</option>
          </select>
        </div>
      </div>
      <div>
        <label className={lbl}>URL</label>
        <input disabled={disabled} className={inp} value={block.url} placeholder="https://…"
          onChange={e => onUpdate({ url: e.target.value })} />
      </div>
    </div>
  );

  // divider / spacer
  return (
    <p className="text-xs text-gray-400 italic">No options for this block.</p>
  );
}
