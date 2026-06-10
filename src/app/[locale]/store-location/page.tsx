import { Link } from '@/navigation';
import { MapPin, Clock, Phone, Mail, Car, Bus, ChevronRight, Store } from 'lucide-react';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Store Location & Hours — ATN Mega Store' };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default async function StoreLocationPage() {
  const s = await getSettings();

  const dailyHours = s.site_hours.includes('·')
    ? s.site_hours.split('·').slice(1).join('·').trim()
    : s.site_hours;

  const mapsQuery = encodeURIComponent(`${s.site_address} ${s.site_city} ${s.site_country}`);
  const mapsUrl   = `https://maps.google.com/?q=${mapsQuery}`;
  const mapsEmbed = `https://maps.google.com/maps?q=${mapsQuery}&output=embed`;

  return (
    <div className="bg-[#ecdfd2] min-h-screen">

      {/* Hero */}
      <div className="bg-[#213885] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-[#5f3475] text-xs mb-4">
            <Link href="/" className="hover:text-[#893172] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#f0c0a0]">Store Location</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Visit Us In Store
          </h1>
          <p className="text-[#f0c0a0] text-base max-w-xl mt-2">
            Located in the heart of Toronto's Bangla Town — Danforth & Victoria Park. Browse our full selection of books and gifts in person.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Info column */}
          <div className="space-y-6">

            {/* Address */}
            <div className="bg-white border border-[#cccacc] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#e8e3f0] p-3 text-[#213885]"><MapPin className="w-5 h-5" /></div>
                <h2 className="text-lg font-bold text-[#1a1a1a]"
                  style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Address</h2>
              </div>
              <address className="not-italic text-sm text-[#444] leading-relaxed">
                <strong className="text-[#1a1a1a]">{s.site_name}</strong><br />
                {s.site_address}<br />
                {s.site_city}<br />
                {s.site_country}
              </address>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block mt-4 text-sm text-[#213885] font-medium hover:underline">
                Open in Google Maps →
              </a>
            </div>

            {/* Contact */}
            <div className="bg-white border border-[#cccacc] p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#1a1a1a]"
                style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Contact</h2>
              <div className="flex items-center gap-3 text-sm text-[#444]">
                <Phone className="w-4 h-4 text-[#6b6b6b] shrink-0" />
                <div>
                  <a href={`tel:+1${s.site_phone.replace(/\D/g, '')}`} className="hover:text-[#213885] transition-colors">{s.site_phone}</a>
                  {s.site_phone_2 && (
                    <>
                      <span className="mx-2 text-[#ccc]">|</span>
                      <a href={`tel:+1${s.site_phone_2.replace(/\D/g, '')}`} className="hover:text-[#213885] transition-colors">{s.site_phone_2}</a>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#444]">
                <Mail className="w-4 h-4 text-[#6b6b6b] shrink-0" />
                <a href={`mailto:${s.site_email}`} className="hover:text-[#213885] transition-colors">{s.site_email}</a>
              </div>
            </div>

            {/* Getting here */}
            <div className="bg-white border border-[#cccacc] p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#1a1a1a]"
                style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Getting Here</h2>
              <div className="flex gap-3">
                <Car className="w-4 h-4 text-[#6b6b6b] shrink-0 mt-0.5" />
                <div className="text-sm text-[#444]">
                  <p className="font-medium text-[#1a1a1a]">By Car</p>
                  <p>Located on Danforth Ave near Victoria Park. Street parking available on Danforth and surrounding side streets.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Bus className="w-4 h-4 text-[#6b6b6b] shrink-0 mt-0.5" />
                <div className="text-sm text-[#444]">
                  <p className="font-medium text-[#1a1a1a]">By Transit (TTC)</p>
                  <p>Take the Bloor-Danforth subway to Victoria Park Station (Line 2). We are a short walk east along Danforth Avenue.</p>
                </div>
              </div>
            </div>

            {/* In-store pickup */}
            <div className="bg-[#213885] text-white p-6">
              <div className="flex items-center gap-3 mb-3">
                <Store className="w-5 h-5 text-[#893172]" />
                <h3 className="font-semibold">Online Order Pickup</h3>
              </div>
              <p className="text-sm text-[#f0c0a0] leading-relaxed">
                Selected <strong className="text-white">Pay at Store</strong> at checkout? Bring your{' '}
                <strong className="text-white">Order Number</strong> — we'll have your items ready. Items are held for up to 7 days.
              </p>
            </div>
          </div>

          {/* Hours column */}
          <div>
            <div className="bg-white border border-[#cccacc] p-6 mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-[#e8e3f0] p-3 text-[#213885]"><Clock className="w-5 h-5" /></div>
                <h2 className="text-lg font-bold text-[#1a1a1a]"
                  style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Store Hours</h2>
              </div>

              <div className="bg-[#e8e3f0] border border-[#cccacc] px-4 py-3 mb-4 text-center">
                <p className="text-[#213885] font-semibold text-sm">Open 7 Days a Week</p>
                <p className="text-2xl font-bold text-[#213885] mt-1">{dailyHours}</p>
              </div>

              <div className="space-y-1">
                {DAYS.map((day) => {
                  const today = new Date().toLocaleDateString('en-CA', { weekday: 'long' });
                  const isToday = day === today;
                  return (
                    <div key={day}
                      className={`flex justify-between py-2.5 px-3 text-sm ${isToday ? 'bg-[#e8e3f0] font-semibold' : 'border-b border-[#e8e3f0] last:border-0'}`}>
                      <span className={isToday ? 'text-[#213885]' : 'text-[#444]'}>
                        {day}{isToday && ' (Today)'}
                      </span>
                      <span className={isToday ? 'text-[#213885]' : 'text-[#1a1a1a]'}>{dailyHours}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[#9b9590] mt-4">
                * Hours may vary on statutory holidays. Call us to confirm.
              </p>
            </div>

            {/* Map embed */}
            <div className="bg-white border border-[#cccacc] overflow-hidden">
              <iframe
                src={mapsEmbed}
                width="100%"
                height="220"
                style={{ border: 0 }}
                loading="lazy"
                title={`${s.site_name} location map`}
              />
              <div className="p-4">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-[#213885] text-[#213885] font-semibold px-4 py-2.5 text-sm hover:bg-[#e8e3f0] transition-colors">
                  <MapPin className="w-4 h-4" /> Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
