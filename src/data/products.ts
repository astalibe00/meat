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
  { id: "beef", name: "Beef", emoji: "🥩", tagline: "Hand-trimmed cuts" },
  { id: "lamb", name: "Lamb", emoji: "🍖", tagline: "Tender & traditional" },
  { id: "chicken", name: "Chicken", emoji: "🍗", tagline: "Fresh daily" },
  { id: "goat", name: "Goat", emoji: "🐐", tagline: "Curry & celebration" },
  { id: "seafood", name: "Seafood", emoji: "🐟", tagline: "Wild caught" },
  { id: "bundles", name: "Bundles", emoji: "📦", tagline: "Save more" },
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
    name: "Ground Beef",
    price: 110000,
    weight: "0.5 kg",
    category: "beef",
    image: groundBeef,
    tags: ["Popular", "Fresh"],
    description:
      "Freshly ground 100% halal beef. Perfect for burgers, kofta, and family meals. Hand-trimmed and ground daily.",
    weightOptions: ["0.5 kg", "1 kg", "2.3 kg"],
    origin: "Pasture-raised, USA",
    prepTime: "15 min",
  },
  {
    id: "beef-chuck",
    name: "Beef Chuck Roast",
    price: 195000,
    oldPrice: 245000,
    weight: "0.9-1.4 kg",
    category: "beef",
    image: beefChuck,
    tags: ["Sale", "Best Value"],
    description:
      "Tender, well-marbled chuck roast. Slow cook for melt-in-your-mouth pot roasts and stews.",
    weightOptions: ["0.9 kg", "1.4 kg"],
    origin: "Grass-fed, USA",
    prepTime: "3 hr slow cook",
  },
  {
    id: "beef-ribeye",
    name: "Beef Ribeye Steak",
    price: 232000,
    weight: "0.3 kg",
    category: "beef",
    image: beefRibeye,
    tags: ["Premium", "Popular"],
    description:
      "Hand-cut premium ribeye, generously marbled for the perfect steakhouse experience at home.",
    weightOptions: ["0.3 kg", "0.45 kg"],
    origin: "Prime grade, USA",
    prepTime: "10 min",
  },
  {
    id: "beef-short-ribs",
    name: "Beef Short Ribs",
    price: 177000,
    weight: "0.9 kg",
    category: "beef",
    image: beefShortRibs,
    tags: ["Traditional"],
    description: "Rich, meaty short ribs ideal for braising. Falls off the bone every time.",
    origin: "Grass-fed, USA",
    prepTime: "4 hr braise",
  },
  {
    id: "lamb-leg",
    name: "Whole Leg of Lamb",
    price: 427000,
    oldPrice: 525000,
    weight: "1.8-2.3 kg",
    category: "lamb",
    image: lambLeg,
    tags: ["Sale", "Premium", "Traditional"],
    description:
      "A whole bone-in leg of lamb, tender and full of flavor. Perfect for celebrations and Sunday roasts.",
    origin: "New Zealand pasture",
    prepTime: "2 hr roast",
  },
  {
    id: "lamb-chops",
    name: "Lamb Chops",
    price: 305000,
    weight: "0.6 kg",
    category: "lamb",
    image: lambChops,
    tags: ["Premium", "Popular"],
    description: "Tender French-trimmed lamb chops. Quick-cook to perfection on the grill or pan.",
    weightOptions: ["0.6 kg", "1.2 kg"],
    origin: "New Zealand pasture",
    prepTime: "8 min",
  },
  {
    id: "ground-lamb",
    name: "Ground Lamb",
    price: 158000,
    weight: "0.5 kg",
    category: "lamb",
    image: groundLamb,
    tags: ["Fresh"],
    description: "Freshly ground lamb, ideal for kebabs, kofta, and traditional dishes.",
    weightOptions: ["0.5 kg", "1 kg"],
    origin: "Pasture-raised",
    prepTime: "15 min",
  },
  {
    id: "whole-chicken",
    name: "Whole Chicken",
    price: 158000,
    weight: "1.8-2.3 kg",
    category: "chicken",
    image: wholeChicken,
    tags: ["Popular", "Fresh", "Best Value"],
    description:
      "Whole halal chicken, plump and fresh. Roast, grill, or break down for multiple meals.",
    origin: "Free-range, USA",
    prepTime: "1.5 hr roast",
  },
  {
    id: "chicken-thighs",
    name: "Chicken Thighs",
    price: 128000,
    weight: "1.8 kg",
    category: "chicken",
    image: chickenThighs,
    tags: ["Best Value", "Fresh"],
    description: "Bone-in, skin-on thighs packed with flavor. Family-size value, restaurant quality.",
    origin: "Free-range, USA",
    prepTime: "35 min",
  },
  {
    id: "chicken-wings",
    name: "Chicken Wings",
    price: 122000,
    oldPrice: 158000,
    weight: "1.4 kg",
    category: "chicken",
    image: chickenWings,
    tags: ["Sale", "Popular"],
    description: "Fresh halal wings, party-ready. Perfect for game day and gatherings.",
    origin: "Free-range, USA",
    prepTime: "40 min",
  },
  {
    id: "goat-shoulder",
    name: "Goat Shoulder",
    price: 280000,
    weight: "1.4-1.8 kg",
    category: "goat",
    image: goatShoulder,
    tags: ["Traditional", "Premium"],
    description:
      "Tender goat shoulder, slow-cook ready. A traditional favorite for biryanis and curries.",
    origin: "Pasture-raised",
    prepTime: "3 hr slow cook",
  },
  {
    id: "goat-curry",
    name: "Goat Curry Cut",
    price: 220000,
    weight: "0.9 kg",
    category: "goat",
    image: goatCurry,
    tags: ["Traditional", "Popular"],
    description: "Bone-in goat pieces cut for curry. Fresh, clean, and ready to cook.",
    origin: "Pasture-raised",
    prepTime: "2 hr",
  },
  {
    id: "wild-salmon",
    name: "Wild Salmon",
    price: 183000,
    weight: "0.5 kg",
    category: "seafood",
    image: salmon,
    tags: ["Wild Caught", "Premium", "Fresh"],
    description:
      "Wild-caught salmon fillet, sustainably sourced. Rich in omega-3 and bursting with flavor.",
    weightOptions: ["0.5 kg", "1 kg"],
    origin: "Wild Alaskan",
    prepTime: "12 min",
  },
  {
    id: "family-box",
    name: "Family Halal Box",
    price: 793000,
    oldPrice: 1037000,
    weight: "4.5 kg",
    category: "bundles",
    image: familyBox,
    tags: ["Sale", "Best Deal", "Best Value"],
    description:
      "A complete week of meals: ground beef, chicken, lamb chops, and goat curry cuts. Save more on the weekly bundle.",
    origin: "Mixed selection",
    prepTime: "Various",
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
