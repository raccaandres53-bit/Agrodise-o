import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=s=>String(s||'').trim().toLocaleLowerCase('es');
let auditRows=[];

const entityNames={
  orders:'Orden',tasks:'Trabajo',checklist:'Checklist',parts:'Pieza / repuesto',photos:'Foto',
  suppliers:'Proveedor',supplier_categories:'Rubro',carriers:'Transportista',carrier_routes:'Recorrido',carrier_localities:'Localidad',
  users:'Usuario',session:'Sesión',module:'Módulo'
};
const fieldNames={
  name:'nombre',status:'estado',client:'cliente',machine:'máquina',model:'marca / modelo',serial:'identificación',operator:'operario',date_in:'fecha de ingreso',observations:'observaciones',
  phone:'teléfono',whatsapp:'WhatsApp',contact:'email',address:'dirección',category_id:'rubro',route_id:'recorrido',is_favorite:'favorito',
  origin:'origen',destination:'destino',intermediate_stops:'localidades intermedias',service_days:'días de trabajo',service_period:'turno',
  tax_id:'CUIT / CUIL',bank_name:'banco',bank_holder:'titular',bank_cbu_cvu:'CBU / CVU',bank_alias:'alias'
};
function prettyFields(fields){return (Array.isArray(fields)?fields:[]).map(x=>fieldNames[x]||x).join(', ')}
function formatDate(v){try{return new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'medium',timeZone:'America/Argentina/Cordoba'}).format(new Date(v))}catch{return v||''}}

async function logAudit(module,action,entityType,entityId,detail,metadata={}){
  const {data:{session}}=await sb.auth.getSession();
  const email=session?.user?.email?.toLowerCase();if(!email)return;
  await sb.from('audit_logs').insert({user_email:email,module,action,entity_type:entityType||null,entity_id:entityId?String(entityId):null,detail:detail||null,metadata});
}
window.agroAudit=logAudit;

async function logSessionOnce(){
  const {data:{session}}=await sb.auth.getSession();const email=session?.user?.email?.toLowerCase();if(!email)return;
  const key=`agro_audit_login_${email}`;
  if(sessionStorage.getItem(key))return;
  sessionStorage.setItem(key,'1');
  await logAudit('Sistema','Inició sesión','session',session.user.id,email);
}

function injectStyles(){
  if($('auditStyles'))return;
  const s=document.createElement('style');s.id='auditStyles';s.textContent=`
    .audit-filters{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:9px;margin:12px 0}.audit-table-wrap{overflow:auto;max-height:min(62vh,650px);border:1px solid #303036;border-radius:12px}.audit-table{width:100%;border-collapse:collapse;min-width:900px}.audit-table th,.audit-table td{padding:10px 12px;border-bottom:1px solid #29292e;text-align:left;vertical-align:top}.audit-table th{position:sticky;top:0;background:#17171a;z-index:2;font-size:12px;color:#aaa}.audit-user{font-weight:800}.audit-detail{font-size:12px;color:#aaa;margin-top:3px}.audit-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#252529;font-size:11px;font-weight:800}.audit-count{font-size:12px;color:#999;margin:8px 0}.audit-empty{padding:28px;text-align:center;color:#888}@media(max-width:760px){.audit-filters{grid-template-columns:1fr 1fr}.audit-table-wrap{max-height:65vh}}@media(max-width:520px){.audit-filters{grid-template-columns:1fr}}
  `;document.head.appendChild(s);
}

function ensureUI(){
  if(!$('usersModal')||$('openAuditBtn'))return false;
  injectStyles();
  const head=$('usersModal').querySelector('.head');
  const close=$('closeUsers');
  if(head&&close)close.insertAdjacentHTML('beforebegin','<button class="btn dark" id="openAuditBtn" type="button" style="margin-left:auto;margin-right:8px">☷ Bitácora</button>');
  document.body.insertAdjacentHTML('beforeend',`
    <div class="spares-modal" id="auditModal"><div class="spares-dialog" style="width:min(1180px,100%)">
      <div class="head"><div><h2 style="margin:0">Bitácora del sistema</h2><div class="sub">Registro cronológico de acciones realizadas por cada usuario.</div></div><button class="close" id="closeAudit">×</button></div>
      <div class="audit-filters">
        <input id="auditSearch" class="spares-input" placeholder="Buscar usuario, acción o detalle...">
        <select id="auditUser" class="spares-select"><option value="">Todos los usuarios</option></select>
        <select id="auditModule" class="spares-select"><option value="">Todos los módulos</option><option>Taller</option><option>Proveedores</option><option>Transportistas</option><option>Sistema</option></select>
        <select id="auditAction" class="spares-select"><option value="">Todas las acciones</option></select>
      </div>
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div class="audit-count" id="auditCount"></div><button class="mini" id="refreshAudit">Actualizar</button></div>
      <div class="audit-table-wrap"><table class="audit-table"><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Módulo</th><th>Acción</th><th>Elemento</th><th>Detalle</th></tr></thead><tbody id="auditBody"></tbody></table></div>
    </div></div>`);
  $('openAuditBtn').onclick=openAudit;$('closeAudit').onclick=closeAudit;$('refreshAudit').onclick=loadAudit;
  $('auditModal').onclick=e=>{if(e.target.id==='auditModal')closeAudit()};
  ['auditSearch','auditUser','auditModule','auditAction'].forEach(id=>$(id).addEventListener(id==='auditSearch'?'input':'change',renderAudit));
  return true;
}
function closeAudit(){$('auditModal')?.classList.remove('show')}
async function openAudit(){$('auditModal').classList.add('show');await loadAudit()}
async function loadAudit(){
  const body=$('auditBody');if(!body)return;body.innerHTML='<tr><td colspan="6" class="audit-empty">Cargando bitácora...</td></tr>';
  const {data,error}=await sb.from('audit_logs').select('id,created_at,user_email,module,action,entity_type,entity_id,detail,changed_fields,metadata').order('created_at',{ascending:false}).limit(1000);
  if(error){body.innerHTML=`<tr><td colspan="6" class="audit-empty">${esc(error.message)}</td></tr>`;return}
  auditRows=data||[];
  const users=[...new Set(auditRows.map(x=>x.user_email).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const actions=[...new Set(auditRows.map(x=>x.action).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const oldUser=$('auditUser').value,oldAction=$('auditAction').value;
  $('auditUser').innerHTML='<option value="">Todos los usuarios</option>'+users.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');$('auditUser').value=oldUser;
  $('auditAction').innerHTML='<option value="">Todas las acciones</option>'+actions.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');$('auditAction').value=oldAction;
  renderAudit();
}
function renderAudit(){
  const q=norm($('auditSearch')?.value),u=$('auditUser')?.value||'',m=$('auditModule')?.value||'',a=$('auditAction')?.value||'';
  const rows=auditRows.filter(r=>{
    const text=norm([r.user_email,r.module,r.action,r.entity_type,r.entity_id,r.detail,prettyFields(r.changed_fields)].join(' '));
    return(!q||text.includes(q))&&(!u||r.user_email===u)&&(!m||r.module===m)&&(!a||r.action===a);
  });
  $('auditCount').textContent=`${rows.length} registro${rows.length===1?'':'s'}${auditRows.length>=1000?' · mostrando los 1000 más recientes':''}`;
  $('auditBody').innerHTML=rows.length?rows.map(r=>{
    const fields=prettyFields(r.changed_fields);const entity=entityNames[r.entity_type]||r.entity_type||'—';
    return `<tr><td>${esc(formatDate(r.created_at))}</td><td><span class="audit-user">${esc(r.user_email)}</span></td><td><span class="audit-badge">${esc(r.module)}</span></td><td>${esc(r.action)}</td><td>${esc(entity)}${r.entity_id?` <span class="sub">#${esc(r.entity_id)}</span>`:''}</td><td>${esc(r.detail||'')}${fields?`<div class="audit-detail">Cambió: ${esc(fields)}</div>`:''}</td></tr>`;
  }).join(''):'<tr><td colspan="6" class="audit-empty">No hay registros con esos filtros.</td></tr>';
}

// Registro de entradas a módulos: útil para saber qué parte del sistema utilizó cada usuario.
document.addEventListener('click',e=>{
  const btn=e.target.closest('#goWorkshop,#goSpares,#goCarriers');if(!btn)return;
  const map={goWorkshop:'Taller',goSpares:'Proveedores',goCarriers:'Transportistas'};const mod=map[btn.id];if(mod)logAudit('Sistema','Ingresó al módulo','module',mod,mod);
});

function boot(){
  if(!ensureUI()){const o=new MutationObserver(()=>{if(ensureUI())o.disconnect()});o.observe(document.body,{childList:true,subtree:true})}
  logSessionOnce();
}
boot();
