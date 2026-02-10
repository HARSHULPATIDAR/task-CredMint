import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import type { Category } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';
import { CatalogFilterService } from '../../services/catalog-filter.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  readonly categories$: Observable<Category[]> = this.catalog.getCategories$();
  readonly cartCount$ = this.cart.count$;

  search = '';
  categoryId = 'all';

  constructor(
    private readonly catalog: CatalogService,
    private readonly filter: CatalogFilterService,
    private readonly cart: CartService,
    private readonly router: Router,
  ) {
    this.filter.search$.subscribe((v) => (this.search = v));
    this.filter.categoryId$.subscribe((v) => (this.categoryId = v));
  }

  onSubmitSearch() {
    this.filter.setSearch(this.search);
    this.filter.setCategoryId(this.categoryId);
    void this.router.navigateByUrl('/');
  }

  onPickCategory(categoryId: string) {
    this.filter.setCategoryId(categoryId);
    void this.router.navigateByUrl('/');
  }
}

