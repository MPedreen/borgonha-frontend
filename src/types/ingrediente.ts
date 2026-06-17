export interface Ingrediente {
  id: string;
  nome: string;
  unidade: string;
  quantidade_atual: number;
  quantidade_minima: number;
  custo_unitario: number;
  criado_em: string;
  esta_em_alerta: boolean;
}

export interface CriarIngredienteRequest {
  nome: string;
  unidade: string;
  quantidade_atual: number;
  quantidade_minima: number;
  custo_unitario: number;
}

export interface AtualizarIngredienteRequest {
  nome: string;
  unidade: string;
  quantidade_minima: number;
  custo_unitario: number;
}

export interface RegistrarEntradaRequest {
  quantidade: number;
  observacao?: string;
}
