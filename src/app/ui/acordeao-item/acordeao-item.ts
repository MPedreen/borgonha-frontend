import { Component, input } from '@angular/core';
import { Icone } from '../icone/icone';

/**
 * Item de acordeão sobre <details>/<summary> nativos. Itens com o mesmo `grupo`
 * funcionam como um acordeão exclusivo (abrir um fecha o outro).
 */
@Component({
  selector: 'app-acordeao-item',
  imports: [Icone],
  template: `
    <details class="item" [attr.name]="grupo()">
      <summary class="item__titulo">
        <span>{{ titulo() }}</span>
        <app-icone nome="chevron-down" class="item__seta" />
      </summary>
      <div class="item__conteudo"><ng-content /></div>
    </details>
  `,
  styleUrl: './acordeao-item.scss',
})
export class AcordeaoItem {
  readonly titulo = input.required<string>();
  readonly grupo = input<string>();
}
