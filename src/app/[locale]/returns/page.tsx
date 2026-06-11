import PolicyLayout from '@/components/PolicyLayout';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Return Policy — ATN Book & Crafts' };

export default async function ReturnsPage() {
  const s = await getSettings();
  return (
    <PolicyLayout
      title="Return Policy"
      subtitle="Please read our return policy carefully before placing your order."
      lastUpdated="June 1, 2026"
    >
      <div className="callout">
        <p>
          <strong>All product sales are final, non-return and non-refundable</strong> unless there is a
          manufacturing fault. In the case of a manufacturing defect, the item will be replaced with the
          same product at no additional cost, or store credit will be issued in lieu of a replacement.
        </p>
      </div>

      <h2>Manufacturing Defects</h2>
      <p>
        If your item has a manufacturing defect, please contact us within <strong>7 days of delivery</strong> at{' '}
        <a href={`mailto:${s.site_email}`}>{s.site_email}</a> with:
      </p>
      <ul>
        <li>Your Order Number</li>
        <li>A description of the defect</li>
        <li>A photo showing the issue</li>
      </ul>
      <p>
        We will arrange a replacement of the same product or provide store credit. Return shipping for
        defective items is covered by us.
      </p>

      <h2>Wrong or Missing Items</h2>
      <p>
        If you received the wrong item or your order is missing an item, please contact us within{' '}
        <strong>7 days of delivery</strong>. We will resolve the issue promptly at no cost to you.
      </p>

      <h2>Pre-Sale Orders</h2>
      <p>
        Pre-sale orders may be cancelled by the customer before the item ships. Once shipped, the standard
        return policy applies. The seller also reserves the right to cancel a pre-sale order with a full refund
        in the event of unavoidable circumstances.
      </p>

      <h2>Order Cancellation</h2>
      <p>
        Orders may be cancelled by the customer before shipment. To cancel, please contact us immediately at{' '}
        <a href={`mailto:${s.site_email}`}>{s.site_email}</a> or call{' '}
        <a href={`tel:+1${s.site_phone.replace(/\D/g, '')}`}>{s.site_phone}</a>. Once an order has been dispatched, it cannot be cancelled.
      </p>

      <h2>In-Store Purchases</h2>
      <p>
        Items purchased in our store at {s.site_address}, {s.site_city}, follow the same policy — all sales
        are final unless there is a manufacturing fault.
      </p>

      <hr />
      <p>
        Have questions? Call us at <a href={`tel:+1${s.site_phone.replace(/\D/g, '')}`}>{s.site_phone}</a> or email{' '}
        <a href={`mailto:${s.site_email}`}>{s.site_email}</a>.
      </p>
    </PolicyLayout>
  );
}
