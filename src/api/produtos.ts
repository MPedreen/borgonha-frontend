import { client } from './client';
import type { AtualizarProdutoRequest, CriarProdutoRequest, Produto } from '../types/produto';

export const produtosApi = {
  listarAtivos: () => client.get<Produto[]>('/produtos').then((r) => r.data),

  criar: (dados: CriarProdutoRequest) => client.post<Produto>('/produtos', dados).then((r) => r.data),

  atualizar: (id: string, dados: AtualizarProdutoRequest) =>
    client.put<Produto>(`/produtos/${id}`, dados).then((r) => r.data),
};
