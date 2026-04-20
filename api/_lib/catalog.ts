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
      "Qiyma mol go'shti - 110 000 UZS / 0.5 kg",
      "Mol go'shti dimlamalik bo'lagi - 195 000 UZS / 0.9-1.4 kg",
      "Mol ribay steyki - 232 000 UZS / 0.3 kg",
    ],
  },
  {
    id: "lamb",
    title: "Qo'y go'shti",
    lead: "Grill va oilaviy dasturxon uchun yumshoq bo'laklar.",
    items: [
      "Butun qo'y soni - 427 000 UZS / 1.8-2.3 kg",
      "Qo'y kotleti - 305 000 UZS / 0.6 kg",
      "Qiyma qo'y go'shti - 158 000 UZS / 0.5 kg",
    ],
  },
  {
    id: "chicken",
    title: "Tovuq",
    lead: "Har kuni yangi tovuq mahsulotlari va oilaviy hajm.",
    items: [
      "Butun tovuq - 158 000 UZS / 1.8-2.3 kg",
      "Tovuq sonlari - 128 000 UZS / 1.8 kg",
      "Tovuq qanotlari - 122 000 UZS / 1.4 kg",
    ],
  },
  {
    id: "goat",
    title: "Echki go'shti",
    lead: "An'anaviy curry va dimlama uchun tanlovlar.",
    items: [
      "Echki yelkasi - 280 000 UZS / 1.4-1.8 kg",
      "Echki go'shti curry bo'laklari - 220 000 UZS / 0.9 kg",
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
    "To'liq katalog va rasmiylashtirish uchun Mini App tugmasini bosing.",
  ].join("\n");
}

export function buildDealsMessage() {
  return [
    "Joriy aksiyalar",
    "",
    "1. SAVE10 - 700 000 UZS dan yuqori savatga 10% chegirma",
    "2. FREESHIP - istalgan savatga bepul yetkazib berish",
    "3. Oilaviy halol to'plam - haftalik xarid uchun foydali narx",
    "",
    "Promo kodni rasmiylashtirishdan oldin savatchada kiriting.",
  ].join("\n");
}

export function buildDeliveryMessage() {
  return [
    "Yetkazib berish",
    "",
    "- 14:00 gacha berilgan buyurtmalar shu kuni jo'natiladi",
    "- Kechki slotlar rasmiylashtirish oynasida tanlanadi",
    "- Holat yangilanishlari sayt va botda ko'rinadi",
    "",
    "Manzilni o'zgartirish kerak bo'lsa, Yordam bo'limidan yozing.",
  ].join("\n");
}

export function buildSupportMessage() {
  return [
    "Yordam",
    "",
    "- Katalog orqali mahsulotlarni ko'ring",
    "- Yetkazib berish bo'limidan dispatch ma'lumotini oling",
    "- Yordam so'rovida buyurtma ID raqamini yozib yuboring",
    "",
    "Eng tez rasmiylashtirish uchun Mini App tugmasidan foydalaning.",
  ].join("\n");
}

export function buildWelcomeMessage(webAppAvailable: boolean) {
  return [
    "Fresh Halal Direct",
    "",
    "Telegram ichida tez, minimal va qulay buyurtma oqimi.",
    "Quyidagi menyudan katalog, aksiyalar, yetkazib berish yoki yordam bo'limini tanlang.",
    webAppAvailable
      ? "Mini App eng tez rasmiylashtirish yo'lini ochadi."
      : "Mini App tugmasi deploy URL sozlangach ishlaydi.",
  ].join("\n");
}
