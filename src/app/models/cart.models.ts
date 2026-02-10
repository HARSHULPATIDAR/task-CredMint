import type { Product } from './catalog.models';

export interface CartLine {
  productId: string;
  qty: number;
}

export interface CartItem {
  product: Product;
  qty: number;
  lineTotal: number;
}

