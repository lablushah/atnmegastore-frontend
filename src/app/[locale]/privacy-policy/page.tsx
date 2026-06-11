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
  const page = await fetchCmsPage('privacy-policy');
  const title = page?.meta_title || page?.title || 'Privacy Policy';
  return {
    title:       `${title} — ATN Book & Crafts`,
    description: page?.meta_description || 'How ATN Book & Crafts collects, uses, and protects your personal information.',
  };
}

export default async function PrivacyPolicyPage() {
  const [cms, s] = await Promise.all([fetchCmsPage('privacy-policy'), getSettings()]);

  const lastUpdated = cms
    ? new Date(cms.updated_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'June 1, 2026';

  return (
    <PolicyLayout
      title={cms?.title || 'Privacy Policy'}
      subtitle="How we collect, use, and protect your personal information."
      lastUpdated={lastUpdated}
    >
      {cms?.content ? (
        <div dangerouslySetInnerHTML={{ __html: cms.content }} />
      ) : (
        <>
          <div className="callout">
            <p>
              ATNMegaStore is committed to protecting your privacy in accordance with Canada's{' '}
              <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong> and,
              where applicable, Quebec's <strong>Law 25 (Act respecting the protection of personal information in the private sector)</strong>.
            </p>
          </div>

          <h2>1. Who We Are</h2>
          <p>
            ATNMegaStore ("we," "us," or "our") is a Canadian retailer of books and gift items operating both an
            online store at <Link href="/">atnmegastore.ca</Link> and a physical retail location in Canada.
            Questions or concerns about this policy can be directed to{' '}
            <a href={`mailto:${s.site_email}`}>{s.site_email}</a>.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Information you provide directly</h3>
          <ul>
            <li><strong>Account registration:</strong> name, email address, password.</li>
            <li><strong>Checkout (registered or guest):</strong> full name, email address, phone number, shipping address (street, city, province, postal code, country).</li>
            <li><strong>Payment:</strong> for card payments, your card details are entered directly into Stripe's secure payment form — we never see or store your card number, expiry, or CVV.</li>
            <li><strong>Newsletter sign-up:</strong> email address and optional name.</li>
            <li><strong>Order notes:</strong> any special instructions you enter at checkout.</li>
            <li><strong>Account profile updates:</strong> name, email, address, and phone.</li>
          </ul>

          <h3>Information collected automatically</h3>
          <ul>
            <li><strong>Browser and device data:</strong> IP address, browser type, operating system, referring URL, pages visited, and time spent — collected via server logs.</li>
            <li><strong>Cookies and local storage:</strong> see our <Link href="/cookies">Cookie Policy</Link> for details. We use local storage to persist your shopping cart and session.</li>
            <li><strong>Stripe fraud signals:</strong> Stripe's JavaScript library may collect device fingerprint and behavioural data for fraud prevention purposes.</li>
          </ul>

          <h2>3. Why We Collect Your Information</h2>
          <table>
            <thead><tr><th>Purpose</th><th>Legal basis (PIPEDA)</th></tr></thead>
            <tbody>
              <tr><td>Processing and fulfilling your orders</td><td>Contractual necessity / consent</td></tr>
              <tr><td>Sending order confirmations and shipping updates</td><td>Contractual necessity</td></tr>
              <tr><td>Providing customer support</td><td>Legitimate interest / consent</td></tr>
              <tr><td>Sending marketing emails (newsletter)</td><td>Express consent (CASL)</td></tr>
              <tr><td>Fraud prevention and security</td><td>Legitimate interest</td></tr>
              <tr><td>Improving our website and products</td><td>Legitimate interest</td></tr>
              <tr><td>Complying with legal obligations</td><td>Legal requirement</td></tr>
            </tbody>
          </table>

          <h2>4. How We Share Your Information</h2>
          <p>We do not sell your personal information. We share it only with trusted service providers necessary to operate our business:</p>
          <ul>
            <li><strong>Stripe, Inc.</strong> — payment processing. Stripe operates under its own privacy policy and is PCI DSS compliant.</li>
            <li><strong>Mailchimp (Intuit Inc.)</strong> — email newsletter delivery. We sync subscriber email addresses and names to send campaign emails. You can unsubscribe at any time.</li>
            <li><strong>Shipping carriers</strong> — your name and delivery address are shared with the courier fulfilling your order.</li>
            <li><strong>Hosting and infrastructure providers</strong> — our servers and databases are hosted on platforms that process data on our behalf under confidentiality agreements.</li>
            <li><strong>Legal authorities</strong> — we may disclose your information if required by law or to protect our legal rights.</li>
          </ul>
          <p>All third-party providers are required to handle your data securely and only for the specified purpose.</p>

          <h2>5. Marketing Communications (CASL)</h2>
          <p>
            Canada's Anti-Spam Legislation (CASL) requires us to obtain your express consent before sending commercial
            electronic messages. We send marketing emails only to people who have explicitly subscribed to our newsletter.
            Every marketing email contains a clear, one-click unsubscribe link. Transactional emails (order confirmations,
            shipping notifications) are sent regardless of marketing consent as they are required to fulfil your order.
          </p>

          <h2>6. Data Retention</h2>
          <ul>
            <li><strong>Order records:</strong> retained for a minimum of 7 years to comply with Canadian tax and accounting obligations.</li>
            <li><strong>Account data:</strong> retained while your account is active and for a reasonable period after closure.</li>
            <li><strong>Newsletter subscribers:</strong> retained until you unsubscribe.</li>
            <li><strong>Server logs:</strong> typically retained for 90 days.</li>
          </ul>

          <h2>7. How We Protect Your Information</h2>
          <p>
            We implement appropriate technical and organisational measures to protect your personal information against
            unauthorised access, disclosure, alteration, or destruction. These include TLS/HTTPS encryption for all
            data in transit, restricted staff access on a need-to-know basis, and secure third-party payment processing
            through Stripe. No method of transmission over the internet is 100% secure, and we cannot guarantee
            absolute security.
          </p>

          <h2>8. Your Rights</h2>
          <p>Under PIPEDA (and Quebec Law 25 for Quebec residents), you have the right to:</p>
          <ul>
            <li><strong>Access</strong> the personal information we hold about you.</li>
            <li><strong>Correct</strong> inaccurate or incomplete information.</li>
            <li><strong>Withdraw consent</strong> to processing where consent is the basis (note: withdrawal may affect our ability to provide services).</li>
            <li><strong>Request deletion</strong> of your personal information, subject to our legal retention obligations.</li>
            <li><strong>Lodge a complaint</strong> with the Office of the Privacy Commissioner of Canada at <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer">priv.gc.ca</a>.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at <a href={`mailto:${s.site_email}`}>{s.site_email}</a>.
            We will respond within 30 days.
          </p>

          <h2>9. Children's Privacy</h2>
          <p>
            Our website is not directed at children under the age of 13. We do not knowingly collect personal information
            from children under 13. If you believe a child has provided us with personal information, please contact us
            and we will delete it promptly.
          </p>

          <h2>10. Links to Other Websites</h2>
          <p>
            Our website may contain links to third-party websites. We are not responsible for the privacy practices
            of those sites and encourage you to review their privacy policies before providing any personal information.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date
            at the top of this page. We encourage you to review this policy periodically. Continued use of our website
            after changes constitutes acceptance of the updated policy.
          </p>

          <h2>12. Contact Our Privacy Officer</h2>
          <p>For any privacy-related questions, concerns, or requests, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> <a href={`mailto:${s.site_email}`}>{s.site_email}</a></li>
            <li><strong>Subject line:</strong> Privacy Request</li>
            <li><strong>Response time:</strong> within 30 days</li>
          </ul>
        </>
      )}
    </PolicyLayout>
  );
}
