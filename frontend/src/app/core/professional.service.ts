import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { ProfessionalRequest, ProfessionalResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class ProfessionalService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/professionals`;

  list(filter: { name?: string; specialty?: string } = {}) {
    let params = new HttpParams();
    if (filter.name) params = params.set('name', filter.name);
    if (filter.specialty) params = params.set('specialty', filter.specialty);
    return this.http.get<ProfessionalResponse[]>(this.url, { params });
  }
  get(id: number) {
    return this.http.get<ProfessionalResponse>(`${this.url}/${id}`);
  }
  create(req: ProfessionalRequest) {
    return this.http.post<ProfessionalResponse>(this.url, req);
  }
  update(id: number, req: ProfessionalRequest) {
    return this.http.put<ProfessionalResponse>(`${this.url}/${id}`, req);
  }
}
