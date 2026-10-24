import { inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Mensagem deixada pela página anterior ao navegar (ex.: "Produto excluído."), passada no
 * `state` da navegação. Chame no construtor do componente da página de destino.
 */
export function mensagemDaNavegacao(): string | null {
  const mensagem: unknown = inject(Router).currentNavigation()?.extras.state?.['mensagem'];
  return typeof mensagem === 'string' ? mensagem : null;
}
