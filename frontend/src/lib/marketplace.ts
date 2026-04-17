import type { Product } from "./types";
import { toNumber } from "./utils";

export type ProductUnit = "kg" | "pack";
export type ProductFreshness = "fresh" | "frozen";
export type ProductViewMode = "grid" | "list";

export interface WeightOption {
  label: string;
  multiplier: number;
  unit: ProductUnit;
}

export interface WholesaleTier {
  label: string;
  minQuantity: number;
  price: number;
}

export interface MarketplaceProductMeta {
  coldChain: boolean;
  compareAtPrice: number;
  cutType: string;
  deliveryEta: string;
  discountPercent: number;
  estimatedFreshness: string;
  favoriteSellerLabel: string;
  freshness: ProductFreshness;
  halal: boolean;
  minimumOrderLabel: string;
  origin: string;
  packaging: string;
  proteinType: string;
  rating: number;
  region: string;
  reviewCount: number;
  sellerName: string;
  stockCount: number;
  stockLabel: string;
  stockTone: "success" | "warning";
  subscriptionLabel: string;
  unit: ProductUnit;
  unitLabel: string;
  veterinaryChecked: boolean;
  warehouseOrigin: string;
  weightOptions: WeightOption[];
  wholesaleTiers: WholesaleTier[];
}

const sellerNames = [
  "Halol Butcher House",
  "Samarqand Premium Farm",
  "Toshkent Cold Chain",
  "Qassob Select",
  "Chef Reserve Market",
  "Organic Halal Supply",
];

const regions = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand",
  "Buxoro",
  "Farg'ona",
  "Namangan",
];

const cutTypes = [
  "Premium cut",
  "Steak uchun kesim",
  "Sho'rva uchun kesim",
  "Kabob uchun kesim",
  "Mayin file",
  "Universal kesim",
];

const packagings = [
  "Vakuum qadoq",
  "Gigiyenik tray",
  "Sous bilan set",
  "Portion qadoq",
];

const warehouseOrigins = [
  "Markaziy sovuq ombor",
  "Fermadan to'g'ridan-to'g'ri",
  "Premium cut markazi",
  "Verified cold-room",
];

const proteinKeywords: Array<{ keyword: string; label: string }> = [
  { keyword: "mol", label: "Mol go'shti" },
  { keyword: "qo'y", label: "Qo'y go'shti" },
  { keyword: "tovuq", label: "Tovuq" },
  { keyword: "kurka", label: "Kurka" },
  { keyword: "qiyma", label: "Qiyma" },
  { keyword: "yarim", label: "Yarim tayyor" },
];

function hashValue(input: string) {
  return input.split("").reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);
}

function selectFrom<T>(input: string, values: T[]) {
  return values[hashValue(input) % values.length];
}

function detectProtein(product: Product) {
  const search = `${product.name} ${product.categories?.name ?? ""}`.toLowerCase();
  const matched = proteinKeywords.find((item) => search.includes(item.keyword));
  return matched?.label ?? "Premium assortiment";
}

function detectUnit(product: Product): ProductUnit {
  const search = product.name.toLowerCase();
  if (search.includes("set") || search.includes("file") || search.includes("nugget")) {
    return "pack";
  }

  return "kg";
}

function buildWeightOptions(unit: ProductUnit): WeightOption[] {
  if (unit === "pack") {
    return [
      { label: "1 dona", multiplier: 1, unit },
      { label: "2 dona", multiplier: 2, unit },
      { label: "4 dona", multiplier: 4, unit },
    ];
  }

  return [
    { label: "0.5 kg", multiplier: 0.5, unit },
    { label: "1 kg", multiplier: 1, unit },
    { label: "1.5 kg", multiplier: 1.5, unit },
    { label: "2 kg", multiplier: 2, unit },
  ];
}

export function getMarketplaceProductMeta(product: Product): MarketplaceProductMeta {
  const input = `${product.id}${product.name}${product.category_id ?? ""}`;
  const price = toNumber(product.price);
  const unit = detectUnit(product);
  const weightOptions = buildWeightOptions(unit);
  const freshness: ProductFreshness = hashValue(input) % 5 === 0 ? "frozen" : "fresh";
  const stockCount = (hashValue(input) % 28) + 8;
  const compareAtPrice = Math.round(price * (freshness === "fresh" ? 1.14 : 1.09));
  const discountPercent = Math.max(
    6,
    Math.round(((compareAtPrice - price) / Math.max(compareAtPrice, 1)) * 100),
  );
  const sellerName = selectFrom(input, sellerNames);
  const region = selectFrom(input, regions);
  const proteinType = detectProtein(product);
  const wholesaleTiers =
    unit === "kg"
      ? [
          { label: "5 kg+", minQuantity: 5, price: Math.round(price * 0.97) },
          { label: "10 kg+", minQuantity: 10, price: Math.round(price * 0.93) },
          { label: "25 kg+", minQuantity: 25, price: Math.round(price * 0.89) },
        ]
      : [
          { label: "6 dona+", minQuantity: 6, price: Math.round(price * 0.96) },
          { label: "12 dona+", minQuantity: 12, price: Math.round(price * 0.92) },
          { label: "24 dona+", minQuantity: 24, price: Math.round(price * 0.87) },
        ];

  return {
    coldChain: true,
    compareAtPrice,
    cutType: selectFrom(input, cutTypes),
    deliveryEta: freshness === "fresh" ? "~2 soat ichida" : "~4 soat ichida",
    discountPercent,
    estimatedFreshness:
      freshness === "fresh" ? "Yangi tayyorlangan, 12 soat ichida" : "Sovuq zanjir bilan muzlatilgan",
    favoriteSellerLabel: "Verified seller",
    freshness,
    halal: true,
    minimumOrderLabel: unit === "kg" ? "Min. 0.5 kg" : "Min. 1 dona",
    origin: `${region} yetkazib beruvchisi`,
    packaging: selectFrom(input, packagings),
    proteinType,
    rating: 4.6 + (hashValue(input) % 4) * 0.1,
    region,
    reviewCount: 24 + (hashValue(input) % 170),
    sellerName,
    stockCount,
    stockLabel: stockCount > 16 ? "Mavjud" : "Cheklangan",
    stockTone: stockCount > 16 ? "success" : "warning",
    subscriptionLabel: unit === "kg" ? "Haftalik supply" : "Doimiy qayta buyurtma",
    unit,
    unitLabel: unit === "kg" ? "/kg" : "/dona",
    veterinaryChecked: true,
    warehouseOrigin: selectFrom(input, warehouseOrigins),
    weightOptions,
    wholesaleTiers,
  };
}

export function groupCartItemsBySeller<
  T extends { products?: Product | null },
>(items: T[]) {
  const grouped = new Map<string, T[]>();

  items.forEach((item) => {
    const product = item.products;
    const sellerKey = product ? getMarketplaceProductMeta(product).sellerName : "Noma'lum seller";
    const current = grouped.get(sellerKey) ?? [];
    current.push(item);
    grouped.set(sellerKey, current);
  });

  return Array.from(grouped.entries()).map(([sellerName, sellerItems]) => ({
    items: sellerItems,
    sellerName,
  }));
}

export function getDeliveryZoneMeta(zone: string) {
  const trimmed = zone.trim().toLowerCase();

  if (!trimmed) {
    return {
      available: false,
      label: "Manzil kiriting",
      note: "Yetkazish zonasi va slot tavsiyasi shu yerda chiqadi.",
    };
  }

  if (
    trimmed.includes("toshkent") ||
    trimmed.includes("yunusobod") ||
    trimmed.includes("chilonzor") ||
    trimmed.includes("mirobod")
  ) {
    return {
      available: true,
      label: "Fast zone",
      note: "Bugun yetkazib berish mavjud, fresh buyurtmalar birinchi navbatda yuboriladi.",
    };
  }

  return {
    available: false,
    label: "Slot bilan yetkaziladi",
    note: "Bu hudud uchun ertangi slot yoki frozen format tavsiya qilinadi.",
  };
}
