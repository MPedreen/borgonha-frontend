import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Cestinha, ItemDaCestinha, QUANTIDADE_MAXIMA } from '../../core/cestinha/cestinha';
import { emReais } from '../../core/cestinha/mensagem-do-pedido';
import { FORMAS_DE_PAGAMENTO } from '../../core/cestinha/pagamento';
import { formatarDistancia } from '../../core/entrega/consulta-entrega';
import { EntregaDoCliente } from '../../core/entrega/entrega-do-cliente';
import { LojaStore } from '../../core/estado/loja-store';
import { formatarPrecoCurto } from '../../core/formatacao/formatacao';
import { Navegacao } from '../../core/navegacao/navegacao';
import { Botao } from '../../ui/botao/botao';
import { Dialogo } from '../../ui/dialogo/dialogo';
import { Icone } from '../../ui/icone/icone';
import { ImagemProduto } from '../../ui/imagem-produto/imagem-produto';
import { BotaoCestinha } from '../botao-cestinha/botao-cestinha';

/**
 * Como o total da cestinha se compara ao pedido mínimo da entrega:
 * - `sem-minimo` / `atingido`: tudo certo para o endereço que a pessoa conferiu;
 * - `faltando`: o endereço conferido tem pedido mínimo e o total ainda não chegou lá;
 * - `regra`: endereço não conferido e total abaixo do mínimo (explica a regra).
 */
type AvisoDoMinimo =
  | { tipo: 'sem-minimo' }
  | { tipo: 'atingido'; minimo: string }
  | { tipo: 'faltando'; minimo: string; falta: string }
  | { tipo: 'regra'; minimo: string; raio: string };

/**
 * A cestinha aberta: itens com quantidade, total, forma de pagamento e o botão que leva o pedido
 * pronto para o WhatsApp da loja.
 */
@Component({
  selector: 'app-gaveta-cestinha',
  imports: [Botao, BotaoCestinha, Dialogo, FormField, Icone, ImagemProduto],
  templateUrl: './gaveta-cestinha.html',
  styleUrl: './gaveta-cestinha.scss',
})
export class GavetaCestinha {
  protected readonly cestinha = inject(Cestinha);
  private readonly loja = inject(LojaStore);
  private readonly entregaDoCliente = inject(EntregaDoCliente);
  private readonly navegacao = inject(Navegacao);
  private readonly injector = inject(Injector);

  protected readonly formulario = form(this.cestinha.escolhas, (campo) => {
    required(campo.pagamento, { message: 'Escolha a forma de pagamento.' });
  });

  protected readonly formas = FORMAS_DE_PAGAMENTO;
  protected readonly maximo = QUANTIDADE_MAXIMA;
  protected readonly emReais = emReais;

  /** Depois do toque em "Enviar": a mensagem foi aberta no WhatsApp. */
  protected readonly enviado = signal(false);
  protected readonly confirmandoEsvaziar = signal(false);

  private readonly titulo = viewChild<ElementRef<HTMLElement>>('titulo');
  /** A primeira opção de pagamento (o viewChild pega a primeira do @for). */
  private readonly primeiraForma = viewChild<ElementRef<HTMLInputElement>>('opcaoDePagamento');

  protected readonly resumo = computed(() => {
    const quantidade = this.cestinha.quantidadeTotal();
    return `${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`;
  });

  protected readonly avisoDoMinimo = computed<AvisoDoMinimo | null>(() => {
    const regra = this.loja.entrega();
    if (!regra || this.cestinha.vazia()) {
      return null;
    }

    const minimoEmCentavos = Math.round(regra.pedidoMinimo * 100);
    const minimo = formatarPrecoCurto(regra.pedidoMinimo).replace(/\s/g, ' ');
    const total = this.cestinha.totalEmCentavos();

    switch (this.entregaDoCliente.situacao()) {
      case 'sem-minimo':
        return { tipo: 'sem-minimo' };
      case 'com-minimo':
        return total >= minimoEmCentavos
          ? { tipo: 'atingido', minimo }
          : { tipo: 'faltando', minimo, falta: emReais(minimoEmCentavos - total) };
      default:
        return total < minimoEmCentavos
          ? { tipo: 'regra', minimo, raio: formatarDistancia(regra.raioSemPedidoMinimoEmMetros) }
          : null;
    }
  });

  /** Sem a forma de pagamento, o toque em "Enviar" só mostra o aviso (o link ainda não existe). */
  protected readonly linkParaEnviar = computed(
    () => this.cestinha.linkDoPedido() ?? '#forma-de-pagamento',
  );

  constructor() {
    // Quando um item sai da lista pelo "−", o foco vai para o título, em vez de se perder.
    let itensAntes = 0;
    effect(() => {
      const itens = this.cestinha.itens().length;
      if (itens < itensAntes && this.cestinha.aberta()) {
        afterNextRender(() => this.titulo()?.nativeElement.focus(), { injector: this.injector });
      }
      itensAntes = itens;
    });
  }

  protected formatoDaImagem(item: ItemDaCestinha): 'miniatura' | 'quadrado' {
    return item.produto.categoria === 'cookies' ? 'miniatura' : 'quadrado';
  }

  protected fechar(): void {
    this.cestinha.fechar();
  }

  /** O <dialog> fechou (botão, Esc ou clique fora). */
  protected aoFechar(): void {
    this.cestinha.fechar();
    this.enviado.set(false);
    this.confirmandoEsvaziar.set(false);
  }

  protected enviar(evento: Event): void {
    if (this.formulario.pagamento().invalid() || !this.cestinha.linkDoPedido()) {
      evento.preventDefault();
      this.formulario.pagamento().markAsTouched();
      this.primeiraForma()?.nativeElement.focus();
      return;
    }

    // O link abre o WhatsApp em outra aba (ou no aplicativo); aqui fica a confirmação.
    this.enviado.set(true);
    afterNextRender(() => this.titulo()?.nativeElement.focus(), { injector: this.injector });
  }

  protected novoPedido(): void {
    this.cestinha.esvaziar();
    this.enviado.set(false);
    this.cestinha.fechar();
  }

  protected voltarParaACestinha(): void {
    this.enviado.set(false);
  }

  protected esvaziar(): void {
    this.cestinha.esvaziar();
    this.confirmandoEsvaziar.set(false);
    afterNextRender(() => this.titulo()?.nativeElement.focus(), { injector: this.injector });
  }

  /** Fecha a cestinha e rola até uma seção (fora da página inicial, o link segue normalmente). */
  protected irPara(evento: Event, id: string): void {
    this.cestinha.fechar();
    if (this.navegacao.naPaginaInicial()) {
      evento.preventDefault();
      setTimeout(() => this.navegacao.rolarAte(id));
    }
  }
}
