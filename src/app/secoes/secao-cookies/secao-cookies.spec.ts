import { IMAGE_LOADER } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COOKIE_NUTELLA, COOKIE_RED_VELVET } from '../../../testing/dados-de-teste';
import { CatalogoStore } from '../../core/estado/catalogo-store';
import { carregadorDeImagens } from '../../core/imagens/carregador-de-imagens';
import { Produto } from '../../core/modelos/catalogo';
import { Navegacao } from '../../core/navegacao/navegacao';
import { Pedido } from '../../core/pedido/pedido';
import { SecaoCookies } from './secao-cookies';

describe('SecaoCookies', () => {
  let fixture: ComponentFixture<SecaoCookies>;
  let elemento: HTMLElement;

  const catalogo = {
    cookies: signal<Produto[]>([COOKIE_NUTELLA, COOKIE_RED_VELVET]),
    carregando: signal(false),
    indisponivel: signal(false),
    recarregar: vi.fn(),
  };
  const pedido = { abrir: vi.fn() };

  beforeEach(async () => {
    catalogo.carregando.set(false);
    catalogo.indisponivel.set(false);
    pedido.abrir.mockClear();
    catalogo.recarregar.mockClear();

    TestBed.configureTestingModule({
      providers: [
        { provide: CatalogoStore, useValue: catalogo },
        { provide: Pedido, useValue: pedido },
        { provide: Navegacao, useValue: { produtoDestacado: signal(null) } },
        { provide: IMAGE_LOADER, useValue: carregadorDeImagens },
      ],
    });
    fixture = TestBed.createComponent(SecaoCookies);
    elemento = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('mostra um card por sabor, cada um com a sua âncora', () => {
    expect(Array.from(elemento.querySelectorAll('.grade li'), (item) => item.id)).toEqual([
      'produto-nutella',
      'produto-red-velvet',
    ]);
    expect(elemento.textContent).toContain('2 sabores recheados');
  });

  it('abre o painel de pedido com o sabor escolhido', () => {
    elemento
      .querySelector<HTMLButtonElement>('button[aria-label="Quero esse: Cookie Nutella"]')!
      .click();

    expect(pedido.abrir).toHaveBeenCalledWith(COOKIE_NUTELLA);
  });

  it('oferece tentar de novo quando o cardápio não carrega', async () => {
    catalogo.indisponivel.set(true);
    await fixture.whenStable();

    expect(elemento.textContent).toContain('Não conseguimos carregar o cardápio agora.');
    elemento.querySelector<HTMLButtonElement>('.indisponivel button')!.click();
    expect(catalogo.recarregar).toHaveBeenCalled();
  });
});
