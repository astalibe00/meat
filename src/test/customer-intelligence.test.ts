import { describe, expect, it } from "vitest";
import {
  buildCustomerInsights,
  buildRevenueSeries,
  filterAudienceInsights,
  getCustomerSegment,
  summarizePaymentsByMethod,
  summarizePaymentsByStatus,
} from "@/lib/customer-intelligence";
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

  it("summarizes finance metrics for payment methods and statuses", () => {
    const now = new Date().toISOString();
    const orders: CustomerOrder[] = [
      {
        id: "MEAT-100",
        createdAt: now,
        updatedAt: now,
        items: [{ product, quantity: 1, weightOption: product.weight }],
        subtotal: product.price,
        savings: 0,
        promoDiscount: 0,
        delivery: 0,
        total: product.price,
        promoCode: "",
        customer: { telegramUserId: 1, name: "Aziz", fulfillmentType: "delivery" },
        paymentMethod: "click",
        paymentStatus: "paid",
        status: "completed",
        statusHistory: [],
      },
      {
        id: "MEAT-101",
        createdAt: now,
        updatedAt: now,
        items: [{ product, quantity: 2, weightOption: product.weight }],
        subtotal: product.price * 2,
        savings: 0,
        promoDiscount: 0,
        delivery: 0,
        total: product.price * 2,
        promoCode: "",
        customer: { telegramUserId: 2, name: "Vali", fulfillmentType: "pickup" },
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        statusHistory: [],
      },
    ];

    const byMethod = summarizePaymentsByMethod(orders);
    const byStatus = summarizePaymentsByStatus(orders);
    const series = buildRevenueSeries(orders, 2);

    expect(byMethod.find((entry) => entry.method === "click")?.paidAmount).toBe(product.price);
    expect(byMethod.find((entry) => entry.method === "cash")?.pendingAmount).toBe(product.price * 2);
    expect(byStatus.find((entry) => entry.status === "paid")?.count).toBe(1);
    expect(series).toHaveLength(2);
    expect(series[1]?.orders).toBeGreaterThanOrEqual(1);
  });
});
