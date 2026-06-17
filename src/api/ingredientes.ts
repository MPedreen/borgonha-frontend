import { client } from './client';
import type {
  AtualizarIngredienteRequest,
  CriarIngredienteRequest,
  Ingrediente,
  RegistrarEntradaRequest,
} from '../types/ingrediente';

export const ingredientesApi = {
  listar: () => client.get<Ingrediente[]>('/ingredientes').then((r) => r.data),

  listarAlertas: () => client.get<Ingrediente[]>('/ingredientes/alertas').then((r) => r.data),

  criar: (dados: CriarIngredienteRequest) => client.post<Ingrediente>('/ingredientes', dados).then((r) => r.data),

  atualizar: (id: string, dados: AtualizarIngredienteRequest) =>
    client.put<Ingrediente>(`/ingredientes/${id}`, dados).then((r) => r.data),

  registrarEntrada: (id: string, dados: RegistrarEntradaRequest) =>
    client.patch<Ingrediente>(`/ingredientes/${id}/entrada`, dados).then((r) => r.data),
};
