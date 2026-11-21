import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { BookingRequest, BookingResponse } from './api.models';

// Backend só expõe POST /bookings por enquanto.
@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);

  create(req: BookingRequest) {
    return this.http.post<BookingResponse>(`${environment.apiUrl}/bookings`, req);
  }
}
