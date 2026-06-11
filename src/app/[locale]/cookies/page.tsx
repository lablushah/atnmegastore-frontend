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
  const page = await fetchCmsPage('cookies');
  const title = page?.meta_title || page?.title || 'Cookie Policy';
  return {
    title:       `${title} — ATN Book & Crafts`,
    description: page?.meta_description || 'How ATN Book & Crafts uses cookies and browser storage technologies.',
  };
}

export default async function CookiePolicyPage() {
  const [cms, s] = await Promise.all([fetchCmsPage('cookies'), getSettings()]);

  const lastUpdated = cms
    ? new Date(cms.updated_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'June 1, 2026';

  return (
    <PolicyLayout
      title={cms?.title || 'Cookie Policy'}
      subtitle="How we use cookies and similar technologies on our website."
      lastUpdated={lastUpdated}
    >
      {cms?.content ? (
        <div dangerouslySetInnerHTML={{ __html: cms.content }} />
      ) : (
        <>
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files placed on your device by websites you visit. They are widely used to make
            websites work efficiently, remember your preferences, and provide information to site owners. Similar
            technologies include browser local storage and session storage, which store data directly in your browser
            rather than sending it to a server.
          </p>

          <h2>2. How ATNMegaStore Uses Storage Technologies</h2>
          <p>
            We aim to be minimal and purposeful in our use of cookies and browser storage. Below is a full breakdown
            of what we use and why.
          </p>

          <h3>Essential / Functional (always active)</h3>
          <table>
            <thead>
              <tr><th>Technology</th><th>Purpose</th><th>Storage</th><th>Duration</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Session token</td>
                <td>Keeps you logged in to your account across page loads</td>
                <td>Local storage</td>
                <td>Until you log out</td>
              </tr>
              <tr>
                <td>Shopping cart</td>
                <td>Stores your cart items so they persist between visits</td>
                <td>Local storage</td>
                <td>Until cart is cleared or checkout completes</td>
              </tr>
              <tr>
                <td>User preferences</td>
                <td>Remembers lightweight UI state (e.g. your last viewed session)</td>
                <td>Local storage</td>
                <td>Session / persistent</td>
              </tr>
            </tbody>
          </table>
          <p>
            These are stored in your browser's <strong>local storage</strong> — not cookies — and are essential for
            the website to function. They do not leave your device and are never shared with third parties.
          </p>

          <h3>Third-Party Cookies — Payment Processing (Stripe)</h3>
          <table>
            <thead>
              <tr><th>Provider</th><th>Purpose</th><th>Type</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Stripe, Inc.</td>
                <td>Fraud prevention, payment authentication, and device fingerprinting during checkout</td>
                <td>Third-party cookie / script</td>
              </tr>
            </tbody>
          </table>
          <p>
            When you visit our checkout page, Stripe's JavaScript library loads and may set cookies on your device.
            These cookies are required for secure payment processing and cannot be disabled without breaking card
            payments. Stripe's data practices are governed by their own{' '}
            <a href="https://stripe.com/en-ca/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
          </p>

          <h3>Email Marketing (Mailchimp)</h3>
          <p>
            Mailchimp may embed tracking pixels in emails we send to newsletter subscribers. These pixels indicate
            whether the email was opened and links clicked. This tracking occurs in emails, not on this website.
            You can opt out by unsubscribing from our newsletter — every email contains an unsubscribe link.
          </p>

          <h2>3. What We Do NOT Use</h2>
          <ul>
            <li>We do <strong>not</strong> use Google Analytics, Facebook Pixel, or any other third-party advertising or behavioural tracking on this website.</li>
            <li>We do <strong>not</strong> sell data collected via cookies or storage to any third party.</li>
            <li>We do <strong>not</strong> use cross-site tracking or retargeting cookies.</li>
          </ul>

          <h2>4. Managing and Disabling Cookies</h2>
          <p>
            Because this website uses primarily browser local storage (not cookies), most browser cookie controls
            will not affect the core functionality of the site. However, you can clear your browser's local storage
            at any time through your browser's developer tools or privacy settings. Note that doing so will:
          </p>
          <ul>
            <li>Log you out of your account.</li>
            <li>Clear your shopping cart.</li>
          </ul>
          <p>
            To block Stripe's cookies, you would need to block third-party scripts from <code>js.stripe.com</code>,
            but this will prevent card payments from working.
          </p>
          <p>You can manage cookies in your browser settings:</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>

          <h2>5. Do Not Track</h2>
          <p>
            Some browsers offer a "Do Not Track" (DNT) signal. Because we do not engage in the type of cross-site
            tracking that DNT is designed to address, this signal has no material effect on how we operate.
          </p>

          <h2>6. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy as our use of technologies changes or as legal requirements evolve.
            The "Last updated" date at the top of this page will reflect any changes. We encourage you to review
            this page periodically.
          </p>

          <h2>7. Questions</h2>
          <p>
            If you have questions about our use of cookies or storage technologies, contact us at{' '}
            <a href={`mailto:${s.site_email}`}>{s.site_email}</a>.
            You can also review our full <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>
        </>
      )}
    </PolicyLayout>
  );
}
