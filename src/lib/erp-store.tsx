import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  automacoesIniciais,
  disponivel,
  integracoesIniciais,
  notificacoesIniciais,
  ordensIniciais,
  politicaInicial,
  produtosIniciais,
  quantidadeSugerida,
  statusDoEstoque,
  sugestoes,
  type AutomacaoKey,
  type Integracao,
  type Notificacao,
  type OrdemCompra,
  type Politica,
  type Produto,
  type Sugestao,
} from "./erp-data";
import { carregarDoBanco, salvarNoBanco } from "./erp-db";

export type ERPState = {
  produtos: Produto[];
  ordens: OrdemCompra[];
  politica: Politica;
  automacoes: Record<AutomacaoKey, boolean>;
  integracoes: Integracao[];
  notificacoes: Notificacao[];
  sugestoesAplicadas: string[];
  pedidosHoje: number;
  ultimaSync: number | null;
  seqOrdem: number;
  seqProduto: number;
  seqNotificacao: number;
};


function estadoInicial(): ERPState {
  return {
    produtos: produtosIniciais,
    ordens: ordensIniciais,
    politica: politicaInicial,
    automacoes: automacoesIniciais,
    integracoes: integracoesIniciais,
    notificacoes: notificacoesIniciais,
    sugestoesAplicadas: [],
    pedidosHoje: 182,
    ultimaSync: null,
    seqOrdem: 2045,
    seqProduto: 7,
    seqNotificacao: 4,
  };
}

export type NovaOrdem = {
  produtoId: string;
  quantidade: number;
  origem: string;
  fornecedor?: string;
};

type Action =
  | { type: "hidratar"; state: ERPState }
  | { type: "reset" }
  | {
      type: "tick";
      agora: number;
      deltas: number[];
      novosPedidos: number;
      reservaAlvo: number;
      expedicoes: boolean[];
    }
  | { type: "reservar"; produtoId: string; quantidade: number }
  | { type: "liberarReserva"; produtoId: string }
  | { type: "ajustarEstoque"; produtoId: string; quantidade: number }
  | { type: "atualizarProduto"; produtoId: string; dados: Partial<Produto> }
  | { type: "adicionarProduto"; produto: Omit<Produto, "id" | "reservado"> }
  | { type: "removerProduto"; produtoId: string }
  | { type: "criarOrdem"; ordem: NovaOrdem; agora: number }
  | { type: "aprovarOrdem"; id: string; agora: number }
  | { type: "rejeitarOrdem"; id: string; motivo: string; agora: number }
  | { type: "receberOrdem"; id: string; agora: number }
  | { type: "reabrirOrdem"; id: string; agora: number }
  | { type: "salvarPolitica"; politica: Politica; aplicarATodos: boolean }
  | { type: "toggleAutomacao"; key: AutomacaoKey; valor: boolean; agora: number }
  | { type: "sincronizar"; agora: number; integracaoId?: string }
  | { type: "conectarIntegracao"; id: string; agora: number }
  | { type: "desconectarIntegracao"; id: string }
  | { type: "aplicarSugestao"; sugestaoId: string; agora: number }
  | { type: "marcarLida"; id: string }
  | { type: "marcarTodasLidas" }
  | { type: "limparNotificacoes" };

function notificar(s: ERPState, n: Omit<Notificacao, "id" | "lida">): ERPState {
  return {
    ...s,
    seqNotificacao: s.seqNotificacao + 1,
    notificacoes: [{ ...n, id: `n${s.seqNotificacao}`, lida: false }, ...s.notificacoes].slice(
      0,
      40,
    ),
  };
}

function ordemAberta(s: ERPState, produtoId: string) {
  return s.ordens.some(
    (o) => o.produtoId === produtoId && (o.status === "pendente" || o.status === "aprovada"),
  );
}

function criarOrdem(s: ERPState, nova: NovaOrdem, agora: number): ERPState {
  const p = s.produtos.find((x) => x.id === nova.produtoId);
  if (!p) return s;
  const ordem: OrdemCompra = {
    id: `OC-${s.seqOrdem}`,
    produtoId: p.id,
    produto: p.nome,
    quantidade: nova.quantidade,
    fornecedor: nova.fornecedor || p.fornecedor,
    valor: Math.round(nova.quantidade * p.custoUnitario * 100) / 100,
    previsaoDias: p.leadTime,
    origem: nova.origem,
    status: "pendente",
    criadaEm: agora,
    atualizadaEm: agora,
  };
  return { ...s, seqOrdem: s.seqOrdem + 1, ordens: [ordem, ...s.ordens] };
}

function aplicarSugestao(s: ERPState, sug: Sugestao, agora: number): ERPState {
  if (s.sugestoesAplicadas.includes(sug.id)) return s;
  let next: ERPState = {
    ...s,
    sugestoesAplicadas: [...s.sugestoesAplicadas, sug.id],
    produtos: s.produtos.map((p) => (p.id === sug.produtoId ? { ...p, ...sug.ajuste } : p)),
  };
  if (!ordemAberta(next, sug.produtoId)) {
    next = criarOrdem(
      next,
      { produtoId: sug.produtoId, quantidade: sug.quantidade, origem: "Previsão de demanda (IA)" },
      agora,
    );
  }
  return next;
}

function mapProduto(s: ERPState, id: string, fn: (p: Produto) => Produto): ERPState {
  return { ...s, produtos: s.produtos.map((p) => (p.id === id ? fn(p) : p)) };
}

function mapOrdem(s: ERPState, id: string, fn: (o: OrdemCompra) => OrdemCompra): ERPState {
  return { ...s, ordens: s.ordens.map((o) => (o.id === id ? fn(o) : o)) };
}

function reducer(s: ERPState, a: Action): ERPState {
  switch (a.type) {
    case "hidratar":
      return a.state;
    case "reset":
      return estadoInicial();

    case "tick": {
      let next: ERPState = {
        ...s,
        pedidosHoje: s.pedidosHoje + a.novosPedidos,
        ultimaSync: a.agora,
        integracoes: s.integracoes.map((i) =>
          i.status === "conectada" && i.id === "vendas" ? { ...i, ultimaSync: a.agora } : i,
        ),
      };

      next.produtos = s.produtos.map((p, idx) => {
        let estoque = Math.max(0, p.estoque + (a.deltas[idx] ?? 0));
        let reservado = Math.min(p.reservado, estoque);
        if (s.automacoes.autoReserva) {
          if (idx === a.reservaAlvo && estoque - reservado > 0 && a.novosPedidos > 0)
            reservado += 1;
          if (a.expedicoes[idx] && reservado > 0) {
            reservado -= 1;
            estoque -= 1;
          }
        }
        return { ...p, estoque, reservado };
      });

      next.produtos.forEach((p, idx) => {
        const antes = statusDoEstoque(s.produtos[idx] ?? p);
        const depois = statusDoEstoque(p);
        if (depois === "ruptura" && antes !== "ruptura" && next.automacoes.alertasEmail) {
          next = notificar(next, {
            titulo: `${p.nome} em risco de ruptura`,
            descricao: `Disponível: ${disponivel(p)} un. Alerta enviado por e-mail aos compradores.`,
            tipo: "critico",
            link: "/estoque",
            data: a.agora,
            automatica: true,
          });
        }
        if (next.automacoes.autoOC && disponivel(p) <= p.pontoPedido && !ordemAberta(next, p.id)) {
          const qtd = quantidadeSugerida(p);
          next = criarOrdem(
            next,
            { produtoId: p.id, quantidade: qtd, origem: "Ponto de pedido atingido (automática)" },
            a.agora,
          );
          next = notificar(next, {
            titulo: `OC-${next.seqOrdem - 1} gerada automaticamente`,
            descricao: `${p.nome} atingiu o ponto de pedido. ${qtd} un aguardando aprovação.`,
            tipo: "info",
            link: "/compras",
            data: a.agora,
            automatica: true,
          });
        }
      });
      return next;
    }

    case "reservar":
      return mapProduto(s, a.produtoId, (p) => ({
        ...p,
        reservado: Math.min(p.estoque, p.reservado + a.quantidade),
      }));
    case "liberarReserva":
      return mapProduto(s, a.produtoId, (p) => ({ ...p, reservado: 0 }));
    case "ajustarEstoque":
      return mapProduto(s, a.produtoId, (p) => {
        const estoque = Math.max(0, p.estoque + a.quantidade);
        return { ...p, estoque, reservado: Math.min(p.reservado, estoque) };
      });
    case "atualizarProduto":
      return mapProduto(s, a.produtoId, (p) => ({ ...p, ...a.dados }));
    case "adicionarProduto":
      return {
        ...s,
        seqProduto: s.seqProduto + 1,
        produtos: [...s.produtos, { ...a.produto, id: `p${s.seqProduto}`, reservado: 0 }],
      };
    case "removerProduto":
      return {
        ...s,
        produtos: s.produtos.filter((p) => p.id !== a.produtoId),
        ordens: s.ordens.filter((o) => o.produtoId !== a.produtoId || o.status === "recebida"),
      };

    case "criarOrdem":
      return criarOrdem(s, a.ordem, a.agora);
    case "aprovarOrdem":
      return mapOrdem(s, a.id, (o) => ({ ...o, status: "aprovada", atualizadaEm: a.agora }));
    case "rejeitarOrdem":
      return mapOrdem(s, a.id, (o) => ({
        ...o,
        status: "rejeitada",
        motivoRejeicao: a.motivo,
        atualizadaEm: a.agora,
      }));
    case "reabrirOrdem":
      return mapOrdem(s, a.id, (o) => ({
        ...o,
        status: "pendente",
        motivoRejeicao: undefined,
        atualizadaEm: a.agora,
      }));
    case "receberOrdem": {
      const ordem = s.ordens.find((o) => o.id === a.id);
      if (!ordem || ordem.status !== "aprovada") return s;
      let next = mapOrdem(s, a.id, (o) => ({ ...o, status: "recebida", atualizadaEm: a.agora }));
      next = mapProduto(next, ordem.produtoId, (p) => ({
        ...p,
        estoque: p.estoque + ordem.quantidade,
      }));
      return notificar(next, {
        titulo: `${ordem.id} recebida no CD`,
        descricao: `+${ordem.quantidade} un de ${ordem.produto} entraram no estoque.`,
        tipo: "sucesso",
        link: "/estoque",
        data: a.agora,
      });
    }

    case "salvarPolitica":
      return {
        ...s,
        politica: a.politica,
        produtos: a.aplicarATodos ? s.produtos.map((p) => ({ ...p, ...a.politica })) : s.produtos,
      };

    case "toggleAutomacao": {
      let next: ERPState = { ...s, automacoes: { ...s.automacoes, [a.key]: a.valor } };
      if (a.key === "iaAjuste" && a.valor) {
        for (const sug of sugestoes) next = aplicarSugestao(next, sug, a.agora);
      }
      return next;
    }

    case "sincronizar":
      return {
        ...s,
        ultimaSync: a.integracaoId ? s.ultimaSync : a.agora,
        integracoes: s.integracoes.map((i) =>
          i.status === "conectada" && (!a.integracaoId || i.id === a.integracaoId)
            ? { ...i, ultimaSync: a.agora }
            : i,
        ),
      };
    case "conectarIntegracao": {
      const next = {
        ...s,
        integracoes: s.integracoes.map((i) =>
          i.id === a.id ? { ...i, status: "conectada" as const, ultimaSync: a.agora } : i,
        ),
      };
      const i = s.integracoes.find((x) => x.id === a.id);
      return notificar(next, {
        titulo: `${i?.nome ?? "Integração"} conectada`,
        descricao: "Credenciais validadas e primeira sincronização concluída.",
        tipo: "sucesso",
        link: "/configuracoes",
        data: a.agora,
      });
    }
    case "desconectarIntegracao":
      return {
        ...s,
        integracoes: s.integracoes.map((i) =>
          i.id === a.id ? { ...i, status: "pendente" as const, ultimaSync: null } : i,
        ),
      };

    case "aplicarSugestao": {
      const sug = sugestoes.find((x) => x.id === a.sugestaoId);
      return sug ? aplicarSugestao(s, sug, a.agora) : s;
    }

    case "marcarLida":
      return {
        ...s,
        notificacoes: s.notificacoes.map((n) => (n.id === a.id ? { ...n, lida: true } : n)),
      };
    case "marcarTodasLidas":
      return { ...s, notificacoes: s.notificacoes.map((n) => ({ ...n, lida: true })) };
    case "limparNotificacoes":
      return { ...s, notificacoes: [] };
  }
}

type ERPContextValue = {
  state: ERPState;
  dispatch: React.Dispatch<Action>;
};

const ERPContext = createContext<ERPContextValue | null>(null);

export function ERPProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, estadoInicial);
  const hidratado = useRef(false);
  const notificacoesVistas = useRef<Set<string> | null>(null);

  const salvo = useRef<ERPState | null>(null);
  const salvando = useRef(false);

  // Carrega o estado do banco de dados somente no cliente.
  useEffect(() => {
    let ativo = true;
    carregarDoBanco(estadoInicial())
      .then((s) => {
        if (!ativo) return;
        salvo.current = s;
        dispatch({ type: "hidratar", state: s });
        hidratado.current = true;
      })
      .catch(() => {
        toast.error("Não foi possível conectar ao banco de dados", {
          description: "Exibindo dados de demonstração sem salvar.",
        });
      });
    return () => {
      ativo = false;
    };
  }, []);

  // Grava no banco as alterações (agrupadas a cada 1,5s).
  useEffect(() => {
    if (!hidratado.current) return;
    const t = setTimeout(async () => {
      if (salvando.current || !salvo.current || salvo.current === state) return;
      salvando.current = true;
      const antes = salvo.current;
      try {
        await salvarNoBanco(antes, state);
        salvo.current = state;
      } catch {
        toast.error("Falha ao salvar alterações no banco de dados");
      } finally {
        salvando.current = false;
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [state]);

  // Simulação da operação em tempo real (vendas, reservas, expedições).
  const qtdProdutos = state.produtos.length;
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({
        type: "tick",
        agora: Date.now(),
        deltas: Array.from({ length: qtdProdutos }, () => Math.floor(Math.random() * 4) - 2),
        novosPedidos: Math.floor(Math.random() * 3),
        reservaAlvo: Math.floor(Math.random() * qtdProdutos),
        expedicoes: Array.from({ length: qtdProdutos }, () => Math.random() < 0.3),
      });
    }, 5000);
    return () => clearInterval(id);
  }, [qtdProdutos]);

  // Mostra um toast quando uma automação gera uma notificação nova.
  useEffect(() => {
    if (notificacoesVistas.current === null) {
      notificacoesVistas.current = new Set(state.notificacoes.map((n) => n.id));
      return;
    }
    for (const n of state.notificacoes) {
      if (notificacoesVistas.current.has(n.id)) continue;
      notificacoesVistas.current.add(n.id);
      // Notificações antigas restauradas do armazenamento não geram toast.
      if (n.automatica && Date.now() - n.data < 15000) {
        (n.tipo === "critico" ? toast.error : toast.info)(n.titulo, { description: n.descricao });
      }
    }
  }, [state.notificacoes]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

export function useERP() {
  const ctx = useContext(ERPContext);
  if (!ctx) throw new Error("useERP deve ser usado dentro de <ERPProvider>");
  return ctx;
}
