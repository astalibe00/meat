import { describe, expect, it } from "vitest";
import {
  buildCategoryMessage,
  buildDealsMessage,
  buildSupportMessage,
  buildWelcomeMessage,
} from "../../api/_lib/catalog";

describe("telegram bot copy", () => {
  it("builds category messages with catalogue items", () => {
    const message = buildCategoryMessage("beef");
    expect(message).toContain("Beef");
    expect(message).toContain("Ground Beef");
  });

  it("includes promo codes in deals", () => {
    const message = buildDealsMessage();
    expect(message).toContain("SAVE10");
    expect(message).toContain("FREESHIP");
  });

  it("keeps the welcome message actionable", () => {
    expect(buildWelcomeMessage(true)).toContain("Open Web App");
    expect(buildSupportMessage()).toContain("order ID");
  });
});
