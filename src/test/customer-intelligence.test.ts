import { describe, expect, it } from "vitest";
import { buildCustomerInsights, filterAudienceInsights, getCustomerSegment } from "@/lib/customer-intelligence";
import type { CustomerOrder, CustomerProfile, ManagedProduct } from "@/types/app-data";
import { PRODUCTS } from "@/data/products";

const product = {
  ...PRODUCTS[0],
  stockKg: 8,
  minOrderKg: 0.3,
  enabled: true,
  rating: 4.8,
  reviewCount: 0,
} satisfies ManagedProduct;

describe("customer intelligence", () => {
  it("classifies customer segments from revenue and recency", () => {
    expect(getCustomerSegment(1, 100000, new Date().toISOString())).toBe("new");
    expect(getCustomerSegment(6, 3200000, new Date().toISOString())).toBe("vip");
  });

  it("builds insights and filters broadcast audiences", () => {
    const customers: CustomerProfile[] = [
      {
        telegramUserId: 1,
        name: "Aziz",
        preferredFulfillment: "delivery",
        updatedAt: new Date().toISOString(),
      },
      {
        telegramUserId: 2,
        name: "Vali",
        preferredFulfillment: "pickup",
        updatedAt: new Date().toISOString(),
      },
    ];

    const orders: CustomerOrder[] = [
      {
        id: "MEAT-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [{ product, quantity: 2, weightOption: product.weight }],
        subtotal: product.price * 2,
        savings: 0,
        promoDiscount: 0,
        delivery: 0,
        total: product.price * 2,
        promoCode: "",
        customer: { telegramUserId: 1, name: "Aziz", fulfillmentType: "delivery" },
        paymentMethod: "cash",
        paymentStatus: "paid",
        status: "completed",
        statusHistory: [],
      },
    ];

    const insights = buildCustomerInsights(customers, orders);
    expect(insights[0]?.customer.telegramUserId).toBe(1);
    expect(filterAudienceInsights(insights, "all")).toHaveLength(2);
    expect(filterAudienceInsights(insights, insights[0].segment)).toHaveLength(1);
  });
});
