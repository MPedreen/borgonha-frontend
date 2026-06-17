import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { produtosApi } from '../../api/produtos';
import { vendasApi } from '../../api/vendas';
import { Spinner } from '../../components/Spinner';
import { extrairMensagemErro } from '../../lib/erros';
import type { Produto } from '../../types/produto';

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
      <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: 'var(--space-4)' }}>PDV — Caixa</h1>

      <input
        className="input"
        placeholder="Buscar produto pelo nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ marginBottom: 'var(--space-4)', maxWidth: 360, display: 'block' }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* Grade de produtos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          {produtosFiltrados.map((produto) => {
            const disponivel = produto.disponivel !== false;
            const noCarrinho = carrinho.some((i) => i.produto_id === produto.id);
            return (
              <button
                key={produto.id}
                className="card"
                onClick={() => adicionarAoCarrinho(produto)}
                disabled={!disponivel}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  cursor: disponivel ? 'pointer' : 'not-allowed',
                  opacity: disponivel ? 1 : 0.45,
                  outline: noCarrinho ? '2px solid var(--color-primary)' : 'none',
                  transition: 'opacity 0.15s, outline 0.1s',
                }}
              >
                <div
                  style={{
                    fontWeight: 'var(--font-weight-bold)',
                    marginBottom: 'var(--space-1)',
                    lineHeight: 1.3,
                  }}
                >
                  {produto.nome}
                </div>
                <div
                  style={{
                    color: 'var(--color-primary)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                  }}
                >
                  {moeda(produto.preco_venda)}
                </div>
                {!disponivel && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: 4 }}>
                    Sem estoque
                  </div>
                )}
              </button>
            );
          })}
          {produtosFiltrados.length === 0 && (
            <p
              style={{
                gridColumn: '1 / -1',
                color: 'var(--color-neutral-500)',
                paddingTop: 'var(--space-4)',
              }}
            >
              Nenhum produto encontrado.
            </p>
          )}
        </div>

        {/* Carrinho */}
        <div className="card" style={{ position: 'sticky', top: 'var(--space-4)' }}>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>Carrinho</h2>

          {carrinho.length === 0 ? (
            <p
              style={{
                color: 'var(--color-neutral-500)',
                textAlign: 'center',
                padding: 'var(--space-8) 0',
              }}
            >
              Selecione produtos ao lado
            </p>
          ) : (
            <>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                {carrinho.map((item) => (
                  <div
                    key={item.produto_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      paddingBottom: 'var(--space-3)',
                      marginBottom: 'var(--space-3)',
                      borderBottom: '1px solid var(--color-neutral-200)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.nome}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-neutral-500)' }}>
                        {moeda(item.preco_venda)} × {item.quantidade}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '2px 9px' }}
                        onClick={() => alterarQuantidade(item.produto_id, -1)}
                      >
                        −
                      </button>
                      <span
                        style={{ minWidth: 24, textAlign: 'center', fontWeight: 600, fontSize: '0.95rem' }}
                      >
                        {item.quantidade}
                      </span>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '2px 9px' }}
                        onClick={() => alterarQuantidade(item.produto_id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ minWidth: 68, textAlign: 'right', fontWeight: 600 }}>
                      {moeda(item.preco_venda * item.quantidade)}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: '1.05rem',
                  marginBottom: 'var(--space-4)',
                  paddingTop: 'var(--space-2)',
                  borderTop: '2px solid var(--color-neutral-200)',
                }}
              >
                <span>Total</span>
                <span>{moeda(subtotal)}</span>
              </div>

              <div className="field">
                <label className="label" htmlFor="valorPago">
                  Valor pago (R$)
                </label>
                <input
                  id="valorPago"
                  className="input"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                />
              </div>

              {valorPagoNum > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'var(--font-weight-bold)',
                    marginBottom: 'var(--space-4)',
                    color: troco >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                >
                  <span>Troco</span>
                  <span>{troco >= 0 ? moeda(troco) : 'Valor insuficiente'}</span>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <button
              className="btn btn-primary"
              onClick={confirmarVenda}
              disabled={!podeConfirmar}
              style={{ width: '100%', padding: 'var(--space-3)' }}
            >
              {isPending ? 'Confirmando...' : 'Confirmar Venda'}
            </button>
            {carrinho.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={limparCarrinho}
                style={{ width: '100%' }}
              >
                Limpar Carrinho
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
