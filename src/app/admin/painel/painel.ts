import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Botao } from '../../ui/botao/botao';
import { Icone } from '../../ui/icone/icone';
import { ImagemProduto } from '../../ui/imagem-produto/imagem-produto';
import { CardapioAdminStore } from '../core/cardapio-admin-store';
import { mensagemDaNavegacao } from '../core/mensagem-da-navegacao';
import { OPCOES_DE_SITUACAO, ProdutoAdmin, SituacaoProduto } from '../core/modelos-admin';
import { SeletorSituacao } from '../seletor-situacao/seletor-situacao';

const ROTULO_DA_SITUACAO: Record<SituacaoProduto, string> = {
  'no-cardapio': 'está no cardápio',
  esgotado: 'está esgotado',
  oculto: 'saiu do site',
};

/** Lista de produtos por categoria, com a situação de cada um e o atalho para editar. */
@Component({
  selector: 'app-painel',
  imports: [Botao, Icone, ImagemProduto, RouterLink, SeletorSituacao],
  templateUrl: './painel.html',
  styleUrl: './painel.scss',
})
export class Painel {
  protected readonly store = inject(CardapioAdminStore);
  protected readonly opcoes = OPCOES_DE_SITUACAO;

  /** Resultado da última alteração (ou a mensagem deixada pela página anterior). */
  protected readonly aviso = signal(mensagemDaNavegacao());

  /** Produto cuja situação está sendo salva. */
  protected readonly salvando = signal<string | null>(null);

  constructor() {
    void this.store.carregar();
  }

  protected async alterarSituacao(produto: ProdutoAdmin, situacao: SituacaoProduto): Promise<void> {
    this.salvando.set(produto.slug);
    try {
      await this.store.alterarSituacao(produto.slug, situacao);
      this.aviso.set(`${produto.nome} ${ROTULO_DA_SITUACAO[situacao]}.`);
    } catch (erro) {
      this.aviso.set(`${produto.nome}: ${(erro as Error).message}`);
    } finally {
      this.salvando.set(null);
    }
  }
}
