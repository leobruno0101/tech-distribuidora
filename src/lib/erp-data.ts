export type StockStatus = "saudavel" | "alerta" | "ruptura";

export type Produto = {
  id: string;
  nome: string;
  sku: string;
  estoque: number;
  reservado: number;
  consumoMedio: number;
  leadTime: number;
  estoqueSeguranca: number;
  pontoPedido: number;
  custoUnitario: number;
  fornecedor: string;
};

export const produtosIniciais: Produto[] = [
  {
    id: "p1",
    nome: 'Smart TV 50" 4K UHD',
    sku: "TV-50-4K",
    estoque: 118,
    reservado: 0,
    consumoMedio: 10,
    leadTime: 7,
    estoqueSeguranca: 20,
    pontoPedido: 90,
    custoUnitario: 2120,
    fornecedor: "VisionTech Ltda",
  },
  {
    id: "p2",
    nome: "Notebook Ultra 14 i7",
    sku: "NB-14-I7",
    estoque: 92,
    reservado: 0,
    consumoMedio: 8,
    leadTime: 9,
    estoqueSeguranca: 20,
    pontoPedido: 90,
    custoUnitario: 3890,
    fornecedor: "CompuMax Distribuidora",
  },
  {
    id: "p3",
    nome: "Smartphone Neo 256GB",
    sku: "SP-NEO-256",
    estoque: 74,
    reservado: 0,
    consumoMedio: 14,
    leadTime: 5,
    estoqueSeguranca: 20,
    pontoPedido: 90,
    custoUnitario: 2116.67,
    fornecedor: "MobileOne Distribuição",
  },
  {
    id: "p4",
    nome: "Monitor 27 QHD 165Hz",
    sku: "MN-27-QHD",
    estoque: 26,
    reservado: 0,
    consumoMedio: 6,
    leadTime: 7,
    estoqueSeguranca: 20,
    pontoPedido: 90,
    custoUnitario: 1479,
    fornecedor: "PixelPro Import",
  },
  {
    id: "p5",
    nome: "Fone Bluetooth ANC Pro",
    sku: "FN-ANC-PRO",
    estoque: 148,
    reservado: 0,
    consumoMedio: 12,
    leadTime: 4,
    estoqueSeguranca: 20,
    pontoPedido: 90,
    custoUnitario: 420,
    fornecedor: "SoundWave Import",
  },
  {
    id: "p6",
    nome: "Console Play X 1TB",
    sku: "CS-PX-1TB",
    estoque: 21,
    reservado: 0,
    consumoMedio: 9,
    leadTime: 11,
    estoqueSeguranca: 20,
    pontoPedido: 90,
    custoUnitario: 2390,
    fornecedor: "GameSupply SA",
  },
];

export function disponivel(p: Produto) {
  return Math.max(0, p.estoque - p.reservado);
}

export function statusDoEstoque(p: Produto): StockStatus {
  const d = disponivel(p);
  if (d <= p.estoqueSeguranca * 1.5) return "ruptura";
  if (d <= p.pontoPedido) return "alerta";
  return "saudavel";
}

/** Dias de cobertura com o estoque disponível no consumo médio atual. */
export function cobertura(p: Produto) {
  return p.consumoMedio > 0 ? disponivel(p) / p.consumoMedio : Infinity;
}

/** Quantidade sugerida de reposição: leva o estoque ao dobro do ponto de pedido. */
export function quantidadeSugerida(p: Produto) {
  const alvo = p.pontoPedido * 2 + p.consumoMedio * p.leadTime;
  return Math.max(10, Math.ceil((alvo - disponivel(p)) / 10) * 10);
}

export const statusLabel: Record<StockStatus, string> = {
  saudavel: "Saudável",
  alerta: "Alerta de Reposição",
  ruptura: "Risco de Ruptura",
};

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const financeiroMensal = [
  { mes: "Abr", faturamento: 118, lucro: 96 },
  { mes: "Mai", faturamento: 126, lucro: 92 },
  { mes: "Jun", faturamento: 132, lucro: 89 },
  { mes: "Jul", faturamento: 138, lucro: 87 },
  { mes: "Ago", faturamento: 140, lucro: 85 },
  { mes: "Set", faturamento: 140, lucro: 85 },
];

export const demandaBase = [
  { produtoId: "p1", produto: 'Smart TV 50" 4K', demanda: 320, variacao: 28 },
  { produtoId: "p3", produto: "Smartphone Neo 256GB", demanda: 295, variacao: 22 },
  { produtoId: "p5", produto: "Fone Bluetooth ANC Pro", demanda: 240, variacao: 17 },
  { produtoId: "p2", produto: "Notebook Ultra 14 i7", demanda: 186, variacao: 9 },
  { produtoId: "p4", produto: "Monitor 27 QHD 165Hz", demanda: 140, variacao: -4 },
];

export type OrdemStatus = "pendente" | "aprovada" | "rejeitada" | "recebida";

export type OrdemCompra = {
  id: string;
  produtoId: string;
  produto: string;
  quantidade: number;
  fornecedor: string;
  valor: number;
  previsaoDias: number;
  origem: string;
  status: OrdemStatus;
  criadaEm: number;
  atualizadaEm: number;
  motivoRejeicao?: string | undefined;
};

const t0 = Date.UTC(2026, 10, 9, 11, 0);

export const ordensIniciais: OrdemCompra[] = [
  {
    id: "OC-2041",
    produtoId: "p1",
    produto: 'Smart TV 50" 4K UHD',
    quantidade: 120,
    fornecedor: "VisionTech Ltda",
    valor: 254400,
    previsaoDias: 7,
    origem: "Ponto de pedido atingido",
    status: "pendente",
    criadaEm: t0,
    atualizadaEm: t0,
  },
  {
    id: "OC-2042",
    produtoId: "p6",
    produto: "Console Play X 1TB",
    quantidade: 80,
    fornecedor: "GameSupply SA",
    valor: 191200,
    previsaoDias: 11,
    origem: "Risco de ruptura",
    status: "pendente",
    criadaEm: t0,
    atualizadaEm: t0,
  },
  {
    id: "OC-2043",
    produtoId: "p4",
    produto: "Monitor 27 QHD 165Hz",
    quantidade: 60,
    fornecedor: "PixelPro Import",
    valor: 88740,
    previsaoDias: 7,
    origem: "Previsão de demanda (IA)",
    status: "pendente",
    criadaEm: t0,
    atualizadaEm: t0,
  },
  {
    id: "OC-2044",
    produtoId: "p3",
    produto: "Smartphone Neo 256GB",
    quantidade: 150,
    fornecedor: "MobileOne Distribuição",
    valor: 317500,
    previsaoDias: 5,
    origem: "Ponto de pedido atingido",
    status: "pendente",
    criadaEm: t0,
    atualizadaEm: t0,
  },
];

export type Sugestao = {
  id: string;
  produtoId: string;
  produto: string;
  quantidade: number;
  politica: string;
  confianca: number;
  motivo: string;
  ajuste: Partial<Pick<Produto, "pontoPedido" | "estoqueSeguranca" | "leadTime" | "consumoMedio">>;
};

export const sugestoes: Sugestao[] = [
  {
    id: "s1",
    produtoId: "p1",
    produto: 'Smart TV 50" 4K UHD',
    quantidade: 140,
    politica: "Ponto de pedido 90 → 110 un",
    confianca: 92,
    motivo: "Demanda projetada +28% com Black Friday antecipada.",
    ajuste: { pontoPedido: 110 },
  },
  {
    id: "s2",
    produtoId: "p3",
    produto: "Smartphone Neo 256GB",
    quantidade: 180,
    politica: "Estoque de segurança 20 → 34 un",
    confianca: 88,
    motivo: "Consumo médio subiu de 12 para 14 un/dia nas últimas 3 semanas.",
    ajuste: { estoqueSeguranca: 34 },
  },
  {
    id: "s3",
    produtoId: "p6",
    produto: "Console Play X 1TB",
    quantidade: 90,
    politica: "Lead time revisado 11 → 13 dias",
    confianca: 81,
    motivo: "Atrasos recorrentes do fornecedor elevam risco de ruptura.",
    ajuste: { leadTime: 13 },
  },
];

export type Politica = {
  consumoMedio: number;
  leadTime: number;
  estoqueSeguranca: number;
  pontoPedido: number;
};

export const politicaInicial: Politica = {
  consumoMedio: 10,
  leadTime: 7,
  estoqueSeguranca: 20,
  pontoPedido: 90,
};

export type AutomacaoKey = "autoOC" | "autoReserva" | "alertasEmail" | "iaAjuste";

export const automacoesInfo: { key: AutomacaoKey; texto: string; detalhe: string }[] = [
  {
    key: "autoOC",
    texto: "Gerar ordem de compra ao atingir o ponto de pedido",
    detalhe: "Cria uma OC pendente quando o disponível cai abaixo do ponto de pedido.",
  },
  {
    key: "autoReserva",
    texto: "Reserva automática de estoque para pedidos confirmados",
    detalhe: "Novos pedidos de venda reservam unidades até a expedição.",
  },
  {
    key: "alertasEmail",
    texto: "Alertas preditivos de ruptura por e-mail",
    detalhe: "Notifica quando um produto entra em risco de ruptura.",
  },
  {
    key: "iaAjuste",
    texto: "Ajustar política de estoque com as sugestões da IA",
    detalhe: "Aplica automaticamente as sugestões do modelo preditivo.",
  },
];

export const automacoesIniciais: Record<AutomacaoKey, boolean> = {
  autoOC: true,
  autoReserva: true,
  alertasEmail: true,
  iaAjuste: false,
};

export type Integracao = {
  id: string;
  nome: string;
  status: "conectada" | "pendente";
  intervalo: string;
  ultimaSync: number | null;
};

export const integracoesIniciais: Integracao[] = [
  {
    id: "vendas",
    nome: "API de Vendas (e-commerce)",
    status: "conectada",
    intervalo: "30s",
    ultimaSync: null,
  },
  {
    id: "wms",
    nome: "WMS Centro de Distribuição",
    status: "conectada",
    intervalo: "60s",
    ultimaSync: null,
  },
  {
    id: "edi",
    nome: "Portal de Fornecedores (EDI)",
    status: "conectada",
    intervalo: "5min",
    ultimaSync: null,
  },
  { id: "fiscal", nome: "ERP Fiscal", status: "pendente", intervalo: "15min", ultimaSync: null },
];

export type Notificacao = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "critico" | "alerta" | "info" | "sucesso";
  link: "/" | "/estoque" | "/compras" | "/ia" | "/configuracoes";
  lida: boolean;
  data: number;
  automatica?: boolean;
};

export const notificacoesIniciais: Notificacao[] = [
  {
    id: "n1",
    titulo: "Console Play X 1TB em risco de ruptura",
    descricao: "Ruptura prevista em 2 dias. OC-2042 aguarda aprovação.",
    tipo: "critico",
    link: "/compras",
    lida: false,
    data: t0,
  },
  {
    id: "n2",
    titulo: "Monitor 27 QHD 165Hz abaixo do estoque de segurança",
    descricao: "Lead time de 7 dias não cobre a demanda atual.",
    tipo: "critico",
    link: "/estoque",
    lida: false,
    data: t0,
  },
  {
    id: "n3",
    titulo: "ERP Fiscal aguardando credenciais",
    descricao: "Conecte a integração para emitir notas automaticamente.",
    tipo: "alerta",
    link: "/configuracoes",
    lida: false,
    data: t0,
  },
];
