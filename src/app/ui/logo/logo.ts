import { Component, input } from '@angular/core';

/**
 * PENDENTE: logo da Borgonha (os arquivos novos ainda vão ser enviados).
 * Por enquanto é um espaço em branco reservado; o link em volta dá o nome acessível.
 * Quando o arquivo chegar, troque o template por <img src="/logo/borgonha-*.svg" alt="" />.
 */
@Component({
  selector: 'app-logo',
  template: '',
  host: {
    'aria-hidden': 'true',
    'data-pendente': 'logo',
    '[attr.data-variante]': 'variante()',
  },
  styles: `
    :host {
      display: block;
      inline-size: 9.5rem;
      block-size: 2.75rem;
    }

    :host([data-variante='empilhado']) {
      inline-size: 8rem;
      block-size: 5.5rem;
    }
  `,
})
export class Logo {
  readonly variante = input<'horizontal' | 'empilhado'>('horizontal');
}
