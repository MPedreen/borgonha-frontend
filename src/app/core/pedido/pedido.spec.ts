import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { COOKIE_NUTELLA, LOJA } from '../../../testing/dados-de-teste';
import { LojaStore } from '../estado/loja-store';
import { Pedido } from './pedido';

describe('Pedido', () => {
  let pedido: Pedido;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: LojaStore, useValue: { canaisPedido: signal(LOJA.canaisPedido) } }],
    });
    pedido = TestBed.inject(Pedido);
  });

  it('abre e fecha o painel lembrando o produto escolhido', () => {
    pedido.abrir(COOKIE_NUTELLA);
    expect(pedido.aberto()).toBe(true);
    expect(pedido.produto()).toBe(COOKIE_NUTELLA);

    pedido.fechar();
    expect(pedido.aberto()).toBe(false);
  });

  it('abre sem produto pelos botões gerais', () => {
    pedido.abrir();

    expect(pedido.produto()).toBeNull();
  });

  it('monta as opções na ordem da API, com o produto só no link do WhatsApp', () => {
    const opcoes = pedido.opcoesPara(COOKIE_NUTELLA);

    expect(opcoes.map((opcao) => opcao.tipo)).toEqual(['whatsapp', 'ifood', 'loja-fisica']);
    expect(opcoes[0].link).toContain('Quero%3A%20Cookie%20Nutella');
    expect(opcoes[1].link).toBe(LOJA.canaisPedido[1].url);
    expect(opcoes[2].link).toBe('https://maps.app.goo.gl/etqznn6CLoQ8DE68A');
  });
});
