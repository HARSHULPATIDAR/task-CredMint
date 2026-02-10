import { Component } from '@angular/core';
import { combineLatest, map, Observable, timer } from 'rxjs';
import type { Category, Product } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';
import { CatalogFilterService } from '../../services/catalog-filter.service';
import { CartService } from '../../services/cart.service';

type Section = {
  id: string;
  title: string;
  products: Product[];
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  readonly categories$: Observable<Category[]> = this.catalog.getCategories$();
  readonly products$: Observable<Product[]> = this.catalog.getProducts$();

  readonly filteredProducts$: Observable<Product[]> = combineLatest([
    this.catalog.getProducts$(),
    this.filter.search$,
    this.filter.categoryId$,
  ]).pipe(
    map(([products, search, categoryId]) => {
      const q = (search ?? '').trim().toLowerCase();
      return products.filter((p) => {
        const matchCategory = categoryId === 'all' ? true : p.categoryId === categoryId;
        const matchSearch = !q
          ? true
          : `${p.title} ${p.subtitle ?? ''} ${p.vendor ?? ''}`.toLowerCase().includes(q);
        return matchCategory && matchSearch;
      });
    }),
  );

  readonly promoProducts$: Observable<Product[]> = this.catalog.getProducts$().pipe(
    map((products) =>
      (products
        .filter((p) => p.promoFeatured)
        .sort((a, b) => (a.price ?? 0) - (b.price ?? 0)) ||
        products.filter((p) => (p.badge ?? '').includes('%'))).slice(0, 3),
    ),
  );

  readonly categorySections$: Observable<Section[]> = this.catalog.getCatalog$().pipe(
    map(({ categories, products }) => {
      const order = ['technology', 'watch', 'cosmetic', 'real_estate', 'food'];
      const byId = new Map(categories.map((c) => [c.id, c]));
      const make = (id: string): Section | null => {
        const cat = byId.get(id);
        if (!cat) return null;
        const prods = products.filter((p) => p.categoryId === id).slice(0, 5);
        return { id, title: cat.name, products: prods };
      };
      const ordered = order.map(make).filter((x): x is Section => x !== null);
      const remaining = categories
        .filter((c) => !order.includes(c.id))
        .map((c) => ({
          id: c.id,
          title: c.name,
          products: products.filter((p) => p.categoryId === c.id).slice(0, 5),
        }));
      return [...ordered, ...remaining].filter((s) => s.products.length > 0);
    }),
  );

  constructor(
    private readonly catalog: CatalogService,
    public readonly filter: CatalogFilterService,
    private readonly cart: CartService,
  ) {}

  promoIndex = 0;
  readonly now$ = timer(0, 1000).pipe(map(() => Date.now()));

  addToCart(productId: string) {
    this.cart.add(productId, 1);
  }

  pickCategory(categoryId: string) {
    this.filter.setCategoryId(categoryId);
  }

  setPromoIndex(delta: number, list: Product[]) {
    if (!list || list.length === 0) {
      this.promoIndex = 0;
      return;
    }
    const len = list.length;
    this.promoIndex = ((this.promoIndex + delta) % len + len) % len;
  }

  currentPromo(list: Product[]): Product | null {
    if (!list || list.length === 0) return null;
    const idx = Math.min(Math.max(this.promoIndex, 0), list.length - 1);
    return list[idx];
  }

  getCountdown(item: Product | null, now: number | null | undefined) {
    if (!item?.promoEndsAt || !now) {
      return { days: '000', hours: '00', mins: '00', secs: '00' };
    }
    const end = Date.parse(item.promoEndsAt);
    if (!Number.isFinite(end) || end <= now) {
      return { days: '000', hours: '00', mins: '00', secs: '00' };
    }
    let diff = Math.floor((end - now) / 1000);
    const days = Math.floor(diff / 86400);
    diff -= days * 86400;
    const hours = Math.floor(diff / 3600);
    diff -= hours * 3600;
    const mins = Math.floor(diff / 60);
    const secs = diff - mins * 60;
    const pad = (n: number, l: number) => n.toString().padStart(l, '0');
    return {
      days: pad(days, 3),
      hours: pad(hours, 2),
      mins: pad(mins, 2),
      secs: pad(secs, 2),
    };
  }
}

