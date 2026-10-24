import { IMAGE_LOADER } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COOKIE_NUTELLA, COOKIE_RED_VELVET } from '../../../../testing/dados-de-teste';
import { CatalogoStore } from '../../../core/estado/catalogo-store';
import { carregadorDeImagens } from '../../../core/imagens/carregador-de-imagens';
import { Navegacao } from '../../../core/navegacao/navegacao';
import { MenuSabores } from './menu-sabores';

describe('MenuSabores', () => {
  let fixture: ComponentFixture<MenuSabores>;
  let elemento: HTMLElement;
  const navegacao = { irPara: vi.fn(), irParaProduto: vi.fn() };

  const gatilho = () => elemento.querySelector<HTMLButtonElement>('button')!;
  const painel = () => elemento.querySelector<HTMLElement>('#painel-sabores')!;

  beforeEach(async () => {
    navegacao.irParaProduto.mockClear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CatalogoStore,
          useValue: { cookies: signal([COOKIE_NUTELLA, COOKIE_RED_VELVET]) },
        },
        { provide: Navegacao, useValue: navegacao },
        { provide: IMAGE_LOADER, useValue: carregadorDeImagens },
      ],
    });
    fixture = TestBed.createComponent(MenuSabores);
    elemento = fixture.nativeElement;
    document.body.appendChild(elemento);
    await fixture.whenStable();
  });

  afterEach(() => elemento.remove());

  it('lista todos os sabores, com a frase de cada um', () => {
    const sabores = Array.from(painel().querySelectorAll('.sabor__nome'), (nome) =>
      nome.textContent?.trim(),
    );

    expect(sabores).toEqual(['Nutella', 'Red Velvet']);
    expect(painel().textContent).toContain('Recheado de Nutella. Precisa dizer mais?');
  });

  it('abre pelo teclado e fecha com Esc, devolvendo o foco ao botão', async () => {
    expect(painel().hidden).toBe(true);

    gatilho().focus();
    gatilho().click();
    await fixture.whenStable();
    expect(gatilho().getAttribute('aria-expanded')).toBe('true');
    expect(painel().hidden).toBe(false);

    elemento.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(gatilho().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(gatilho());
  });

  it('leva até o card do sabor escolhido e fecha o menu', async () => {
    gatilho().click();
    await fixture.whenStable();

    painel().querySelector<HTMLAnchorElement>('a[href="/#produto-red-velvet"]')!.click();
    await fixture.whenStable();

    expect(navegacao.irParaProduto).toHaveBeenCalledWith(expect.any(Event), 'red-velvet');
    expect(painel().hidden).toBe(true);
  });
});
