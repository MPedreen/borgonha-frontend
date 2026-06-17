export interface ItemReceita {
  ingrediente_id: string;
  quantidade: number;
}

export interface Produto {
  id: string;
  nome: string;
  preco_venda: number;
  custo_calculado?: number;
  disponivel?: boolean;
  ativo: boolean;
  criado_em: string;
  receita: ItemReceita[];
}

export interface CriarProdutoRequest {
  nome: string;
  preco_venda: number;
  receita: ItemReceita[];
}

export interface AtualizarProdutoRequest {
  nome: string;
  preco_venda: number;
  receita: ItemReceita[];
  ativo?: boolean;
}
