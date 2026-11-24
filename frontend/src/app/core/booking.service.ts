import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { BookingRequest, BookingResponse, Page } from './api.models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);

  /** Reservas CONFIRMED de uma sala num dia (AAAA-MM-DD, fuso da clínica). */
  listConfirmed(roomId: number, date: string) {
    const params = new HttpParams()
      .set('roomId', roomId)
      .set('date', date)
      .set('status', 'CONFIRMED')
      .set('size', 100);
    return this.http.get<Page<BookingResponse>>(`${environment.apiUrl}/bookings`, { params });
  }
  create(req: BookingRequest) {
    return this.http.post<BookingResponse>(`${environment.apiUrl}/bookings`, req);
  }
}
