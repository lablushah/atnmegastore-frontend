'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Gift, User, MessageSquare, CheckCircle, ArrowLeft, Send, CreditCard, Smartphone, Store, Info, Clock } from 'lucide-react';

/* ── Inline ATN logo as SVG (matches Logo.tsx exactly) ── */
function AtnLogo({ scale = 1 }: { scale?: number }) {
  const w = Math.round(140 * scale);
  const h = Math.round(78 * scale);
  return (
    <svg width={w} height={h} viewBox="0 0 140 78" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="29" r="14" fill="#1a6b22" stroke="#0d4815" strokeWidth="0.4" />
      <text x="32" y="29" textAnchor="middle" dominantBaseline="central"
        fill="#e8201a" stroke="#FFD700" strokeWidth="0.8" paintOrder="stroke"
        fontSize="16" fontWeight="900" fontFamily='"Arial Black",Impact,Arial,sans-serif'>A</text>
      <circle cx="70" cy="23" r="20" fill="#1a6b22" stroke="#0d4815" strokeWidth="0.4" />
      <text x="70" y="23" textAnchor="middle" dominantBaseline="central"
        fill="#e8201a" stroke="#FFD700" strokeWidth="0.8" paintOrder="stroke"
        fontSize="23" fontWeight="900" fontFamily='"Arial Black",Impact,Arial,sans-serif'>T</text>
      <circle cx="108" cy="29" r="14" fill="#1a6b22" stroke="#0d4815" strokeWidth="0.4" />
      <text x="108" y="29" textAnchor="middle" dominantBaseline="central"
        fill="#e8201a" stroke="#FFD700" strokeWidth="0.8" paintOrder="stroke"
        fontSize="16" fontWeight="900" fontFamily='"Arial Black",Impact,Arial,sans-serif'>N</text>
      <rect x="0.5" y="47.5" width="139" height="28" rx="3" ry="3"
        fill="#FFD700" stroke="#1a6b22" strokeWidth="1.2" />
      <text x="70" y="62" textAnchor="middle" dominantBaseline="central"
        fill="#213885" fontSize="13" fontWeight="900"
        fontFamily='Georgia,"Palatino Linotype",serif' letterSpacing="2.5">MEGA STORE</text>
    </svg>
  );
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const DENOMINATIONS = [25, 50, 100, 200];
const SLOGAN = 'Give the gift of a thousand stories.';

type PaymentMethod = 'stripe' | 'interac_etransfer' | 'pay_at_store';

type DoneState =
  | { type: 'stripe';   code: string; sentTo: string; amount: number }
  | { type: 'interac';  reference: string; amount: number; interacEmail: string; purchaserEmail: string }
  | { type: 'store';    reference: string; amount: number; purchaserEmail: string };

/* ── Gold ribbon bow SVG ── */
function RibbonBow() {
  return (
    <svg viewBox="0 0 120 65" style={{ width: 86, height: 47, display: 'block' }}>
      {/* Tails — rendered first so loops sit on top */}
      <path d="M58,33 C46,44 28,57 18,65" stroke="#b8891e" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M62,33 C74,44 92,57 102,65" stroke="#b8891e" strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Left loop base */}
      <path d="M60,29 C54,8 16,2 16,21 C16,38 44,37 60,29Z" fill="#c8971e"/>
      {/* Left loop highlight (fold) */}
      <path d="M60,29 C52,14 28,9 26,21 C25,30 43,32 60,29" fill="#893172" opacity="0.55"/>
      {/* Right loop base */}
      <path d="M60,29 C66,8 104,2 104,21 C104,38 76,37 60,29Z" fill="#c8971e"/>
      {/* Right loop highlight */}
      <path d="M60,29 C68,14 92,9 94,21 C95,30 77,32 60,29" fill="#893172" opacity="0.55"/>
      {/* Center knot */}
      <ellipse cx="60" cy="30" rx="10" ry="9" fill="#9a7015"/>
      <ellipse cx="60" cy="30" rx="7" ry="6" fill="#893172"/>
    </svg>
  );
}

/* ── Reusable card visual used on both the purchase page and success screen ── */
function GiftCardVisual({ amount, code }: { amount: number; code?: string }) {
  return (
    <div className="relative mt-6 overflow-hidden select-none flex flex-col"
      style={{ background: 'linear-gradient(135deg, #2a0b16 0%, #213885 45%, #5f3475 75%, #3d0f1e 100%)', borderRadius: 6, aspectRatio: '1.586 / 1' }}>

      {/* Decorative rings */}
      <div className="absolute pointer-events-none" style={{ right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(212,168,67,0.15)' }} />
      <div className="absolute pointer-events-none" style={{ right: -35, top: -35, width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(212,168,67,0.10)' }} />
      <div className="absolute pointer-events-none" style={{ left: -50, bottom: -50, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(212,168,67,0.10)' }} />

      {/* Gold top stripe — matches email card-goldbar */}
      <div style={{ height: 5, background: 'linear-gradient(90deg, #7a3c1c, #893172, #c8971e, #893172, #7a3c1c)', flexShrink: 0 }} />

      <div className="relative z-10 flex-1 flex flex-col px-5 py-3 sm:px-6 sm:py-4">
        {/* Top row: logo left, GIFT CARD right */}
        <div className="flex items-start justify-between">
          <AtnLogo scale={0.5} />
          <div className="text-right">
            <p style={{ color: '#893172', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700 }}>Digital</p>
            <p style={{ color: '#fff', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 800, marginTop: 1 }}>Gift Card</p>
          </div>
        </div>

        {/* Center: ribbon bow + amount + slogan */}
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <RibbonBow />
          <p style={{ color: 'rgba(212,168,67,0.65)', fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', marginTop: 8, marginBottom: 2 }}>Value</p>
          <div className="flex items-end gap-2" style={{ marginBottom: 6 }}>
            <span style={{ color: '#fff', fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>${amount}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 5 }}>CAD</span>
          </div>
          <p style={{ color: '#893172', fontSize: 15, fontStyle: 'italic', fontFamily: 'Georgia,"Palatino Linotype",serif', lineHeight: 1.35, maxWidth: '85%' }}>
            &ldquo;{SLOGAN}&rdquo;
          </p>
          {code && (
            <div className="mt-3 px-4 py-1.5" style={{ border: '1px dashed rgba(212,168,67,0.5)', background: 'rgba(0,0,0,0.3)' }}>
              <p style={{ color: '#893172', fontSize: 13, fontFamily: 'monospace', letterSpacing: 3, fontWeight: 700 }}>{code}</p>
            </div>
          )}
        </div>

        {/* Bottom: divider + URL prominently */}
        <div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.4), transparent)', marginBottom: 5 }} />
          <div className="flex justify-between items-center">
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, letterSpacing: 1 }}>Valid · 1 Year</p>
            <p style={{ color: 'rgba(212,168,67,0.85)', fontSize: 10, letterSpacing: 1.5, fontFamily: 'monospace', fontWeight: 600 }}>atnmegastore.ca</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GiftCardForm() {
  const stripe   = useStripe();
  const elements = useElements();

  const [amount,          setAmount]          = useState(50);
  const [paymentMethod,   setPaymentMethod]   = useState<PaymentMethod>('stripe');
  const [purchaserName,   setPurchaserName]   = useState('');
  const [purchaserEmail,  setPurchaserEmail]  = useState('');
  const [sendToRecipient, setSendToRecipient] = useState(false);
  const [recipientName,   setRecipientName]   = useState('');
  const [recipientEmail,  setRecipientEmail]  = useState('');
  const [message,         setMessage]         = useState('');
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState<DoneState | null>(null);

  // Enabled payment methods from site settings
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean>>({
    stripe: true, interac_etransfer: true, pay_at_store: true,
  });
  useEffect(() => {
    api.get('/payment-methods').then(r => {
      setEnabledMethods(r.data);
      if (r.data[paymentMethod] === false) {
        const first = (['stripe', 'interac_etransfer', 'pay_at_store'] as PaymentMethod[])
          .find(m => r.data[m] !== false) ?? 'stripe';
        setPaymentMethod(first);
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/gift-cards', {
        amount,
        payment_method:    paymentMethod,
        purchaser_name:    purchaserName,
        purchaser_email:   purchaserEmail,
        send_to_recipient: sendToRecipient,
        recipient_name:    sendToRecipient ? recipientName : undefined,
        recipient_email:   sendToRecipient ? recipientEmail : undefined,
        message:           message || undefined,
      });

      // ── Interac / Pay at Store: no Stripe needed, just show instructions ──
      if (paymentMethod === 'interac_etransfer') {
        setDone({ type: 'interac', reference: data.reference, amount, interacEmail: data.interac_email, purchaserEmail });
        return;
      }
      if (paymentMethod === 'pay_at_store') {
        setDone({ type: 'store', reference: data.reference, amount, purchaserEmail });
        return;
      }

      // ── Stripe: confirm card payment ──
      if (data.client_secret) {
        if (!stripe || !elements) return;
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
          payment_method: { card: cardElement },
        });

        if (error) { toast.error(error.message || 'Payment failed'); return; }
        if (paymentIntent?.status !== 'succeeded') { toast.error('Payment not completed.'); return; }

        const { data: confirmed } = await api.post('/gift-cards/confirm', {
          gift_card_id:      data.gift_card_id,
          payment_intent_id: paymentIntent.id,
        });
        setDone({ type: 'stripe', code: confirmed.code, sentTo: confirmed.sent_to, amount });
      } else {
        // Dev mode (no Stripe keys configured)
        const { data: confirmed } = await api.post('/gift-cards/confirm', {
          gift_card_id:      data.gift_card_id,
          payment_intent_id: 'dev_' + Date.now(),
        });
        setDone({ type: 'stripe', code: confirmed.code, sentTo: confirmed.sent_to, amount });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screens ────────────────────────────────────────────────────────
  if (done) {
    if (done.type === 'stripe') {
      return (
        <div className="max-w-lg mx-auto text-center py-16 px-4">
          <div className="bg-white border border-[#cccacc] p-10">
            <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Gift Card Ready!</h2>
            <p className="text-[#6b6b6b] text-sm mb-4">
              Emailed to <strong>{done.sentTo}</strong>
            </p>
            <GiftCardVisual amount={done.amount} code={done.code} />
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products" className="bg-[#213885] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#7a2340] transition-colors">
                Continue Shopping
              </Link>
              <button onClick={() => setDone(null)} className="border border-[#cccacc] text-[#213885] px-6 py-2.5 text-sm font-semibold hover:border-[#213885] transition-colors">
                Buy Another
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (done.type === 'interac') {
      return (
        <div className="max-w-lg mx-auto text-center py-16 px-4">
          <div className="bg-white border border-[#cccacc] p-10">
            <div className="w-16 h-16 bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Almost done!</h2>
            <p className="text-[#6b6b6b] text-sm mb-6">
              Your gift card order is placed. Complete your Interac e-Transfer to activate it.
            </p>
            <div className="bg-amber-50 border border-amber-200 text-left p-5 mb-6 space-y-3">
              <p className="text-sm font-bold text-amber-900">Send Interac e-Transfer:</p>
              <div className="text-sm text-amber-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-amber-700">Amount:</span>
                  <span className="font-bold">${done.amount}.00 CAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Send to:</span>
                  <span className="font-bold font-mono">{done.interacEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Comment / Message:</span>
                  <span className="font-bold font-mono">{done.reference}</span>
                </div>
              </div>
              <p className="text-xs text-amber-700 border-t border-amber-200 pt-3 mt-3">
                Use <strong>{done.reference}</strong> as your e-Transfer comment so we can match your payment.
                Your gift card will be activated and emailed within a few hours.
              </p>
            </div>
            <p className="text-xs text-[#6b6b6b] mb-6">
              Confirmation sent to <strong>{done.purchaserEmail}</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products" className="bg-[#213885] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#7a2340] transition-colors">
                Continue Shopping
              </Link>
              <button onClick={() => setDone(null)} className="border border-[#cccacc] text-[#213885] px-6 py-2.5 text-sm font-semibold hover:border-[#213885] transition-colors">
                Buy Another
              </button>
            </div>
          </div>
        </div>
      );
    }

    // pay_at_store
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="bg-white border border-[#cccacc] p-10">
          <div className="w-16 h-16 bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Order Placed!</h2>
          <p className="text-[#6b6b6b] text-sm mb-6">
            Visit our store to complete payment and pick up your gift card.
          </p>
          <div className="bg-blue-50 border border-blue-200 text-left p-5 mb-6 space-y-2">
            <p className="text-sm font-bold text-blue-900">Your Reference Number</p>
            <p className="text-2xl font-mono font-bold text-blue-800">{done.reference}</p>
            <p className="text-xs text-blue-700 mt-2">
              Mention this number when you visit — staff will verify and activate your gift card in person.
            </p>
          </div>
          <p className="text-xs text-[#6b6b6b] mb-6">
            Confirmation sent to <strong>{done.purchaserEmail}</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products" className="bg-[#213885] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#7a2340] transition-colors">
              Continue Shopping
            </Link>
            <button onClick={() => setDone(null)} className="border border-[#cccacc] text-[#213885] px-6 py-2.5 text-sm font-semibold hover:border-[#213885] transition-colors">
              Buy Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Purchase form ──────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#213885] mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to shop
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#213885] flex items-center justify-center">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Digital Gift Card</h1>
          <p className="text-sm text-[#6b6b6b]">The perfect gift for any occasion</p>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-white border border-[#cccacc] p-6 mb-4">
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4 uppercase tracking-wide">Select Amount</h2>
        <div className="grid grid-cols-4 gap-3">
          {DENOMINATIONS.map((d) => (
            <button key={d} type="button" onClick={() => setAmount(d)}
              className={`py-4 text-lg font-bold border-2 transition-colors ${
                amount === d ? 'border-[#213885] bg-[#213885] text-white' : 'border-[#cccacc] text-[#1a1a1a] hover:border-[#213885]'
              }`}>
              ${d}
            </button>
          ))}
        </div>
        <GiftCardVisual amount={amount} />
      </div>

      {/* Your info */}
      <div className="bg-white border border-[#cccacc] p-6 mb-4">
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4 uppercase tracking-wide flex items-center gap-2">
          <User className="w-4 h-4" /> Your Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Your Name *</label>
            <input value={purchaserName} onChange={e => setPurchaserName(e.target.value)} required
              placeholder="Jane Smith"
              className="w-full border border-[#cccacc] px-3 py-2.5 text-sm focus:outline-none focus:border-[#213885]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Your Email *</label>
            <input value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} required type="email"
              placeholder="jane@example.com"
              className="w-full border border-[#cccacc] px-3 py-2.5 text-sm focus:outline-none focus:border-[#213885]" />
          </div>
        </div>
      </div>

      {/* Recipient */}
      <div className="bg-white border border-[#cccacc] p-6 mb-4">
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3 uppercase tracking-wide flex items-center gap-2">
          <Send className="w-4 h-4" /> Gift Card Delivery
        </h2>
        <div className="flex flex-col gap-3 mb-4">
          {[
            { val: false, title: 'Send code to me', desc: "You'll get the code — share it however you like" },
            { val: true,  title: 'Email the recipient directly', desc: "We'll email the gift card straight to them" },
          ].map(({ val, title, desc }) => (
            <label key={String(val)} className={`flex items-start gap-3 p-4 border-2 cursor-pointer transition-colors ${
              sendToRecipient === val ? 'border-[#213885] bg-[#ecdfd2]' : 'border-[#cccacc] hover:border-[#213885]'
            }`}>
              <input type="radio" checked={sendToRecipient === val} onChange={() => setSendToRecipient(val)} className="mt-0.5 accent-[#213885]" />
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">{title}</p>
                <p className="text-xs text-[#6b6b6b] mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>

        {sendToRecipient && (
          <div className="space-y-4 pt-2 border-t border-[#f0e8e0]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Recipient's Name *</label>
                <input value={recipientName} onChange={e => setRecipientName(e.target.value)} required={sendToRecipient}
                  placeholder="Rahim Ahmed"
                  className="w-full border border-[#cccacc] px-3 py-2.5 text-sm focus:outline-none focus:border-[#213885]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Recipient's Email *</label>
                <input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} required={sendToRecipient} type="email"
                  placeholder="rahim@example.com"
                  className="w-full border border-[#cccacc] px-3 py-2.5 text-sm focus:outline-none focus:border-[#213885]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b6b6b] mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Personal Message <span className="text-[#b0a098]">(optional)</span>
              </label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={500}
                placeholder="Happy birthday! Hope you find some great reads…"
                className="w-full border border-[#cccacc] px-3 py-2.5 text-sm focus:outline-none focus:border-[#213885] resize-none" />
              <p className="text-xs text-[#b0a098] text-right mt-0.5">{message.length}/500</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment method */}
      <div className="bg-white border border-[#cccacc] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4 uppercase tracking-wide">How would you like to pay?</h2>
        <div className="space-y-3">
          {enabledMethods['stripe'] !== false && (
            <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-colors ${
              paymentMethod === 'stripe' ? 'border-[#213885] bg-[#ecdfd2]' : 'border-[#cccacc] hover:border-[#213885]'
            }`}>
              <input type="radio" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} className="mt-1 accent-[#213885]" />
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]">
                  <CreditCard className="w-4 h-4 text-[#213885]" /> Credit / Debit Card
                </div>
                <p className="text-xs text-[#6b6b6b] mt-0.5">Pay securely online — gift card activated instantly</p>
              </div>
            </label>
          )}

          {enabledMethods['interac_etransfer'] !== false && (
            <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-colors ${
              paymentMethod === 'interac_etransfer' ? 'border-[#213885] bg-[#ecdfd2]' : 'border-[#cccacc] hover:border-[#213885]'
            }`}>
              <input type="radio" checked={paymentMethod === 'interac_etransfer'} onChange={() => setPaymentMethod('interac_etransfer')} className="mt-1 accent-[#213885]" />
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]">
                  <Smartphone className="w-4 h-4 text-[#213885]" /> Interac e-Transfer
                </div>
                <p className="text-xs text-[#6b6b6b] mt-0.5">Send via Interac — we'll activate your gift card once received</p>
              </div>
            </label>
          )}

          {enabledMethods['pay_at_store'] !== false && (
            <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-colors ${
              paymentMethod === 'pay_at_store' ? 'border-[#213885] bg-[#ecdfd2]' : 'border-[#cccacc] hover:border-[#213885]'
            }`}>
              <input type="radio" checked={paymentMethod === 'pay_at_store'} onChange={() => setPaymentMethod('pay_at_store')} className="mt-1 accent-[#213885]" />
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]">
                  <Store className="w-4 h-4 text-[#213885]" /> Pay at Store
                </div>
                <p className="text-xs text-[#6b6b6b] mt-0.5">Visit us in person — we'll activate your gift card when you pay</p>
              </div>
            </label>
          )}
        </div>

        {/* Info boxes */}
        {paymentMethod === 'interac_etransfer' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 p-4 flex gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              After submitting, you'll receive a <strong>reference number</strong> to use as the e-Transfer comment.
              We'll activate and email your gift card within a few hours of receiving payment.
            </p>
          </div>
        )}
        {paymentMethod === 'pay_at_store' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 p-4 flex gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              After submitting, you'll receive a <strong>reference number</strong>. Bring it to our store —
              staff will verify and activate your gift card when you pay.
            </p>
          </div>
        )}

        {/* Stripe card input */}
        {paymentMethod === 'stripe' && (
          <div className="mt-4 border border-[#cccacc] px-4 py-3 bg-[#ecdfd2]">
            <CardElement options={{
              style: { base: { fontSize: '15px', color: '#1a1a1a', '::placeholder': { color: '#9ca3af' } } },
            }} />
            <p className="text-xs text-[#9b9590] mt-2">
              Test: 4242 4242 4242 4242 — any future date and CVC
            </p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-sm font-semibold text-[#1a1a1a] border-t border-[#f0e8e0] pt-4">
          <span>Total</span>
          <span className="text-xl">${amount}.00 <span className="text-xs font-normal text-[#6b6b6b]">CAD</span></span>
        </div>
      </div>

      <button type="submit" disabled={loading || (paymentMethod === 'stripe' && !stripe)}
        className="w-full bg-[#213885] hover:bg-[#7a2340] disabled:opacity-50 text-white font-bold py-4 text-base transition-colors flex items-center justify-center gap-2">
        {loading ? 'Processing…' : (
          paymentMethod === 'stripe'
            ? <><CreditCard className="w-5 h-5" /> Pay ${amount} CAD</>
            : paymentMethod === 'interac_etransfer'
            ? <><Smartphone className="w-5 h-5" /> Place Order — Pay via Interac</>
            : <><Store className="w-5 h-5" /> Place Order — Pay at Store</>
        )}
      </button>
      <p className="text-xs text-[#b0a098] text-center mt-3">
        {paymentMethod === 'stripe'
          ? 'Gift card delivered by email immediately after payment.'
          : 'Gift card delivered after we confirm your payment.'}
      </p>
    </form>
  );
}

export default function GiftCardsPage() {
  return (
    <div className="min-h-screen bg-[#ecdfd2]">
      <Elements stripe={stripePromise}>
        <GiftCardForm />
      </Elements>
    </div>
  );
}
