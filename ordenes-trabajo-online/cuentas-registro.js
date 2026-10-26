import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

async function registerSession(session){
  const email=session?.user?.email?.trim().toLowerCase();
  if(!email)return;
  await sb.from('registered_accounts').upsert({email,last_seen_at:new Date().toISOString()},{onConflict:'email'});
}

sb.auth.getSession().then(({data})=>registerSession(data.session));
sb.auth.onAuthStateChange((_event,session)=>{if(session)registerSession(session)});
