import { ViewportScroller } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraAviso } from './layout/barra-aviso/barra-aviso';
import { BarraPedidoCelular } from './layout/barra-pedido-celular/barra-pedido-celular';
import { Cabecalho } from './layout/cabecalho/cabecalho';
import { Rodape } from './layout/rodape/rodape';
import { PainelPedido } from './pedido/painel-pedido/painel-pedido';

/** Distância que a rolagem para as âncoras deixa livre para o cabeçalho fixo. */
const ESPACO_DO_CABECALHO_PX = 96;

@Component({
  selector: 'app-root',
  imports: [BarraAviso, BarraPedidoCelular, Cabecalho, PainelPedido, Rodape, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    inject(ViewportScroller).setOffset([0, ESPACO_DO_CABECALHO_PX]);
  }

  protected pularParaConteudo(evento: Event, conteudo: HTMLElement): void {
    evento.preventDefault();
    conteudo.focus();
  }
}
