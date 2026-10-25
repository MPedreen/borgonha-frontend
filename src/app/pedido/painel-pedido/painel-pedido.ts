import { Component, computed, inject } from '@angular/core';
import { Cestinha } from '../../core/cestinha/cestinha';
import { emReais } from '../../core/cestinha/mensagem-do-pedido';
import { formatarDistancia } from '../../core/entrega/consulta-entrega';
import { LojaStore } from '../../core/estado/loja-store';
import { formatarPrecoCurto } from '../../core/formatacao/formatacao';
import { Navegacao } from '../../core/navegacao/navegacao';
import { nomeNoPedido } from '../../core/pedido/mensagem-whatsapp';
import { Pedido } from '../../core/pedido/pedido';
import { Botao } from '../../ui/botao/botao';
import { Dialogo } from '../../ui/dialogo/dialogo';
import { Icone } from '../../ui/icone/icone';
import { OpcoesPedido } from '../opcoes-pedido/opcoes-pedido';

/** O painel "Faça seu pedido", aberto por qualquer botão de pedido do site. */
@Component({
  selector: 'app-painel-pedido',
  imports: [Botao, Dialogo, Icone, OpcoesPedido],
  templateUrl: './painel-pedido.html',
  styleUrl: './painel-pedido.scss',
})
export class PainelPedido {
  protected readonly pedido = inject(Pedido);
  protected readonly loja = inject(LojaStore);
  private readonly navegacao = inject(Navegacao);
  protected readonly cestinha = inject(Cestinha);

  protected readonly totalDaCestinha = computed(() => emReais(this.cestinha.totalEmCentavos()));
  protected readonly resumoDaCestinha = computed(() => {
    const quantidade = this.cestinha.quantidadeTotal();
    return `${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`;
  });

  protected readonly produtoEscolhido = computed(() => {
    const produto = this.pedido.produto();
    return produto ? nomeNoPedido(produto) : null;
  });

  protected readonly entrega = computed(() => {
    const regra = this.loja.entrega();
    return regra
      ? {
          raio: formatarDistancia(regra.raioSemPedidoMinimoEmMetros),
          pedidoMinimo: formatarPrecoCurto(regra.pedidoMinimo),
        }
      : null;
  });

  /** Fecha o painel e abre a cestinha (depois que o painel fechou, para os dois diálogos não se atropelarem). */
  protected revisarCestinha(): void {
    this.pedido.fechar();
    setTimeout(() => this.cestinha.abrir());
  }

  /** Fecha o painel e leva até a consulta de endereço (fora da página inicial, o link segue normalmente). */
  protected conferirEndereco(evento: Event): void {
    this.pedido.fechar();
    if (this.navegacao.naPaginaInicial()) {
      evento.preventDefault();
      setTimeout(() => this.navegacao.rolarAte('entrega'));
    }
  }
}
