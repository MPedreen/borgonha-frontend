import { Component, inject } from '@angular/core';
import { CatalogoStore } from '../../core/estado/catalogo-store';
import { Pedido } from '../../core/pedido/pedido';
import { CabecalhoSecao } from '../../ui/cabecalho-secao/cabecalho-secao';
import { CartaoProduto } from '../../ui/cartao-produto/cartao-produto';
import { Revelar } from '../../ui/revelar/revelar';

/**
 * Salgados (coxinha e empadão). PENDENTE: fotos. Enquanto não chegam, os cards usam a
 * versão tipográfica; quando o produto ganhar foto na API, o card passa a mostrá-la sozinho.
 */
@Component({
  selector: 'app-secao-salgados',
  imports: [CabecalhoSecao, CartaoProduto, Revelar],
  templateUrl: './secao-salgados.html',
  styleUrl: './secao-salgados.scss',
})
export class SecaoSalgados {
  protected readonly catalogo = inject(CatalogoStore);
  protected readonly pedido = inject(Pedido);
}
