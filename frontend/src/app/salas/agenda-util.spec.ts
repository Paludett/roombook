import { AvailabilityBlock, BookingResponse } from '../core/api.models';
import { dataCurta, dividir, hora, montarLinhas, somaDias } from './agenda-util';

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

  it('montarLinhas: uma linha por bloco; só os blocos da mesma reserva se juntam', () => {
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
        blk('2026-11-24T13:30:00Z', '2026-11-24T14:00:00Z', 'CLEANING'),
      ],
      [reserva],
    );
    expect(l.map((x) => [x.tipo, x.n])).toEqual([
      ['unav', 1],
      ['unav', 1],
      ['free', 1],
      ['free', 1],
      ['booked', 2],
      ['clean', 1],
      ['clean', 1],
    ]);
    expect(l[4].booking?.id).toBe(7);
    expect(l[4].starts).toEqual(['2026-11-24T12:00:00Z', '2026-11-24T12:30:00Z']);
  });

  it('dividir parte às 14:00 (clínica) ou no meio', () => {
    const mk = (starts: string[]) =>
      starts.map((s) => ({ tipo: 'free' as const, start: s, end: s, n: 1, starts: [s] }));
    // 16:30Z = 13:30 local; 17:00Z = 14:00 local
    expect(
      dividir(mk(['2026-11-24T16:00:00Z', '2026-11-24T16:30:00Z', '2026-11-24T17:00:00Z'])).map(
        (c) => c.length,
      ),
    ).toEqual([2, 1]);
    expect(
      dividir(
        mk([
          '2026-11-24T10:00:00Z',
          '2026-11-24T10:30:00Z',
          '2026-11-24T11:00:00Z',
          '2026-11-24T11:30:00Z',
        ]),
      ).map((c) => c.length),
    ).toEqual([2, 2]);
    expect(dividir(mk(['2026-11-24T10:00:00Z'])).length).toBe(1);
  });

  it('dataCurta no formato do mockup', () => {
    expect(dataCurta('2026-11-24', true)).toBe('Hoje · ter, 24 nov 2026');
    expect(dataCurta('2026-11-25', false)).toBe('qua, 25 nov 2026');
  });
});
