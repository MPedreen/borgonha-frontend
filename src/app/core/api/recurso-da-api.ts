import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  afterNextRender,
  inject,
  makeStateKey,
  PLATFORM_ID,
  signal,
  Signal,
  TransferState,
} from '@angular/core';
import { API_URL } from './api-url';

export interface RecursoDaApi<T> {
  /** Último conteúdo recebido com sucesso. */
  readonly dados: Signal<T | undefined>;
  readonly carregando: Signal<boolean>;
  /** A última tentativa falhou (os dados anteriores, se houver, continuam valendo). */
  readonly falhou: Signal<boolean>;
  recarregar(): void;
}

/**
 * Lê um endereço da API pensando na pré-renderização:
 * - no build, busca os dados e os embute na página (TransferState), então o HTML já sai completo;
 * - no navegador, começa com esses dados e, depois que a página carrega, busca a versão mais recente.
 *   Se a API falhar, o conteúdo anterior continua na tela.
 *
 * Precisa ser chamado em um contexto de injeção (ex.: inicialização de um campo de serviço).
 */
export function recursoDaApi<T>(caminho: string): RecursoDaApi<T> {
  const http = inject(HttpClient);
  const apiUrl = inject(API_URL);
  const estadoTransferido = inject(TransferState);
  const noServidor = isPlatformServer(inject(PLATFORM_ID));
  const chave = makeStateKey<T>(`api:${caminho}`);

  const dados = signal<T | undefined>(estadoTransferido.get(chave, undefined));
  const carregando = signal(false);
  const falhou = signal(false);

  const recarregar = () => {
    carregando.set(true);
    http.get<T>(`${apiUrl}/${caminho}`).subscribe({
      next: (valor) => {
        dados.set(valor);
        falhou.set(false);
        carregando.set(false);
        if (noServidor) {
          estadoTransferido.set(chave, valor);
        }
      },
      error: () => {
        falhou.set(true);
        carregando.set(false);
      },
    });
  };

  if (noServidor) {
    recarregar();
  } else {
    afterNextRender(recarregar);
  }

  return {
    dados: dados.asReadonly(),
    carregando: carregando.asReadonly(),
    falhou: falhou.asReadonly(),
    recarregar,
  };
}
