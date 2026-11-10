import { z } from 'zod';
export const loginSchema = z.object({ email: z.string().trim().email('Informe um e-mail válido').max(255), password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(128) });
export const checkoutSchema = z.object({ requestId: z.string().uuid(), customerId: z.string().uuid().nullable(), payment: z.enum(['cash','credit','debit','pix']), items: z.array(z.object({ product_id: z.string().min(1).max(100), quantity: z.number().int().min(1).max(100000) })).min(1).max(100) });
export type Payment = z.infer<typeof checkoutSchema>['payment'];
export function cartTotal(items: { quantity: number; price: number }[]) { return items.reduce((total,item) => total + Math.round(item.price * 100) * item.quantity, 0) / 100; }
export function canAdd(available: number, quantity: number) { return Number.isInteger(quantity) && quantity > 0 && quantity <= available; }
