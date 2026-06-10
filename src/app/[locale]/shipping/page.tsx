import PolicyLayout from '@/components/PolicyLayout';
import { Link } from '@/navigation';
import { Store, MapPin } from 'lucide-react';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Shipping Policy — ATNMegaStore' };

function InfoCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-5 bg-[#ecdfd2] border border-[#cccacc] mb-4">
      <div className="shrink-0 mt-0.5 text-[#213885]">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-[#1a1a1a] text-sm mb-1">{title}</p>
        <div className="text-sm text-[#444] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default async function ShippingPage() {
  const s = await getSettings();
  return (
    <PolicyLayout
      title="Shipping Policy"
      subtitle="We ship across Canada and the USA from our Toronto store. All orders are processed within 3 business days of confirmed payment."
      lastUpdated="June 1, 2026"
    >
      <InfoCard icon={MapPin} title="Ships From Toronto, Canada">
        All orders ship from our store at <strong>{s.site_address}, {s.site_city}</strong>.
        We ship to Canada and the United States.
      </InfoCard>

      <InfoCard icon={Store} title="Free In-Store Pickup — No Shipping Cost">
        Select <strong>Pay at Store</strong> at checkout to pick up your order at no shipping cost.
        We are open <strong>{s.site_hours}</strong>.
        See <Link href="/store-location">Store Location &amp; Hours</Link> for details.
      </InfoCard>

      <h2>Shipping Rates</h2>
      <table>
        <thead>
          <tr><th>Destination</th><th>Shipping Cost</th></tr>
        </thead>
        <tbody>
          <tr><td>Greater Toronto Area (GTA)</td><td>Minimum $10 or 15% of order value, whichever is higher</td></tr>
          <tr><td>Rest of Canada</td><td>Minimum $20 or 20% of order value, whichever is higher</td></tr>
          <tr><td>United States</td><td>Minimum $30 or 20% of order value, whichever is higher</td></tr>
          <tr><td>Other Countries</td><td>Subject to special terms — contact us for a quote</td></tr>
        </tbody>
      </table>
      <p>Expedited shipping is available on request and will cost extra depending on your location.</p>

      <h2>Order Processing</h2>
      <p>
        <strong>Payment must be confirmed</strong> before processing begins. For Interac e-Transfer orders,
        processing starts once we receive your payment. For Stripe card payments, processing begins immediately after successful payment.
      </p>
      <p>
        Orders are processed within <strong>3 business days</strong> of confirmed payment. Pickup orders
        are ready the <strong>next business day</strong>.
      </p>

      <h2>Estimated Delivery Times</h2>
      <table>
        <thead>
          <tr><th>Destination</th><th>Estimated Delivery</th></tr>
        </thead>
        <tbody>
          <tr><td>Canada</td><td>5 – 7 business days after dispatch</td></tr>
          <tr><td>United States</td><td>7 – 10 business days after dispatch (subject to customs)</td></tr>
          <tr><td>Pre-sale / Special Orders</td><td>6 – 8 weeks unless otherwise noted</td></tr>
        </tbody>
      </table>
      <p>
        Delivery times are estimates only and may vary due to Canada Post / courier schedules, weather,
        peak holiday periods, and US customs clearance.
      </p>

      <h2>Shipping Carriers</h2>
      <p>
        We ship via Canada Post and select courier partners. Once dispatched, you will receive a shipping
        confirmation with tracking information where available.
      </p>

      <h2>Tracking Your Order</h2>
      <p>
        Registered account holders can check their order status at any time by visiting{' '}
        <Link href="/orders">My Orders</Link>. You will also receive email notifications when your order status
        changes to "Shipped." If you checked out as a guest, please contact us with your Order Number for
        a status update.
      </p>

      <h2>Shipping Outside Canada</h2>
      <p>
        At this time, we primarily ship within Canada. If you are located outside Canada and would like to
        inquire about international shipping, please contact us at{' '}
        <a href={`mailto:${s.site_email}`}>{s.site_email}</a> and we will do our best to assist.
        International orders may be subject to customs duties and import taxes, which are the responsibility
        of the recipient.
      </p>

      <h2>Damaged, Lost, or Incorrect Orders</h2>
      <div className="callout">
        <p>
          If your order arrives damaged, is lost in transit, or contains the wrong items, please contact us
          within <strong>7 days of the expected delivery date</strong> at{' '}
          <a href={`mailto:${s.site_email}`}>{s.site_email}</a>. Include your Order Number and,
          for damaged items, a photo of the damage. We will arrange a replacement or refund promptly.
        </p>
      </div>

      <h2>Address Accuracy</h2>
      <p>
        Please double-check your shipping address before completing your order. We are not responsible for
        orders shipped to an incorrect address provided by the customer. If you notice an error in your
        address after placing an order, contact us immediately at{' '}
        <a href={`mailto:${s.site_email}`}>{s.site_email}</a> — we will do our best to correct
        it before the order is dispatched.
      </p>

      <h2>Undeliverable Packages</h2>
      <p>
        If a package is returned to us as undeliverable (wrong address, unclaimed, refused), we will
        contact you to arrange reshipment. Additional shipping charges may apply. If we are unable to reach
        you within 14 days, a refund of the product cost (less the original shipping charge) may be issued.
      </p>

      <hr />
      <p>
        Still have questions? Visit our <Link href="/faq">FAQ page</Link> or{' '}
        <Link href="/contact">contact us</Link> directly.
      </p>
    </PolicyLayout>
  );
}
