import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Clock, Percent, Repeat, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { financeiroMensal, produtos, statusDoEstoque } from "@/lib/erp-data";
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

const kpis = [
  {
    label: "Giro de Estoque",
    value: "6,4x",
    delta: "+0,8 vs. trimestre",
    positive: true,
    icon: Repeat,
    hint: "Meta: 7,0x ao ano",
  },
  {
    label: "OTIF",
    value: "87,2%",
    delta: "+3,1 p.p.",
    positive: true,
    icon: Percent,
    hint: "Entregas no prazo e completas",
  },
  {
    label: "Tempo de Ciclo do Pedido",
    value: "4,3 dias",
    delta: "-0,6 dia",
    positive: true,
    icon: Clock,
    hint: "Do pedido à expedição",
  },
  {
    label: "Margem de Contribuição",
    value: "22,5%",
    delta: "-1,9 p.p.",
    positive: false,
    icon: TrendingUp,
    hint: "Pressão de custo logístico",
  },
];

function Dashboard() {
  const [ativo, setAtivo] = useState(0);
  const [pedidosHoje, setPedidosHoje] = useState(182);

  useEffect(() => {
    const id = setInterval(() => setPedidosHoje((p) => p + Math.floor(Math.random() * 3)), 4000);
    return () => clearInterval(id);
  }, []);

  const criticos = produtos.filter((p) => statusDoEstoque(p) !== "saudavel");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visão Geral</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pedidosHoje} pedidos processados hoje · dados atualizados em tempo real
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => setAtivo(i)}
            className={cn(
              "rounded-xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
              ativo === i && "border-primary/60 ring-2 ring-primary/20",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{kpi.value}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  kpi.positive ? "text-success" : "text-danger",
                )}
              >
                {kpi.positive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {kpi.delta}
              </span>
              <span className="text-muted-foreground">· {kpi.hint}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Crescimento comercial x desempenho financeiro</CardTitle>
            <CardDescription>
              Faturamento +40% no período contra lucro -15%: expansão de vendas com erosão de
              margem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeiroMensal} barGap={6}>
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
            <CardDescription>Itens fora da política de estoque</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticos.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.estoque} un · ponto de pedido {p.pontoPedido}
                    </p>
                  </div>
                </div>
                <StatusBadge status={statusDoEstoque(p)} className="mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
