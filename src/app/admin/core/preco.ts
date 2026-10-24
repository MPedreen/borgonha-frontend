/** Até R$ 9.999,99, com vírgula ou ponto nos centavos (como a API aceita). */
const FORMATO_DO_PRECO = /^(\d{1,4})(?:[.,](\d{1,2}))?$/;

/**
 * Lê o preço digitado no painel: "15", "12,50", "12.5" ou "R$ 12,50".
 * @returns o valor em reais; `null` se o campo ficou vazio (sem preço); `undefined` se o texto
 * não for um preço válido.
 */
export function lerPreco(texto: string): number | null | undefined {
  const limpo = texto.trim().replace(/^R\$\s*/i, '');
  if (limpo === '') {
    return null;
  }

  const partes = FORMATO_DO_PRECO.exec(limpo);
  if (!partes) {
    return undefined;
  }

  const valor = Number(`${partes[1]}.${partes[2] ?? '0'}`);
  return valor > 0 ? valor : undefined;
}

/** Preço para editar no campo: 12.5 → "12,50"; sem preço → "". */
export function escreverPreco(preco: number | null): string {
  return preco === null ? '' : preco.toFixed(2).replace('.', ',');
}
