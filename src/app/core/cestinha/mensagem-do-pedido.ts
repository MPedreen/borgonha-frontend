import { formatarPreco } from '../formatacao/formatacao';
import { FormaDePagamento, rotuloDoPagamento } from './pagamento';

export interface LinhaDoPedido {
  /** Ex.: "Cookie Nutella" ou "Bolo de pote – Nutella & Ninho". */
  nome: string;
  quantidade: number;
  subtotalEmCentavos: number;
}

export interface DadosDoPedido {
  /** Mensagem padrão do WhatsApp da loja (ex.: "Olá!\nDesejo fazer meu pedido!"). */
  saudacao: string | null;
  linhas: readonly LinhaDoPedido[];
  totalEmCentavos: number;
  pagamento: FormaDePagamento;
}

/** 3000 → "R$ 30,00", com espaço comum (o espaço especial do formato brasileiro pode sair estranho no WhatsApp). */
export function emReais(centavos: number): string {
  return formatarPreco(centavos / 100).replace(/\s/g, ' ');
}

/**
 * Mensagem que o cliente manda para o WhatsApp da loja. Ex.:
 *
 *     Olá!
 *     Desejo fazer meu pedido!
 *
 *     2x Cookie Nutella (R$ 30,00)
 *     1x Brookie (R$ 15,00)
 *
 *     Valor total: R$ 45,00
 *     Forma de pagamento: Pix
 */
export function mensagemDoPedido(pedido: DadosDoPedido): string {
  return [
    ...(pedido.saudacao ? [pedido.saudacao, ''] : []),
    ...pedido.linhas.map(
      (linha) => `${linha.quantidade}x ${linha.nome} (${emReais(linha.subtotalEmCentavos)})`,
    ),
    '',
    `Valor total: ${emReais(pedido.totalEmCentavos)}`,
    `Forma de pagamento: ${rotuloDoPagamento(pedido.pagamento)}`,
  ].join('\n');
}
