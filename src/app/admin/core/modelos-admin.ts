import { ImagensProduto } from '../../core/modelos/catalogo';

/**
 * - `no-cardapio`: aparece no site e pode ser pedido;
 * - `esgotado`: aparece com o aviso "Esgotado hoje";
 * - `oculto`: saiu do cardápio da semana e não aparece no site.
 */
export type SituacaoProduto = 'no-cardapio' | 'esgotado' | 'oculto';

export type TipoDeFoto = 'inteiro' | 'partido';

/** Produto como a área do administrador vê (`GET /api/admin/cardapio`). */
export interface ProdutoAdmin {
  slug: string;
  nome: string;
  categoria: string;
  descricao: string;
  frase: string | null;
  peso: string | null;
  variacoes: string[];
  imagens: ImagensProduto;
  situacao: SituacaoProduto;
}

export interface CategoriaAdmin {
  slug: string;
  nome: string;
  produtos: ProdutoAdmin[];
}

export interface CardapioAdmin {
  categorias: CategoriaAdmin[];
}

/** Textos editáveis de um produto. */
export interface DadosDoProduto {
  nome: string;
  descricao: string;
  frase: string | null;
  peso: string | null;
  variacoes: string[];
}

export interface NovoProduto extends DadosDoProduto {
  categoria: string;
}

export interface OpcaoDeSituacao {
  valor: SituacaoProduto;
  rotulo: string;
  explicacao: string;
}

export const OPCOES_DE_SITUACAO: readonly OpcaoDeSituacao[] = [
  { valor: 'no-cardapio', rotulo: 'No cardápio', explicacao: 'Aparece no site e pode ser pedido.' },
  { valor: 'esgotado', rotulo: 'Esgotado', explicacao: 'Aparece com o aviso "Esgotado hoje".' },
  { valor: 'oculto', rotulo: 'Oculto', explicacao: 'Não aparece no site até você voltar.' },
];
