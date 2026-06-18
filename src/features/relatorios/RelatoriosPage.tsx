import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { relatoriosApi } from '../../api/relatorios';
import { KpiCard } from '../../components/KpiCard';
import { Spinner } from '../../components/Spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

const hoje = () => new Date().toISOString().split('T')[0];

const mesAtual = new Date().getMonth() + 1;
const anoAtual = new Date().getFullYear();

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const ANOS = Array.from({ length: 5 }, (_, i) => anoAtual - i);

function varianteLucro(lucro: number) {
  if (lucro > 0) return 'success' as const;
  if (lucro < 0) return 'danger' as const;
  return 'destaque' as const;
}

export function RelatoriosPage() {
  const [dataDiario, setDataDiario] = useState(hoje());
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);

  const [aba, setAba] = useState<'diario' | 'mensal'>('diario');

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
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as 'diario' | 'mensal')}>
        <TabsList>
          <TabsTrigger value="diario">Diário</TabsTrigger>
          <TabsTrigger value="mensal">Mensal</TabsTrigger>
        </TabsList>

        {/* Aba Diário */}
        <TabsContent value="diario">
          <div className="flex items-center gap-4 mb-6">
            <div className="space-y-1.5">
              <Label htmlFor="data-diario">Data</Label>
              <Input
                id="data-diario"
                type="date"
                value={dataDiario}
                onChange={(e) => setDataDiario(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>

          {carregandoDiario && <Spinner />}

          {erroDiario && (
            <p className="text-destructive">Não foi possível carregar o relatório.</p>
          )}

          {diario && !carregandoDiario && (
            <>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                <KpiCard titulo="Total de Vendas" valor={String(diario.total_vendas)} variante="destaque" />
                <KpiCard titulo="Receita Bruta" valor={moeda(diario.receita_bruta)} />
                <KpiCard titulo="Custo Total" valor={moeda(diario.custo_total)} />
                <KpiCard titulo="Lucro" valor={moeda(diario.lucro)} variante={varianteLucro(diario.lucro)} />
              </div>

              {diario.total_vendas === 0 && (
                <p className="mt-6 text-muted-foreground">
                  Nenhuma venda registrada nesta data.
                </p>
              )}
            </>
          )}
        </TabsContent>

        {/* Aba Mensal */}
        <TabsContent value="mensal">
          <div className="flex gap-4 items-end mb-6 flex-wrap">
            <div className="space-y-1.5">
              <Label htmlFor="sel-mes">Mês</Label>
              <select
                id="sel-mes"
                className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(Number(e.target.value))}
              >
                {MESES.map((nome, i) => (
                  <option key={i + 1} value={i + 1}>{nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sel-ano">Ano</Label>
              <select
                id="sel-ano"
                className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              >
                {ANOS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {carregandoMensal && <Spinner />}

          {erroMensal && (
            <p className="text-destructive">Não foi possível carregar o relatório.</p>
          )}

          {mensal && !carregandoMensal && (
            <>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8">
                <KpiCard titulo="Total de Vendas" valor={String(mensal.total_vendas)} variante="destaque" />
                <KpiCard titulo="Receita Bruta" valor={moeda(mensal.receita_bruta)} />
                <KpiCard titulo="Custo Total" valor={moeda(mensal.custo_total)} />
                <KpiCard titulo="Lucro" valor={moeda(mensal.lucro)} variante={varianteLucro(mensal.lucro)} />
              </div>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Ranking de Produtos</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {mensal.ranking.length === 0 ? (
                    <p className="text-muted-foreground px-6 py-4">
                      Nenhuma venda registrada neste mês.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-right">Unidades Vendidas</TableHead>
                          <TableHead className="text-right">Receita</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mensal.ranking.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-muted-foreground w-10">{idx + 1}°</TableCell>
                            <TableCell className={idx === 0 ? 'font-bold' : ''}>
                              {item.nome}
                            </TableCell>
                            <TableCell className="text-right">{item.unidades_vendidas}</TableCell>
                            <TableCell className="text-right font-semibold">{moeda(item.receita)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
