import beefRibeye from "@/assets/products/beef-ribeye.jpg";
import groundBeef from "@/assets/products/ground-beef.jpg";
import beefChuck from "@/assets/products/beef-chuck.jpg";
import beefShortRibs from "@/assets/products/beef-short-ribs.jpg";
import lambLeg from "@/assets/products/lamb-leg.jpg";
import lambChops from "@/assets/products/lamb-chops.jpg";
import groundLamb from "@/assets/products/ground-lamb.jpg";
import wholeChicken from "@/assets/products/whole-chicken.jpg";
import chickenThighs from "@/assets/products/chicken-thighs.jpg";
import chickenWings from "@/assets/products/chicken-wings.jpg";
import goatShoulder from "@/assets/products/goat-shoulder.jpg";
import goatCurry from "@/assets/products/goat-curry.jpg";
import salmon from "@/assets/products/salmon.jpg";
import familyBox from "@/assets/products/family-box.jpg";

export type CategoryId =
  | "beef"
  | "lamb"
  | "chicken"
  | "goat"
  | "seafood"
  | "bundles";

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  tagline: string;
}

export const CATEGORIES: Category[] = [
  { id: "beef", name: "Mol go'shti", emoji: "🥩", tagline: "Tozalab kesilgan bo'laklar" },
  { id: "lamb", name: "Qo'y go'shti", emoji: "🍖", tagline: "Yumshoq va an'anaviy" },
  { id: "chicken", name: "Tovuq", emoji: "🍗", tagline: "Har kuni yangi" },
  { id: "goat", name: "Echki go'shti", emoji: "🐐", tagline: "Qozon va bayram uchun" },
  { id: "seafood", name: "Baliq", emoji: "🐟", tagline: "Tabiiy ov mahsuloti" },
  { id: "bundles", name: "To'plamlar", emoji: "📦", tagline: "Ko'proq tejamkor" },
];

export type Tag =
  | "Popular"
  | "Sale"
  | "Premium"
  | "Fresh"
  | "Best Value"
  | "Traditional"
  | "Wild Caught"
  | "Best Deal";

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  weight: string;
  category: CategoryId;
  image: string;
  tags: Tag[];
  description: string;
  weightOptions?: string[];
  origin?: string;
  prepTime?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "ground-beef",
    name: "Qiyma mol go'shti",
    price: 110000,
    weight: "0.5 kg",
    category: "beef",
    image: groundBeef,
    tags: ["Popular", "Fresh"],
    description:
      "100% halol mol go'shti qiyma qilinib tayyorlangan. Burger, kofta va oilaviy taomlar uchun juda qulay. Har kuni yangidan tayyorlanadi.",
    weightOptions: ["0.5 kg", "1 kg", "2.3 kg"],
    origin: "AQSH, yaylovda boqilgan",
    prepTime: "15 daqiqa",
  },
  {
    id: "beef-chuck",
    name: "Mol go'shti dimlamalik bo'lagi",
    price: 195000,
    oldPrice: 245000,
    weight: "0.9-1.4 kg",
    category: "beef",
    image: beefChuck,
    tags: ["Sale", "Best Value"],
    description:
      "Yumshoq va yog' tomirli mol bo'lagi. Dimlama, qozon-kabob va sekin pishadigan taomlar uchun mos.",
    weightOptions: ["0.9 kg", "1.4 kg"],
    origin: "AQSH, o't bilan boqilgan",
    prepTime: "3 soat sekin pishirish",
  },
  {
    id: "beef-ribeye",
    name: "Mol ribay steyki",
    price: 232000,
    weight: "0.3 kg",
    category: "beef",
    image: beefRibeye,
    tags: ["Premium", "Popular"],
    description:
      "Qo'lda kesilgan premium ribay. Uy sharoitida restoran darajasidagi steyk tayyorlash uchun mo'ljallangan.",
    weightOptions: ["0.3 kg", "0.45 kg"],
    origin: "AQSH, prime sifat",
    prepTime: "10 daqiqa",
  },
  {
    id: "beef-short-ribs",
    name: "Mol qisqa qovurg'alari",
    price: 177000,
    weight: "0.9 kg",
    category: "beef",
    image: beefShortRibs,
    tags: ["Traditional"],
    description: "Mazali va go'shtdor qovurg'alar. Damlash uchun ideal va doim yumshoq chiqadi.",
    origin: "AQSH, o't bilan boqilgan",
    prepTime: "4 soat dimlash",
  },
  {
    id: "lamb-leg",
    name: "Butun qo'y soni",
    price: 427000,
    oldPrice: 525000,
    weight: "1.8-2.3 kg",
    category: "lamb",
    image: lambLeg,
    tags: ["Sale", "Premium", "Traditional"],
    description:
      "Suyakli butun qo'y soni, yumshoq va xushbo'y. Bayramlar va katta dasturxon uchun juda qulay.",
    origin: "Yangi Zelandiya yaylovi",
    prepTime: "2 soat pechda",
  },
  {
    id: "lamb-chops",
    name: "Qo'y kotleti",
    price: 305000,
    weight: "0.6 kg",
    category: "lamb",
    image: lambChops,
    tags: ["Premium", "Popular"],
    description: "Yumshoq qo'y kotletlari. Tovada yoki grilda tez va mazali pishadi.",
    weightOptions: ["0.6 kg", "1.2 kg"],
    origin: "Yangi Zelandiya yaylovi",
    prepTime: "8 daqiqa",
  },
  {
    id: "ground-lamb",
    name: "Qiyma qo'y go'shti",
    price: 158000,
    weight: "0.5 kg",
    category: "lamb",
    image: groundLamb,
    tags: ["Fresh"],
    description: "Yangi qiyma qo'y go'shti. Kabob, kofta va milliy taomlar uchun juda mos.",
    weightOptions: ["0.5 kg", "1 kg"],
    origin: "Yaylovda boqilgan",
    prepTime: "15 daqiqa",
  },
  {
    id: "whole-chicken",
    name: "Butun tovuq",
    price: 158000,
    weight: "1.8-2.3 kg",
    category: "chicken",
    image: wholeChicken,
    tags: ["Popular", "Fresh", "Best Value"],
    description:
      "Butun halol tovuq, yangi va shirali. Pechda, grilda yoki bo'laklab turli taomlarga ishlatish mumkin.",
    origin: "AQSH, erkin boqilgan",
    prepTime: "1.5 soat pechda",
  },
  {
    id: "chicken-thighs",
    name: "Tovuq sonlari",
    price: 128000,
    weight: "1.8 kg",
    category: "chicken",
    image: chickenThighs,
    tags: ["Best Value", "Fresh"],
    description: "Suyakli va po'stli tovuq sonlari. Oilaviy hajm, to'yimli va sermazza variant.",
    origin: "AQSH, erkin boqilgan",
    prepTime: "35 daqiqa",
  },
  {
    id: "chicken-wings",
    name: "Tovuq qanotlari",
    price: 122000,
    oldPrice: 158000,
    weight: "1.4 kg",
    category: "chicken",
    image: chickenWings,
    tags: ["Sale", "Popular"],
    description:
      "Yangi halol qanotlar. Mehmonlar, oilaviy yig'ilish va tez tayyor taomlar uchun qulay.",
    origin: "AQSH, erkin boqilgan",
    prepTime: "40 daqiqa",
  },
  {
    id: "goat-shoulder",
    name: "Echki yelkasi",
    price: 280000,
    weight: "1.4-1.8 kg",
    category: "goat",
    image: goatShoulder,
    tags: ["Traditional", "Premium"],
    description:
      "Yumshoq echki yelkasi, sekin pishirish uchun tayyor. Biryani va curry taomlari uchun an'anaviy tanlov.",
    origin: "Yaylovda boqilgan",
    prepTime: "3 soat sekin pishirish",
  },
  {
    id: "goat-curry",
    name: "Echki go'shti curry bo'laklari",
    price: 220000,
    weight: "0.9 kg",
    category: "goat",
    image: goatCurry,
    tags: ["Traditional", "Popular"],
    description:
      "Suyakli echki bo'laklari, curry va dimlama uchun kesib tayyorlangan. Toza va pishirishga tayyor.",
    origin: "Yaylovda boqilgan",
    prepTime: "2 soat",
  },
  {
    id: "wild-salmon",
    name: "Yovvoyi losos",
    price: 183000,
    weight: "0.5 kg",
    category: "seafood",
    image: salmon,
    tags: ["Wild Caught", "Premium", "Fresh"],
    description:
      "Yovvoyi ovlangan losos filesi. Omega-3 ga boy va juda mazali baliq tanlovi.",
    weightOptions: ["0.5 kg", "1 kg"],
    origin: "Alyaska, yovvoyi ov",
    prepTime: "12 daqiqa",
  },
  {
    id: "family-box",
    name: "Oilaviy halol to'plam",
    price: 793000,
    oldPrice: 1037000,
    weight: "4.5 kg",
    category: "bundles",
    image: familyBox,
    tags: ["Sale", "Best Deal", "Best Value"],
    description:
      "Bir haftalik taomlar uchun tayyor to'plam: qiyma mol go'shti, tovuq, qo'y kotleti va echki curry bo'laklari. To'plam bilan yanada tejamkor xarid qiling.",
    origin: "Aralash tanlov",
    prepTime: "Turlicha",
  },
];

export const FREE_SHIPPING_THRESHOLD = 900000;
export const DELIVERY_FEE = 85000;

export const getProductById = (id: string) => PRODUCTS.find((p) => p.id === id);
export const getProductsByCategory = (cat: CategoryId) =>
  PRODUCTS.filter((p) => p.category === cat);
export const getProductsByTag = (tag: Tag) =>
  PRODUCTS.filter((p) => p.tags.includes(tag));

export const getRelatedProducts = (id: string, limit = 4) => {
  const self = getProductById(id);
  if (!self) return [];

  const sameCategory = PRODUCTS.filter((p) => p.id !== id && p.category === self.category);
  const popular = PRODUCTS.filter(
    (p) => p.id !== id && p.tags.includes("Popular") && !sameCategory.includes(p),
  );

  return [...sameCategory, ...popular].slice(0, limit);
};

export const getCartUpsells = (cartProductIds: string[], limit = 4) => {
  const inCart = new Set(cartProductIds);
  const cartCategories = new Set(
    cartProductIds.map((id) => getProductById(id)?.category).filter(Boolean) as CategoryId[],
  );

  const scored = PRODUCTS.filter((p) => !inCart.has(p.id))
    .map((p) => {
      let score = 0;

      if (p.category === "bundles") score += 10;
      if (!cartCategories.has(p.category)) score += 6;
      if (p.tags.includes("Sale")) score += 3;
      if (p.tags.includes("Popular")) score += 2;
      if (p.tags.includes("Best Value")) score += 2;

      return { p, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.p);
};
