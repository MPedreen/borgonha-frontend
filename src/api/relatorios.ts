import { client } from './client';
import type { RelatorioDiario, RelatorioMensal } from '../types/relatorio';

export const relatoriosApi = {
  diario: (data: string) =>
    client.get<RelatorioDiario>('/relatorios/diario', { params: { data } }).then((r) => r.data),

  mensal: (ano: number, mes: number) =>
    client.get<RelatorioMensal>('/relatorios/mensal', { params: { ano, mes } }).then((r) => r.data),
};
