import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  brl,
  cobertura,
  statusDoEstoque,
  disponivel,
  quantidadeSugerida,
  type OrdemCompra,
  type Produto,
  type OrdemStatus,
} from "@/lib/erp-data";
import { useERP } from "@/lib/erp-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compras")({
  head: () => ({
    meta: [
      { title: "Ordens de Compra | TechDistribuidora ERP" },
      {
        name: "description",
        content: "Ordens geradas automaticamente no ponto de pedido, com aprovação do gestor.",
      },
      { property: "og:title", content: "Ordens de Compra | TechDistribuidora ERP" },
      {
        property: "og:description",
        content: "Ordens geradas automaticamente no ponto de pedido, com aprovação do gestor.",
      },
    ],
  }),
  component: Compras,
});

const statusInfo: Record<OrdemStatus, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "border-2 border-ink text-ink" },
  aprovada: { label: "Em trânsito", cls: "bg-ink text-white" },
  recebida: { label: "Recebida", cls: "bg-muted text-ink" },
  rejeitada: { label: "Rejeitada", cls: "bg-black text-white" },
};

const mensagemVazia: Record<"todas" | OrdemStatus, string> = {
  pendente: "Nenhuma ordem pendente.",
  aprovada: "Nenhuma ordem em trânsito.",
  recebida: "Nenhuma ordem recebida.",
  rejeitada: "Nenhuma ordem rejeitada.",
  todas: "Nenhuma ordem registrada.",
};

type Filtro = "todas" | OrdemStatus;

function Compras() {
  const { state, dispatch } = useERP();
  const [filtro, setFiltro] = useState<Filtro>("pendente");
  const [rejeitando, setRejeitando] = useState<OrdemCompra | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  const contagem = (s: OrdemStatus) => state.ordens.filter((o) => o.status === s).length;
  const pendentes = state.ordens.filter((o) => o.status === "pendente");
  // Fila: menor cobertura do produto primeiro (mais urgente).
  const coberturaDe = (o: OrdemCompra) => {
    const p = state.produtos.find((x) => x.id === o.produtoId);
    return p ? cobertura(p) : Infinity;
  };
  const lista = (
    filtro === "todas" ? state.ordens : state.ordens.filter((o) => o.status === filtro)
  )
    .slice()
    .sort((a, b) => coberturaDe(a) - coberturaDe(b));
  const oc = lista.find((o) => o.id === selecionadoId) ?? lista[0];
  const produtoOc = oc ? state.produtos.find((p) => p.id === oc.produtoId) : undefined;

  const aprovar = (oc: OrdemCompra) => {
    dispatch({ type: "aprovarOrdem", id: oc.id, agora: Date.now() });
    toast.success(`${oc.id} aprovada`, {
      description: `Enviada ao fornecedor ${oc.fornecedor}. Previsão de entrega: ${oc.previsaoDias} dias.`,
    });
  };

  const aprovarTodas = () => {
    const agora = Date.now();
    pendentes.forEach((o) => dispatch({ type: "aprovarOrdem", id: o.id, agora }));
    toast.success(`${pendentes.length} ordens aprovadas`, {
      description: `Total enviado aos fornecedores: ${brl(pendentes.reduce((s, o) => s + o.valor, 0))}.`,
    });
  };

  const receber = (oc: OrdemCompra) => {
    dispatch({ type: "receberOrdem", id: oc.id, agora: Date.now() });
    toast.success(`${oc.id} recebida`, {
      description: `+${oc.quantidade} un de ${oc.produto} no estoque.`,
    });
  };

  const reabrir = (oc: OrdemCompra) => {
    dispatch({ type: "reabrirOrdem", id: oc.id, agora: Date.now() });
    toast.info(`${oc.id} reaberta para aprovação`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 flex-[1_1_442px]">
          <h1 className="text-[34px] leading-none font-bold tracking-[-0.04em] sm:text-[54px]">
            Ordens de Compra
          </h1>
          <p className="mt-3 text-[13px] text-ink/80">
            {pendentes.length} ordens aguardando aprovação ·{" "}
            {state.automacoes.autoOC
              ? "geração automática pelo ponto de pedido ativa."
              : "geração automática desativada."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setNovaAberta(true)}>
            Nova ordem
          </Button>
          <Button size="lg" disabled={pendentes.length === 0} onClick={aprovarTodas}>
            Aprovar todas · {brl(pendentes.reduce((s, o) => s + o.valor, 0))}
          </Button>
        </div>
      </div>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
        <TabsList className="h-auto flex-wrap self-start" aria-label="Status das ordens">
          <TabsTrigger value="pendente">Pendentes ({contagem("pendente")})</TabsTrigger>
          <TabsTrigger value="aprovada">Em trânsito ({contagem("aprovada")})</TabsTrigger>
          <TabsTrigger value="recebida">Recebidas ({contagem("recebida")})</TabsTrigger>
          <TabsTrigger value="rejeitada">Rejeitadas ({contagem("rejeitada")})</TabsTrigger>
          <TabsTrigger value="todas">Todas ({state.ordens.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {lista.length === 0 || !oc ? (
        <div className="rounded-card-md bg-white px-6 py-14 text-center text-[13px] text-ink/80">
          {mensagemVazia[filtro]}
        </div>
      ) : (
        <section className="flex flex-wrap items-stretch gap-5">
          <aside className="flex min-w-0 flex-[1_1_357px] flex-col gap-2.5 rounded-card bg-white/55 p-3.5">
            <h2 className="px-3.5 pt-2.5 pb-1 text-sm font-bold">
              Fila de aprovação · da mais urgente à menos urgente
            </h2>
            {lista.map((o) => {
              const ativa = o.id === oc.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-current={ativa ? "true" : undefined}
                  onClick={() => setSelecionadoId(o.id)}
                  className={cn(
                    "flex flex-col gap-2.5 rounded-tile px-[19px] py-5 text-left",
                    ativa ? "bg-black text-white" : "bg-white text-ink hover:bg-white/70",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-lg font-bold">
                      {o.id} · {o.produto}
                    </span>
                    <span className={cn("shrink-0 text-lg font-bold", ativa && "text-amber")}>
                      {brl(o.valor)}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className={cn("text-[11px]", ativa ? "text-white/80" : "text-ink/80")}>
                      {o.fornecedor}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        ativa ? "bg-amber text-black" : "bg-muted text-ink",
                      )}
                    >
                      {o.origem}
                    </span>
                  </span>
                </button>
              );
            })}
          </aside>

          <article className="flex min-w-0 flex-[1.7_1_544px] flex-col gap-7 rounded-card bg-white p-6 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[29px] leading-[1.1] font-bold tracking-[-0.03em]">
                  {oc.id} · {oc.produto}
                </h2>
                <p className="mt-2 text-sm text-ink/80">
                  {produtoOc && statusDoEstoque(produtoOc) === "ruptura"
                    ? "Risco de ruptura · "
                    : produtoOc && statusDoEstoque(produtoOc) === "alerta"
                      ? "Alerta de reposição · "
                      : ""}
                  criada em {new Date(oc.criadaEm).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-[15px] py-[6px] text-sm font-bold",
                  statusInfo[oc.status].cls,
                )}
              >
                {statusInfo[oc.status].label}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex-[1_1_102px] rounded-3xl bg-muted px-5 py-[15px]">
                <div className="text-[11px] text-ink/80">Quantidade</div>
                <div className="mt-2 text-[26px] leading-tight font-bold tracking-[-0.03em]">
                  {oc.quantidade} un
                </div>
              </div>
              <div className="flex-[2_1_162px] rounded-3xl bg-muted px-5 py-[15px]">
                <div className="text-[11px] text-ink/80">Fornecedor</div>
                <div className="mt-2 text-2xl leading-tight font-bold tracking-[-0.02em]">
                  {oc.fornecedor}
                </div>
              </div>
              <div className="flex-[2_1_170px] rounded-3xl bg-amber px-5 py-[15px] text-black">
                <div className="text-[11px]">Valor</div>
                <div className="mt-2 text-[26px] leading-tight font-bold tracking-[-0.03em]">
                  {brl(oc.valor)}
                </div>
              </div>
              <div className="flex-[1_1_102px] rounded-3xl bg-ink px-5 py-[15px] text-white">
                <div className="text-[11px] text-white/80">Previsão</div>
                <div className="mt-2 text-[26px] leading-tight font-bold tracking-[-0.03em]">
                  {oc.previsaoDias} dias
                </div>
              </div>
            </div>

            {oc.status === "rejeitada" && oc.motivoRejeicao && (
              <p className="rounded-3xl bg-muted px-5 py-3 text-sm font-medium">
                Motivo: {oc.motivoRejeicao}
              </p>
            )}

            {produtoOc && (
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-bold">O que acontece até a chegada</h3>
                <LinhaDoTempo oc={oc} produto={produtoOc} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {oc.status === "pendente" && (
                <>
                  <Button size="lg" onClick={() => aprovar(oc)}>
                    Aprovar
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setRejeitando(oc)}>
                    Rejeitar
                  </Button>
                </>
              )}
              {oc.status === "aprovada" && (
                <Button size="lg" onClick={() => receber(oc)}>
                  Registrar recebimento
                </Button>
              )}
              {oc.status === "rejeitada" && (
                <Button size="lg" variant="outline" onClick={() => reabrir(oc)}>
                  Reabrir
                </Button>
              )}
              <Link
                to="/estoque"
                search={{ q: oc.produto }}
                className="ml-auto px-1.5 py-3 text-sm font-bold underline hover:no-underline"
              >
                Ver no estoque
              </Link>
            </div>
          </article>
        </section>
      )}

      <RejeitarDialog ordem={rejeitando} onClose={() => setRejeitando(null)} />
      <NovaOrdemDialog aberto={novaAberta} onClose={() => setNovaAberta(false)} />
    </div>
  );
}

const dataCurta = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

/** Linha do tempo: hoje → ruptura prevista → chegada da ordem. */
function LinhaDoTempo({ oc, produto }: { oc: OrdemCompra; produto: Produto }) {
  const disp = disponivel(produto);
  const cob = cobertura(produto);
  const chegada = oc.previsaoDias;
  const ruptura = Number.isFinite(cob) ? Math.round(cob) : Infinity;
  const temLacuna = ruptura < chegada;
  // Ruptura hoje (ou quase): os marcos "Hoje" e "Ruptura prevista" se fundem para não se sobrepor.
  const rupturaHoje = temLacuna && ruptura <= 1;
  const dias = temLacuna ? chegada - ruptura : 0;
  const px = 638 / Math.max(chegada, 1);
  const xRup = 20 + ruptura * px;
  const xFim = 20 + chegada * px;
  const dataChegada = new Date(oc.criadaEm + chegada * 86_400_000).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const idHach = `hach-${oc.id}`;

  const texto = temLacuna
    ? `Hoje há ${disp} un disponíveis, o suficiente para cerca de ${ruptura} ${ruptura === 1 ? "dia" : "dias"}. O lead time de ${chegada} dias não cobre a demanda. Com as ${oc.quantidade} un da ordem o estoque vai a ${disp + oc.quantidade} un.`
    : `O estoque atual cobre o período até a chegada da ordem. Com as ${oc.quantidade} un da ordem o estoque vai a ${disp + oc.quantidade} un.`;
  const resumo = temLacuna
    ? `Linha do tempo: hoje, ruptura prevista no dia ${ruptura} e chegada da ordem no dia ${chegada}, com ${dias} dias sem estoque`
    : `Linha do tempo: hoje e chegada da ordem no dia ${chegada}, sem ruptura prevista`;

  return (
    <>
      <svg viewBox="0 0 700 128" role="img" aria-label={resumo} className="block h-auto w-full">
        <defs>
          <pattern
            id={idHach}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="10" stroke="#000000" strokeWidth="3" strokeOpacity="0.55" />
          </pattern>
        </defs>
        <rect x="20" y="40" width="660" height="22" rx="11" fill="#E5E5E5" />
        {temLacuna ? (
          <>
            {!rupturaHoje && (
              <rect x="20" y="40" width={xRup - 20 + 11} height="22" rx="11" fill="#14213D" />
            )}
            <rect x={xRup} y="40" width={xFim - xRup} height="22" fill="#FCA311" />
            <rect x={xRup} y="40" width={xFim - xRup} height="22" fill={`url(#${idHach})`} />
          </>
        ) : (
          <rect x="20" y="40" width={xFim - 20 + 11} height="22" rx="11" fill="#14213D" />
        )}
        {/* marcadores */}
        {!rupturaHoje && (
          <circle cx="20" cy="51" r="11" fill="#FFFFFF" stroke="#14213D" strokeWidth="4" />
        )}
        {temLacuna && (
          <circle
            cx={xRup}
            cy="51"
            r="11"
            fill="#000000"
            stroke={rupturaHoje ? "#FFFFFF" : "none"}
            strokeWidth="3"
          />
        )}
        <circle cx={xFim} cy="51" r="11" fill="#FFFFFF" stroke="#14213D" strokeWidth="4" />

        <g fontFamily="Bricolage Grotesque, sans-serif" fontSize="13" fill="#14213D">
          {/* linha de cima: nomes dos marcos */}
          {rupturaHoje ? (
            <text x="20" y="26" fontWeight="700">
              Hoje · ruptura prevista
            </text>
          ) : (
            <>
              <text x="20" y="26" fontWeight="700">
                Hoje
              </text>
              {temLacuna && (
                <text
                  x={Math.max(xRup, 20 + 118)}
                  y="26"
                  fontWeight="700"
                  textAnchor={xRup < 20 + 118 ? "start" : "middle"}
                >
                  Ruptura prevista
                </text>
              )}
            </>
          )}
          <text x={xFim} y="26" fontWeight="700" textAnchor="end">
            Chegada
          </text>

          {/* meio: dias sem estoque */}
          {temLacuna && (
            <text x={(xRup + xFim) / 2} y="86" textAnchor="middle" fontWeight="700">
              {dias} {dias === 1 ? "dia sem estoque" : "dias sem estoque"}
            </text>
          )}

          {/* linha de baixo: datas */}
          <text x="20" y="116">
            {rupturaHoje ? `${dataCurta(oc.criadaEm)} · dia 0` : dataCurta(oc.criadaEm)}
          </text>
          {temLacuna && !rupturaHoje && (
            <text
              x={Math.max(xRup, 20 + 118)}
              y="116"
              textAnchor={xRup < 20 + 118 ? "start" : "middle"}
            >
              dia {ruptura}
            </text>
          )}
          <text x={xFim} y="116" textAnchor="end">
            dia {chegada} · {dataChegada}
          </text>
        </g>
      </svg>
      <p className="max-w-[70ch] text-sm leading-[1.55] text-ink/80">{texto}</p>
    </>
  );
}

const motivosRapidos = ["Preço acima do orçamento", "Quantidade excessiva", "Trocar fornecedor"];

function RejeitarDialog({ ordem, onClose }: { ordem: OrdemCompra | null; onClose: () => void }) {
  const { dispatch } = useERP();
  const [motivo, setMotivo] = useState("");

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!ordem || !motivo.trim()) return;
    dispatch({ type: "rejeitarOrdem", id: ordem.id, motivo: motivo.trim(), agora: Date.now() });
    toast.error(`${ordem.id} rejeitada`, { description: "Ordem devolvida para revisão." });
    setMotivo("");
    onClose();
  };

  return (
    <Dialog open={!!ordem} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={enviar}>
          <DialogHeader>
            <DialogTitle>Rejeitar {ordem?.id}</DialogTitle>
            <DialogDescription>
              {ordem?.produto} · {ordem && brl(ordem.valor)}. Informe o motivo para o comprador.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: negociar novo preço com o fornecedor"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {motivosRapidos.map((m) => (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMotivo(m)}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!motivo.trim()}>
              Rejeitar ordem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NovaOrdemDialog({ aberto, onClose }: { aberto: boolean; onClose: () => void }) {
  const { state, dispatch } = useERP();
  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState("");
  const [fornecedor, setFornecedor] = useState("");

  const produto = state.produtos.find((p) => p.id === produtoId);
  const n = Math.round(Number(qtd));
  const valido = !!produto && n > 0;

  const escolherProduto = (id: string) => {
    setProdutoId(id);
    const p = state.produtos.find((x) => x.id === id);
    if (p) {
      setQtd(String(quantidadeSugerida(p)));
      setFornecedor(p.fornecedor);
    }
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!valido || !produto) return;
    dispatch({
      type: "criarOrdem",
      agora: Date.now(),
      ordem: { produtoId, quantidade: n, fornecedor, origem: "Ordem manual" },
    });
    toast.success("Ordem de compra criada", {
      description: `${produto.nome} · ${n} un · ${brl(n * produto.custoUnitario)}.`,
    });
    setProdutoId("");
    setQtd("");
    setFornecedor("");
    onClose();
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={enviar}>
          <DialogHeader>
            <DialogTitle>Nova ordem de compra</DialogTitle>
            <DialogDescription>A ordem entra como pendente de aprovação.</DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Produto</Label>
              <Select value={produtoId} onValueChange={escolherProduto}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {state.produtos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} · {disponivel(p)} un disp.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="oc-qtd">Quantidade (un)</Label>
                <Input
                  id="oc-qtd"
                  inputMode="numeric"
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="oc-forn">Fornecedor</Label>
                <Input
                  id="oc-forn"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                />
              </div>
            </div>
            {produto && n > 0 && (
              <p className="rounded-md bg-secondary px-3 py-2 text-sm">
                Valor estimado: <strong>{brl(n * produto.custoUnitario)}</strong> · entrega em{" "}
                {produto.leadTime} dias
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido}>
              Criar ordem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
