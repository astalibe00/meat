import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import { getPersonalizedProducts, getSearchSuggestions, searchProducts } from "@/lib/catalog-intelligence";
import type { CustomerOrder, ManagedProduct } from "@/types/app-data";

const managedProducts: ManagedProduct[] = PRODUCTS.map((product) => ({
  ...product,
  stockKg: 10,
  minOrderKg: 0.3,
  enabled: true,
  rating: 4.8,
  reviewCount: 0,
}));

describe("catalog intelligence", () => {
  it("matches products using synonyms and weighted ranking", () => {
    const results = searchProducts(managedProducts, "steyk");
    expect(results[0]?.id).toBe("beef-ribeye");
  });

  it("returns compact suggestions for partial queries", () => {
    const suggestions = getSearchSuggestions(managedProducts, "qo");
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it("personalizes products from favorites and order history", () => {
    const orders: CustomerOrder[] = [
      {
        id: "MEAT-101",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [{ product: managedProducts[4], quantity: 2, weightOption: managedProducts[4].weight }],
        subtotal: managedProducts[4].price * 2,
        savings: 0,
        promoDiscount: 0,
        delivery: 0,
        total: managedProducts[4].price * 2,
        promoCode: "",
        customer: { name: "Aziz", fulfillmentType: "delivery" },
        paymentMethod: "cash",
        paymentStatus: "paid",
        status: "completed",
        statusHistory: [],
      },
    ];

    const results = getPersonalizedProducts(managedProducts, ["ground-beef"], orders, 3);
    expect(results.map((product) => product.id)).toContain("ground-beef");
    expect(results.map((product) => product.category)).toContain("lamb");
  });
});
