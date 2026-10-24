import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CATALOGO } from '../../../testing/dados-de-teste';
import { API_URL } from '../api/api-url';
import { CatalogoStore } from './catalogo-store';

describe('CatalogoStore', () => {
  let store: CatalogoStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClientTesting(), { provide: API_URL, useValue: '/api' }],
    });
    store = TestBed.inject(CatalogoStore);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });

  afterEach(() => http.verify());

  it('separa os produtos por categoria', () => {
    http.expectOne('/api/catalogo').flush(CATALOGO);

    expect(store.cookies().map((produto) => produto.slug)).toEqual(['nutella', 'pistache']);
    expect(store.doces().map((produto) => produto.slug)).toEqual(['bolo-de-pote']);
    expect(store.salgados().map((produto) => produto.slug)).toEqual(['coxinha']);
  });

  it('lista na galeria só os cookies que têm foto partido ao meio', () => {
    http.expectOne('/api/catalogo').flush(CATALOGO);

    expect(store.cookiesPartidos().map((produto) => produto.slug)).toEqual(['nutella']);
  });

  it('indica quando o cardápio não pôde ser carregado', () => {
    expect(store.carregando()).toBe(true);

    http.expectOne('/api/catalogo').flush('erro', { status: 500, statusText: 'Erro' });

    expect(store.carregando()).toBe(false);
    expect(store.indisponivel()).toBe(true);
    expect(store.cookies()).toEqual([]);
  });
});
