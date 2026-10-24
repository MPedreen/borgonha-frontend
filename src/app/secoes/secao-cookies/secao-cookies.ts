import { Component, computed, inject } from '@angular/core';
import { CatalogoStore } from '../../core/estado/catalogo-store';
import { Navegacao } from '../../core/navegacao/navegacao';
import { Pedido } from '../../core/pedido/pedido';
import { Botao } from '../../ui/botao/botao';
import { CabecalhoSecao } from '../../ui/cabecalho-secao/cabecalho-secao';
import { CartaoProduto } from '../../ui/cartao-produto/cartao-produto';
import { Esqueleto } from '../../ui/esqueleto/esqueleto';
import { Revelar } from '../../ui/revelar/revelar';

const CARDS_DO_ESQUELETO = 6;

/** O cardápio de cookies (todos os sabores à vista, sem carrossel). */
@Component({
  selector: 'app-secao-cookies',
  imports: [Botao, CabecalhoSecao, CartaoProduto, Esqueleto, Revelar],
  templateUrl: './secao-cookies.html',
  styleUrl: './secao-cookies.scss',
})
export class SecaoCookies {
  protected readonly catalogo = inject(CatalogoStore);
  protected readonly pedido = inject(Pedido);
  protected readonly navegacao = inject(Navegacao);

  protected readonly sobretitulo = computed(() => {
    const quantidade = this.catalogo.cookies().length;
    return quantidade > 0 ? `${quantidade} sabores recheados` : 'Sabores recheados';
  });
  protected readonly esqueletos = Array.from({ length: CARDS_DO_ESQUELETO }, (_, indice) => indice);
}
