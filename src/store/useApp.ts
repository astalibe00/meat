import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CategoryId, Product } from "@/data/products";
import {
  getCartLineId,
  getCartPricing,
  getCartSavings,
  getCartSubtotal,
  type CartPricing,
  type PromoResult,
  validatePromoCode,
} from "@/lib/commerce";

export type CatalogSort = "popular" | "price-asc" | "price-desc" | "freshest" | "value";

export type Screen =
  | { name: "home" }
  | { name: "categories"; category?: CategoryId; saleOnly?: boolean; sort?: CatalogSort }
  | { name: "search" }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "orders" }
  | { name: "support" }
  | { name: "profile" }
  | { name: "favorites" }
  | { name: "product"; id: string };

export interface CartLine {
  product: Product;
  quantity: number;
  weightOption?: string;
}

export interface CheckoutForm {
  name: string;
  phone: string;
  address: string;
  notes: string;
  deliveryWindow: string;
}

export interface Order {
  id: string;
  createdAt: string;
  items: CartLine[];
  subtotal: number;
  savings: number;
  promoDiscount: number;
  delivery: number;
  total: number;
  promoCode: string;
  customer: CheckoutForm;
  status: "confirmed" | "preparing" | "on-the-way";
}

interface AppState {
  screen: Screen;
  history: Screen[];
  cart: CartLine[];
  favorites: string[];
  recentSearches: string[];
  checkout: CheckoutForm;
  promoCode: string;
  orders: Order[];
  navigate: (screen: Screen) => void;
  back: () => void;
  addToCart: (product: Product, qty?: number, weightOption?: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  removeFromCart: (lineId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  pushRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  updateCheckout: (patch: Partial<CheckoutForm>) => void;
  applyPromoCode: (code: string) => PromoResult;
  clearPromoCode: () => void;
  placeOrder: () => Order | null;
  resetDemoData: () => void;
  cartCount: () => number;
  cartSubtotal: () => number;
  cartSavings: () => number;
  cartPricing: () => CartPricing;
}

const DEFAULT_CHECKOUT: CheckoutForm = {
  name: "Guest Shopper",
  phone: "+1 555 010 200",
  address: "23 Market Street, Tashkent",
  notes: "",
  deliveryWindow: "Today, 6pm - 8pm",
};

function isSameScreen(a: Screen, b: Screen) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      screen: { name: "home" },
      history: [],
      cart: [],
      favorites: [],
      recentSearches: ["Ribeye", "Lamb chops", "Chicken wings"],
      checkout: DEFAULT_CHECKOUT,
      promoCode: "",
      orders: [],
      navigate: (screen) =>
        set((state) => {
          if (isSameScreen(state.screen, screen)) {
            return state;
          }

          return {
            screen,
            history: [...state.history, state.screen].slice(-24),
          };
        }),
      back: () =>
        set((state) => {
          if (state.history.length === 0) {
            return { screen: { name: "home" } };
          }

          const previous = state.history[state.history.length - 1];
          return { screen: previous, history: state.history.slice(0, -1) };
        }),
      addToCart: (product, qty = 1, weightOption) =>
        set((state) => {
          const lineId = getCartLineId(product.id, weightOption, product.weight);
          const existing = state.cart.find(
            (line) => getCartLineId(line.product.id, line.weightOption, line.product.weight) === lineId,
          );

          if (existing) {
            return {
              cart: state.cart.map((line) =>
                getCartLineId(line.product.id, line.weightOption, line.product.weight) === lineId
                  ? { ...line, quantity: line.quantity + qty }
                  : line,
              ),
            };
          }

          return {
            cart: [...state.cart, { product, quantity: qty, weightOption }],
          };
        }),
      updateQty: (lineId, qty) =>
        set((state) => ({
          cart:
            qty <= 0
              ? state.cart.filter(
                  (line) =>
                    getCartLineId(line.product.id, line.weightOption, line.product.weight) !== lineId,
                )
              : state.cart.map((line) =>
                  getCartLineId(line.product.id, line.weightOption, line.product.weight) === lineId
                    ? { ...line, quantity: qty }
                    : line,
                ),
        })),
      removeFromCart: (lineId) =>
        set((state) => ({
          cart: state.cart.filter(
            (line) => getCartLineId(line.product.id, line.weightOption, line.product.weight) !== lineId,
          ),
        })),
      toggleFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId],
        })),
      isFavorite: (productId) => get().favorites.includes(productId),
      pushRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed) {
            return state;
          }

          const filtered = state.recentSearches.filter(
            (item) => item.toLowerCase() !== trimmed.toLowerCase(),
          );

          return { recentSearches: [trimmed, ...filtered].slice(0, 6) };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
      updateCheckout: (patch) =>
        set((state) => ({
          checkout: {
            ...state.checkout,
            ...patch,
          },
        })),
      applyPromoCode: (code) => {
        const subtotal = get().cartSubtotal();
        const result = validatePromoCode(code, subtotal);

        if (result.ok) {
          set({ promoCode: result.code });
        }

        return result;
      },
      clearPromoCode: () => set({ promoCode: "" }),
      placeOrder: () => {
        const state = get();
        const pricing = state.cartPricing();

        if (state.cart.length === 0) {
          return null;
        }

        const customer = state.checkout;
        if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
          return null;
        }

        const order: Order = {
          id: `FHD-${String(Date.now()).slice(-6)}`,
          createdAt: new Date().toISOString(),
          items: state.cart,
          subtotal: pricing.subtotal,
          savings: pricing.savings,
          promoDiscount: pricing.promoDiscount,
          delivery: pricing.delivery,
          total: pricing.total,
          promoCode: pricing.activePromoCode,
          customer,
          status: "confirmed",
        };

        set({
          orders: [order, ...state.orders],
          cart: [],
          promoCode: "",
          screen: { name: "orders" },
          history: [{ name: "home" }],
        });

        return order;
      },
      resetDemoData: () =>
        set({
          cart: [],
          favorites: [],
          recentSearches: [],
          promoCode: "",
          orders: [],
          checkout: DEFAULT_CHECKOUT,
          screen: { name: "home" },
          history: [],
        }),
      cartCount: () => get().cart.reduce((total, line) => total + line.quantity, 0),
      cartSubtotal: () => getCartSubtotal(get().cart),
      cartSavings: () => getCartSavings(get().cart),
      cartPricing: () => getCartPricing(get().cart, get().promoCode),
    }),
    {
      name: "fresh-halal-direct-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        favorites: state.favorites,
        recentSearches: state.recentSearches,
        checkout: state.checkout,
        promoCode: state.promoCode,
        orders: state.orders,
      }),
    },
  ),
);
