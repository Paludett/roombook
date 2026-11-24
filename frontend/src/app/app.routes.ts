import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'salas' },
  { path: 'salas', loadComponent: () => import('./salas/salas').then((m) => m.Salas) },
  { path: 'reservas', loadComponent: () => import('./reservas/reservas').then((m) => m.Reservas) },
  {
    path: 'profissionais',
    loadComponent: () => import('./profissionais/profissionais').then((m) => m.Profissionais),
  },
  {
    path: 'salas/:id/agenda',
    loadComponent: () => import('./salas/agenda').then((m) => m.Agenda),
  },
];
