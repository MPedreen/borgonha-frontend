import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { makeStateKey, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API_URL } from './api-url';
import { recursoDaApi } from './recurso-da-api';

describe('recursoDaApi', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'https://api.test/api' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca os dados depois que a página aparece no navegador', () => {
    const recurso = TestBed.runInInjectionContext(() => recursoDaApi<string[]>('duvidas'));
    expect(recurso.dados()).toBeUndefined();

    TestBed.tick();
    http.expectOne('https://api.test/api/duvidas').flush(['primeira']);

    expect(recurso.dados()).toEqual(['primeira']);
    expect(recurso.carregando()).toBe(false);
  });

  it('começa com os dados que vieram na página pré-renderizada', () => {
    TestBed.inject(TransferState).set(makeStateKey<string[]>('api:duvidas'), ['do build']);

    const recurso = TestBed.runInInjectionContext(() => recursoDaApi<string[]>('duvidas'));

    expect(recurso.dados()).toEqual(['do build']);
    TestBed.tick();
    http.expectOne('https://api.test/api/duvidas').flush(['atualizado']);
    expect(recurso.dados()).toEqual(['atualizado']);
  });

  it('mantém o conteúdo anterior quando a atualização falha', () => {
    TestBed.inject(TransferState).set(makeStateKey<string[]>('api:duvidas'), ['do build']);
    const recurso = TestBed.runInInjectionContext(() => recursoDaApi<string[]>('duvidas'));

    TestBed.tick();
    http
      .expectOne('https://api.test/api/duvidas')
      .flush('erro', { status: 503, statusText: 'Indisponível' });

    expect(recurso.falhou()).toBe(true);
    expect(recurso.dados()).toEqual(['do build']);
  });
});
