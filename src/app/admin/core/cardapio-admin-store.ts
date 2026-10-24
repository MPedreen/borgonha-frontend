import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { API_URL } from '../../core/api/api-url';
import {
  CardapioAdmin,
  DadosDoProduto,
  NovoProduto,
  ProdutoAdmin,
  SituacaoProduto,
  TipoDeFoto,
} from './modelos-admin';
import { mensagemDeErro, OPCOES_DO_ADMIN } from './requisicoes-admin';

/**
 * Cardápio da área do administrador: carrega todos os produtos (inclusive os ocultos) e aplica
 * as alterações. Cada alteração já vale no site, porque a API limpa o cache na hora.
 * Os métodos lançam um `Error` com uma mensagem pronta para mostrar na tela.
 */
@Service()
export class CardapioAdminStore {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = `${inject(API_URL)}/admin`;

  readonly cardapio = signal<CardapioAdmin | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);

    try {
      this.cardapio.set(
        await this.chamar(this.http.get<CardapioAdmin>(`${this.api}/cardapio`, OPCOES_DO_ADMIN)),
      );
    } catch (erro) {
      this.erro.set((erro as Error).message);
    } finally {
      this.carregando.set(false);
    }
  }

  encontrar(slug: string): ProdutoAdmin | undefined {
    return this.cardapio()
      ?.categorias.flatMap((categoria) => categoria.produtos)
      .find((produto) => produto.slug === slug);
  }

  async criar(dados: NovoProduto): Promise<ProdutoAdmin> {
    const produto = await this.chamar(
      this.http.post<ProdutoAdmin>(`${this.api}/produtos`, dados, OPCOES_DO_ADMIN),
    );
    this.cardapio.update(
      (cardapio) =>
        cardapio && {
          categorias: cardapio.categorias.map((categoria) =>
            categoria.slug === produto.categoria
              ? { ...categoria, produtos: [...categoria.produtos, produto] }
              : categoria,
          ),
        },
    );
    return produto;
  }

  atualizar(slug: string, dados: DadosDoProduto): Promise<ProdutoAdmin> {
    return this.substituir(
      this.http.put<ProdutoAdmin>(`${this.api}/produtos/${slug}`, dados, OPCOES_DO_ADMIN),
    );
  }

  /** Muda na tela na hora e desfaz se a API recusar. */
  async alterarSituacao(slug: string, situacao: SituacaoProduto): Promise<ProdutoAdmin> {
    const anterior = this.encontrar(slug);
    if (anterior) {
      this.trocarNaLista({ ...anterior, situacao });
    }

    try {
      return await this.substituir(
        this.http.put<ProdutoAdmin>(
          `${this.api}/produtos/${slug}/situacao`,
          { situacao },
          OPCOES_DO_ADMIN,
        ),
      );
    } catch (erro) {
      if (anterior) {
        this.trocarNaLista(anterior);
      }
      throw erro;
    }
  }

  trocarFoto(slug: string, tipo: TipoDeFoto, arquivo: File): Promise<ProdutoAdmin> {
    const formulario = new FormData();
    formulario.append('foto', arquivo);

    return this.substituir(
      this.http.put<ProdutoAdmin>(
        `${this.api}/produtos/${slug}/fotos/${tipo}`,
        formulario,
        OPCOES_DO_ADMIN,
      ),
    );
  }

  removerFoto(slug: string, tipo: TipoDeFoto): Promise<ProdutoAdmin> {
    return this.substituir(
      this.http.delete<ProdutoAdmin>(`${this.api}/produtos/${slug}/fotos/${tipo}`, OPCOES_DO_ADMIN),
    );
  }

  async excluir(slug: string): Promise<void> {
    await this.chamar(this.http.delete(`${this.api}/produtos/${slug}`, OPCOES_DO_ADMIN));
    this.cardapio.update(
      (cardapio) =>
        cardapio && {
          categorias: cardapio.categorias.map((categoria) => ({
            ...categoria,
            produtos: categoria.produtos.filter((produto) => produto.slug !== slug),
          })),
        },
    );
  }

  private async substituir(chamada: Observable<ProdutoAdmin>): Promise<ProdutoAdmin> {
    const produto = await this.chamar(chamada);
    this.trocarNaLista(produto);
    return produto;
  }

  private trocarNaLista(produto: ProdutoAdmin): void {
    this.cardapio.update(
      (cardapio) =>
        cardapio && {
          categorias: cardapio.categorias.map((categoria) => ({
            ...categoria,
            produtos: categoria.produtos.map((existente) =>
              existente.slug === produto.slug ? produto : existente,
            ),
          })),
        },
    );
  }

  /** Se a sessão tiver acabado, volta para a tela de entrar. */
  private async chamar<T>(chamada: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(chamada);
    } catch (erro) {
      if (erro instanceof HttpErrorResponse && erro.status === 401) {
        await this.router.navigate(['/admin/entrar'], { queryParams: { sessao: 'expirada' } });
      }
      throw new Error(mensagemDeErro(erro, 'Não foi possível salvar. Tente de novo.'), {
        cause: erro,
      });
    }
  }
}
