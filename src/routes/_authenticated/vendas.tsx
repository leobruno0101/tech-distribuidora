import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Loader2, Minus, Plus, Search, ShoppingCart, Trash2, Package, CheckCircle2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPos, checkout } from '@/lib/pos.functions';
import { canAdd, cartTotal, checkoutSchema, type Payment } from '@/lib/pos-schema';
import { brl } from '@/lib/erp-data';
import { useERP } from '@/lib/erp-store';
const posOptions = queryOptions({queryKey:['pos'],queryFn:()=>getPos(),staleTime:0});
export const Route = createFileRoute('/_authenticated/vendas')({
  loader:({context})=>context.queryClient.ensureQueryData(posOptions),
  head:()=>({meta:[{title:'Vendas · PDV | TechDistribuidora'},{name:'description',content:'Frente de caixa e vendas com pagamento e controle de estoque.'},{property:'og:title',content:'Vendas · PDV | TechDistribuidora'},{property:'og:description',content:'Frente de caixa e vendas com pagamento e controle de estoque.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component:Vendas,
});
const payments:Record<Payment,string>={cash:'Dinheiro',credit:'Cartão de Crédito',debit:'Cartão de Débito',pix:'Pix'};
function Vendas() {
  const {data}=useSuspenseQuery(posOptions); const queryClient=useQueryClient(); const finish=useServerFn(checkout); const {refresh,flush}=useERP();
  const [search,setSearch]=useState(''); const [cart,setCart]=useState<Record<string,number>>({}); const [payment,setPayment]=useState<Payment>('pix'); const [customer,setCustomer]=useState('none');
  const [busy,setBusy]=useState(false); const [requestId,setRequestId]=useState<string|null>(null); const [receipt,setReceipt]=useState('');
  const items=data.products.filter(p=>cart[p.id]).map(p=>({...p,quantity:cart[p.id] ?? 0,price:Number(p.preco_venda)}));
  const total=cartTotal(items); const quantity=items.reduce((n,p)=>n+p.quantity,0);
  const products=data.products.filter(p=>`${p.nome} ${p.sku}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  function change(id:string,qty:number) {
    const product=data.products.find(p=>p.id===id); if(!product||busy)return;
    if(qty>0 && !canAdd(product.estoque-product.reservado,qty)){toast.error('Estoque Insuficiente');return;}
    setCart(old=>{const next={...old};if(qty<=0)delete next[id];else next[id]=qty;return next;});setRequestId(null);setReceipt('');
  }
  async function submit() {
    if(busy||!items.length)return;setBusy(true);
    const id=requestId ?? crypto.randomUUID();setRequestId(id);
    try {
      await flush();
      const input=checkoutSchema.parse({requestId:id,customerId:customer==='none'?null:customer,payment,items:items.map(p=>({product_id:p.id,quantity:p.quantity}))});
      const result=await finish({data:input});
      if(result.error){toast.error(result.error); await queryClient.invalidateQueries({queryKey:['pos']});return;}
      setCart({});setRequestId(null);setReceipt(result.id ?? '');toast.success('Venda finalizada com sucesso');
      await Promise.all([queryClient.invalidateQueries({queryKey:['pos']}),refresh()]);
    } catch {toast.error('Não foi possível confirmar a venda. Tente novamente.');} finally {setBusy(false);}
  }
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Operação de balcão</p><h1 className="mt-1 text-4xl font-bold">Vendas <span className="text-muted-foreground">/ PDV</span></h1></div><span className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4"/>{data.products.length} produtos</span></div>
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0"><div className="relative mb-5"><Search className="absolute top-3.5 left-4 h-4 w-4 text-muted-foreground"/><Input aria-label="Buscar produtos no PDV" placeholder="Buscar por nome ou código..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-card pl-11"/></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{products.map(p=>{const available=p.estoque-p.reservado;return <Button key={p.id} variant="ghost" disabled={busy||Number(p.preco_venda)<=0} onClick={()=>change(p.id,(cart[p.id]??0)+1)} className="h-auto min-h-44 flex-col items-start justify-between gap-4 whitespace-normal rounded-lg border bg-card p-5 text-left hover:bg-card/70" aria-label={`Adicionar ${p.nome}`}>
          <div className="flex w-full items-start justify-between gap-2"><Package className="h-6 w-6 text-muted-foreground"/><span className="rounded-sm bg-muted px-2 py-1 text-xs font-medium">{available} un. disponíveis</span></div><div><p className="mb-1 text-xs font-normal text-muted-foreground">{p.sku}</p><h2 className="text-base font-semibold">{p.nome}</h2></div><div className="flex w-full items-center justify-between"><span className="text-xl font-bold">{brl(Number(p.preco_venda))}</span><Plus className="h-4 w-4"/></div>
        </Button>;})}</div>{!products.length&&<p className="py-12 text-center text-muted-foreground">Nenhum produto encontrado.</p>}
      </section>
      <section className="rounded-lg border bg-card p-5 lg:sticky lg:top-5" aria-label="Carrinho"><div className="mb-5 flex items-center justify-between border-b pb-4"><h2 className="flex items-center gap-2 text-xl font-bold"><ShoppingCart className="h-5 w-5"/>Carrinho</h2><span className="text-sm text-muted-foreground">{quantity} itens</span></div>
        {items.length===0?<div className="flex min-h-40 flex-col items-center justify-center gap-3 text-muted-foreground"><ShoppingCart className="h-8 w-8"/><p>Carrinho vazio</p></div>:<ul className="max-h-96 space-y-4 overflow-y-auto">{items.map(p=><li key={p.id} className="border-b pb-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold">{p.nome}</p><p className="text-xs text-muted-foreground">{brl(p.price)} / un.</p></div><Button size="icon" variant="ghost" title={`Remover ${p.nome}`} aria-label={`Remover ${p.nome}`} disabled={busy} onClick={()=>change(p.id,0)}><Trash2/></Button></div><div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label={`Diminuir ${p.nome}`} disabled={busy} onClick={()=>change(p.id,p.quantity-1)}><Minus/></Button><span className="w-8 text-center tabular-nums">{p.quantity}</span><Button variant="outline" size="icon" aria-label={`Aumentar ${p.nome}`} disabled={busy} onClick={()=>change(p.id,p.quantity+1)}><Plus/></Button></div><span className="font-bold">{brl(cartTotal([p]))}</span></div></li>)}</ul>}
        <div className="mt-5 space-y-4"><div className="space-y-2"><Label>Cliente</Label><Select value={customer} onValueChange={v=>{setCustomer(v);setRequestId(null);}} disabled={busy}><SelectTrigger aria-label="Cliente"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Consumidor não identificado</SelectItem>{data.customers.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Pagamento</Label><Select value={payment} onValueChange={v=>{setPayment(v as Payment);setRequestId(null);}} disabled={busy}><SelectTrigger aria-label="Método de pagamento"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(payments).map(([key,label])=><SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{brl(total)}</span></div><div className="flex justify-between border-t pt-4 text-2xl font-bold"><span>Total</span><span>{brl(total)}</span></div><Button className="w-full" disabled={!items.length||busy} onClick={submit}>{busy?<Loader2 className="animate-spin"/>:<CheckCircle2/>}{busy?'Finalizando...':'Finalizar Venda'}</Button>{receipt&&<p role="status" className="break-words text-sm">Venda #{receipt.slice(0,8)} concluída</p>}</div>
      </section>
    </div>
    <section className="border-t pt-6"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Receipt className="h-5 w-5"/>Últimas vendas</h2>{!data.sales.length?<p className="text-muted-foreground">Nenhuma venda registrada.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm"><thead className="text-muted-foreground"><tr><th className="py-3">Venda</th><th>Data</th><th>Pagamento</th><th>Status</th><th className="text-right">Total</th></tr></thead><tbody>{data.sales.map(s=><tr key={s.id} className="border-t"><td className="py-4 font-semibold">#{s.id.slice(0,8)}</td><td>{new Date(s.created_at).toLocaleString('pt-BR')}</td><td>{payments[s.payment_method as Payment]??s.payment_method}</td><td>{s.status==='completed'?'Concluída':s.status==='pending'?'Pendente':'Cancelada'}</td><td className="text-right font-semibold">{brl(Number(s.total_amount))}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
