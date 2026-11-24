import { AvailabilityBlock, BookingResponse } from '../core/api.models';

/** Fuso da clínica (igual ao default do backend, roombook.booking.zone). A API devolve UTC. */
export const FUSO = 'America/Sao_Paulo';

const hm = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const ymd = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "09:30" no fuso da clínica. */
export const hora = (iso: string | Date) => hm.format(new Date(iso));
/** "2026-11-24" no fuso da clínica. */
export const dataClinica = (d: Date = new Date()) => ymd.format(d);

/** Soma dias a uma data AAAA-MM-DD (aritmética pura, sem fuso). */
export function somaDias(data: string, n: number): string {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "terça, 24 de novembro" */
export function dataLonga(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${data}T12:00:00Z`));
}

export type LinhaTipo = 'free' | 'booked' | 'clean' | 'unav';
export interface Linha {
  tipo: LinhaTipo;
  start: string;
  end: string;
  /** número de blocos de 30 min (altura). */
  n: number;
  /** início de cada bloco de 30 min da linha (uma marca na régua por bloco). */
  starts: string[];
  booking?: BookingResponse;
}

/** Uma linha por bloco de 30 min; só os blocos de uma mesma reserva viram uma linha. */
export function montarLinhas(blocks: AvailabilityBlock[], bookings: BookingResponse[]): Linha[] {
  const reservaDe = (b: AvailabilityBlock) =>
    bookings.find(
      (r) => new Date(r.startTime) < new Date(b.end) && new Date(r.endTime) > new Date(b.start),
    );
  const out: Linha[] = [];
  for (const b of blocks) {
    const tipo: LinhaTipo =
      b.state === 'FREE'
        ? 'free'
        : b.state === 'BOOKED'
          ? 'booked'
          : b.state === 'CLEANING'
            ? 'clean'
            : 'unav';
    const booking = tipo === 'booked' ? reservaDe(b) : undefined;
    const ult = out[out.length - 1];
    if (ult && booking && ult.booking?.id === booking.id) {
      ult.end = b.end;
      ult.n++;
      ult.starts.push(b.start);
    } else {
      out.push({ tipo, start: b.start, end: b.end, n: 1, starts: [b.start], booking });
    }
  }
  return out;
}

/** Divide em duas colunas (manhã | tarde): na primeira linha a partir de 14:00 ou, sem ela, no meio. */
export function dividir(linhas: Linha[]): Linha[][] {
  let i = linhas.findIndex((l) => hora(l.start) >= '14:00');
  if (i <= 0) i = Math.ceil(linhas.length / 2);
  return i >= linhas.length ? [linhas] : [linhas.slice(0, i), linhas.slice(i)];
}

/** "Hoje · ter, 24 nov 2026" / "qua, 25 nov 2026" */
export function dataCurta(data: string, hoje: boolean): string {
  const t = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(`${data}T12:00:00Z`))
    .replace(/\./g, '')
    .replace(',', ',')
    .replace(/ de /g, ' ');
  return hoje ? `Hoje · ${t}` : t;
}
