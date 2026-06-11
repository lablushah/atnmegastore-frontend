'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import { loadStripe } from '@stripe/stripe-js';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { Link } from '@/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CreditCard, Store, Smartphone, ChevronDown, ChevronUp, Info, Tag, X, Truck, MapPin, Clock, Gift } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const ALL_PAYMENT_METHODS = [
  { id: 'stripe',            label: 'Credit / Debit Card', icon: CreditCard,  desc: 'Pay securely online with Stripe' },
  { id: 'interac_etransfer', label: 'Interac e-Transfer',  icon: Smartphone,  desc: 'Send payment via Interac — use your order number as the comment' },
  { id: 'pay_at_store',      label: 'Pay at Store',        icon: Store,       desc: 'Order now, pay when you visit us in person' },
] as const;

type PaymentMethod = (typeof ALL_PAYMENT_METHODS)[number]['id'];

type ActivePayments = Record<string, boolean>;

function CheckoutForm() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const s = useSiteSettingsStore((st) => st.settings);
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);

  // Sync cart to backend for abandoned-cart recovery (fire-and-forget)
  const syncCart = useCallback((email: string, name?: string) => {
    if (!email || items.length === 0) return;
    const cartItems = items.map(i => ({
      product_id: i.product.id, name: i.product.name, price: i.product.price,
      quantity: i.quantity, image: i.product.image ?? null,
    }));
    api.post('/cart/sync', { email, name: name || undefined, cart_items: cartItems }).catch(() => {});
  }, [items]);

  const markCartRecovered = useCallback((email: string) => {
    if (!email) return;
    api.post('/cart/mark-recovered', { email }).catch(() => {});
  }, []);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');

  // Active payment methods from the server
  const [activePayments, setActivePayments] = useState<ActivePayments>({ stripe: true, interac_etransfer: true, pay_at_store: true });
  const PAYMENT_METHODS = ALL_PAYMENT_METHODS.filter(m => activePayments[m.id] !== false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');

  useEffect(() => {
    api.get('/payment-methods').then(r => {
      setActivePayments(r.data);
      // If currently selected method got disabled, switch to first available
      setPaymentMethod(prev => r.data[prev] !== false ? prev : (ALL_PAYMENT_METHODS.find(m => r.data[m.id] !== false)?.id ?? 'pay_at_store'));
    }).catch(() => {});
  }, []);

  // Coupon state
  const [couponInput,   setCouponInput]   = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError,   setCouponError]   = useState('');
  const [coupon, setCoupon] = useState<{
    code: string; discountAmount: number; label: string; finalTotal: number;
  } | null>(null);

  // Gift card state
  const [gcInput,    setGcInput]    = useState('');
  const [gcApplying, setGcApplying] = useState(false);
  const [gcError,    setGcError]    = useState('');
  const [giftCard,   setGiftCard]   = useState<{ code: string; balance: number } | null>(null);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponApplying(true);
    try {
      const { data } = await api.post('/discount/validate', {
        code: couponInput.trim(),
        order_total: total(),
      });
      setCoupon({
        code:           data.code,
        discountAmount: data.discount_amount,
        label:          data.label,
        finalTotal:     data.final_total,
      });
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || 'Invalid code.');
    } finally {
      setCouponApplying(false);
    }
  };

  const removeCoupon = () => { setCoupon(null); setCouponError(''); };

  const applyGiftCard = async () => {
    if (!gcInput.trim()) return;
    setGcError('');
    setGcApplying(true);
    try {
      const { data } = await api.post('/gift-cards/validate', { code: gcInput.trim() });
      setGiftCard({ code: data.code, balance: data.balance });
      setGcInput('');
    } catch (err: any) {
      setGcError(err?.response?.data?.message || 'Invalid or expired gift card.');
    } finally { setGcApplying(false); }
  };
  const removeGiftCard = () => { setGiftCard(null); setGcError(''); };

  const [guest, setGuest] = useState({ name: '', email: '', phone: '' });
  const [shipping, setShipping] = useState({
    shipping_name: user?.name || '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'CA',
  });
  const [notes, setNotes] = useState('');

  const handleShipping = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setShipping((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleGuest = (e: React.ChangeEvent<HTMLInputElement>) =>
    setGuest((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Sync cart for logged-in users as soon as checkout page loads with items
  useEffect(() => {
    if (user?.email && items.length > 0) syncCart(user.email, user.name);
  }, [user, syncCart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shipping state
  const [shippingRate, setShippingRate] = useState<{
    rate: number; original_rate: number; is_free: boolean;
    zone_name: string; free_shipping_threshold: number;
  } | null>(null);
  const [shippingError,      setShippingError]      = useState('');
  const [shippingCalculating, setShippingCalculating] = useState(false);

  const calculateShipping = useCallback(async (country: string, province: string, subtotal: number) => {
    if (!country) return;
    setShippingCalculating(true);
    setShippingError('');
    try {
      const { data } = await api.post('/shipping/calculate', {
        country_code:  country,
        province_code: province || undefined,
        subtotal,
      });
      setShippingRate(data);
    } catch (err: any) {
      setShippingRate(null);
      setShippingError(err?.response?.data?.message || 'Shipping not available for this destination.');
    } finally { setShippingCalculating(false); }
  }, []);

  // Recalculate whenever country or state changes
  useEffect(() => {
    const country  = shipping.shipping_country;
    const province = shipping.shipping_state;
    const subtotal = total();
    if (country) calculateShipping(country, province, subtotal);
  }, [shipping.shipping_country, shipping.shipping_state]);

  // Recalculate when coupon changes (subtotal same, but for free-shipping threshold display)
  useEffect(() => {
    if (shippingRate === null && shipping.shipping_country) {
      calculateShipping(shipping.shipping_country, shipping.shipping_state, total());
    }
  }, [coupon]);

  const isPickup    = deliveryMethod === 'pickup';
  const shippingCost = isPickup ? 0 : (shippingRate?.rate ?? 0);
  const grandTotal   = () => {
    const base        = coupon ? coupon.finalTotal : total();
    const afterShip   = base + shippingCost;
    const gcApplied   = giftCard ? Math.min(giftCard.balance, afterShip) : 0;
    return Math.max(0, afterShip - gcApplied);
  };
  const gcAppliedAmount = () => {
    const base      = coupon ? coupon.finalTotal : total();
    const afterShip = base + shippingCost;
    return giftCard ? Math.min(giftCard.balance, afterShip) : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ...(isPickup ? {} : shipping),
        delivery_method: deliveryMethod,
        payment_method:  paymentMethod,
        notes:           notes || undefined,
        coupon_code:     coupon?.code || undefined,
        gift_card_code:  giftCard?.code || undefined,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      };

      if (user) {
        payload.name  = user.name;
        payload.email = user.email;
      } else {
        payload.name  = guest.name;
        payload.email = guest.email;
        payload.phone = guest.phone || undefined;
      }

      const { data } = await api.post('/checkout', payload);

      const orderEmail = user?.email || guest.email;

      // Fully covered by gift card — no Stripe needed
      if (data.total === 0 || grandTotal() === 0) {
        markCartRecovered(orderEmail);
        clearCart();
        toast.success('Order placed! Gift card applied.');
        router.push(`/order-confirmation/${data.order_id}?method=gift_card`);
        return;
      }

      // Stripe card payment
      if (paymentMethod === 'stripe') {
        if (!stripe || !elements) return;
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
          payment_method: { card: cardElement },
        });

        if (error) {
          toast.error(error.message || 'Payment failed');
          setLoading(false);
          return;
        }

        if (paymentIntent?.status === 'succeeded') {
          await api.post('/checkout/confirm', { order_id: data.order_id });
          markCartRecovered(orderEmail);
          clearCart();
          toast.success('Payment successful! Order placed.');
          router.push(`/order-confirmation/${data.order_id}?method=stripe`);
        }
        return;
      }

      // Non-Stripe: order placed, show confirmation
      markCartRecovered(orderEmail);
      clearCart();
      router.push(`/order-confirmation/${data.order_id}?method=${paymentMethod}&email=${encodeURIComponent(guest.email || user?.email || '')}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Checkout failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
      {!user && (
        <p className="text-sm text-gray-500 mb-8">
          Already have an account?{' '}
          <Link href="/login?redirect=/checkout" className="text-indigo-600 hover:underline font-medium">
            Sign in
          </Link>{' '}
          to save your order history.
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">

          {/* ── Delivery Method ────────────────────────────── */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How would you like to receive your order?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ship to address */}
              <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                deliveryMethod === 'delivery'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" name="delivery_method" value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={() => setDeliveryMethod('delivery')}
                  className="mt-1 accent-indigo-600" />
                <div>
                  <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                    <Truck className="w-4 h-4 text-indigo-600" /> Ship to My Address
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Delivered to your door. Shipping rates calculated at checkout.
                  </p>
                </div>
              </label>

              {/* Store pickup */}
              <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                deliveryMethod === 'pickup'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" name="delivery_method" value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={() => setDeliveryMethod('pickup')}
                  className="mt-1 accent-green-600" />
                <div>
                  <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                    <Store className="w-4 h-4 text-green-600" /> Pick Up In Store
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">FREE</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Collect from our Danforth Avenue store. No shipping charge.
                  </p>
                </div>
              </label>
            </div>

            {/* Store pickup info box */}
            {deliveryMethod === 'pickup' && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-green-900">ATN Book & Crafts — Pickup Location</p>
                <div className="flex items-start gap-2 text-sm text-green-800">
                  <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{s.site_address}, {s.site_city}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-green-800">
                  <Clock className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{s.site_hours}</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Your order will be held for 7 days. Bring your order confirmation number when you visit.
                </p>
              </div>
            )}
          </div>

          {/* Guest Info */}
          {!user && (
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    name="name"
                    value={guest.name}
                    onChange={handleGuest}
                    required
                    placeholder="John Doe"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={guest.email}
                    onChange={handleGuest}
                    onBlur={() => syncCart(guest.email, guest.name)}
                    required
                    placeholder="you@example.com"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">We&apos;ll send your order confirmation here</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    name="phone"
                    type="tel"
                    value={guest.phone}
                    onChange={handleGuest}
                    placeholder="+1 (555) 000-0000"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Shipping Address — only for delivery */}
          {!isPickup && (
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'shipping_name',    label: 'Full Name *',       col: 2, placeholder: 'John Doe'   },
                  { name: 'shipping_address', label: 'Street Address *',  col: 2, placeholder: '123 Main St' },
                  { name: 'shipping_city',    label: 'City *',            col: 1, placeholder: 'Toronto'     },
                  { name: 'shipping_state',   label: 'Province / State',  col: 1, placeholder: 'ON'          },
                  { name: 'shipping_zip',     label: 'Postal Code *',     col: 1, placeholder: 'M5V 2T6'    },
                  { name: 'shipping_country', label: 'Country *',         col: 1, placeholder: 'CA'          },
                ].map(({ name, label, col, placeholder }) => (
                  <div key={name} className={col === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      name={name}
                      value={(shipping as any)[name]}
                      onChange={handleShipping}
                      required={!label.includes('optional') && !label.includes('Province')}
                      placeholder={placeholder}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                <label
                  key={id}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    paymentMethod === id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={id}
                    checked={paymentMethod === id}
                    onChange={() => setPaymentMethod(id)}
                    className="mt-1 accent-indigo-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <Icon className="w-4 h-4 text-indigo-600" />
                      {label}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Stripe Card Input */}
            {paymentMethod === 'stripe' && (
              <div className="mt-4 border rounded-xl px-4 py-4 bg-gray-50">
                <CardElement
                  options={{
                    style: {
                      base: { fontSize: '15px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } },
                    },
                  }}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Test card: 4242 4242 4242 4242 — any future date and CVC
                </p>
              </div>
            )}

            {/* Interac info box */}
            {paymentMethod === 'interac_etransfer' && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">How Interac e-Transfer works:</p>
                  <ol className="list-decimal list-inside space-y-1 text-yellow-700">
                    <li>Place your order — you&apos;ll receive an <strong>Order Number</strong></li>
                    <li>Send the exact amount to <strong>{s.interac_email}</strong></li>
                    <li>Use your <strong>Order Number</strong> as the e-transfer comment/message</li>
                    <li>Your order will be processed once payment is received</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Pay at store info box */}
            {paymentMethod === 'pay_at_store' && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Store className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Pay when you visit us:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Place your order — you&apos;ll receive an <strong>Order Number</strong></li>
                    <li>Visit our store and quote your <strong>Order Number</strong> to staff</li>
                    <li>We accept cash, debit, and credit cards in store</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-2xl border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special instructions for your order…"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 items-start">
                  {item.product.image && (
                    <img src={item.product.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">
                    ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            {/* Coupon input */}
            <div className="border-t pt-4 mb-2">
              {coupon ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 text-sm">
                  <Tag className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="flex-1 text-green-800 font-medium">
                    <span className="font-mono font-bold">{coupon.code}</span> — {coupon.label} applied
                  </span>
                  <button type="button" onClick={removeCoupon} className="text-green-600 hover:text-green-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Discount Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                      placeholder="e.g. WELCOME10"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 uppercase"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponApplying || !couponInput.trim()}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors shrink-0"
                    >
                      {couponApplying ? '…' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-600 mt-1">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Gift card input */}
            <div className="border-t pt-4 mb-2">
              {giftCard ? (
                <div className="flex items-center gap-2 bg-[#fdf3e8] border border-[#cccacc] px-3 py-2 text-sm">
                  <Gift className="w-4 h-4 text-[#213885] shrink-0" />
                  <span className="flex-1 text-[#213885] font-medium">
                    <span className="font-mono font-bold">{giftCard.code}</span> — ${giftCard.balance.toFixed(2)} balance
                  </span>
                  <button type="button" onClick={removeGiftCard} className="text-[#213885] hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Gift Card
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={gcInput}
                      onChange={(e) => { setGcInput(e.target.value.toUpperCase()); setGcError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyGiftCard())}
                      placeholder="ATN-XXXX-XXXX-XXXX"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#213885] uppercase"
                    />
                    <button
                      type="button"
                      onClick={applyGiftCard}
                      disabled={gcApplying || !gcInput.trim()}
                      className="px-4 py-2 bg-[#213885] hover:bg-[#7a2340] text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors shrink-0"
                    >
                      {gcApplying ? '…' : 'Apply'}
                    </button>
                  </div>
                  {gcError && <p className="text-xs text-red-600 mt-1">{gcError}</p>}
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>${total().toFixed(2)}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Discount ({coupon.label})</span>
                  <span>−${coupon.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {isPickup ? (
                    <span className="text-green-600 font-medium">Free — Store Pickup</span>
                  ) : shippingCalculating ? (
                    <span className="text-xs text-gray-400 animate-pulse">Calculating…</span>
                  ) : shippingRate ? (
                    shippingRate.is_free
                      ? <span className="text-green-600 font-medium">Free 🎉</span>
                      : <span>${shippingRate.rate.toFixed(2)}</span>
                  ) : (
                    <span className="text-xs text-gray-400">Enter address above</span>
                  )}
                </span>
              </div>
              {!isPickup && shippingRate && !shippingRate.is_free && shippingRate.free_shipping_threshold > 0 && (
                <p className="text-xs text-[#9b9590]">
                  Free shipping on orders over ${shippingRate.free_shipping_threshold.toFixed(0)}
                </p>
              )}
              {!isPickup && shippingError && (
                <p className="text-xs text-red-600">{shippingError}</p>
              )}
              {!isPickup && shippingRate && (
                <p className="text-xs text-[#9b9590]">via {shippingRate.zone_name}</p>
              )}
              {giftCard && gcAppliedAmount() > 0 && (
                <div className="flex justify-between text-[#213885] font-medium">
                  <span>Gift Card ({giftCard.code.slice(-8)})</span>
                  <span>−${gcAppliedAmount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t">
                <span>Total</span><span>${grandTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (paymentMethod === 'stripe' && !stripe)}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors text-base"
            >
              {loading
                ? 'Processing…'
                : paymentMethod === 'stripe'
                ? `Pay $${grandTotal().toFixed(2)} CAD`
                : 'Place Order'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              By placing your order you agree to our terms and conditions.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
