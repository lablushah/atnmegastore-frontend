import { Link } from '@/navigation';
import { getSettings } from '@/lib/settings';
import { ChevronRight, BookOpen, Heart, Globe, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'About Us — ATN Mega Store',
  description: "North America's largest Bengali bookstore and crafts shop, located in Toronto's Bangla Town for over 20 years.",
};

const VALUES = [
  {
    icon: BookOpen,
    title: 'Love of Literature',
    desc: 'We bring together the finest books from Bangladesh and India — novels, poetry, history, Islamic texts, and more — under one roof.',
  },
  {
    icon: Globe,
    title: 'Cultural Heritage',
    desc: "Our mission is to promote and preserve Bengali language, culture, and heritage within Canada's rich multicultural community.",
  },
  {
    icon: Heart,
    title: 'Community First',
    desc: "For over two decades we have been a gathering place for Toronto's South Asian community — a home away from home.",
  },
  {
    icon: ShieldCheck,
    title: 'Trusted Service',
    desc: 'Every transaction is secure and every customer is treated with care. Your trust is the foundation of everything we do.',
  },
];

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <div className="bg-[#ecdfd2] min-h-screen">

      {/* Hero */}
      <div className="bg-[#213885] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-[#5f3475] text-xs mb-4">
            <Link href="/" className="hover:text-[#893172] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#f0c0a0]">About Us</span>
          </div>
          <p className="text-[#893172] text-xs tracking-[0.25em] uppercase font-semibold mb-3">Est. over 20 years ago</p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Toronto's Home for<br />Bengali Books & Culture
          </h1>
          <p className="text-[#f0c0a0] text-base sm:text-lg max-w-2xl leading-relaxed">
            Situated in the heart of Danforth &amp; Victoria Park — Toronto's vibrant Bangla Town — ATN Mega Store
            is one of North America's largest bookstores and crafts shops dedicated to Bengali and South Asian culture.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* English about us */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4"
              style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
              Our Story
            </h2>
            <div className="space-y-4 text-[#444] text-sm leading-relaxed">
              <p>
                ATN Mega Store has been a cornerstone of Toronto's Bengali community for over twenty years.
                From our location on Danforth Avenue in the neighbourhood affectionately known as "Bangla Town,"
                we have served thousands of customers with an unwavering commitment to quality and professional service.
              </p>
              <p>
                What began as a modest bookshop has grown into one of North America's most comprehensive destinations
                for Bengali literature, Islamic books, religious texts, cultural crafts, and South Asian souvenirs.
                We carry titles from prominent authors in both Bangladesh and India — spanning novels, short stories,
                poetry, history, biography, children's books, and much more.
              </p>
              <p>
                Our mission goes beyond retail. We believe that books and cultural products are bridges — connecting
                generations, preserving heritage, and nurturing identity within Canada's multicultural society.
              </p>
            </div>
          </div>

          {/* Bengali about us */}
          <div className="bg-white border border-[#cccacc] p-6">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-4"
              style={{ fontFamily: 'Georgia, serif' }}>
              আমাদের কথা
            </h2>
            <div className="space-y-3 text-[#444] text-sm leading-relaxed">
              <p>
                কানাডার টরন্টোর বাংলা টাউন হিসেবে খ্যাত ডেনফোর্থ ও ভিক্টোরিয়া পার্ক এলাকায় অবস্থিত
                এটিএন মেগা স্টোর উত্তর আমেরিকার অন্যতম বৃহৎ বই ও কুটির শিল্প সংগ্রহশালা।
              </p>
              <p>
                বিগত প্রায় দুই দশকের বেশি সময় ধরে নিরবচ্ছিন্নভাবে পেশাদার সেবা দিয়ে প্রতিষ্ঠানটি
                ক্রেতাসাধারণের মনে বিশেষ স্থান করে নিয়েছে।
              </p>
              <p>
                কানাডার বহুজাতিক সংস্কৃতির মূলধারায় বাংলা ভাষা, কৃষ্টি, সংস্কৃতি, ইতিহাস ও ঐতিহ্য
                তুলে ধরাই আমাদের অন্যতম লক্ষ্য।
              </p>
              <p>
                এখন আপনি ঘরে বসে আপনার চাহিদামতো কেনাকাটা করতে পারবেন।
                আমাদের ডেলিভারি ক্যারিয়ার আপনার কাঙ্ক্ষিত পণ্য যথাসময়ে আপনার ঘরে পৌঁছে দেবে।
              </p>
            </div>
          </div>
        </div>

        {/* What we carry */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            What We Carry
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['📚', 'Bengali & English Books', "Novels, poetry, history, biography, children's books and more from Bangladesh and India."],
              ['🕌', 'Islamic Literature', 'Quran, Hadith, Tafsir, Doa-Darud, and books on Islamic history and spirituality.'],
              ['📖', 'Religious Texts', 'Bengali Gita, Ramayana, Mahabharata, Bible, Tripitaka, and other sacred texts.'],
              ['🎭', 'Handicrafts & Souvenirs', 'Naxikantha, terracotta, clay pottery, jute crafts, wooden and bamboo items.'],
              ['🎮', 'Games & Gifts', 'Chess, Ludo, Carrom boards, and unique gift items for every occasion.'],
              ['📰', 'Magazines & Periodicals', 'Monthly and bi-weekly publications including special Eid and Puja editions.'],
            ].map(([emoji, title, desc]) => (
              <div key={title} className="bg-white border border-[#cccacc] p-4 flex gap-3">
                <span className="text-2xl shrink-0">{emoji}</span>
                <div>
                  <p className="font-semibold text-[#1a1a1a] text-sm">{title}</p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Our Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="shrink-0 bg-[#e8e3f0] p-3 text-[#213885] h-fit">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a1a] mb-1">{title}</p>
                  <p className="text-sm text-[#6b6b6b] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#213885] text-white p-8 text-center">
          <h2 className="text-2xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Come Visit Us
          </h2>
          <p className="text-[#f0c0a0] text-sm mb-6 max-w-md mx-auto">
            {s.site_address}, {s.site_city} · {s.site_hours}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/products"
              className="bg-[#893172] hover:bg-[#c09828] text-[#213885] font-bold px-6 py-3 text-sm uppercase tracking-wide transition-colors">
              Shop Online
            </Link>
            <Link href="/store-location"
              className="border-2 border-white hover:border-[#893172] text-white hover:text-[#893172] font-bold px-6 py-3 text-sm uppercase tracking-wide transition-colors">
              Get Directions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
