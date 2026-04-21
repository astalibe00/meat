import { describe, expect, it } from "vitest";
import {
  buildCategoryMessage,
  buildDealsMessage,
  buildHelpMessage,
  buildSearchResultsMessage,
  buildSupportMessage,
  buildTopProductsMessage,
  buildWelcomeMessage,
} from "../../api/_lib/catalog";
import { PRODUCTS } from "@/data/products";
import type { CustomerOrder, ManagedProduct } from "@/types/app-data";

const managedProducts: ManagedProduct[] = PRODUCTS.map((product) => ({
  ...product,
  stockKg: 12,
  minOrderKg: 0.3,
  enabled: true,
  rating: 4.8,
  reviewCount: 0,
}));

describe("telegram bot copy", () => {
  it("builds category messages with catalogue items", () => {
    const message = buildCategoryMessage("beef");
    expect(message).toContain("Mol go'shti");
    expect(message).toContain("Qiyma mol go'shti");
  });

  it("includes promo codes in deals", () => {
    const message = buildDealsMessage();
    expect(message).toContain("SAVE10");
    expect(message).toContain("FREESHIP");
  });

  it("keeps the welcome message actionable", () => {
    expect(buildWelcomeMessage(true)).toContain("Mini App");
    expect(buildSupportMessage()).toContain("+998990197548");
  });

  it("supports help and search responses", () => {
    expect(buildHelpMessage()).toContain("/search");
    expect(buildSearchResultsMessage(managedProducts, "ribay")).toContain("Mol ribay steyki");
  });

  it("builds top products from live data", () => {
    const orders: CustomerOrder[] = [
      {
        id: "MEAT-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [{ product: managedProducts[0], quantity: 2, weightOption: managedProducts[0].weight }],
        subtotal: managedProducts[0].price * 2,
        savings: 0,
        promoDiscount: 0,
        delivery: 0,
        total: managedProducts[0].price * 2,
        promoCode: "",
        customer: { name: "Test", fulfillmentType: "delivery" },
        paymentMethod: "cash",
        paymentStatus: "paid",
        status: "completed",
        statusHistory: [],
      },
    ];

    expect(buildTopProductsMessage(managedProducts, orders)).toContain(managedProducts[0].name);
  });
});
