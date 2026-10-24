import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { Icone } from '../icone/icone';

/**
 * Lista com rolagem horizontal (arrastar no celular, setas no computador).
 * Quem usa projeta os <li> e define a largura de cada item.
 */
@Component({
  selector: 'app-trilho-horizontal',
  imports: [Icone],
  template: `
    <div class="controles">
      <button type="button" class="controle" (click)="rolar(-1)">
        <app-icone nome="chevron-left" /><span class="visualmente-oculto">Anterior</span>
      </button>
      <button type="button" class="controle" (click)="rolar(1)">
        <app-icone nome="chevron-right" /><span class="visualmente-oculto">Próximo</span>
      </button>
    </div>
    <ul #lista class="lista" [attr.aria-label]="rotulo()">
      <ng-content />
    </ul>
  `,
  styleUrl: './trilho-horizontal.scss',
})
export class TrilhoHorizontal {
  readonly rotulo = input.required<string>();

  private readonly lista = viewChild.required<ElementRef<HTMLUListElement>>('lista');
  private readonly documento = inject(DOCUMENT);

  protected rolar(direcao: 1 | -1): void {
    const lista = this.lista().nativeElement;
    const movimentoReduzido = this.documento.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    lista.scrollBy({
      left: direcao * lista.clientWidth * 0.85,
      behavior: movimentoReduzido ? 'auto' : 'smooth',
    });
  }
}
