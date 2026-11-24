import { Injectable, signal } from '@angular/core';

export interface ToastMsg {
  id: number;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMsg[]>([]);
  private seq = 0;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  /** Toast de sucesso; some em 5 s e fica parado enquanto o mouse estiver em cima (pause/resume). */
  show(text: string): void {
    const id = ++this.seq;
    this.toasts.update((l) => [...l, { id, text }]);
    this.resume(id);
  }
  dismiss(id: number): void {
    this.pause(id);
    this.toasts.update((l) => l.filter((t) => t.id !== id));
  }
  pause(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
  }
  resume(id: number): void {
    this.pause(id);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), 5000),
    );
  }
}
