import { Component, computed, inject, input, linkedSignal, signal, untracked } from '@angular/core';
import { form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Botao } from '../../ui/botao/botao';
import { Icone } from '../../ui/icone/icone';
import { CampoFoto } from '../campo-foto/campo-foto';
import { CardapioAdminStore } from '../core/cardapio-admin-store';
import { mensagemDaNavegacao } from '../core/mensagem-da-navegacao';
import { DadosDoProduto, ProdutoAdmin, SituacaoProduto } from '../core/modelos-admin';
import { escreverPreco, lerPreco } from '../core/preco';
import { SeletorSituacao } from '../seletor-situacao/seletor-situacao';

/** Os mesmos limites da API. */
const LIMITES = { nome: 80, descricao: 400, frase: 120, peso: 20 } as const;

interface ValoresDoFormulario {
  categoria: string;
  nome: string;
  descricao: string;
  frase: string;
  peso: string;
  /** Como foi digitado (ex.: "12,50"); vazio = sem preço. */
  preco: string;
  /** Uma variação por linha. */
  variacoes: string;
}

/** Cadastro de produto novo (`/admin/produtos/novo`) e edição (`/admin/produtos/:slug`). */
@Component({
  selector: 'app-editor-produto',
  imports: [Botao, CampoFoto, FormField, Icone, RouterLink, SeletorSituacao],
  templateUrl: './editor-produto.html',
  styleUrl: './editor-produto.scss',
})
export class EditorProduto {
  protected readonly store = inject(CardapioAdminStore);
  private readonly router = inject(Router);

  /** Parâmetro da rota; ausente no cadastro de um produto novo. */
  readonly slug = input<string>();
  /** Query param `?categoria=` de um produto novo. */
  readonly categoria = input<string>();

  protected readonly limites = LIMITES;
  protected readonly novo = computed(() => !this.slug());
  protected readonly produto = computed(() => {
    const slug = this.slug();
    return slug ? this.store.encontrar(slug) : undefined;
  });

  /**
   * Valores do formulário. Só recomeçam quando muda o produto (ou quando o cardápio termina de
   * carregar): enviar uma foto atualiza o produto, mas não apaga o que já foi digitado.
   */
  protected readonly valores = linkedSignal<string, ValoresDoFormulario>({
    source: () => `${this.slug() ?? ''}|${this.store.cardapio() !== null}`,
    computation: () => untracked(() => valoresIniciais(this.produto(), this.categoria())),
  });

  protected readonly formulario = form(this.valores, (campo) => {
    required(campo.categoria, { message: 'Escolha a categoria.' });
    required(campo.nome, { message: 'Informe o nome.' });
    maxLength(campo.nome, LIMITES.nome, { message: `Use até ${LIMITES.nome} caracteres.` });
    maxLength(campo.descricao, LIMITES.descricao, {
      message: `Use até ${LIMITES.descricao} caracteres.`,
    });
    maxLength(campo.frase, LIMITES.frase, { message: `Use até ${LIMITES.frase} caracteres.` });
    maxLength(campo.peso, LIMITES.peso, { message: `Use até ${LIMITES.peso} caracteres.` });
    validate(campo.preco, ({ value }) =>
      lerPreco(value()) === undefined
        ? { kind: 'preco', message: 'Use só números, como 15 ou 12,50 (até R$ 9.999,99).' }
        : null,
    );
  });

  protected readonly aviso = signal(mensagemDaNavegacao());
  protected readonly salvandoSituacao = signal(false);
  protected readonly confirmandoExclusao = signal(false);
  protected readonly excluindo = signal(false);

  constructor() {
    if (!this.store.cardapio()) {
      void this.store.carregar();
    }
  }

  protected async salvar(evento: Event): Promise<void> {
    evento.preventDefault();
    this.aviso.set(null);

    await submit(this.formulario, async () => {
      const valores = this.valores();
      const dados = dadosDoProduto(valores);
      const slug = this.slug();

      try {
        if (slug) {
          await this.store.atualizar(slug, dados);
          this.aviso.set('Alterações salvas. Já valem no site.');
        } else {
          const criado = await this.store.criar({ ...dados, categoria: valores.categoria });
          await this.router.navigate(['/admin/produtos', criado.slug], {
            replaceUrl: true,
            state: {
              mensagem: `${criado.nome} foi criado e já está no site. Agora envie as fotos.`,
            },
          });
        }
      } catch (erro) {
        this.aviso.set((erro as Error).message);
      }
      return undefined;
    });
  }

  protected async alterarSituacao(produto: ProdutoAdmin, situacao: SituacaoProduto): Promise<void> {
    this.salvandoSituacao.set(true);
    try {
      await this.store.alterarSituacao(produto.slug, situacao);
      this.aviso.set('Situação atualizada. Já vale no site.');
    } catch (erro) {
      this.aviso.set((erro as Error).message);
    } finally {
      this.salvandoSituacao.set(false);
    }
  }

  protected async excluir(produto: ProdutoAdmin): Promise<void> {
    this.excluindo.set(true);
    try {
      await this.store.excluir(produto.slug);
      await this.router.navigate(['/admin'], {
        state: { mensagem: `${produto.nome} foi excluído.` },
      });
    } catch (erro) {
      this.aviso.set((erro as Error).message);
      this.excluindo.set(false);
      this.confirmandoExclusao.set(false);
    }
  }
}

function valoresIniciais(
  produto: ProdutoAdmin | undefined,
  categoria: string | undefined,
): ValoresDoFormulario {
  return {
    categoria: produto?.categoria ?? categoria ?? 'cookies',
    nome: produto?.nome ?? '',
    descricao: produto?.descricao ?? '',
    frase: produto?.frase ?? '',
    peso: produto?.peso ?? '',
    preco: escreverPreco(produto?.preco ?? null),
    variacoes: produto?.variacoes.join('\n') ?? '',
  };
}

function dadosDoProduto(valores: ValoresDoFormulario): DadosDoProduto {
  const opcional = (texto: string) => texto.trim() || null;

  return {
    nome: valores.nome.trim(),
    descricao: opcional(valores.descricao),
    frase: opcional(valores.frase),
    peso: opcional(valores.peso),
    preco: lerPreco(valores.preco) ?? null,
    variacoes: valores.variacoes
      .split('\n')
      .map((variacao) => variacao.trim())
      .filter((variacao) => variacao.length > 0),
  };
}
