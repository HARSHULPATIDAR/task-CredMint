import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { Product } from '../../models/catalog.models';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() addToCart = new EventEmitter<string>();

  onAdd() {
    this.addToCart.emit(this.product.id);
  }
}

