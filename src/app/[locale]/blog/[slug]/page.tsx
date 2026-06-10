'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/navigation';
import api from '@/lib/api';
import { BookOpen, ArrowLeft, CalendarDays, User } from 'lucide-react';

type Tag = { id: number; name: string; slug: string };
type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: string;
  tags?: Tag[];
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost]       = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/posts/${slug}`)
      .then(res => setPost(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-20 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-10 bg-gray-200 rounded w-3/4" />
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );

  if (notFound || !post) return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
      <p className="text-gray-500">Article not found.</p>
      <Link href="/blog" className="mt-4 inline-block text-[#213885] font-semibold">← Back to Articles</Link>
    </div>
  );

  return (
    <div className="bg-[#ecdfd2] min-h-screen">
      {/* Hero image */}
      {post.cover_image_url && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#213885] mb-8 transition-colors">
          <ArrowLeft size={15} /> Back to Articles
        </Link>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-[#cccacc]">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-[#213885]" />
            {fmtDate(post.published_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <User size={14} className="text-[#213885]" />
            {post.author_name}
          </span>
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-gray-600 leading-relaxed mb-8 italic border-l-4 border-[#893172] pl-5">
            {post.excerpt}
          </p>
        )}

        {/* Body — server-sanitized HTML from TipTap editor */}
        <div
          className="prose prose-gray max-w-none text-gray-700 leading-relaxed text-[15px]
            prose-headings:font-bold prose-headings:text-gray-900
            prose-a:text-[#213885] prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-[#893172] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
            prose-img:rounded-lg prose-img:shadow-sm prose-img:mx-auto"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-[#cccacc] flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <a key={tag.slug} href={`/blog?tag=${tag.slug}`}
                className="inline-block bg-[#ede8f8] hover:bg-[#e8e3f0] text-[#213885] text-xs px-3 py-1.5 rounded-full font-medium transition-colors">
                #{tag.name}
              </a>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#cccacc] flex items-center justify-between flex-wrap gap-4">
          <Link href="/blog"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#213885] hover:text-[#081849] transition-colors">
            <ArrowLeft size={14} /> More Articles
          </Link>
          <Link href="/products"
            className="text-sm font-semibold text-[#213885] border-b border-[#213885] pb-0.5 hover:text-[#893172] hover:border-[#893172] transition-colors">
            Browse Our Store →
          </Link>
        </div>
      </div>
    </div>
  );
}
