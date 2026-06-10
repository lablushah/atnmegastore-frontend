import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/lib/types';
import api from '@/lib/api';

interface LocalCartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: LocalCartItem[];
  serverItems: CartItem[];
  isLoggedIn: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  syncFromServer: (items: CartItem[]) => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      serverItems: [],
      isLoggedIn: false,

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [], serverItems: [] }),

      syncFromServer: (serverItems) => {
        set({
          serverItems,
          items: serverItems.map((si) => ({ product: si.product, quantity: si.quantity })),
        });
      },

      total: () =>
        get().items.reduce((sum, i) => sum + parseFloat(i.product.price) * i.quantity, 0),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cart-store', partialize: (s) => ({ items: s.items }) }
  )
);
