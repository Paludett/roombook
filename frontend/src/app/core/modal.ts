import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';
import { Icon } from './icon';

/** Modal genérico: título, conteúdo projetado, rodapé em [footer]. Esc e clique no fundo emitem `closed`. */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  template: `<div class="overlay" (mousedown)="onBackdrop($event)">
    <section class="panel" role="dialog" aria-modal="true" [attr.aria-labelledby]="'modal-title'">
      <div class="panel-head">
        <div>
          <h2 class="h2" id="modal-title">{{ heading() }}</h2>
          @if (subtitle()) {
            <p class="sub">{{ subtitle() }}</p>
          }
        </div>
        <button type="button" class="icon-btn" aria-label="Fechar" (click)="closed.emit()">
          <app-icon name="x" [size]="20" />
        </button>
      </div>
      <div class="panel-body"><ng-content /></div>
      <div class="panel-foot"><ng-content select="[footer]" /></div>
    </section>
  </div>`,
  styleUrl: './modal.css',
})
export class Modal {
  heading = input.required<string>();
  subtitle = input('');
  closed = output<void>();
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() =>
      this.el.nativeElement.querySelector<HTMLElement>('input,select,textarea,button')?.focus(),
    );
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.closed.emit();
  }
  onBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) this.closed.emit();
  }
}
