import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { relatoriosApi } from '../../api/relatorios';
import { KpiCard } from '../../components/KpiCard';
import { Spinner } from '../../components/Spinner';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const hoje = () => new Date().toISOString().split('T')[0];

const mesAtual = new Date().getMonth() + 1;
const anoAtual = new Date().getFullYear();

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const ANOS = Array.from({ length: 5 }, (_, i) => anoAtual - i);

export function RelatoriosPage() {
  const [aba, setAba] = useState<'diario' | 'mensal'>('diario');
  const [dataDiario, setDataDiario] = useState(hoje());
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);

  const { data: diario, isLoading: carregandoDiario, isError: erroDiario } = useQuery({
    queryKey: ['relatorio-diario', dataDiario],
    queryFn: () => relatoriosApi.diario(dataDiario),
    enabled: aba === 'diario' && !!dataDiario,
  });

  const { data: mensal, isLoading: carregandoMensal, isError: erroMensal } = useQuery({
    queryKey: ['relatorio-mensal', anoSelecionado, mesSelecionado],
    queryFn: () => relatoriosApi.mensal(anoSelecionado, mesSelecionado),
    enabled: aba === 'mensal',
  });

  return (
    <div className="page">
      <h1 style={{ marginBottom: 'var(--space-6)' }}>Relatórios</h1>

      {/* Abas */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 'var(--space-6)',
          borderBottom: '2px solid var(--color-neutral-200)',
        }}
      >
        {(['diario', 'mensal'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              fontWeight: aba === a ? 'var(--font-weight-bold)' : undefined,
              color: aba === a ? 'var(--color-primary)' : 'var(--color-neutral-500)',
              borderBottom: aba === a ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
              background: 'none',
              cursor: 'pointer',
            }}
          >
            {a === 'diario' ? 'Diário' : 'Mensal'}
          </button>
        ))}
      </div>

      {/* Aba Diário */}
      {aba === 'diario' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="data-diario" style={{ marginBottom: 'var(--space-1)' }}>
                Data
              </label>
              <input
                id="data-diario"
                className="input"
                type="date"
                value={dataDiario}
                onChange={(e) => setDataDiario(e.target.value)}
                style={{ width: 'auto' }}
              />
            </div>
          </div>

          {carregandoDiario && <Spinner />}

          {erroDiario && (
            <p style={{ color: 'var(--color-danger)' }}>
              Não foi possível carregar o relatório.
            </p>
          )}

          {diario && !carregandoDiario && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
              <KpiCard titulo="Total de Vendas" valor={String(diario.total_vendas)} />
              <KpiCard titulo="Receita Bruta" valor={moeda(diario.receita_bruta)} />
              <KpiCard titulo="Custo Total" valor={moeda(diario.custo_total)} />
              <KpiCard titulo="Lucro" valor={moeda(diario.lucro)} destaque />
            </div>
          )}

          {!diario && !carregandoDiario && !erroDiario && (
            <p style={{ color: 'var(--color-neutral-500)' }}>Nenhum dado para esta data.</p>
          )}
        </>
      )}

      {/* Aba Mensal */}
      {aba === 'mensal' && (
        <>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="sel-mes">Mês</label>
              <select
                id="sel-mes"
                className="select"
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(Number(e.target.value))}
                style={{ width: 'auto' }}
              >
                {MESES.map((nome, i) => (
                  <option key={i + 1} value={i + 1}>{nome}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="sel-ano">Ano</label>
              <select
                id="sel-ano"
                className="select"
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                style={{ width: 'auto' }}
              >
                {ANOS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {carregandoMensal && <Spinner />}

          {erroMensal && (
            <p style={{ color: 'var(--color-danger)' }}>
              Não foi possível carregar o relatório.
            </p>
          )}

          {mensal && !carregandoMensal && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-8)',
                }}
              >
                <KpiCard titulo="Total de Vendas" valor={String(mensal.total_vendas)} />
                <KpiCard titulo="Receita Bruta" valor={moeda(mensal.receita_bruta)} />
                <KpiCard titulo="Custo Total" valor={moeda(mensal.custo_total)} />
                <KpiCard titulo="Lucro" valor={moeda(mensal.lucro)} destaque />
              </div>

              {mensal.ranking.length > 0 && (
                <div className="card">
                  <h2 style={{ marginBottom: 'var(--space-4)' }}>Ranking de Produtos</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Produto</th>
                        <th style={{ textAlign: 'right' }}>Unidades Vendidas</th>
                        <th style={{ textAlign: 'right' }}>Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mensal.ranking.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ color: 'var(--color-neutral-500)', width: 40 }}>{idx + 1}°</td>
                          <td style={{ fontWeight: idx === 0 ? 'var(--font-weight-bold)' : undefined }}>
                            {item.nome}
                          </td>
                          <td style={{ textAlign: 'right' }}>{item.unidades_vendidas}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{moeda(item.receita)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
