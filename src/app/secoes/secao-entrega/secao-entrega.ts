import { Component, computed, inject } from '@angular/core';
import { formatarDistancia } from '../../core/entrega/consulta-entrega';
import { LojaStore } from '../../core/estado/loja-store';
import { formatarPrecoCurto } from '../../core/formatacao/formatacao';
import { CabecalhoSecao } from '../../ui/cabecalho-secao/cabecalho-secao';
import { Icone } from '../../ui/icone/icone';
import { ConsultaEntrega } from './consulta-entrega/consulta-entrega';

/**
 * "Entrega": a regra do pedido mínimo (grátis até o raio da loja; mais longe, a partir do valor mínimo)
 * e a consulta do endereço. Só aparece se a loja tiver regra de entrega.
 */
@Component({
  selector: 'app-secao-entrega',
  imports: [CabecalhoSecao, ConsultaEntrega, Icone],
  templateUrl: './secao-entrega.html',
  styleUrl: './secao-entrega.scss',
})
export class SecaoEntrega {
  protected readonly loja = inject(LojaStore);

  protected readonly raio = computed(() => {
    const regra = this.loja.entrega();
    return regra ? formatarDistancia(regra.raioSemPedidoMinimoEmMetros) : '';
  });

  protected readonly pedidoMinimo = computed(() => {
    const regra = this.loja.entrega();
    return regra ? formatarPrecoCurto(regra.pedidoMinimo) : '';
  });
}
