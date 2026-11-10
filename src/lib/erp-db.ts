import { supabase } from "@/integrations/supabase/client";
import type { Notificacao, OrdemCompra, Produto } from "./erp-data";
import type { ERPState } from "./erp-store";

type ConfigDados = Partial<
  Pick<
    ERPState,
    | "politica"
    | "automacoes"
    | "integracoes"
    | "sugestoesAplicadas"
    | "pedidosHoje"
    | "ultimaSync"
    | "seqOrdem"
    | "seqProduto"
    | "seqNotificacao"
  >
>;

const produtoToRow = (p: Produto, ordem: number) => ({
  id: p.id,
  nome: p.nome,
  sku: p.sku,
  estoque: p.estoque,
  reservado: p.reservado,
  consumo_medio: p.consumoMedio,
  lead_time: p.leadTime,
  estoque_seguranca: p.estoqueSeguranca,
  ponto_pedido: p.pontoPedido,
  custo_unitario: p.custoUnitario,
  fornecedor: p.fornecedor,
  ordem,
});

const ordemToRow = (o: OrdemCompra) => ({
  id: o.id,
  produto_id: o.produtoId,
  produto: o.produto,
  quantidade: o.quantidade,
  fornecedor: o.fornecedor,
  valor: o.valor,
  previsao_dias: o.previsaoDias,
  origem: o.origem,
  status: o.status,
  motivo_rejeicao: o.motivoRejeicao ?? null,
  criada_em: o.criadaEm,
  atualizada_em: o.atualizadaEm,
});

const notifToRow = (n: Notificacao) => ({
  id: n.id,
  titulo: n.titulo,
  descricao: n.descricao,
  tipo: n.tipo,
  link: n.link,
  lida: n.lida,
  data: n.data,
  automatica: !!n.automatica,
});

function configDe(s: ERPState): ConfigDados {
  return {
    politica: s.politica,
    automacoes: s.automacoes,
    integracoes: s.integracoes,
    sugestoesAplicadas: s.sugestoesAplicadas,
    pedidosHoje: s.pedidosHoje,
    ultimaSync: s.ultimaSync,
    seqOrdem: s.seqOrdem,
    seqProduto: s.seqProduto,
    seqNotificacao: s.seqNotificacao,
  };
}

/** Carrega o estado completo do ERP a partir do banco de dados. */
export async function carregarDoBanco(base: ERPState): Promise<ERPState> {
  const [prod, ord, notif, cfg] = await Promise.all([
    supabase.from("produtos").select("*").order("ordem"),
    supabase.from("ordens_compra").select("*").order("criada_em", { ascending: false }),
    supabase.from("notificacoes").select("*").order("data", { ascending: false }).limit(40),
    supabase.from("configuracoes_erp").select("dados").eq("id", 1).maybeSingle(),
  ]);
  const erro = prod.error ?? ord.error ?? notif.error ?? cfg.error;
  if (erro) throw erro;

  const dados = (cfg.data?.dados ?? {}) as ConfigDados;
  return {
    ...base,
    ...dados,
    produtos: (prod.data ?? []).map((r) => ({
      id: r.id,
      nome: r.nome,
      sku: r.sku,
      estoque: r.estoque,
      reservado: r.reservado,
      consumoMedio: Number(r.consumo_medio),
      leadTime: r.lead_time,
      estoqueSeguranca: r.estoque_seguranca,
      pontoPedido: r.ponto_pedido,
      custoUnitario: Number(r.custo_unitario),
      fornecedor: r.fornecedor,
    })),
    ordens: (ord.data ?? []).map((r) => ({
      id: r.id,
      produtoId: r.produto_id,
      produto: r.produto,
      quantidade: r.quantidade,
      fornecedor: r.fornecedor,
      valor: Number(r.valor),
      previsaoDias: r.previsao_dias,
      origem: r.origem,
      status: r.status as OrdemCompra["status"],
      motivoRejeicao: r.motivo_rejeicao ?? undefined,
      criadaEm: Number(r.criada_em),
      atualizadaEm: Number(r.atualizada_em),
    })),
    notificacoes: (notif.data ?? []).map((r) => ({
      id: r.id,
      titulo: r.titulo,
      descricao: r.descricao,
      tipo: r.tipo as Notificacao["tipo"],
      link: r.link as Notificacao["link"],
      lida: r.lida,
      data: Number(r.data),
      automatica: r.automatica,
    })),
  };
}

function diff<T extends { id: string }>(antes: T[], depois: T[]) {
  const mapa = new Map(antes.map((x) => [x.id, x]));
  const alterados = depois.filter((x) => mapa.get(x.id) !== x);
  const ids = new Set(depois.map((x) => x.id));
  const removidos = antes.filter((x) => !ids.has(x.id)).map((x) => x.id);
  return { alterados, removidos };
}

/** Grava no banco apenas o que mudou entre dois estados. */
export async function salvarNoBanco(antes: ERPState, depois: ERPState) {
  const ops: PromiseLike<{ error: unknown }>[] = [];

  const p = diff(antes.produtos, depois.produtos);
  if (p.alterados.length)
    ops.push(
      supabase
        .from("produtos")
        .upsert(p.alterados.map((x) => produtoToRow(x, depois.produtos.indexOf(x) + 1))),
    );
  if (p.removidos.length) ops.push(supabase.from("produtos").delete().in("id", p.removidos));

  const o = diff(antes.ordens, depois.ordens);
  if (o.alterados.length) ops.push(supabase.from("ordens_compra").upsert(o.alterados.map(ordemToRow)));
  if (o.removidos.length) ops.push(supabase.from("ordens_compra").delete().in("id", o.removidos));

  const n = diff(antes.notificacoes, depois.notificacoes);
  if (n.alterados.length) ops.push(supabase.from("notificacoes").upsert(n.alterados.map(notifToRow)));
  if (n.removidos.length) ops.push(supabase.from("notificacoes").delete().in("id", n.removidos));

  const cfgAntes = JSON.stringify(configDe(antes));
  const cfgDepois = configDe(depois);
  if (JSON.stringify(cfgDepois) !== cfgAntes)
    ops.push(
      supabase
        .from("configuracoes_erp")
        .upsert({ id: 1, dados: JSON.parse(JSON.stringify(cfgDepois)), updated_at: new Date().toISOString() }),
    );

  const res = await Promise.all(ops);
  const erro = res.find((r) => r.error)?.error;
  if (erro) throw erro;
}
