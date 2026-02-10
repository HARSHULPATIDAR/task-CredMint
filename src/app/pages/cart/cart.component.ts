import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import type { CartItem } from '../../models/cart.models';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent {
  readonly items$: Observable<CartItem[]> = this.cart.items$;
  readonly subtotal$ = this.cart.subtotal$;

  constructor(private readonly cart: CartService) {}

  dec(productId: string, qty: number) {
    this.cart.setQty(productId, qty - 1);
  }

  inc(productId: string, qty: number) {
    this.cart.setQty(productId, qty + 1);
  }

  setQty(productId: string, value: string) {
    const n = Number(value);
    this.cart.setQty(productId, Number.isFinite(n) ? n : 1);
  }

  remove(productId: string) {
    this.cart.remove(productId);
  }

  clear() {
    this.cart.clear();
  }
}

