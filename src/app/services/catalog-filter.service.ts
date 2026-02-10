import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogFilterService {
  readonly search$ = new BehaviorSubject<string>('');
  readonly categoryId$ = new BehaviorSubject<string>('all');

  setSearch(value: string) {
    this.search$.next(value ?? '');
  }

  setCategoryId(value: string) {
    this.categoryId$.next(value ?? 'all');
  }

  reset() {
    this.search$.next('');
    this.categoryId$.next('all');
  }
}

