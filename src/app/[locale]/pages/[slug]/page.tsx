import { notFound } from 'next/navigation';

interface CmsPage { title: string; content: string | null; meta_title: string | null; meta_description: string | null; is_published: boolean; }

async function getPage(slug: string): Promise<CmsPage | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api'}/pages/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function CmsPagePage({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);
  if (!page || !page.is_published) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>{page.title}</h1>
      {page.content ? (
        <div className="prose prose-sm max-w-none text-[#1a1a1a]" dangerouslySetInnerHTML={{ __html: page.content }} />
      ) : (
        <p className="text-[#6b6b6b]">This page has no content yet.</p>
      )}
    </div>
  );
}
