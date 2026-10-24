import { Component, input } from '@angular/core';

/** Palavra em destaque dentro de um "adesivo" inclinado, como no título do hero. */
@Component({
  selector: 'app-selo',
  template: '<ng-content />',
  host: { '[attr.data-tom]': 'tom()' },
  styles: `
    :host {
      display: inline-block;
      padding: 0.02em 0.2em 0.08em;
      border-radius: 0.14em;
      background-color: var(--cor-creme);
      color: var(--cor-vinho);
      box-shadow: 0 0.08em 0 rgb(0 0 0 / 18%);
      transform: rotate(-3deg);
      animation: pop 700ms var(--curva) 350ms both;
    }

    :host([data-tom='vinho']) {
      background-color: var(--cor-vinho);
      color: var(--cor-creme);
    }

    @keyframes pop {
      0% {
        opacity: 0;
        transform: rotate(-3deg) scale(0.6);
      }

      60% {
        opacity: 1;
        transform: rotate(-5deg) scale(1.06);
      }

      100% {
        transform: rotate(-3deg) scale(1);
      }
    }
  `,
})
export class Selo {
  readonly tom = input<'creme' | 'vinho'>('creme');
}
