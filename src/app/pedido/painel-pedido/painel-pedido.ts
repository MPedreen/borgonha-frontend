import { Component, computed, inject } from '@angular/core';
import { LojaStore } from '../../core/estado/loja-store';
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

  protected readonly produtoEscolhido = computed(() => {
    const produto = this.pedido.produto();
    return produto ? nomeNoPedido(produto) : null;
  });
}
