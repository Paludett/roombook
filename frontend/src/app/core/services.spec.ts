import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { BookingService } from './booking.service';
import { errorInterceptor, problemMessage } from './error.interceptor';
import { ErrorService } from './error.service';
import { ProfessionalService } from './professional.service';
import { RoomService } from './room.service';

const api = environment.apiUrl;

describe('serviços HTTP e interceptor', () => {
  let http: HttpTestingController;
  let errors: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    errors = TestBed.inject(ErrorService);
  });
  afterEach(() => http.verify());

  it('RoomService: list com filtros, create, update, changeStatus', () => {
    const s = TestBed.inject(RoomService);
    s.list({ type: 'CONSULTORIO', status: 'ATIVA' }).subscribe();
    const l = http.expectOne((r) => r.url === `${api}/rooms`);
    expect(l.request.params.get('type')).toBe('CONSULTORIO');
    expect(l.request.params.get('status')).toBe('ATIVA');
    l.flush([]);

    const body = { name: 'S1', type: 'SALA_EXAME' as const, floorWing: 'A' };
    s.create(body).subscribe();
    const c = http.expectOne(`${api}/rooms`);
    expect(c.request.method).toBe('POST');
    expect(c.request.body).toEqual(body);
    c.flush({});

    s.update(3, body).subscribe();
    expect(http.expectOne(`${api}/rooms/3`).request.method).toBe('PUT');

    s.changeStatus(3, 'INATIVA').subscribe();
    const p = http.expectOne(`${api}/rooms/3/status`);
    expect(p.request.method).toBe('PATCH');
    expect(p.request.body).toEqual({ status: 'INATIVA' });
  });

  it('ProfessionalService: list com filtros, get, create, update', () => {
    const s = TestBed.inject(ProfessionalService);
    s.list({ name: 'Ana', specialty: 'Cardio' }).subscribe();
    const l = http.expectOne((r) => r.url === `${api}/professionals`);
    expect(l.request.params.get('name')).toBe('Ana');
    expect(l.request.params.get('specialty')).toBe('Cardio');
    l.flush([]);
    s.get(1).subscribe();
    expect(http.expectOne(`${api}/professionals/1`).request.method).toBe('GET');
    const body = { name: 'Ana', licenseNumber: 'CRM-RS 1', specialty: 'Cardio', email: 'a@b.c' };
    s.create(body).subscribe();
    expect(http.expectOne(`${api}/professionals`).request.method).toBe('POST');
    s.update(1, body).subscribe();
    expect(http.expectOne(`${api}/professionals/1`).request.method).toBe('PUT');
  });

  it('BookingService: POST /bookings', () => {
    const body = {
      roomId: 1,
      professionalId: 2,
      startTime: '2030-01-01T10:00:00Z',
      endTime: '2030-01-01T11:00:00Z',
      purpose: 'x',
    };
    TestBed.inject(BookingService).create(body).subscribe();
    const r = http.expectOne(`${api}/bookings`);
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(body);
  });

  it('interceptor mostra detail do ProblemDetail e repropaga o erro', () => {
    let failed = false;
    TestBed.inject(RoomService)
      .get(9)
      .subscribe({ error: () => (failed = true) });
    http
      .expectOne(`${api}/rooms/9`)
      .flush(
        { status: 404, detail: 'Sala não encontrada' },
        { status: 404, statusText: 'Not Found' },
      );
    expect(errors.message()).toBe('Sala não encontrada');
    expect(failed).toBe(true);
  });

  it('interceptor inclui errors[] de validação', () => {
    TestBed.inject(RoomService)
      .create({ name: '', type: 'CONSULTORIO', floorWing: '' })
      .subscribe({ error: () => {} });
    http
      .expectOne(`${api}/rooms`)
      .flush(
        {
          status: 400,
          detail: 'Dados inválidos',
          errors: [{ field: 'name', message: 'must not be blank' }],
        },
        { status: 400, statusText: 'Bad Request' },
      );
    expect(errors.message()).toBe('Dados inválidos — name: must not be blank');
  });

  it('interceptor: falha de rede e corpo inesperado', () => {
    TestBed.inject(RoomService)
      .get(1)
      .subscribe({ error: () => {} });
    http.expectOne(`${api}/rooms/1`).error(new ProgressEvent('error'));
    expect(errors.message()).toBe('Não foi possível conectar ao servidor.');
    TestBed.inject(RoomService)
      .get(2)
      .subscribe({ error: () => {} });
    http.expectOne(`${api}/rooms/2`).flush('<html>', { status: 500, statusText: 'x' });
    expect(errors.message()).toBe('Erro inesperado (500).');
  });

  it('problemMessage sem detail cai no fallback', () => {
    expect(problemMessage({ status: 502, error: {} } as never)).toBe('Erro inesperado (502).');
  });
});
