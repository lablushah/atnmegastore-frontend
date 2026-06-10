'use client';

import { useCartStore } from '@/store/cartStore';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const t = useTranslations('cart');
  const { items, removeItem, updateQuantity, total, count } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('empty')}</h1>
        <p className="text-gray-500 mb-8">{t('empty_subtitle')}</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700"
        >
          {t('browse')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-2xl border p-4 flex gap-4 items-start"
            >
              {item.product.image && (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="font-semibold text-gray-900 hover:text-indigo-700 line-clamp-1"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm text-indigo-600 mb-2">{item.product.category.name}</p>
                <p className="text-lg font-bold text-gray-900">
                  ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {t('each', { price: `$${parseFloat(item.product.price).toFixed(2)}` })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-3">
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-red-400 hover:text-red-600"
                  aria-label={t('remove')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center border rounded-xl overflow-hidden text-sm">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 font-bold"
                  >
                    −
                  </button>
                  <span className="px-4 py-1.5 font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('order_summary')}</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>{t('items', { n: count() })}</span>
                <span>${total().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('shipping')}</span>
                <span className="text-green-600">{t('free')}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-900">
                <span>{t('total')}</span>
                <span>${total().toFixed(2)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {t('checkout')}
            </Link>
            <Link
              href="/products"
              className="block w-full text-center mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              {t('continue')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
