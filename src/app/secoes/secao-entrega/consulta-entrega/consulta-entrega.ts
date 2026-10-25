import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField, maxLength } from '@angular/forms/signals';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  Subject,
  Subscription,
  switchMap,
  timer,
} from 'rxjs';
import {
  EnderecoSugerido,
  EntregaApi,
  FalhaDaConsulta,
  falhaDaConsulta,
  ResultadoDaEntrega,
  SituacaoDaEntrega,
} from '../../../core/entrega/api-entrega';
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
import { LojaStore } from '../../../core/estado/loja-store';
import { formatarPrecoCurto } from '../../../core/formatacao/formatacao';
import { Coordenadas, RegraDeEntrega } from '../../../core/modelos/loja';
import { Pedido } from '../../../core/pedido/pedido';
import { linkDoWhatsApp } from '../../../core/pedido/mensagem-whatsapp';
import { Botao } from '../../../ui/botao/botao';
import { Icone } from '../../../ui/icone/icone';

/** Espera depois da última tecla antes de buscar o endereço: cada busca gasta crédito do serviço de mapas. */
const ESPERA_DA_DIGITACAO_EM_MS = 450;
const MINIMO_DE_LETRAS = 4;
const TAMANHO_MAXIMO_DO_ENDERECO = 120;
/** Depois de uma falha, a busca por endereço descansa; até lá, vale a lista de ruas do site. */
const PAUSA_APOS_FALHA_EM_MS: Record<FalhaDaConsulta, number> = {
  'muitas-consultas': 20_000,
  indisponivel: 60_000,
};
/** Precisão do GPS a partir da qual o resultado pode mudar perto do limite. */
const PRECISAO_RUIM_EM_METROS = 300;

/** Uma linha da lista de sugestões: um endereço do serviço de mapas ou, na falha, uma rua da lista do site. */
export interface OpcaoDeBusca {
  chave: string;
  titulo: string;
  detalhe: string;
  endereco: EnderecoSugerido | null;
  lugar: Lugar | null;
}

type Consulta =
  | { tipo: 'procurando' }
  | { tipo: 'conferindo' }
  | { tipo: 'curto' }
  | { tipo: 'sem-endereco'; texto: string }
  | { tipo: 'endereco'; endereco: EnderecoSugerido; resultado: ResultadoDaEntrega }
  | { tipo: 'localizacao'; resultado: ResultadoDaEntrega; precisao: number }
  | { tipo: 'falha'; motivo: FalhaDaConsulta }
  | { tipo: 'lugar'; lugar: Lugar }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'buscando-localizacao' }
  | { tipo: 'localizacao-local'; distancia: number; precisao: number }
  | { tipo: 'sem-localizacao'; motivo: 'negada' | 'indisponivel' };

export type Resultado =
  | { tipo: 'carregando'; rotulo: string }
  | { tipo: 'curto' }
  | { tipo: 'sem-endereco'; texto: string }
  | {
      tipo: 'entrega';
      endereco: EnderecoSugerido | null;
      situacao: SituacaoDaEntrega;
      distancia: number | null;
      linhaReta: number;
      precisaoRuim: boolean;
    }
  | { tipo: 'lugar'; lugar: Lugar; situacao: Situacao }
  | { tipo: 'localizacao-local'; distancia: number; precisaoRuim: boolean; situacao: Situacao }
  | { tipo: 'nao-encontrado'; texto: string }
  | { tipo: 'aguardando' }
  | { tipo: 'sem-mapa' }
  | { tipo: 'sem-localizacao'; motivo: 'negada' | 'indisponivel' };

/**
 * "Confira o seu endereço": a pessoa digita o endereço, escolhe a sugestão e vê se o pedido tem valor mínimo
 * (ou usa a localização do aparelho). Se o serviço de mapas falhar ou o limite do dia acabar, o site pede para
 * confirmar pelo WhatsApp e, enquanto isso, deixa procurar pelo nome da rua na lista que vai junto com o site.
 */
@Component({
  selector: 'app-consulta-entrega',
  imports: [Botao, FormField, Icone],
  templateUrl: './consulta-entrega.html',
  styleUrl: './consulta-entrega.scss',
})
export class ConsultaEntrega {
  private readonly api = inject(EntregaApi);
  private readonly mapa = inject(MapaDeEntrega);
  private readonly pedido = inject(Pedido);
  private readonly lojaStore = inject(LojaStore);

  readonly regra = input.required<RegraDeEntrega>();
  readonly loja = input.required<Coordenadas>();

  protected readonly busca = signal({ endereco: '' });
  protected readonly formulario = form(this.busca, (campo) => {
    maxLength(campo.endereco, TAMANHO_MAXIMO_DO_ENDERECO);
  });

  protected readonly listaAberta = signal(false);
  protected readonly indiceAtivo = signal(-1);
  protected readonly buscandoEnderecos = signal(false);
  protected readonly semResultados = signal(false);
  /** Enquanto não for nulo, a busca por endereço está em pausa e vale a lista de ruas do site. */
  protected readonly falhaDoServico = signal<FalhaDaConsulta | null>(null);

  private readonly sugestoesDaApi = signal<EnderecoSugerido[]>([]);
  private readonly textoDasSugestoes = signal('');
  private readonly consulta = signal<Consulta | null>(null);

  private readonly digitacao = new Subject<string>();
  private conferencia?: Subscription;
  private fimDaPausa?: Subscription;
  private ultimaEscolha: EnderecoSugerido | null = null;

  protected readonly raio = computed(() =>
    formatarDistancia(this.regra().raioSemPedidoMinimoEmMetros),
  );
  protected readonly pedidoMinimo = computed(() => formatarPrecoCurto(this.regra().pedidoMinimo));
  protected readonly alcance = computed(() =>
    formatarDistancia(this.mapa.arquivo()?.alcanceEmMetros ?? 5000),
  );

  private readonly lugares = computed(() => {
    const arquivo = this.mapa.arquivo();
    return arquivo ? lugaresDoArquivo(arquivo, this.regra().raioSemPedidoMinimoEmMetros) : [];
  });

  protected readonly opcoes = computed<OpcaoDeBusca[]>(() => {
    if (this.falhaDoServico()) {
      return buscarLugares(this.lugares(), this.busca().endereco).map((lugar) => ({
        chave: lugar.chave,
        titulo: lugar.nome,
        detalhe: lugar.detalhe,
        endereco: null,
        lugar,
      }));
    }

    return this.sugestoesDaApi().map((endereco, indice) => ({
      chave: `e${indice}`,
      titulo: endereco.titulo,
      detalhe: endereco.detalhe,
      endereco,
      lugar: null,
    }));
  });

  protected readonly mostrarSugestoes = computed(
    () => this.listaAberta() && this.opcoes().length > 0,
  );

  protected readonly idDaSugestaoAtiva = computed(() => {
    const ativa = this.opcoes()[this.indiceAtivo()];
    return this.mostrarSugestoes() && ativa ? `sugestao-${ativa.chave}` : null;
  });

  /** Avisa quem usa leitor de tela o que apareceu na lista. */
  protected readonly anuncio = computed(() => {
    const total = this.opcoes().length;
    if (this.mostrarSugestoes()) {
      return total === 1
        ? '1 sugestão. Use as setas e Enter para escolher.'
        : `${total} sugestões. Use as setas e Enter para escolher.`;
    }
    return this.semResultados() ? 'Nenhum endereço encontrado.' : '';
  });

  protected readonly buscandoLocalizacao = computed(
    () => this.consulta()?.tipo === 'buscando-localizacao',
  );

  /** Motivo da pausa da busca por endereço, para mostrar o aviso (também depois que a pausa acabar). */
  protected readonly falhaVisivel = computed(() => {
    const consulta = this.consulta();
    return this.falhaDoServico() ?? (consulta?.tipo === 'falha' ? consulta.motivo : null);
  });

  protected readonly resultado = computed<Resultado | null>(() => {
    const consulta = this.consulta();
    const raio = this.regra().raioSemPedidoMinimoEmMetros;

    switch (consulta?.tipo) {
      case undefined:
      case 'buscando-localizacao':
      case 'falha':
        return null;
      case 'procurando':
        return { tipo: 'carregando', rotulo: 'Procurando seu endereço…' };
      case 'conferindo':
        return { tipo: 'carregando', rotulo: 'Conferindo a distância…' };
      case 'curto':
      case 'sem-endereco':
      case 'sem-localizacao':
        return consulta;
      case 'endereco':
        return {
          tipo: 'entrega',
          endereco: consulta.endereco,
          situacao: consulta.resultado.situacao,
          distancia: consulta.resultado.distanciaEmMetros,
          linhaReta: consulta.resultado.distanciaEmLinhaRetaEmMetros,
          precisaoRuim: false,
        };
      case 'localizacao':
        return {
          tipo: 'entrega',
          endereco: null,
          situacao: consulta.resultado.situacao,
          distancia: consulta.resultado.distanciaEmMetros,
          linhaReta: consulta.resultado.distanciaEmLinhaRetaEmMetros,
          precisaoRuim: consulta.precisao > PRECISAO_RUIM_EM_METROS,
        };
      case 'lugar':
        return {
          tipo: 'lugar',
          lugar: consulta.lugar,
          situacao: situacaoDoLugar(consulta.lugar, raio),
        };
      case 'localizacao-local':
        return {
          tipo: 'localizacao-local',
          distancia: consulta.distancia,
          precisaoRuim: consulta.precisao > PRECISAO_RUIM_EM_METROS,
          situacao: situacaoDaDistancia(consulta.distancia, raio),
        };
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

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.digitacao
      .pipe(
        map((texto) => texto.trim()),
        debounceTime(ESPERA_DA_DIGITACAO_EM_MS),
        distinctUntilChanged(),
        switchMap((texto) => {
          if (texto.length < MINIMO_DE_LETRAS || this.falhaDoServico()) {
            return of({ texto, lista: [] as EnderecoSugerido[], buscou: false });
          }

          this.buscandoEnderecos.set(true);
          return this.api.buscarEnderecos(texto).pipe(
            map((lista) => ({ texto, lista, buscou: true })),
            catchError((erro: unknown) => {
              this.registrarFalha(erro);
              return of({ texto, lista: [] as EnderecoSugerido[], buscou: false });
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ texto, lista, buscou }) => {
        this.buscandoEnderecos.set(false);
        this.sugestoesDaApi.set(lista);
        this.textoDasSugestoes.set(texto);
        this.semResultados.set(buscou && lista.length === 0);
      });

    destroyRef.onDestroy(() => {
      this.conferencia?.unsubscribe();
      this.fimDaPausa?.unsubscribe();
    });
  }

  protected digitou(evento: Event): void {
    this.digitacao.next((evento.target as HTMLInputElement).value);
    this.listaAberta.set(true);
    this.indiceAtivo.set(-1);
  }

  protected teclou(evento: KeyboardEvent): void {
    const total = this.opcoes().length;

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

  /** Enter no campo ou o botão "Conferir": usa a sugestão destacada ou, sem ela, a primeira que combinar. */
  protected conferir(evento: Event): void {
    evento.preventDefault();
    const ativa = this.mostrarSugestoes() ? this.opcoes()[this.indiceAtivo()] : undefined;
    if (ativa) {
      this.escolher(ativa);
      return;
    }

    const texto = this.busca().endereco.trim();
    if (texto.length === 0) return;
    this.fecharLista();

    if (this.falhaDoServico()) {
      this.mapa.carregar();
      this.consulta.set({ tipo: 'texto', texto });
      return;
    }

    if (texto.length < MINIMO_DE_LETRAS) {
      this.consulta.set({ tipo: 'curto' });
      return;
    }

    if (this.ultimaEscolha?.titulo === texto) {
      this.conferirEndereco(this.ultimaEscolha);
      return;
    }

    const jaSugeridos = this.textoDasSugestoes() === texto ? this.sugestoesDaApi() : [];
    if (jaSugeridos.length > 0) {
      this.conferirEndereco(jaSugeridos[0]);
      return;
    }

    this.conferencia?.unsubscribe();
    this.consulta.set({ tipo: 'procurando' });
    this.conferencia = this.api.buscarEnderecos(texto).subscribe({
      next: (lista) =>
        lista.length > 0
          ? this.conferirEndereco(lista[0])
          : this.consulta.set({ tipo: 'sem-endereco', texto }),
      error: (erro: unknown) => this.falhouNaConferencia(erro),
    });
  }

  protected escolher(opcao: OpcaoDeBusca): void {
    this.busca.set({ endereco: opcao.titulo });
    this.fecharLista();

    if (opcao.endereco) {
      this.conferirEndereco(opcao.endereco);
    } else if (opcao.lugar) {
      this.consulta.set({ tipo: 'lugar', lugar: opcao.lugar });
    }
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

    this.fecharLista();
    this.conferencia?.unsubscribe();
    this.consulta.set({ tipo: 'buscando-localizacao' });
    geolocalizacao.getCurrentPosition(
      ({ coords }) => this.conferirLocalizacao(coords.latitude, coords.longitude, coords.accuracy),
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

  /** Link do WhatsApp com a pergunta pronta, para quem precisa confirmar a entrega com a loja. */
  protected linkDoWhatsApp(endereco: EnderecoSugerido | null): string | null {
    const canal = this.lojaStore.canaisPedido().find((candidato) => candidato.tipo === 'whatsapp');
    if (!canal) return null;

    const mensagem = endereco
      ? `Olá! Quero saber se a entrega para ${endereco.titulo}, ${endereco.detalhe} tem pedido mínimo.`
      : 'Olá! Quero saber se o meu endereço tem pedido mínimo na entrega.';
    return linkDoWhatsApp(canal.url, mensagem, null);
  }

  protected distancia(metros: number): string {
    return formatarDistancia(metros);
  }

  /** "A Rua X", "O Largo Y" ou "O bairro Z", para começar uma frase (lista de ruas do site). */
  protected sujeito(lugar: Lugar): string {
    return lugar.tipo === 'bairro'
      ? `O bairro ${lugar.nome}`
      : `${artigoDe(lugar.nome).toUpperCase()} ${lugar.nome}`;
  }

  /** "da Rua X", "do Largo Y". */
  protected de(nome: string): string {
    return `d${artigoDe(nome)} ${nome}`;
  }

  private conferirEndereco(endereco: EnderecoSugerido): void {
    this.ultimaEscolha = endereco;
    this.conferencia?.unsubscribe();
    this.consulta.set({ tipo: 'conferindo' });
    this.conferencia = this.api.conferir(endereco.latitude, endereco.longitude).subscribe({
      next: (resultado) => this.consulta.set({ tipo: 'endereco', endereco, resultado }),
      error: (erro: unknown) => this.falhouNaConferencia(erro),
    });
  }

  private conferirLocalizacao(latitude: number, longitude: number, precisao: number): void {
    const resultadoLocal = (): Consulta => ({
      tipo: 'localizacao-local',
      distancia: distanciaEmMetros(this.loja(), { latitude, longitude }),
      precisao,
    });

    if (this.falhaDoServico()) {
      this.mapa.carregar();
      this.consulta.set(resultadoLocal());
      return;
    }

    this.consulta.set({ tipo: 'conferindo' });
    this.conferencia = this.api.conferir(latitude, longitude).subscribe({
      next: (resultado) => this.consulta.set({ tipo: 'localizacao', resultado, precisao }),
      error: (erro: unknown) => {
        this.registrarFalha(erro);
        this.consulta.set(resultadoLocal());
      },
    });
  }

  private falhouNaConferencia(erro: unknown): void {
    this.registrarFalha(erro);
    this.consulta.set({ tipo: 'falha', motivo: falhaDaConsulta(erro) });
  }

  private registrarFalha(erro: unknown): void {
    const motivo = falhaDaConsulta(erro);
    this.falhaDoServico.set(motivo);
    this.buscandoEnderecos.set(false);
    this.sugestoesDaApi.set([]);
    this.mapa.carregar();

    this.fimDaPausa?.unsubscribe();
    this.fimDaPausa = timer(PAUSA_APOS_FALHA_EM_MS[motivo]).subscribe(() =>
      this.falhaDoServico.set(null),
    );
  }

  private fecharLista(): void {
    this.listaAberta.set(false);
    this.indiceAtivo.set(-1);
  }
}
