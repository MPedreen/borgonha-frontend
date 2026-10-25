import { IMAGE_LOADER } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BOLO_DE_POTE, COOKIE_NUTELLA, COXINHA, LOJA } from '../../../testing/dados-de-teste';
import { Cestinha } from '../../core/cestinha/cestinha';
import { CatalogoStore } from '../../core/estado/catalogo-store';
import { LojaStore } from '../../core/estado/loja-store';
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
      providers: [
        { provide: IMAGE_LOADER, useValue: carregadorDeImagens },
        { provide: CatalogoStore, useValue: { produtos: signal([]), atualizado: signal(false) } },
        { provide: LojaStore, useValue: { canaisPedido: signal(LOJA.canaisPedido) } },
      ],
    });
    fixture = TestBed.createComponent(CartaoProduto);
    elemento = fixture.nativeElement;
    document.body.appendChild(elemento);
  });

  it('mostra nome, descrição e a foto do produto', async () => {
    await renderizar(COOKIE_NUTELLA);

    expect(elemento.querySelector('h3')?.textContent).toContain('Nutella');
    expect(elemento.textContent).toContain(COOKIE_NUTELLA.descricao);
    expect(elemento.querySelector('img')?.getAttribute('alt')).toBe(
      'Cookie de Nutella visto de cima',
    );
  });

  it('sem descrição, mostra só o nome, o preço e o botão', async () => {
    await renderizar({ ...COOKIE_NUTELLA, descricao: null, preco: 19 });

    expect(elemento.querySelector('.cartao__descricao')).toBeNull();
    expect(elemento.querySelector('.cartao__preco')?.textContent?.replace(/\s+/g, ' ')).toContain(
      '19,00',
    );
  });

  it('mostra a gramatura mesmo sem preço', async () => {
    await renderizar({ ...COOKIE_NUTELLA, peso: '130g' });

    expect(elemento.querySelector('.cartao__peso')?.textContent?.trim()).toBe('130g');
    expect(elemento.querySelector('.cartao__preco')).toBeNull();
  });

  it('com preço, mostra a gramatura ao lado dele', async () => {
    await renderizar({ ...COOKIE_NUTELLA, preco: 14, peso: '130g' });

    const preco = elemento.querySelector('.cartao__preco')?.textContent?.replace(/\s+/g, ' ');
    expect(preco).toContain('130g');
    expect(elemento.querySelectorAll('.cartao__peso')).toHaveLength(1);
  });

  afterEach(() => elemento.remove());

  it('com preço, o produto vai para a cestinha', async () => {
    await renderizar({ ...COOKIE_NUTELLA, preco: 15 });

    const adicionar = elemento.querySelector<HTMLButtonElement>('app-botao-cestinha button')!;
    expect(adicionar.getAttribute('aria-label')).toBe('Adicionar Cookie Nutella à cestinha');
    expect(elemento.textContent).not.toContain('Quero esse');

    adicionar.click();
    await fixture.whenStable();
    expect(TestBed.inject(Cestinha).quantidadeTotal()).toBe(0); // o cardápio de teste está vazio
  });

  it('com sabores, pede o sabor antes de adicionar', async () => {
    await renderizar({ ...BOLO_DE_POTE, preco: 12 }, 'padrao');
    const sabores = Array.from(elemento.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    expect(sabores.map((sabor) => sabor.value)).toEqual([
      'Chocolate & Maracujá',
      'Nutella & Ninho',
    ]);

    elemento.querySelector<HTMLButtonElement>('app-botao-cestinha button')!.click();
    await fixture.whenStable();

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain('Escolha um sabor');
    expect(document.activeElement).toBe(sabores[0]);

    sabores[1].click();
    await fixture.whenStable();
    expect(elemento.querySelector('[role="alert"]')).toBeNull();
    expect(elemento.querySelector('app-botao-cestinha button')?.getAttribute('aria-label')).toBe(
      'Adicionar Bolo de pote – Nutella & Ninho à cestinha',
    );
  });

  it('sem preço, o "Quero esse" continua levando ao painel de pedido', async () => {
    await renderizar(COOKIE_NUTELLA);
    expect(botao().textContent).toContain('Quero esse');
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
