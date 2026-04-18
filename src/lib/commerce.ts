import { DELIVERY_FEE, FREE_SHIPPING_THRESHOLD, type Product } from "@/data/products";

export interface CartLineLike {
  product: Product;
  quantity: number;
  weightOption?: string;
}

export interface CartPricing {
  subtotal: number;
  savings: number;
  delivery: number;
  promoDiscount: number;
  total: number;
  freeDeliveryUnlocked: boolean;
  activePromoCode: string;
}

export interface PromoResult {
  ok: boolean;
  code: string;
  message: string;
}

export const PROMO_OFFERS = [
  {
    code: "SAVE10",
    label: "10% off orders over $60",
  },
  {
    code: "FREESHIP",
    label: "Free delivery on any basket",
  },
] as const;

export function getCartLineId(
  productId: string,
  weightOption?: string,
  fallbackWeight?: string,
) {
  return `${productId}::${weightOption ?? fallbackWeight ?? "default"}`;
}

export function getLineId(line: CartLineLike) {
  return getCartLineId(line.product.id, line.weightOption, line.product.weight);
}

export function getCartSubtotal(cart: CartLineLike[]) {
  return cart.reduce((total, line) => total + line.product.price * line.quantity, 0);
}

export function getCartSavings(cart: CartLineLike[]) {
  return cart.reduce((total, line) => {
    if (!line.product.oldPrice) return total;
    return total + (line.product.oldPrice - line.product.price) * line.quantity;
  }, 0);
}

export function normalizePromoCode(code?: string) {
  return code?.trim().toUpperCase() ?? "";
}

export function validatePromoCode(code: string, subtotal: number): PromoResult {
  const normalized = normalizePromoCode(code);

  if (!normalized) {
    return { ok: false, code: "", message: "Enter a promo code first." };
  }

  if (normalized === "SAVE10") {
    if (subtotal < 60) {
      return {
        ok: false,
        code: normalized,
        message: "SAVE10 works on baskets above $60.",
      };
    }

    return {
      ok: true,
      code: normalized,
      message: "SAVE10 applied. You saved 10% on the basket.",
    };
  }

  if (normalized === "FREESHIP") {
    return {
      ok: true,
      code: normalized,
      message: "FREESHIP applied. Delivery is now free.",
    };
  }

  return {
    ok: false,
    code: normalized,
    message: "That promo code is not available.",
  };
}

export function getCartPricing(cart: CartLineLike[], promoCode?: string): CartPricing {
  const subtotal = getCartSubtotal(cart);
  const savings = getCartSavings(cart);
  const normalized = normalizePromoCode(promoCode);
  const freeDeliveryByThreshold = subtotal >= FREE_SHIPPING_THRESHOLD;

  let promoDiscount = 0;
  let delivery = subtotal === 0 ? 0 : freeDeliveryByThreshold ? 0 : DELIVERY_FEE;
  let activePromoCode = "";

  if (normalized === "SAVE10" && subtotal >= 60) {
    promoDiscount = Number((subtotal * 0.1).toFixed(2));
    activePromoCode = normalized;
  }

  if (normalized === "FREESHIP" && subtotal > 0) {
    delivery = 0;
    activePromoCode = normalized;
  }

  const total = Math.max(0, Number((subtotal - promoDiscount + delivery).toFixed(2)));

  return {
    subtotal,
    savings,
    delivery,
    promoDiscount,
    total,
    freeDeliveryUnlocked: delivery === 0 && subtotal > 0,
    activePromoCode,
  };
}
