import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ARQUIVO_DE_RUAS, LOJA } from '../../../../testing/dados-de-teste';
import {
  EnderecoSugerido,
  EntregaApi,
  ResultadoDaEntrega,
} from '../../../core/entrega/api-entrega';
import { ArquivoDeRuas } from '../../../core/entrega/consulta-entrega';
import { MapaDeEntrega } from '../../../core/entrega/mapa-de-entrega';
import { LojaStore } from '../../../core/estado/loja-store';
import { Pedido } from '../../../core/pedido/pedido';
import { ConsultaEntrega } from './consulta-entrega';

const AFRANIO: EnderecoSugerido = {
  titulo: 'Rua Afrânio Peixoto 40',
  detalhe: 'Santa Luzia, São Gonçalo - RJ, 24725-270',
  latitude: -22.7997,
  longitude: -42.9789,
};
const OUTRA_CIDADE: EnderecoSugerido = {
  titulo: 'Rua Afrânio Peixoto 40',
  detalhe: 'Centro, Nova Iguaçu - RJ, 26255-470',
  latitude: -22.762,
  longitude: -43.457,
};

const resultado = (
  situacao: ResultadoDaEntrega['situacao'],
  distanciaEmMetros: number | null,
  distanciaEmLinhaRetaEmMetros: number,
): ResultadoDaEntrega => ({ situacao, distanciaEmMetros, distanciaEmLinhaRetaEmMetros });

const erroHttp = (status: number) => throwError(() => new HttpErrorResponse({ status }));

describe('ConsultaEntrega', () => {
  let fixture: ComponentFixture<ConsultaEntrega>;
  let elemento: HTMLElement;

  const api = { buscarEnderecos: vi.fn(), conferir: vi.fn() };
  const mapa = {
    estado: signal<'ocioso' | 'carregando' | 'pronto' | 'falhou'>('pronto'),
    arquivo: signal<ArquivoDeRuas | null>(ARQUIVO_DE_RUAS),
    carregar: vi.fn(),
  };
  const pedido = { abrir: vi.fn() };

  const campo = () => elemento.querySelector<HTMLInputElement>('input[role="combobox"]')!;
  const opcoes = () => Array.from(elemento.querySelectorAll<HTMLLIElement>('[role="option"]'));
  const textoDe = (seletor: string, raiz: ParentNode = elemento) =>
    raiz.querySelector(seletor)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const resultadoNaTela = () => textoDe('.resultado');
  const botao = (nome: string) =>
    Array.from(elemento.querySelectorAll<HTMLElement>('button, a')).find((candidato) =>
      candidato.textContent?.includes(nome),
    );

  async function depois(milissegundos: number): Promise<void> {
    await vi.advanceTimersByTimeAsync(milissegundos);
    await fixture.whenStable();
  }

  async function digitar(texto: string, esperar = 500): Promise<void> {
    campo().value = texto;
    campo().dispatchEvent(new Event('input'));
    await depois(esperar);
  }

  async function teclar(tecla: string): Promise<void> {
    campo().dispatchEvent(new KeyboardEvent('keydown', { key: tecla, cancelable: true }));
    await fixture.whenStable();
  }

  async function conferir(): Promise<void> {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    // O RxJS (pausas da digitação e da falha) usa setInterval e Date; o resto do Angular segue com o tempo real.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    api.buscarEnderecos.mockReset().mockReturnValue(of([AFRANIO, OUTRA_CIDADE]));
    api.conferir.mockReset().mockReturnValue(of(resultado('sem-minimo', 1200, 900)));
    mapa.carregar.mockReset();
    mapa.estado.set('pronto');
    mapa.arquivo.set(ARQUIVO_DE_RUAS);
    pedido.abrir.mockReset();

    TestBed.configureTestingModule({
      providers: [
        { provide: EntregaApi, useValue: api },
        { provide: MapaDeEntrega, useValue: mapa },
        { provide: Pedido, useValue: pedido },
        { provide: LojaStore, useValue: { canaisPedido: signal(LOJA.canaisPedido) } },
      ],
    });
    fixture = TestBed.createComponent(ConsultaEntrega);
    fixture.componentRef.setInput('regra', LOJA.entrega);
    fixture.componentRef.setInput('loja', LOJA.coordenadas);
    elemento = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => vi.useRealTimers());

  describe('com o serviço de mapas', () => {
    it('só busca o endereço depois que a pessoa para de digitar', async () => {
      await digitar('rua afr', 200);
      await digitar('rua afranio peix', 200);
      expect(api.buscarEnderecos).not.toHaveBeenCalled();

      await depois(400);

      expect(api.buscarEnderecos).toHaveBeenCalledTimes(1);
      expect(api.buscarEnderecos).toHaveBeenCalledWith('rua afranio peix');
      expect(campo().getAttribute('aria-expanded')).toBe('true');
      expect(opcoes().map((opcao) => textoDe('.sugestao__detalhe', opcao))).toEqual([
        'Santa Luzia, São Gonçalo - RJ, 24725-270',
        'Centro, Nova Iguaçu - RJ, 26255-470',
      ]);
      expect(textoDe('.sugestao__nome', opcoes()[0])).toBe('Rua Afrânio Peixoto 40');
    });

    it('não gasta consulta com menos de 4 letras', async () => {
      await digitar('rua');

      expect(api.buscarEnderecos).not.toHaveBeenCalled();
      expect(opcoes()).toHaveLength(0);
    });

    it('confere o endereço escolhido e diz que não tem pedido mínimo', async () => {
      await digitar('rua afranio peixoto 40');
      await teclar('ArrowDown');
      expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[0].id);
      await conferir();

      expect(api.conferir).toHaveBeenCalledWith(AFRANIO.latitude, AFRANIO.longitude);
      expect(campo().value).toBe('Rua Afrânio Peixoto 40');
      expect(campo().getAttribute('aria-expanded')).toBe('false');
      expect(resultadoNaTela()).toContain('Rua Afrânio Peixoto 40 · Santa Luzia');
      expect(resultadoNaTela()).toContain('Sem pedido mínimo');
      expect(resultadoNaTela()).toContain(
        'a cerca de 1,2 km da loja. Pode pedir o valor que quiser',
      );
      expect(botao('Fazer meu pedido')).toBeDefined();
    });

    it('escolhe uma sugestão com o clique', async () => {
      await digitar('rua afranio peixoto 40');

      opcoes()[1].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      await fixture.whenStable();

      expect(api.conferir).toHaveBeenCalledWith(OUTRA_CIDADE.latitude, OUTRA_CIDADE.longitude);
    });

    it('avisa o pedido mínimo e a distância do trajeto', async () => {
      api.conferir.mockReturnValue(of(resultado('com-minimo', 1900, 1400)));
      await digitar('rua afranio peixoto 40');
      await conferir();

      expect(resultadoNaTela()).toContain('Pedido mínimo de');
      expect(resultadoNaTela()).toContain(
        'a cerca de 1,9 km da loja. A entrega é grátis a partir de',
      );
    });

    it('longe da loja, diz só que passa do raio, sem inventar um trajeto', async () => {
      api.conferir.mockReturnValue(of(resultado('com-minimo', null, 2500)));
      await digitar('rua afranio peixoto 40');
      await conferir();

      expect(resultadoNaTela()).toContain(
        'a mais de 1,5 km da loja. A entrega é grátis a partir de',
      );
    });

    it('perto de 1,5 km, ainda não tem pedido mínimo', async () => {
      api.conferir.mockReturnValue(of(resultado('sem-minimo', 1700, 1300)));
      await digitar('rua afranio peixoto 40');
      await conferir();

      expect(resultadoNaTela()).toContain('Sem pedido mínimo');
      expect(resultadoNaTela()).toContain(
        'a cerca de 1,7 km da loja. Pode pedir o valor que quiser',
      );
      expect(resultadoNaTela()).not.toContain('Pedido mínimo de');
    });

    it('além do alcance, pede para perguntar no WhatsApp', async () => {
      api.conferir.mockReturnValue(of(resultado('fora-da-regiao', null, 9000)));
      await digitar('rua afranio peixoto 40');
      await conferir();

      expect(resultadoNaTela()).toContain('Mais longe que Santa Luzia e região');
      const whatsapp = botao('Perguntar no WhatsApp') as HTMLAnchorElement;
      expect(whatsapp.href).toContain('https://wa.me/5521974509789?text=');
      expect(decodeURIComponent(whatsapp.href)).toContain('Rua Afrânio Peixoto 40, Santa Luzia');
      expect(botao('Fazer meu pedido')).toBeUndefined();
    });

    it('com Enter direto, usa a primeira sugestão sem buscar de novo', async () => {
      await digitar('rua afranio peixoto 40');
      api.buscarEnderecos.mockClear();
      await conferir();

      expect(api.buscarEnderecos).not.toHaveBeenCalled();
      expect(api.conferir).toHaveBeenCalledWith(AFRANIO.latitude, AFRANIO.longitude);
    });

    it('com Enter antes da pausa da digitação, busca na hora e confere o primeiro endereço', async () => {
      campo().value = 'rua afranio peixoto 40';
      campo().dispatchEvent(new Event('input'));
      await fixture.whenStable();
      await conferir();

      expect(api.buscarEnderecos).toHaveBeenCalledWith('rua afranio peixoto 40');
      expect(api.conferir).toHaveBeenCalledWith(AFRANIO.latitude, AFRANIO.longitude);
    });

    it('avisa quando o endereço não existe', async () => {
      api.buscarEnderecos.mockReturnValue(of([]));
      await digitar('rua inventada 123');
      await conferir();

      expect(resultadoNaTela()).toContain('Não encontramos “rua inventada 123”');
    });

    it('pede mais letras quando o texto é curto demais para conferir', async () => {
      await digitar('ab');
      await conferir();

      expect(resultadoNaTela()).toContain('Digite pelo menos 4 letras');
      expect(api.buscarEnderecos).not.toHaveBeenCalled();
    });

    it('fecha as sugestões com Esc', async () => {
      await digitar('rua afranio peixoto 40');
      await teclar('Escape');

      expect(campo().getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('quando o serviço de mapas está indisponível', () => {
    beforeEach(() => api.buscarEnderecos.mockReturnValue(erroHttp(503)));

    it('pede para falar pelo WhatsApp e passa a sugerir ruas da lista do site', async () => {
      await digitar('afranio');

      const aviso = textoDe('[data-teste="aviso-de-falha"]');
      expect(aviso).toContain('Conferência de endereço temporariamente indisponível');
      expect(aviso).toContain('Fale com a gente pelo WhatsApp');
      expect((botao('Chamar no WhatsApp') as HTMLAnchorElement).href).toContain('https://wa.me/');
      expect(mapa.carregar).toHaveBeenCalled();

      await digitar('afranio peixoto');
      expect(opcoes().map((opcao) => opcao.querySelector('.sugestao__nome')?.textContent)).toEqual([
        'Rua Afrânio Peixoto',
      ]);
    });

    it('na lista de ruas, o resultado é uma estimativa em linha reta', async () => {
      await digitar('afranio peixoto');
      await conferir();

      expect(resultadoNaTela()).toContain('Sem pedido mínimo (estimativa)');
      expect(resultadoNaTela()).toContain('em linha reta');
    });

    it('volta a usar o serviço depois de um minuto', async () => {
      await digitar('afranio');
      api.buscarEnderecos.mockReturnValue(of([AFRANIO]));
      api.buscarEnderecos.mockClear();

      await depois(61_000);
      await digitar('rua afranio peixoto 40');

      expect(api.buscarEnderecos).toHaveBeenCalledWith('rua afranio peixoto 40');
      expect(textoDe('.resultado')).not.toContain('temporariamente indisponível');
    });

    it('se falhar na hora de conferir, o aviso fica na tela mesmo depois da pausa', async () => {
      api.buscarEnderecos.mockReturnValue(of([AFRANIO]));
      api.conferir.mockReturnValue(erroHttp(503));
      await digitar('rua afranio peixoto 40');
      await conferir();
      await depois(61_000);

      expect(textoDe('[data-teste="aviso-de-falha"]')).toContain('temporariamente indisponível');
    });
  });

  it('com consultas demais, pede para esperar um instante', async () => {
    api.buscarEnderecos.mockReturnValue(erroHttp(429));
    await digitar('rua afranio peixoto 40');

    expect(textoDe('[data-teste="aviso-de-falha"]')).toContain('Muitas consultas seguidas');
  });

  describe('com a localização do aparelho', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation');

    function simular(posicao: Partial<GeolocationCoordinates> | null, codigoDoErro = 1): void {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (sucesso: PositionCallback, falha: PositionErrorCallback) =>
            posicao
              ? sucesso({ coords: { accuracy: 20, ...posicao } } as GeolocationPosition)
              : falha({ code: codigoDoErro, PERMISSION_DENIED: 1 } as GeolocationPositionError),
        },
      });
    }

    afterEach(() => {
      if (original) {
        Object.defineProperty(navigator, 'geolocation', original);
      } else {
        delete (navigator as { geolocation?: unknown }).geolocation;
      }
    });

    async function usarLocalizacao(): Promise<void> {
      botao('Usar minha localização')!.click();
      await fixture.whenStable();
    }

    it('manda as coordenadas para a API conferir o trajeto', async () => {
      simular({ latitude: -22.8105, longitude: -42.9805 });
      await usarLocalizacao();

      expect(api.conferir).toHaveBeenCalledWith(-22.8105, -42.9805);
      expect(resultadoNaTela()).toContain('Sem pedido mínimo');
      expect(resultadoNaTela()).toContain('Você está a cerca de 1,2 km da loja. Pode pedir');
    });

    it('avisa da imprecisão do aparelho', async () => {
      api.conferir.mockReturnValue(of(resultado('com-minimo', 2100, 1800)));
      simular({ latitude: -22.83, longitude: -42.99, accuracy: 900 });
      await usarLocalizacao();

      expect(resultadoNaTela()).toContain('Pedido mínimo de');
      expect(resultadoNaTela()).toContain('imprecisa');
    });

    it('se a API falhar, calcula a distância em linha reta no aparelho e avisa', async () => {
      api.conferir.mockReturnValue(erroHttp(503));
      simular({ latitude: -22.8105, longitude: -42.9805 });
      await usarLocalizacao();

      expect(resultadoNaTela()).toContain('Sem pedido mínimo (estimativa)');
      expect(resultadoNaTela()).toContain('Você está a cerca de 950 m da loja em linha reta');
      expect(textoDe('[data-teste="aviso-de-falha"]')).toContain('temporariamente indisponível');
    });

    it('explica o que fazer quando a localização não é permitida', async () => {
      simular(null, 1);
      await usarLocalizacao();

      expect(resultadoNaTela()).toContain('O acesso à localização não foi permitido');
    });
  });
});
