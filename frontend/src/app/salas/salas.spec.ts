import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RoomResponse } from '../core/api.models';
import { RoomService } from '../core/room.service';
import { Salas } from './salas';

const sala = (id: number, o: Partial<RoomResponse> = {}): RoomResponse => ({
  id,
  name: `Sala ${id}`,
  type: 'SALA_EXAME',
  floorWing: '1º andar',
  status: 'ATIVA',
  sanitizationMinutes: 10,
  ...o,
});

describe('Salas', () => {
  const list = vi.fn();
  beforeEach(() => {
    list
      .mockReset()
      .mockReturnValue(of([sala(1), sala(2, { status: 'EM_MANUTENCAO', type: 'CONSULTORIO' })]));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: RoomService, useValue: { list } }],
    });
  });

  it('mostra rótulos em PT, destaque de manutenção e link da agenda', async () => {
    const f = TestBed.createComponent(Salas);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('a.card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Sala de exame');
    expect(cards[1].classList).toContain('room--maint');
    expect(cards[1].textContent).toContain('Agenda bloqueada');
    expect(cards[1].textContent).toContain('Em manutenção');
    expect(cards[0].getAttribute('href')).toBe('/salas/1/agenda');
  });

  it('filtra por tipo e status chamando a API', async () => {
    const f = TestBed.createComponent(Salas);
    await f.whenStable();
    f.componentInstance.filtrar('tipo', 'CONSULTORIO');
    f.componentInstance.filtrar('status', 'EM_MANUTENCAO');
    expect(list).toHaveBeenLastCalledWith({ type: 'CONSULTORIO', status: 'EM_MANUTENCAO' });
  });

  it('chip de tipo marca aria-pressed e resumo conta manutenção', async () => {
    const f = TestBed.createComponent(Salas);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.textContent).toContain('2 salas · 1 em manutenção');
    const chips = el.querySelectorAll<HTMLButtonElement>('.tipo-chips .chip');
    expect(chips[0].getAttribute('aria-pressed')).toBe('true');
    chips[1].click();
    await f.whenStable();
    expect(list).toHaveBeenLastCalledWith({ type: 'CONSULTORIO', status: undefined });
    expect(chips[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('lista vazia mostra estado vazio com "Limpar filtros"', async () => {
    list.mockReturnValue(of([]));
    const f = TestBed.createComponent(Salas);
    await f.whenStable();
    f.componentInstance.filtrar('tipo', 'SALA_REUNIAO');
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('.empty')?.textContent).toContain('Nenhuma sala encontrada');
    expect(el.querySelector('.empty button')?.textContent).toContain('Limpar filtros');
  });
});
