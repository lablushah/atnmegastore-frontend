'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import Link from 'next/link';

// ── Preview block types ───────────────────────────────────────────────────────

type PBlock =
  | { t: 'promo';    bg: string }
  | { t: 'heading' }
  | { t: 'text';     lines?: number }
  | { t: 'product1' }
  | { t: 'product2' }
  | { t: 'button' }
  | { t: 'divider' }
  | { t: 'spacer' }

// ── Template definitions ──────────────────────────────────────────────────────

interface Template {
  id:          string;
  name:        string;
  description: string;
  badge:       string;
  badgeColor:  string;
  preview:     PBlock[];
  content:     object[];
}

const BASE = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atnmegastore.shop');
const IMG = '/api/storage/products';

const TEMPLATES: Template[] = [
  {
    id:          'new-arrival-hero',
    name:        'New Arrival — Hero Feature',
    description: 'Announce one new book or product with a large, prominent card and a clear CTA.',
    badge:       'New Arrivals',
    badgeColor:  'bg-[#213885] text-white',
    preview:     [
      { t: 'promo', bg: '#213885' },
      { t: 'heading' },
      { t: 'text', lines: 3 },
      { t: 'product1' },
      { t: 'button' },
    ],
    content: [
      { type:'promo',   content:'🆕 New Arrival — Just In!', code:'', subtext:'Fresh stock available in-store and online', bg:'#213885' },
      { type:'heading', content:'[Book or Product Title]', align:'center' },
      { type:'text',    content:'[Write a short description of this new arrival — author, theme, why customers will love it. 2–3 sentences is perfect.]' },
      { type:'products', items:[{ image:'', title:'[Product Name]', price:'$0.00', link:`${BASE}/products` }] },
      { type:'button',  content:'Shop Now', url:`${BASE}/products`, align:'center' },
    ],
  },

  {
    id:          'two-books-showcase',
    name:        'Two-Book Showcase',
    description: 'Feature two new titles side by side — great for comparing two new arrivals or a bundle offer.',
    badge:       'New Arrivals',
    badgeColor:  'bg-[#213885] text-white',
    preview:     [
      { t: 'promo', bg: '#213885' },
      { t: 'heading' },
      { t: 'text', lines: 2 },
      { t: 'product2' },
      { t: 'button' },
    ],
    content: [
      { type:'promo',    content:'📚 New Titles Just Arrived!', code:'', subtext:'Browse our latest additions', bg:'#213885' },
      { type:'heading',  content:'New Books — Just In', align:'center' },
      { type:'text',     content:'[Introduce both books in 2–3 sentences. Mention the authors, genres, and why they are must-reads.]' },
      { type:'products', items:[
        { image:'', title:'[Book 1 Title]', price:'$0.00', link:`${BASE}/products` },
        { image:'', title:'[Book 2 Title]', price:'$0.00', link:`${BASE}/products` },
      ]},
      { type:'button',   content:'Browse All New Arrivals', url:`${BASE}/products`, align:'center' },
    ],
  },

  {
    id:          'seasonal-discount',
    name:        'Seasonal Sale',
    description: 'A bold promotional banner with a discount code, marketing copy, and a call to action. No products required.',
    badge:       'Promotion',
    badgeColor:  'bg-amber-600 text-white',
    preview:     [
      { t: 'promo', bg: '#b5451b' },
      { t: 'heading' },
      { t: 'text', lines: 4 },
      { t: 'divider' },
      { t: 'text', lines: 2 },
      { t: 'button' },
    ],
    content: [
      { type:'promo',   content:'🎉 [Season] Sale — [X]% Off!', code:'[CODE]', subtext:'Valid [start date] to [end date]', bg:'#b5451b' },
      { type:'heading', content:'Celebrate [Season] with a Great Book', align:'center' },
      { type:'text',    content:"[Write 2–3 sentences about the occasion and what's on sale. Mention categories, free shipping, or any special offer details.]" },
      { type:'divider' },
      { type:'text',    content:'Use code [CODE] at checkout. Cannot be combined with other offers. In-store and online.' },
      { type:'button',  content:'Shop the Sale', url:`${BASE}/products`, align:'center' },
    ],
  },

  {
    id:          'gift-guide',
    name:        'Gift Guide — Two Items',
    description: 'Showcase two gift-worthy books or products, perfect for Eid, birthdays, graduations, or holidays.',
    badge:       'Gift Items',
    badgeColor:  'bg-emerald-700 text-white',
    preview:     [
      { t: 'promo', bg: '#1d4e3a' },
      { t: 'heading' },
      { t: 'text', lines: 2 },
      { t: 'product2' },
      { t: 'divider' },
      { t: 'text', lines: 1 },
      { t: 'button' },
    ],
    content: [
      { type:'promo',    content:'🎁 [Occasion] Gift Ideas', code:'[CODE]', subtext:'[Discount or offer text]', bg:'#1d4e3a' },
      { type:'heading',  content:'Thoughtful Gifts for [Occasion]', align:'center' },
      { type:'text',     content:'[Describe why books make great gifts for this occasion. 2 sentences.]' },
      { type:'products', items:[
        { image:'', title:'[Gift Item 1]', price:'$0.00', link:`${BASE}/products` },
        { image:'', title:'[Gift Item 2]', price:'$0.00', link:`${BASE}/products` },
      ]},
      { type:'divider' },
      { type:'text',    content:'🚚 Free shipping on orders over $50 across Canada. In-store pickup available at Bangla Town, Toronto.' },
      { type:'button',  content:'Shop Gift Items', url:`${BASE}/products?category=gifts`, align:'center' },
    ],
  },

  {
    id:          'islamic-special',
    name:        'Islamic Books Special',
    description: 'Designed for Ramadan, Eid, or any Islamic occasion. Dark-blue theme with one featured Islamic book.',
    badge:       'Islamic',
    badgeColor:  'bg-[#1d3557] text-white',
    preview:     [
      { t: 'promo', bg: '#1d3557' },
      { t: 'heading' },
      { t: 'text', lines: 3 },
      { t: 'product1' },
      { t: 'divider' },
      { t: 'text', lines: 2 },
      { t: 'button' },
    ],
    content: [
      { type:'promo',    content:'🌙 [Occasion] Mubarak!', code:'[CODE]', subtext:'[X]% off all Islamic books', bg:'#1d3557' },
      { type:'heading',  content:'[Occasion] — Islamic Books Collection', align:'center' },
      { type:'text',     content:"[Write a warm, respectful message about the occasion and how books enrich one's faith and knowledge. 2–3 sentences.]" },
      { type:'products', items:[{ image:'', title:'[Featured Islamic Book]', price:'$0.00', link:`${BASE}/products/quran-shoreef-24a` }] },
      { type:'divider' },
      { type:'text',     content:'Use code [CODE] at checkout. Valid throughout [occasion period]. May Allah bless you and your family. 🤲' },
      { type:'button',   content:'Browse Islamic Books', url:`${BASE}/products?category=islamic`, align:'center' },
    ],
  },

  {
    id:          'welcome-customer',
    name:        'Welcome — New Customer Offer',
    description: 'Sent to new subscribers. Introduces the store and provides a first-purchase discount code.',
    badge:       'Customer Welcome',
    badgeColor:  'bg-purple-700 text-white',
    preview:     [
      { t: 'promo', bg: '#213885' },
      { t: 'heading' },
      { t: 'text', lines: 4 },
      { t: 'product2' },
      { t: 'divider' },
      { t: 'text', lines: 2 },
      { t: 'button' },
    ],
    content: [
      { type:'promo',    content:'🙏 Welcome to ATN Book & Crafts!', code:'WELCOME10', subtext:'10% off your first order — no minimum', bg:'#213885' },
      { type:'heading',  content:'Your Welcome Discount Is Ready', align:'center' },
      { type:'text',     content:"Thank you for subscribing! We're Toronto's largest Bengali bookstore, located in Bangla Town. We carry Bengali novels, Islamic literature, children's books, cultural gifts, and much more.\n\nAs a welcome gift, use code WELCOME10 for 10% off your first order. Valid for 30 days." },
      { type:'products', items:[
        { image:'', title:'[Popular Book 1]', price:'$0.00', link:`${BASE}/products` },
        { image:'', title:'[Popular Book 2]', price:'$0.00', link:`${BASE}/products` },
      ]},
      { type:'divider' },
      { type:'text',    content:'Free shipping on orders over $50 · Ships across Canada · In-store pickup in Toronto.' },
      { type:'button',  content:'Start Shopping', url:`${BASE}/products`, align:'center' },
    ],
  },

  {
    id:          'poetry-literature',
    name:        'Poetry & Literature Spotlight',
    description: 'Elegant minimal layout for featuring a classic or literary title. Clean and text-forward.',
    badge:       'Literature',
    badgeColor:  'bg-gray-700 text-white',
    preview:     [
      { t: 'heading' },
      { t: 'divider' },
      { t: 'text', lines: 3 },
      { t: 'product1' },
      { t: 'text', lines: 2 },
      { t: 'button' },
    ],
    content: [
      { type:'heading',  content:'[Title or Theme]', align:'center' },
      { type:'divider' },
      { type:'text',     content:'[An elegant 2–3 sentence introduction to the book or author. This template suits poetry, literary fiction, and classic titles.]' },
      { type:'products', items:[{ image:'', title:'[Featured Book]', price:'$0.00', link:`${BASE}/products` }] },
      { type:'text',     content:'[Add a short author bio or quote from the book to give it a personal, literary feel.]' },
      { type:'button',   content:'Explore the Collection', url:`${BASE}/products?category=poetry`, align:'center' },
    ],
  },

  {
    id:          'childrens-books',
    name:        "Children's Books Collection",
    description: 'Warm, friendly layout for promoting Bengali children\'s books. Green theme, two books side by side.',
    badge:       "Children's",
    badgeColor:  'bg-emerald-600 text-white',
    preview:     [
      { t: 'promo', bg: '#1d4e3a' },
      { t: 'heading' },
      { t: 'text', lines: 3 },
      { t: 'product2' },
      { t: 'text', lines: 2 },
      { t: 'button' },
    ],
    content: [
      { type:'promo',    content:"📖 Bengali Children's Books", code:'KIDS15', subtext:'15% off all children\'s titles', bg:'#1d4e3a' },
      { type:'heading',  content:"Give Your Child the Gift of Bengali Language", align:'center' },
      { type:'text',     content:"[Write 2–3 sentences about why Bengali children's books matter for raising bilingual kids in Canada. Mention the age ranges available.]" },
      { type:'products', items:[
        { image:'', title:"[Children's Book 1]", price:'$0.00', link:`${BASE}/products?category=childrens` },
        { image:'', title:"[Children's Book 2]", price:'$0.00', link:`${BASE}/products?category=childrens` },
      ]},
      { type:'text',     content:"👶 Ages 3–5 · 📚 Ages 6–10 · 🎓 Ages 11–14 · Available in-store and online." },
      { type:'button',   content:"Shop Children's Books", url:`${BASE}/products?category=childrens`, align:'center' },
    ],
  },

  {
    id:          'biography-history',
    name:        'Biography & History',
    description: 'Dark, authoritative theme for biography, memoirs, and history titles. One featured book.',
    badge:       'History & Biography',
    badgeColor:  'bg-stone-700 text-white',
    preview:     [
      { t: 'promo', bg: '#2a0d18' },
      { t: 'heading' },
      { t: 'text', lines: 3 },
      { t: 'product1' },
      { t: 'divider' },
      { t: 'text', lines: 2 },
      { t: 'button' },
    ],
    content: [
      { type:'promo',    content:'📜 [Title or Theme]', code:'HISTORY10', subtext:'10% off all biography & history titles', bg:'#2a0d18' },
      { type:'heading',  content:'[Campaign Title]', align:'center' },
      { type:'text',     content:"[Introduce the book or collection. What period of history? Who are the key figures? Why is this important reading for the Bengali community? 2–3 sentences.]" },
      { type:'products', items:[{ image:'', title:'[Featured Book]', price:'$0.00', link:`${BASE}/products` }] },
      { type:'divider' },
      { type:'text',     content:'[Add any related titles or a sentence about the broader collection.]' },
      { type:'button',   content:'Explore History & Biography', url:`${BASE}/products?category=biography`, align:'center' },
    ],
  },

  {
    id:          'simple-announcement',
    name:        'Simple Announcement',
    description: 'No products, no promo banner. Just a heading, a message, and a button. Perfect for event announcements or store news.',
    badge:       'Announcement',
    badgeColor:  'bg-gray-500 text-white',
    preview:     [
      { t: 'heading' },
      { t: 'divider' },
      { t: 'text', lines: 5 },
      { t: 'spacer' },
      { t: 'button' },
    ],
    content: [
      { type:'heading', content:'[Announcement Title]', align:'center' },
      { type:'divider' },
      { type:'text',    content:"[Write your announcement here. This template is ideal for store hour changes, special events, new location announcements, or any message that doesn't need product images.]\n\n[Add a second paragraph if needed.]" },
      { type:'spacer' },
      { type:'button',  content:'[Button Label]', url:`${BASE}`, align:'center' },
    ],
  },
];

// ── Mini preview component ────────────────────────────────────────────────────

function TemplatePreview({ blocks }: { blocks: PBlock[] }) {
  return (
    <div className="w-full bg-[#e8e2db] p-1.5 rounded-sm select-none">
      <div className="bg-white overflow-hidden">
        {/* Store header — always shown */}
        <div className="h-5 bg-[#213885] flex items-center px-2 gap-1.5">
          <div className="w-12 h-1.5 bg-[#893172] rounded-sm opacity-90" />
          <div className="flex-1" />
          <div className="w-6 h-1.5 bg-[#893172] rounded-sm opacity-50" />
        </div>
        <div className="h-2.5 bg-[#3d0f1e] flex items-center justify-center gap-2 px-2">
          {[1,2,3,4].map(i => <div key={i} className="w-5 h-1 bg-[#7a5060] rounded-sm" />)}
        </div>

        {/* Content blocks */}
        {blocks.map((b, i) => <PBlockView key={i} block={b} />)}

        {/* Footer — always shown */}
        <div className="h-7 bg-[#2a0d18] flex items-end justify-center pb-1">
          <div className="w-20 h-1 bg-[#4a2a1a] rounded-sm" />
        </div>
      </div>
    </div>
  );
}

function PBlockView({ block }: { block: PBlock }) {
  switch (block.t) {
    case 'promo':
      return (
        <div className="px-2 py-0" style={{ background: block.bg }}>
          <div className="py-2.5 flex flex-col items-center gap-1">
            <div className="w-24 h-1.5 bg-white opacity-80 rounded-sm" />
            <div className="w-12 h-2.5 bg-[#893172] rounded-sm mt-0.5 opacity-90" />
          </div>
        </div>
      );
    case 'heading':
      return (
        <div className="px-3 pt-2.5 pb-1 flex flex-col items-center gap-1">
          <div className="w-20 h-2 bg-gray-700 rounded-sm" />
        </div>
      );
    case 'text':
      return (
        <div className="px-3 py-1.5 flex flex-col gap-1">
          {Array.from({ length: block.lines ?? 2 }).map((_, i) => (
            <div key={i} className={`h-1 bg-gray-200 rounded-sm ${i === (block.lines ?? 2) - 1 ? 'w-3/4' : 'w-full'}`} />
          ))}
        </div>
      );
    case 'product1':
      return (
        <div className="px-2 py-1.5">
          <div className="border border-gray-200 flex overflow-hidden">
            <div className="w-14 h-14 bg-[#f0e8df] shrink-0" />
            <div className="flex-1 px-2 py-1.5 flex flex-col justify-between">
              <div className="w-full h-1.5 bg-gray-300 rounded-sm" />
              <div className="w-10 h-2 bg-[#213885] rounded-sm opacity-70" />
              <div className="w-12 h-2.5 bg-[#213885] rounded-sm" />
            </div>
          </div>
        </div>
      );
    case 'product2':
      return (
        <div className="px-2 py-1.5 flex gap-1.5">
          {[0, 1].map(i => (
            <div key={i} className="flex-1 border border-gray-200 overflow-hidden">
              <div className="w-full h-10 bg-[#f0e8df]" />
              <div className="p-1.5 flex flex-col gap-1">
                <div className="w-full h-1 bg-gray-300 rounded-sm" />
                <div className="w-8 h-1.5 bg-[#213885] rounded-sm opacity-70" />
                <div className="w-full h-2 bg-[#213885] rounded-sm mt-0.5" />
              </div>
            </div>
          ))}
        </div>
      );
    case 'button':
      return (
        <div className="px-3 py-2 flex justify-center">
          <div className="w-20 h-3 bg-[#213885] rounded-sm" />
        </div>
      );
    case 'divider':
      return <div className="mx-3 my-1.5 border-t border-gray-200" />;
    case 'spacer':
      return <div className="h-2" />;
    default:
      return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router           = useRouter();
  const { user }         = useAuthStore();
  const [creating, setCreating] = useState<string | null>(null);
  const [hovered, setHovered]   = useState<string | null>(null);

  async function handleSelect(template: Template) {
    if (creating) return;
    setCreating(template.id);
    try {
      const { data } = await api.post('/admin/campaigns', {
        title:      template.name,
        subject:    '[Edit subject line here]',
        from_name:  'ATN Book & Crafts',
        from_email: 'info@atnmegastore.ca',
        recipients: 'newsletter',
        content:    template.content,
      });
      router.push(`/admin/campaigns/${data.id}/edit`);
    } catch {
      toast.error('Failed to create campaign. Please try again.');
      setCreating(null);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <Link href="/admin/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1a]"
          style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
          Choose a Template
        </h1>
        <p className="text-[#6b6b6b] text-sm mt-1">
          Pick the layout that best fits your campaign. You can customise everything — text, images, products, colours — after selecting.
        </p>
      </div>

      {/* Template grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 xl:gap-6">
          {TEMPLATES.map(template => {
            const isCreating = creating === template.id;
            const isHovered  = hovered  === template.id;
            return (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                onMouseEnter={() => setHovered(template.id)}
                onMouseLeave={() => setHovered(null)}
                disabled={!!creating}
                className={`group text-left bg-white border-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
                  isHovered && !creating
                    ? 'border-[#213885] shadow-lg -translate-y-0.5'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Visual preview */}
                <div className="p-3 bg-gray-50 border-b border-gray-100">
                  <TemplatePreview blocks={template.preview} />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-semibold text-[#1a1a1a] leading-snug">{template.name}</p>
                    {isCreating && <Loader2 className="w-4 h-4 text-[#213885] animate-spin shrink-0 mt-0.5" />}
                    {isHovered && !creating && !isCreating && <Check className="w-4 h-4 text-[#213885] shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-xs text-[#6b6b6b] leading-relaxed mb-3">{template.description}</p>
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${template.badgeColor}`}>
                    {template.badge}
                  </span>
                </div>

                {/* Use button */}
                <div className={`mx-4 mb-4 py-2 text-xs font-semibold text-center transition-colors ${
                  isHovered && !creating
                    ? 'bg-[#213885] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isCreating ? 'Creating…' : 'Use This Template →'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
