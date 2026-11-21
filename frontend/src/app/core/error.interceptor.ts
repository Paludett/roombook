import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ProblemDetail } from './api.models';
import { ErrorService } from './error.service';

/** Texto amigável a partir do ProblemDetail (ou fallback p/ falha de rede / corpo inesperado). */
export function problemMessage(err: HttpErrorResponse): string {
  if (err.status === 0) return 'Não foi possível conectar ao servidor.';
  const p = err.error as ProblemDetail | null;
  if (p && typeof p === 'object') {
    const fields = p.errors?.map((e) => `${e.field}: ${e.message}`).join('; ');
    const text = [p.detail, fields].filter(Boolean).join(' — ');
    if (text) return text;
  }
  return `Erro inesperado (${err.status}).`;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errors = inject(ErrorService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      errors.show(problemMessage(err));
      return throwError(() => err);
    }),
  );
};
