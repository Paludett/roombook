import { Component, inject } from '@angular/core';
import { ErrorService } from './error.service';
import { Icon } from './icon';

@Component({
  selector: 'app-error-banner',
  imports: [Icon],
  template: `@if (errors.message(); as msg) {
    <div class="banner-wrap">
      <div class="banner" role="alert">
        <app-icon name="alert" [size]="18" />
        <p>{{ msg }}</p>
        <button type="button" class="icon-btn" aria-label="Fechar aviso" (click)="errors.clear()">
          <app-icon name="x" [size]="18" />
        </button>
      </div>
    </div>
  }`,
})
export class ErrorBanner {
  errors = inject(ErrorService);
}
