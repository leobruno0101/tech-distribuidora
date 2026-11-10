import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Calculator, Loader2, Plug, RefreshCw, Unplug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import { automacoesInfo, type Integracao, type Politica } from "@/lib/erp-data";
import { useERP } from "@/lib/erp-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | TechDistribuidora ERP" },
      {
        name: "description",
        content: "Política de estoque, automações e integrações da TechDistribuidora.",
      },
      { property: "og:title", content: "Configurações | TechDistribuidora ERP" },
      {
        property: "og:description",
        content: "Política de estoque, automações e integrações da TechDistribuidora.",
      },
    ],
  }),
  component: Configuracoes,
});

type CamposPolitica = Record<keyof Politica, string>;

const camposPolitica: { key: keyof Politica; label: string }[] = [
  { key: "consumoMedio", label: "Consumo médio (un/dia)" },
  { key: "leadTime", label: "Lead time (dias)" },
  { key: "estoqueSeguranca", label: "Estoque de segurança (un)" },
  { key: "pontoPedido", label: "Ponto de pedido (un)" },
];

const operadores = ["×", "+", "="] as const;

const paraCampos = (p: Politica): CamposPolitica => ({
  consumoMedio: String(p.consumoMedio),
  leadTime: String(p.leadTime),
  estoqueSeguranca: String(p.estoqueSeguranca),
  pontoPedido: String(p.pontoPedido),
});

function Configuracoes() {
  const { state, dispatch } = useERP();
  const [campos, setCampos] = useState<CamposPolitica>(() => paraCampos(state.politica));
  const [aplicarATodos, setAplicarATodos] = useState(false);
  const [conectando, setConectando] = useState<Integracao | null>(null);
  const [sincronizando, setSincronizando] = useState<string | null>(null);

  // Mantém o formulário em dia quando a política muda fora daqui (ex.: restaurar dados).
  useEffect(() => setCampos(paraCampos(state.politica)), [state.politica]);

  const num = (v: string) => Number(v.replace(",", "."));
  const erros = Object.fromEntries(
    camposPolitica.map(({ key }) => {
      const v = num(campos[key]);
      const ok =
        campos[key].trim() !== "" && Number.isFinite(v) && v >= 0 && (key !== "leadTime" || v >= 1);
      return [key, ok ? null : key === "leadTime" ? "Mínimo 1 dia" : "Informe um número ≥ 0"];
    }),
  ) as Record<keyof Politica, string | null>;
  const valido = Object.values(erros).every((e) => e === null);
  const alterado = camposPolitica.some(({ key }) => num(campos[key]) !== state.politica[key]);

  const pontoCalculado =
    Math.round(num(campos.consumoMedio) * num(campos.leadTime) + num(campos.estoqueSeguranca)) || 0;

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    const politica: Politica = {
      consumoMedio: num(campos.consumoMedio),
      leadTime: Math.round(num(campos.leadTime)),
      estoqueSeguranca: Math.round(num(campos.estoqueSeguranca)),
      pontoPedido: Math.round(num(campos.pontoPedido)),
    };
    dispatch({ type: "salvarPolitica", politica, aplicarATodos });
    toast.success("Política de estoque salva", {
      description: aplicarATodos
        ? `Aplicada a todos os ${state.produtos.length} produtos.`
        : "Será usada nos próximos produtos cadastrados.",
    });
    setAplicarATodos(false);
  };

  const sincronizar = (i: Integracao) => {
    setSincronizando(i.id);
    setTimeout(() => {
      dispatch({ type: "sincronizar", agora: Date.now(), integracaoId: i.id });
      setSincronizando(null);
      toast.success(`${i.nome} sincronizada`);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[34px] leading-none font-bold tracking-[-0.04em] sm:text-[54px]">
          Configurações
        </h1>
        <p className="mt-3 text-[13px] text-ink/80">
          Parâmetros da política de estoque e automações do sistema.
        </p>
      </div>

      <section className="rounded-card bg-black p-6 text-white sm:p-10">
        <form onSubmit={salvar} className="flex flex-col gap-7">
          <div>
            <h2 className="text-[24px] font-bold tracking-[-0.02em]">Política de estoque padrão</h2>
            <p className="mt-2 text-sm text-white/80">Aplicada a novos produtos cadastrados.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-x-4 sm:gap-y-3.5">
            {camposPolitica.map(({ key, label }, idx) => {
              const destaque = key === "pontoPedido";
              return (
                <Fragment key={key}>
                  {idx > 0 && (
                    <span
                      aria-hidden="true"
                      className="hidden pb-3.5 sm:block text-[29px] leading-none font-medium text-amber"
                    >
                      {operadores[idx - 1]}
                    </span>
                  )}
                  <div className="flex min-w-0 flex-col gap-2">
                    <Label
                      htmlFor={key}
                      className={
                        destaque ? "text-[11px] font-bold text-amber" : "text-[11px] text-white/85"
                      }
                    >
                      {label}
                    </Label>
                    <input
                      id={key}
                      inputMode="decimal"
                      value={campos[key]}
                      aria-invalid={!!erros[key]}
                      onChange={(e) => setCampos({ ...campos, [key]: e.target.value })}
                      className={cn(
                        "w-full rounded-3xl border-2 px-4 py-3.5 text-[24px] sm:px-[19px] sm:py-[15px] sm:text-[29px] leading-tight font-bold tracking-[-0.03em]",
                        destaque
                          ? "border-amber bg-amber text-black"
                          : "border-ink bg-ink text-white",
                        key === "consumoMedio" || key === "leadTime"
                          ? "sm:w-[145px]"
                          : "sm:w-[162px]",
                      )}
                    />
                    {erros[key] && <p className="text-xs text-amber">{erros[key]}</p>}
                    {key === "pontoPedido" &&
                      valido &&
                      pontoCalculado !== num(campos.pontoPedido) && (
                        <button
                          type="button"
                          onClick={() =>
                            setCampos({ ...campos, pontoPedido: String(pontoCalculado) })
                          }
                          className="inline-flex sm:max-w-[162px] items-start gap-1 text-left text-xs text-white underline hover:no-underline"
                        >
                          <Calculator className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          Usar fórmula: consumo × lead time + segurança = {pontoCalculado} un
                        </button>
                      )}
                  </div>
                </Fragment>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-5">
            <label className="flex cursor-pointer items-center gap-3 text-[13px]">
              <Checkbox
                checked={aplicarATodos}
                onCheckedChange={(v) => setAplicarATodos(v === true)}
              />
              Aplicar também aos {state.produtos.length} produtos já cadastrados
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg" disabled={!valido || (!alterado && !aplicarATodos)}>
                Salvar alterações
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline-on-dark"
                disabled={!alterado}
                onClick={() => setCampos(paraCampos(state.politica))}
              >
                Descartar
              </Button>
            </div>
          </div>
        </form>
      </section>

      <section className="flex flex-wrap items-start gap-5">
        <article className="flex min-w-0 flex-[1.4_1_476px] flex-col gap-5 rounded-card bg-white p-6 sm:p-9">
          <div>
            <h2 className="text-[24px] font-bold tracking-[-0.02em]">Automações</h2>
            <p className="mt-2 text-sm text-ink/80">Reduza processos manuais da operação.</p>
          </div>
          <div className="flex flex-wrap gap-3.5">
            {automacoesInfo.map((a) => (
              <div
                key={a.key}
                className="flex min-w-0 flex-[1_1_213px] flex-col gap-4 rounded-tile bg-muted p-[19px]"
              >
                <Switch
                  id={`auto-${a.key}`}
                  aria-label={a.texto}
                  className="self-start"
                  checked={state.automacoes[a.key]}
                  onCheckedChange={(valor) => {
                    dispatch({ type: "toggleAutomacao", key: a.key, valor, agora: Date.now() });
                    toast.success(valor ? "Automação ativada" : "Automação desativada", {
                      description:
                        a.key === "iaAjuste" && valor
                          ? "Sugestões pendentes da IA foram aplicadas."
                          : a.texto,
                    });
                  }}
                />
                <label htmlFor={`auto-${a.key}`} className="cursor-pointer">
                  <span className="block text-[14px] leading-tight font-bold tracking-[-0.01em]">
                    {a.texto}
                  </span>
                  <span className="mt-1.5 block text-[11px] leading-normal text-ink/80">
                    {a.detalhe}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </article>

        <article className="flex min-w-0 flex-[1_1_340px] flex-col gap-2 rounded-card bg-ink p-6 text-white sm:p-9">
          <div className="mb-3">
            <h2 className="text-[24px] font-bold tracking-[-0.02em]">Integrações</h2>
            <p className="mt-2 text-sm text-white/80">Fontes de dados em tempo real.</p>
          </div>
          {state.integracoes.map((i) => {
            const conectada = i.status === "conectada";
            return (
              <div
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 py-[15px]"
              >
                <div className="min-w-0 flex-[1_1_170px]">
                  <p className="text-[14px] font-bold tracking-[-0.01em]">{i.nome}</p>
                  <p className="mt-1 text-[11px] text-white/80">
                    {conectada
                      ? `sync a cada ${i.intervalo}${
                          i.ultimaSync
                            ? ` · última às ${new Date(i.ultimaSync).toLocaleTimeString("pt-BR")}`
                            : ""
                        }`
                      : "aguardando credenciais"}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={
                      conectada
                        ? "rounded-full bg-amber px-3.5 py-1.5 text-xs font-bold text-black"
                        : "rounded-full border-2 border-white px-3.5 py-1 text-xs font-bold"
                    }
                  >
                    {conectada ? "Conectada" : "Pendente"}
                  </span>
                  {conectada ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline-on-dark"
                        disabled={sincronizando === i.id}
                        onClick={() => sincronizar(i)}
                      >
                        <RefreshCw
                          className={sincronizando === i.id ? "animate-spin" : ""}
                          aria-hidden="true"
                        />
                        Sincronizar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/15"
                        aria-label={`Desconectar ${i.nome}`}
                        title="Desconectar"
                        onClick={() => {
                          dispatch({ type: "desconectarIntegracao", id: i.id });
                          toast.info(`${i.nome} desconectada`);
                        }}
                      >
                        <Unplug aria-hidden="true" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setConectando(i)}>
                      <Plug aria-hidden="true" />
                      Conectar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </article>
      </section>

      <ConectarDialog integracao={conectando} onClose={() => setConectando(null)} />
    </div>
  );
}

function ConectarDialog({
  integracao,
  onClose,
}: {
  integracao: Integracao | null;
  onClose: () => void;
}) {
  const { dispatch } = useERP();
  const [endpoint, setEndpoint] = useState("https://api.fiscal.techdistribuidora.com.br");
  const [chave, setChave] = useState("");
  const [validando, setValidando] = useState(false);
  const valido = /^https?:\/\/.+/.test(endpoint) && chave.trim().length >= 8;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!integracao || !valido) return;
    setValidando(true);
    setTimeout(() => {
      dispatch({ type: "conectarIntegracao", id: integracao.id, agora: Date.now() });
      setValidando(false);
      setChave("");
      toast.success(`${integracao.nome} conectada`, {
        description: "Credenciais validadas e primeira sincronização concluída.",
      });
      onClose();
    }, 1200);
  };

  return (
    <Dialog open={!!integracao} onOpenChange={(o) => !o && !validando && onClose()}>
      <DialogContent>
        <form onSubmit={enviar}>
          <DialogHeader>
            <DialogTitle>Conectar {integracao?.nome}</DialogTitle>
            <DialogDescription>
              Informe as credenciais fornecidas pelo provedor da integração.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="int-endpoint">Endpoint da API</Label>
              <Input
                id="int-endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="int-chave">Chave de acesso</Label>
              <Input
                id="int-chave"
                type="password"
                value={chave}
                onChange={(e) => setChave(e.target.value)}
                placeholder="mínimo 8 caracteres"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={validando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido || validando}>
              {validando && <Loader2 className="animate-spin" />}
              {validando ? "Validando..." : "Conectar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
