import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessaoAdmin } from './sessao-admin';

/** Só deixa entrar no painel com a sessão aberta; sem ela, vai para a tela de login. */
export const sessaoAberta: CanActivateFn = async () => {
  const router = inject(Router);
  return (await inject(SessaoAdmin).estaAberta()) || router.createUrlTree(['/admin/entrar']);
};
