import { searchProducts } from "../../src/lib/catalog-intelligence.js";
import type { CustomerNotification, CustomerOrder, ManagedProduct } from "../../src/types/app-data.js";

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
    "Aksiyalar Mini App checkout oqimida qo'llanadi.",
  ].join("\n");
}

export function buildDeliveryMessage() {
  return [
    "Yetkazib berish",
    "",
    "- Checkout ichida Bugun yoki Ertaga tanlanadi",
    "- Tarqatish punktidan olib ketish ham mavjud",
    "- Holat yangilanishlari Mini App va botda ko'rinadi",
    "",
    "Manzilni checkout ichida xarita orqali belgilang.",
  ].join("\n");
}

export function buildSupportMessage() {
  return [
    "Yordam",
    "",
    "- FAQ va support kontaktlari Mini App ichida ko'rinadi",
    "- Telefon: +998990197548",
    "- Telegram: t.me/saidazizov_s",
    "",
    "Eng tez rasmiylashtirish uchun Mini App tugmasidan foydalaning.",
  ].join("\n");
}

export function buildWelcomeMessage(webAppAvailable: boolean) {
  return [
    "Fresh Halal Direct",
    "",
    "Tez buyurtma uchun Mini Appni oching.",
    "Bot buyurtma holati, qayta buyurtma va support xabarlarini yuritadi.",
    webAppAvailable
      ? "Mini App eng tez rasmiylashtirish yo'lini ochadi."
      : "Mini App tugmasi deploy URL sozlangach ishlaydi.",
  ].join("\n");
}

export function buildHelpMessage() {
  return [
    "Bot buyruqlari",
    "",
    "/menu - asosiy menyu",
    "/orders - buyurtmalarim",
    "/repeat - oxirgi buyurtmani Mini App savatiga qayta qo'shish",
    "/status BUYURTMA_ID - aniq buyurtma holati",
    "/support - support kontaktlari",
    "",
    "Katalog, qidiruv, promo va checkout Mini App ichida.",
  ].join("\n");
}

export function buildSearchResultsMessage(products: ManagedProduct[], query: string) {
  const results = searchProducts(products, query).slice(0, 5);
  if (results.length === 0) {
    return `"${query}" bo'yicha mos mahsulot topilmadi. Qisqaroq so'rov yoki kategoriya nomini yuboring.`;
  }

  return [
    `Qidiruv: ${query}`,
    "",
    ...results.map(
      (product, index) =>
        `${index + 1}. ${product.name} - ${new Intl.NumberFormat("uz-UZ").format(product.price)} UZS / ${product.weight}`,
    ),
    "",
    "To'liq tafsilot va buyurtma uchun Mini Appni oching.",
  ].join("\n");
}

export function buildTopProductsMessage(products: ManagedProduct[], orders: CustomerOrder[]) {
  const orderWeights = new Map<string, number>();

  for (const order of orders) {
    for (const line of order.items) {
      orderWeights.set(line.product.id, (orderWeights.get(line.product.id) ?? 0) + line.quantity);
    }
  }

  const ranked = [...products]
    .map((product) => ({
      product,
      score: (orderWeights.get(product.id) ?? 0) + ((product.tags ?? []).includes("Popular") ? 2 : 0),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  return [
    "Top mahsulotlar",
    "",
    ...ranked.map(
      (entry, index) =>
        `${index + 1}. ${entry.product.name} - ${new Intl.NumberFormat("uz-UZ").format(entry.product.price)} UZS / ${entry.product.weight}`,
    ),
    "",
    "Katalog va checkout uchun Mini Appni oching.",
  ].join("\n");
}

export function buildNotificationsMessage(notifications: CustomerNotification[]) {
  if (notifications.length === 0) {
    return "Hozircha yangi xabarlar yo'q. Buyurtma yangilanishlari va admin e'lonlari shu bo'limda chiqadi.";
  }

  return [
    "Xabarlarim",
    "",
    ...notifications.slice(0, 5).map((notification, index) => {
      const lead = notification.orderId ? `${notification.title} (${notification.orderId})` : notification.title;
      return `${index + 1}. ${lead}\n${notification.body}`;
    }),
    "",
    "To'liq tracking va katalog uchun Mini Appni oching.",
  ].join("\n");
}
