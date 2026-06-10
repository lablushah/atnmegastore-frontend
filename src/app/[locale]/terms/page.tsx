import PolicyLayout from '@/components/PolicyLayout';
import { Link } from '@/navigation';
import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings';

interface CmsPage {
  title: string; content: string | null;
  meta_title: string | null; meta_description: string | null;
  updated_at: string;
}

async function fetchCmsPage(slug: string): Promise<CmsPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/pages/${slug}`,
      { next: { revalidate: 120 } }
    );
    return res.ok ? res.json() : null;
  } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchCmsPage('terms');
  const title = page?.meta_title || page?.title || 'Terms of Service';
  return {
    title:       `${title} — ATN Mega Store`,
    description: page?.meta_description || 'Terms and conditions for using ATN Mega Store and placing orders.',
  };
}

export default async function TermsPage() {
  const [cms, s] = await Promise.all([fetchCmsPage('terms'), getSettings()]);

  const lastUpdated = cms
    ? new Date(cms.updated_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'June 1, 2026';

  return (
    <PolicyLayout
      title={cms?.title || 'Terms of Service'}
      subtitle="Please read these terms carefully before using our website or placing an order."
      lastUpdated={lastUpdated}
    >
      {cms?.content ? (
        <div dangerouslySetInnerHTML={{ __html: cms.content }} />
      ) : (
        <>
          <div className="callout">
            <p>
              By accessing <Link href="/">atnmegastore.ca</Link> or placing an order with us, you agree to be
              bound by these Terms of Service. If you do not agree, please do not use our website or services.
            </p>
          </div>

          <h2>1. About ATNMegaStore</h2>
          <p>
            ATNMegaStore is a Canadian retailer of books and gift items. We operate both an online store and a
            physical retail location in Canada. All transactions are subject to Canadian law.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 18 years of age, or have the consent of a parent or guardian, to use this website
            and make purchases. By using this site, you represent that you meet this requirement.
          </p>

          <h2>3. Products and Pricing</h2>
          <ul>
            <li>All prices are listed in <strong>Canadian dollars (CAD)</strong> and include applicable taxes where shown.</li>
            <li>We reserve the right to change prices at any time without notice. Prices confirmed at the time of your order will be honoured.</li>
            <li>Product descriptions, images, and availability are provided in good faith but may occasionally contain errors. We reserve the right to correct any errors and to cancel orders where a product was listed at an incorrect price.</li>
            <li>We do not guarantee that all products shown online are in stock at our physical store.</li>
          </ul>

          <h2>4. Orders and Contract Formation</h2>
          <p>
            Placing an order constitutes an offer to purchase, not a confirmed sale. A binding contract is formed
            only when we confirm your order and payment has been received or a "Pay at Store" arrangement is in place.
            We reserve the right to cancel any order before dispatch, in which case we will issue a full refund
            within 5 business days.
          </p>
          <p>
            We may cancel or refuse any order at our discretion, including where we suspect fraud, where stock
            is unavailable, or where an error in pricing or product information has occurred.
          </p>

          <h2>5. Payment</h2>
          <ul>
            <li><strong>Credit / Debit Card:</strong> processed securely via Stripe. By entering your card details, you authorise the charge for your order total.</li>
            <li><strong>Interac e-Transfer:</strong> you agree to send the exact order total to <a href={`mailto:${s.site_email}`}>{s.site_email}</a> within 48 hours of placing your order, using your Order Number as the transfer comment. Orders not paid within 48 hours may be cancelled.</li>
            <li><strong>Pay at Store:</strong> payment is collected in full at the time of in-store pickup. We accept cash, debit, and credit card in store. Items are held for a maximum of 7 days; unclaimed orders may be cancelled.</li>
          </ul>

          <h2>6. Shipping and Delivery</h2>
          <p>
            Please review our full <Link href="/shipping">Shipping Policy</Link> for details on delivery times,
            free shipping thresholds, and carrier information. Shipping estimates are not guarantees; delays outside
            our control (weather, carrier delays, customs) are not our responsibility.
          </p>

          <h2>7. Returns and Refunds</h2>
          <p>
            Please review our <Link href="/returns">Returns & Exchanges Policy</Link>. We comply with Canada's
            consumer protection legislation, including applicable provincial consumer protection acts.
          </p>

          <h2>8. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the website for any unlawful purpose or in a way that violates these terms.</li>
            <li>Submit false, inaccurate, or misleading information during checkout or registration.</li>
            <li>Attempt to gain unauthorised access to any part of the website or its servers.</li>
            <li>Use automated means (bots, scrapers) to access or collect data from the website without our written permission.</li>
            <li>Reproduce, distribute, or commercially exploit any content from this website without prior written consent.</li>
          </ul>

          <h2>9. Intellectual Property</h2>
          <p>
            All content on this website — including text, images, logos, and design — is the property of
            ATNMegaStore or its licensors and is protected by Canadian copyright law. You may not reproduce,
            modify, or distribute any content without written permission.
          </p>
          <p>
            Product images and descriptions may include content owned by publishers or manufacturers and are
            used for the purpose of selling those products.
          </p>

          <h2>10. Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account password and for all activity
            that occurs under your account. Notify us immediately at <a href={`mailto:${s.site_email}`}>{s.site_email}</a> if
            you suspect unauthorised use of your account. We reserve the right to terminate accounts that violate
            these terms.
          </p>

          <h2>11. Disclaimer of Warranties</h2>
          <p>
            The website and its content are provided "as is" without warranties of any kind, express or implied.
            We do not warrant that the website will be error-free, uninterrupted, or free of viruses or other
            harmful components. We make no warranty that products will meet your expectations beyond what is
            described on the product listing.
          </p>

          <h2>12. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by Canadian law, ATNMegaStore shall not be liable for any indirect,
            incidental, special, or consequential damages arising from your use of the website or purchase of
            products. Our total liability to you for any claim shall not exceed the amount you paid for the
            relevant order.
          </p>
          <p>
            Nothing in these terms limits our liability for death or personal injury caused by negligence,
            fraud, or any matter that cannot be excluded by law.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms of Service are governed by the laws of Canada and the province in which ATNMegaStore
            is registered. Any disputes shall be subject to the exclusive jurisdiction of the courts of that
            province. If you are a Quebec consumer, applicable Quebec consumer protection laws also apply.
          </p>

          <h2>14. Changes to These Terms</h2>
          <p>
            We may update these Terms of Service at any time. Changes take effect when posted to this page.
            Continued use of the website after changes constitutes acceptance. We will update the "Last updated"
            date at the top of this page when changes are made.
          </p>

          <h2>15. Contact Us</h2>
          <p>
            Questions about these terms? Contact us at{' '}
            <a href={`mailto:${s.site_email}`}>{s.site_email}</a> or visit us in store.
          </p>
        </>
      )}
    </PolicyLayout>
  );
}
