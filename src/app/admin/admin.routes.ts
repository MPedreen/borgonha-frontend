import { Routes } from '@angular/router';
import { sessaoAberta } from './core/sessao-aberta';
import { EditorProduto } from './editor-produto/editor-produto';
import { Entrar } from './entrar/entrar';
import { LayoutAdmin } from './layout-admin/layout-admin';
import { Painel } from './painel/painel';

/** Área do administrador (/admin): login e edição do cardápio. Renderizada só no navegador. */
export const ROTAS_DO_ADMIN: Routes = [
  {
    path: 'entrar',
    component: Entrar,
    title: 'Entrar | Área do administrador | Borgonha Confeitaria',
  },
  {
    path: '',
    component: LayoutAdmin,
    canActivate: [sessaoAberta],
    children: [
      {
        path: '',
        component: Painel,
        title: 'Cardápio da semana | Área do administrador | Borgonha Confeitaria',
      },
      {
        path: 'produtos/novo',
        component: EditorProduto,
        title: 'Novo produto | Área do administrador | Borgonha Confeitaria',
      },
      {
        path: 'produtos/:slug',
        component: EditorProduto,
        title: 'Editar produto | Área do administrador | Borgonha Confeitaria',
      },
    ],
  },
];
