/** Cardápio retornado por `GET /api/catalogo`. */
export interface Catalogo {
  categorias: Categoria[];
}

export interface Categoria {
  slug: string;
  nome: string;
  produtos: Produto[];
}

export interface Produto {
  slug: string;
  nome: string;
  /** Slug da categoria: "cookies", "doces" ou "salgados". */
  categoria: string;
  /** Opcional: um produto novo pode estar no cardápio só com nome e preço. */
  descricao: string | null;
  /** Frase curta usada no menu de sabores. */
  frase: string | null;
  preco: number | null;
  peso: string | null;
  selo: string | null;
  variacoes: string[];
  imagens: ImagensProduto;
  disponivel: boolean;
}

export interface ImagensProduto {
  /** Produto inteiro (cookies vistos de cima). */
  inteiro: Imagem | null;
  /** Produto partido ao meio, mostrando o recheio. */
  partido: Imagem | null;
}

export interface Imagem {
  /** Caminho base, sem largura nem extensão (ex.: "cookies/nutella-partido"). */
  caminho: string;
  alt: string;
}
