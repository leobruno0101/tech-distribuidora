import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Calculator, Loader2, Plug, RefreshCw, Unplug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Parâmetros da política de estoque e automações do sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Política de estoque padrão</CardTitle>
          <CardDescription>Aplicada a novos produtos cadastrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
            {camposPolitica.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  inputMode="decimal"
                  value={campos[key]}
                  aria-invalid={!!erros[key]}
                  onChange={(e) => setCampos({ ...campos, [key]: e.target.value })}
                />
                {erros[key] && <p className="text-xs text-danger">{erros[key]}</p>}
                {key === "pontoPedido" && valido && pontoCalculado !== num(campos.pontoPedido) && (
                  <button
                    type="button"
                    onClick={() => setCampos({ ...campos, pontoPedido: String(pontoCalculado) })}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    Usar fórmula: consumo × lead time + segurança = {pontoCalculado} un
                  </button>
                )}
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox
                checked={aplicarATodos}
                onCheckedChange={(v) => setAplicarATodos(v === true)}
              />
              Aplicar também aos {state.produtos.length} produtos já cadastrados
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit" disabled={!valido || (!alterado && !aplicarATodos)}>
                Salvar alterações
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!alterado}
                onClick={() => setCampos(paraCampos(state.politica))}
              >
                Descartar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automações</CardTitle>
          <CardDescription>Reduza processos manuais da operação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {automacoesInfo.map((a) => (
            <div key={a.key} className="flex items-center justify-between gap-4">
              <label htmlFor={`auto-${a.key}`} className="cursor-pointer">
                <span className="text-sm">{a.texto}</span>
                <span className="block text-xs text-muted-foreground">{a.detalhe}</span>
              </label>
              <Switch
                id={`auto-${a.key}`}
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
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
          <CardDescription>Fontes de dados em tempo real.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.integracoes.map((i) => {
            const conectada = i.status === "conectada";
            return (
              <div
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{i.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {conectada
                      ? `sync a cada ${i.intervalo}${
                          i.ultimaSync
                            ? ` · última às ${new Date(i.ultimaSync).toLocaleTimeString("pt-BR")}`
                            : ""
                        }`
                      : "aguardando credenciais"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      conectada
                        ? "rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-xs font-medium text-success"
                        : "rounded-full border border-warning/40 bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning-foreground"
                    }
                  >
                    {conectada ? "Conectada" : "Pendente"}
                  </span>
                  {conectada ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={sincronizando === i.id}
                        onClick={() => sincronizar(i)}
                      >
                        <RefreshCw className={sincronizando === i.id ? "animate-spin" : ""} />
                        Sincronizar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Desconectar ${i.nome}`}
                        title="Desconectar"
                        onClick={() => {
                          dispatch({ type: "desconectarIntegracao", id: i.id });
                          toast.info(`${i.nome} desconectada`);
                        }}
                      >
                        <Unplug />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setConectando(i)}>
                      <Plug />
                      Conectar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

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
