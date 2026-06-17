import { isAxiosError } from 'axios';
import type { ApiError } from '../types/erro';

export function extrairMensagemErro(erro: unknown): string {
  if (isAxiosError<ApiError>(erro) && erro.response?.data?.descricao) {
    return erro.response.data.descricao;
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}
