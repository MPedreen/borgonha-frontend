import { Component, input } from '@angular/core';
import { NomeIcone } from './nomes-icones';

/** Ícone decorativo do sprite `public/icones.svg` (gerado por `npm run icones`). */
@Component({
  selector: 'app-icone',
  template: `<svg aria-hidden="true" focusable="false">
    <use [attr.href]="'/icones.svg#' + nome()" />
  </svg>`,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      width: 1.25em;
      height: 1.25em;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class Icone {
  readonly nome = input.required<NomeIcone>();
}
