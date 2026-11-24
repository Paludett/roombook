import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoomResponse, RoomStatus, RoomType } from '../core/api.models';
import { Icon, IconName } from '../core/icon';
import { RoomService } from '../core/room.service';
import { STATUS, TIPOS } from './rotulos';

const TIPO_ICON: Record<RoomType, IconName> = {
  CONSULTORIO: 'consultorio',
  SALA_EXAME: 'exame',
  SALA_PROCEDIMENTO: 'procedimento',
  SALA_REUNIAO: 'reuniao',
};
const STATUS_ICON: Record<RoomStatus, IconName> = {
  ATIVA: 'check',
  EM_MANUTENCAO: 'wrench',
  INATIVA: 'ban',
};
const BADGE: Record<RoomStatus, string> = {
  ATIVA: 'badge--ok',
  EM_MANUTENCAO: 'badge--warn',
  INATIVA: 'badge--inactive',
};
const VARIANTE: Record<RoomStatus, string> = {
  ATIVA: 'room--ok',
  EM_MANUTENCAO: 'room--maint',
  INATIVA: 'room--inactive',
};

@Component({
  selector: 'app-salas',
  imports: [RouterLink, Icon],
  templateUrl: './salas.html',
  styleUrl: './salas.css',
})
export class Salas {
  private rooms = inject(RoomService);
  readonly tipos = Object.entries(TIPOS) as [RoomType, string][];
  readonly statuses = Object.entries(STATUS) as [RoomStatus, string][];
  readonly tipoIcon = TIPO_ICON;
  readonly statusIcon = STATUS_ICON;
  readonly badge = BADGE;
  readonly variante = (s: RoomStatus) => VARIANTE[s];
  readonly tipoLabel = (t: RoomType) => TIPOS[t];
  readonly statusLabel = (s: RoomStatus) => STATUS[s];
  readonly esqueletos = [1, 2, 3, 4];

  salas = signal<RoomResponse[]>([]);
  carregando = signal(true);
  falhou = signal(false);
  tipo = signal<RoomType | ''>('');
  status = signal<RoomStatus | ''>('');

  /** "6 salas · 1 em manutenção · 1 inativa" (sobre a lista exibida). */
  resumo = computed(() => {
    const l = this.salas();
    if (!l.length) return '';
    const man = l.filter((s) => s.status === 'EM_MANUTENCAO').length;
    const ina = l.filter((s) => s.status === 'INATIVA').length;
    return [
      `${l.length} ${l.length === 1 ? 'sala' : 'salas'}`,
      man && `${man} em manutenção`,
      ina && `${ina} ${ina === 1 ? 'inativa' : 'inativas'}`,
    ]
      .filter(Boolean)
      .join(' · ');
  });

  constructor() {
    this.carregar();
  }

  filtrar(campo: 'tipo' | 'status', valor: string) {
    if (campo === 'tipo') this.tipo.set(valor as RoomType | '');
    else this.status.set(valor as RoomStatus | '');
    this.carregar();
  }

  recarregar() {
    this.carregar();
  }

  limpar() {
    this.tipo.set('');
    this.status.set('');
    this.carregar();
  }

  private carregar() {
    this.carregando.set(true);
    this.falhou.set(false);
    this.rooms
      .list({ type: this.tipo() || undefined, status: this.status() || undefined })
      .subscribe({
        next: (r) => {
          this.salas.set(r);
          this.carregando.set(false);
        },
        // erro já exibido pelo interceptor global
        error: () => {
          this.falhou.set(true);
          this.carregando.set(false);
        },
      });
  }
}
