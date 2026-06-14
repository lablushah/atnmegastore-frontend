'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Order } from '@/lib/types';
import { Package, ChevronRight, ArrowLeft, Download, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

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

function orderStatusLabel(status: string, deliveryMethod: string): string {
  if (status === 'delivered' && deliveryMethod === 'pickup') return 'Picked Up';
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

const INVOICE_STATUSES = ['paid', 'shipped', 'delivered'];

export default function OrdersPage() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/login?redirect=/orders'); return; }
    api.get('/orders')
      .then(r => {
        setOrders(r.data.data ?? r.data);
        setTotalSpent(r.data.total_spent ?? 0);
      })
      .finally(() => setLoading(false));
  }, [_hasHydrated, user]);

  async function downloadInvoice(orderId: number) {
    setDownloading(orderId);
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download invoice. Please try again.');
    } finally {
      setDownloading(null);
    }
  }

  if (!user) return null;

  const orderCount = orders.filter(o => INVOICE_STATUSES.includes(o.status)).length;

  return (
    <div className="min-h-[80vh] bg-[#f9f5f2] py-10 px-4">
      <div className="max-w-3xl mx-auto">

        <Link href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Account
        </Link>

        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6"
          style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
          My Orders
        </h1>

        {/* Spend summary */}
        {!loading && totalSpent > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-[#cccacc] p-4">
              <div className="flex items-center gap-2 text-[#6b6b6b] mb-1">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">Orders Completed</span>
              </div>
              <p className="text-2xl font-bold text-[#1a1a1a]">{orderCount}</p>
            </div>
            <div className="bg-white border border-[#cccacc] p-4">
              <div className="flex items-center gap-2 text-[#6b6b6b] mb-1">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">Total Spent</span>
              </div>
              <p className="text-2xl font-bold text-[#1a1a1a]">${totalSpent.toFixed(2)}</p>
            </div>
          </div>
        )}

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
            {orders.map(order => {
              const canDownload = INVOICE_STATUSES.includes(order.status);
              return (
                <div key={order.id} className="bg-white border border-[#cccacc] hover:border-[#213885] hover:shadow-sm transition-all group">
                  <div className="flex items-center">
                    {/* Main clickable area */}
                    <Link href={`/orders/${order.id}`} className="flex-1 min-w-0 p-5 block">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-[#1a1a1a] text-sm">Order #{order.id}</p>
                        <span className={`text-xs px-2 py-0.5 font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {orderStatusLabel(order.status, order.delivery_method)}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b]">
                        {new Date(order.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {order.items?.length ? ` · ${order.items.length} item${order.items.length !== 1 ? 's' : ''}` : ''}
                      </p>
                    </Link>

                    {/* Right side: total + invoice */}
                    <div className="flex flex-col items-end gap-1.5 px-5 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1a1a1a]">${parseFloat(order.total).toFixed(2)}</span>
                        <ChevronRight className="w-4 h-4 text-[#6b6b6b] group-hover:text-[#213885] transition-colors" />
                      </div>
                      {canDownload && (
                        <button
                          onClick={() => downloadInvoice(order.id)}
                          disabled={downloading === order.id}
                          className="flex items-center gap-1 text-xs text-[#213885] hover:text-[#081849] disabled:opacity-50 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          {downloading === order.id ? 'Downloading…' : 'Invoice'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
