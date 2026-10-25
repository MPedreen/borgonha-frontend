import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { criarProduto, LOJA } from '../../../testing/dados-de-teste';
import { Cestinha } from '../../core/cestinha/cestinha';
import { EntregaDoCliente } from '../../core/entrega/entrega-do-cliente';
import { CatalogoStore } from '../../core/estado/catalogo-store';
import { LojaStore } from '../../core/estado/loja-store';
import { GavetaCestinha } from './gaveta-cestinha';

const NUTELLA = criarProduto({ slug: 'nutella', nome: 'Nutella', preco: 15 });
const BROOKIE = criarProduto({ slug: 'brookie', nome: 'Brookie', categoria: 'doces', preco: 15 });
const TRADICIONAL = criarProduto({ slug: 'tradicional', nome: 'Tradicional', preco: 10 });

describe('GavetaCestinha', () => {
  let fixture: ComponentFixture<GavetaCestinha>;
  let elemento: HTMLElement;
  let cestinha: Cestinha;
  const produtos = signal([TRADICIONAL, NUTELLA, BROOKIE]);
  const atualizado = signal(false);

  const texto = (seletor: string) =>
    elemento.querySelector(seletor)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const botao = (nome: string) =>
    Array.from(elemento.querySelectorAll<HTMLElement>('button, a')).find((candidato) =>
      candidato.textContent?.includes(nome),
    );
  const enviar = () => botao('Enviar pelo WhatsApp') as HTMLAnchorElement;

  beforeEach(async () => {
    // O jsdom ainda não sabe abrir <dialog>.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
    localStorage.clear();
    produtos.set([TRADICIONAL, NUTELLA, BROOKIE]);
    atualizado.set(false);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: CatalogoStore,
          useValue: { produtos, atualizado },
        },
        {
          provide: LojaStore,
          useValue: { canaisPedido: signal(LOJA.canaisPedido), entrega: signal(LOJA.entrega) },
        },
      ],
    });
    cestinha = TestBed.inject(Cestinha);
    fixture = TestBed.createComponent(GavetaCestinha);
    elemento = fixture.nativeElement;
    document.body.appendChild(elemento);
    cestinha.abrir();
    await fixture.whenStable();
  });

  afterEach(() => elemento.remove());

  async function montarPedido(): Promise<void> {
    cestinha.adicionar(NUTELLA);
    cestinha.adicionar(NUTELLA);
    cestinha.adicionar(BROOKIE);
    await fixture.whenStable();
  }

  it('vazia, explica como montar a cestinha', () => {
    expect(texto('.vazia')).toContain('Sua cestinha está vazia');
    expect(botao('Ver o cardápio')).toBeDefined();
  });

  it('lista os itens com o preço de cada, os subtotais e o total', async () => {
    await montarPedido();

    const itens = Array.from(elemento.querySelectorAll('.item'), (item) =>
      item.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(itens[0]).toContain('Cookie Nutella');
    expect(itens[0]).toContain('R$ 15,00 cada');
    expect(itens[0]).toContain('R$ 30,00');
    expect(itens[1]).toContain('Brookie');
    expect(texto('.total')).toBe('Total (3 itens): R$ 45,00');
  });

  it('pede a forma de pagamento antes de enviar', async () => {
    await montarPedido();

    const clique = new MouseEvent('click', { bubbles: true, cancelable: true });
    enviar().dispatchEvent(clique);
    await fixture.whenStable();

    expect(clique.defaultPrevented).toBe(true);
    expect(texto('.pagamento__erro')).toBe('Escolha a forma de pagamento.');
    expect((document.activeElement as HTMLInputElement).value).toBe('pix');
  });

  it('com a forma de pagamento, o botão leva o pedido pronto para o WhatsApp da loja', async () => {
    await montarPedido();

    const debito = elemento.querySelector<HTMLInputElement>('input[value="debito"]')!;
    debito.click();
    await fixture.whenStable();

    const link = new URL(enviar().href);
    expect(link.origin + link.pathname).toBe('https://wa.me/5521974509789');
    expect(link.searchParams.get('text')).toContain('2x Cookie Nutella (R$ 30,00)');
    expect(link.searchParams.get('text')).toContain('Valor total: R$ 45,00');
    expect(link.searchParams.get('text')).toContain('Forma de pagamento: Débito');
    expect(enviar().target).toBe('_blank');
  });

  it('depois de enviar, mostra o que falta fazer no WhatsApp e deixa começar um pedido novo', async () => {
    await montarPedido();
    elemento.querySelector<HTMLInputElement>('input[value="pix"]')!.click();
    await fixture.whenStable();

    // O link abriria o WhatsApp; aqui só interessa a resposta da cestinha.
    enviar().addEventListener('click', (evento) => evento.preventDefault());
    enviar().click();
    await fixture.whenStable();

    expect(texto('.enviado')).toContain('Agora é só enviar no WhatsApp');
    botao('Esvaziar a cestinha')!.click();
    await fixture.whenStable();

    expect(cestinha.vazia()).toBe(true);
    expect(cestinha.aberta()).toBe(false);
  });

  it('confirma antes de esvaziar', async () => {
    await montarPedido();

    botao('Esvaziar cestinha')!.click();
    await fixture.whenStable();
    expect(texto('.esvaziar')).toContain('Tirar todos os itens da cestinha?');
    expect(cestinha.vazia()).toBe(false);

    botao('Sim, esvaziar')!.click();
    await fixture.whenStable();
    expect(cestinha.vazia()).toBe(true);
  });

  describe('pedido mínimo da entrega', () => {
    it('sem saber o endereço, explica a regra quando o total está abaixo do mínimo', async () => {
      cestinha.adicionar(TRADICIONAL);
      await fixture.whenStable();

      expect(texto('.minimo')).toContain(
        'Até 1,5 km da loja, não tem pedido mínimo; mais longe, o mínimo é de R$ 30.',
      );
      expect(botao('Conferir meu endereço')).toBeDefined();
    });

    it('não fala do mínimo quando o total já passou dele', async () => {
      await montarPedido();

      expect(elemento.querySelector('.minimo')).toBeNull();
    });

    it('com o endereço conferido longe da loja, diz quanto falta', async () => {
      TestBed.inject(EntregaDoCliente).registrar('com-minimo');
      cestinha.adicionar(TRADICIONAL);
      await fixture.whenStable();

      expect(texto('.minimo')).toContain('o pedido mínimo é de R$ 30. Faltam R$ 20,00.');

      cestinha.alterarQuantidade(TRADICIONAL, null, 2);
      await fixture.whenStable();
      expect(texto('.minimo')).toContain('Pedido mínimo de R$ 30 atingido');
    });

    it('com o endereço conferido perto da loja, diz que não há mínimo', async () => {
      TestBed.inject(EntregaDoCliente).registrar('sem-minimo');
      cestinha.adicionar(TRADICIONAL);
      await fixture.whenStable();

      expect(texto('.minimo')).toContain('não tem pedido mínimo');
    });
  });

  it('avisa quando itens saíram do cardápio de hoje', async () => {
    cestinha.adicionar(BROOKIE);
    cestinha.adicionar(NUTELLA);
    produtos.set([TRADICIONAL, NUTELLA]);
    atualizado.set(true);
    await fixture.whenStable();

    expect(texto('.aviso')).toContain(
      'Saíram do cardápio de hoje e foram tirados da cestinha: Brookie.',
    );
    botao('Entendi')!.click();
    await fixture.whenStable();
    expect(elemento.querySelector('.aviso')).toBeNull();
  });
});
