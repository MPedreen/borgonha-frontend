import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { ArquivoDeRuas } from './consulta-entrega';

/**
 * Ruas e bairros perto da loja (`public/entrega/ruas.json`). O arquivo só é baixado quando alguém
 * começa a conferir o endereço, para não pesar no carregamento da página.
 */
@Service()
export class MapaDeEntrega {
  private readonly http = inject(HttpClient);

  private readonly estadoAtual = signal<'ocioso' | 'carregando' | 'pronto' | 'falhou'>('ocioso');
  private readonly arquivoAtual = signal<ArquivoDeRuas | null>(null);

  readonly estado = this.estadoAtual.asReadonly();
  readonly arquivo = this.arquivoAtual.asReadonly();

  carregar(): void {
    if (this.estadoAtual() === 'carregando' || this.estadoAtual() === 'pronto') {
      return;
    }

    this.estadoAtual.set('carregando');
    this.http.get<ArquivoDeRuas>('/entrega/ruas.json').subscribe({
      next: (arquivo) => {
        this.arquivoAtual.set(arquivo);
        this.estadoAtual.set('pronto');
      },
      error: () => this.estadoAtual.set('falhou'),
    });
  }
}
