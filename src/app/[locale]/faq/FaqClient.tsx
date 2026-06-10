'use client';

import { useState } from 'react';
import { Link } from '@/navigation';
import {
  ChevronDown, CreditCard, Truck, Store, RefreshCw,
  BookOpen, UserCircle, Mail, MessageCircle,
} from 'lucide-react';

function buildCategories(email: string, interacEmail: string) {
  return [
    {
      id: 'orders',
      icon: CreditCard,
      label: 'Orders & Payment',
      color: 'text-blue-600 bg-blue-50',
      faqs: [
        {
          q: 'What payment methods do you accept?',
          a: (
            <>
              <p>We offer three convenient ways to pay:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><strong>Credit / Debit Card</strong> — processed securely online via Stripe (Visa, Mastercard, Amex).</li>
                <li><strong>Interac e-Transfer</strong> — send payment to <a href={`mailto:${interacEmail}`} className="text-[#213885] font-medium hover:underline">{interacEmail}</a> with your Order Number as the message.</li>
                <li><strong>Pay at Store</strong> — place your order online, then pay in person with cash, debit, or credit card when you pick it up.</li>
              </ul>
            </>
          ),
        },
        {
          q: 'How does Interac e-Transfer payment work?',
          a: (
            <>
              <p>It&apos;s simple:</p>
              <ol className="mt-2 space-y-1.5 list-decimal list-inside">
                <li>Complete checkout and choose <strong>Interac e-Transfer</strong> as your payment method.</li>
                <li>Note your <strong>Order Number</strong> shown on the confirmation screen.</li>
                <li>Send the <strong>exact order total</strong> via Interac e-Transfer to <a href={`mailto:${interacEmail}`} className="text-[#213885] font-medium hover:underline">{interacEmail}</a>.</li>
                <li>In the <strong>message / comment field</strong> of the transfer, enter your Order Number.</li>
                <li>We will confirm and process your order once payment is received — usually within a few hours on business days.</li>
              </ol>
            </>
          ),
        },
        {
          q: 'Is it safe to pay by credit card online?',
          a: "Absolutely. All card payments are processed by Stripe, a PCI DSS–compliant payment provider trusted by millions of businesses worldwide. We never see or store your card details — they go directly to Stripe's secure servers.",
        },
        {
          q: 'Can I place an order and pay later in store?',
          a: 'Yes! Select "Pay at Store" during checkout. Place your order, make note of your Order Number, and bring it to our store. You can pay with cash, debit, or credit card in person at the time of pickup.',
        },
        {
          q: 'Can I order without creating an account?',
          a: "Yes — we offer guest checkout. You'll need your name, email address, and shipping address. However, guest orders cannot be tracked online after checkout. We recommend creating a free account so you can follow your order status and view your order history any time.",
        },
        {
          q: 'My order shows "Awaiting Payment" — what does that mean?',
          a: `This status means we've received your order but are waiting for payment to be confirmed. For Interac e-Transfer orders, please ensure you've sent the payment to ${interacEmail} with your Order Number. For "Pay at Store" orders, it means your items are being held until you visit us in person.`,
        },
      ],
    },
    {
      id: 'shipping',
      icon: Truck,
      label: 'Shipping & Delivery',
      color: 'text-green-600 bg-green-50',
      faqs: [
        {
          q: 'Do you offer free shipping?',
          a: 'Yes! We offer free shipping on all orders over $49. For orders below $49, shipping rates are calculated at checkout based on your location.',
        },
        {
          q: 'Where do you ship to?',
          a: "We primarily ship within Canada. If you are outside Canada and interested in ordering, please contact us and we'll do our best to help.",
        },
        {
          q: 'How long does delivery take?',
          a: "Delivery times depend on your location and the shipping carrier. Most orders within Canada arrive within 3–7 business days after dispatch. We'll send you shipping confirmation with tracking details as soon as your order leaves us.",
        },
        {
          q: 'Will I get a tracking number?',
          a: 'Yes. Once your order has been shipped, you\'ll receive an email with tracking information. You can also check your order status by logging into your account and visiting "My Orders."',
        },
        {
          q: 'Can I choose in-store pickup to avoid shipping?',
          a: 'Yes! Select "Pay at Store" at checkout and you can pick up your order directly from our store at no shipping cost. Just bring your Order Number when you visit.',
        },
      ],
    },
    {
      id: 'instore',
      icon: Store,
      label: 'In-Store Shopping',
      color: 'text-amber-600 bg-amber-50',
      faqs: [
        {
          q: 'Do you have a physical store I can visit?',
          a: 'Yes! ATNMegaStore has a physical retail location where you can browse books and gifts in person. Please contact us or check our store location for current hours and directions.',
        },
        {
          q: 'Can I browse your full inventory in store?',
          a: "Our store carries a curated selection of products, many of which are also available online. Some in-store exclusives may not appear on the website, so we always encourage you to drop by if you're looking for something specific.",
        },
        {
          q: 'I ordered online — how do I pick it up in store?',
          a: (
            <>
              <ol className="space-y-1.5 list-decimal list-inside">
                <li>Select <strong>Pay at Store</strong> at checkout.</li>
                <li>Complete your order — you&apos;ll see your <strong>Order Number</strong> on screen and receive a confirmation email.</li>
                <li>Visit the store and give your Order Number to a staff member.</li>
                <li>Pay with cash, debit, or credit card and take your items home!</li>
              </ol>
            </>
          ),
        },
        {
          q: 'What payment methods are accepted in store?',
          a: 'We accept cash, debit card, and credit card (Visa, Mastercard, Amex) in store.',
        },
        {
          q: 'Can I see a book in store before buying it online?',
          a: "Of course! You're welcome to visit and browse before making a purchase. Our staff are happy to recommend titles and answer any questions.",
        },
      ],
    },
    {
      id: 'returns',
      icon: RefreshCw,
      label: 'Returns & Exchanges',
      color: 'text-rose-600 bg-rose-50',
      faqs: [
        {
          q: 'What is your return policy?',
          a: 'We accept returns within 30 days of purchase on items that are unused and in their original condition. Books must not be written in or damaged. Please contact us to initiate a return before sending anything back.',
        },
        {
          q: 'Can I exchange a product for a different one?',
          a: "Yes, exchanges are welcome within 30 days of purchase. Bring the item to our store or contact us online. If the item you want is higher in price, you'll pay the difference; if it's lower, we'll issue a store credit.",
        },
        {
          q: 'My order arrived damaged — what do I do?',
          a: "We're sorry to hear that! Please contact us as soon as possible and include a photo of the damaged item and packaging. We'll arrange a replacement or full refund promptly at no cost to you.",
        },
        {
          q: 'What items are non-returnable?',
          a: 'Gift cards, downloadable or digital items, and items marked "Final Sale" are non-returnable. Items that show signs of use, are missing packaging, or fall outside the 30-day window may not be accepted.',
        },
        {
          q: 'How long does it take to process a refund?',
          a: 'Refunds are processed within 3–5 business days of us receiving the returned item. For card payments, your bank may take a few additional days to reflect the credit on your statement. Interac e-Transfer refunds are sent directly to your account.',
        },
      ],
    },
    {
      id: 'products',
      icon: BookOpen,
      label: 'Products',
      color: 'text-purple-600 bg-purple-50',
      faqs: [
        {
          q: 'What kinds of products do you sell?',
          a: "We carry a lovingly curated selection of books — fiction, non-fiction, children's, cookbooks, and more — alongside a range of thoughtful gifts perfect for any occasion: journals, stationery, candles, novelty items, and other beautiful things.",
        },
        {
          q: 'How do I find a specific book or author?',
          a: 'Use the search bar at the top of any page to search by title, author, or keyword. You can also browse by category (Books or Gifts), filter by price, or sort by New Arrivals to find the latest additions.',
        },
        {
          q: "Can I order a book that isn't on your website?",
          a: "We regularly update our catalog with new titles. If you're looking for something specific that you don't see listed, contact us and we'll let you know if we can source it for you.",
        },
        {
          q: 'Do you offer gift wrapping?',
          a: "We offer gift wrapping on select items in store. For online orders, please mention it in the Order Notes field at checkout and we'll do our best to accommodate. Contact us for special requests.",
        },
        {
          q: 'Are the prices the same online and in store?',
          a: 'Yes — our online and in-store prices are the same. Sale prices and promotions apply to both channels simultaneously.',
        },
        {
          q: 'What does "Sale" mean on your website?',
          a: 'Our Sale section features items discounted below $12. Check back often — we regularly add new deals and clearance items.',
        },
      ],
    },
    {
      id: 'account',
      icon: UserCircle,
      label: 'Account & Order Tracking',
      color: 'text-indigo-600 bg-indigo-50',
      faqs: [
        {
          q: 'How do I create an account?',
          a: (
            <>
              Click <Link href="/register" className="text-[#213885] font-medium hover:underline">Register</Link> in the top navigation or at checkout. Enter your name, email, and a password — it takes less than a minute. Once registered, you can track orders and manage your profile.
            </>
          ),
        },
        {
          q: 'How do I track my order?',
          a: (
            <>
              Log in to your account, then click your name in the top-right corner and select{' '}
              <Link href="/orders" className="text-[#213885] font-medium hover:underline">My Orders</Link>. You&apos;ll see all your orders with their current status. You&apos;ll also receive email updates when your order status changes.
            </>
          ),
        },
        {
          q: 'What do the order statuses mean?',
          a: (
            <ul className="space-y-2 mt-1">
              {[
                ['Awaiting Payment', 'Order placed — waiting for payment confirmation (Interac or Pay at Store).'],
                ['Pending',          'Payment received — your order is being prepared.'],
                ['Paid',             'Payment confirmed.'],
                ['Shipped',          'Your order is on its way to you.'],
                ['Delivered',        'Order successfully delivered.'],
                ['Cancelled',        'The order was cancelled. Contact us if you need assistance.'],
              ].map(([status, desc]) => (
                <li key={status} className="flex gap-2">
                  <span className="font-semibold text-[#1a1a1a] shrink-0 w-36">{status}:</span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          ),
        },
        {
          q: 'I checked out as a guest — can I still track my order?',
          a: "Guest orders don't have online tracking. For a status update, please contact us with your Order Number and the email address you used at checkout and we'll look it up for you. To avoid this in future, we recommend creating a free account before ordering.",
        },
        {
          q: 'How do I update my name, email, or address?',
          a: (
            <>
              Log in and visit{' '}
              <Link href="/account" className="text-[#213885] font-medium hover:underline">My Account</Link> to update your personal details and saved address at any time.
            </>
          ),
        },
        {
          q: 'I forgot my password — what do I do?',
          a: "On the login page, click \"Forgot password?\" and enter your email address. We'll send you a link to reset your password. Check your spam folder if you don't see the email within a few minutes.",
        },
      ],
    },
    {
      id: 'newsletter',
      icon: Mail,
      label: 'Newsletter',
      color: 'text-teal-600 bg-teal-50',
      faqs: [
        {
          q: 'How do I subscribe to the newsletter?',
          a: "Scroll to the bottom of any page on our website and enter your email address in the Newsletter sign-up box. You'll be subscribed immediately and will receive our next email.",
        },
        {
          q: 'What will I receive in the newsletter?',
          a: 'Our newsletter is a curated selection of new arrivals, exclusive promotions, staff book picks, gift ideas, and occasional news about in-store events and sales.',
        },
        {
          q: 'How often do you send newsletters?',
          a: 'We aim to send newsletters no more than once or twice a month so we only reach out when we have something worth sharing.',
        },
        {
          q: 'How do I unsubscribe?',
          a: 'Every newsletter email contains an "Unsubscribe" link at the bottom. Click it and you\'ll be removed from our list immediately — no questions asked.',
        },
      ],
    },
  ];
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#cccacc] last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left group"
      >
        <span className={`text-sm font-semibold leading-relaxed transition-colors ${open ? 'text-[#213885]' : 'text-[#1a1a1a] group-hover:text-[#213885]'}`}>
          {q}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 mt-0.5 transition-transform text-[#6b6b6b] ${open ? 'rotate-180 text-[#213885]' : ''}`} />
      </button>
      {open && (
        <div className="pb-5 text-sm text-[#444] leading-relaxed space-y-2 pr-8">
          {typeof a === 'string' ? <p>{a}</p> : a}
        </div>
      )}
    </div>
  );
}

export default function FaqClient({ email, interacEmail }: { email: string; interacEmail: string }) {
  const categories = buildCategories(email, interacEmail);

  return (
    <div className="bg-[#ecdfd2] min-h-screen">

      {/* Hero */}
      <div className="bg-[#213885] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <MessageCircle className="w-10 h-10 text-[#893172] mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Frequently Asked Questions
          </h1>
          <p className="text-[#f0c0a0] text-base max-w-xl mx-auto">
            Everything you need to know about ordering, shipping, returns, and shopping at ATNMegaStore — online and in store.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Category nav pills */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {categories.map(({ id, icon: Icon, label }) => (
            <a key={id} href={`#${id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-[#cccacc] bg-white hover:border-[#213885] hover:text-[#213885] transition-colors">
              <Icon className="w-3.5 h-3.5" /> {label}
            </a>
          ))}
        </div>

        {/* Category sections */}
        <div className="space-y-10">
          {categories.map(({ id, icon: Icon, label, color, faqs }) => (
            <section key={id} id={id} className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
                  {label}
                </h2>
              </div>
              <div className="bg-white border border-[#cccacc] px-6">
                {faqs.map((faq, i) => (
                  <FaqItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-14 bg-[#213885] text-white p-8 text-center">
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Still have a question?
          </h3>
          <p className="text-[#f0c0a0] text-sm mb-5 max-w-md mx-auto">
            We&apos;re happy to help. Reach out by email or visit us in store and our team will get back to you quickly.
          </p>
          <a href={`mailto:${email}`}
            className="inline-flex items-center gap-2 bg-[#893172] text-[#213885] font-semibold px-6 py-3 text-sm hover:bg-[#c09828] transition-colors">
            <Mail className="w-4 h-4" /> Email Us at {email}
          </a>
        </div>
      </div>
    </div>
  );
}
