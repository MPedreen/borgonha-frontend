import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ingredientesApi } from '../../api/ingredientes';
import { Badge } from '../../components/Badge';
import { Spinner } from '../../components/Spinner';
import { extrairMensagemErro } from '../../lib/erros';
import type { Ingrediente } from '../../types/ingrediente';

interface FormNovoIngrediente {
  nome: string;
  unidade: string;
  quantidade_atual: string;
  quantidade_minima: string;
  custo_unitario: string;
}

const formVazio: FormNovoIngrediente = {
  nome: '',
  unidade: '',
  quantidade_atual: '',
  quantidade_minima: '',
  custo_unitario: '',
};

export function EstoquePage() {
  const qc = useQueryClient();
  const [ingredienteEntrada, setIngredienteEntrada] = useState<Ingrediente | null>(null);
  const [quantidadeEntrada, setQuantidadeEntrada] = useState('');
  const [observacaoEntrada, setObservacaoEntrada] = useState('');
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [formNovo, setFormNovo] = useState<FormNovoIngrediente>(formVazio);

  const { data: ingredientes, isLoading } = useQuery({
    queryKey: ['ingredientes'],
    queryFn: ingredientesApi.listar,
  });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['ingredientes'] });
    qc.invalidateQueries({ queryKey: ['ingredientes-alertas'] });
  };

  const { mutate: registrarEntrada, isPending: registrando } = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Parameters<typeof ingredientesApi.registrarEntrada>[1] }) =>
      ingredientesApi.registrarEntrada(id, dados),
    onSuccess: () => {
      toast.success('Entrada registrada!');
      fecharModalEntrada();
      invalidar();
    },
    onError: (erro) => toast.error(extrairMensagemErro(erro)),
  });

  const { mutate: criarIngrediente, isPending: criando } = useMutation({
    mutationFn: ingredientesApi.criar,
    onSuccess: () => {
      toast.success('Ingrediente criado!');
      setMostrarFormNovo(false);
      setFormNovo(formVazio);
      invalidar();
    },
    onError: (erro) => toast.error(extrairMensagemErro(erro)),
  });

  function abrirEntrada(ingrediente: Ingrediente) {
    setIngredienteEntrada(ingrediente);
    setQuantidadeEntrada('');
    setObservacaoEntrada('');
  }

  function fecharModalEntrada() {
    setIngredienteEntrada(null);
    setQuantidadeEntrada('');
    setObservacaoEntrada('');
  }

  function confirmarEntrada() {
    if (!ingredienteEntrada) return;
    const qtd = parseFloat(quantidadeEntrada.replace(',', '.'));
    if (!qtd || qtd <= 0) {
      toast.error('Informe uma quantidade válida.');
      return;
    }
    registrarEntrada({
      id: ingredienteEntrada.id,
      dados: { quantidade: qtd, observacao: observacaoEntrada || undefined },
    });
  }

  function submeterNovoIngrediente(e: React.FormEvent) {
    e.preventDefault();
    criarIngrediente({
      nome: formNovo.nome.trim(),
      unidade: formNovo.unidade.trim(),
      quantidade_atual: parseFloat(formNovo.quantidade_atual.replace(',', '.')),
      quantidade_minima: parseFloat(formNovo.quantidade_minima.replace(',', '.')),
      custo_unitario: parseFloat(formNovo.custo_unitario.replace(',', '.')),
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <h1>Estoque</h1>
        <button className="btn btn-primary" onClick={() => setMostrarFormNovo((p) => !p)}>
          {mostrarFormNovo ? 'Cancelar' : '+ Novo Ingrediente'}
        </button>
      </div>

      {mostrarFormNovo && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>Novo Ingrediente</h2>
          <form onSubmit={submeterNovoIngrediente}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              <div className="field">
                <label className="label" htmlFor="ing-nome">Nome</label>
                <input
                  id="ing-nome"
                  className="input"
                  required
                  value={formNovo.nome}
                  onChange={(e) => setFormNovo((p) => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="ing-unidade">Unidade</label>
                <input
                  id="ing-unidade"
                  className="input"
                  required
                  placeholder="ex: g, ml, un"
                  value={formNovo.unidade}
                  onChange={(e) => setFormNovo((p) => ({ ...p, unidade: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="ing-qtd-atual">Quantidade Atual</label>
                <input
                  id="ing-qtd-atual"
                  className="input"
                  required
                  type="text"
                  inputMode="decimal"
                  value={formNovo.quantidade_atual}
                  onChange={(e) => setFormNovo((p) => ({ ...p, quantidade_atual: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="ing-qtd-min">Quantidade Mínima</label>
                <input
                  id="ing-qtd-min"
                  className="input"
                  required
                  type="text"
                  inputMode="decimal"
                  value={formNovo.quantidade_minima}
                  onChange={(e) => setFormNovo((p) => ({ ...p, quantidade_minima: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="ing-custo">Custo Unitário (R$)</label>
                <input
                  id="ing-custo"
                  className="input"
                  required
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formNovo.custo_unitario}
                  onChange={(e) => setFormNovo((p) => ({ ...p, custo_unitario: e.target.value }))}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={criando}>
              {criando ? 'Salvando...' : 'Criar Ingrediente'}
            </button>
          </form>
        </div>
      )}

      <div className="card table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Unidade</th>
              <th style={{ textAlign: 'right' }}>Qtd Atual</th>
              <th style={{ textAlign: 'right' }}>Qtd Mínima</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(ingredientes ?? []).map((ing) => (
              <tr key={ing.id}>
                <td style={{ fontWeight: 600 }}>{ing.nome}</td>
                <td>{ing.unidade}</td>
                <td style={{ textAlign: 'right' }}>{ing.quantidade_atual.toLocaleString('pt-BR')}</td>
                <td style={{ textAlign: 'right' }}>{ing.quantidade_minima.toLocaleString('pt-BR')}</td>
                <td>
                  {ing.esta_em_alerta ? (
                    <Badge variante="danger">CRÍTICO</Badge>
                  ) : (
                    <Badge variante="success">OK</Badge>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-secondary"
                    onClick={() => abrirEntrada(ing)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Entrada
                  </button>
                </td>
              </tr>
            ))}
            {(ingredientes ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: 'center',
                    color: 'var(--color-neutral-500)',
                    padding: 'var(--space-8)',
                  }}
                >
                  Nenhum ingrediente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Entrada */}
      {ingredienteEntrada && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) fecharModalEntrada(); }}
        >
          <div
            className="card"
            style={{ width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
          >
            <h2 style={{ marginBottom: 'var(--space-1)' }}>Registrar Entrada</h2>
            <p style={{ color: 'var(--color-neutral-500)', marginBottom: 'var(--space-4)' }}>
              {ingredienteEntrada.nome} — atual: {ingredienteEntrada.quantidade_atual.toLocaleString('pt-BR')}{' '}
              {ingredienteEntrada.unidade}
            </p>

            <div className="field">
              <label className="label" htmlFor="entrada-qtd">
                Quantidade ({ingredienteEntrada.unidade})
              </label>
              <input
                id="entrada-qtd"
                className="input"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={quantidadeEntrada}
                onChange={(e) => setQuantidadeEntrada(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="entrada-obs">Observação (opcional)</label>
              <input
                id="entrada-obs"
                className="input"
                placeholder="ex: Compra fornecedor X"
                value={observacaoEntrada}
                onChange={(e) => setObservacaoEntrada(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                className="btn btn-primary"
                onClick={confirmarEntrada}
                disabled={registrando}
                style={{ flex: 1 }}
              >
                {registrando ? 'Registrando...' : 'Confirmar'}
              </button>
              <button className="btn btn-secondary" onClick={fecharModalEntrada}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
