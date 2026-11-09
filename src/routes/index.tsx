import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Percent,
  Repeat,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import {
  brl,
  disponivel,
  financeiroMensal,
  quantidadeSugerida,
  statusDoEstoque,
} from "@/lib/erp-data";
import { useERP } from "@/lib/erp-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral | TechDistribuidora ERP" },
      {
        name: "description",
        content: "Indicadores de giro de estoque, OTIF, ciclo do pedido e margem de contribuição.",
      },
      { property: "og:title", content: "Visão Geral | TechDistribuidora ERP" },
      {
        property: "og:description",
        content: "Indicadores de giro de estoque, OTIF, ciclo do pedido e margem de contribuição.",
      },
    ],
  }),
  component: Dashboard,
});

const meses = ["Abr", "Mai", "Jun", "Jul", "Ago", "Set"];

const kpis = [
  {
    label: "Giro de Estoque",
    value: "6,4x",
    delta: "+0,8 vs. trimestre",
    positive: true,
    icon: Repeat,
    hint: "Meta: 7,0x ao ano",
    unidade: "x",
    meta: 7,
    historico: [5.4, 5.6, 5.8, 6.0, 6.1, 6.4],
    analise:
      "O giro sobe há 6 meses, puxado por Smartphones e Fones. Para atingir a meta de 7,0x, reduza a cobertura de itens com estoque acima do ponto de pedido.",
    link: { to: "/estoque" as const, label: "Ver estoque" },
  },
  {
    label: "OTIF",
    value: "87,2%",
    delta: "+3,1 p.p.",
    positive: true,
    icon: Percent,
    hint: "Entregas no prazo e completas",
    unidade: "%",
    meta: 95,
    historico: [82.1, 83.0, 84.1, 84.6, 85.9, 87.2],
    analise:
      "A reserva automática reduziu pedidos incompletos. As principais falhas restantes vêm de rupturas de Consoles e Monitores.",
    link: { to: "/ia" as const, label: "Ver alertas de ruptura" },
  },
  {
    label: "Tempo de Ciclo do Pedido",
    value: "4,3 dias",
    delta: "-0,6 dia",
    positive: true,
    icon: Clock,
    hint: "Do pedido à expedição",
    unidade: " dias",
    meta: 3.5,
    historico: [5.2, 5.0, 4.9, 4.8, 4.6, 4.3],
    analise:
      "A integração com o WMS encurtou a separação. Aprovar ordens de compra mais rápido evita esperas por reposição.",
    link: { to: "/compras" as const, label: "Ver ordens de compra" },
  },
  {
    label: "Margem de Contribuição",
    value: "22,5%",
    delta: "-1,9 p.p.",
    positive: false,
    icon: TrendingUp,
    hint: "Pressão de custo logístico",
    unidade: "%",
    meta: 25,
    historico: [26.8, 25.9, 25.1, 24.2, 23.4, 22.5],
    analise:
      "A margem cai com o aumento do frete e compras emergenciais. Ajustar a política de estoque com a IA reduz pedidos urgentes.",
    link: { to: "/configuracoes" as const, label: "Revisar política" },
  },
];

type Periodo = "6m" | "3m";

function Dashboard() {
  const { state, dispatch } = useERP();
  const [ativo, setAtivo] = useState(0);
  const [periodo, setPeriodo] = useState<Periodo>("6m");

  const kpi = kpis[ativo] ?? kpis[0]!;
  const historico = kpi.historico.map((v, i) => ({ mes: meses[i], valor: v }));
  const financeiro = periodo === "6m" ? financeiroMensal : financeiroMensal.slice(-3);

  const criticos = state.produtos.filter((p) => statusDoEstoque(p) !== "saudavel");
  const temOrdemAberta = (id: string) =>
    state.ordens.some(
      (o) => o.produtoId === id && (o.status === "pendente" || o.status === "aprovada"),
    );
  const pendentes = state.ordens.filter((o) => o.status === "pendente");
  const valorPendente = pendentes.reduce((s, o) => s + o.valor, 0);
  const valorEstoque = state.produtos.reduce((s, p) => s + p.estoque * p.custoUnitario, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão Geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.pedidosHoje} pedidos processados hoje · estoque valorizado em {brl(valorEstoque)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/compras">
            <ShoppingCart />
            {pendentes.length} ordens pendentes · {brl(valorPendente)}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <button
            key={k.label}
            type="button"
            onClick={() => setAtivo(i)}
            aria-pressed={ativo === i}
            className={cn(
              "rounded-xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
              ativo === i && "border-primary/60 ring-2 ring-primary/20",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <k.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{k.value}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  k.positive ? "text-success" : "text-danger",
                )}
              >
                {k.positive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {k.delta}
              </span>
              <span className="text-muted-foreground">· {k.hint}</span>
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>{kpi.label} · últimos 6 meses</CardTitle>
            <CardDescription className="mt-1 max-w-2xl">{kpi.analise}</CardDescription>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link to={kpi.link.to}>
              {kpi.link.label}
              <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico} margin={{ top: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  domain={["auto", "auto"]}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [
                    `${v.toLocaleString("pt-BR")}${kpi.unidade}`,
                    kpi.label,
                  ]}
                />
                <ReferenceLine
                  y={kpi.meta}
                  stroke="var(--chart-5)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Meta",
                    fontSize: 11,
                    fill: "var(--muted-foreground)",
                    position: "insideTopRight",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Crescimento comercial x desempenho financeiro</CardTitle>
              <CardDescription className="mt-1">
                Faturamento +40% no período contra lucro -15%: expansão de vendas com erosão de
                margem.
              </CardDescription>
            </div>
            <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
              <TabsList>
                <TabsTrigger value="3m">3 meses</TabsTrigger>
                <TabsTrigger value="6m">6 meses</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeiro} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number, n: string) => [`índice ${v}`, n]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="faturamento"
                    name="Faturamento (+40%)"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="lucro"
                    name="Lucro (-15%)"
                    fill="var(--chart-5)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saúde do estoque</CardTitle>
            <CardDescription>{criticos.length} itens fora da política de estoque</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticos.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-success" />
                Todos os produtos estão dentro da política.
              </div>
            )}
            {criticos.map((p) => {
              const aberta = temOrdemAberta(p.id);
              return (
                <div key={p.id} className="rounded-lg border p-3">
                  <Link
                    to="/estoque"
                    search={{ q: p.nome }}
                    className="block min-w-0 hover:underline"
                  >
                    <p className="truncate text-sm font-medium">{p.nome}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {disponivel(p)} un disponíveis · ponto de pedido {p.pontoPedido}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge status={statusDoEstoque(p)} />
                    {aberta ? (
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                        <Link to="/compras">Ver ordem</Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          const qtd = quantidadeSugerida(p);
                          dispatch({
                            type: "criarOrdem",
                            agora: Date.now(),
                            ordem: {
                              produtoId: p.id,
                              quantidade: qtd,
                              origem: "Painel · Saúde do estoque",
                            },
                          });
                          toast.success(`Ordem de compra criada para ${p.nome}`, {
                            description: `${qtd} un aguardando aprovação.`,
                          });
                        }}
                      >
                        Repor agora
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
