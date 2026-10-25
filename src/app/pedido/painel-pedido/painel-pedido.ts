import { Component, computed, inject } from '@angular/core';
import { formatarDistancia } from '../../core/entrega/consulta-entrega';
import { LojaStore } from '../../core/estado/loja-store';
import { formatarPrecoCurto } from '../../core/formatacao/formatacao';
import { Navegacao } from '../../core/navegacao/navegacao';
import { nomeNoPedido } from '../../core/pedido/mensagem-whatsapp';
import { Pedido } from '../../core/pedido/pedido';
import { Dialogo } from '../../ui/dialogo/dialogo';
import { Icone } from '../../ui/icone/icone';
import { OpcoesPedido } from '../opcoes-pedido/opcoes-pedido';

/** O painel "Faça seu pedido", aberto por qualquer botão de pedido do site. */
@Component({
  selector: 'app-painel-pedido',
  imports: [Dialogo, Icone, OpcoesPedido],
  templateUrl: './painel-pedido.html',
  styleUrl: './painel-pedido.scss',
})
export class PainelPedido {
  protected readonly pedido = inject(Pedido);
  protected readonly loja = inject(LojaStore);
  private readonly navegacao = inject(Navegacao);

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

  /** Fecha o painel e leva até a consulta de endereço (fora da página inicial, o link segue normalmente). */
  protected conferirEndereco(evento: Event): void {
    this.pedido.fechar();
    if (this.navegacao.naPaginaInicial()) {
      evento.preventDefault();
      setTimeout(() => this.navegacao.rolarAte('entrega'));
    }
  }
}
