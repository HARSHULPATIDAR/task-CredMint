export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  icon?: string; // e.g. "watch", "tech"
}

export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  categoryId: CategoryId;
  price: number;
  compareAtPrice?: number;
  badge?: string; // "New", "-15%", etc.
  vendor?: string;
  image: string; // relative path under /assets OR data URL
  // Promo metadata (optional)
  promoFeatured?: boolean;
  promoSold?: number;
  promoStock?: number;
  promoEndsAt?: string; // ISO string used for countdown
}

export interface CatalogData {
  categories: Category[];
  products: Product[];
}

export interface CatalogOverrides {
  categories: Category[];
  products: Product[];
  deletedCategoryIds?: CategoryId[];
  deletedProductIds?: string[];
}

