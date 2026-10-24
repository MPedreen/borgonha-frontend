import { Component, inject } from '@angular/core';
import { LojaStore } from '../../core/estado/loja-store';
import { OpcoesPedido } from '../../pedido/opcoes-pedido/opcoes-pedido';
import { Botao } from '../../ui/botao/botao';
import { CabecalhoSecao } from '../../ui/cabecalho-secao/cabecalho-secao';
import { Icone } from '../../ui/icone/icone';

/**
 * "Faça seu pedido / Onde estamos": os canais de pedido e os dados da loja física.
 * PENDENTE: foto da fachada da loja (entra no card "Nossa loja" quando chegar).
 */
@Component({
  selector: 'app-secao-como-pedir',
  imports: [Botao, CabecalhoSecao, Icone, OpcoesPedido],
  templateUrl: './secao-como-pedir.html',
  styleUrl: './secao-como-pedir.scss',
})
export class SecaoComoPedir {
  protected readonly loja = inject(LojaStore);
}
