import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vendasApi } from '../../api/vendas';
import { Spinner } from '../../components/Spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatarDataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function ReciboPage() {
  const { id } = useParams<{ id: string }>();

  const { data: venda, isLoading, isError } = useQuery({
    queryKey: ['venda', id],
    queryFn: () => vendasApi.obterPorId(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-6 flex justify-center pt-16">
        <Spinner />
      </div>
    );
  }

  if (isError || !venda) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-6">
        <p className="text-destructive mb-4">Não foi possível carregar o recibo.</p>
        <Button variant="secondary" asChild>
          <Link to="/pdv">Voltar ao PDV</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[520px] mx-auto px-6 py-6">
      <Card>
        <CardContent className="pt-6">
          {/* Banner de sucesso */}
          <div className="bg-success/10 text-success rounded-lg px-4 py-4 mb-6 font-bold text-base text-center">
            ✓ Venda registrada com sucesso!
          </div>

          {/* Metadados */}
          <div className="text-left mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Data / Hora</span>
              <span className="text-sm">{formatarDataHora(venda.data_hora)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Operador</span>
              <span className="text-sm">{venda.criado_por}</span>
            </div>
          </div>

          {/* Tabela de itens */}
          <div className="mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venda.itens.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.nome_produto}</TableCell>
                    <TableCell className="text-center">{item.quantidade}</TableCell>
                    <TableCell className="text-right">{moeda(item.preco_unitario)}</TableCell>
                    <TableCell className="text-right">{moeda(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totais */}
          <div className="border-t-2 border-border pt-3 flex flex-col gap-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{moeda(venda.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Valor pago</span>
              <span>{moeda(venda.valor_pago)}</span>
            </div>
            <div className="flex justify-between font-bold text-success">
              <span>Troco</span>
              <span>{moeda(venda.troco)}</span>
            </div>
          </div>

          {/* Botão nova venda */}
          <div className="mt-6 flex justify-center">
            <Button asChild size="lg" className="px-10">
              <Link to="/pdv">Nova Venda</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
