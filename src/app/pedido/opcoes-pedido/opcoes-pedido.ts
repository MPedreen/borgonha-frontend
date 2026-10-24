import { Component, computed, inject, input, output } from '@angular/core';
import { Produto } from '../../core/modelos/catalogo';
import { TipoCanalPedido } from '../../core/modelos/loja';
import { Pedido } from '../../core/pedido/pedido';
import { Icone } from '../../ui/icone/icone';
import { NomeIcone } from '../../ui/icone/nomes-icones';

const ICONE_DO_CANAL: Record<TipoCanalPedido, NomeIcone> = {
  whatsapp: 'whatsapp',
  ifood: 'ifood',
  'loja-fisica': 'map-pin',
};

/** Os canais de pedido (WhatsApp, iFood, loja física). Usado no painel e na seção "Faça seu pedido". */
@Component({
  selector: 'app-opcoes-pedido',
  imports: [Icone],
  templateUrl: './opcoes-pedido.html',
  styleUrl: './opcoes-pedido.scss',
})
export class OpcoesPedido {
  private readonly pedido = inject(Pedido);

  /** Produto escolhido ("Quero esse"), que vai na mensagem do WhatsApp. */
  readonly produto = input<Produto | null>(null);

  /** Avisa qual canal foi escolhido (o painel aproveita para fechar). */
  readonly escolheu = output<TipoCanalPedido>();

  protected readonly opcoes = computed(() => this.pedido.opcoesPara(this.produto()));
  protected readonly iconeDoCanal = ICONE_DO_CANAL;
}
