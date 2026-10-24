import { DestroyRef, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

/**
 * Pede aos buscadores para não indexarem a página enquanto ela estiver aberta.
 * Chame no construtor dos componentes da área do administrador.
 */
export function semIndexacao(): void {
  const meta = inject(Meta);
  meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  inject(DestroyRef).onDestroy(() => meta.removeTag("name='robots'"));
}
