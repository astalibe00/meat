import type { CustomerOrder, ManagedProduct } from "@/types/app-data";

const CATEGORY_SYNONYMS: Record<ManagedProduct["category"], string[]> = {
  beef: ["mol", "beef", "steyk", "steak", "qiyma", "ribay"],
  lamb: ["qoy", "qo'y", "lamb", "kotlet", "chops"],
  chicken: ["tovuq", "chicken", "qanot", "son", "broiler"],
  goat: ["echki", "goat", "curry", "yelka", "shoulder"],
  seafood: ["baliq", "salmon", "losos", "fish", "seafood"],
  bundles: ["toplam", "to'plam", "family", "box", "set"],
};

const STOP_WORDS = new Set(["va", "uchun", "bilan", "the", "a", "to"]);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[ʻ’'`]/g, "")
    .replace(/[^a-z0-9\u0400-\u04ff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token && !STOP_WORDS.has(token));
}

function categoryTerms(category: ManagedProduct["category"]) {
  return CATEGORY_SYNONYMS[category] ?? [];
}

function productSearchTerms(product: ManagedProduct) {
  return [
    product.name,
    product.description,
    product.origin ?? "",
    product.prepTime ?? "",
    ...(product.tags ?? []),
    ...categoryTerms(product.category),
  ]
    .join(" ")
    .trim();
}

function scoreProduct(product: ManagedProduct, tokens: string[], normalizedQuery: string) {
  if (!tokens.length) {
    return 0;
  }

  const normalizedName = normalizeText(product.name);
  const haystack = normalizeText(productSearchTerms(product));
  let score = 0;

  if (normalizedName.includes(normalizedQuery)) {
    score += 24;
  }

  if (haystack.includes(normalizedQuery)) {
    score += 14;
  }

  for (const token of tokens) {
    if (normalizedName.startsWith(token)) {
      score += 10;
    } else if (normalizedName.includes(token)) {
      score += 7;
    }

    if (haystack.includes(token)) {
      score += 4;
    }

    if ((product.tags ?? []).some((tag) => normalizeText(tag).includes(token))) {
      score += 3;
    }

    if (categoryTerms(product.category).some((alias) => normalizeText(alias).includes(token))) {
      score += 3;
    }
  }

  if (product.oldPrice) {
    score += 1;
  }

  if ((product.tags ?? []).includes("Popular")) {
    score += 2;
  }

  return score;
}

export function searchProducts(products: ManagedProduct[], query: string) {
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(query);

  if (!normalizedQuery) {
    return [];
  }

  return products
    .map((product) => ({
      product,
      score: scoreProduct(product, tokens, normalizedQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.product.price - right.product.price;
    })
    .map((entry) => entry.product);
}

export function getSearchSuggestions(products: ManagedProduct[], query: string, limit = 5) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return [];
  }

  const suggestions = new Set<string>();
  const results = searchProducts(products, query);

  for (const product of results) {
    suggestions.add(product.name);
    for (const tag of product.tags ?? []) {
      if (suggestions.size >= limit) {
        break;
      }
      suggestions.add(tag);
    }
    if (suggestions.size >= limit) {
      break;
    }
  }

  for (const product of products) {
    if (suggestions.size >= limit) {
      break;
    }
    if (categoryTerms(product.category).some((term) => normalizeText(term).includes(normalizedQuery))) {
      suggestions.add(product.name);
    }
  }

  return Array.from(suggestions).slice(0, limit);
}

export function getPersonalizedProducts(
  products: ManagedProduct[],
  favorites: string[],
  orders: CustomerOrder[],
  limit = 6,
) {
  const favoriteSet = new Set(favorites);
  const productWeights = new Map<string, number>();

  for (const productId of favorites) {
    productWeights.set(productId, (productWeights.get(productId) ?? 0) + 8);
  }

  for (const order of orders) {
    for (const line of order.items) {
      productWeights.set(line.product.id, (productWeights.get(line.product.id) ?? 0) + 5 + line.quantity);
      productWeights.set(
        `category:${line.product.category}`,
        (productWeights.get(`category:${line.product.category}`) ?? 0) + 4,
      );
    }
  }

  return [...products]
    .map((product) => {
      const directScore = productWeights.get(product.id) ?? 0;
      const categoryScore = productWeights.get(`category:${product.category}`) ?? 0;
      const popularityScore = (product.tags ?? []).includes("Popular") ? 2 : 0;
      const freshnessScore = (product.tags ?? []).includes("Fresh") ? 1 : 0;
      const favoriteBonus = favoriteSet.has(product.id) ? 2 : 0;

      return {
        product,
        score: directScore + categoryScore + popularityScore + freshnessScore + favoriteBonus,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.product.price - right.product.price;
    })
    .slice(0, limit)
    .map((entry) => entry.product);
}
