import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../api/api-url';
import { EntregaApi, falhaDaConsulta } from './api-entrega';

describe('EntregaApi', () => {
  let api: EntregaApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(EntregaApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca os endereços na API e guarda a resposta para o mesmo texto', () => {
    const sugestoes = [{ titulo: 'Rua A 1', detalhe: 'Bairro', latitude: 1, longitude: 2 }];
    const recebidas: unknown[] = [];

    api.buscarEnderecos('Rua Afrânio  40').subscribe((lista) => recebidas.push(lista));
    const requisicao = http.expectOne(
      (pedido) =>
        pedido.url === '/api/entrega/enderecos' && pedido.params.get('texto') === 'Rua Afrânio  40',
    );
    requisicao.flush(sugestoes);

    api.buscarEnderecos('  rua afrânio 40 ').subscribe((lista) => recebidas.push(lista));
    http.expectNone('/api/entrega/enderecos');

    expect(recebidas).toEqual([sugestoes, sugestoes]);
  });

  it('confere a entrega pelas coordenadas e guarda o resultado', () => {
    const resultado = {
      situacao: 'sem-minimo',
      distanciaEmMetros: 1200,
      distanciaEmLinhaRetaEmMetros: 900,
    };
    const recebidos: unknown[] = [];

    api.conferir(-22.8105, -42.9805).subscribe((valor) => recebidos.push(valor));
    http
      .expectOne(
        (pedido) =>
          pedido.url === '/api/entrega/conferir' &&
          pedido.params.get('latitude') === '-22.8105' &&
          pedido.params.get('longitude') === '-42.9805',
      )
      .flush(resultado);

    api.conferir(-22.8105, -42.9805).subscribe((valor) => recebidos.push(valor));
    http.expectNone('/api/entrega/conferir');

    expect(recebidos).toEqual([resultado, resultado]);
  });

  it('não guarda respostas com erro', () => {
    api.buscarEnderecos('rua afranio').subscribe({ error: () => undefined });
    http
      .expectOne((pedido) => pedido.url === '/api/entrega/enderecos')
      .flush(null, { status: 503, statusText: 'x' });

    api.buscarEnderecos('rua afranio').subscribe();
    http.expectOne((pedido) => pedido.url === '/api/entrega/enderecos').flush([]);
  });

  it('distingue consultas demais de serviço indisponível', () => {
    expect(falhaDaConsulta(new HttpErrorResponse({ status: 429 }))).toBe('muitas-consultas');
    expect(falhaDaConsulta(new HttpErrorResponse({ status: 503 }))).toBe('indisponivel');
    expect(falhaDaConsulta(new HttpErrorResponse({ status: 0 }))).toBe('indisponivel');
    expect(falhaDaConsulta(new Error('x'))).toBe('indisponivel');
  });
});
