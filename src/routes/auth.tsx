import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { loginSchema } from '@/lib/pos-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export const Route = createFileRoute('/auth')({ head:()=>({meta:[{title:'Entrar | TechDistribuidora'},{name:'description',content:'Acesso seguro ao ERP e ao caixa da TechDistribuidora.'},{property:'og:title',content:'Entrar | TechDistribuidora'},{property:'og:description',content:'Acesso seguro ao ERP e ao caixa da TechDistribuidora.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Auth });
function Auth() {
  const navigate = useNavigate();
  const [signup,setSignup]=useState(false); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState('');
  const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [message,setMessage]=useState(''); const [visible,setVisible]=useState(false);
  async function submit(event:FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    const result = loginSchema.safeParse({email,password});
    if (!result.success) {setError(result.error.issues[0]?.message ?? 'Verifique os campos');return;}
    if(signup && !z.string().trim().min(1).max(100).safeParse(name).success){setError('Informe seu nome (até 100 caracteres)');return;}
    setBusy(true);
    try {
      if(signup) {
        const {data,error:err}=await supabase.auth.signUp({...result.data,options:{data:{name:name.trim()},emailRedirectTo:window.location.origin}});
        if(err) {setError('Não foi possível criar a conta. Verifique os dados e tente novamente.');return;}
        if(!data.session) {setMessage('Confira seu e-mail para confirmar a conta antes de entrar.');return;}
      } else {
        const {error:err}=await supabase.auth.signInWithPassword(result.data);
        if(err){setError('E-mail ou senha incorretos, ou conta ainda não confirmada.');return;}
      }
      await navigate({to:'/'});
    } catch {setError('Não foi possível conectar. Tente novamente.');} finally {setBusy(false);}
  }
  return <main className="flex min-h-screen items-center justify-center px-5 py-12">
    <section className="w-full max-w-md">
      <div className="mb-9 flex items-center gap-3"><img src="/favicon.png" alt="" className="h-12 w-12 rounded-lg"/><h1 className="text-2xl font-bold">TechDistribuidora</h1></div>
      <div className="rounded-lg border bg-card p-7 sm:p-9">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">ERP · Acesso seguro</p><h2 className="mb-7 text-3xl font-bold">{signup?'Criar conta':'Bem-vindo de volta'}</h2>
        <form onSubmit={submit} className="space-y-5" noValidate>
          {signup && <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" autoComplete="name" maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></div>}
          <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" maxLength={255} value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com.br"/></div>
          <div className="space-y-2"><Label htmlFor="password">Senha</Label><div className="relative"><Input id="password" type={visible?'text':'password'} autoComplete={signup?'new-password':'current-password'} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} className="pr-12"/><Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0" aria-label={visible?'Ocultar senha':'Mostrar senha'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff/>:<Eye/>}</Button></div></div>
          {error && <p role="alert" className="text-sm font-medium text-foreground">{error}</p>}
          {message && <p role="status" className="text-sm text-foreground">{message}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy?<Loader2 className="animate-spin"/>:<LogIn/>}{busy?'Aguarde...':signup?'Criar conta':'Entrar'}</Button>
        </form>
        <Button variant="link" className="mt-5 w-full text-sm" onClick={()=>{setSignup(!signup);setError('');setMessage('');}}>{signup?'Já tenho conta':'Criar uma conta'}</Button>
      </div>
    </section>
  </main>;
}
