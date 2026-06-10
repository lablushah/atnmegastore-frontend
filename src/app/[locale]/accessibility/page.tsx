import PolicyLayout from '@/components/PolicyLayout';
import { Link } from '@/navigation';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Accessibility — ATNMegaStore' };

export default async function AccessibilityPage() {
  const s = await getSettings();
  return (
    <PolicyLayout
      title="Accessibility Statement"
      subtitle="Our commitment to making ATNMegaStore accessible to everyone."
      lastUpdated="June 1, 2026"
    >
      <h2>Our Commitment</h2>
      <p>
        ATNMegaStore is committed to ensuring that our website and physical store are accessible to all
        customers, including those with disabilities. We believe everyone deserves equal access to books,
        gifts, and the joy of browsing our store — regardless of ability.
      </p>
      <p>
        We strive to meet or exceed the requirements of the <strong>Accessibility for Ontarians with
        Disabilities Act (AODA)</strong>, <strong>Web Content Accessibility Guidelines (WCAG) 2.1
        Level AA</strong>, and other applicable Canadian accessibility standards.
      </p>

      <h2>Website Accessibility Features</h2>
      <p>Our website is designed with accessibility in mind:</p>
      <ul>
        <li><strong>Keyboard navigation:</strong> all interactive elements can be reached and activated via keyboard alone.</li>
        <li><strong>Screen reader compatible:</strong> pages use semantic HTML with descriptive labels, headings, and ARIA attributes to support assistive technologies.</li>
        <li><strong>Colour contrast:</strong> text and interactive elements meet WCAG AA contrast ratios to support users with low vision.</li>
        <li><strong>Responsive design:</strong> the site adapts to any screen size and supports zoom up to 200% without loss of functionality.</li>
        <li><strong>Descriptive link text:</strong> links use meaningful labels rather than "click here" so they make sense out of context.</li>
        <li><strong>Image alt text:</strong> product images and other meaningful visuals include descriptive alternative text.</li>
        <li><strong>Form labels:</strong> all form fields include visible, programmatically associated labels.</li>
        <li><strong>Focus indicators:</strong> visible focus rings are present on interactive elements to support keyboard and switch-access users.</li>
      </ul>

      <h2>In-Store Accessibility</h2>
      <p>Our physical store is designed to be welcoming to all customers:</p>
      <ul>
        <li>Accessible entrance with level or ramped access.</li>
        <li>Wide aisles to accommodate wheelchairs and mobility aids.</li>
        <li>Staff are always available to assist you in locating products and completing purchases.</li>
        <li>Counter height accommodates customers using wheelchairs.</li>
        <li>Large-print or alternative formats of product information are available upon request.</li>
      </ul>

      <h2>Supported Assistive Technologies</h2>
      <p>We test our website with the following assistive technologies:</p>
      <ul>
        <li>NVDA with Chrome (Windows)</li>
        <li>VoiceOver with Safari (macOS and iOS)</li>
        <li>TalkBack with Chrome (Android)</li>
        <li>Keyboard-only navigation (all major browsers)</li>
      </ul>

      <h2>Known Limitations</h2>
      <p>
        While we strive for full accessibility, some areas of the site may not yet fully meet WCAG 2.1 AA.
        We are actively working to address any gaps. Known areas being improved include:
      </p>
      <ul>
        <li>Third-party payment widgets (Stripe's card input element) — accessibility is managed by Stripe and may vary by assistive technology.</li>
        <li>Some older product images may be missing alt text — we are updating these progressively.</li>
      </ul>

      <h2>Alternative Access</h2>
      <p>
        If you experience any difficulty accessing our website or completing a purchase due to a disability,
        we are happy to assist you by phone or email. We can:
      </p>
      <ul>
        <li>Take your order by email or phone on your behalf.</li>
        <li>Provide product information in an accessible format.</li>
        <li>Arrange in-store assistance for pickup or browsing.</li>
      </ul>
      <p>
        Contact us at <a href={`mailto:${s.site_email}`}>{s.site_email}</a> and mention that you
        need accessibility assistance. We will respond within 1 business day.
      </p>

      <h2>Feedback and Reporting Issues</h2>
      <div className="callout">
        <p>
          If you encounter any accessibility barrier on our website — a page that is difficult to navigate,
          a form that is hard to complete, or content that isn't accessible with your assistive technology —
          please tell us. Your feedback helps us improve.
        </p>
      </div>
      <p>To report an issue or request an accommodation:</p>
      <ul>
        <li><strong>Email:</strong> <a href={`mailto:${s.site_email}`}>{s.site_email}</a></li>
        <li><strong>Subject line:</strong> Accessibility Feedback</li>
        <li><strong>Include:</strong> the URL or page where the issue occurred, a description of the barrier, and the assistive technology you were using (if applicable).</li>
      </ul>
      <p>We aim to respond to all accessibility feedback within 2 business days and to resolve issues as quickly as possible.</p>

      <h2>Ongoing Efforts</h2>
      <p>
        Accessibility is an ongoing commitment, not a one-time project. We regularly:
      </p>
      <ul>
        <li>Review new and updated pages for accessibility before launch.</li>
        <li>Train staff on accessibility best practices and inclusive customer service.</li>
        <li>Test with real assistive technology users where possible.</li>
        <li>Monitor changes to WCAG and AODA guidelines and update the site accordingly.</li>
      </ul>

      <h2>Related Policies</h2>
      <ul>
        <li><Link href="/privacy-policy">Privacy Policy</Link></li>
        <li><Link href="/terms">Terms of Service</Link></li>
        <li><Link href="/contact">Contact Us</Link></li>
      </ul>
    </PolicyLayout>
  );
}
