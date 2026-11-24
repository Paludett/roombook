import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BookingResponse } from '../core/api.models';
import { BookingService } from '../core/booking.service';
import { ProfessionalService } from '../core/professional.service';
import { RoomService } from '../core/room.service';
import { Reservas } from './reservas';

const h = (min: number) => new Date(Date.now() + min * 60000).toISOString();
const res = (id: number, o: Partial<BookingResponse> = {}): BookingResponse => ({
  id,
  roomId: 1,
  professionalId: 1,
  startTime: h(60),
  endTime: h(120),
  blockedUntil: h(150),
  purpose: 'Consulta',
  status: 'CONFIRMED',
  roomName: 'Consultório 1',
  professionalName: 'Dra. Ana',
  ...o,
});
const pagina = (content: BookingResponse[]) => ({
  content,
  page: { size: 10, number: 0, totalElements: content.length, totalPages: 1 },
});

describe('Reservas', () => {
  const list = vi.fn();
  const cancel = vi.fn();
  beforeEach(() => {
    list
      .mockReset()
      .mockReturnValue(
        of(
          pagina([
            res(1),
            res(2, { startTime: h(-30), endTime: h(30) }),
            res(3, { startTime: h(-300), endTime: h(-240) }),
            res(4, { status: 'CANCELLED' }),
          ]),
        ),
      );
    cancel.mockReset().mockReturnValue(of(res(1, { status: 'CANCELLED' })));
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingService, useValue: { list, cancel } },
        { provide: RoomService, useValue: { list: () => of([]) } },
        { provide: ProfessionalService, useValue: { list: () => of([]) } },
      ],
    });
  });

  async function criar() {
    const f = TestBed.createComponent(Reservas);
    await f.whenStable();
    return { f, c: f.componentInstance, el: f.nativeElement as HTMLElement };
  }

  it('só reserva CONFIRMED futura tem botão Cancelar', async () => {
    const { el } = await criar();
    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(4);
    expect(rows[0].querySelector('button')).not.toBeNull();
    expect(rows[1].textContent).toContain('Em andamento');
    expect(rows[2].textContent).toContain('Encerrada');
    expect(rows[3].textContent).toContain('Cancelada');
    expect(el.querySelectorAll('tbody button').length).toBe(1);
  });

  it('filtro de status recarrega na página 0 com sort desc', async () => {
    const { c } = await criar();
    c.ir(2);
    c.filtrar('status', 'CANCELLED');
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'CANCELLED', page: 0, sort: 'startTime,desc' }),
    );
  });

  it('confirmar cancela, fecha o modal e recarrega', async () => {
    const { c } = await criar();
    c.pedir(res(1));
    c.confirmar();
    expect(cancel).toHaveBeenCalledWith(1);
    expect(c.alvo()).toBeNull();
    expect(list).toHaveBeenCalledTimes(2);
  });
});
