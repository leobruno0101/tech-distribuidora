import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
const AuthContext = createContext<{ user:User|null; name:string }>({user:null,name:''});
export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser] = useState<User|null>(null);
  const [name,setName] = useState('');
  const router = useRouter(); const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    async function refresh() {
      const {data} = await supabase.auth.getUser();
      if (!active) return;
      setUser(data.user); setName('');
      if (data.user) { const profile = await supabase.from('profiles').select('name').eq('id',data.user.id).maybeSingle(); if(active) setName(profile.data?.name || 'Usuário'); }
    }
    void refresh();
    const {data:{subscription}} = supabase.auth.onAuthStateChange(event => {
      if (!['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)) return;
      if(event === 'SIGNED_OUT') { setUser(null); setName(''); queryClient.clear(); }
      setTimeout(() => { void refresh(); void router.invalidate(); if(event !== 'SIGNED_OUT') void queryClient.invalidateQueries(); },0);
    });
    return () => { active=false; subscription.unsubscribe(); };
  },[router,queryClient]);
  return <AuthContext.Provider value={{user,name}}>{children}</AuthContext.Provider>;
}
export function useAccount(){return useContext(AuthContext);}
