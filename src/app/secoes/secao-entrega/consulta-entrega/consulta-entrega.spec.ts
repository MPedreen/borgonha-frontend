import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ARQUIVO_DE_RUAS, LOJA } from '../../../../testing/dados-de-teste';
import { ArquivoDeRuas } from '../../../core/entrega/consulta-entrega';
import { MapaDeEntrega } from '../../../core/entrega/mapa-de-entrega';
import { Pedido } from '../../../core/pedido/pedido';
import { ConsultaEntrega } from './consulta-entrega';

describe('ConsultaEntrega', () => {
  let fixture: ComponentFixture<ConsultaEntrega>;
  let elemento: HTMLElement;
  const mapa = {
    estado: signal<'ocioso' | 'carregando' | 'pronto' | 'falhou'>('pronto'),
    arquivo: signal<ArquivoDeRuas | null>(ARQUIVO_DE_RUAS),
    carregar: vi.fn(),
  };
  const pedido = { abrir: vi.fn() };

  const campo = () => elemento.querySelector<HTMLInputElement>('input[role="combobox"]')!;
  const opcoes = () => Array.from(elemento.querySelectorAll<HTMLLIElement>('[role="option"]'));
  const resultado = () =>
    elemento.querySelector('.resultado')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  async function digitar(texto: string): Promise<void> {
    campo().value = texto;
    campo().dispatchEvent(new Event('input'));
    await fixture.whenStable();
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
    mapa.estado.set('pronto');
    mapa.arquivo.set(ARQUIVO_DE_RUAS);
    TestBed.configureTestingModule({
      providers: [
        { provide: MapaDeEntrega, useValue: mapa },
        { provide: Pedido, useValue: pedido },
      ],
    });
    fixture = TestBed.createComponent(ConsultaEntrega);
    fixture.componentRef.setInput('regra', LOJA.entrega);
    fixture.componentRef.setInput('loja', LOJA.coordenadas);
    elemento = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('sugere ruas e bairros enquanto a pessoa digita', async () => {
    await digitar('peixoto');

    expect(campo().getAttribute('aria-expanded')).toBe('true');
    expect(opcoes().map((opcao) => opcao.querySelector('.sugestao__nome')?.textContent)).toEqual([
      'Rua Afrânio Peixoto',
      'Rua Coronel Peixoto',
    ]);
  });

  it('escolhe a sugestão pelo teclado e diz que não tem pedido mínimo perto da loja', async () => {
    await digitar('afranio');
    await teclar('ArrowDown');

    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[0].id);

    await conferir();

    expect(campo().value).toBe('Rua Afrânio Peixoto');
    expect(campo().getAttribute('aria-expanded')).toBe('false');
    expect(resultado()).toContain('Sem pedido mínimo');
    expect(resultado()).toContain('A Rua Afrânio Peixoto fica a até 1,5 km da loja');
  });

  it('avisa o pedido mínimo para uma rua mais longe que o raio', async () => {
    await digitar('coronel peixoto');
    await conferir();

    expect(resultado()).toContain('Pedido mínimo de R$');
    expect(resultado()).toContain('30');
    expect(resultado()).toContain('a partir de 2,5 km');
  });

  it('explica a rua que cruza o limite com os cruzamentos de cada lado', async () => {
    await digitar('av santa luzia');
    await conferir();

    expect(resultado()).toContain('Depende do trecho da rua');
    expect(resultado()).toContain('Perto da Rua Afrânio Peixoto, não tem pedido mínimo');
    expect(resultado()).toContain('perto da Rua 1, o pedido mínimo é de R$');
  });

  it('pede a rua quando o bairro tem partes dos dois lados do limite', async () => {
    await digitar('santa luzia');
    await conferir();

    expect(resultado()).toContain('Depende da sua rua');
    expect(resultado()).toContain('Digite o nome da sua rua');
  });

  it('diz quando não encontra a rua', async () => {
    await digitar('rua inventada');
    await conferir();

    expect(resultado()).toContain('Não encontramos “rua inventada”');
    expect(resultado()).toContain('5 km');
  });

  it('espera a lista de ruas chegar antes de responder', async () => {
    mapa.estado.set('carregando');
    mapa.arquivo.set(null);
    await digitar('afranio');
    await conferir();

    expect(mapa.carregar).toHaveBeenCalled();
    expect(resultado()).toContain('Procurando sua rua');

    mapa.arquivo.set(ARQUIVO_DE_RUAS);
    mapa.estado.set('pronto');
    await fixture.whenStable();

    expect(resultado()).toContain('Sem pedido mínimo');
  });

  it('fecha as sugestões com Esc', async () => {
    await digitar('peixoto');
    await teclar('Escape');

    expect(campo().getAttribute('aria-expanded')).toBe('false');
  });

  describe('com a localização do aparelho', () => {
    const geolocalizacaoOriginal = Object.getOwnPropertyDescriptor(navigator, 'geolocation');

    function simularLocalizacao(posicao: GeolocationPosition | null, erro?: number): void {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (sucesso: PositionCallback, falha: PositionErrorCallback) =>
            posicao
              ? sucesso(posicao)
              : falha({ code: erro!, PERMISSION_DENIED: 1 } as GeolocationPositionError),
        },
      });
    }

    const posicao = (latitude: number, longitude: number, accuracy = 20) =>
      ({ coords: { latitude, longitude, accuracy } }) as GeolocationPosition;

    afterEach(() => {
      if (geolocalizacaoOriginal) {
        Object.defineProperty(navigator, 'geolocation', geolocalizacaoOriginal);
      } else {
        delete (navigator as { geolocation?: unknown }).geolocation;
      }
    });

    async function usarLocalizacao(): Promise<void> {
      Array.from(elemento.querySelectorAll('button'))
        .find((botao) => botao.textContent?.includes('Usar minha localização'))!
        .click();
      await fixture.whenStable();
    }

    it('calcula a distância até a loja sem chamar nenhuma API', async () => {
      // ~930 m ao sul da loja
      simularLocalizacao(posicao(-22.8105, -42.9805));
      await usarLocalizacao();

      expect(resultado()).toContain('Sem pedido mínimo');
      expect(resultado()).toContain('Você está a cerca de 950 m da loja');
    });

    it('avisa o pedido mínimo e a imprecisão do aparelho', async () => {
      simularLocalizacao(posicao(-22.83, -42.99, 900));
      await usarLocalizacao();

      expect(resultado()).toContain('Pedido mínimo de R$');
      expect(resultado()).toContain('imprecisa');
    });

    it('pede para falar no WhatsApp quando a pessoa está longe da região', async () => {
      simularLocalizacao(posicao(-22.9, -43.1));
      await usarLocalizacao();

      expect(resultado()).toContain('Mais longe que Santa Luzia e região');
    });

    it('explica o que fazer quando a localização não é permitida', async () => {
      simularLocalizacao(null, 1);
      await usarLocalizacao();

      expect(resultado()).toContain('O acesso à localização não foi permitido');
    });
  });
});
