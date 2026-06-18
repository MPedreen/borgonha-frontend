import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { produtosApi } from '../../api/produtos';
import { vendasApi } from '../../api/vendas';
import { Spinner } from '../../components/Spinner';
import { extrairMensagemErro } from '../../lib/erros';
import type { Produto } from '../../types/produto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ItemCarrinho {
  produto_id: string;
  nome: string;
  preco_venda: number;
  quantidade: number;
}

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function PdvPage() {
  const navigate = useNavigate();
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [busca, setBusca] = useState('');
  const [valorPago, setValorPago] = useState('');

  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: produtosApi.listarAtivos,
  });

  const { mutate: registrarVenda, isPending } = useMutation({
    mutationFn: vendasApi.registrar,
    onSuccess: (venda) => {
      limparCarrinho();
      navigate(`/vendas/${venda.id}`);
    },
    onError: (erro) => {
      toast.error(extrairMensagemErro(erro));
    },
  });

  const produtosFiltrados = (produtos ?? []).filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  const subtotal = carrinho.reduce((acc, i) => acc + i.preco_venda * i.quantidade, 0);
  const valorPagoNum = parseFloat(valorPago.replace(',', '.')) || 0;
  const troco = valorPagoNum - subtotal;
  const podeConfirmar = carrinho.length > 0 && valorPagoNum >= subtotal && !isPending;

  function adicionarAoCarrinho(produto: Produto) {
    if (produto.disponivel === false) return;
    setCarrinho((prev) => {
      const existente = prev.find((i) => i.produto_id === produto.id);
      if (existente) {
        return prev.map((i) =>
          i.produto_id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          produto_id: produto.id,
          nome: produto.nome,
          preco_venda: produto.preco_venda,
          quantidade: 1,
        },
      ];
    });
  }

  function alterarQuantidade(produtoId: string, delta: number) {
    setCarrinho((prev) =>
      prev
        .map((i) => (i.produto_id === produtoId ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0),
    );
  }

  function limparCarrinho() {
    setCarrinho([]);
    setValorPago('');
  }

  function confirmarVenda() {
    if (!podeConfirmar) return;
    registrarVenda({
      itens: carrinho.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade })),
      valor_pago: valorPagoNum,
    });
  }

  if (isLoading) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-6 flex justify-center pt-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold mb-4">PDV — Caixa</h1>

      <Input
        placeholder="Buscar produto pelo nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Grade de produtos */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {produtosFiltrados.map((produto) => {
            const disponivel = produto.disponivel !== false;
            const noCarrinho = carrinho.some((i) => i.produto_id === produto.id);
            return (
              <button
                key={produto.id}
                onClick={() => adicionarAoCarrinho(produto)}
                disabled={!disponivel}
                className={cn(
                  'rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-all',
                  disponivel
                    ? 'cursor-pointer hover:shadow-md hover:border-primary/50'
                    : 'cursor-not-allowed opacity-45',
                  noCarrinho && 'ring-2 ring-primary',
                )}
              >
                <div className="font-semibold mb-1 leading-snug text-sm">
                  {produto.nome}
                </div>
                <div className="text-primary font-bold text-base">
                  {moeda(produto.preco_venda)}
                </div>
                {!disponivel && (
                  <div className="text-xs text-destructive mt-1">Sem estoque</div>
                )}
              </button>
            );
          })}
          {produtosFiltrados.length === 0 && (
            <p className="col-span-full text-muted-foreground pt-4">
              Nenhum produto encontrado.
            </p>
          )}
        </div>

        {/* Carrinho */}
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle>Carrinho</CardTitle>
          </CardHeader>
          <CardContent>
            {carrinho.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Selecione produtos ao lado
              </p>
            ) : (
              <>
                <div className="mb-3 space-y-3">
                  {carrinho.map((item) => (
                    <div
                      key={item.produto_id}
                      className="flex items-center gap-2 pb-3 border-b border-border last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-sm">{item.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {moeda(item.preco_venda)} × {item.quantidade}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2 text-base"
                          onClick={() => alterarQuantidade(item.produto_id, -1)}
                        >
                          −
                        </Button>
                        <span className="min-w-[24px] text-center font-semibold text-sm">
                          {item.quantidade}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2 text-base"
                          onClick={() => alterarQuantidade(item.produto_id, 1)}
                        >
                          +
                        </Button>
                      </div>
                      <div className="min-w-[68px] text-right font-semibold text-sm">
                        {moeda(item.preco_venda * item.quantidade)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-bold text-base mb-4 pt-2 border-t-2 border-border">
                  <span>Total</span>
                  <span>{moeda(subtotal)}</span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <Label htmlFor="valorPago">Valor pago (R$)</Label>
                  <Input
                    id="valorPago"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                  />
                </div>

                {valorPagoNum > 0 && (
                  <div
                    className={cn(
                      'flex justify-between font-bold mb-4',
                      troco >= 0 ? 'text-success' : 'text-destructive',
                    )}
                  >
                    <span>Troco</span>
                    <span>{troco >= 0 ? moeda(troco) : 'Valor insuficiente'}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={confirmarVenda}
                disabled={!podeConfirmar}
                className="w-full"
                size="lg"
              >
                {isPending ? 'Confirmando...' : 'Confirmar Venda'}
              </Button>
              {carrinho.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={limparCarrinho}
                  className="w-full"
                >
                  Limpar Carrinho
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
