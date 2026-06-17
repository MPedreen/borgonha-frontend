export interface ItemVenda {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface Venda {
  id: string;
  criado_por: string;
  total: number;
  valor_pago: number;
  troco: number;
  data_hora: string;
  itens: ItemVenda[];
}

export interface ItemVendaRequest {
  produto_id: string;
  quantidade: number;
}

export interface RegistrarVendaRequest {
  itens: ItemVendaRequest[];
  valor_pago: number;
}
