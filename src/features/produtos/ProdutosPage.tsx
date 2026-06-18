import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { produtosApi } from '../../api/produtos';
import { ingredientesApi } from '../../api/ingredientes';
import { Spinner } from '../../components/Spinner';
import { extrairMensagemErro } from '../../lib/erros';
import type { Produto, ItemReceita } from '../../types/produto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <div className="max-w-[1100px] mx-auto px-6 py-6 flex justify-center pt-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Button onClick={abrirCriar}>+ Novo Produto</Button>
      </div>

      <Input
        placeholder="Buscar produto..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {modoForm !== null && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {modoForm === 'criar' ? 'Novo Produto' : `Editar: ${produtoEditando?.nome}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submeterForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    required
                    value={form.nome}
                    onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preco">Preço de Venda (R$)</Label>
                  <Input
                    id="preco"
                    required
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.preco_venda}
                    onChange={(e) => setForm((p) => ({ ...p, preco_venda: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Receita</Label>
                  <Button type="button" variant="secondary" size="sm" onClick={adicionarLinhaReceita}>
                    + Ingrediente
                  </Button>
                </div>

                {form.receita.map((linha, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <select
                      className="flex-[2] h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={linha.ingrediente_id}
                      onChange={(e) => setReceitaItem(idx, 'ingrediente_id', e.target.value)}
                    >
                      <option value="">Selecionar ingrediente...</option>
                      {(ingredientes ?? []).map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.nome} ({ing.unidade})
                        </option>
                      ))}
                    </select>
                    <Input
                      className="flex-1"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Qtd"
                      value={linha.quantidade}
                      onChange={(e) => setReceitaItem(idx, 'quantidade', e.target.value)}
                    />
                    {form.receita.length > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removerLinhaReceita(idx)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button type="button" variant="secondary" onClick={fecharForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço de Venda</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead>Itens na Receita</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtosFiltrados.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell className="font-semibold">{produto.nome}</TableCell>
                <TableCell>{moeda(produto.preco_venda)}</TableCell>
                <TableCell>{produto.custo_calculado != null ? moeda(produto.custo_calculado) : '—'}</TableCell>
                <TableCell>{produto.receita.length} ingrediente{produto.receita.length !== 1 ? 's' : ''}</TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" size="sm" onClick={() => abrirEditar(produto)}>
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => desativar(produto)}
                      disabled={atualizando}
                    >
                      Desativar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {produtosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
