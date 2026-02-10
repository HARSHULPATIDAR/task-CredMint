import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay } from 'rxjs';
import type {
  CatalogData,
  CatalogOverrides,
  Category,
  CategoryId,
  Product,
} from '../models/catalog.models';

const OVERRIDES_KEY = 'credmint_catalog_overrides_v1';

function safeParseOverrides(raw: string | null): CatalogOverrides {
  if (!raw) return { categories: [], products: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      categories: Array.isArray(parsed?.categories) ? parsed.categories : [],
      products: Array.isArray(parsed?.products) ? parsed.products : [],
      deletedCategoryIds: Array.isArray(parsed?.deletedCategoryIds) ? parsed.deletedCategoryIds : [],
      deletedProductIds: Array.isArray(parsed?.deletedProductIds) ? parsed.deletedProductIds : [],
    };
  } catch {
    return { categories: [], products: [] };
  }
}

function mergeCatalog(base: CatalogData, overrides: CatalogOverrides): CatalogData {
  const deletedCat = new Set<CategoryId>(overrides.deletedCategoryIds ?? []);
  const deletedProd = new Set<string>(overrides.deletedProductIds ?? []);

  const catById = new Map<CategoryId, Category>();
  for (const c of base.categories ?? []) if (!deletedCat.has(c.id)) catById.set(c.id, c);
  for (const c of overrides.categories ?? []) if (!deletedCat.has(c.id)) catById.set(c.id, c);
  const categories = [...catById.values()];

  const prodById = new Map<string, Product>();
  for (const p of base.products ?? [])
    if (!deletedProd.has(p.id) && !deletedCat.has(p.categoryId)) prodById.set(p.id, p);
  for (const p of overrides.products ?? [])
    if (!deletedProd.has(p.id) && !deletedCat.has(p.categoryId)) prodById.set(p.id, p);
  const products = [...prodById.values()];

  return { categories, products };
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly base$ = this.http
    .get<CatalogData>('assets/catalog.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  private readonly overridesSubject = new BehaviorSubject<CatalogOverrides>(
    safeParseOverrides(localStorage.getItem(OVERRIDES_KEY)),
  );

  private readonly data$ = combineLatest([this.base$, this.overridesSubject]).pipe(
    map(([base, overrides]) => mergeCatalog(base, overrides)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(private readonly http: HttpClient) {}

  getCatalog$(): Observable<CatalogData> {
    return this.data$;
  }

  getCategories$(): Observable<Category[]> {
    return this.data$.pipe(map((d) => d.categories ?? []));
  }

  getProducts$(): Observable<Product[]> {
    return this.data$.pipe(map((d) => d.products ?? []));
  }

  getOverridesSnapshot(): CatalogOverrides {
    return this.overridesSubject.value;
  }

  setOverrides(next: CatalogOverrides) {
    const safe: CatalogOverrides = {
      categories: Array.isArray(next?.categories) ? next.categories : [],
      products: Array.isArray(next?.products) ? next.products : [],
      deletedCategoryIds: Array.isArray(next?.deletedCategoryIds) ? next.deletedCategoryIds : [],
      deletedProductIds: Array.isArray(next?.deletedProductIds) ? next.deletedProductIds : [],
    };
    this.overridesSubject.next(safe);
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(safe));
  }
}

