import { Component, inject } from '@angular/core';
import { ErrorService } from './error.service';

@Component({
  selector: 'app-error-banner',
  template: `@if (errors.message(); as msg) {
    <div class="error-banner" role="alert">
      <span>{{ msg }}</span>
      <button type="button" aria-label="Fechar" (click)="errors.clear()">×</button>
    </div>
  }`,
  styles: `
    .error-banner {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #fdecea;
      color: #b3261e;
      border-bottom: 1px solid #f5c2be;
    }
    button {
      background: none;
      border: 0;
      font-size: 1.25rem;
      cursor: pointer;
      color: inherit;
    }
  `,
})
export class ErrorBanner {
  errors = inject(ErrorService);
}
