import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { BookingRequest, BookingResponse, BookingStatus, Page } from './api.models';

export interface BookingFilter {
  roomId?: number;
  professionalId?: number;
  date?: string;
  status?: BookingStatus;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);

  /** Lista paginada com filtros opcionais (data AAAA-MM-DD no fuso da clínica). */
  list(f: BookingFilter = {}) {
    let params = new HttpParams().set('page', f.page ?? 0).set('size', f.size ?? 100);
    if (f.roomId) params = params.set('roomId', f.roomId);
    if (f.professionalId) params = params.set('professionalId', f.professionalId);
    if (f.date) params = params.set('date', f.date);
    if (f.status) params = params.set('status', f.status);
    if (f.sort) params = params.set('sort', f.sort);
    return this.http.get<Page<BookingResponse>>(`${environment.apiUrl}/bookings`, { params });
  }
  /** Reservas CONFIRMED de uma sala num dia (AAAA-MM-DD, fuso da clínica). */
  listConfirmed(roomId: number, date: string) {
    return this.list({ roomId, date, status: 'CONFIRMED' });
  }
  cancel(id: number) {
    return this.http.patch<BookingResponse>(`${environment.apiUrl}/bookings/${id}/cancel`, {});
  }
  create(req: BookingRequest) {
    return this.http.post<BookingResponse>(`${environment.apiUrl}/bookings`, req);
  }
}
