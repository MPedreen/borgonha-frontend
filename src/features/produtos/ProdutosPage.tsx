import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { produtosApi } from '../../api/produtos';
import { ingredientesApi } from '../../api/ingredientes';
import { Spinner } from '../../components/Spinner';
import { extrairMensagemErro } from '../../lib/erros';
import type { Produto, ItemReceita } from '../../types/produto';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface FormValues {
  nome: string;
  preco_venda: string;
  receita: { ingrediente_id: string; quantidade: string }[];
}

const formVazio: FormValues = { nome: '', preco_venda: '', receita: [{ ingrediente_id: '', quantidade: '' }] };

function produtoParaForm(p: Produto): FormValues {
  return {
    nome: p.nome,
    preco_venda: String(p.preco_venda),
    receita: p.receita.length > 0
      ? p.receita.map((r) => ({ ingrediente_id: r.ingrediente_id, quantidade: String(r.quantidade) }))
      : [{ ingrediente_id: '', quantidade: '' }],
  };
}

export function ProdutosPage() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [modoForm, setModoForm] = useState<'criar' | 'editar' | null>(null);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState<FormValues>(formVazio);

  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: produtosApi.listarAtivos,
  });

  const { data: ingredientes } = useQuery({
    queryKey: ['ingredientes'],
    queryFn: ingredientesApi.listar,
    enabled: modoForm !== null,
  });

  const invalidarProdutos = () => qc.invalidateQueries({ queryKey: ['produtos'] });

  const { mutate: criar, isPending: criando } = useMutation({
    mutationFn: produtosApi.criar,
    onSuccess: () => {
      toast.success('Produto criado com sucesso!');
      fecharForm();
      invalidarProdutos();
    },
    onError: (erro) => toast.error(extrairMensagemErro(erro)),
  });

  const { mutate: atualizar, isPending: atualizando } = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Parameters<typeof produtosApi.atualizar>[1] }) =>
      produtosApi.atualizar(id, dados),
    onSuccess: () => {
      toast.success('Produto atualizado!');
      fecharForm();
      invalidarProdutos();
    },
    onError: (erro) => toast.error(extrairMensagemErro(erro)),
  });

  const produtosFiltrados = (produtos ?? []).filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  function abrirCriar() {
    setProdutoEditando(null);
    setForm(formVazio);
    setModoForm('criar');
  }

  function abrirEditar(produto: Produto) {
    setProdutoEditando(produto);
    setForm(produtoParaForm(produto));
    setModoForm('editar');
  }

  function fecharForm() {
    setModoForm(null);
    setProdutoEditando(null);
    setForm(formVazio);
  }

  function setReceitaItem(idx: number, campo: 'ingrediente_id' | 'quantidade', valor: string) {
    setForm((prev) => ({
      ...prev,
      receita: prev.receita.map((r, i) => (i === idx ? { ...r, [campo]: valor } : r)),
    }));
  }

  function adicionarLinhaReceita() {
    setForm((prev) => ({ ...prev, receita: [...prev.receita, { ingrediente_id: '', quantidade: '' }] }));
  }

  function removerLinhaReceita(idx: number) {
    setForm((prev) => ({ ...prev, receita: prev.receita.filter((_, i) => i !== idx) }));
  }

  function submeterForm(e: React.FormEvent) {
    e.preventDefault();

    const receitaValida = form.receita.filter(
      (r) => r.ingrediente_id && parseFloat(r.quantidade) > 0,
    );

    if (receitaValida.length === 0) {
      toast.error('A receita precisa ter ao menos 1 ingrediente.');
      return;
    }

    const receita: ItemReceita[] = receitaValida.map((r) => ({
      ingrediente_id: r.ingrediente_id,
      quantidade: parseFloat(r.quantidade),
    }));

    const dados = {
      nome: form.nome.trim(),
      preco_venda: parseFloat(form.preco_venda.replace(',', '.')),
      receita,
    };

    if (modoForm === 'criar') {
      criar(dados);
    } else if (modoForm === 'editar' && produtoEditando) {
      atualizar({ id: produtoEditando.id, dados });
    }
  }

  function desativar(produto: Produto) {
    atualizar({
      id: produto.id,
      dados: { nome: produto.nome, preco_venda: produto.preco_venda, receita: produto.receita, ativo: false },
    });
  }

  const salvando = criando || atualizando;

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h1>Produtos</h1>
        <button className="btn btn-primary" onClick={abrirCriar}>
          + Novo Produto
        </button>
      </div>

      <input
        className="input"
        placeholder="Buscar produto..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ marginBottom: 'var(--space-4)', maxWidth: 360, display: 'block' }}
      />

      {modoForm !== null && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>
            {modoForm === 'criar' ? 'Novo Produto' : `Editar: ${produtoEditando?.nome}`}
          </h2>

          <form onSubmit={submeterForm}>
            <div className="grid-2-col">
              <div className="field">
                <label className="label" htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  className="input"
                  required
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="preco">Preço de Venda (R$)</label>
                <input
                  id="preco"
                  className="input"
                  required
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.preco_venda}
                  onChange={(e) => setForm((p) => ({ ...p, preco_venda: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <span className="label" style={{ margin: 0 }}>Receita</span>
                <button type="button" className="btn btn-secondary" onClick={adicionarLinhaReceita}>
                  + Ingrediente
                </button>
              </div>

              {form.receita.map((linha, idx) => (
                <div
                  key={idx}
                  style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}
                >
                  <select
                    className="select"
                    value={linha.ingrediente_id}
                    onChange={(e) => setReceitaItem(idx, 'ingrediente_id', e.target.value)}
                    style={{ flex: 2 }}
                  >
                    <option value="">Selecionar ingrediente...</option>
                    {(ingredientes ?? []).map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.nome} ({ing.unidade})
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Qtd"
                    value={linha.quantidade}
                    onChange={(e) => setReceitaItem(idx, 'quantidade', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {form.receita.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => removerLinhaReceita(idx)}
                      style={{ padding: 'var(--space-2) var(--space-3)' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={fecharForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Preço de Venda</th>
              <th>Custo</th>
              <th>Itens na Receita</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((produto) => (
              <tr key={produto.id}>
                <td style={{ fontWeight: 600 }}>{produto.nome}</td>
                <td>{moeda(produto.preco_venda)}</td>
                <td>{produto.custo_calculado != null ? moeda(produto.custo_calculado) : '—'}</td>
                <td>{produto.receita.length} ingrediente{produto.receita.length !== 1 ? 's' : ''}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => abrirEditar(produto)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => desativar(produto)}
                      disabled={atualizando}
                    >
                      Desativar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {produtosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-neutral-500)', padding: 'var(--space-8)' }}>
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
