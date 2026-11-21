import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'salas' },
  { path: 'salas', loadComponent: () => import('./salas/salas').then((m) => m.Salas) },
  { path: 'reservas', loadComponent: () => import('./reservas/reservas').then((m) => m.Reservas) },
];
