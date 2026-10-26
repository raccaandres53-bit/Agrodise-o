import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';
const sb=createClient('https://dcmlbriqiybegmwanwlf.supabase.co','sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
let running=false;
async function refreshExtraAccounts(){
  const list=document.getElementById('usersList');
  const modal=document.getElementById('usersModal');
  if(running||!list||!modal?.classList.contains('show'))return;
  running=true;
  try{
    list.querySelectorAll('.extra-account').forEach(x=>x.remove());
    const {data,error}=await sb.from('registered_accounts').select('email,created_at,last_seen_at').order('email');
    if(error)return;
    const authorized=new Set([...list.querySelectorAll('.edit-access[data-email]')].map(x=>(x.dataset.email||'').toLowerCase()));
    for(const a of (data||[])){
      if(authorized.has(String(a.email).toLowerCase()))continue;
      const d=document.createElement('div');
      d.className='users-item extra-account';
      d.innerHTML=`<div class="users-item-top"><div><b>${esc(a.email)}</b><div class="users-tags"><span class="users-tag" style="background:#4a2024;color:#ffb8bc">Sin acceso</span></div></div><button class="mini authorize-extra" data-email="${esc(a.email)}">Autorizar</button></div>`;
      list.appendChild(d);
    }
    list.querySelectorAll('.authorize-extra').forEach(b=>b.onclick=()=>{
      document.getElementById('accessEmail').value=b.dataset.email||'';
      ['permTaller','permRepuestos','permTransportistas','permUsers'].forEach(id=>document.getElementById(id).checked=false);
      document.getElementById('accessEmail').focus();
    });
    const section=list.closest('.sec');const title=section?.querySelector('.sectop b');if(title)title.textContent='Cuentas y accesos';
  }finally{running=false}
}
function attach(){
  const list=document.getElementById('usersList');if(!list)return false;
  if(!list.dataset.extraAccounts){list.dataset.extraAccounts='1';new MutationObserver(()=>setTimeout(refreshExtraAccounts,50)).observe(list,{childList:true});}
  document.getElementById('usersAdminBtn')?.addEventListener('click',()=>setTimeout(refreshExtraAccounts,300));
  document.getElementById('refreshUsers')?.addEventListener('click',()=>setTimeout(refreshExtraAccounts,300));
  return true;
}
if(!attach()){const o=new MutationObserver(()=>{if(attach())o.disconnect()});o.observe(document.body,{childList:true,subtree:true});}
