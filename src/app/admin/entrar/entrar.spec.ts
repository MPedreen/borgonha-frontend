import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { API_URL } from '../../core/api/api-url';
import { Entrar } from './entrar';

describe('Entrar', () => {
  let fixture: ComponentFixture<Entrar>;
  let elemento: HTMLElement;
  let http: HttpTestingController;

  const campo = (id: string) => elemento.querySelector<HTMLInputElement>(`#${id}`)!;
  const enviar = () => elemento.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
  const aguardarTarefas = () => new Promise((resolver) => setTimeout(resolver));

  function digitar(id: string, valor: string): void {
    campo(id).value = valor;
    campo(id).dispatchEvent(new Event('input'));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    fixture = TestBed.createComponent(Entrar);
    elemento = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('pede usuário e senha antes de tentar entrar', async () => {
    enviar();
    await fixture.whenStable();

    expect(elemento.textContent).toContain('Informe o usuário.');
    expect(elemento.textContent).toContain('Informe a senha.');
    expect(campo('usuario').getAttribute('aria-invalid')).toBe('true');
    http.expectNone('/api/admin/sessao');
  });

  it('mostra o motivo da recusa e limpa a senha', async () => {
    digitar('usuario', 'borgonha');
    digitar('senha', 'errada');

    enviar();
    await aguardarTarefas();
    http
      .expectOne('/api/admin/sessao')
      .flush(
        { title: 'Usuário ou senha incorretos.' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await aguardarTarefas();
    await fixture.whenStable();

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'Usuário ou senha incorretos.',
    );
    expect(campo('senha').value).toBe('');
  });

  it('entra no painel quando a API aceita', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    digitar('usuario', 'borgonha');
    digitar('senha', 'certa');

    enviar();
    await aguardarTarefas();
    const requisicao = http.expectOne('/api/admin/sessao');
    expect(requisicao.request.body).toEqual({ usuario: 'borgonha', senha: 'certa' });
    requisicao.flush(null, { status: 204, statusText: 'No Content' });
    await aguardarTarefas();
    await fixture.whenStable();

    expect(navegar).toHaveBeenCalledWith('/admin');
  });

  it('o botão de olho mostra e esconde a senha', async () => {
    const olho = elemento.querySelector<HTMLButtonElement>('.senha__mostrar')!;

    olho.click();
    await fixture.whenStable();
    expect(campo('senha').type).toBe('text');
    expect(olho.getAttribute('aria-pressed')).toBe('true');

    olho.click();
    await fixture.whenStable();
    expect(campo('senha').type).toBe('password');
  });
});
