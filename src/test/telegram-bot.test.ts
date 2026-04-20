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
});
