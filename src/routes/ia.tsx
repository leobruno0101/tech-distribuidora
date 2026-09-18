import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BrainCircuit, ShieldAlert, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demandaIA } from "@/lib/erp-data";

export const Route = createFileRoute("/ia")({
  head: () => ({
    meta: [
      { title: "Módulo de IA | TechDistribuidora ERP" },
      {
        name: "description",
        content: "Previsão de demanda, sugestões de compra e alertas preventivos de ruptura.",
      },
      { property: "og:title", content: "Módulo de IA | TechDistribuidora ERP" },
      {
        property: "og:description",
        content: "Previsão de demanda, sugestões de compra e alertas preventivos de ruptura.",
      },
    ],
  }),
  component: ModuloIA,
});

const sugestoes = [
  {
    produto: 'Smart TV 50" 4K UHD',
    quantidade: 140,
    politica: "Ponto de pedido 90 → 110 un",
    confianca: "92%",
    motivo: "Demanda projetada +28% com Black Friday antecipada.",
  },
  {
    produto: "Smartphone Neo 256GB",
    quantidade: 180,
    politica: "Estoque de segurança 20 → 34 un",
    confianca: "88%",
    motivo: "Consumo médio subiu de 12 para 14 un/dia nas últimas 3 semanas.",
  },
  {
    produto: "Console Play X 1TB",
    quantidade: 90,
    politica: "Lead time revisado 11 → 13 dias",
    confianca: "81%",
    motivo: "Atrasos recorrentes do fornecedor elevam risco de ruptura.",
  },
];

const alertas = [
  {
    nivel: "Crítico",
    produto: "Console Play X 1TB",
    texto: "Ruptura prevista em 2 dias — cobertura atual abaixo do estoque de segurança.",
  },
  {
    nivel: "Crítico",
    produto: "Monitor 27 QHD 165Hz",
    texto: "Ruptura prevista em 4 dias — lead time de 7 dias não cobre a demanda.",
  },
  {
    nivel: "Atenção",
    produto: "Smartphone Neo 256GB",
    texto: "Atingirá o ponto de pedido em 36 horas no ritmo atual de saída.",
  },
];

function ModuloIA() {
  const [aplicadas, setAplicadas] = useState<string[]>([]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <BrainCircuit className="h-6 w-6 text-primary" />
          Módulo de IA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modelo preditivo treinado com 24 meses de histórico de vendas e lead times reais.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Análise de Demanda</CardTitle>
            <CardDescription>Produtos com maior procura nos próximos 30 dias.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandaIA} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="produto"
                    width={150}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="demanda"
                    name="Demanda prevista (un)"
                    fill="var(--chart-2)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {demandaIA.map((d) => (
                <li
                  key={d.produto}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="truncate">{d.produto}</span>
                  <span
                    className={
                      d.variacao.startsWith("+")
                        ? "font-medium text-success"
                        : "font-medium text-danger"
                    }
                  >
                    {d.variacao}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-danger" />
              Alertas Preventivos
            </CardTitle>
            <CardDescription>Risco iminente de ruptura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertas.map((a) => (
              <div
                key={a.produto}
                className={
                  a.nivel === "Crítico"
                    ? "rounded-lg border border-danger/30 bg-danger-soft/60 p-3"
                    : "rounded-lg border border-warning/40 bg-warning-soft/60 p-3"
                }
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={
                      a.nivel === "Crítico" ? "h-4 w-4 text-danger" : "h-4 w-4 text-warning"
                    }
                  />
                  <p className="text-sm font-medium">{a.produto}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.texto}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          Sugestões de Compra
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {sugestoes.map((s) => {
            const aplicada = aplicadas.includes(s.produto);
            return (
              <Card key={s.produto}>
                <CardHeader>
                  <CardTitle className="text-base">{s.produto}</CardTitle>
                  <CardDescription>Confiança do modelo: {s.confianca}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-3xl font-semibold tracking-tight">{s.quantidade} un</p>
                  <p className="text-sm text-muted-foreground">{s.motivo}</p>
                  <p className="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
                    {s.politica}
                  </p>
                  <Button
                    className="w-full"
                    disabled={aplicada}
                    onClick={() => {
                      setAplicadas((a) => [...a, s.produto]);
                      toast.success("Política de estoque ajustada", { description: s.politica });
                    }}
                  >
                    {aplicada ? "Sugestão aplicada" : "Aplicar sugestão"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
