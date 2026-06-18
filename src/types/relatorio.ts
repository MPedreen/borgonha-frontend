export interface RelatorioDiario {
  total_vendas: number;
  receita_bruta: number;
  custo_total: number;
  lucro: number;
}

export interface RankingProduto {
  nome: string;
  unidades_vendidas: number;
  receita: number;
}

export interface RelatorioMensal {
  total_vendas: number;
  receita_bruta: number;
  custo_total: number;
  lucro: number;
  ranking: RankingProduto[];
}
