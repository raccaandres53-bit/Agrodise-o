import { sb } from './supabase-client.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
let running=false,refreshTimer=null;

function isOwnExtraMutation(m){
  const nodes=[...m.addedNodes,...m.removedNodes].filter(n=>n.nodeType===1);
  return nodes.length>0&&nodes.every(n=>n.classList?.contains('extra-account'));
}
function scheduleRefresh(delay=80){clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshExtraAccounts,delay)}

async function refreshExtraAccounts(){
  const list=document.getElementById('usersList');
  const modal=document.getElementById('usersModal');
  if(running||!list||!modal?.classList.contains('show'))return;
  running=true;
  try{
    const {data,error}=await sb.from('registered_accounts').select('email,created_at,last_seen_at').order('email');
    if(error)return;
    const authorized=new Set([...list.querySelectorAll('.edit-access[data-email]')].map(x=>(x.dataset.email||'').toLowerCase()));
    const missing=(data||[]).filter(a=>!authorized.has(String(a.email).toLowerCase()));

    list.querySelectorAll('.extra-account').forEach(x=>x.remove());
    for(const a of missing){
      const d=document.createElement('div');
      d.className='users-item extra-account';
      d.innerHTML=`<div class="users-item-top"><div><b>${esc(a.email)}</b><div class="users-tags"><span class="users-tag" style="background:#4a2024;color:#ffb8bc">Sin acceso</span></div></div><button class="mini authorize-extra" data-email="${esc(a.email)}">Autorizar</button></div>`;
      list.appendChild(d);
    }
    list.querySelectorAll('.authorize-extra').forEach(b=>b.onclick=()=>{
      document.getElementById('accessEmail').value=b.dataset.email||'';
      ['permTaller','permRepuestos','permTransportistas','permConocimiento','permUsers'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=false});
      document.getElementById('accessEmail').focus();
    });
    const section=list.closest('.sec');const title=section?.querySelector('.sectop b');if(title)title.textContent='Cuentas y accesos';
  }finally{running=false}
}

function attach(){
  const list=document.getElementById('usersList');if(!list)return false;
  if(!list.dataset.extraAccounts){
    list.dataset.extraAccounts='1';
    new MutationObserver(mutations=>{
      if(mutations.length&&mutations.every(isOwnExtraMutation))return;
      scheduleRefresh();
    }).observe(list,{childList:true});
  }
  document.getElementById('usersAdminBtn')?.addEventListener('click',()=>scheduleRefresh(250));
  document.getElementById('refreshUsers')?.addEventListener('click',()=>scheduleRefresh(250));
  document.getElementById('saveAccessUser')?.addEventListener('click',()=>scheduleRefresh(500));
  return true;
}
if(!attach()){const o=new MutationObserver(()=>{if(attach())o.disconnect()});o.observe(document.body,{childList:true,subtree:true});}
