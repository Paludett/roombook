import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AvailabilityBlock,
  BookingResponse,
  ProblemDetail,
  ProfessionalResponse,
  RoomResponse,
} from '../core/api.models';
import { BookingService } from '../core/booking.service';
import { ErrorService } from '../core/error.service';
import { Icon } from '../core/icon';
import { ProfessionalService } from '../core/professional.service';
import { RoomService } from '../core/room.service';
import { ToastService } from '../core/toast.service';
import {
  dataClinica,
  dataCurta,
  dataLonga,
  dividir,
  hora,
  Linha,
  montarLinhas,
  somaDias,
} from './agenda-util';
import { STATUS, STATUS_ICON, TIPO_ICON, TIPOS } from './rotulos';

const BADGE = { ATIVA: 'badge--ok', EM_MANUTENCAO: 'badge--warn', INATIVA: 'badge--inactive' };
// campo do ProblemDetail.errors[] → controle do formulário
const CAMPO: Record<string, 'professionalId' | 'inicio' | 'fim' | 'purpose'> = {
  professionalId: 'professionalId',
  startTime: 'inicio',
  endTime: 'fim',
  purpose: 'purpose',
};

const naoVazio = (c: { value: string }): ValidationErrors | null =>
  c.value && !c.value.trim() ? { required: true } : null;

@Component({
  selector: 'app-agenda',
  imports: [RouterLink, ReactiveFormsModule, Icon],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css',
})
export class Agenda {
  private rooms = inject(RoomService);
  private bookings = inject(BookingService);
  private professionals = inject(ProfessionalService);
  private errors = inject(ErrorService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private snap = inject(ActivatedRoute).snapshot;
  private roomId = Number(this.snap.paramMap.get('id'));
  private carga = 0;

  readonly hora = hora;
  readonly badge = BADGE;
  readonly tipos = TIPOS;
  readonly statuses = STATUS;
  readonly tipoIcon = TIPO_ICON;
  readonly statusIcon = STATUS_ICON;
  readonly esqueletos = [1, 2, 3, 4, 5, 6];

  sala = signal<RoomResponse | null>(null);
  /** Data inicial: ?data=AAAA-MM-DD (link direto) ou hoje no fuso da clínica. */
  data = signal(
    /^\d{4}-\d{2}-\d{2}$/.test(this.snap.queryParamMap.get('data') ?? '')
      ? this.snap.queryParamMap.get('data')!
      : dataClinica(),
  );
  blocks = signal<AvailabilityBlock[]>([]);
  reservas = signal<BookingResponse[]>([]);
  agora = signal(Date.now());
  carregando = signal(true);
  falhou = signal(false);
  /** Intervalo selecionado [a, b] em índices de `blocks`. */
  sel = signal<[number, number] | null>(null);
  aberto = signal(false);
  enviando = signal(false);
  erroModal = signal<string | null>(null);
  profissionais = signal<ProfessionalResponse[]>([]);

  agoraHora = computed(() => hora(new Date(this.agora())));
  hoje = computed(() => this.data() === dataClinica(new Date(this.agora())));
  dataLabel = computed(() => dataLonga(this.data()));
  dataBotao = computed(() => dataCurta(this.data(), this.hoje()));
  dataBotaoCurta = computed(() => this.dataBotao().replace(/ \d{4}$/, ''));
  salaFora = computed(() => !!this.sala() && this.sala()!.status !== 'ATIVA');
  colunas = computed(() => {
    const l = montarLinhas(this.blocks(), this.reservas());
    return dividir(l).map((linhas) => ({
      linhas,
      legenda: `${hora(linhas[0].start)} – ${hora(linhas[linhas.length - 1].end)}`,
    }));
  });
  /** Blocos livres contíguos ao redor da seleção (fixado ao abrir o formulário): limites de início/fim. */
  corrida = signal<AvailabilityBlock[]>([]);
  resumoSel = computed(() => {
    const s = this.sel();
    if (!s) return null;
    const b = this.blocks();
    const min = (s[1] - s[0] + 1) * 30;
    const dur =
      min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ' ' + (min % 60) : ''}`;
    return {
      faixa: `${hora(b[s[0]].start)}–${hora(b[s[1]].end)}`,
      dur,
      ate: this.bloqueioAte(b[s[1]].end),
    };
  });

  form = this.fb.nonNullable.group(
    {
      professionalId: this.fb.control<number | null>(null, Validators.required),
      inicio: ['', Validators.required],
      fim: ['', Validators.required],
      purpose: ['', [Validators.required, Validators.maxLength(255), naoVazio]],
    },
    {
      validators: (g) => {
        const { inicio, fim } = g.value;
        return inicio && fim && new Date(fim) <= new Date(inicio) ? { ordem: true } : null;
      },
    },
  );
  formValor = signal(this.form.getRawValue());
  rotuloReservar = computed(() => {
    const v = this.formValor();
    return v.inicio && v.fim && new Date(v.fim) > new Date(v.inicio)
      ? `Reservar ${hora(v.inicio)}–${hora(v.fim)}`
      : 'Reservar';
  });
  noteAte = computed(() => {
    const v = this.formValor();
    return v.fim && new Date(v.fim) > new Date(v.inicio || 0) ? this.bloqueioAte(v.fim) : null;
  });

  constructor() {
    this.rooms.get(this.roomId).subscribe({ next: (s) => this.sala.set(s) });
    this.form.valueChanges.subscribe(() => this.formValor.set(this.form.getRawValue()));
    this.carregar();
  }

  private bloqueioAte(fimIso: string): string | null {
    const min = this.sala()?.sanitizationMinutes ?? 0;
    return min ? hora(new Date(new Date(fimIso).getTime() + min * 60000)) : null;
  }

  mudarData(valor: string) {
    if (!valor || valor === this.data()) return;
    this.data.set(valor);
    this.carregar();
  }
  deslocar(dias: number) {
    this.mudarData(somaDias(this.data(), dias));
  }
  escolherData(input: HTMLInputElement) {
    input.showPicker();
  }
  irHoje() {
    this.mudarData(dataClinica());
  }

  carregar() {
    const n = ++this.carga;
    this.carregando.set(true);
    this.falhou.set(false);
    this.sel.set(null);
    forkJoin({
      disp: this.rooms.availability(this.roomId, this.data()),
      res: this.bookings.listConfirmed(this.roomId, this.data()),
    }).subscribe({
      next: ({ disp, res }) => {
        if (n !== this.carga) return;
        this.blocks.set(disp.blocks);
        this.reservas.set(res.content);
        this.agora.set(Date.now());
        this.carregando.set(false);
      },
      // erro já exibido pelo interceptor global
      error: () => {
        if (n !== this.carga) return;
        this.falhou.set(true);
        this.carregando.set(false);
      },
    });
  }

  private idx(l: Linha) {
    return this.blocks().findIndex((b) => b.start === l.start);
  }
  selecionada(l: Linha) {
    const s = this.sel();
    const i = this.idx(l);
    return !!s && i >= s[0] && i <= s[1];
  }
  agoraEm(l: Linha) {
    const t = this.agora();
    return this.hoje() && t >= new Date(l.start).getTime() && t < new Date(l.end).getTime();
  }

  alternar(l: Linha) {
    const i = this.idx(l);
    const s = this.sel();
    if (s && i >= s[0] && i <= s[1]) {
      if (s[0] === s[1]) this.sel.set(null);
      else if (i === s[0]) this.sel.set([s[0] + 1, s[1]]);
      else if (i === s[1]) this.sel.set([s[0], s[1] - 1]);
      else this.sel.set([i, i]);
    } else if (s && i === s[1] + 1) this.sel.set([s[0], i]);
    else if (s && i === s[0] - 1) this.sel.set([i, s[1]]);
    else this.sel.set([i, i]);
  }
  limpar() {
    this.sel.set(null);
  }

  abrir() {
    const s = this.sel();
    if (!s) return;
    const b = this.blocks();
    let i = s[0];
    let j = s[1];
    while (i > 0 && b[i - 1].state === 'FREE') i--;
    while (j < b.length - 1 && b[j + 1].state === 'FREE') j++;
    this.corrida.set(b.slice(i, j + 1));
    this.form.reset({
      professionalId: null,
      inicio: b[s[0]].start,
      fim: b[s[1]].end,
      purpose: '',
    });
    this.erroModal.set(null);
    this.aberto.set(true);
    if (!this.profissionais().length) {
      this.professionals.list().subscribe({ next: (l) => this.profissionais.set(l) });
    }
    setTimeout(() => document.getElementById('prof')?.focus());
  }
  fechar() {
    if (this.enviando()) return;
    this.aberto.set(false);
  }

  invalido(c: 'professionalId' | 'inicio' | 'fim' | 'purpose') {
    const ctl = this.form.controls[c];
    return ctl.touched && (ctl.invalid || (c === 'fim' && this.form.hasError('ordem')));
  }
  mensagem(c: 'professionalId' | 'inicio' | 'fim' | 'purpose'): string {
    const e = this.form.controls[c].errors;
    if (e?.['server']) return e['server'];
    if (e?.['maxlength']) return 'Use no máximo 255 caracteres';
    if (e?.['required'])
      return c === 'professionalId' ? 'Escolha o profissional' : 'Campo obrigatório';
    if (c === 'fim' && this.form.hasError('ordem')) return 'O fim deve ser depois do início';
    return '';
  }

  reservar() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.enviando()) return;
    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.erroModal.set(null);
    this.bookings
      .create({
        roomId: this.roomId,
        professionalId: v.professionalId!,
        startTime: v.inicio,
        endTime: v.fim,
        purpose: v.purpose.trim(),
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.aberto.set(false);
          this.toast.show(`Reserva confirmada: ${hora(v.inicio)}–${hora(v.fim)}`);
          this.carregar();
        },
        error: (err: HttpErrorResponse) => {
          this.enviando.set(false);
          // o erro aparece dentro do formulário, não na faixa global
          this.errors.clear();
          const p = err.error as ProblemDetail | null;
          let restante = false;
          for (const e of p?.errors ?? []) {
            const ctl = CAMPO[e.field] && this.form.controls[CAMPO[e.field]];
            if (ctl) {
              ctl.setErrors({ server: e.message });
              ctl.markAsTouched();
            } else restante = true;
          }
          if (!p?.errors?.length || restante) {
            this.erroModal.set(
              p?.detail ??
                (err.status === 0
                  ? 'Não foi possível conectar ao servidor.'
                  : `Erro inesperado (${err.status}).`),
            );
          }
          // conflito: a grade na tela está desatualizada
          if (err.status === 409) this.recarregarSemFechar();
        },
      });
  }

  private recarregarSemFechar() {
    forkJoin({
      disp: this.rooms.availability(this.roomId, this.data()),
      res: this.bookings.listConfirmed(this.roomId, this.data()),
    }).subscribe({
      next: ({ disp, res }) => {
        this.blocks.set(disp.blocks);
        this.reservas.set(res.content);
        this.sel.set(null);
      },
    });
  }
}
