import { IMAGE_LOADER } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { criarProduto } from '../../../testing/dados-de-teste';
import { CatalogoStore } from '../../core/estado/catalogo-store';
import { carregadorDeImagens } from '../../core/imagens/carregador-de-imagens';
import { Produto } from '../../core/modelos/catalogo';
import { Pedido } from '../../core/pedido/pedido';
import { SecaoDoces } from './secao-doces';

const doces = (quantidade: number): Produto[] =>
  Array.from({ length: quantidade }, (_, indice) =>
    criarProduto({ slug: `doce-${indice + 1}`, nome: `Doce ${indice + 1}`, categoria: 'doces' }),
  );

describe('SecaoDoces', () => {
  let fixture: ComponentFixture<SecaoDoces>;
  let elemento: HTMLElement;
  const catalogo = { doces: signal<Produto[]>([]) };

  const itens = () => Array.from(elemento.querySelectorAll<HTMLLIElement>('.doces > li'));
  const visiveis = () => itens().filter((item) => !item.hidden);
  const botaoVerTodos = () => elemento.querySelector<HTMLButtonElement>('.doces__mais button');

  async function renderizar(quantidade: number): Promise<void> {
    catalogo.doces.set(doces(quantidade));
    fixture = TestBed.createComponent(SecaoDoces);
    elemento = fixture.nativeElement;
    document.body.appendChild(elemento);
    await fixture.whenStable();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CatalogoStore, useValue: catalogo },
        { provide: Pedido, useValue: { abrir: vi.fn() } },
        { provide: IMAGE_LOADER, useValue: carregadorDeImagens },
      ],
    });
  });

  afterEach(() => elemento.remove());

  it('mostra todos os doces num cardápio curto, sem o botão "Ver todos"', async () => {
    await renderizar(3);

    expect(visiveis()).toHaveLength(3);
    expect(botaoVerTodos()).toBeNull();
  });

  it('com muitos doces, mostra os 6 primeiros e deixa os outros no HTML, escondidos', async () => {
    await renderizar(30);

    expect(itens()).toHaveLength(30);
    expect(visiveis()).toHaveLength(6);
    expect(botaoVerTodos()?.textContent).toContain('Ver todos os doces (30)');
    expect(botaoVerTodos()?.getAttribute('aria-expanded')).toBe('false');
  });

  it('"Ver todos" mostra o cardápio inteiro e leva o foco ao primeiro doce que apareceu', async () => {
    await renderizar(10);

    botaoVerTodos()!.click();
    await fixture.whenStable();

    expect(visiveis()).toHaveLength(10);
    expect(botaoVerTodos()?.getAttribute('aria-expanded')).toBe('true');
    expect(botaoVerTodos()?.textContent).toContain('Mostrar menos');
    expect(document.activeElement?.textContent).toContain('Doce 7');

    botaoVerTodos()!.click();
    await fixture.whenStable();

    expect(visiveis()).toHaveLength(6);
  });

  it('usa o card compacto, com a foto em miniatura', async () => {
    await renderizar(2);

    const cartao = elemento.querySelector('app-cartao-produto');
    expect(cartao?.getAttribute('data-variante')).toBe('padrao');
    expect(cartao?.querySelector('app-imagem-produto')?.getAttribute('data-formato')).toBe(
      'quadrado',
    );
  });
});
