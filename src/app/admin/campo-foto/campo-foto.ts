import { Component, computed, inject, input, signal } from '@angular/core';
import { Icone } from '../../ui/icone/icone';
import { FormatoImagem, ImagemProduto } from '../../ui/imagem-produto/imagem-produto';
import { CardapioAdminStore } from '../core/cardapio-admin-store';
import { ProdutoAdmin, TipoDeFoto } from '../core/modelos-admin';

/** O mesmo limite da API: 15 MB. */
const TAMANHO_MAXIMO_EM_BYTES = 15 * 1024 * 1024;

/**
 * Foto do produto (inteiro ou partido): prévia como vai aparecer no site, enviar, trocar e remover.
 * A API otimiza a foto e apaga os dados do celular (como a localização) antes de publicar.
 */
@Component({
  selector: 'app-campo-foto',
  imports: [Icone, ImagemProduto],
  templateUrl: './campo-foto.html',
  styleUrl: './campo-foto.scss',
})
export class CampoFoto {
  private readonly store = inject(CardapioAdminStore);

  readonly produto = input.required<ProdutoAdmin>();
  readonly tipo = input.required<TipoDeFoto>();
  readonly titulo = input.required<string>();
  readonly ajuda = input('');

  protected readonly imagem = computed(() => this.produto().imagens[this.tipo()]);
  protected readonly formato = computed<FormatoImagem>(() =>
    this.produto().categoria === 'cookies' && this.tipo() === 'inteiro' ? 'cookie' : 'paisagem',
  );
  protected readonly idAjuda = computed(() => `foto-${this.tipo()}-ajuda`);

  protected readonly ocupado = signal(false);
  protected readonly estado = signal('');

  protected async enviar(evento: Event): Promise<void> {
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    campo.value = '';

    if (!arquivo) {
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_EM_BYTES) {
      this.estado.set('A foto deve ter no máximo 15 MB.');
      return;
    }

    await this.executar(
      'Enviando e otimizando a foto…',
      'Foto atualizada. Já aparece no site.',
      () => this.store.trocarFoto(this.produto().slug, this.tipo(), arquivo),
    );
  }

  protected async remover(): Promise<void> {
    await this.executar('Removendo a foto…', 'Foto removida.', () =>
      this.store.removerFoto(this.produto().slug, this.tipo()),
    );
  }

  private async executar(
    andamento: string,
    sucesso: string,
    acao: () => Promise<unknown>,
  ): Promise<void> {
    this.ocupado.set(true);
    this.estado.set(andamento);
    try {
      await acao();
      this.estado.set(sucesso);
    } catch (erro) {
      this.estado.set((erro as Error).message);
    } finally {
      this.ocupado.set(false);
    }
  }
}
