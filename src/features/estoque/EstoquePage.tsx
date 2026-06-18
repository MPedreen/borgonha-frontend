import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ingredientesApi } from '../../api/ingredientes';
import { Badge } from '../../components/Badge';
import { Spinner } from '../../components/Spinner';
import { extrairMensagemErro } from '../../lib/erros';
import type { Ingrediente } from '../../types/ingrediente';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
      <div className="max-w-[1100px] mx-auto px-6 py-6 flex justify-center pt-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Estoque</h1>
        <Button onClick={() => setMostrarFormNovo((p) => !p)}>
          {mostrarFormNovo ? 'Cancelar' : '+ Novo Ingrediente'}
        </Button>
      </div>

      {mostrarFormNovo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novo Ingrediente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submeterNovoIngrediente} className="space-y-4">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ing-nome">Nome</Label>
                  <Input
                    id="ing-nome"
                    required
                    value={formNovo.nome}
                    onChange={(e) => setFormNovo((p) => ({ ...p, nome: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ing-unidade">Unidade</Label>
                  <Input
                    id="ing-unidade"
                    required
                    placeholder="ex: g, ml, un"
                    value={formNovo.unidade}
                    onChange={(e) => setFormNovo((p) => ({ ...p, unidade: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ing-qtd-atual">Quantidade Atual</Label>
                  <Input
                    id="ing-qtd-atual"
                    required
                    type="text"
                    inputMode="decimal"
                    value={formNovo.quantidade_atual}
                    onChange={(e) => setFormNovo((p) => ({ ...p, quantidade_atual: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ing-qtd-min">Quantidade Mínima</Label>
                  <Input
                    id="ing-qtd-min"
                    required
                    type="text"
                    inputMode="decimal"
                    value={formNovo.quantidade_minima}
                    onChange={(e) => setFormNovo((p) => ({ ...p, quantidade_minima: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ing-custo">Custo Unitário (R$)</Label>
                  <Input
                    id="ing-custo"
                    required
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={formNovo.custo_unitario}
                    onChange={(e) => setFormNovo((p) => ({ ...p, custo_unitario: e.target.value }))}
                  />
                </div>
              </div>
              <Button type="submit" disabled={criando}>
                {criando ? 'Salvando...' : 'Criar Ingrediente'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Qtd Atual</TableHead>
              <TableHead className="text-right">Qtd Mínima</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(ingredientes ?? []).map((ing) => (
              <TableRow key={ing.id}>
                <TableCell className="font-semibold">{ing.nome}</TableCell>
                <TableCell>{ing.unidade}</TableCell>
                <TableCell className="text-right">{ing.quantidade_atual.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-right">{ing.quantidade_minima.toLocaleString('pt-BR')}</TableCell>
                <TableCell>
                  {ing.esta_em_alerta ? (
                    <Badge variante="danger">CRÍTICO</Badge>
                  ) : (
                    <Badge variante="success">OK</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => abrirEntrada(ing)}
                  >
                    Entrada
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(ingredientes ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum ingrediente cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog de Entrada */}
      <Dialog open={!!ingredienteEntrada} onOpenChange={(open) => { if (!open) fecharModalEntrada(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Entrada</DialogTitle>
            {ingredienteEntrada && (
              <DialogDescription>
                {ingredienteEntrada.nome} — atual: {ingredienteEntrada.quantidade_atual.toLocaleString('pt-BR')}{' '}
                {ingredienteEntrada.unidade}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="entrada-qtd">
                Quantidade ({ingredienteEntrada?.unidade})
              </Label>
              <Input
                id="entrada-qtd"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={quantidadeEntrada}
                onChange={(e) => setQuantidadeEntrada(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entrada-obs">Observação (opcional)</Label>
              <Input
                id="entrada-obs"
                placeholder="ex: Compra fornecedor X"
                value={observacaoEntrada}
                onChange={(e) => setObservacaoEntrada(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={fecharModalEntrada}>
              Cancelar
            </Button>
            <Button onClick={confirmarEntrada} disabled={registrando}>
              {registrando ? 'Registrando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
