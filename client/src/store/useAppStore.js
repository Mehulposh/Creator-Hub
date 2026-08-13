import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyTheme } from './theme';

export function cartKey(item) {
  return `${item.type}:${item.id}`;
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
      },

      lastStoreSlug: '',
      setLastStoreSlug: (slug) => set({ lastStoreSlug: slug }),

      buyerEmail: '',
      setBuyerEmail: (email) => set({ buyerEmail: email.trim().toLowerCase() }),

      cart: [],
      cartOpen: false,
      setCartOpen: (open) => set({ cartOpen: open }),

      addToCart: (item) => {
        const key = cartKey(item);
        const { cart } = get();
        if (cart.some((c) => cartKey(c) === key)) return;
        set({ cart: [...cart, item], cartOpen: true });
      },

      removeFromCart: (key) => set((state) => ({
        cart: state.cart.filter((c) => cartKey(c) !== key)
      })),

      clearCart: () => set({ cart: [] })
    }),
    {
      name: 'ach-app-store',
      partialize: (state) => ({
        theme: state.theme,
        lastStoreSlug: state.lastStoreSlug,
        buyerEmail: state.buyerEmail,
        cart: state.cart
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme);
      }
    }
  )
);

// Apply saved theme before React paints (persist rehydration is async).
try {
  const raw = localStorage.getItem('ach-app-store');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.state?.theme) applyTheme(parsed.state.theme);
  } else {
    applyTheme('dark');
  }
} catch {
  applyTheme('dark');
}
