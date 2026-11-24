import { RoomStatus, RoomType } from '../core/api.models';
import { IconName } from '../core/icon';

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

export const TIPO_ICON: Record<RoomType, IconName> = {
  CONSULTORIO: 'consultorio',
  SALA_EXAME: 'exame',
  SALA_PROCEDIMENTO: 'procedimento',
  SALA_REUNIAO: 'reuniao',
};
export const STATUS_ICON: Record<RoomStatus, IconName> = {
  ATIVA: 'check',
  EM_MANUTENCAO: 'wrench',
  INATIVA: 'ban',
};
