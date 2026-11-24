import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AvailabilityResponse, RoomRequest, RoomResponse, RoomStatus, RoomStatusRequest, RoomType } from './api.models';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/rooms`;

  list(filter: { type?: RoomType; status?: RoomStatus } = {}) {
    let params = new HttpParams();
    if (filter.type) params = params.set('type', filter.type);
    if (filter.status) params = params.set('status', filter.status);
    return this.http.get<RoomResponse[]>(this.url, { params });
  }
  get(id: number) {
    return this.http.get<RoomResponse>(`${this.url}/${id}`);
  }
  availability(id: number, date: string) {
    return this.http.get<AvailabilityResponse>(`${this.url}/${id}/availability`, {
      params: { date },
    });
  }
  create(req: RoomRequest) {
    return this.http.post<RoomResponse>(this.url, req);
  }
  update(id: number, req: RoomRequest) {
    return this.http.put<RoomResponse>(`${this.url}/${id}`, req);
  }
  changeStatus(id: number, status: RoomStatus) {
    const body: RoomStatusRequest = { status };
    return this.http.patch<RoomResponse>(`${this.url}/${id}/status`, body);
  }
}
