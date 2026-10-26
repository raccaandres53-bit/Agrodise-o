import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
let ownAccess=null;
let users=[];

function injectStyles(){
  if($('usersAdminStyles'))return;
  const st=document.createElement('style');st.id='usersAdminStyles';st.textContent=`
  .users-admin-btn{position:absolute;right:0;top:0;border:1px solid #38383e;background:#18181b;color:#fff;border-radius:999px;padding:9px 13px;font-weight:800;display:flex;align-items:center;gap:7px}
  .users-admin-btn:hover{border-color:#d51f27}.module-picker-box{position:relative}
  .users-perms{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.users-perm{display:flex;align-items:center;gap:8px;background:#1a1a1e;border:1px solid #303036;border-radius:10px;padding:10px}
  .users-list{display:grid;gap:9px;margin-top:16px}.users-item{border:1px solid #303036;background:#17171a;border-radius:12px;padding:12px}.users-item-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.users-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.users-tag{font-size:11px;padding:4px 7px;border-radius:999px;background:#252529;color:#ddd}
  @media(max-width:700px){.users-admin-btn{position:static;margin:0 auto 16px}.users-perms{grid-template-columns:1fr}.users-item-top{flex-direction:column}.users-item-top .btn{width:100%}}
  `;document.head.appendChild(st);
}

async function loadOwnAccess(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session?.user?.email){ownAccess=null;return null}
  const {data,error}=await sb.from('allowed_users').select('email,role,can_taller,can_repuestos,can_transportistas,can_manage_users').eq('email',session.user.email.toLowerCase()).maybeSingle();
  if(error){ownAccess=null;return null}
  ownAccess=data;return data;
}
function applyModulePermissions(){
  const map=[['goWorkshop','can_taller'],['goSpares','can_repuestos'],['goCarriers','can_transportistas']];
  map.forEach(([id,key])=>{const el=$(id);if(el)el.style.display=ownAccess?.[key]?'':'none'});
  const btn=$('usersAdminBtn');if(btn)btn.style.display=ownAccess?.can_manage_users?'':'none';
}
function buildUI(){
  if(!$('modulePicker')||$('usersAdminBtn'))return false;
  injectStyles();
  const box=document.querySelector('#modulePicker .module-picker-box');if(!box)return false;
  box.insertAdjacentHTML('afterbegin',`<button id="usersAdminBtn" class="users-admin-btn" type="button" style="display:none">👤 <span>Usuarios</span></button>`);
  document.body.insertAdjacentHTML('beforeend',`
  <div class="spares-modal" id="usersModal"><div class="spares-dialog" style="width:min(820px,100%)">
    <div class="head"><div><h2 style="margin:0">Usuarios y permisos</h2><div class="sub">Autorizá correos y definí a qué módulos pueden ingresar.</div></div><button class="close" id="closeUsers">×</button></div>
    <div class="sec"><div class="sectop"><b>Dar de alta / editar usuario</b></div>
      <div class="spares-field"><label>Email</label><input id="accessEmail" type="email" placeholder="usuario@empresa.com"></div>
      <div class="users-perms">
        <label class="users-perm"><input type="checkbox" id="permTaller" checked> Taller</label>
        <label class="users-perm"><input type="checkbox" id="permRepuestos" checked> Repuestos</label>
        <label class="users-perm"><input type="checkbox" id="permTransportistas" checked> Transportistas</label>
        <label class="users-perm"><input type="checkbox" id="permUsers"> Administrar usuarios</label>
      </div>
      <div class="sub" style="margin-top:10px">El usuario deberá crear su cuenta con este mismo email desde la pantalla de acceso.</div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn red" id="saveAccessUser">Guardar acceso</button></div>
    </div>
    <div class="sec"><div class="sectop"><b>Usuarios autorizados</b><button class="mini" id="refreshUsers">Actualizar</button></div><div id="usersList" class="users-list"></div></div>
  </div></div>`);
  $('usersAdminBtn').onclick=openUsers;$('closeUsers').onclick=()=>closeUsers();$('saveAccessUser').onclick=saveUser;$('refreshUsers').onclick=loadUsers;
  $('usersModal').onclick=e=>{if(e.target.id==='usersModal')closeUsers()};
  applyModulePermissions();return true;
}
function closeUsers(){$('usersModal')?.classList.remove('show')}
async function invoke(action,payload={}){
  const {data,error}=await sb.functions.invoke('manage-allowed-users',{body:{action,...payload}});
  if(error)throw new Error(error.message||'Error de servidor');if(data?.error)throw new Error(data.error);return data;
}
async function openUsers(){if(!ownAccess?.can_manage_users)return;$('usersModal').classList.add('show');await loadUsers()}
function renderUsers(){
  $('usersList').innerHTML=users.length?users.map(u=>{
    const tags=[];if(u.can_taller)tags.push('Taller');if(u.can_repuestos)tags.push('Repuestos');if(u.can_transportistas)tags.push('Transportistas');if(u.can_manage_users)tags.push('Admin usuarios');
    return `<div class="users-item"><div class="users-item-top"><div><b>${esc(u.email)}</b><div class="sub">${esc(u.role||'operator')}</div><div class="users-tags">${tags.map(t=>`<span class="users-tag">${esc(t)}</span>`).join('')}</div></div><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="mini edit-access" data-email="${esc(u.email)}">Editar</button>${u.email.toLowerCase()==='raccaandres53@gmail.com'?'':`<button class="mini remove-access" data-email="${esc(u.email)}">Eliminar</button>`}</div></div></div>`;
  }).join(''):'<div class="spares-empty">No hay usuarios autorizados.</div>';
  document.querySelectorAll('.edit-access').forEach(b=>b.onclick=()=>editUser(b.dataset.email));
  document.querySelectorAll('.remove-access').forEach(b=>b.onclick=()=>deleteUser(b.dataset.email));
}
async function loadUsers(){try{const data=await invoke('list');users=data.users||[];renderUsers()}catch(e){$('usersList').innerHTML=`<div class="spares-empty">${esc(e.message)}</div>`}}
function editUser(email){const u=users.find(x=>x.email===email);if(!u)return;$('accessEmail').value=u.email;$('permTaller').checked=!!u.can_taller;$('permRepuestos').checked=!!u.can_repuestos;$('permTransportistas').checked=!!u.can_transportistas;$('permUsers').checked=!!u.can_manage_users;$('accessEmail').focus()}
async function saveUser(){
  const email=$('accessEmail').value.trim().toLowerCase();if(!email||!$('accessEmail').checkValidity()){alert('Ingresá un email válido.');return}
  try{await invoke('save',{email,can_taller:$('permTaller').checked,can_repuestos:$('permRepuestos').checked,can_transportistas:$('permTransportistas').checked,can_manage_users:$('permUsers').checked});$('accessEmail').value='';$('permTaller').checked=$('permRepuestos').checked=$('permTransportistas').checked=true;$('permUsers').checked=false;await loadUsers()}catch(e){alert(e.message)}
}
async function deleteUser(email){if(!confirm(`¿Quitar el acceso de ${email}?`))return;try{await invoke('delete',{email});await loadUsers()}catch(e){alert(e.message)}}

async function boot(){await loadOwnAccess();if(!buildUI()){const obs=new MutationObserver(()=>{if(buildUI()){applyModulePermissions();obs.disconnect()}});obs.observe(document.body,{childList:true,subtree:true})}applyModulePermissions()}
boot();
sb.auth.onAuthStateChange(async(event,session)=>{if(session){await loadOwnAccess()}else ownAccess=null;applyModulePermissions()});
