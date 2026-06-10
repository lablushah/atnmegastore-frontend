'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Order } from '@/lib/types';
import { Package, ChevronRight, ArrowLeft } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: 'bg-yellow-50 text-yellow-700',
  pending:          'bg-orange-50 text-orange-700',
  paid:             'bg-blue-50 text-blue-700',
  shipped:          'bg-purple-50 text-purple-700',
  delivered:        'bg-green-50 text-green-700',
  cancelled:        'bg-red-50 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Awaiting Payment',
  pending:          'Pending',
  paid:             'Paid',
  shipped:          'Shipped',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

export default function OrdersPage() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/login?redirect=/orders'); return; }
    api.get('/orders')
      .then(r => setOrders(r.data.data ?? r.data))
      .finally(() => setLoading(false));
  }, [_hasHydrated, user]);

  if (!user) return null;

  return (
    <div className="min-h-[80vh] bg-[#f9f5f2] py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <Link href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Account
        </Link>

        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6"
          style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
          My Orders
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-[#cccacc] h-20 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#cccacc] py-20 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-[#cccacc]" />
            <p className="text-[#6b6b6b] mb-4">You haven&apos;t placed any orders yet.</p>
            <Link href="/products"
              className="inline-block bg-[#213885] hover:bg-[#081849] text-white text-sm font-medium px-5 py-2.5 transition-colors">
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="block bg-white border border-[#cccacc] hover:border-[#213885] hover:shadow-sm transition-all p-5 group">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-[#1a1a1a] text-sm">Order #{order.id}</p>
                      <span className={`text-xs px-2 py-0.5 font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#6b6b6b]">
                      {new Date(order.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {order.items?.length ? ` · ${order.items.length} item${order.items.length !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-[#1a1a1a]">${parseFloat(order.total).toFixed(2)}</span>
                    <ChevronRight className="w-4 h-4 text-[#6b6b6b] group-hover:text-[#213885] transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
