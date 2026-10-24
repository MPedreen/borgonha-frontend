import { ViewportScroller } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PainelPedido } from '../../pedido/painel-pedido/painel-pedido';
import { BarraAviso } from '../barra-aviso/barra-aviso';
import { BarraPedidoCelular } from '../barra-pedido-celular/barra-pedido-celular';
import { Cabecalho } from '../cabecalho/cabecalho';
import { Rodape } from '../rodape/rodape';

/** Distância que a rolagem para as âncoras deixa livre para o cabeçalho fixo. */
const ESPACO_DO_CABECALHO_PX = 96;

/**
 * Estrutura das páginas do site: aviso, cabeçalho, conteúdo, rodapé, barra fixa e painel de pedido.
 * A área do administrador tem a própria estrutura.
 */
@Component({
  selector: 'app-layout-site',
  imports: [BarraAviso, BarraPedidoCelular, Cabecalho, PainelPedido, Rodape, RouterOutlet],
  templateUrl: './layout-site.html',
  styleUrl: './layout-site.scss',
})
export class LayoutSite {
  constructor() {
    inject(ViewportScroller).setOffset([0, ESPACO_DO_CABECALHO_PX]);
  }

  protected pularParaConteudo(evento: Event, conteudo: HTMLElement): void {
    evento.preventDefault();
    conteudo.focus();
  }
}
