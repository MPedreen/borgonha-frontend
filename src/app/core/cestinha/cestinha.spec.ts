import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { criarProduto, LOJA } from '../../../testing/dados-de-teste';
import { CatalogoStore } from '../estado/catalogo-store';
import { LojaStore } from '../estado/loja-store';
import { diaNaLoja } from '../formatacao/formatacao';
import { Produto } from '../modelos/catalogo';
import { Cestinha, QUANTIDADE_MAXIMA } from './cestinha';

const NUTELLA = criarProduto({ slug: 'nutella', nome: 'Nutella', preco: 15 });
const TRADICIONAL = criarProduto({ slug: 'tradicional', nome: 'Tradicional', preco: 10 });
const BROOKIE = criarProduto({ slug: 'brookie', nome: 'Brookie', categoria: 'doces', preco: 15 });
const BOLO_DE_POTE = criarProduto({
  slug: 'bolo-de-pote',
  nome: 'Bolo de pote',
  categoria: 'doces',
  preco: 12.5,
  variacoes: ['Chocolate & Maracujá', 'Nutella & Ninho'],
});
const SEM_PRECO = criarProduto({ slug: 'novidade', nome: 'Novidade', categoria: 'doces' });
const ESGOTADO = criarProduto({ slug: 'mms', nome: 'M&M', preco: 12, disponivel: false });

const CHAVE = 'borgonha:cestinha';

describe('Cestinha', () => {
  const produtos = signal<Produto[]>([]);
  const atualizado = signal(false);
  let cestinha: Cestinha;

  function criar(): Cestinha {
    TestBed.configureTestingModule({
      providers: [
        { provide: CatalogoStore, useValue: { produtos, atualizado } },
        { provide: LojaStore, useValue: { canaisPedido: signal(LOJA.canaisPedido) } },
      ],
    });
    const servico = TestBed.inject(Cestinha);
    TestBed.tick(); // carrega o que estava guardado no navegador
    return servico;
  }

  beforeEach(() => {
    localStorage.clear();
    produtos.set([TRADICIONAL, NUTELLA, ESGOTADO, BROOKIE, BOLO_DE_POTE, SEM_PRECO]);
    atualizado.set(false);
  });

  describe('itens e total', () => {
    beforeEach(() => (cestinha = criar()));

    it('soma as quantidades e calcula o total em centavos, sem erro de arredondamento', () => {
      cestinha.adicionar(BOLO_DE_POTE, 'Nutella & Ninho');
      cestinha.adicionar(BOLO_DE_POTE, 'Nutella & Ninho');
      cestinha.adicionar(BOLO_DE_POTE, 'Nutella & Ninho');
      cestinha.adicionar(NUTELLA);

      expect(cestinha.quantidadeTotal()).toBe(4);
      expect(cestinha.totalEmCentavos()).toBe(3750 + 1500);
      expect(
        cestinha.itens().map((item) => [item.nome, item.quantidade, item.subtotalEmCentavos]),
      ).toEqual([
        ['Cookie Nutella', 1, 1500],
        ['Bolo de pote – Nutella & Ninho', 3, 3750],
      ]);
    });

    it('mostra os itens na ordem do cardápio, não na ordem em que entraram', () => {
      cestinha.adicionar(BROOKIE);
      cestinha.adicionar(NUTELLA);
      cestinha.adicionar(TRADICIONAL);

      expect(cestinha.itens().map((item) => item.produto.slug)).toEqual([
        'tradicional',
        'nutella',
        'brookie',
      ]);
    });

    it('separa os sabores de um mesmo produto', () => {
      cestinha.adicionar(BOLO_DE_POTE, 'Chocolate & Maracujá');
      cestinha.adicionar(BOLO_DE_POTE, 'Nutella & Ninho');

      expect(cestinha.quantidadeDe(BOLO_DE_POTE, 'Chocolate & Maracujá')).toBe(1);
      expect(cestinha.itens()).toHaveLength(2);
    });

    it(`não passa de ${QUANTIDADE_MAXIMA} de um mesmo item`, () => {
      cestinha.alterarQuantidade(NUTELLA, null, 50);

      expect(cestinha.quantidadeDe(NUTELLA)).toBe(QUANTIDADE_MAXIMA);
    });

    it('tira o item quando a quantidade chega a zero', () => {
      cestinha.adicionar(NUTELLA);
      cestinha.alterarQuantidade(NUTELLA, null, -1);

      expect(cestinha.vazia()).toBe(true);
    });

    it('não aceita produto sem preço nem esgotado', () => {
      cestinha.adicionar(SEM_PRECO);
      cestinha.adicionar(ESGOTADO);

      expect(cestinha.vazia()).toBe(true);
    });

    it('avisa a mudança e o total para os leitores de tela', () => {
      cestinha.adicionar(NUTELLA);
      cestinha.adicionar(NUTELLA);

      expect(cestinha.anuncio()).toBe(
        'Cookie Nutella: 2 na cestinha. Na cestinha: 2 itens, R$ 30,00.',
      );
    });
  });

  describe('pedido pelo WhatsApp', () => {
    beforeEach(() => (cestinha = criar()));

    it('só monta o link depois de escolher a forma de pagamento', () => {
      cestinha.adicionar(NUTELLA);
      cestinha.adicionar(NUTELLA);
      cestinha.adicionar(BROOKIE);

      expect(cestinha.linkDoPedido()).toBeNull();

      cestinha.escolhas.set({ pagamento: 'pix' });
      const link = new URL(cestinha.linkDoPedido()!);

      expect(link.origin + link.pathname).toBe('https://wa.me/5521974509789');
      expect(link.searchParams.get('text')).toBe(
        'Olá!\nDesejo fazer meu pedido!\n\n2x Cookie Nutella (R$ 30,00)\n1x Brookie (R$ 15,00)\n\nValor total: R$ 45,00\nForma de pagamento: Pix',
      );
    });

    it('não monta o link com a cestinha vazia', () => {
      cestinha.escolhas.set({ pagamento: 'debito' });

      expect(cestinha.linkDoPedido()).toBeNull();
    });
  });

  describe('guardada no navegador', () => {
    it('volta como estava, no mesmo dia', () => {
      localStorage.setItem(
        CHAVE,
        JSON.stringify({
          versao: 1,
          dia: diaNaLoja(new Date()),
          linhas: [{ slug: 'nutella', variacao: null, quantidade: 2, nome: 'Cookie Nutella' }],
          pagamento: 'credito',
        }),
      );

      cestinha = criar();

      expect(cestinha.quantidadeDe(NUTELLA)).toBe(2);
      expect(cestinha.escolhas().pagamento).toBe('credito');
    });

    it('começa vazia num outro dia (o cardápio muda), mas lembra a forma de pagamento', () => {
      localStorage.setItem(
        CHAVE,
        JSON.stringify({
          versao: 1,
          dia: '2000-01-01',
          linhas: [{ slug: 'nutella', variacao: null, quantidade: 2, nome: 'Cookie Nutella' }],
          pagamento: 'pix',
        }),
      );

      cestinha = criar();

      expect(cestinha.vazia()).toBe(true);
      expect(cestinha.escolhas().pagamento).toBe('pix');
    });

    it('ignora o que estiver estragado', () => {
      localStorage.setItem(CHAVE, '{não é json');
      expect(() => (cestinha = criar())).not.toThrow();
      expect(cestinha.vazia()).toBe(true);
    });

    it('descarta linhas inválidas', () => {
      localStorage.setItem(
        CHAVE,
        JSON.stringify({
          versao: 1,
          dia: diaNaLoja(new Date()),
          linhas: [
            { slug: 'nutella', variacao: null, quantidade: 999, nome: 'Cookie Nutella' },
            { slug: 'brookie', variacao: null, quantidade: 1, nome: 'Brookie' },
          ],
          pagamento: 'boleto',
        }),
      );

      cestinha = criar();

      expect(cestinha.itens().map((item) => item.produto.slug)).toEqual(['brookie']);
      expect(cestinha.escolhas().pagamento).toBe('');
    });

    it('guarda cada mudança', () => {
      cestinha = criar();
      cestinha.adicionar(BROOKIE);
      cestinha.escolhas.set({ pagamento: 'debito' });
      TestBed.tick();

      const guardada = JSON.parse(localStorage.getItem(CHAVE)!);
      expect(guardada.linhas).toEqual([
        { slug: 'brookie', variacao: null, quantidade: 1, nome: 'Brookie' },
      ]);
      expect(guardada.pagamento).toBe('debito');
      expect(guardada.dia).toBe(diaNaLoja(new Date()));
    });
  });

  describe('com o cardápio do dia', () => {
    beforeEach(() => {
      localStorage.setItem(
        CHAVE,
        JSON.stringify({
          versao: 1,
          dia: diaNaLoja(new Date()),
          linhas: [
            { slug: 'nutella', variacao: null, quantidade: 2, nome: 'Cookie Nutella' },
            { slug: 'brookie', variacao: null, quantidade: 1, nome: 'Brookie' },
          ],
          pagamento: null,
        }),
      );
    });

    it('só tira itens depois que o cardápio novo chega da API', () => {
      produtos.set([NUTELLA]);
      cestinha = criar();

      expect(cestinha.removidos()).toEqual([]);
      expect(cestinha.quantidadeTotal()).toBe(2);

      atualizado.set(true);
      TestBed.tick();

      expect(cestinha.removidos()).toEqual(['Brookie']);
      expect(JSON.parse(localStorage.getItem(CHAVE)!).linhas).toHaveLength(1);
    });

    it('tira o que esgotou e avisa', () => {
      produtos.set([{ ...NUTELLA, disponivel: false }, BROOKIE]);
      atualizado.set(true);
      cestinha = criar();
      TestBed.tick();

      expect(cestinha.itens().map((item) => item.nome)).toEqual(['Brookie']);
      expect(cestinha.removidos()).toEqual(['Cookie Nutella']);

      cestinha.dispensarAvisoDeRemovidos();
      expect(cestinha.removidos()).toEqual([]);
    });
  });
});
