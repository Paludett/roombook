import { RoomStatus, RoomType } from '../core/api.models';

export const TIPOS: Record<RoomType, string> = {
  CONSULTORIO: 'Consultório',
  SALA_EXAME: 'Sala de exame',
  SALA_PROCEDIMENTO: 'Sala de procedimento',
  SALA_REUNIAO: 'Sala de reunião',
};
export const STATUS: Record<RoomStatus, string> = {
  ATIVA: 'Ativa',
  EM_MANUTENCAO: 'Em manutenção',
  INATIVA: 'Inativa',
};
