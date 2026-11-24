import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AvailabilityBlock } from '../core/api.models';
import { BookingService } from '../core/booking.service';
import { ErrorService } from '../core/error.service';
import { ProfessionalService } from '../core/professional.service';
import { RoomService } from '../core/room.service';
import { ToastService } from '../core/toast.service';
import { Agenda } from './agenda';

// 4 blocos de 30 min a partir de 13:00Z (10:00 no fuso da clínica): livre, livre, ocupado, higienização
const iso = (m: number) => new Date(Date.UTC(2099, 0, 1, 13, m)).toISOString();
const blocks: AvailabilityBlock[] = [
  { start: iso(0), end: iso(30), state: 'FREE' },
  { start: iso(30), end: iso(60), state: 'FREE' },
  { start: iso(60), end: iso(90), state: 'BOOKED' },
  { start: iso(90), end: iso(120), state: 'CLEANING' },
];

describe('Agenda', () => {
  const create = vi.fn();
  const availability = vi.fn();
  let errors: ErrorService;

  beforeEach(() => {
    create.mockReset();
    availability.mockReset().mockReturnValue(of({ roomId: 1, date: '2099-01-01', blocks }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '1']]) } } },
        {
          provide: RoomService,
          useValue: {
            availability,
            get: () =>
              of({
                id: 1,
                name: 'Sala 1',
                type: 'CONSULTORIO',
                floorWing: 'A',
                status: 'ATIVA',
                sanitizationMinutes: 20,
              }),
          },
        },
        {
          provide: BookingService,
          useValue: {
            create,
            listConfirmed: () =>
              of({
                content: [
                  {
                    id: 9,
                    startTime: iso(60),
                    endTime: iso(90),
                    professionalName: 'Dra. Ana',
                    purpose: 'Consulta',
                  },
                ],
                page: {},
              }),
          },
        },
        {
          provide: ProfessionalService,
          useValue: { list: () => of([{ id: 5, name: 'Dra. Ana', specialty: 'Clínica' }]) },
        },
      ],
    });
    errors = TestBed.inject(ErrorService);
  });

  async function abrirForm() {
    const f = TestBed.createComponent(Agenda);
    await f.whenStable();
    const c = f.componentInstance;
    const el = f.nativeElement as HTMLElement;
    const livres = el.querySelectorAll<HTMLButtonElement>('button.blk--free');
    livres[0].click();
    f.detectChanges();
    el.querySelectorAll<HTMLButtonElement>('button.blk')[1].click();
    f.detectChanges();
    return { f, c, el };
  }

  it('mostra nome/finalidade nos ocupados e higienização; seleção contígua mostra resumo', async () => {
    const { f, el } = await abrirForm();
    expect(el.querySelector('.timeline .blk--booked')?.textContent).toContain('Dra. Ana');
    expect(el.querySelector('.timeline .blk--booked')?.textContent).toContain('Consulta');
    expect(el.querySelector('.timeline .blk--clean')?.textContent).toContain('Higienização');
    expect(el.querySelector('.selbar')?.textContent).toContain('10:00–11:00 selecionado');
    expect(el.querySelector('.selbar')?.textContent).toContain('1 h');
    expect(el.querySelector('.selbar')?.textContent).toContain('bloqueada até 11:20');
    f.destroy();
  });

  it('formulário vazio não envia; válido envia o intervalo selecionado em UTC', async () => {
    const { f, c, el } = await abrirForm();
    c.abrir();
    f.detectChanges();
    c.reservar();
    expect(create).not.toHaveBeenCalled();
    f.detectChanges();
    expect(el.querySelectorAll('.err-msg').length).toBe(2);

    create.mockReturnValue(of({}));
    const toast = TestBed.inject(ToastService);
    c.form.patchValue({ professionalId: 5, purpose: '  Retorno ' });
    c.reservar();
    expect(create).toHaveBeenCalledWith({
      roomId: 1,
      professionalId: 5,
      startTime: iso(0),
      endTime: iso(60),
      purpose: 'Retorno',
    });
    expect(toast.toasts()[0].text).toContain('10:00–11:00');
    expect(c.aberto()).toBe(false);
    f.destroy();
  });

  it('409 mostra a mensagem da API no formulário e limpa a faixa global', async () => {
    const { f, c, el } = await abrirForm();
    c.abrir();
    errors.show('global');
    create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({ status: 409, error: { detail: 'A sala já está reservada.' } }),
      ),
    );
    c.form.patchValue({ professionalId: 5, purpose: 'x' });
    c.reservar();
    f.detectChanges();
    expect(c.aberto()).toBe(true);
    expect(el.querySelector('.overlay .banner')?.textContent).toContain(
      'A sala já está reservada.',
    );
    expect(errors.message()).toBeNull();
    f.destroy();
  });

  it('400 com errors[] marca o campo correspondente', async () => {
    const { f, c, el } = await abrirForm();
    c.abrir();
    f.detectChanges();
    create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              detail: 'Dados inválidos',
              errors: [{ field: 'purpose', message: 'tamanho inválido' }],
            },
          }),
      ),
    );
    c.form.patchValue({ professionalId: 5, purpose: 'x' });
    c.reservar();
    f.detectChanges();
    expect(el.querySelector('#fin')?.classList.contains('is-error')).toBe(true);
    expect(el.querySelector('.overlay')?.textContent).toContain('tamanho inválido');
    f.destroy();
  });
});
