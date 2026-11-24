import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('some em 5 s', () => {
    const s = TestBed.inject(ToastService);
    s.show('Reserva criada');
    expect(s.toasts().map((t) => t.text)).toEqual(['Reserva criada']);
    vi.advanceTimersByTime(5000);
    expect(s.toasts()).toEqual([]);
  });

  it('fica enquanto pausado (mouse em cima) e volta a contar ao soltar', () => {
    const s = TestBed.inject(ToastService);
    s.show('Reserva cancelada');
    const id = s.toasts()[0].id;
    s.pause(id);
    vi.advanceTimersByTime(10000);
    expect(s.toasts().length).toBe(1);
    s.resume(id);
    vi.advanceTimersByTime(5000);
    expect(s.toasts()).toEqual([]);
  });
});
