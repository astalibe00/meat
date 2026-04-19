export interface BotCategory {
  id: string;
  title: string;
  lead: string;
  items: string[];
}

export const BOT_CATEGORIES: BotCategory[] = [
  {
    id: "beef",
    title: "Mol go'shti",
    lead: "Steyk, qiyma va sekin pishadigan bo'laklar.",
    items: [
      "Ground Beef - 110 000 UZS / 0.5 kg",
      "Beef Chuck Roast - 195 000 UZS / 0.9-1.4 kg",
      "Beef Ribeye Steak - 232 000 UZS / 0.3 kg",
    ],
  },
  {
    id: "lamb",
    title: "Qo'y go'shti",
    lead: "Grill va oilaviy dasturxon uchun yumshoq bo'laklar.",
    items: [
      "Whole Leg of Lamb - 427 000 UZS / 1.8-2.3 kg",
      "Lamb Chops - 305 000 UZS / 0.6 kg",
      "Ground Lamb - 158 000 UZS / 0.5 kg",
    ],
  },
  {
    id: "chicken",
    title: "Tovuq",
    lead: "Har kuni yangi tovuq mahsulotlari va oilaviy hajm.",
    items: [
      "Whole Chicken - 158 000 UZS / 1.8-2.3 kg",
      "Chicken Thighs - 128 000 UZS / 1.8 kg",
      "Chicken Wings - 122 000 UZS / 1.4 kg",
    ],
  },
  {
    id: "goat",
    title: "Echki go'shti",
    lead: "An'anaviy curry va dimlama uchun tanlovlar.",
    items: [
      "Goat Shoulder - 280 000 UZS / 1.4-1.8 kg",
      "Goat Curry Cut - 220 000 UZS / 0.9 kg",
    ],
  },
];

export function getCategoryById(id: string) {
  return BOT_CATEGORIES.find((category) => category.id === id);
}

export function buildCategoryMessage(id: string) {
  const category = getCategoryById(id);
  if (!category) {
    return "Kategoriya topilmadi. Menyudan qayta tanlang.";
  }

  return [
    `${category.title}`,
    category.lead,
    "",
    ...category.items.map((item, index) => `${index + 1}. ${item}`),
    "",
    "To'liq katalog va checkout uchun Mini App tugmasini bosing.",
  ].join("\n");
}

export function buildDealsMessage() {
  return [
    "Joriy aksiyalar",
    "",
    "1. SAVE10 - 700 000 UZS dan yuqori savatga 10% chegirma",
    "2. FREESHIP - istalgan savatga bepul yetkazib berish",
    "3. Family Halal Box - haftalik to'plam uchun foydali narx",
    "",
    "Promo kodni checkoutdan oldin savatchada kiriting.",
  ].join("\n");
}

export function buildDeliveryMessage() {
  return [
    "Yetkazib berish",
    "",
    "- 14:00 gacha berilgan buyurtmalar shu kuni jo'natiladi",
    "- Kechki slotlar checkout ichida tanlanadi",
    "- Status yangilanishlari sayt va botda ko'rinadi",
    "",
    "Manzilni o'zgartirish kerak bo'lsa, Support bo'limidan yozing.",
  ].join("\n");
}

export function buildSupportMessage() {
  return [
    "Support",
    "",
    "- Katalog orqali mahsulotlarni ko'ring",
    "- Yetkazib berish bo'limidan dispatch ma'lumotini oling",
    "- Yordam so'rovida order ID ni yozib yuboring",
    "",
    "Eng tez checkout uchun Mini App tugmasidan foydalaning.",
  ].join("\n");
}

export function buildWelcomeMessage(webAppAvailable: boolean) {
  return [
    "Fresh Halal Direct",
    "",
    "Telegram ichida tez, minimal va qulay buyurtma oqimi.",
    "Quyidagi menyudan katalog, aksiyalar, yetkazib berish yoki supportni tanlang.",
    webAppAvailable
      ? "Mini App eng tez checkout yo'lini ochadi."
      : "Mini App tugmasi deploy URL sozlangach ishlaydi.",
  ].join("\n");
}
