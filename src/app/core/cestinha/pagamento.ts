export type FormaDePagamento = 'pix' | 'credito' | 'debito';

export const FORMAS_DE_PAGAMENTO: readonly { valor: FormaDePagamento; rotulo: string }[] = [
  { valor: 'pix', rotulo: 'Pix' },
  { valor: 'credito', rotulo: 'Crédito' },
  { valor: 'debito', rotulo: 'Débito' },
];

export function rotuloDoPagamento(forma: FormaDePagamento): string {
  return FORMAS_DE_PAGAMENTO.find((opcao) => opcao.valor === forma)?.rotulo ?? forma;
}

export function ehFormaDePagamento(valor: unknown): valor is FormaDePagamento {
  return FORMAS_DE_PAGAMENTO.some((opcao) => opcao.valor === valor);
}
