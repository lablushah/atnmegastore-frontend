'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import api from '@/lib/api';

type Tag = { id: number; name: string; slug: string };

interface Props {
  selected: string[];           // array of slugs
  onChange: (slugs: string[]) => void;
  adminEndpoint?: boolean;      // true = use /admin/tags, false = /tags
}

export default function TagInput({ selected, onChange, adminEndpoint = true }: Props) {
  const [allTags, setAllTags]   = useState<Tag[]>([]);
  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ep = adminEndpoint ? '/admin/tags' : '/tags';
    api.get(ep).then(r => setAllTags(r.data)).catch(() => {});
  }, [adminEndpoint]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = allTags.filter(t =>
    !selected.includes(t.slug) &&
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (slug: string) => {
    onChange(selected.includes(slug) ? selected.filter(s => s !== slug) : [...selected, slug]);
    setQuery('');
  };

  const createTag = async () => {
    if (!query.trim() || creating) return;
    setCreating(true);
    try {
      const res = await api.post('/admin/tags', { name: query.trim() });
      setAllTags(prev => [...prev, res.data]);
      onChange([...selected, res.data.slug]);
      setQuery('');
    } catch {}
    finally { setCreating(false); }
  };

  const selectedTags = allTags.filter(t => selected.includes(t.slug));

  return (
    <div ref={ref} className="relative">
      {/* Selected chips */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTags.map(tag => (
            <span key={tag.slug}
              className="inline-flex items-center gap-1 bg-[#213885]/10 text-[#213885] text-xs px-2.5 py-1 rounded-full font-medium">
              {tag.name}
              <button type="button" onClick={() => toggle(tag.slug)} className="hover:text-red-600 transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Add tag…"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30"
        />
      </div>

      {/* Dropdown */}
      {open && (query || filtered.length > 0) && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(tag => (
            <button key={tag.slug} type="button" onClick={() => { toggle(tag.slug); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
              <Plus size={12} className="text-gray-400" /> {tag.name}
            </button>
          ))}
          {query && !allTags.some(t => t.name.toLowerCase() === query.toLowerCase()) && (
            <button type="button" onClick={createTag} disabled={creating}
              className="w-full text-left px-3 py-2 text-sm text-[#213885] font-medium hover:bg-[#213885]/5 flex items-center gap-2 border-t">
              <Plus size={12} /> Create &ldquo;{query}&rdquo;
            </button>
          )}
          {filtered.length === 0 && !query && (
            <div className="px-3 py-2 text-xs text-gray-400">All tags selected</div>
          )}
        </div>
      )}
    </div>
  );
}
