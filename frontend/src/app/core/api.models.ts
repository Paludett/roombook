// Espelha os DTOs do backend (dev.paludett.roombook.dto). Instant = string ISO-8601.
export type RoomType = 'CONSULTORIO' | 'SALA_EXAME' | 'SALA_PROCEDIMENTO' | 'SALA_REUNIAO';
export type RoomStatus = 'ATIVA' | 'EM_MANUTENCAO' | 'INATIVA';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface RoomRequest {
  name: string;
  type: RoomType;
  floorWing: string;
  sanitizationMinutes?: number | null;
}
export interface RoomResponse {
  id: number;
  name: string;
  type: RoomType;
  floorWing: string;
  status: RoomStatus;
  sanitizationMinutes: number;
}
export interface RoomStatusRequest {
  status: RoomStatus;
}

export interface ProfessionalRequest {
  name: string;
  licenseNumber: string;
  specialty: string;
  email: string;
}
export interface ProfessionalResponse extends ProfessionalRequest {
  id: number;
}

export interface BookingRequest {
  roomId: number;
  professionalId: number;
  startTime: string;
  endTime: string;
  purpose: string;
}
export interface BookingResponse extends BookingRequest {
  id: number;
  blockedUntil: string;
  status: BookingStatus;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: { field: string; message: string }[];
}
