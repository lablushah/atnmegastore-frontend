'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/navigation';
import { CheckCircle, Package } from 'lucide-react';
import PageLoader from '@/components/ui/PageLoader';
import api from '@/lib/api';

interface Order { id: number; status: string; total: string; created_at: string; guest_name?: string; guest_email?: string; items: { id: number; quantity: number; price: string; product: { name: string; image?: string } | null }[]; }

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get('email');

    const load = async () => {
      try {
        // Authenticated customers — works directly
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch {
        // Guest users — fall back to public lookup using email from URL
        if (email) {
          try {
            const { data } = await api.post('/orders/lookup', { order_id: Number(id), email });
            setOrder(data);
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) return <PageLoader />;
  if (!order) return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-gray-500">Order not found.</p></div>;

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

      <div className="flex gap-4 justify-center">
        <Link href="/" className="border border-[#cccacc] px-6 py-2 text-sm text-[#1a1a1a] hover:bg-gray-50 transition-colors">Continue Shopping</Link>
        <Link href="/orders" className="bg-[#213885] hover:bg-[#081849] text-white px-6 py-2 text-sm font-medium transition-colors">View My Orders</Link>
      </div>
    </div>
  );
}
