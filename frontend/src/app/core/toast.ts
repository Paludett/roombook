import { Component, inject } from '@angular/core';
import { Icon } from './icon';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  imports: [Icon],
  template: `<div class="toast-area">
    @for (t of toasts.toasts(); track t.id) {
      <div
        class="toast"
        role="status"
        (mouseenter)="toasts.pause(t.id)"
        (mouseleave)="toasts.resume(t.id)"
      >
        <app-icon name="check" [size]="20" />
        {{ t.text }}
        <button type="button" class="icon-btn" aria-label="Fechar" (click)="toasts.dismiss(t.id)">
          <app-icon name="x" [size]="18" />
        </button>
      </div>
    }
  </div>`,
})
export class Toast {
  toasts = inject(ToastService);
}
