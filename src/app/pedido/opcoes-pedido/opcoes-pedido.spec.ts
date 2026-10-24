import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COOKIE_NUTELLA, LOJA } from '../../../testing/dados-de-teste';
import { LojaStore } from '../../core/estado/loja-store';
import { TipoCanalPedido } from '../../core/modelos/loja';
import { OpcoesPedido } from './opcoes-pedido';

describe('OpcoesPedido', () => {
  let fixture: ComponentFixture<OpcoesPedido>;
  let elemento: HTMLElement;

  const links = () => Array.from(elemento.querySelectorAll<HTMLAnchorElement>('a'));

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: LojaStore, useValue: { canaisPedido: signal(LOJA.canaisPedido) } }],
    });
    fixture = TestBed.createComponent(OpcoesPedido);
    elemento = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('mostra WhatsApp, iFood e loja física com os links da Borgonha', () => {
    expect(links().map((link) => link.getAttribute('href'))).toEqual([
      'https://wa.me/5521974509789?text=Ol%C3%A1!%0ADesejo%20fazer%20meu%20pedido!',
      LOJA.canaisPedido[1].url,
      'https://maps.app.goo.gl/etqznn6CLoQ8DE68A',
    ]);
    expect(elemento.textContent).toContain(
      'MELHORES PREÇOS, entrega exclusiva em Santa Luzia e região com frete grátis!',
    );
  });

  it('abre os canais em uma nova aba, avisando quem usa leitor de tela', () => {
    for (const link of links()) {
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener');
      expect(link.textContent).toContain('(abre em nova aba)');
    }
  });

  it('leva o produto escolhido para a mensagem do WhatsApp', async () => {
    fixture.componentRef.setInput('produto', COOKIE_NUTELLA);
    await fixture.whenStable();

    expect(links()[0].getAttribute('href')).toContain('%0AQuero%3A%20Cookie%20Nutella');
  });

  it('avisa qual canal foi escolhido', () => {
    const escolhidos: TipoCanalPedido[] = [];
    fixture.componentInstance.escolheu.subscribe((tipo) => escolhidos.push(tipo));
    const ifood = links()[1];
    ifood.addEventListener('click', (evento) => evento.preventDefault());

    ifood.click();

    expect(escolhidos).toEqual(['ifood']);
  });
});
