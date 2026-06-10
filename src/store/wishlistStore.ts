import { create } from 'zustand';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface WishlistState {
  ids: number[];
  load: () => Promise<void>;
  toggle: (productId: number) => Promise<void>;
  clear: () => void;
  isInWishlist: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  ids: [],

  load: async () => {
    try {
      const { data } = await api.get<number[]>('/wishlist/ids');
      set({ ids: data });
    } catch {
      set({ ids: [] });
    }
  },

  toggle: async (productId: number) => {
    const prev = get().ids;
    const isIn = prev.includes(productId);

    // Optimistic update
    set({ ids: isIn ? prev.filter(id => id !== productId) : [...prev, productId] });

    try {
      await api.post(`/wishlist/${productId}`);
      toast.success(isIn ? 'Removed from wishlist' : 'Added to wishlist');
    } catch {
      set({ ids: prev }); // rollback
      toast.error('Please sign in to save items to your wishlist');
    }
  },

  clear: () => set({ ids: [] }),

  isInWishlist: (productId: number) => get().ids.includes(productId),
}));
