import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProfessionalResponse } from '../core/api.models';
import { ErrorService } from '../core/error.service';
import { ProfessionalService } from '../core/professional.service';
import { ToastService } from '../core/toast.service';
import { Profissionais } from './profissionais';

const prof = (id: number, o: Partial<ProfessionalResponse> = {}): ProfessionalResponse => ({
  id,
  name: `Dra. Ana Souza ${id}`,
  licenseNumber: `CRM-RS 1000${id}`,
  specialty: 'Cardiologia',
  email: `ana${id}@exemplo.test`,
  ...o,
});

describe('Profissionais', () => {
  const list = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  beforeEach(() => {
    list.mockReset().mockReturnValue(of([prof(1), prof(2, { specialty: 'Ortopedia' })]));
    create.mockReset().mockReturnValue(of(prof(3)));
    update.mockReset().mockReturnValue(of(prof(1)));
    TestBed.configureTestingModule({
      providers: [{ provide: ProfessionalService, useValue: { list, create, update } }],
    });
  });

  afterEach(() => vi.useRealTimers());

  async function criar() {
    const f = TestBed.createComponent(Profissionais);
    await f.whenStable();
    return { f, c: f.componentInstance, el: f.nativeElement as HTMLElement };
  }
  const preencher = (c: Profissionais, v: object = {}) =>
    c.form.setValue({
      name: 'Dr. Novo',
      licenseNumber: 'CRM-RS 12345',
      specialty: 'Pediatria',
      email: 'novo@exemplo.test',
      ...v,
    });

  it('lista nome, registro, especialidade e e-mail e a contagem', async () => {
    const { el } = await criar();
    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Dra. Ana Souza 1');
    expect(rows[0].textContent).toContain('CRM-RS 10001');
    expect(rows[0].textContent).toContain('Cardiologia');
    expect(rows[0].textContent).toContain('ana1@exemplo.test');
    expect(el.querySelector('.count')?.textContent).toContain('2 profissionais');
    expect(el.querySelectorAll('.pcard').length).toBe(2);
  });

  it('busca consulta por nome e por especialidade e une sem duplicar', async () => {
    vi.useFakeTimers();
    list.mockImplementation((f: { name?: string; specialty?: string } = {}) =>
      of(f.name ? [prof(1)] : f.specialty ? [prof(1), prof(2)] : []),
    );
    const f = TestBed.createComponent(Profissionais);
    f.componentInstance.buscar('Ort');
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    expect(list).toHaveBeenCalledWith({ name: 'Ort' });
    expect(list).toHaveBeenCalledWith({ specialty: 'Ort' });
    expect(f.componentInstance.lista().map((p) => p.id)).toEqual([1, 2]);
  });

  it('estado vazio com busca oferece limpar', async () => {
    list.mockReturnValue(of([]));
    const { f, c, el } = await criar();
    c.busca.set('zzz');
    c.carregar();
    await f.whenStable();
    expect(el.querySelector('.empty')?.textContent).toContain('Nenhum profissional encontrado');
    expect(el.querySelector('.empty button')?.textContent).toContain('Limpar busca');
  });

  it('formulário vazio mostra obrigatórios; e-mail e registro inválidos mostram formato', async () => {
    const { f, c, el } = await criar();
    c.abrir();
    c.salvar();
    f.detectChanges();
    expect(create).not.toHaveBeenCalled();
    expect(el.querySelectorAll('.err-msg').length).toBe(4);
    preencher(c, { email: 'x', licenseNumber: '12345' });
    f.detectChanges();
    expect(c.erro('email')).toBe('E-mail inválido');
    expect(c.erro('licenseNumber')).toContain('CRM-RS 12345');
    preencher(c, { licenseNumber: 'CRM 9' });
    expect(c.erro('licenseNumber')).toBeNull();
  });

  it('salvar cria, fecha o modal, mostra toast e recarrega a lista', async () => {
    const { c } = await criar();
    const toast = TestBed.inject(ToastService);
    c.abrir();
    preencher(c);
    c.salvar();
    expect(create).toHaveBeenCalledWith({
      name: 'Dr. Novo',
      licenseNumber: 'CRM-RS 12345',
      specialty: 'Pediatria',
      email: 'novo@exemplo.test',
    });
    expect(c.aberto()).toBeNull();
    expect(toast.toasts()[0].text).toBe('Profissional cadastrado');
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('editar preenche o formulário e chama update', async () => {
    const { c } = await criar();
    c.abrir(prof(1));
    expect(c.form.getRawValue().email).toBe('ana1@exemplo.test');
    c.salvar();
    expect(update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Dra. Ana Souza 1' }));
    expect(TestBed.inject(ToastService).toasts()[0].text).toBe('Profissional atualizado');
  });

  it('409 de e-mail e de registro caem no campo certo e limpam a faixa global', async () => {
    const { c } = await criar();
    const erros = TestBed.inject(ErrorService);
    c.abrir();
    preencher(c);
    erros.show('x');
    create.mockReturnValueOnce(
      throwError(
        () => new HttpErrorResponse({ status: 409, error: { detail: 'E-mail já cadastrado' } }),
      ),
    );
    c.salvar();
    expect(c.erro('email')).toBe('E-mail já cadastrado');
    expect(c.erro('licenseNumber')).toBeNull();
    expect(c.aberto()).not.toBeNull();
    expect(erros.message()).toBeNull();
    c.limparServidor('email');
    expect(c.erro('email')).toBeNull();
    create.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { detail: 'Registro profissional já cadastrado' },
          }),
      ),
    );
    c.salvar();
    expect(c.erro('licenseNumber')).toBe('Registro profissional já cadastrado');
  });

  it('400 com errors[] mostra a mensagem em cada campo', async () => {
    const { c } = await criar();
    c.abrir();
    preencher(c);
    create.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { errors: [{ field: 'specialty', message: 'não deve estar em branco' }] },
          }),
      ),
    );
    c.salvar();
    expect(c.erro('specialty')).toBe('não deve estar em branco');
    expect(c.erro('name')).toBeNull();
  });
});
