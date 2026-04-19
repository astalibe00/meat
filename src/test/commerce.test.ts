import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import {
  getCartLineId,
  getCartPricing,
  SAVE10_THRESHOLD,
  validatePromoCode,
} from "@/lib/commerce";

describe("commerce helpers", () => {
  it("creates stable line ids for different weight options", () => {
    expect(getCartLineId("ribeye", "0.3 kg")).not.toBe(getCartLineId("ribeye", "0.45 kg"));
  });

  it("applies SAVE10 only above the threshold", () => {
    expect(validatePromoCode("save10", SAVE10_THRESHOLD - 1).ok).toBe(false);
    expect(validatePromoCode("save10", SAVE10_THRESHOLD).ok).toBe(true);
  });

  it("computes promo discount and delivery totals", () => {
    const cart = [
      { product: PRODUCTS[0], quantity: 6, weightOption: "0.5 kg" },
      { product: PRODUCTS[1], quantity: 1, weightOption: "0.9 kg" },
    ];

    const pricing = getCartPricing(cart, "SAVE10");

    expect(pricing.subtotal).toBeGreaterThan(0);
    expect(pricing.promoDiscount).toBeGreaterThan(0);
    expect(pricing.total).toBeLessThan(pricing.subtotal + pricing.delivery);
  });
});
