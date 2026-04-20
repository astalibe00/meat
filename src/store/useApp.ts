import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
}

export interface CheckoutForm {
  name: string;
  phone: string;
  addressId: string;
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

interface EditableAddress {
  id?: string;
  label: string;
  address: string;
}

interface AppState {
  screen: Screen;
  history: Screen[];
  cart: CartLine[];
  favorites: string[];
  recentSearches: string[];
  savedAddresses: SavedAddress[];
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
  selectAddress: (addressId: string) => void;
  saveAddress: (address: EditableAddress) => string | null;
  applyPromoCode: (code: string) => PromoResult;
  clearPromoCode: () => void;
  placeOrder: () => Order | null;
  resetDemoData: () => void;
  cartCount: () => number;
  cartSubtotal: () => number;
  cartSavings: () => number;
  cartPricing: () => CartPricing;
}

export const DEFAULT_PROFILE_NAME = "Halal Direct mijozi";
export const DEFAULT_DELIVERY_WINDOW = "Bugun, 18:00 - 20:00";

export const DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: "home",
    label: "Uy",
    address: "Yunusobod tumani, 14-kvartal, 23-uy, Tashkent",
  },
  {
    id: "office",
    label: "Ofis",
    address: "Oybek ko'chasi, 18A, 6-qavat, Tashkent",
  },
];

const DEFAULT_CHECKOUT: CheckoutForm = {
  name: DEFAULT_PROFILE_NAME,
  phone: "+998 90 123 45 67",
  addressId: DEFAULT_ADDRESSES[0].id,
  address: DEFAULT_ADDRESSES[0].address,
  notes: "",
  deliveryWindow: DEFAULT_DELIVERY_WINDOW,
};

function isSameScreen(a: Screen, b: Screen) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function createAddressId() {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeAddressText(value?: string) {
  return value?.trim() ?? "";
}

function normalizeSavedAddresses(
  savedAddresses?: SavedAddress[],
  fallbackAddress?: string,
): SavedAddress[] {
  const source = savedAddresses?.length ? savedAddresses : DEFAULT_ADDRESSES;
  const seen = new Set<string>();
  const normalized = source
    .map((address, index) => ({
      id: address.id?.trim() || `saved-${index + 1}`,
      label: address.label?.trim() || `Manzil ${index + 1}`,
      address: address.address?.trim() || "",
    }))
    .filter((address) => {
      if (!address.address || seen.has(address.address)) {
        return false;
      }

      seen.add(address.address);
      return true;
    });

  if (fallbackAddress?.trim() && !seen.has(fallbackAddress.trim())) {
    normalized.unshift({
      id: "saved-current",
      label: "Tanlangan manzil",
      address: fallbackAddress.trim(),
    });
  }

  return normalized.length > 0 ? normalized : DEFAULT_ADDRESSES;
}

function normalizeCheckout(
  checkout?: Partial<CheckoutForm>,
  savedAddresses?: SavedAddress[],
  options?: {
    includeFallbackAddress?: boolean;
  },
): CheckoutForm {
  const includeFallbackAddress = Boolean(options?.includeFallbackAddress);
  const addresses = normalizeSavedAddresses(
    savedAddresses,
    includeFallbackAddress ? checkout?.address : undefined,
  );
  const rawAddress = normalizeAddressText(checkout?.address);
  const selectedAddress = addresses.find((address) => address.id === checkout?.addressId);
  const matchedByText = rawAddress
    ? addresses.find((address) => normalizeAddressText(address.address) === rawAddress)
    : undefined;
  const resolvedAddressId = rawAddress
    ? matchedByText?.id ?? ""
    : selectedAddress?.id ?? DEFAULT_CHECKOUT.addressId;

  return {
    ...DEFAULT_CHECKOUT,
    ...checkout,
    addressId: resolvedAddressId,
    address: rawAddress || selectedAddress?.address || DEFAULT_CHECKOUT.address,
    deliveryWindow: checkout?.deliveryWindow?.trim() || DEFAULT_DELIVERY_WINDOW,
  };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      screen: { name: "home" },
      history: [],
      cart: [],
      favorites: [],
      recentSearches: ["Mol ribay steyki", "Qo'y kotleti", "Tovuq qanotlari"],
      savedAddresses: DEFAULT_ADDRESSES,
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
          checkout: normalizeCheckout(
            {
              ...state.checkout,
              ...patch,
            },
            state.savedAddresses,
          ),
        })),
      selectAddress: (addressId) =>
        set((state) => {
          const selectedAddress = state.savedAddresses.find((address) => address.id === addressId);
          if (!selectedAddress) {
            return state;
          }

          return {
            checkout: normalizeCheckout(
              {
                ...state.checkout,
                addressId: selectedAddress.id,
                address: selectedAddress.address,
              },
              state.savedAddresses,
            ),
          };
        }),
      saveAddress: (address) => {
        const label = address.label.trim();
        const fullAddress = address.address.trim();

        if (!label || !fullAddress) {
          return null;
        }

        let savedId = address.id;

        set((state) => {
          const existingIndex = savedId
            ? state.savedAddresses.findIndex((item) => item.id === savedId)
            : -1;

          let nextAddresses = [...state.savedAddresses];
          if (existingIndex >= 0) {
            nextAddresses[existingIndex] = {
              id: savedId!,
              label,
              address: fullAddress,
            };
          } else {
            savedId = createAddressId();
            nextAddresses = [
              { id: savedId, label, address: fullAddress },
              ...state.savedAddresses.filter((item) => item.address !== fullAddress),
            ];
          }

          return {
            savedAddresses: nextAddresses,
            checkout: normalizeCheckout(
              {
                ...state.checkout,
                addressId: savedId!,
                address: fullAddress,
              },
              nextAddresses,
            ),
          };
        });

        return savedId ?? null;
      },
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
          customer: { ...customer },
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
          savedAddresses: DEFAULT_ADDRESSES,
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
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        favorites: state.favorites,
        recentSearches: state.recentSearches,
        savedAddresses: state.savedAddresses,
        checkout: state.checkout,
        promoCode: state.promoCode,
        orders: state.orders,
      }),
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<AppState> & {
          checkout?: Partial<CheckoutForm>;
          savedAddresses?: SavedAddress[];
        };
        const savedAddresses = normalizeSavedAddresses(
          state.savedAddresses,
          state.checkout?.address,
        );

        return {
          ...state,
          savedAddresses,
          checkout: normalizeCheckout(state.checkout, savedAddresses, {
            includeFallbackAddress: true,
          }),
        };
      },
      merge: (persistedState, currentState) => {
        const state = (persistedState ?? {}) as Partial<AppState> & {
          checkout?: Partial<CheckoutForm>;
          savedAddresses?: SavedAddress[];
        };
        const savedAddresses = normalizeSavedAddresses(
          state.savedAddresses ?? currentState.savedAddresses,
          state.checkout?.address ?? currentState.checkout.address,
        );

        return {
          ...currentState,
          ...state,
          savedAddresses,
          checkout: normalizeCheckout(
            {
              ...currentState.checkout,
              ...state.checkout,
            },
            savedAddresses,
            {
              includeFallbackAddress: true,
            },
          ),
          recentSearches:
            state.recentSearches && state.recentSearches.length > 0
              ? state.recentSearches
              : currentState.recentSearches,
        };
      },
    },
  ),
);
