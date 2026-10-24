import { Component, input } from '@angular/core';

/** Etiqueta curta em caixa alta (ex.: "MAIS PEDIDO", "ESGOTADO HOJE"). */
@Component({
  selector: 'app-etiqueta',
  template: '<ng-content />',
  host: { '[attr.data-tom]': 'tom()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      padding: 0.4em 0.85em;
      border-radius: var(--raio-pilula);
      background-color: var(--cor-vinho);
      color: var(--cor-creme);
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      line-height: 1.2;
      text-transform: uppercase;
    }

    :host([data-tom='creme']) {
      background-color: var(--cor-creme);
      color: var(--cor-vinho);
    }

    :host([data-tom='contorno']) {
      background-color: transparent;
      color: var(--cor-vinho);
      box-shadow: inset 0 0 0 1.5px currentColor;
    }
  `,
})
export class Etiqueta {
  readonly tom = input<'vinho' | 'creme' | 'contorno'>('vinho');
}
