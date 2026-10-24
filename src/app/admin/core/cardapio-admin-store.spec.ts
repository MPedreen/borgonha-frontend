import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { API_URL } from '../../core/api/api-url';
import { CardapioAdminStore } from './cardapio-admin-store';
import { CardapioAdmin, ProdutoAdmin } from './modelos-admin';

const NUTELLA: ProdutoAdmin = {
  slug: 'nutella',
  nome: 'Nutella',
  categoria: 'cookies',
  descricao: 'Recheio de Nutella.',
  frase: null,
  peso: '130g',
  preco: 15,
  variacoes: [],
  imagens: { inteiro: null, partido: null },
  situacao: 'no-cardapio',
};

const CARDAPIO: CardapioAdmin = {
  categorias: [{ slug: 'cookies', nome: 'Cookies', produtos: [NUTELLA] }],
};

describe('CardapioAdminStore', () => {
  let store: CardapioAdminStore;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    store = TestBed.inject(CardapioAdminStore);
    http = TestBed.inject(HttpTestingController);

    const carregamento = store.carregar();
    http.expectOne('/api/admin/cardapio').flush(CARDAPIO);
    await carregamento;
  });

  afterEach(() => http.verify());

  it('envia o cookie da sessão e o cabeçalho da área do administrador', async () => {
    const carregamento = store.carregar();
    const requisicao = http.expectOne('/api/admin/cardapio');
    requisicao.flush(CARDAPIO);
    await carregamento;

    expect(requisicao.request.withCredentials).toBe(true);
    expect(requisicao.request.headers.get('X-Borgonha-Admin')).toBe('1');
  });

  it('muda a situação na hora e confirma com a resposta da API', async () => {
    const alteracao = store.alterarSituacao('nutella', 'oculto');
    expect(store.encontrar('nutella')?.situacao).toBe('oculto');

    const requisicao = http.expectOne('/api/admin/produtos/nutella/situacao');
    expect(requisicao.request.body).toEqual({ situacao: 'oculto' });
    requisicao.flush({ ...NUTELLA, situacao: 'oculto' });
    await alteracao;

    expect(store.encontrar('nutella')?.situacao).toBe('oculto');
  });

  it('desfaz a mudança e explica o motivo quando a API recusa', async () => {
    const alteracao = store.alterarSituacao('nutella', 'esgotado');

    http
      .expectOne('/api/admin/produtos/nutella/situacao')
      .flush({ title: 'Situação inválida.' }, { status: 400, statusText: 'Bad Request' });

    await expect(alteracao).rejects.toThrow('Situação inválida.');
    expect(store.encontrar('nutella')?.situacao).toBe('no-cardapio');
  });

  it('volta para a tela de entrar quando a sessão acabou', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const exclusao = store.excluir('nutella');

    http
      .expectOne('/api/admin/produtos/nutella')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(exclusao).rejects.toThrow();
    expect(navegar).toHaveBeenCalledWith(['/admin/entrar'], {
      queryParams: { sessao: 'expirada' },
    });
    expect(store.encontrar('nutella')).toBeDefined();
  });

  it('acrescenta o produto criado no fim da categoria', async () => {
    const novo: ProdutoAdmin = { ...NUTELLA, slug: 'pistache', nome: 'Pistache' };
    const criacao = store.criar({
      categoria: 'cookies',
      nome: 'Pistache',
      descricao: 'Recheio de pistache.',
      frase: null,
      peso: '130g',
      preco: 15,
      variacoes: [],
    });

    http.expectOne('/api/admin/produtos').flush(novo);
    await criacao;

    expect(store.cardapio()?.categorias[0].produtos.map((produto) => produto.slug)).toEqual([
      'nutella',
      'pistache',
    ]);
  });
});
