import { Service, signal } from '@angular/core';

/**
 * O que a última consulta de entrega desta visita disse sobre o pedido mínimo do cliente.
 * A cestinha usa para avisar quanto falta para o mínimo (ou que não há mínimo).
 */
@Service()
export class EntregaDoCliente {
  private readonly situacaoAgora = signal<'sem-minimo' | 'com-minimo' | null>(null);

  readonly situacao = this.situacaoAgora.asReadonly();

  registrar(situacao: 'sem-minimo' | 'com-minimo'): void {
    this.situacaoAgora.set(situacao);
  }
}
