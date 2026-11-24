import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoomResponse, RoomStatus, RoomType } from '../core/api.models';
import { RoomService } from '../core/room.service';
import { STATUS, TIPOS } from './rotulos';

@Component({
  selector: 'app-salas',
  imports: [RouterLink],
  templateUrl: './salas.html',
  styleUrl: './salas.css',
})
export class Salas {
  private rooms = inject(RoomService);
  readonly tipos = Object.entries(TIPOS) as [RoomType, string][];
  readonly statuses = Object.entries(STATUS) as [RoomStatus, string][];
  readonly tipoLabel = (t: RoomType) => TIPOS[t];
  readonly statusLabel = (s: RoomStatus) => STATUS[s];

  salas = signal<RoomResponse[]>([]);
  carregando = signal(true);
  tipo = signal<RoomType | ''>('');
  status = signal<RoomStatus | ''>('');

  constructor() {
    this.carregar();
  }

  filtrar(campo: 'tipo' | 'status', valor: string) {
    if (campo === 'tipo') this.tipo.set(valor as RoomType | '');
    else this.status.set(valor as RoomStatus | '');
    this.carregar();
  }

  private carregar() {
    this.carregando.set(true);
    this.rooms
      .list({ type: this.tipo() || undefined, status: this.status() || undefined })
      .subscribe({
        next: (r) => {
          this.salas.set(r);
          this.carregando.set(false);
        },
        // erro já exibido pelo interceptor global
        error: () => this.carregando.set(false),
      });
  }
}
