export interface BotCategory {
  id: string;
  title: string;
  lead: string;
  items: string[];
}

export const BOT_CATEGORIES: BotCategory[] = [
  {
    id: "beef",
    title: "Beef",
    lead: "Popular steaks, mince, and slow-cook cuts.",
    items: [
      "Ground Beef - from $8.99",
      "Beef Chuck Roast - from $15.99",
      "Beef Ribeye Steak - from $18.99",
    ],
  },
  {
    id: "lamb",
    title: "Lamb",
    lead: "Tender lamb cuts for grills and family feasts.",
    items: [
      "Whole Leg of Lamb - from $34.99",
      "Lamb Chops - from $24.99",
      "Ground Lamb - from $12.99",
    ],
  },
  {
    id: "chicken",
    title: "Chicken",
    lead: "Daily fresh chicken essentials and family packs.",
    items: [
      "Whole Chicken - from $12.99",
      "Chicken Thighs - from $10.49",
      "Chicken Wings - from $9.99",
    ],
  },
  {
    id: "goat",
    title: "Goat",
    lead: "Traditional curry cuts and slow-cook favourites.",
    items: [
      "Goat Shoulder - from $22.99",
      "Goat Curry Cut - from $17.99",
    ],
  },
];

export function getCategoryById(id: string) {
  return BOT_CATEGORIES.find((category) => category.id === id);
}

export function buildCategoryMessage(id: string) {
  const category = getCategoryById(id);
  if (!category) {
    return "Category not found. Use the menu to browse available cuts.";
  }

  return [
    `${category.title}`,
    category.lead,
    "",
    ...category.items.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Tap Open Web App to see the full catalogue and place an order.",
  ].join("\n");
}

export function buildDealsMessage() {
  return [
    "Current deals",
    "",
    "1. SAVE10 - 10% off orders above $60",
    "2. FREESHIP - free delivery on any basket",
    "3. Family Halal Box - save over $20 on the weekly bundle",
    "",
    "Use the promo code in the cart before checkout.",
  ].join("\n");
}

export function buildDeliveryMessage() {
  return [
    "Delivery details",
    "",
    "- Same-day dispatch on orders placed before 2pm",
    "- Evening delivery slots are available during checkout",
    "- Order updates appear in the website and Telegram bot",
    "",
    "Need to edit an address? Open Support from the main menu.",
  ].join("\n");
}

export function buildSupportMessage() {
  return [
    "Support options",
    "",
    "- Use Shop to browse categories",
    "- Use Delivery for dispatch questions",
    "- Keep your order ID ready when asking for help",
    "",
    "If the website is already deployed, use Open Web App for the fastest checkout flow.",
  ].join("\n");
}

export function buildWelcomeMessage(webAppAvailable: boolean) {
  return [
    "Fresh Halal Direct",
    "",
    "Minimal, fast, and practical ordering from Telegram.",
    "Use the menu below for shopping, deals, delivery help, or support.",
    webAppAvailable
      ? "Open Web App gives the quickest path to checkout."
      : "Set TELEGRAM_WEBAPP_URL after deploy to enable the Open Web App button.",
  ].join("\n");
}
