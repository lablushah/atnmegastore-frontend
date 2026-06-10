import { Link } from '@/navigation';
import { Mail, Clock, Phone, MapPin, ChevronRight } from 'lucide-react';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Contact Us — ATN Mega Store' };

export default async function ContactPage() {
  const s = await getSettings();

  return (
    <div className="bg-[#ecdfd2] min-h-screen">

      {/* Hero */}
      <div className="bg-[#213885] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-[#5f3475] text-xs mb-4">
            <Link href="/" className="hover:text-[#893172] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#f0c0a0]">Contact Us</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Get in Touch
          </h1>
          <p className="text-[#f0c0a0] text-base max-w-xl mt-2">
            We'd love to hear from you. Whether you have a question about an order, a product, or just want to say hello — we're here to help.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Contact methods */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
              Ways to Reach Us
            </h2>

            <div className="bg-white border border-[#cccacc] p-6 flex gap-4">
              <div className="shrink-0 bg-[#e8e3f0] p-3 text-[#213885]">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a] mb-1">Phone</p>
                <a href={`tel:+1${s.site_phone.replace(/\D/g, '')}`} className="text-[#213885] font-medium hover:underline text-sm block">{s.site_phone}</a>
                {s.site_phone_2 && (
                  <a href={`tel:+1${s.site_phone_2.replace(/\D/g, '')}`} className="text-[#213885] font-medium hover:underline text-sm block">{s.site_phone_2}</a>
                )}
                <p className="text-xs text-[#6b6b6b] mt-1">{s.site_hours}</p>
              </div>
            </div>

            <div className="bg-white border border-[#cccacc] p-6 flex gap-4">
              <div className="shrink-0 bg-[#e8e3f0] p-3 text-[#213885]">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a] mb-1">Email</p>
                <a href={`mailto:${s.site_email}`} className="text-[#213885] font-medium hover:underline text-sm block">{s.site_email}</a>
                {s.site_email_2 && (
                  <a href={`mailto:${s.site_email_2}`} className="text-[#213885] font-medium hover:underline text-sm block">{s.site_email_2}</a>
                )}
                <p className="text-xs text-[#6b6b6b] mt-1">We typically respond within 1 business day.</p>
              </div>
            </div>

            <div className="bg-white border border-[#cccacc] p-6 flex gap-4">
              <div className="shrink-0 bg-[#e8e3f0] p-3 text-[#213885]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a] mb-1">Visit Us In Store</p>
                <address className="not-italic text-sm text-[#444] leading-relaxed">
                  {s.site_address}<br />
                  {s.site_city}
                </address>
                <p className="text-xs text-[#6b6b6b] mt-1">{s.site_hours}</p>
                <Link href="/store-location"
                  className="inline-block mt-2 text-sm text-[#213885] font-medium hover:underline">
                  View map & directions →
                </Link>
              </div>
            </div>

            <div className="bg-white border border-[#cccacc] p-6 flex gap-4">
              <div className="shrink-0 bg-[#e8e3f0] p-3 text-[#213885]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a] mb-1">Interac e-Transfer</p>
                <p className="text-xs text-[#6b6b6b] mb-1">Send payment to either address:</p>
                <p className="text-sm font-mono text-[#213885]">{s.interac_email}</p>
                {s.site_email_2 && (
                  <p className="text-sm font-mono text-[#213885]">{s.site_email_2}</p>
                )}
              </div>
            </div>
          </div>

          {/* Mailto form proxy */}
          <div className="bg-white border border-[#cccacc] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-5"
              style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
              Send Us a Message
            </h2>
            <p className="text-sm text-[#6b6b6b] mb-6 leading-relaxed">
              Use the button below to email us directly, or call us at <strong>{s.site_phone}</strong>{s.site_phone_2 && <> / <strong>{s.site_phone_2}</strong></>} during store hours.
            </p>

            <div className="space-y-4">
              <div className="bg-[#ecdfd2] border border-[#cccacc] p-4">
                <p className="text-xs text-[#6b6b6b] mb-1 font-medium uppercase tracking-wide">Our email</p>
                <p className="text-sm font-mono text-[#213885] font-semibold select-all">{s.site_email}</p>
              </div>

              <a href={`mailto:${s.site_email}?subject=Customer Enquiry — ${s.site_name}`}
                className="flex items-center justify-center gap-2 w-full bg-[#213885] hover:bg-[#081849] text-white font-semibold px-5 py-3 text-sm tracking-wide transition-colors">
                <Mail className="w-4 h-4" /> Open Email App
              </a>
            </div>

            <hr className="my-6 border-[#cccacc]" />

            <h3 className="font-semibold text-[#1a1a1a] text-sm mb-3">Common Enquiries</h3>
            <ul className="space-y-2 text-sm">
              {[
                ['Order status or tracking', 'Subject: Order #YOUR_ORDER_NUMBER — Status'],
                ['Return or exchange request', 'Subject: Return Request — Order #YOUR_ORDER_NUMBER'],
                ['Product availability question', 'Subject: Product Enquiry'],
                ['Interac e-Transfer confirmation', 'Subject: e-Transfer — Order #YOUR_ORDER_NUMBER'],
              ].map(([label, hint]) => (
                <li key={label} className="flex flex-col">
                  <span className="text-[#1a1a1a] font-medium">{label}</span>
                  <span className="text-[#9b9590] text-xs">{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10 pt-8 border-t border-[#cccacc]">
          <p className="text-sm text-[#6b6b6b] mb-4 font-medium">You may also find your answer in one of these:</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'FAQs', href: '/faq' },
              { label: 'Shipping Policy', href: '/shipping' },
              { label: 'Returns & Exchanges', href: '/returns' },
              { label: 'Store Location', href: '/store-location' },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                className="px-4 py-2 text-sm border border-[#cccacc] bg-white text-[#213885] font-medium hover:bg-[#e8e3f0] transition-colors">
                {label} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
