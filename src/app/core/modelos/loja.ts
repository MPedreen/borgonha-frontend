/** Dados da loja retornados por `GET /api/loja`. */
export interface Loja {
  nome: string;
  endereco: Endereco;
  coordenadas: Coordenadas;
  /** Telefone no formato internacional E.164 (ex.: +5521974509789). */
  telefone: string;
  /** Perfil do Instagram, sem o "@". */
  instagram: string | null;
  avisoTopo: string | null;
  horarios: Horario[];
  canaisPedido: CanalPedido[];
}

export interface Endereco {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string | null;
}

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export type DiaDaSemana =
  'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface Horario {
  dias: DiaDaSemana[];
  /** HH:mm */
  abertura: string;
  /** HH:mm */
  fechamento: string;
}

export type TipoCanalPedido = 'whatsapp' | 'ifood' | 'loja-fisica';

export interface CanalPedido {
  tipo: TipoCanalPedido;
  titulo: string;
  descricao: string;
  url: string;
  /** Texto que já vem escrito na conversa do WhatsApp. */
  mensagemPadrao: string | null;
  selo: string | null;
  destaque: boolean;
}
