import { Component } from '@angular/core';
import type { CatalogOverrides, Category, Product } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';

function slugify(input: string): string {
  return (input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent {
  tab: 'categories' | 'products' | 'export' = 'categories';

  overrides: CatalogOverrides = this.catalog.getOverridesSnapshot();

  newCategoryName = '';
  newCategoryId = '';

  productDraft: Partial<Product> = {
    id: '',
    title: '',
    subtitle: '',
    categoryId: 'technology',
    price: 0,
    compareAtPrice: undefined,
    badge: '',
    vendor: '',
    image: 'images/placeholder-1x1.svg',
    promoFeatured: false,
    promoSold: 700,
    promoStock: 300,
    promoEndsAt: '',
  };

  importText = '';

  constructor(private readonly catalog: CatalogService) {}

  save() {
    this.catalog.setOverrides(this.overrides);
  }

  // Categories
  addCategory() {
    const name = (this.newCategoryName ?? '').trim();
    if (!name) return;
    const id = (this.newCategoryId ?? '').trim() || slugify(name);
    if (!id) return;
    const exists = this.overrides.categories.some((c) => c.id === id);
    if (exists) return;
    this.overrides.categories = [...this.overrides.categories, { id, name }];
    this.newCategoryName = '';
    this.newCategoryId = '';
    this.save();
  }

  deleteCategory(id: string) {
    this.overrides.deletedCategoryIds = Array.from(
      new Set([...(this.overrides.deletedCategoryIds ?? []), id]),
    );
    this.overrides.categories = this.overrides.categories.filter((c) => c.id !== id);
    // also delete products mapped to that category in overrides list
    this.overrides.products = this.overrides.products.filter((p) => p.categoryId !== id);
    this.save();
  }

  undeleteCategory(id: string) {
    this.overrides.deletedCategoryIds = (this.overrides.deletedCategoryIds ?? []).filter(
      (x) => x !== id,
    );
    this.save();
  }

  // Products
  upsertProduct() {
    const p = this.normalizeDraft(this.productDraft);
    if (!p) return;
    const idx = this.overrides.products.findIndex((x) => x.id === p.id);
    if (idx >= 0) {
      const next = [...this.overrides.products];
      next[idx] = p;
      this.overrides.products = next;
    } else {
      this.overrides.products = [...this.overrides.products, p];
    }
    this.overrides.deletedProductIds = (this.overrides.deletedProductIds ?? []).filter(
      (x) => x !== p.id,
    );
    this.productDraft = {
      id: '',
      title: '',
      subtitle: '',
      categoryId: p.categoryId,
      price: 0,
      compareAtPrice: undefined,
      badge: '',
      vendor: '',
      image: 'images/placeholder-1x1.svg',
      promoFeatured: false,
      promoSold: 700,
      promoStock: 300,
      promoEndsAt: '',
    };
    this.save();
  }

  editProduct(p: Product) {
    this.tab = 'products';
    this.productDraft = { ...p };
  }

  deleteProduct(id: string) {
    this.overrides.deletedProductIds = Array.from(
      new Set([...(this.overrides.deletedProductIds ?? []), id]),
    );
    this.overrides.products = this.overrides.products.filter((p) => p.id !== id);
    this.save();
  }

  undeleteProduct(id: string) {
    this.overrides.deletedProductIds = (this.overrides.deletedProductIds ?? []).filter(
      (x) => x !== id,
    );
    this.save();
  }

  async onPickImage(ev: Event) {
    const input = ev.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    const dataUrl = await this.fileToDataUrl(file);
    this.productDraft.image = dataUrl;
  }

  // Export/Import
  exportOverrides(): string {
    return JSON.stringify(this.overrides, null, 2);
  }

  importOverrides() {
    const raw = (this.importText ?? '').trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      this.overrides = {
        categories: Array.isArray(parsed?.categories) ? parsed.categories : [],
        products: Array.isArray(parsed?.products) ? parsed.products : [],
        deletedCategoryIds: Array.isArray(parsed?.deletedCategoryIds) ? parsed.deletedCategoryIds : [],
        deletedProductIds: Array.isArray(parsed?.deletedProductIds) ? parsed.deletedProductIds : [],
      };
      this.save();
    } catch {
      // ignore invalid JSON
    }
  }

  private normalizeDraft(d: Partial<Product>): Product | null {
    const title = (d.title ?? '').trim();
    const categoryId = String(d.categoryId ?? '').trim();
    const id = (d.id ?? '').trim() || slugify(title);
    const price = Number(d.price ?? 0);
    const image = (d.image ?? '').trim();
    if (!title || !categoryId || !id || !Number.isFinite(price) || price < 0 || !image) return null;
    const compareAtPriceRaw = d.compareAtPrice;
    const compareAtPrice =
      compareAtPriceRaw === undefined || compareAtPriceRaw === null || compareAtPriceRaw === ('' as any)
        ? undefined
        : Number(compareAtPriceRaw);
    return {
      id,
      title,
      subtitle: (d.subtitle ?? '').trim() || undefined,
      categoryId,
      price,
      compareAtPrice: Number.isFinite(compareAtPrice ?? NaN) ? compareAtPrice : undefined,
      badge: (d.badge ?? '').trim() || undefined,
      vendor: (d.vendor ?? '').trim() || undefined,
      image,
      promoFeatured: Boolean(d.promoFeatured),
      promoSold: Number.isFinite(Number(d.promoSold)) ? Number(d.promoSold) : undefined,
      promoStock: Number.isFinite(Number(d.promoStock)) ? Number(d.promoStock) : undefined,
      promoEndsAt: (d.promoEndsAt ?? '').trim() || undefined,
    };
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.readAsDataURL(file);
    });
  }

  // Helpers for template
  get deletedCategoryIds(): string[] {
    return this.overrides.deletedCategoryIds ?? [];
  }
  get deletedProductIds(): string[] {
    return this.overrides.deletedProductIds ?? [];
  }

  trackById(_: number, x: { id: string }) {
    return x.id;
  }

  asCategoryId(id: string) {
    return id;
  }

  get categories(): Category[] {
    return this.overrides.categories ?? [];
  }
  get products(): Product[] {
    return this.overrides.products ?? [];
  }
}

