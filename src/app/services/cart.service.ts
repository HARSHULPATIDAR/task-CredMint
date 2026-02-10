import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import type { CartItem, CartLine } from '../models/cart.models';
import type { Product } from '../models/catalog.models';
import { CatalogService } from './catalog.service';

const STORAGE_KEY = 'credmint_cart_v1';

function safeParseCartLines(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({ productId: String(x?.productId ?? ''), qty: Number(x?.qty ?? 0) }))
      .filter((x) => x.productId && Number.isFinite(x.qty) && x.qty > 0);
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly linesSubject = new BehaviorSubject<CartLine[]>(
    safeParseCartLines(localStorage.getItem(STORAGE_KEY)),
  );

  readonly lines$ = this.linesSubject.asObservable();

  readonly count$ = this.lines$.pipe(map((lines) => lines.reduce((sum, l) => sum + l.qty, 0)));

  readonly items$: Observable<CartItem[]> = combineLatest([
    this.lines$,
    this.catalog.getProducts$(),
  ]).pipe(
    map(([lines, products]) => {
      const byId = new Map<string, Product>(products.map((p) => [p.id, p]));
      return lines
        .map((l) => {
          const product = byId.get(l.productId);
          if (!product) return null;
          return { product, qty: l.qty, lineTotal: product.price * l.qty } satisfies CartItem;
        })
        .filter((x): x is CartItem => x !== null);
    }),
  );

  readonly subtotal$: Observable<number> = this.items$.pipe(
    map((items) => items.reduce((sum, it) => sum + it.lineTotal, 0)),
  );

  constructor(private readonly catalog: CatalogService) {}

  add(productId: string, qty = 1) {
    const addQty = Math.max(1, Math.floor(qty));
    const next = [...this.linesSubject.value];
    const idx = next.findIndex((l) => l.productId === productId);
    if (idx >= 0) next[idx] = { productId, qty: next[idx].qty + addQty };
    else next.push({ productId, qty: addQty });
    this.setLines(next);
  }

  remove(productId: string) {
    this.setLines(this.linesSubject.value.filter((l) => l.productId !== productId));
  }

  setQty(productId: string, qty: number) {
    const nextQty = Math.max(0, Math.floor(qty));
    if (nextQty === 0) return this.remove(productId);
    const next = [...this.linesSubject.value];
    const idx = next.findIndex((l) => l.productId === productId);
    if (idx >= 0) next[idx] = { productId, qty: nextQty };
    else next.push({ productId, qty: nextQty });
    this.setLines(next);
  }

  clear() {
    this.setLines([]);
  }

  private setLines(lines: CartLine[]) {
    this.linesSubject.next(lines);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }
}

