import { booleanAttribute, Component, computed, input, output } from '@angular/core';
import { formatarPreco } from '../../core/formatacao/formatacao';
import { Produto } from '../../core/modelos/catalogo';
import { nomeNoPedido } from '../../core/pedido/mensagem-whatsapp';
import { Botao, VarianteBotao } from '../botao/botao';
import { Etiqueta } from '../etiqueta/etiqueta';
import { Icone } from '../icone/icone';
import { FormatoImagem, ImagemProduto } from '../imagem-produto/imagem-produto';

/**
 * - `cookie`: cookie visto de cima, sem caixa, centralizado (cardápio).
 * - `destaque`: card grande com foto ao lado (brookie).
 * - `padrao`: card com foto em cima (outros doces e salgados com foto).
 * - `tipografico`: sem foto, para fundo vinho (salgados enquanto as fotos não chegam).
 */
export type VarianteCartao = 'cookie' | 'destaque' | 'padrao' | 'tipografico';

const FORMATO_DA_IMAGEM: Record<VarianteCartao, FormatoImagem> = {
  cookie: 'cookie',
  destaque: 'retrato',
  padrao: 'paisagem',
  tipografico: 'paisagem',
};

const TAMANHOS_DA_IMAGEM: Record<VarianteCartao, string> = {
  cookie: '(min-width: 1200px) 260px, (min-width: 960px) 22vw, 45vw',
  destaque: '(min-width: 960px) 28vw, 90vw',
  padrao: '(min-width: 960px) 30vw, 90vw',
  tipografico: '90vw',
};

const BOTAO_DO_CARTAO: Record<VarianteCartao, VarianteBotao> = {
  cookie: 'contorno',
  destaque: 'primario',
  padrao: 'contorno',
  tipografico: 'creme',
};

@Component({
  selector: 'app-cartao-produto',
  imports: [Botao, Etiqueta, Icone, ImagemProduto],
  templateUrl: './cartao-produto.html',
  styleUrl: './cartao-produto.scss',
  host: {
    '[attr.data-variante]': 'variante()',
    '[class.destacado]': 'destacado()',
  },
})
export class CartaoProduto {
  readonly produto = input.required<Produto>();
  readonly variante = input<VarianteCartao>('padrao');
  /** Pisca o card quando a pessoa chega nele pelo menu de sabores. */
  readonly destacado = input(false, { transform: booleanAttribute });

  /** "Quero esse": abre o painel de pedido com este produto. */
  readonly pedir = output<Produto>();

  protected readonly idTitulo = computed(() => `titulo-produto-${this.produto().slug}`);
  protected readonly formatoImagem = computed(() => FORMATO_DA_IMAGEM[this.variante()]);
  protected readonly tamanhosImagem = computed(() => TAMANHOS_DA_IMAGEM[this.variante()]);
  protected readonly varianteBotao = computed(() => BOTAO_DO_CARTAO[this.variante()]);
  protected readonly nomeNoPedido = computed(() => nomeNoPedido(this.produto()));
  protected readonly preco = computed(() => {
    const valor = this.produto().preco;
    return valor === null ? null : formatarPreco(valor);
  });
}
