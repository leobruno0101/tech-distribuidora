import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cobertura, demandaBase, disponivel, quantidadeSugerida, sugestoes } from "@/lib/erp-data";
import { useERP } from "@/lib/erp-store";

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

type Horizonte = "30" | "60" | "90";

function ModuloIA() {
  const { state, dispatch } = useERP();
  const navigate = useNavigate();
  const [horizonte, setHorizonte] = useState<Horizonte>("30");
  const [ruido, setRuido] = useState<number[]>(() => demandaBase.map(() => 1));
  const [recalculando, setRecalculando] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);

  const fator = Number(horizonte) / 30;
  const demanda = demandaBase.map((d, i) => ({
    ...d,
    demanda: Math.round(d.demanda * fator * (ruido[i] ?? 1)),
    variacao: Math.round(d.variacao + ((ruido[i] ?? 1) - 1) * 100),
  }));

  const recalcular = () => {
    setRecalculando(true);
    setTimeout(() => {
      setRuido(demandaBase.map(() => 0.94 + Math.random() * 0.12));
      setRecalculando(false);
      const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      setAtualizadoEm(hora);
      toast.success("Previsão recalculada", {
        description: "Modelo reprocessado com as vendas das últimas 24 horas.",
      });
    }, 1400);
  };

  const ordemAberta = (id: string) =>
    state.ordens.find(
      (o) => o.produtoId === id && (o.status === "pendente" || o.status === "aprovada"),
    );

  const alertas = state.produtos
    .map((p) => {
      const dias = cobertura(p);
      if (dias < p.leadTime) {
        return {
          produto: p,
          nivel: "Crítico" as const,
          texto: `Ruptura prevista em ${Math.max(0, Math.floor(dias))} dias — lead time de ${p.leadTime} dias não cobre a demanda.`,
        };
      }
      if (disponivel(p) <= p.pontoPedido) {
        const horas = Math.max(
          0,
          Math.round(((disponivel(p) - p.estoqueSeguranca) / p.consumoMedio) * 24),
        );
        return {
          produto: p,
          nivel: "Atenção" as const,
          texto: `Abaixo do ponto de pedido. Atinge o estoque de segurança em ~${horas} horas.`,
        };
      }
      return null;
    })
    .filter((a) => a !== null)
    .sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === "Crítico" ? -1 : 1));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <BrainCircuit className="h-6 w-6 text-primary" />
            Módulo de IA
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modelo preditivo treinado com 24 meses de histórico de vendas e lead times reais
            {atualizadoEm ? ` · recalculado às ${atualizadoEm}` : ""}.
          </p>
        </div>
        <Button variant="outline" onClick={recalcular} disabled={recalculando}>
          {recalculando ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          {recalculando ? "Processando..." : "Recalcular previsão"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Análise de Demanda</CardTitle>
              <CardDescription className="mt-1">
                Produtos com maior procura nos próximos {horizonte} dias. Clique para ver no
                estoque.
              </CardDescription>
            </div>
            <Tabs value={horizonte} onValueChange={(v) => setHorizonte(v as Horizonte)}>
              <TabsList>
                <TabsTrigger value="30">30d</TabsTrigger>
                <TabsTrigger value="60">60d</TabsTrigger>
                <TabsTrigger value="90">90d</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className={"h-64 w-full transition-opacity " + (recalculando ? "opacity-40" : "")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demanda} layout="vertical" margin={{ left: 12 }}>
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
                    cursor={{ fill: "var(--accent)" }}
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
                    className="cursor-pointer"
                    onClick={(d: { produtoId?: string }) => {
                      const p = state.produtos.find((x) => x.id === d.produtoId);
                      if (p) navigate({ to: "/estoque", search: { q: p.nome } });
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {demanda.map((d) => {
                const p = state.produtos.find((x) => x.id === d.produtoId);
                return (
                  <li key={d.produto}>
                    <Link
                      to="/estoque"
                      search={{ q: p?.nome ?? d.produto }}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      <span className="truncate">{d.produto}</span>
                      <span
                        className={
                          d.variacao >= 0 ? "font-medium text-success" : "font-medium text-danger"
                        }
                      >
                        {d.variacao >= 0 ? "+" : ""}
                        {d.variacao}%
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-danger" />
              Alertas Preventivos
            </CardTitle>
            <CardDescription>
              {alertas.length} produtos com risco · calculado sobre o estoque em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertas.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-success" />
                Nenhum risco de ruptura no horizonte atual.
              </div>
            )}
            {alertas.map((a) => {
              const oc = ordemAberta(a.produto.id);
              return (
                <div
                  key={a.produto.id}
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
                    <p className="text-sm font-medium">{a.produto.nome}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.texto}</p>
                  <div className="mt-2">
                    {oc ? (
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                        <Link to="/compras">
                          {oc.id}{" "}
                          {oc.status === "aprovada" ? "em trânsito" : "aguardando aprovação"} →
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 bg-card text-xs"
                        onClick={() => {
                          const qtd = quantidadeSugerida(a.produto);
                          dispatch({
                            type: "criarOrdem",
                            agora: Date.now(),
                            ordem: {
                              produtoId: a.produto.id,
                              quantidade: qtd,
                              origem: "Alerta preventivo (IA)",
                            },
                          });
                          toast.success("Ordem de compra gerada", {
                            description: `${a.produto.nome} · ${qtd} un.`,
                          });
                        }}
                      >
                        Gerar ordem de compra
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            Sugestões de Compra
          </h2>
          <p className="text-xs text-muted-foreground">
            Ajuste automático pela IA:{" "}
            <Link to="/configuracoes" className="font-medium text-primary hover:underline">
              {state.automacoes.iaAjuste ? "ativado" : "desativado"}
            </Link>
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {sugestoes.map((s) => {
            const aplicada = state.sugestoesAplicadas.includes(s.id);
            const existe = state.produtos.some((p) => p.id === s.produtoId);
            return (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="text-base">{s.produto}</CardTitle>
                  <CardDescription>Confiança do modelo: {s.confianca}%</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-3xl font-semibold tracking-tight">{s.quantidade} un</p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${s.confianca}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{s.motivo}</p>
                  <p className="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
                    {s.politica}
                  </p>
                  <Button
                    className="w-full"
                    disabled={aplicada || !existe}
                    onClick={() => {
                      dispatch({ type: "aplicarSugestao", sugestaoId: s.id, agora: Date.now() });
                      toast.success("Sugestão aplicada", {
                        description: `${s.politica} · ordem de ${s.quantidade} un enviada para aprovação.`,
                        action: {
                          label: "Ver ordens",
                          onClick: () => navigate({ to: "/compras" }),
                        },
                      });
                    }}
                  >
                    {aplicada ? (
                      <>
                        <CheckCircle2 />
                        Sugestão aplicada
                      </>
                    ) : existe ? (
                      "Aplicar sugestão"
                    ) : (
                      "Produto removido"
                    )}
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
