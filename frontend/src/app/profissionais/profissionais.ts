import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProblemDetail, ProfessionalRequest, ProfessionalResponse } from '../core/api.models';
import { ErrorService } from '../core/error.service';
import { Icon } from '../core/icon';
import { Modal } from '../core/modal';
import { ProfessionalService } from '../core/professional.service';
import { ToastService } from '../core/toast.service';

type Campo = keyof ProfessionalRequest;
const CAMPOS: Campo[] = ['name', 'licenseNumber', 'specialty', 'email'];
/** "CRM-RS 12345": sigla do conselho, UF opcional e número. */
export const REGISTRO = /^[A-Za-z]{2,6}(-[A-Za-z]{2})? \d{1,10}$/;

@Component({
  selector: 'app-profissionais',
  imports: [ReactiveFormsModule, Icon, Modal],
  templateUrl: './profissionais.html',
  styleUrl: './profissionais.css',
})
export class Profissionais {
  private api = inject(ProfessionalService);
  private toast = inject(ToastService);
  private erros = inject(ErrorService);
  private fb = inject(FormBuilder);
  readonly esqueletos = [1, 2, 3, 4];
  readonly campos: { k: Campo; rotulo: string; ph: string }[] = [
    { k: 'name', rotulo: 'Nome', ph: 'Ex.: Dra. Ana Souza' },
    { k: 'licenseNumber', rotulo: 'Registro profissional', ph: 'Ex.: CRM-RS 12345' },
    { k: 'specialty', rotulo: 'Especialidade', ph: 'Ex.: Cardiologia' },
    { k: 'email', rotulo: 'E-mail', ph: 'nome@hospital.org' },
  ];

  lista = signal<ProfessionalResponse[]>([]);
  carregando = signal(true);
  falhou = signal(false);
  busca = signal('');
  /** null = fechado; 'novo' ou o profissional em edição. */
  aberto = signal<'novo' | ProfessionalResponse | null>(null);
  salvando = signal(false);
  tentou = signal(false);
  servidor = signal<Partial<Record<Campo, string>>>({});

  contagem = computed(() => {
    const n = this.lista().length;
    return `${n} ${n === 1 ? 'profissional' : 'profissionais'}`;
  });

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    licenseNumber: ['', [Validators.required, Validators.pattern(REGISTRO)]],
    specialty: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
  });

  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.carregar();
  }

  iniciais(nome: string) {
    const p = nome
      .replace(/^(dra?|prof)\.?\s+/i, '')
      .split(/\s+/)
      .filter(Boolean);
    return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  /** Busca por nome e especialidade com o mesmo texto; mescla as duas consultas. */
  buscar(texto: string) {
    this.busca.set(texto);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.carregar(), 300);
  }

  carregar() {
    const q = this.busca().trim();
    this.carregando.set(true);
    this.falhou.set(false);
    const done = (l: ProfessionalResponse[]) => {
      this.lista.set(l);
      this.carregando.set(false);
    };
    const fail = () => {
      this.falhou.set(true);
      this.carregando.set(false);
    };
    if (!q) {
      this.api.list().subscribe({ next: done, error: fail });
      return;
    }
    // API filtra por AND; "nome OU especialidade" = união de duas consultas
    let porNome: ProfessionalResponse[] | null = null;
    const juntar = (a: ProfessionalResponse[], b: ProfessionalResponse[]) => {
      const m = new Map([...a, ...b].map((p) => [p.id, p]));
      done([...m.values()].sort((x, y) => x.name.localeCompare(y.name, 'pt-BR')));
    };
    this.api.list({ name: q }).subscribe({
      next: (a) => {
        porNome = a;
        this.api
          .list({ specialty: q })
          .subscribe({ next: (b) => juntar(porNome!, b), error: fail });
      },
      error: fail,
    });
  }

  abrir(p?: ProfessionalResponse) {
    this.form.reset({
      name: p?.name ?? '',
      licenseNumber: p?.licenseNumber ?? '',
      specialty: p?.specialty ?? '',
      email: p?.email ?? '',
    });
    this.servidor.set({});
    this.tentou.set(false);
    this.aberto.set(p ?? 'novo');
  }

  fechar() {
    this.aberto.set(null);
  }

  /** Mensagem do campo: erro do servidor ou da validação do cliente (após tentar salvar ou tocar). */
  erro(c: Campo): string | null {
    const s = this.servidor()[c];
    if (s) return s;
    const ctl = this.form.controls[c];
    if (!ctl.errors || !(this.tentou() || ctl.touched)) return null;
    if (ctl.errors['required']) return 'Campo obrigatório';
    if (ctl.errors['email']) return 'E-mail inválido';
    if (ctl.errors['pattern']) return 'Formato inválido. Ex.: CRM-RS 12345';
    if (ctl.errors['maxlength']) return 'Texto muito longo';
    return 'Valor inválido';
  }

  limparServidor(c: Campo) {
    if (this.servidor()[c]) this.servidor.update(({ [c]: _, ...resto }) => resto);
  }

  salvar() {
    this.tentou.set(true);
    if (this.form.invalid || this.salvando()) return;
    const req = this.form.getRawValue();
    const alvo = this.aberto();
    const edicao = alvo && alvo !== 'novo' ? alvo : null;
    this.salvando.set(true);
    const call = edicao ? this.api.update(edicao.id, req) : this.api.create(req);
    call.subscribe({
      next: () => {
        this.salvando.set(false);
        this.fechar();
        this.toast.show(edicao ? 'Profissional atualizado' : 'Profissional cadastrado');
        this.carregar();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.mostrarErro(e);
      },
    });
  }

  /** 400 com errors[] e 409 viram erro no campo; o aviso global do interceptor é dispensado. */
  private mostrarErro(e: HttpErrorResponse) {
    const p = e.error as ProblemDetail | null;
    const out: Partial<Record<Campo, string>> = {};
    if (e.status === 400) {
      for (const f of p?.errors ?? [])
        if (CAMPOS.includes(f.field as Campo)) out[f.field as Campo] = f.message;
    } else if (e.status === 409) {
      const d = p?.detail ?? 'Já cadastrado';
      out[/e-?mail/i.test(d) ? 'email' : 'licenseNumber'] = d;
    }
    if (Object.keys(out).length) {
      this.servidor.set(out);
      this.erros.clear();
    }
  }
}
