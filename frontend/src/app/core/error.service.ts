import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  readonly message = signal<string | null>(null);
  show(msg: string) {
    this.message.set(msg);
  }
  clear() {
    this.message.set(null);
  }
}
