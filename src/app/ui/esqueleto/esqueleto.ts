import { Component, input } from '@angular/core';

/** Bloco animado que ocupa o lugar do conteúdo enquanto ele carrega. */
@Component({
  selector: 'app-esqueleto',
  template: '',
  host: {
    'aria-hidden': 'true',
    '[style.aspect-ratio]': 'proporcao()',
  },
  styles: `
    :host {
      display: block;
      border-radius: var(--raio-g);
      background: linear-gradient(
          100deg,
          var(--cor-creme-escuro) 40%,
          var(--cor-creme) 50%,
          var(--cor-creme-escuro) 60%
        )
        0 0 / 300% 100%;
      animation: brilho 1.6s linear infinite;
    }

    @keyframes brilho {
      to {
        background-position: -150% 0;
      }
    }
  `,
})
export class Esqueleto {
  /** Proporção do bloco, no formato do CSS aspect-ratio (ex.: "1", "4 / 5"). */
  readonly proporcao = input('1');
}
