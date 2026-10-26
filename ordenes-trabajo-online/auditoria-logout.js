import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let closing=false;

document.addEventListener('click',async e=>{
  const btn=e.target.closest('#logoutBtn,#sparesLogout,#carriersLogout');
  if(!btn||closing)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();closing=true;
  try{
    const {data:{session}}=await sb.auth.getSession();
    const email=session?.user?.email?.toLowerCase();
    if(email){
      await sb.from('audit_logs').insert({user_email:email,module:'Sistema',action:'Cerró sesión',entity_type:'session',entity_id:session.user.id,detail:email});
      sessionStorage.removeItem(`agro_audit_login_${email}`);
    }
    await sb.auth.signOut();
  }finally{location.reload()}
},true);
