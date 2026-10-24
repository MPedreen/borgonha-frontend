import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../core/api/api-url';
import { OPCOES_DO_ADMIN } from './requisicoes-admin';

/**
 * Entrar e sair da área do administrador. A sessão fica num cookie HttpOnly que o JavaScript
 * não lê: para saber se ela está aberta, é preciso perguntar à API.
 */
@Service()
export class SessaoAdmin {
  private readonly http = inject(HttpClient);
  private readonly endereco = `${inject(API_URL)}/admin/sessao`;

  async estaAberta(): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get(this.endereco, OPCOES_DO_ADMIN));
      return true;
    } catch {
      return false;
    }
  }

  /** Lança `HttpErrorResponse` se o usuário ou a senha estiverem errados (401) ou houver tentativas demais (429). */
  async entrar(usuario: string, senha: string): Promise<void> {
    await firstValueFrom(this.http.post(this.endereco, { usuario, senha }, OPCOES_DO_ADMIN));
  }

  async sair(): Promise<void> {
    await firstValueFrom(this.http.delete(this.endereco, OPCOES_DO_ADMIN));
  }
}
