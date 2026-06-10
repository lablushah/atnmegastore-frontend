'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import PageLoader from '@/components/ui/PageLoader';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Order { id: number; status: string; total: string; notes: string | null; created_at: string; items: { id: number; quantity: number; price: string; product: { name: string; image?: string } | null }[]; }

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: 'bg-yellow-50 text-yellow-700', pending: 'bg-orange-50 text-orange-700',
  paid: 'bg-blue-50 text-blue-700', shipped: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/login'); return; }
    api.get(`/orders/${id}`).then(r => setOrder(r.data)).catch(() => router.push('/orders')).finally(() => setLoading(false));
  }, [_hasHydrated, id, user]);

  if (loading) return <PageLoader />;
  if (!order) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/orders" className="flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Order #{order.id}</h1>
        <span className={`text-xs px-3 py-1 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>{order.status.replace('_', ' ')}</span>
      </div>

      <div className="bg-white border border-[#cccacc] p-6 mb-4">
        <h2 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2"><Package className="w-4 h-4" /> Items</h2>
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              {item.product?.image && <img src={item.product.image} alt="" className="w-12 h-12 object-cover" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1a1a1a]">{item.product?.name ?? 'Product'}</p>
                <p className="text-xs text-[#6b6b6b]">Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
              </div>
              <p className="text-sm font-medium">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between font-semibold">
          <span>Total</span><span>${parseFloat(order.total).toFixed(2)}</span>
        </div>
      </div>

      {order.notes && (
        <div className="bg-white border border-[#cccacc] p-4 text-sm text-[#6b6b6b]">
          <span className="font-medium text-[#1a1a1a]">Notes: </span>{order.notes}
        </div>
      )}

      <p className="text-xs text-[#6b6b6b] mt-4">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
    </div>
  );
}
