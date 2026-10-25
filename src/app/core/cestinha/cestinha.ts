import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  Service,
  signal,
  untracked,
} from '@angular/core';
import { CatalogoStore } from '../estado/catalogo-store';
import { LojaStore } from '../estado/loja-store';
import { diaNaLoja } from '../formatacao/formatacao';
import { Produto } from '../modelos/catalogo';
import { linkDoWhatsApp, nomeNoPedido } from '../pedido/mensagem-whatsapp';
import { emReais, mensagemDoPedido } from './mensagem-do-pedido';
import { ehFormaDePagamento, FormaDePagamento } from './pagamento';

/** De um mesmo item, mais que isso é combinado direto pelo WhatsApp. */
export const QUANTIDADE_MAXIMA = 20;

const CHAVE_NO_NAVEGADOR = 'borgonha:cestinha';
const VERSAO = 1;

export interface ItemDaCestinha {
  chave: string;
  produto: Produto;
  variacao: string | null;
  /** Nome na cestinha e na mensagem: "Cookie Nutella" ou "Bolo de pote – Nutella & Ninho". */
  nome: string;
  quantidade: number;
  precoEmCentavos: number;
  subtotalEmCentavos: number;
}

interface LinhaGuardada {
  slug: string;
  variacao: string | null;
  quantidade: number;
  /** Para avisar o nome do item se ele sair do cardápio. */
  nome: string;
}

interface CestinhaGuardada {
  versao: number;
  /** Dia (no fuso da loja) em que a cestinha foi montada: o cardápio muda, então ela só vale no mesmo dia. */
  dia: string;
  linhas: LinhaGuardada[];
  pagamento: FormaDePagamento | null;
}

/** Só entra na cestinha o que está no cardápio de hoje e tem preço. */
export function podeIrParaACestinha(produto: Produto): boolean {
  return produto.disponivel && produto.preco !== null && produto.preco > 0;
}

export function nomeDoItem(produto: Produto, variacao: string | null): string {
  return variacao ? `${nomeNoPedido(produto)} – ${variacao}` : nomeNoPedido(produto);
}

const chaveDe = (slug: string, variacao: string | null) => `${slug}|${variacao ?? ''}`;

/**
 * A cestinha do cliente: itens, quantidades, total e forma de pagamento. Fica guardada no navegador
 * (só no mesmo dia) e confere os itens com o cardápio do dia: o que esgotou ou saiu do cardápio é
 * tirado, com um aviso. O pedido sai como mensagem para o WhatsApp da loja.
 */
@Service()
export class Cestinha {
  private readonly catalogo = inject(CatalogoStore);
  private readonly loja = inject(LojaStore);

  private readonly linhas = signal<LinhaGuardada[]>([]);
  private readonly carregada = signal(false);
  private readonly abertaAgora = signal(false);
  private readonly removidosAgora = signal<string[]>([]);
  private readonly anuncioAgora = signal('');

  /** Modelo do formulário da cestinha (Signal Forms): a forma de pagamento escolhida ('' = nenhuma). */
  readonly escolhas = signal<{ pagamento: FormaDePagamento | '' }>({ pagamento: '' });

  readonly aberta = this.abertaAgora.asReadonly();
  /** Itens que saíram do cardápio do dia e foram tirados da cestinha, para avisar a pessoa. */
  readonly removidos = this.removidosAgora.asReadonly();
  /** A última mudança, dita aos leitores de tela. */
  readonly anuncio = this.anuncioAgora.asReadonly();

  /** Itens na ordem do cardápio (cookies, doces, salgados), como saem na mensagem. */
  readonly itens = computed<ItemDaCestinha[]>(() => {
    const quantidades = new Map(
      this.linhas().map((linha) => [chaveDe(linha.slug, linha.variacao), linha.quantidade]),
    );
    if (quantidades.size === 0) {
      return [];
    }

    return this.catalogo
      .produtos()
      .filter(podeIrParaACestinha)
      .flatMap((produto) =>
        (produto.variacoes.length > 0 ? produto.variacoes : [null]).flatMap((variacao) => {
          const chave = chaveDe(produto.slug, variacao);
          const quantidade = quantidades.get(chave);
          if (!quantidade) {
            return [];
          }
          const precoEmCentavos = Math.round((produto.preco ?? 0) * 100);
          return [
            {
              chave,
              produto,
              variacao,
              nome: nomeDoItem(produto, variacao),
              quantidade,
              precoEmCentavos,
              subtotalEmCentavos: precoEmCentavos * quantidade,
            },
          ];
        }),
      );
  });

  readonly quantidadeTotal = computed(() =>
    this.itens().reduce((total, item) => total + item.quantidade, 0),
  );
  readonly totalEmCentavos = computed(() =>
    this.itens().reduce((total, item) => total + item.subtotalEmCentavos, 0),
  );
  readonly vazia = computed(() => this.itens().length === 0);

  /** A loja tem WhatsApp cadastrado para receber o pedido. */
  readonly temWhatsApp = computed(() => this.whatsApp() !== undefined);

  /** Link do WhatsApp com o pedido pronto; nulo sem itens ou sem a forma de pagamento. */
  readonly linkDoPedido = computed(() => {
    const pagamento = this.escolhas().pagamento;
    const canal = this.whatsApp();
    if (!pagamento || !canal || this.vazia()) {
      return null;
    }

    const mensagem = mensagemDoPedido({
      saudacao: canal.mensagemPadrao,
      linhas: this.itens(),
      totalEmCentavos: this.totalEmCentavos(),
      pagamento,
    });
    return linkDoWhatsApp(canal.url, mensagem, null);
  });

  private readonly whatsApp = computed(() =>
    this.loja.canaisPedido().find((canal) => canal.tipo === 'whatsapp'),
  );

  constructor() {
    // A cestinha guardada só entra depois da primeira renderização no navegador, para a página
    // hidratar igual ao HTML pré-renderizado (sempre com a cestinha vazia).
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      afterNextRender(() => this.carregar());
    }

    effect(() => {
      const guardada: CestinhaGuardada = {
        versao: VERSAO,
        dia: diaNaLoja(new Date()),
        linhas: this.linhas(),
        pagamento: this.escolhas().pagamento || null,
      };
      if (this.carregada()) {
        salvar(guardada);
      }
    });

    // Com o cardápio do dia em mãos, tira da cestinha o que esgotou, saiu do cardápio ou ficou sem preço.
    effect(() => {
      if (!this.carregada() || !this.catalogo.atualizado()) {
        return;
      }
      const validas = new Set(this.itens().map((item) => item.chave));
      const linhas = untracked(this.linhas);
      const fora = linhas.filter((linha) => !validas.has(chaveDe(linha.slug, linha.variacao)));
      if (fora.length > 0) {
        this.linhas.set(linhas.filter((linha) => !fora.includes(linha)));
        this.removidosAgora.update((nomes) => [...nomes, ...fora.map((linha) => linha.nome)]);
      }
    });
  }

  /** Quantidade do produto (e do sabor) na cestinha. */
  quantidadeDe(produto: Produto, variacao: string | null = null): number {
    const chave = chaveDe(produto.slug, variacao);
    return (
      this.linhas().find((linha) => chaveDe(linha.slug, linha.variacao) === chave)?.quantidade ?? 0
    );
  }

  adicionar(produto: Produto, variacao: string | null = null): void {
    this.alterarQuantidade(produto, variacao, 1);
  }

  /** Soma (ou tira, com número negativo) do item; chegando a zero, ele sai da cestinha. */
  alterarQuantidade(produto: Produto, variacao: string | null, diferenca: number): void {
    if (diferenca > 0 && !podeIrParaACestinha(produto)) {
      return;
    }

    const chave = chaveDe(produto.slug, variacao);
    const atual = this.quantidadeDe(produto, variacao);
    const nova = Math.min(Math.max(atual + diferenca, 0), QUANTIDADE_MAXIMA);
    if (nova === atual) {
      return;
    }

    const nome = nomeDoItem(produto, variacao);
    this.linhas.update((linhas) => {
      if (nova === 0) {
        return linhas.filter((linha) => chaveDe(linha.slug, linha.variacao) !== chave);
      }
      if (atual === 0) {
        return [...linhas, { slug: produto.slug, variacao, quantidade: nova, nome }];
      }
      return linhas.map((linha) =>
        chaveDe(linha.slug, linha.variacao) === chave ? { ...linha, quantidade: nova } : linha,
      );
    });

    this.anunciar(nova === 0 ? `${nome} saiu da cestinha.` : `${nome}: ${nova} na cestinha.`);
  }

  remover(produto: Produto, variacao: string | null = null): void {
    this.alterarQuantidade(produto, variacao, -QUANTIDADE_MAXIMA);
  }

  esvaziar(): void {
    this.linhas.set([]);
    this.removidosAgora.set([]);
    this.anuncioAgora.set('A cestinha ficou vazia.');
  }

  abrir(): void {
    this.abertaAgora.set(true);
  }

  fechar(): void {
    this.abertaAgora.set(false);
  }

  dispensarAvisoDeRemovidos(): void {
    this.removidosAgora.set([]);
  }

  private carregar(): void {
    const guardada = ler();
    if (guardada) {
      if (guardada.dia === diaNaLoja(new Date())) {
        this.linhas.set(guardada.linhas);
      }
      this.escolhas.set({ pagamento: guardada.pagamento ?? '' });
    }
    this.carregada.set(true);
  }

  private anunciar(mudanca: string): void {
    const quantidade = this.quantidadeTotal();
    const resumo =
      quantidade === 0
        ? 'A cestinha está vazia.'
        : `Na cestinha: ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}, ${emReais(this.totalEmCentavos())}.`;
    this.anuncioAgora.set(`${mudanca} ${resumo}`);
  }
}

function ler(): CestinhaGuardada | null {
  try {
    const texto = globalThis.localStorage?.getItem(CHAVE_NO_NAVEGADOR);
    const dados: unknown = texto ? JSON.parse(texto) : null;
    if (!dados || typeof dados !== 'object') {
      return null;
    }

    const { versao, dia, linhas, pagamento } = dados as Partial<CestinhaGuardada>;
    if (versao !== VERSAO || typeof dia !== 'string' || !Array.isArray(linhas)) {
      return null;
    }

    return {
      versao,
      dia,
      linhas: linhas.filter(ehLinhaValida),
      pagamento: ehFormaDePagamento(pagamento) ? pagamento : null,
    };
  } catch {
    return null;
  }
}

function salvar(cestinha: CestinhaGuardada): void {
  try {
    globalThis.localStorage?.setItem(CHAVE_NO_NAVEGADOR, JSON.stringify(cestinha));
  } catch {
    // Navegação anônima ou armazenamento cheio: a cestinha vale só enquanto a página estiver aberta.
  }
}

function ehLinhaValida(linha: unknown): linha is LinhaGuardada {
  if (!linha || typeof linha !== 'object') {
    return false;
  }
  const { slug, variacao, quantidade, nome } = linha as Partial<LinhaGuardada>;
  return (
    typeof slug === 'string' &&
    (variacao === null || typeof variacao === 'string') &&
    Number.isInteger(quantidade) &&
    (quantidade ?? 0) >= 1 &&
    (quantidade ?? 0) <= QUANTIDADE_MAXIMA &&
    typeof nome === 'string'
  );
}
