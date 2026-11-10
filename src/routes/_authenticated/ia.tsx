import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { RingGauge } from "@/components/ui/ring-gauge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cobertura, demandaBase, disponivel, quantidadeSugerida, sugestoes } from "@/lib/erp-data";
import { useERP } from "@/lib/erp-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ia")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        const valor = Math.max(0, Math.floor(dias));
        return {
          produto: p,
          nivel: "Crítico" as const,
          ordem: dias,
          valor,
          unidade: valor === 1 ? "dia" : "dias",
          texto: `Ruptura prevista em ${valor} dias — lead time de ${p.leadTime} dias não cobre a demanda.`,
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
          ordem: horas / 24,
          valor: horas,
          unidade: "horas",
          texto: `Abaixo do ponto de pedido. Atinge o estoque de segurança em ~${horas} horas.`,
        };
      }
      return null;
    })
    .filter((a) => a !== null)
    // Ruptura mais próxima primeiro; críticos antes dos de atenção.
    .sort((a, b) => (a.nivel === b.nivel ? a.ordem - b.ordem : a.nivel === "Crítico" ? -1 : 1));

  const demandaOrdenada = [...demanda].sort((a, b) => b.variacao - a.variacao);
  const abrirNoEstoque = (produtoId: string, nome: string) => {
    const p = state.produtos.find((x) => x.id === produtoId);
    navigate({ to: "/estoque", search: { q: p?.nome ?? nome } });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 flex-[1_1_442px]">
          <h1 className="text-[34px] leading-none font-bold tracking-[-0.04em] sm:text-[54px]">
            Módulo de IA
          </h1>
          <p className="mt-3 text-[13px] text-ink/80">
            Modelo preditivo treinado com 24 meses de histórico de vendas e lead times reais
            {atualizadoEm ? ` · recalculado às ${atualizadoEm}` : ""}.
          </p>
        </div>
        <Button size="lg" onClick={recalcular} disabled={recalculando}>
          {recalculando ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw aria-hidden="true" />
          )}
          {recalculando ? "Processando..." : "Recalcular previsão"}
        </Button>
      </div>

      <section aria-labelledby="titulo-alertas" className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <h2 id="titulo-alertas" className="text-2xl font-bold tracking-[-0.02em]">
            Alertas Preventivos
          </h2>
          <span className="text-sm text-ink/80">
            {alertas.length} produtos com risco · calculado sobre o estoque em tempo real
          </span>
        </div>
        {alertas.length === 0 ? (
          <div className="rounded-card-md bg-white px-6 py-10 text-center text-[13px] text-ink/80">
            Nenhum risco de ruptura no horizonte atual.
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {alertas.map((a) => {
              const oc = ordemAberta(a.produto.id);
              return (
                <article
                  key={a.produto.id}
                  className="flex min-w-0 flex-[1_1_289px] flex-col gap-3 rounded-card-md bg-ink p-7 text-white"
                >
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[61px] leading-[0.9] font-bold tracking-[-0.05em] text-amber">
                      {a.valor}
                    </span>
                    <span className="text-xl font-medium">{a.unidade}</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-[-0.01em]">{a.produto.nome}</h3>
                  <p className="text-sm leading-[1.55] text-white/85">{a.texto}</p>
                  {oc ? (
                    <Link
                      to="/compras"
                      className="mt-1 self-start rounded-full bg-white px-[15px] py-2.5 text-[11px] font-bold text-ink"
                    >
                      {oc.id} {oc.status === "aprovada" ? "em trânsito" : "aguardando aprovação"}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="mt-1 min-h-11 self-start rounded-full bg-white px-[15px] py-2.5 text-[11px] font-bold text-ink hover:bg-white/85"
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
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-5 rounded-card bg-black p-6 text-white sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold tracking-[-0.02em]">Análise de Demanda</h2>
            <p className="mt-2 max-w-[52ch] text-sm text-white/80">
              Produtos com maior procura nos próximos {horizonte} dias. Clique para ver no estoque.
            </p>
          </div>
          <SegmentedControl
            tone="dark"
            aria-label="Horizonte da previsão"
            value={horizonte}
            onChange={setHorizonte}
            options={[
              { value: "30", label: "30d" },
              { value: "60", label: "60d" },
              { value: "90", label: "90d" },
            ]}
          />
        </div>
        <GraficoDemanda
          itens={demandaOrdenada}
          horizonte={horizonte}
          carregando={recalculando}
          onAbrir={abrirNoEstoque}
        />
      </section>

      <section className="flex flex-col gap-6 rounded-card bg-white p-6 sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[24px] font-bold tracking-[-0.02em]">Sugestões de Compra</h2>
          <Link
            to="/configuracoes"
            className="rounded-full bg-muted px-[15px] py-2.5 text-[11px] font-bold"
          >
            Ajuste automático pela IA: {state.automacoes.iaAjuste ? "ativado" : "desativado"}
          </Link>
        </div>
        <div className="flex flex-wrap gap-4">
          {sugestoes.map((s) => {
            const aplicada = state.sugestoesAplicadas.includes(s.id);
            const existe = state.produtos.some((p) => p.id === s.produtoId);
            const mud = s.politica.match(/^(.*?)\s*(\d+)\s*→\s*(\d+)\s*(.*)$/);
            return (
              <article
                key={s.id}
                className="flex min-w-0 flex-[1_1_272px] flex-col gap-[15px] rounded-[26px] bg-muted p-[22px]"
              >
                <div className="flex items-center gap-4">
                  <RingGauge
                    percent={s.confianca}
                    size={84}
                    stroke={10}
                    r={34}
                    label={`Confiança do modelo ${s.confianca} por cento`}
                    trackClassName="stroke-white"
                    arcClassName="stroke-ink"
                  >
                    {s.confianca}
                  </RingGauge>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold tracking-[-0.01em]">{s.produto}</h3>
                    <p className="mt-1 text-[11px] text-ink/80">
                      Confiança do modelo: {s.confianca}%
                    </p>
                  </div>
                </div>
                <p className="text-[48px] leading-none font-bold tracking-[-0.04em]">
                  {s.quantidade} un
                </p>
                <p className="text-sm leading-[1.55] text-ink/85">{s.motivo}</p>
                <div className="flex flex-wrap items-center gap-2.5 rounded-[17px] bg-white px-4 py-3.5">
                  {mud ? (
                    <>
                      <span className="basis-full text-xs text-ink/80">{mud[1]}</span>
                      <span className="text-xl font-medium text-ink/60 line-through">
                        {mud[2]} {mud[4]}
                      </span>
                      <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true">
                        <path
                          d="M1 7 H20 M14 1.5 L20 7 L14 12.5"
                          stroke="#14213D"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="rounded-full bg-amber px-3.5 py-1 text-xl font-bold text-black">
                        {mud[3]} {mud[4]}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold">{s.politica}</span>
                  )}
                </div>
                <Button
                  variant="dark"
                  size="lg"
                  className="mt-auto w-full"
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
                      <CheckCircle2 aria-hidden="true" />
                      Sugestão aplicada
                    </>
                  ) : existe ? (
                    "Aplicar sugestão"
                  ) : (
                    "Produto removido"
                  )}
                </Button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/** Divide o nome em duas linhas equilibradas para o rótulo do gráfico. */
function duasLinhas(nome: string): [string, string] {
  const palavras = nome.split(" ");
  if (palavras.length < 2) return [nome, ""];
  let melhor = 1;
  let menorMax = Infinity;
  for (let i = 1; i < palavras.length; i++) {
    const m = Math.max(palavras.slice(0, i).join(" ").length, palavras.slice(i).join(" ").length);
    if (m < menorMax) {
      menorMax = m;
      melhor = i;
    }
  }
  return [palavras.slice(0, melhor).join(" "), palavras.slice(melhor).join(" ")];
}

type ItemDemanda = { produtoId: string; produto: string; variacao: number };

/** Colunas de variação de demanda (Recharts): positivas âmbar, negativa hachurada. */
function GraficoDemanda({
  itens,
  horizonte,
  carregando,
  onAbrir,
}: {
  itens: ItemDemanda[];
  horizonte: string;
  carregando: boolean;
  onAbrir: (produtoId: string, nome: string) => void;
}) {
  const resumo = itens
    .map((d) => `${d.produto} ${d.variacao >= 0 ? "mais" : "menos"} ${Math.abs(d.variacao)}`)
    .join(", ");
  const topo = Math.max(10, ...itens.map((d) => d.variacao)) + 8;
  const fundo = Math.min(0, ...itens.map((d) => d.variacao)) - 6;

  return (
    <>
      <div
        role="img"
        aria-label={`Variação de demanda prevista em ${horizonte} dias, em por cento: ${resumo}`}
        className={cn("h-72 w-full transition-opacity", carregando && "opacity-40")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={itens} margin={{ top: 8, right: 16, bottom: 0, left: 16 }} barCategoryGap="22%">
            <defs>
              <pattern
                id="hachNegativa"
                width="9"
                height="9"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="9" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.7" />
              </pattern>
            </defs>
            <YAxis hide domain={[fundo, topo]} />
            <XAxis
              dataKey="produto"
              axisLine={false}
              tickLine={false}
              interval={0}
              height={44}
              tick={(p: { x: number; y: number; payload: { value: string } }) => {
                const [l1, l2] = duasLinhas(p.payload.value);
                return (
                  <g>
                    <text x={p.x} y={p.y + 14} textAnchor="middle" fontSize={12} fill="#FFFFFF">
                      {l1}
                    </text>
                    <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize={12} fill="#FFFFFF">
                      {l2}
                    </text>
                  </g>
                );
              }}
            />
            <ReferenceLine y={0} stroke="#FFFFFF" strokeOpacity={0.4} />
            <Tooltip
              cursor={false}
              contentStyle={{
                background: "#14213D",
                border: "2px solid #FCA311",
                borderRadius: 16,
                color: "#FFFFFF",
                fontSize: 13,
              }}
              itemStyle={{ color: "#FFFFFF" }}
              labelStyle={{ color: "#FCA311", fontWeight: 700 }}
              formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v}%`, "Variação da demanda"]}
            />
            <Bar
              dataKey="variacao"
              radius={18}
              maxBarSize={80}
              isAnimationActive={false}
              className="cursor-pointer"
              onClick={(d: { produtoId?: string; produto?: string }) =>
                d.produtoId && onAbrir(d.produtoId, d.produto ?? "")
              }
            >
              {itens.map((d) => (
                <Cell
                  key={d.produtoId}
                  fill={d.variacao < 0 ? "url(#hachNegativa)" : "#FCA311"}
                  stroke={d.variacao < 0 ? "#FFFFFF" : "none"}
                  strokeWidth={d.variacao < 0 ? 1.5 : 0}
                />
              ))}
              <LabelList
                dataKey="variacao"
                content={(p: {
                  x?: number | string | undefined;
                  y?: number | string | undefined;
                  width?: number | string | undefined;
                  height?: number | string | undefined;
                  value?: number | string | undefined;
                }) => {
                  const x = Number(p.x ?? 0);
                  const y = Number(p.y ?? 0);
                  const w = Number(p.width ?? 0);
                  const h = Number(p.height ?? 0);
                  const v = Number(p.value ?? 0);
                  return (
                    <text
                      x={x + w / 2}
                      y={Math.min(y, y + h) - 8}
                      textAnchor="middle"
                      fontSize={17}
                      fontWeight={700}
                      fill="#FFFFFF"
                    >
                      {v >= 0 ? "+" : ""}
                      {v}%
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Acesso por teclado e leitor de tela: cada produto leva ao estoque */}
      <ul className="sr-only">
        {itens.map((d) => (
          <li key={d.produtoId}>
            <button type="button" onClick={() => onAbrir(d.produtoId, d.produto)}>
              {d.produto}: {d.variacao >= 0 ? "+" : ""}
              {d.variacao}%. Ver no estoque
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
