import { computed, inject, Service, signal } from '@angular/core';
import { LojaStore } from '../estado/loja-store';
import { Produto } from '../modelos/catalogo';
import { TipoCanalPedido } from '../modelos/loja';
import { linkDoWhatsApp } from './mensagem-whatsapp';

export interface OpcaoDePedido {
  tipo: TipoCanalPedido;
  titulo: string;
  descricao: string;
  link: string;
  destaque: boolean;
}

/**
 * Estado do painel "Faça seu pedido" e montagem dos links de cada canal.
 * Todos os botões de pedido do site passam por aqui.
 */
@Service()
export class Pedido {
  private readonly loja = inject(LojaStore);

  private readonly estado = signal<{ aberto: boolean; produto: Produto | null }>({
    aberto: false,
    produto: null,
  });

  readonly aberto = computed(() => this.estado().aberto);

  /** Produto que levou a pessoa a pedir ("Quero esse"), se houver. */
  readonly produto = computed(() => this.estado().produto);

  abrir(produto: Produto | null = null): void {
    this.estado.set({ aberto: true, produto });
  }

  fechar(): void {
    this.estado.update((atual) => ({ ...atual, aberto: false }));
  }

  /** Canais com os links prontos; o do WhatsApp leva o produto escolhido na mensagem. */
  opcoesPara(produto: Produto | null): OpcaoDePedido[] {
    return this.loja.canaisPedido().map((canal) => ({
      tipo: canal.tipo,
      titulo: canal.titulo,
      descricao: canal.descricao,
      destaque: canal.destaque,
      link:
        canal.tipo === 'whatsapp'
          ? linkDoWhatsApp(canal.url, canal.mensagemPadrao, produto)
          : canal.url,
    }));
  }
}
