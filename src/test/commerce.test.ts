import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import {
  getCartLineId,
  getCartPricing,
  validatePromoCode,
} from "@/lib/commerce";

describe("commerce helpers", () => {
  it("creates stable line ids for different weight options", () => {
    expect(getCartLineId("ribeye", "10 oz")).not.toBe(getCartLineId("ribeye", "16 oz"));
  });

  it("applies SAVE10 only above the threshold", () => {
    expect(validatePromoCode("save10", 40).ok).toBe(false);
    expect(validatePromoCode("save10", 80).ok).toBe(true);
  });

  it("computes promo discount and delivery totals", () => {
    const cart = [
      { product: PRODUCTS[0], quantity: 6, weightOption: "1 lb" },
      { product: PRODUCTS[1], quantity: 1, weightOption: "2 lb" },
    ];

    const pricing = getCartPricing(cart, "SAVE10");

    expect(pricing.subtotal).toBeGreaterThan(0);
    expect(pricing.promoDiscount).toBeGreaterThan(0);
    expect(pricing.total).toBeLessThan(pricing.subtotal + pricing.delivery);
  });
});
