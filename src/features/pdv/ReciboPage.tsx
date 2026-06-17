import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vendasApi } from '../../api/vendas';
import { Spinner } from '../../components/Spinner';

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
      <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
        <Spinner />
      </div>
    );
  }

  if (isError || !venda) {
    return (
      <div className="page">
        <p style={{ color: 'var(--color-danger)' }}>Não foi possível carregar o recibo.</p>
        <Link to="/pdv" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)', display: 'inline-flex' }}>
          Voltar ao PDV
        </Link>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div
          style={{
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            fontWeight: 'var(--font-weight-bold)',
            fontSize: 'var(--font-size-lg)',
          }}
        >
          ✓ Venda registrada com sucesso!
        </div>

        <div style={{ textAlign: 'left', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ color: 'var(--color-neutral-500)', fontSize: '0.85rem' }}>Data / Hora</span>
            <span>{formatarDataHora(venda.data_hora)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ color: 'var(--color-neutral-500)', fontSize: '0.85rem' }}>Operador</span>
            <span>{venda.criado_por}</span>
          </div>
        </div>

        <table style={{ marginBottom: 'var(--space-4)' }}>
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: 'center' }}>Qtd</th>
              <th style={{ textAlign: 'right' }}>Unit.</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {venda.itens.map((item, idx) => (
              <tr key={idx}>
                <td>—</td>
                <td style={{ textAlign: 'center' }}>{item.quantidade}</td>
                <td style={{ textAlign: 'right' }}>{moeda(item.preco_unitario)}</td>
                <td style={{ textAlign: 'right' }}>{moeda(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            borderTop: '2px solid var(--color-neutral-200)',
            paddingTop: 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--font-weight-bold)', fontSize: '1.1rem' }}>
            <span>Total</span>
            <span>{moeda(venda.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-neutral-500)' }}>
            <span>Valor pago</span>
            <span>{moeda(venda.valor_pago)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>
            <span>Troco</span>
            <span>{moeda(venda.troco)}</span>
          </div>
        </div>

        <Link
          to="/pdv"
          className="btn btn-primary"
          style={{ marginTop: 'var(--space-6)', display: 'inline-flex', padding: 'var(--space-3) var(--space-8)' }}
        >
          Nova Venda
        </Link>
      </div>
    </div>
  );
}
