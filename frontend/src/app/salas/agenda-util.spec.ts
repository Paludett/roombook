import { AvailabilityBlock, BookingResponse } from '../core/api.models';
import { dividir, hora, montarLinhas, somaDias } from './agenda-util';

const blk = (s: string, e: string, state: AvailabilityBlock['state']): AvailabilityBlock => ({
  start: s,
  end: e,
  state,
});

describe('agenda-util', () => {
  it('hora converte UTC para o fuso da clínica (-03:00)', () => {
    expect(hora('2026-11-24T10:00:00Z')).toBe('07:00');
    expect(hora('2026-11-24T13:30:00Z')).toBe('10:30');
  });

  it('somaDias cruza mês e ano', () => {
    expect(somaDias('2026-11-30', 1)).toBe('2026-12-01');
    expect(somaDias('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('montarLinhas junta ocupado da mesma reserva, higienização e passado; livre fica avulso', () => {
    const reserva = {
      id: 7,
      startTime: '2026-11-24T12:00:00Z',
      endTime: '2026-11-24T13:00:00Z',
      professionalName: 'Ana',
      purpose: 'Consulta',
    } as BookingResponse;
    const l = montarLinhas(
      [
        blk('2026-11-24T10:00:00Z', '2026-11-24T10:30:00Z', 'UNAVAILABLE'),
        blk('2026-11-24T10:30:00Z', '2026-11-24T11:00:00Z', 'UNAVAILABLE'),
        blk('2026-11-24T11:00:00Z', '2026-11-24T11:30:00Z', 'FREE'),
        blk('2026-11-24T11:30:00Z', '2026-11-24T12:00:00Z', 'FREE'),
        blk('2026-11-24T12:00:00Z', '2026-11-24T12:30:00Z', 'BOOKED'),
        blk('2026-11-24T12:30:00Z', '2026-11-24T13:00:00Z', 'BOOKED'),
        blk('2026-11-24T13:00:00Z', '2026-11-24T13:30:00Z', 'CLEANING'),
      ],
      [reserva],
    );
    expect(l.map((x) => [x.tipo, x.n])).toEqual([
      ['unav', 2],
      ['free', 1],
      ['free', 1],
      ['booked', 2],
      ['clean', 1],
    ]);
    expect(l[3].booking?.id).toBe(7);
    expect(l[3].end).toBe('2026-11-24T13:00:00Z');
  });

  it('dividir parte no meio e mantém uma coluna se só há uma linha', () => {
    const mk = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        tipo: 'free' as const,
        start: `${i}`,
        end: `${i}`,
        n: 1,
      }));
    expect(dividir(mk(4)).map((c) => c.length)).toEqual([2, 2]);
    expect(dividir(mk(1)).length).toBe(1);
  });
});
