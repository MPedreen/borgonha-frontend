import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

/**
 * Toda chamada da área do administrador leva o cookie da sessão e o cabeçalho que a API exige
 * (outros sites não conseguem enviá-lo, o que barra ataques de CSRF).
 */
export const OPCOES_DO_ADMIN = {
  withCredentials: true,
  headers: new HttpHeaders({ 'X-Borgonha-Admin': '1' }),
} as const;

/** Mensagem para mostrar na tela a partir de um erro da API. */
export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (!(erro instanceof HttpErrorResponse)) {
    return padrao;
  }

  if (erro.status === 0) {
    return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  }

  const titulo: unknown = erro.error?.title;
  return typeof titulo === 'string' && titulo.length > 0 ? titulo : padrao;
}
