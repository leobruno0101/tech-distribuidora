import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { checkoutSchema } from './pos-schema';
export const getPos = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [products, sales, customers] = await Promise.all([
    context.supabase.from('produtos').select('id,nome,sku,estoque,reservado,preco_venda').order('ordem'),
    context.supabase.from('sales').select('id,total_amount,payment_method,status,created_at').order('created_at',{ascending:false}).limit(10),
    context.supabase.from('customers').select('id,name').order('name'),
  ]);
  if (products.error || sales.error || customers.error) throw new Error('Não foi possível carregar o PDV');
  return { products: products.data ?? [], sales: sales.data ?? [], customers: customers.data ?? [] };
});
export const checkout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(checkoutSchema).handler(async ({data,context}) => {
  const result = await context.supabase.rpc('checkout_sale',{ p_items:data.items, p_payment:data.payment,p_request_id:data.requestId,p_customer_id:data.customerId ?? undefined });
  if (result.error) return { id:null, error: result.error.message.includes('Estoque Insuficiente') ? 'Estoque Insuficiente' : 'Não foi possível finalizar a venda. Tente novamente.' };
  return { id:result.data, error:null };
});
