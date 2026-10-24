import { Produto } from '../modelos/catalogo';

/** Nome do item na mensagem do pedido (os cookies ganham o prefixo "Cookie"). */
export function nomeNoPedido(produto: Pick<Produto, 'nome' | 'categoria'>): string {
  return produto.categoria === 'cookies' ? `Cookie ${produto.nome}` : produto.nome;
}

/**
 * Monta o link do WhatsApp com a mensagem pronta. Ex.:
 * "Olá!\nDesejo fazer meu pedido!\nQuero: Cookie Nutella" → https://wa.me/55...?text=Ol%C3%A1!%0A...
 */
export function linkDoWhatsApp(
  url: string,
  mensagemPadrao: string | null,
  produto: Pick<Produto, 'nome' | 'categoria'> | null,
): string {
  const linhas = [mensagemPadrao, produto ? `Quero: ${nomeNoPedido(produto)}` : null].filter(
    (linha): linha is string => Boolean(linha),
  );
  return linhas.length > 0 ? `${url}?text=${encodeURIComponent(linhas.join('\n'))}` : url;
}
