import { IMAGE_LOADER } from '@angular/common';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { API_URL } from './core/api/api-url';
import { carregadorDeImagens } from './core/imagens/carregador-de-imagens';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
        { provide: IMAGE_LOADER, useValue: carregadorDeImagens },
      ],
    });
  });

  it('monta a estrutura da página: aviso, cabeçalho, conteúdo, rodapé e painel de pedido', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const elemento = fixture.nativeElement as HTMLElement;

    for (const seletor of [
      'app-barra-aviso',
      'app-cabecalho',
      'main#conteudo',
      'app-rodape',
      'app-painel-pedido',
    ]) {
      expect(elemento.querySelector(seletor), seletor).not.toBeNull();
    }
  });

  it('o link "Pular para o conteúdo" leva o foco ao conteúdo principal', async () => {
    const fixture = TestBed.createComponent(App);
    const elemento = fixture.nativeElement as HTMLElement;
    document.body.appendChild(elemento);
    await fixture.whenStable();

    elemento.querySelector<HTMLAnchorElement>('.pular-para-conteudo')!.click();

    expect(document.activeElement?.id).toBe('conteudo');
    elemento.remove();
  });
});
