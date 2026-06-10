'use client';

import Image from 'next/image';
import { Link } from '@/navigation';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { storageUrl } from '@/lib/imageUrl';
import toast from 'react-hot-toast';

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggle, isInWishlist } = useWishlistStore();
  const saved = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`Added to cart!`);
  };

  const price = parseFloat(product.price);

  return (
    <Link href={`/products/${product.slug}`} className="group bg-white block">
      {/* Image */}
      <div className="relative bg-[#e8e3f0] flex items-center justify-center h-52 sm:h-56 overflow-hidden">
        {product.image ? (
          <Image
            src={storageUrl(product.image)!}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">📦</div>
        )}

        {product.featured && (
          <span className="absolute top-3 left-3 bg-[#213885] text-[#893172] text-[10px] px-2.5 py-1 font-semibold tracking-wide uppercase">
            Featured
          </span>
        )}

        {/* Wishlist heart */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm
            ${saved ? 'bg-rose-500 text-white' : 'bg-white/80 text-gray-400 hover:text-rose-500 hover:bg-white'}`}
          title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
        </button>

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-[#1a1a1a] text-white text-xs font-semibold px-3 py-1.5 tracking-wide uppercase">
              Out of Stock
            </span>
          </div>
        )}

        {/* Add to cart overlay */}
        {product.stock > 0 && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#213885] hover:bg-[#081849] text-white text-xs font-semibold py-3 tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[10px] text-[#6b6b6b] tracking-widest uppercase font-medium truncate">
            {product.category.name}
          </p>
          {(product.reviews_count ?? 0) > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map((s) => {
                const avg = product.reviews_avg_rating ?? 0;
                return (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= Math.round(avg)
                        ? 'fill-[#893172] text-[#893172]'
                        : 'fill-gray-200 text-gray-300'
                    }`}
                  />
                );
              })}
              <span className="text-[10px] text-[#6b6b6b] ml-1">({product.reviews_count})</span>
            </div>
          )}
        </div>
        <h3 className="text-sm font-semibold text-[#1a1a1a] leading-snug group-hover:text-[#213885] transition-colors line-clamp-2">
          {product.name}
        </h3>
        {product.name_secondary && (
          <p className="text-xs text-[#6b6b6b] mt-0.5 line-clamp-1 leading-snug">
            {product.name_secondary}
          </p>
        )}
        {product.author && (
          <p className="text-xs text-gray-400 mt-0.5 mb-1 line-clamp-1 italic">
            {product.author}
          </p>
        )}
        {!product.name_secondary && !product.author && <div className="mb-2" />}
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-[#1a1a1a]">
            ${price.toFixed(2)}
          </span>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-[10px] text-orange-600 font-semibold uppercase tracking-wide">
              Only {product.stock} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
