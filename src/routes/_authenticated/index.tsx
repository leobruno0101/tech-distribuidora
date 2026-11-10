import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { RingGauge } from "@/components/ui/ring-gauge";
import { SegmentedControl } from "@/components/ui/segmented-control";
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

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

const pt = (n: number, casas = 0) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
const pct = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n)}%`;

function Dashboard() {
  const { state, dispatch } = useERP();
  const [periodo, setPeriodo] = useState<Periodo>("6m");

  const giro = kpis[0]!;
  const otif = kpis[1]!;
  const ciclo = kpis[2]!;
  const margem = kpis[3]!;
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
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-stretch gap-4">
        <div className="flex min-w-0 flex-[1.7_1_462px] flex-col gap-4">
          <article className="flex flex-col gap-4 rounded-card bg-black p-5 text-white sm:p-6">
            <h1 className="text-base font-medium text-white/70">Visão Geral</h1>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div>
                <div className="text-[52px] leading-[0.9] font-bold tracking-[-0.045em] text-amber sm:text-[64px]">
                  {state.pedidosHoje}
                </div>
                <div className="mt-2 text-lg font-medium">pedidos processados hoje</div>
              </div>
              <div className="rounded-3xl bg-ink px-6 py-[13px]">
                <div className="text-[11px] text-white/70">Estoque valorizado em</div>
                <div className="mt-1 text-[22px] font-semibold tracking-[-0.02em]">
                  {brl(valorEstoque)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[20px] bg-ink p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] text-white/70">{giro.label} · últimos 6 meses</div>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-[31px] font-bold tracking-[-0.03em]">{giro.value}</span>
                    <span className="rounded-full bg-amber px-3 py-1 text-[11px] font-bold text-black">
                      {giro.delta}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-white/70">{giro.hint}</div>
              </div>
              <GraficoGiro historico={giro.historico} meta={giro.meta} valor={giro.value} />
              <div className="flex flex-wrap items-center justify-between gap-3.5">
                <p className="max-w-[64ch] flex-[1_1_246px] text-[11px] leading-[1.55] text-white/80">
                  {giro.analise}
                </p>
                <Button asChild size="lg">
                  <Link to={giro.link.to}>{giro.link.label}</Link>
                </Button>
              </div>
            </div>
          </article>
          <section aria-label="Indicadores" className="flex flex-wrap gap-4">
            <article className="flex min-w-0 flex-[1_1_220px] items-center gap-[16px] rounded-card-md bg-white p-6">
              <RingGauge
                percent={otif.historico[otif.historico.length - 1] ?? 0}
                size={124}
                stroke={14}
                r={52}
                label={`${otif.label} ${otif.value.replace("%", "")} por cento`}
              />
              <div>
                <div className="text-[11px] text-ink/70">{otif.label}</div>
                <div className="mt-0.5 text-[29px] leading-none font-bold tracking-[-0.03em]">
                  {otif.value}
                </div>
                <div className="mt-2">
                  <span className="rounded-full bg-muted px-2.5 py-[3px] text-[11px] font-bold">
                    {otif.delta}
                  </span>
                </div>
                <div className="mt-2 text-[11px] leading-[1.4] text-ink/70">{otif.hint}</div>
              </div>
            </article>

            <article className="flex min-w-0 flex-[1_1_220px] flex-col gap-3.5 rounded-card-md bg-white p-6">
              <div className="text-[11px] text-ink/70">{ciclo.label}</div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-[29px] leading-none font-bold tracking-[-0.03em]">
                  {ciclo.value}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-[3px] text-[11px] font-bold">
                  {ciclo.delta}
                </span>
              </div>
              <svg
                viewBox="0 0 260 44"
                role="img"
                aria-label={`${ciclo.hint} em ${ciclo.value}`}
                className="h-auto w-full"
              >
                <line
                  x1="12"
                  y1="16"
                  x2="248"
                  y2="16"
                  stroke="#14213D"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="8" fill="#14213D" />
                <circle cx="248" cy="16" r="8" fill="#FCA311" stroke="#14213D" strokeWidth="3" />
                <g fontSize="12" fontFamily="Bricolage Grotesque, sans-serif" fill="#14213D">
                  <text x="0" y="40">
                    Pedido
                  </text>
                  <text x="248" y="40" textAnchor="end">
                    Expedição
                  </text>
                </g>
              </svg>
            </article>

            <article className="flex min-w-0 flex-[1_1_220px] flex-col gap-3.5 rounded-card-md bg-ink p-6 text-white">
              <div className="text-[11px] text-white/70">{margem.label}</div>
              <div className="text-[37px] leading-none font-bold tracking-[-0.04em]">
                {margem.value}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold",
                    margem.positive ? "bg-white text-ink" : "bg-amber text-black",
                  )}
                >
                  {margem.delta}
                </span>
                <span className="text-[11px] text-white/80">{margem.hint}</span>
              </div>
            </article>
          </section>
          <Tesoura periodo={periodo} onPeriodo={setPeriodo} dados={financeiro} className="flex-1" />
        </div>

        <div className="flex min-w-0 flex-[1_1_275px] flex-col gap-4">
          <article className="flex flex-col gap-3.5 rounded-card-md bg-amber p-6 text-black">
            <div className="text-base font-semibold">Aguardando sua aprovação</div>
            <div className="text-[46px] leading-[0.95] font-bold tracking-[-0.04em]">
              {pendentes.length} {pendentes.length === 1 ? "ordem" : "ordens"}
            </div>
            <div className="text-[16px] font-medium">{brl(valorPendente)} pendentes</div>
            <Button asChild variant="dark" size="lg" className="mt-2 self-start">
              <Link to="/compras">Revisar ordens</Link>
            </Button>
          </article>

          <article className="flex flex-[1_1_auto] flex-col gap-1.5 rounded-card-md bg-white p-6">
            <div className="mb-2">
              <h2 className="text-[16px] font-bold tracking-[-0.01em]">Saúde do estoque</h2>
              <p className="mt-1 text-sm text-ink/70">
                {criticos.length} itens fora da política de estoque
              </p>
            </div>
            {criticos.length === 0 && (
              <p className="border-t border-muted py-6 text-center text-sm text-ink/80">
                Todos os produtos estão dentro da política.
              </p>
            )}
            {criticos.map((p) => {
              const aberta = temOrdemAberta(p.id);
              const barra = Math.min(140, (disponivel(p) / Math.max(p.pontoPedido, 1)) * 140);
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-t border-muted py-3.5"
                >
                  <div className="min-w-0 flex-[1_1_123px]">
                    <Link
                      to="/estoque"
                      search={{ q: p.nome }}
                      className="text-base font-semibold hover:underline"
                    >
                      {p.nome}
                    </Link>
                    <div className="mt-0.5 text-[11px] text-ink/70">
                      {disponivel(p)} un disponíveis · ponto de pedido {p.pontoPedido}
                    </div>
                    <div className="mt-1.5">
                      <svg
                        width="140"
                        height="8"
                        viewBox="0 0 140 8"
                        role="img"
                        aria-label="Disponível em relação ao ponto de pedido"
                      >
                        <rect width="140" height="8" rx="4" fill="#E5E5E5" />
                        <rect width={barra} height="8" rx="4" fill="#14213D" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={statusDoEstoque(p)} />
                    {aberta ? (
                      <Link to="/compras" className="text-[11px] font-semibold underline">
                        Ver ordem
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="min-h-6 text-[11px] font-semibold underline hover:no-underline"
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
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </article>
        </div>
      </section>
    </div>
  );
}

const tooltipEscuro = {
  background: "#14213D",
  border: "2px solid #FCA311",
  borderRadius: 16,
  color: "#FFFFFF",
  fontSize: 13,
};

/** Giro de estoque (Recharts): linha âmbar em fundo navy e meta tracejada. */
function GraficoGiro({
  historico,
  meta,
  valor,
}: {
  historico: number[];
  meta: number;
  valor: string;
}) {
  const n = historico.length;
  const dados = historico.map((v, i) => ({ mes: meses[meses.length - n + i], valor: v }));
  const min = Math.min(...historico, meta);
  const ultimo = dados.length - 1;
  return (
    <div
      role="img"
      aria-label={`Giro de estoque subindo nos últimos ${n} meses até ${valor}, abaixo da meta de ${pt(meta, 1)}x`}
      className="h-28 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 12, right: 24, bottom: 0, left: 24 }}>
          <CartesianGrid vertical={false} stroke="#FFFFFF" strokeOpacity={0.12} />
          <XAxis
            dataKey="mes"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.72)", fontSize: 13 }}
          />
          <YAxis hide domain={[min - 0.4, meta + 0.2]} />
          <Tooltip
            contentStyle={tooltipEscuro}
            itemStyle={{ color: "#FFFFFF" }}
            labelStyle={{ color: "#FCA311", fontWeight: 700 }}
            cursor={{ stroke: "#FFFFFF", strokeOpacity: 0.3 }}
            formatter={(v: number) => [`${pt(v, 1)}x`, "Giro"]}
          />
          <ReferenceLine
            y={meta}
            stroke="#FFFFFF"
            strokeOpacity={0.7}
            strokeWidth={1.5}
            strokeDasharray="6 6"
          />
          <Line
            type="linear"
            dataKey="valor"
            stroke="#FCA311"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            isAnimationActive={false}
            dot={(p: { cx?: number; cy?: number; index?: number }) =>
              p.index === ultimo ? (
                <circle key="fim" cx={p.cx} cy={p.cy} r={9} fill="#FCA311" />
              ) : (
                <circle
                  key={p.index}
                  cx={p.cx}
                  cy={p.cy}
                  r={5}
                  fill="#14213D"
                  stroke="#FCA311"
                  strokeWidth={3}
                />
              )
            }
            activeDot={{ r: 9, fill: "#FCA311", stroke: "#14213D", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Crescimento x desempenho ("tesoura", Recharts): variação % sobre o início do período. */
function Tesoura({
  periodo,
  onPeriodo,
  dados,
  className,
}: {
  className?: string;
  periodo: Periodo;
  onPeriodo: (p: Periodo) => void;
  dados: { mes: string; faturamento: number; lucro: number }[];
}) {
  // Série estática do mockup: faturamento chega a +40% e lucro a -15% (3 meses = últimos 3 pontos).
  const FAT = [0, 2.5, 9.2, 19.2, 30, 40];
  const LUC = [0, -2.5, -7.5, -11.7, -14.2, -15];
  const serie = dados.map((d, i) => {
    const k = FAT.length - dados.length + i;
    const fat = FAT[k] ?? 0;
    const luc = LUC[k] ?? 0;
    return { mes: d.mes, fat, luc, faixa: [luc, fat] as [number, number] };
  });
  const fim = serie[serie.length - 1];
  const vFatFim = fim?.fat ?? 0;
  const vLucFim = fim?.luc ?? 0;
  const topo = Math.max(10, ...serie.map((s) => s.fat)) + 6;
  const fundo = Math.min(-10, ...serie.map((s) => s.luc)) - 6;
  const ultimo = serie.length - 1;

  const rotuloFim =
    (chave: "fat" | "luc", cor: string, dy: number) =>
    (p: { x?: number; y?: number; index?: number }) =>
      p.index === ultimo ? (
        <text
          key={chave}
          x={(p.x ?? 0) - 14}
          y={(p.y ?? 0) + dy}
          textAnchor="end"
          fontSize={16}
          fontWeight={700}
          fill={cor}
        >
          {pct(chave === "fat" ? vFatFim : vLucFim)}
        </text>
      ) : (
        <g key={`${chave}-${p.index}`} />
      );

  return (
    <section
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-4 rounded-card bg-white p-4 sm:p-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-[1_1_204px] flex-col gap-3">
        <h2 className="max-w-[18ch] text-[19px] font-bold tracking-[-0.02em]">
          Crescimento comercial x desempenho financeiro
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-[16px] bg-ink px-4 py-3 text-white">
            <div className="text-xs text-white/70">Faturamento</div>
            <div className="text-[23px] font-bold tracking-[-0.03em]">{pct(vFatFim)}</div>
          </div>
          <div className="rounded-[16px] bg-amber px-4 py-3 text-black">
            <div className="text-xs">Lucro</div>
            <div className="text-[23px] font-bold tracking-[-0.03em]">{pct(vLucFim)}</div>
          </div>
        </div>
        <p className="text-sm leading-[1.55] text-ink/80">
          Faturamento {pct(vFatFim)} no período contra lucro {pct(vLucFim)}
          {vFatFim >= 0 && vLucFim < 0 ? ": expansão de vendas com erosão de margem." : "."}
        </p>
        <SegmentedControl
          aria-label="Período do gráfico"
          value={periodo}
          onChange={onPeriodo}
          className="self-start bg-muted"
          options={[
            { value: "3m", label: "3 meses" },
            { value: "6m", label: "6 meses" },
          ]}
        />
      </div>
      <div
        role="img"
        aria-label={`Faturamento ${vFatFim >= 0 ? "sobe" : "cai"} ${Math.abs(Math.round(vFatFim))} por cento enquanto o lucro ${vLucFim >= 0 ? "sobe" : "cai"} ${Math.abs(Math.round(vLucFim))} por cento no período, abrindo uma tesoura entre as duas linhas`}
        className="h-52 min-w-0 flex-[2_1_323px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={serie} margin={{ top: 16, right: 24, bottom: 4, left: 24 }}>
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#14213D", fontSize: 13 }}
            />
            <YAxis hide domain={[fundo, topo]} />
            <Tooltip
              contentStyle={tooltipEscuro}
              itemStyle={{ color: "#FFFFFF" }}
              labelStyle={{ color: "#FCA311", fontWeight: 700 }}
              formatter={(v, nome) =>
                nome === "faixa"
                  ? [null, null]
                  : [pct(Number(v)), nome === "fat" ? "Faturamento" : "Lucro"]
              }
            />
            <ReferenceLine y={0} stroke="#14213D" strokeOpacity={0.35} strokeDasharray="4 6" />
            <Area
              type="linear"
              dataKey="faixa"
              stroke="none"
              fill="#FCA311"
              fillOpacity={0.35}
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              type="linear"
              dataKey="fat"
              stroke="#14213D"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive={false}
              dot={(p: { cx?: number; cy?: number; index?: number }) =>
                p.index === ultimo ? (
                  <circle key="fat-fim" cx={p.cx} cy={p.cy} r={8} fill="#14213D" />
                ) : (
                  <g key={`fat-${p.index}`} />
                )
              }
              label={rotuloFim("fat", "#14213D", 26)}
            />
            <Line
              type="linear"
              dataKey="luc"
              stroke="#000000"
              strokeWidth={5}
              strokeDasharray="2 10"
              strokeLinecap="round"
              isAnimationActive={false}
              dot={(p: { cx?: number; cy?: number; index?: number }) =>
                p.index === ultimo ? (
                  <circle key="luc-fim" cx={p.cx} cy={p.cy} r={8} fill="#000000" />
                ) : (
                  <g key={`luc-${p.index}`} />
                )
              }
              label={rotuloFim("luc", "#000000", 32)}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
