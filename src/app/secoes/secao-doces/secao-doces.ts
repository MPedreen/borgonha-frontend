import { Component, computed, inject } from '@angular/core';
import { CatalogoStore } from '../../core/estado/catalogo-store';
import { Pedido } from '../../core/pedido/pedido';
import { CabecalhoSecao } from '../../ui/cabecalho-secao/cabecalho-secao';
import { CartaoProduto } from '../../ui/cartao-produto/cartao-produto';
import { Revelar } from '../../ui/revelar/revelar';

/** Outros doces: o primeiro da lista (o brookie) ganha o card de destaque. */
@Component({
  selector: 'app-secao-doces',
  imports: [CabecalhoSecao, CartaoProduto, Revelar],
  templateUrl: './secao-doces.html',
  styleUrl: './secao-doces.scss',
})
export class SecaoDoces {
  private readonly catalogo = inject(CatalogoStore);
  protected readonly pedido = inject(Pedido);

  protected readonly emDestaque = computed(() => this.catalogo.doces().at(0) ?? null);
  protected readonly outros = computed(() => this.catalogo.doces().slice(1));
}
