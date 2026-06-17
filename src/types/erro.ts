export type TipoErro =
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'unauthorized'
  | 'unprocessable_entity'
  | 'unexpected';

export interface ApiError {
  codigo: string;
  descricao: string;
  tipo: TipoErro;
}
