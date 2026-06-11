'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/navigation';
import api from '@/lib/api';
import { BookOpen, Search, ArrowRight } from 'lucide-react';

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  published_at: string;
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPage() {
  const [posts, setPosts]     = useState<Post[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/posts', { params: { page, per_page: 9, search: query || undefined } })
      .then(res => { setPosts(res.data.data); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  }, [page, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
    setPage(1);
  };

  const [featured, ...rest] = posts;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-[#213885] text-xs tracking-[0.2em] uppercase font-semibold mb-2">From Our Store</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
          Articles & Stories
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
          Reading inspiration, cultural greetings, gift guides, and community stories from the ATN Book & Crafts family.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex max-w-md mx-auto mb-12 gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
        </div>
        <button type="submit" className="bg-[#213885] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#5f3475]">
          Search
        </button>
      </form>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-72" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No articles found.</p>
        </div>
      ) : (
        <>
          {/* Featured (first post, full-width) */}
          {featured && !query && page === 1 && (
            <Link href={`/blog/${featured.slug}`} className="group block mb-10 rounded-2xl overflow-hidden border hover:border-[#213885]/30 hover:shadow-lg transition-all bg-white">
              <div className="md:flex">
                <div className="md:w-1/2 h-56 md:h-auto bg-gray-100 relative overflow-hidden">
                  {featured.cover_image_url ? (
                    <img src={featured.cover_image_url} alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#213885] to-[#5f3475]">
                      <BookOpen size={48} className="text-white/30" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-[#893172] text-[#213885] text-xs font-bold px-2.5 py-1 rounded-full">Latest</span>
                </div>
                <div className="p-8 md:w-1/2 flex flex-col justify-center">
                  <p className="text-xs text-gray-400 mb-2">{fmtDate(featured.published_at)} · {featured.author_name}</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#213885] transition-colors leading-snug"
                    style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                    {featured.title}
                  </h2>
                  {featured.excerpt && <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-3">{featured.excerpt}</p>}
                  <span className="flex items-center gap-1 text-sm font-semibold text-[#213885]">
                    Read Article <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(query || page > 1 ? posts : rest).map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group block bg-white rounded-xl border hover:border-[#213885]/30 hover:shadow-md transition-all overflow-hidden">
                <div className="h-44 bg-gray-100 overflow-hidden relative">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#213885] to-[#5f3475]">
                      <BookOpen size={32} className="text-white/30" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-gray-400 mb-2">{fmtDate(post.published_at)}</p>
                  <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#213885] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>}
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#213885]">
                    Read more <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {total > 9 && (
            <div className="flex justify-center gap-2 mt-10">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {Math.ceil(total / 9)}</span>
              <button disabled={posts.length < 9} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
