import { Component, inject } from '@angular/core';
import { LojaStore } from '../../core/estado/loja-store';
import { Pedido } from '../../core/pedido/pedido';
import { Icone } from '../../ui/icone/icone';

/** Faixa fina no topo com o aviso da loja (texto vindo da API). Abre o painel de pedido. */
@Component({
  selector: 'app-barra-aviso',
  imports: [Icone],
  template: `
    @if (loja.avisoTopo(); as aviso) {
      <button type="button" class="barra" (click)="pedido.abrir()">
        <app-icone nome="bike" />
        <span>{{ aviso }}</span>
        <app-icone nome="arrow-right" class="barra__seta" />
      </button>
    }
  `,
  styles: `
    .barra {
      --cor-foco: var(--cor-creme);

      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      width: 100%;
      min-height: 2.5rem;
      padding: 0.5rem var(--margem-lateral);
      border: 0;
      background-color: var(--cor-vinho);
      color: var(--cor-creme);
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;

      &:hover .barra__seta {
        transform: translateX(3px);
      }

      &:focus-visible {
        outline-offset: -4px;
      }
    }

    .barra__seta {
      transition: transform var(--duracao-rapida) var(--curva);
    }
  `,
})
export class BarraAviso {
  protected readonly loja = inject(LojaStore);
  protected readonly pedido = inject(Pedido);
}
