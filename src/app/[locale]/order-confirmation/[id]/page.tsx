'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Link } from '@/navigation';
import { CheckCircle, Package, UserPlus, LogIn } from 'lucide-react';
import PageLoader from '@/components/ui/PageLoader';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Order {
  id: number;
  status: string;
  total: string;
  created_at: string;
  guest_name?: string;
  guest_email?: string;
  email_has_account?: boolean;
  items: { id: number; quantity: number; price: string; product: { name: string; image?: string } | null }[];
}

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Registration form state
  const [password, setPassword]       = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered]   = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    const load = async () => {
      try {
        // Authenticated customers — works directly
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch {
        // Guest users — fall back to public lookup using secure token
        if (token) {
          try {
            const { data } = await api.post('/orders/lookup', { order_id: Number(id), token });
            setOrder(data);
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, searchParams]);

  const handleRegister = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const token = searchParams.get('token');
    if (!token || !order) return;

    setRegistering(true);
    try {
      await api.post('/orders/register-from-guest', {
        order_id: Number(id),
        token,
        password,
        password_confirmation: passConfirm,
      });
      setRegistered(true);
      toast.success('Account created! Check your email to verify.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!order) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="text-gray-500">Order not found.</p>
    </div>
  );

  const isGuest = !user && !!order.guest_email;
  const token   = searchParams.get('token');

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Order Confirmed!</h1>
        <p className="text-[#6b6b6b] mt-2">Thank you for your order. We&apos;ll get it ready soon.</p>
        <p className="text-sm text-[#6b6b6b] mt-1">Order <span className="font-semibold text-[#1a1a1a]">#{order.id}</span></p>
      </div>

      <div className="bg-white border border-[#cccacc] p-6 mb-6">
        <h2 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2"><Package className="w-4 h-4" /> Order Summary</h2>
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              {item.product?.image && <img src={item.product.image} alt="" className="w-12 h-12 object-cover" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1a1a1a]">{item.product?.name ?? 'Product'}</p>
                <p className="text-xs text-[#6b6b6b]">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>${parseFloat(order.total).toFixed(2)}</span>
        </div>
      </div>

      {/* Guest account prompt */}
      {isGuest && token && !registered && (
        order.email_has_account ? (
          /* Email already registered — prompt to log in */
          <div className="bg-[#f0f4ff] border border-[#c7d4f5] p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <LogIn className="w-5 h-5 text-[#213885]" />
              <h3 className="font-semibold text-[#1a1a1a]">You already have an account</h3>
            </div>
            <p className="text-sm text-[#6b6b6b] mb-4">
              <span className="font-medium text-[#1a1a1a]">{order.guest_email}</span> is linked to an existing account. Log in to see your full order history.
            </p>
            <Link
              href={`/login?redirect=/order-confirmation/${order.id}${token ? `?token=${token}` : ''}`}
              className="inline-block w-full text-center bg-[#213885] hover:bg-[#081849] text-white py-2 text-sm font-medium transition-colors"
            >
              Log In to Your Account
            </Link>
          </div>
        ) : (
          /* New email — offer registration */
          <div className="bg-[#f9f7ff] border border-[#d4c9f5] p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-[#213885]" />
              <h3 className="font-semibold text-[#1a1a1a]">Save time on your next order</h3>
            </div>
            <p className="text-sm text-[#6b6b6b] mb-4">
              Create a free account with <span className="font-medium text-[#1a1a1a]">{order.guest_email}</span> and your order history, address, and details will be saved for faster checkout.
            </p>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 symbol"
                  className="w-full border border-[#cccacc] px-3 py-2 text-sm focus:outline-none focus:border-[#213885]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passConfirm}
                  onChange={e => setPassConfirm(e.target.value)}
                  required
                  placeholder="Repeat password"
                  className="w-full border border-[#cccacc] px-3 py-2 text-sm focus:outline-none focus:border-[#213885]"
                />
              </div>
              <button
                type="submit"
                disabled={registering}
                className="w-full bg-[#213885] hover:bg-[#081849] text-white py-2 text-sm font-medium transition-colors disabled:opacity-60"
              >
                {registering ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          </div>
        )
      )}

      {isGuest && registered && (
        <div className="bg-green-50 border border-green-200 p-4 mb-6 text-center">
          <p className="text-sm text-green-800 font-medium">Account created!</p>
          <p className="text-xs text-green-700 mt-1">Check your email at <span className="font-medium">{order.guest_email}</span> to verify your account.</p>
        </div>
      )}

      <div className="flex gap-4 justify-center flex-wrap">
        <Link href="/" className="border border-[#cccacc] px-6 py-2 text-sm text-[#1a1a1a] hover:bg-gray-50 transition-colors">
          Continue Shopping
        </Link>
        {user ? (
          <Link href="/orders" className="bg-[#213885] hover:bg-[#081849] text-white px-6 py-2 text-sm font-medium transition-colors">
            View My Orders
          </Link>
        ) : (
          <p className="text-xs text-[#6b6b6b] text-center w-full mt-1">
            A confirmation email has been sent to your inbox.
          </p>
        )}
      </div>
    </div>
  );
}
