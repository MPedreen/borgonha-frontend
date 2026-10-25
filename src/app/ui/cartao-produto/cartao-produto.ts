import {
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { BotaoCestinha } from '../../cestinha/botao-cestinha/botao-cestinha';
import { formatarPreco } from '../../core/formatacao/formatacao';
import { Produto } from '../../core/modelos/catalogo';
import { nomeNoPedido } from '../../core/pedido/mensagem-whatsapp';
import { Botao, VarianteBotao } from '../botao/botao';
import { Etiqueta } from '../etiqueta/etiqueta';
import { Icone } from '../icone/icone';
import { FormatoImagem, ImagemProduto } from '../imagem-produto/imagem-produto';

/**
 * - `cookie`: cookie visto de cima, sem caixa, centralizado (cardápio).
 * - `padrao`: item compacto de cardápio, com a foto pequena ao lado do texto (doces e salgados
 *   com foto). Cabe uma lista longa sem a página ficar enorme.
 * - `tipografico`: sem foto, para fundo vinho (salgados enquanto as fotos não chegam).
 */
export type VarianteCartao = 'cookie' | 'padrao' | 'tipografico';

const FORMATO_DA_IMAGEM: Record<VarianteCartao, FormatoImagem> = {
  cookie: 'cookie',
  padrao: 'quadrado',
  tipografico: 'paisagem',
};

const TAMANHOS_DA_IMAGEM: Record<VarianteCartao, string> = {
  // Tamanho em que o cookie é desenhado: a caixa (até 260px) menos a margem interna de 11%.
  cookie: '(min-width: 768px) 205px, 34vw',
  // Miniatura quadrada: 8.5rem a partir do tablet, 6.5rem no celular.
  padrao: '(min-width: 768px) 136px, 104px',
  tipografico: '90vw',
};

const BOTAO_DO_CARTAO: Record<VarianteCartao, VarianteBotao> = {
  cookie: 'contorno',
  padrao: 'contorno',
  tipografico: 'creme',
};

@Component({
  selector: 'app-cartao-produto',
  imports: [Botao, BotaoCestinha, Etiqueta, Icone, ImagemProduto],
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

  /** "Quero esse" dos produtos sem preço (que não entram na cestinha): abre o painel de pedido. */
  readonly pedir = output<Produto>();

  /** Sabor escolhido, nos produtos com variações. */
  protected readonly variacaoEscolhida = signal<string | null>(null);
  protected readonly faltouSabor = signal(false);
  private readonly primeiroSabor = viewChild<ElementRef<HTMLInputElement>>('sabor');

  protected readonly idTitulo = computed(() => `titulo-produto-${this.produto().slug}`);
  protected readonly formatoImagem = computed(() => FORMATO_DA_IMAGEM[this.variante()]);
  protected readonly tamanhosImagem = computed(() => TAMANHOS_DA_IMAGEM[this.variante()]);
  protected readonly varianteBotao = computed(() => BOTAO_DO_CARTAO[this.variante()]);
  protected readonly nomeNoPedido = computed(() => nomeNoPedido(this.produto()));
  protected readonly idAvisoDoSabor = computed(() => `aviso-sabor-${this.produto().slug}`);
  /** Com preço, o produto entra na cestinha; sem preço, o pedido é combinado pelo WhatsApp. */
  protected readonly temPreco = computed(() => this.produto().preco !== null);
  protected readonly tomDoBotao = computed(() =>
    this.variante() === 'tipografico' ? 'escuro' : 'claro',
  );
  protected readonly preco = computed(() => {
    const valor = this.produto().preco;
    return valor === null ? null : formatarPreco(valor);
  });

  protected escolherSabor(variacao: string): void {
    this.variacaoEscolhida.set(variacao);
    this.faltouSabor.set(false);
  }

  /** "Adicionar" sem sabor escolhido: avisa e leva o foco para os sabores. */
  protected pedirSabor(): void {
    this.faltouSabor.set(true);
    this.primeiroSabor()?.nativeElement.focus();
  }
}
