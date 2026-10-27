import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const sb=createClient('https://dcmlbriqiybegmwanwlf.supabase.co','sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=s=>String(s||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');

let routes=[];
let assignments=[];
let currentCarrierId=null;
let saveWrapped=false;
let filtersWrapped=false;
let rendering=false;

function routeLabel(r){return r?`${r.origin} ↔ ${r.destination}`:'Sin recorrido'}
function routeById(id){return routes.find(r=>Number(r.id)===Number(id))}
function assignmentsFor(carrierId){return assignments.filter(a=>Number(a.carrier_id)===Number(carrierId))}
function routeTextFor(carrierId){return assignmentsFor(carrierId).map(a=>{const r=a.carrier_routes||routeById(a.route_id);return [r?.origin,r?.destination,...(Array.isArray(r?.intermediate_stops)?r.intermediate_stops:[])].join(' ')}).join(' ')}

async function loadMultiData(){
  const [{data:r,error:re},{data:a,error:ae}]=await Promise.all([
    sb.from('carrier_routes').select('id,origin,destination,intermediate_stops').order('origin').order('destination'),
    sb.from('carrier_route_assignments').select('carrier_id,route_id,is_primary,carrier_routes(id,origin,destination,intermediate_stops)')
  ]);
  if(re||ae){console.error('No se pudieron cargar recorridos múltiples',re||ae);return}
  routes=r||[];assignments=a||[];
  syncExtraSelectOptions();
  patchRowsAndFilter();
}

function ensureUI(){
  const select=$('carrierRoute');
  if(!select||$('addCarrierRouteBtn'))return !!$('addCarrierRouteBtn');
  const field=select.closest('.spares-field');
  if(!field)return false;
  const row=document.createElement('div');
  row.style.cssText='display:flex;gap:8px;align-items:center';
  select.parentNode.insertBefore(row,select);
  row.appendChild(select);
  select.style.flex='1';
  const btn=document.createElement('button');
  btn.type='button';btn.id='addCarrierRouteBtn';btn.className='btn dark';btn.textContent='+ Agregar recorrido';btn.style.whiteSpace='nowrap';
  row.appendChild(btn);
  const extras=document.createElement('div');extras.id='carrierExtraRoutes';extras.style.cssText='display:grid;gap:8px;margin-top:9px';field.appendChild(extras);
  const hint=document.createElement('div');hint.className='sub';hint.textContent='Podés asociar más de un recorrido al mismo transportista.';hint.style.marginTop='6px';field.appendChild(hint);
  btn.onclick=()=>addExtraRoute();
  wrapSave();wrapFilters();attachOpenTracking();observeRows();loadMultiData();
  return true;
}

function optionsHtml(value=''){
  return '<option value="">Elegir recorrido...</option>'+routes.map(r=>`<option value="${r.id}" ${String(r.id)===String(value)?'selected':''}>${esc(routeLabel(r))}</option>`).join('')
}
function addExtraRoute(value=''){
  const box=$('carrierExtraRoutes');if(!box)return;
  const line=document.createElement('div');line.className='carrier-extra-route-line';line.style.cssText='display:flex;gap:8px;align-items:center';
  line.innerHTML=`<select class="spares-select carrier-extra-route" style="flex:1">${optionsHtml(value)}</select><button type="button" class="mini remove-extra-route">×</button>`;
  line.querySelector('.remove-extra-route').onclick=()=>line.remove();box.appendChild(line);
}
function syncExtraSelectOptions(){
  document.querySelectorAll('.carrier-extra-route').forEach(sel=>{const v=sel.value;sel.innerHTML=optionsHtml(v)})
}
function selectedRouteIds(){
  const ids=[];const primary=Number($('carrierRoute')?.value)||0;if(primary)ids.push(primary);
  document.querySelectorAll('.carrier-extra-route').forEach(s=>{const id=Number(s.value)||0;if(id&&!ids.includes(id))ids.push(id)});
  return ids;
}
async function loadCarrierExtras(carrierId){
  const box=$('carrierExtraRoutes');if(!box)return;box.innerHTML='';
  if(!carrierId)return;
  if(!assignments.length)await loadMultiData();
  const primary=Number($('carrierRoute')?.value)||0;
  assignmentsFor(carrierId).filter(a=>Number(a.route_id)!==primary).forEach(a=>addExtraRoute(a.route_id));
}

function attachOpenTracking(){
  document.addEventListener('click',e=>{
    const row=e.target.closest('.carrier-row');
    if(row){currentCarrierId=Number(row.dataset.id)||null;setTimeout(()=>loadCarrierExtras(currentCarrierId),80);return}
    if(e.target.closest('#newCarrier')){currentCarrierId=null;setTimeout(()=>loadCarrierExtras(null),80)}
  },true);
}

function wrapSave(){
  if(saveWrapped)return;const btn=$('saveCarrier');if(!btn?.onclick)return;
  const original=btn.onclick;
  btn.onclick=async function(e){
    const wanted=selectedRouteIds();
    const snapshot={name:$('carrierName')?.value.trim()||'',phone:$('carrierPhone')?.value.trim()||'',email:$('carrierEmail')?.value.trim()||''};
    const knownId=currentCarrierId;
    await original.call(this,e);
    if($('carrierModal')?.classList.contains('show'))return;
    let carrierId=knownId;
    if(!carrierId&&snapshot.name){
      let q=sb.from('carriers').select('id,name,phone,contact,updated_at').eq('name',snapshot.name).order('updated_at',{ascending:false}).limit(5);
      const {data}=await q;
      const exact=(data||[]).find(c=>(!snapshot.phone||String(c.phone||'')===snapshot.phone)&&(!snapshot.email||String(c.contact||'')===snapshot.email));
      carrierId=Number(exact?.id||(data||[])[0]?.id)||null;
    }
    if(carrierId){await saveAssignments(carrierId,wanted);currentCarrierId=carrierId;await loadMultiData()}
  };
  saveWrapped=true;
}

async function saveAssignments(carrierId,routeIds){
  const {error:de}=await sb.from('carrier_route_assignments').delete().eq('carrier_id',carrierId);if(de){alert('No se pudieron actualizar los recorridos: '+de.message);return}
  if(!routeIds.length)return;
  const rows=routeIds.map((routeId,i)=>({carrier_id:carrierId,route_id:routeId,is_primary:i===0}));
  const {error}=await sb.from('carrier_route_assignments').insert(rows);if(error)alert('No se pudieron guardar todos los recorridos: '+error.message)
}

function routeBadge(r,primary=false){
  if(!r)return '';
  return `<span style="display:inline-block;background:${primary?'#d81f26':'#2d2d32'};color:#fff;padding:4px 9px;border-radius:999px;font-weight:700;margin:2px 4px 2px 0">${esc(routeLabel(r))}${primary?'':' · adicional'}</span>`
}
function patchRows(){
  document.querySelectorAll('.carrier-row').forEach(row=>{
    const id=Number(row.dataset.id);const list=assignmentsFor(id);if(!list.length)return;
    const cell=row.children[3];if(!cell)return;
    const sorted=[...list].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary));
    cell.innerHTML=sorted.map(a=>routeBadge(a.carrier_routes||routeById(a.route_id),a.is_primary)).join('');
  })
}

function applyOwnFilters(){
  const q=norm($('carrierSearch')?.value||'');const route=Number($('routeFilter')?.value)||0;
  document.querySelectorAll('.carrier-row').forEach(row=>{
    const id=Number(row.dataset.id);const own=norm(row.textContent);const rt=norm(routeTextFor(id));
    const qOk=!q||own.includes(q)||rt.includes(q);
    const routeOk=!route||assignmentsFor(id).some(a=>Number(a.route_id)===route);
    row.style.display=qOk&&routeOk?'':'none';
  })
}
function patchRowsAndFilter(){if(rendering)return;rendering=true;try{patchRows();applyOwnFilters()}finally{rendering=false}}

function wrapFilters(){
  if(filtersWrapped)return;
  const search=$('carrierSearch'),rf=$('routeFilter');
  if(search?.oninput){const original=search.oninput;search.oninput=function(e){const v=this.value;this.value='';original.call(this,e);this.value=v;setTimeout(patchRowsAndFilter,40)}}
  if(rf?.onchange){const original=rf.onchange;rf.onchange=function(e){const v=this.value;this.value='';original.call(this,e);this.value=v;setTimeout(patchRowsAndFilter,40)}}
  filtersWrapped=true;
}
function observeRows(){
  ['carrierRows','favoriteCarrierRows'].forEach(id=>{const el=$(id);if(el&&!el.dataset.multiRoutesObserved){el.dataset.multiRoutesObserved='1';new MutationObserver(()=>setTimeout(patchRowsAndFilter,50)).observe(el,{childList:true,subtree:true})}})
}

function boot(){
  if(ensureUI())return;
  const o=new MutationObserver(()=>{if(ensureUI())o.disconnect()});o.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>ensureUI(),700);
}
boot();
