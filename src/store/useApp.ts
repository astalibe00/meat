import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "@/data/products";

export type Screen =
  | { name: "home" }
  | { name: "categories"; category?: string }
  | { name: "search" }
  | { name: "cart" }
  | { name: "profile" }
  | { name: "favorites" }
  | { name: "product"; id: string };

export interface CartLine {
  product: Product;
  quantity: number;
  weightOption?: string;
}

interface AppState {
  screen: Screen;
  history: Screen[];
  cart: CartLine[];
  favorites: string[];
  recentSearches: string[];
  navigate: (screen: Screen) => void;
  back: () => void;
  addToCart: (product: Product, qty?: number, weightOption?: string) => void;
  updateQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  pushRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  cartCount: () => number;
  cartSubtotal: () => number;
  cartSavings: () => number;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      screen: { name: "home" },
      history: [],
      cart: [],
      favorites: [],
      recentSearches: ["Ribeye", "Lamb chops", "Chicken wings"],
      navigate: (screen) =>
        set((s) => ({ screen, history: [...s.history, s.screen] })),
      back: () =>
        set((s) => {
          if (s.history.length === 0) return { screen: { name: "home" } };
          const next = s.history[s.history.length - 1];
          return { screen: next, history: s.history.slice(0, -1) };
        }),
      addToCart: (product, qty = 1, weightOption) =>
        set((s) => {
          const existing = s.cart.find(
            (l) => l.product.id === product.id && l.weightOption === weightOption
          );
          if (existing) {
            return {
              cart: s.cart.map((l) =>
                l.product.id === product.id && l.weightOption === weightOption
                  ? { ...l, quantity: l.quantity + qty }
                  : l
              ),
            };
          }
          return { cart: [...s.cart, { product, quantity: qty, weightOption }] };
        }),
      updateQty: (productId, qty) =>
        set((s) => ({
          cart:
            qty <= 0
              ? s.cart.filter((l) => l.product.id !== productId)
              : s.cart.map((l) =>
                  l.product.id === productId ? { ...l, quantity: qty } : l
                ),
        })),
      removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((l) => l.product.id !== productId) })),
      toggleFavorite: (productId) =>
        set((s) => ({
          favorites: s.favorites.includes(productId)
            ? s.favorites.filter((id) => id !== productId)
            : [...s.favorites, productId],
        })),
      isFavorite: (productId) => get().favorites.includes(productId),
      pushRecentSearch: (q) =>
        set((s) => {
          const trimmed = q.trim();
          if (!trimmed) return s;
          const filtered = s.recentSearches.filter(
            (r) => r.toLowerCase() !== trimmed.toLowerCase()
          );
          return { recentSearches: [trimmed, ...filtered].slice(0, 6) };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
      cartCount: () => get().cart.reduce((n, l) => n + l.quantity, 0),
      cartSubtotal: () =>
        get().cart.reduce((n, l) => n + l.product.price * l.quantity, 0),
      cartSavings: () =>
        get().cart.reduce(
          (n, l) =>
            n +
            (l.product.oldPrice
              ? (l.product.oldPrice - l.product.price) * l.quantity
              : 0),
          0
        ),
    }),
    {
      name: "qoriev-app-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        cart: s.cart,
        favorites: s.favorites,
        recentSearches: s.recentSearches,
      }),
    }
  )
);
