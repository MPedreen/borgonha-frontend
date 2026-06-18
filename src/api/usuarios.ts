import { client } from './client';

export interface CriarUsuarioPayload {
  nome: string;
  sobrenome: string;
  email: string;
  username: string;
  senha: string;
  role: 'admin' | 'atendente';
}

export interface UsuarioResponse {
  id: string;
  username: string;
  email: string;
  role: string;
}

export const usuariosApi = {
  criar: (payload: CriarUsuarioPayload) =>
    client.post<UsuarioResponse>('/usuarios', payload).then((r) => r.data),
};
