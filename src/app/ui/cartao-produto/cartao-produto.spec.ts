import { IMAGE_LOADER } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BOLO_DE_POTE, COOKIE_NUTELLA, COXINHA } from '../../../testing/dados-de-teste';
import { carregadorDeImagens } from '../../core/imagens/carregador-de-imagens';
import { Produto } from '../../core/modelos/catalogo';
import { CartaoProduto, VarianteCartao } from './cartao-produto';

describe('CartaoProduto', () => {
  let fixture: ComponentFixture<CartaoProduto>;
  let elemento: HTMLElement;

  async function renderizar(produto: Produto, variante: VarianteCartao = 'cookie'): Promise<void> {
    fixture.componentRef.setInput('produto', produto);
    fixture.componentRef.setInput('variante', variante);
    await fixture.whenStable();
  }

  const botao = () => elemento.querySelector<HTMLButtonElement>('button')!;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: IMAGE_LOADER, useValue: carregadorDeImagens }],
    });
    fixture = TestBed.createComponent(CartaoProduto);
    elemento = fixture.nativeElement;
  });

  it('mostra nome, descrição e a foto do produto', async () => {
    await renderizar(COOKIE_NUTELLA);

    expect(elemento.querySelector('h3')?.textContent).toContain('Nutella');
    expect(elemento.textContent).toContain(COOKIE_NUTELLA.descricao);
    expect(elemento.querySelector('img')?.getAttribute('alt')).toBe(
      'Cookie de Nutella visto de cima',
    );
  });

  it('avisa quando a pessoa clica em "Quero esse"', async () => {
    await renderizar(COOKIE_NUTELLA);
    const pedidos: Produto[] = [];
    fixture.componentInstance.pedir.subscribe((produto) => pedidos.push(produto));

    botao().click();

    expect(pedidos).toEqual([COOKIE_NUTELLA]);
  });

  it('dá ao botão um nome que diz qual é o produto', async () => {
    await renderizar(COOKIE_NUTELLA);

    expect(botao().getAttribute('aria-label')).toBe('Quero esse: Cookie Nutella');
  });

  it('não deixa pedir um produto esgotado', async () => {
    await renderizar({ ...COOKIE_NUTELLA, disponivel: false });

    expect(botao().disabled).toBe(true);
    expect(elemento.textContent).toContain('Esgotado hoje');
  });

  it('lista os sabores de um produto com variações', async () => {
    await renderizar(BOLO_DE_POTE, 'padrao');

    const sabores = Array.from(elemento.querySelectorAll('.cartao__variacoes li'), (item) =>
      item.textContent?.trim(),
    );
    expect(sabores).toEqual(['Chocolate & Maracujá', 'Nutella & Ninho']);
  });

  it('na versão tipográfica não reserva espaço para foto', async () => {
    await renderizar(COXINHA, 'tipografico');

    expect(elemento.querySelector('app-imagem-produto')).toBeNull();
    expect(elemento.querySelector('h3')?.textContent).toContain('Coxinha de frango com catupiry');
  });
});
