import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  artigoDe,
  buscarLugares,
  distanciaEmMetros,
  formatarDistancia,
  Lugar,
  lugaresDoArquivo,
  Situacao,
  situacaoDaDistancia,
  situacaoDoLugar,
} from '../../../core/entrega/consulta-entrega';
import { MapaDeEntrega } from '../../../core/entrega/mapa-de-entrega';
import { formatarPrecoCurto } from '../../../core/formatacao/formatacao';
import { Coordenadas, RegraDeEntrega } from '../../../core/modelos/loja';
import { Pedido } from '../../../core/pedido/pedido';
import { Botao } from '../../../ui/botao/botao';
import { Icone } from '../../../ui/icone/icone';

/** Precisão do GPS a partir da qual o resultado pode mudar perto do limite. */
const PRECISAO_RUIM_EM_METROS = 300;

type Consulta =
  | { tipo: 'lugar'; lugar: Lugar }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'buscando-localizacao' }
  | { tipo: 'localizacao'; distancia: number; precisao: number }
  | { tipo: 'sem-localizacao'; motivo: 'negada' | 'indisponivel' };

export type Resultado =
  | { tipo: 'lugar'; lugar: Lugar; situacao: Situacao }
  | { tipo: 'localizacao'; distancia: number; precisaoRuim: boolean; situacao: Situacao }
  | { tipo: 'nao-encontrado'; texto: string }
  | { tipo: 'aguardando' }
  | { tipo: 'sem-mapa' }
  | { tipo: 'sem-localizacao'; motivo: 'negada' | 'indisponivel' };

/**
 * "Confira o seu endereço": a pessoa digita a rua ou o bairro (ou usa a localização do aparelho) e vê
 * se o pedido tem valor mínimo. Tudo é calculado no navegador, sem API de mapas.
 */
@Component({
  selector: 'app-consulta-entrega',
  imports: [Botao, FormField, Icone],
  templateUrl: './consulta-entrega.html',
  styleUrl: './consulta-entrega.scss',
})
export class ConsultaEntrega {
  private readonly mapa = inject(MapaDeEntrega);
  private readonly pedido = inject(Pedido);

  readonly regra = input.required<RegraDeEntrega>();
  readonly loja = input.required<Coordenadas>();

  protected readonly busca = signal({ endereco: '' });
  protected readonly formulario = form(this.busca);

  protected readonly listaAberta = signal(false);
  protected readonly indiceAtivo = signal(-1);
  private readonly consulta = signal<Consulta | null>(null);

  protected readonly raio = computed(() =>
    formatarDistancia(this.regra().raioSemPedidoMinimoEmMetros),
  );
  protected readonly pedidoMinimo = computed(() => formatarPrecoCurto(this.regra().pedidoMinimo));
  protected readonly alcance = computed(() =>
    formatarDistancia(this.mapa.arquivo()?.alcanceEmMetros ?? 5000),
  );
  protected readonly fonteDoMapa = computed(() => this.mapa.arquivo()?.fonte ?? null);

  private readonly lugares = computed(() => {
    const arquivo = this.mapa.arquivo();
    return arquivo ? lugaresDoArquivo(arquivo, this.regra().raioSemPedidoMinimoEmMetros) : [];
  });

  protected readonly sugestoes = computed(() =>
    buscarLugares(this.lugares(), this.busca().endereco),
  );

  protected readonly mostrarSugestoes = computed(
    () => this.listaAberta() && this.sugestoes().length > 0,
  );

  protected readonly idDaSugestaoAtiva = computed(() => {
    const ativa = this.sugestoes()[this.indiceAtivo()];
    return this.mostrarSugestoes() && ativa ? `sugestao-${ativa.chave}` : null;
  });

  protected readonly buscandoLocalizacao = computed(
    () => this.consulta()?.tipo === 'buscando-localizacao',
  );

  protected readonly resultado = computed<Resultado | null>(() => {
    const consulta = this.consulta();
    const raio = this.regra().raioSemPedidoMinimoEmMetros;

    switch (consulta?.tipo) {
      case undefined:
      case 'buscando-localizacao':
        return null;
      case 'lugar':
        return {
          tipo: 'lugar',
          lugar: consulta.lugar,
          situacao: situacaoDoLugar(consulta.lugar, raio),
        };
      case 'localizacao':
        return {
          tipo: 'localizacao',
          distancia: consulta.distancia,
          precisaoRuim: consulta.precisao > PRECISAO_RUIM_EM_METROS,
          situacao: situacaoDaDistancia(
            consulta.distancia,
            raio,
            this.mapa.arquivo()?.alcanceEmMetros ?? 5000,
          ),
        };
      case 'sem-localizacao':
        return consulta;
      case 'texto': {
        if (this.mapa.estado() === 'falhou') return { tipo: 'sem-mapa' };
        if (this.mapa.estado() !== 'pronto') return { tipo: 'aguardando' };
        const [primeiro] = buscarLugares(this.lugares(), consulta.texto, 1);
        return primeiro
          ? { tipo: 'lugar', lugar: primeiro, situacao: situacaoDoLugar(primeiro, raio) }
          : { tipo: 'nao-encontrado', texto: consulta.texto };
      }
    }
  });

  protected carregarMapa(): void {
    this.mapa.carregar();
  }

  protected digitou(): void {
    this.mapa.carregar();
    this.listaAberta.set(true);
    this.indiceAtivo.set(-1);
  }

  protected teclou(evento: KeyboardEvent): void {
    const total = this.sugestoes().length;

    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        this.listaAberta.set(true);
        if (total > 0) this.indiceAtivo.update((indice) => (indice + 1) % total);
        break;
      case 'ArrowUp':
        evento.preventDefault();
        this.listaAberta.set(true);
        if (total > 0) this.indiceAtivo.update((indice) => (indice <= 0 ? total - 1 : indice - 1));
        break;
      case 'Escape':
        if (this.mostrarSugestoes()) {
          evento.preventDefault();
          this.fecharLista();
        }
        break;
    }
  }

  /** Enter no campo ou o botão "Conferir": usa a sugestão destacada ou a primeira que combinar. */
  protected conferir(evento: Event): void {
    evento.preventDefault();
    const ativa = this.mostrarSugestoes() ? this.sugestoes()[this.indiceAtivo()] : undefined;
    if (ativa) {
      this.escolher(ativa);
      return;
    }

    const texto = this.busca().endereco.trim();
    if (texto.length === 0) return;
    this.mapa.carregar();
    this.consulta.set({ tipo: 'texto', texto });
    this.fecharLista();
  }

  protected escolher(lugar: Lugar): void {
    this.busca.set({ endereco: lugar.nome });
    this.consulta.set({ tipo: 'lugar', lugar });
    this.fecharLista();
  }

  /** Fecha a lista quando o foco sai do campo (o clique numa sugestão acontece antes, no mousedown). */
  protected saiuDoCampo(): void {
    this.fecharLista();
  }

  protected usarLocalizacao(): void {
    const geolocalizacao = globalThis.navigator?.geolocation;
    if (!geolocalizacao) {
      this.consulta.set({ tipo: 'sem-localizacao', motivo: 'indisponivel' });
      return;
    }

    this.mapa.carregar();
    this.fecharLista();
    this.consulta.set({ tipo: 'buscando-localizacao' });
    geolocalizacao.getCurrentPosition(
      ({ coords }) =>
        this.consulta.set({
          tipo: 'localizacao',
          distancia: distanciaEmMetros(this.loja(), {
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
          precisao: coords.accuracy,
        }),
      (erro) =>
        this.consulta.set({
          tipo: 'sem-localizacao',
          motivo: erro.code === erro.PERMISSION_DENIED ? 'negada' : 'indisponivel',
        }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  protected fazerPedido(): void {
    this.pedido.abrir();
  }

  protected distancia(metros: number): string {
    return formatarDistancia(metros);
  }

  /** "A Rua X", "O Largo Y" ou "O bairro Z", para começar uma frase. */
  protected sujeito(lugar: Lugar): string {
    return lugar.tipo === 'bairro'
      ? `O bairro ${lugar.nome}`
      : `${artigoDe(lugar.nome).toUpperCase()} ${lugar.nome}`;
  }

  /** "da Rua X", "do Largo Y". */
  protected de(nome: string): string {
    return `d${artigoDe(nome)} ${nome}`;
  }

  private fecharLista(): void {
    this.listaAberta.set(false);
    this.indiceAtivo.set(-1);
  }
}
