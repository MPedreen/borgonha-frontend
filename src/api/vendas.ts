import { client } from './client';
import type { RegistrarVendaRequest, Venda } from '../types/venda';

export const vendasApi = {
  registrar: (dados: RegistrarVendaRequest) => client.post<Venda>('/vendas', dados).then((r) => r.data),

  obterPorId: (id: string) => client.get<Venda>(`/vendas/${id}`).then((r) => r.data),
};
