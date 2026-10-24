import { Routes } from '@angular/router';
import { LayoutSite } from './layout/layout-site/layout-site';
import { Inicio } from './paginas/inicio/inicio';

export const routes: Routes = [
  {
    // Carregada só quando alguém abre a área do administrador: não pesa no site.
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ROTAS_DO_ADMIN),
  },
  {
    path: '',
    component: LayoutSite,
    children: [
      {
        path: '',
        component: Inicio,
        title: 'Borgonha Confeitaria | Cookies recheados em Santa Luzia, São Gonçalo',
      },
      {
        path: '**',
        title: 'Página não encontrada | Borgonha Confeitaria',
        loadComponent: () =>
          import('./paginas/nao-encontrada/nao-encontrada').then((m) => m.NaoEncontrada),
      },
    ],
  },
];
