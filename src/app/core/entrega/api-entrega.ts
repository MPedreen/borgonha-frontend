import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { API_URL } from '../api/api-url';

export interface EnderecoSugerido {
  /** Rua e número. */
  titulo: string;
  /** Bairro, cidade e estado. */
  detalhe: string;
  latitude: number;
  longitude: number;
}

/**
 * - `sem-minimo`: dentro do raio, sem pedido mínimo;
 * - `com-minimo`: mais longe que o raio, com pedido mínimo;
 * - `incerta`: perto demais do limite para o mapa decidir;
 * - `fora-da-regiao`: longe demais para a consulta automática.
 */
export type SituacaoDaEntrega = 'sem-minimo' | 'com-minimo' | 'incerta' | 'fora-da-regiao';

export interface ResultadoDaEntrega {
  situacao: SituacaoDaEntrega;
  /** Distância pelo trajeto de entrega; nula quando a linha reta já bastou para decidir. */
  distanciaEmMetros: number | null;
  distanciaEmLinhaRetaEmMetros: number;
}

/**
 * Por que a consulta de endereço falhou:
 * - `muitas-consultas`: a pessoa fez consultas demais em pouco tempo;
 * - `indisponivel`: o serviço de mapas está fora do ar, sem chave ou sem limite do dia.
 */
export type FalhaDaConsulta = 'muitas-consultas' | 'indisponivel';

export function falhaDaConsulta(erro: unknown): FalhaDaConsulta {
  return erro instanceof HttpErrorResponse && erro.status === 429
    ? 'muitas-consultas'
    : 'indisponivel';
}

/**
 * Consulta de entrega na API: sugestões de endereço e conferência do pedido mínimo. Cada chamada pode
 * gastar o limite diário do serviço de mapas, então as respostas ficam guardadas enquanto a página
 * estiver aberta.
 */
@Service()
export class EntregaApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private readonly enderecos = new Map<string, EnderecoSugerido[]>();
  private readonly resultados = new Map<string, ResultadoDaEntrega>();

  buscarEnderecos(texto: string): Observable<EnderecoSugerido[]> {
    const chave = texto.trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
    const guardado = this.enderecos.get(chave);
    if (guardado) {
      return of(guardado);
    }

    return this.http
      .get<EnderecoSugerido[]>(`${this.apiUrl}/entrega/enderecos`, {
        params: new HttpParams().set('texto', texto.trim()),
      })
      .pipe(tap((sugestoes) => this.enderecos.set(chave, sugestoes)));
  }

  conferir(latitude: number, longitude: number): Observable<ResultadoDaEntrega> {
    const chave = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const guardado = this.resultados.get(chave);
    if (guardado) {
      return of(guardado);
    }

    return this.http
      .get<ResultadoDaEntrega>(`${this.apiUrl}/entrega/conferir`, {
        params: new HttpParams().set('latitude', latitude).set('longitude', longitude),
      })
      .pipe(tap((resultado) => this.resultados.set(chave, resultado)));
  }
}
