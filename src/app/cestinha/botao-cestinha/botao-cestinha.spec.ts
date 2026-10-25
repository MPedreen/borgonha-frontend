import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { criarProduto, LOJA } from '../../../testing/dados-de-teste';
import { Cestinha } from '../../core/cestinha/cestinha';
import { CatalogoStore } from '../../core/estado/catalogo-store';
import { LojaStore } from '../../core/estado/loja-store';
import { Produto } from '../../core/modelos/catalogo';
import { BotaoCestinha } from './botao-cestinha';

const NUTELLA = criarProduto({ slug: 'nutella', nome: 'Nutella', preco: 15 });
const BOLO_DE_POTE = criarProduto({
  slug: 'bolo-de-pote',
  nome: 'Bolo de pote',
  categoria: 'doces',
  preco: 12,
  variacoes: ['Chocolate & Maracujá', 'Nutella & Ninho'],
});

describe('BotaoCestinha', () => {
  let fixture: ComponentFixture<BotaoCestinha>;
  let elemento: HTMLElement;
  let cestinha: Cestinha;

  const botao = (rotulo: RegExp) =>
    Array.from(elemento.querySelectorAll<HTMLButtonElement>('button')).find((candidato) =>
      rotulo.test(candidato.getAttribute('aria-label') ?? ''),
    );
  const quantidade = () => elemento.querySelector('.seletor__quantidade')?.textContent?.trim();

  async function renderizar(produto: Produto, variacao: string | null = null): Promise<void> {
    fixture.componentRef.setInput('produto', produto);
    fixture.componentRef.setInput('variacao', variacao);
    await fixture.whenStable();
  }

  async function clicar(rotulo: RegExp): Promise<void> {
    botao(rotulo)!.click();
    await fixture.whenStable();
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CatalogoStore,
          useValue: { produtos: signal([NUTELLA, BOLO_DE_POTE]), atualizado: signal(false) },
        },
        { provide: LojaStore, useValue: { canaisPedido: signal(LOJA.canaisPedido) } },
      ],
    });
    cestinha = TestBed.inject(Cestinha);
    fixture = TestBed.createComponent(BotaoCestinha);
    elemento = fixture.nativeElement;
    document.body.appendChild(elemento);
  });

  afterEach(() => elemento.remove());

  it('adiciona à cestinha e vira o seletor de quantidade, com o foco no "+"', async () => {
    await renderizar(NUTELLA);

    await clicar(/Adicionar Cookie Nutella à cestinha/);

    expect(cestinha.quantidadeDe(NUTELLA)).toBe(1);
    expect(quantidade()).toContain('1');
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'Aumentar a quantidade de Cookie Nutella',
    );
  });

  it('aumenta, diminui e, no último, tira da cestinha com a lixeira', async () => {
    await renderizar(NUTELLA);
    await clicar(/Adicionar/);
    await clicar(/Aumentar/);
    expect(quantidade()).toContain('2');

    await clicar(/Diminuir a quantidade de Cookie Nutella/);
    expect(botao(/Tirar Cookie Nutella da cestinha/)).toBeDefined();

    await clicar(/Tirar Cookie Nutella da cestinha/);
    expect(cestinha.quantidadeDe(NUTELLA)).toBe(0);
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'Adicionar Cookie Nutella à cestinha',
    );
  });

  it('não passa do máximo', async () => {
    await renderizar(NUTELLA);
    cestinha.alterarQuantidade(NUTELLA, null, 20);
    await fixture.whenStable();

    expect(botao(/Aumentar/)!.disabled).toBe(true);
  });

  it('fica desabilitado quando o produto esgota', async () => {
    await renderizar({ ...NUTELLA, disponivel: false });

    expect(botao(/Adicionar/)!.disabled).toBe(true);
  });

  it('pede o sabor antes de adicionar um produto com variações', async () => {
    await renderizar(BOLO_DE_POTE);
    const avisos: unknown[] = [];
    fixture.componentInstance.faltouVariacao.subscribe(() => avisos.push(true));

    await clicar(/Adicionar Bolo de pote à cestinha/);

    expect(avisos).toHaveLength(1);
    expect(cestinha.vazia()).toBe(true);
  });

  it('adiciona o sabor escolhido', async () => {
    await renderizar(BOLO_DE_POTE, 'Nutella & Ninho');

    await clicar(/Adicionar Bolo de pote – Nutella & Ninho à cestinha/);

    expect(cestinha.quantidadeDe(BOLO_DE_POTE, 'Nutella & Ninho')).toBe(1);
  });
});
