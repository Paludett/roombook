import { Component, inject } from '@angular/core';
import { RoomService } from '../core/room.service';

// Tela de apoio p/ ver o interceptor em ação: cada botão provoca um erro real da API.
@Component({
  selector: 'app-erro-demo',
  template: `<h2>Demo de erros</h2>
    <button (click)="notFound()">404 (sala inexistente)</button>
    <button (click)="invalid()">400 (sala inválida)</button>`,
})
export class ErroDemo {
  private rooms = inject(RoomService);
  notFound() {
    this.rooms.get(999999).subscribe({ error: () => {} });
  }
  invalid() {
    this.rooms
      .create({ name: '', type: 'CONSULTORIO', floorWing: '' })
      .subscribe({ error: () => {} });
  }
}
