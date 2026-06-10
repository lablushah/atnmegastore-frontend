'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Loader } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { isStaff } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Product } from '@/lib/types';

export default function WishlistPage() {
  const router                         = useRouter();
  const { user, _hasHydrated }         = useAuthStore();
  const { toggle }                     = useWishlistStore();
  const addItem                        = useCartStore((s) => s.addItem);
  const [products, setProducts]        = useState<Product[]>([]);
  const [loading, setLoading]          = useState(true);

  // Auth guard
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || isStaff(user)) { router.replace('/login'); return; }
    api.get<Product[]>('/wishlist').then(r => setProducts(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [_hasHydrated, user]);

  const handleRemove = async (product: Product) => {
    setProducts(p => p.filter(x => x.id !== product.id));
    await toggle(product.id);
  };

  const handleMoveToCart = (product: Product) => {
    addItem(product);
    toast.success('Added to cart!');
    handleRemove(product);
  };

  if (!_hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-[#213885]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ecdfd2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              My Wishlist
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {products.length === 0 ? 'No saved items yet' : `${products.length} saved item${products.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {products.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-9 h-9 text-rose-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
              Click the heart icon on any product to save it here for later.
            </p>
            <Link href="/products"
              className="inline-block bg-[#213885] hover:bg-[#081849] text-white px-8 py-3 font-semibold tracking-wide uppercase text-sm transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Product grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => {
                const price = parseFloat(product.price);
                return (
                  <div key={product.id} className="bg-white group flex flex-col">

                    {/* Image */}
                    <Link href={`/products/${product.slug}`} className="block bg-[#e8e3f0] h-48 overflow-hidden flex items-center justify-center">
                      {product.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={product.image} alt={product.name} loading="lazy" decoding="async"
                            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">📦</div>
                      }
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="bg-[#1a1a1a] text-white text-xs font-semibold px-3 py-1.5 tracking-wide uppercase">Out of Stock</span>
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-[10px] text-[#6b6b6b] tracking-widest uppercase font-medium truncate mb-1">
                        {product.category?.name}
                      </p>
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="text-sm font-semibold text-[#1a1a1a] hover:text-[#213885] leading-snug line-clamp-2 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      {product.name_secondary && (
                        <p className="text-xs text-[#6b6b6b] mt-0.5 line-clamp-1">{product.name_secondary}</p>
                      )}
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className="text-base font-bold text-[#1a1a1a]">${price.toFixed(2)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleMoveToCart(product)}
                          disabled={product.stock === 0}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-[#213885] hover:bg-[#081849] disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold py-2 transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button
                          onClick={() => handleRemove(product)}
                          className="w-9 flex items-center justify-center border border-gray-200 hover:border-rose-300 hover:text-rose-500 text-gray-400 transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
              <Link href="/products" className="text-sm text-[#213885] hover:underline flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Continue Shopping
              </Link>
              <button
                onClick={() => { products.filter(p => p.stock > 0).forEach(p => addItem(p)); toast.success('All available items added to cart!'); products.filter(p => p.stock > 0).forEach(p => handleRemove(p)); }}
                className="bg-[#893172] hover:bg-[#b8902f] text-white px-6 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add All to Cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
