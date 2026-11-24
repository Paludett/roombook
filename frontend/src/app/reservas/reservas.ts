import { Component, computed, inject, signal } from '@angular/core';
import {
  BookingResponse,
  BookingStatus,
  ProfessionalResponse,
  RoomResponse,
} from '../core/api.models';
import { BookingService } from '../core/booking.service';
import { Icon } from '../core/icon';
import { Modal } from '../core/modal';
import { ProfessionalService } from '../core/professional.service';
import { RoomService } from '../core/room.service';
import { ToastService } from '../core/toast.service';
import { dataClinica, hora } from '../salas/agenda-util';

const TAMANHO = 10;
const dm = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7);

@Component({
  selector: 'app-reservas',
  imports: [Icon, Modal],
  templateUrl: './reservas.html',
  styleUrl: './reservas.css',
})
export class Reservas {
  private api = inject(BookingService);
  private salasApi = inject(RoomService);
  private profApi = inject(ProfessionalService);
  private toast = inject(ToastService);
  readonly esqueletos = [1, 2, 3, 4, 5];
  readonly statuses: { v: BookingStatus | ''; r: string }[] = [
    { v: '', r: 'Todos' },
    { v: 'CONFIRMED', r: 'Confirmada' },
    { v: 'CANCELLED', r: 'Cancelada' },
  ];

  salas = signal<RoomResponse[]>([]);
  profissionais = signal<ProfessionalResponse[]>([]);
  salaId = signal(0);
  profId = signal(0);
  data = signal('');
  status = signal<BookingStatus | ''>('');
  pagina = signal(0);
  filtrosAbertos = signal(false);

  itens = signal<BookingResponse[]>([]);
  total = signal(0);
  totalPaginas = signal(0);
  carregando = signal(true);
  falhou = signal(false);
  /** Reserva aguardando confirmação de cancelamento. */
  alvo = signal<BookingResponse | null>(null);
  cancelando = signal(false);

  nFiltros = computed(
    () => [this.salaId(), this.profId(), this.data(), this.status()].filter(Boolean).length,
  );
  contagem = computed(() => {
    const n = this.total();
    return `${n} ${n === 1 ? 'reserva' : 'reservas'}`;
  });

  constructor() {
    this.salasApi.list().subscribe((l) => this.salas.set(l));
    this.profApi
      .list()
      .subscribe((l) =>
        this.profissionais.set([...l].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))),
      );
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.falhou.set(false);
    this.api
      .list({
        roomId: this.salaId() || undefined,
        professionalId: this.profId() || undefined,
        date: this.data() || undefined,
        status: this.status() || undefined,
        page: this.pagina(),
        size: TAMANHO,
        sort: 'startTime,desc',
      })
      .subscribe({
        next: (p) => {
          this.itens.set(p.content);
          this.total.set(p.page.totalElements);
          this.totalPaginas.set(p.page.totalPages);
          this.carregando.set(false);
        },
        error: () => {
          this.falhou.set(true);
          this.carregando.set(false);
        },
      });
  }

  filtrar(k: 'sala' | 'prof' | 'data' | 'status', v: string) {
    if (k === 'sala') this.salaId.set(+v);
    else if (k === 'prof') this.profId.set(+v);
    else if (k === 'data') this.data.set(v);
    else this.status.set(v as BookingStatus | '');
    this.pagina.set(0);
    this.carregar();
  }

  limpar() {
    this.salaId.set(0);
    this.profId.set(0);
    this.data.set('');
    this.status.set('');
    this.pagina.set(0);
    this.carregar();
  }

  ir(p: number) {
    this.pagina.set(p);
    this.carregar();
  }

  // ---- formatação (fuso da clínica) ----
  dia = (r: BookingResponse) => {
    const d = dataClinica(new Date(r.startTime));
    return `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
  };
  horario = (r: BookingResponse) => `${hora(r.startTime)}–${hora(r.endTime)}`;
  diaCurto = (r: BookingResponse) => dm(dataClinica(new Date(r.startTime)));

  /** Cancelável: CONFIRMED e início no futuro (mesma regra da API). */
  podeCancelar = (r: BookingResponse) =>
    r.status === 'CONFIRMED' && new Date(r.startTime).getTime() > Date.now();
  /** Texto no lugar do botão quando não dá para cancelar. */
  motivo(r: BookingResponse): string {
    if (r.status === 'CANCELLED') return 'Cancelada';
    return new Date(r.endTime).getTime() > Date.now() ? 'Em andamento' : 'Encerrada';
  }

  pedir(r: BookingResponse) {
    this.alvo.set(r);
  }
  fechar() {
    if (!this.cancelando()) this.alvo.set(null);
  }

  confirmar() {
    const r = this.alvo();
    if (!r || this.cancelando()) return;
    this.cancelando.set(true);
    this.api.cancel(r.id).subscribe({
      next: () => {
        this.cancelando.set(false);
        this.alvo.set(null);
        this.toast.show('Reserva cancelada');
        this.carregar();
      },
      error: () => {
        // faixa de erro global (interceptor) mostra a mensagem da API
        this.cancelando.set(false);
        this.alvo.set(null);
        this.carregar();
      },
    });
  }
}
