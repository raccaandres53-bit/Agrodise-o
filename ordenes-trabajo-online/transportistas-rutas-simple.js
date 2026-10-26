import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=v=>String(v||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
let routes=[],localities=[],carrierRoutes=new Map(),carrierSearchText=new Map();

function routeLabel(r){return `${r.origin} → ${r.destination}`}
function routeVariantLabel(r){
  if(!r)return 'Sin recorrido';
  const stops=Array.isArray(r.intermediate_stops)?r.intermediate_stops:[];
  if(!stops.length)return routeLabel(r);
  const shown=stops.slice(0,2).join(', '),extra=stops.length>2?` +${stops.length-2}`:'';
  return `${routeLabel(r)} · vía ${shown}${extra}`;
}
function selectedStops(){return [...document.querySelectorAll('.route-locality-check:checked')].map(x=>x.value)}
function localityCheckbox(name){return `<label class="route-locality-option" data-search="${esc(norm(name))}" style="display:flex;align-items:center;gap:9px;border:1px solid #35353b;background:#1a1a1e;border-radius:10px;padding:10px 12px;cursor:pointer"><input type="checkbox" class="route-locality-check" value="${esc(name)}"><span>${esc(name)}</span></label>`}
function sameStops(a,b){const aa=(a||[]).map(norm).filter(Boolean).sort(),bb=(b||[]).map(norm).filter(Boolean).sort();return aa.length===bb.length&&aa.every((x,i)=>x===bb[i])}

async function refreshData(){
  const [{data:r,error:re},{data:l,error:le},{data:c}]=await Promise.all([
    sb.from('carrier_routes').select('id,origin,destination,intermediate_stops,created_at').order('origin').order('destination'),
    sb.from('carrier_localities').select('id,name,created_at').order('name'),
    sb.from('carriers').select('id,route_id,name,tax_id,email,phone,whatsapp,address,bank_name,bank_alias,bank_cbu_cvu')
  ]);
  if(re||le){console.error(re||le);return}
  routes=r||[];localities=l||[];
  carrierRoutes=new Map((c||[]).map(x=>[Number(x.id),Number(x.route_id)||null]));
  carrierSearchText=new Map((c||[]).map(x=>[Number(x.id),norm([x.name,x.tax_id,x.email,x.phone,x.whatsapp,x.address,x.bank_name,x.bank_alias,x.bank_cbu_cvu].join(' '))]));
  renderLocalities();renderRouteChoices();renderRoutes();syncRouteSelects();patchRouteBadges();applyUnifiedCarrierFilter();
}

function ensureUI(){
  if(!$('routeModal')||$('localitiesBtn'))return false;
  $('routeSuggestBox')?.remove();$('simpleRouteBox')?.remove();$('routeLocalitySearch')?.remove();

  const routesBtn=$('routesBtn');
  routesBtn?.insertAdjacentHTML('afterend','<button id="localitiesBtn">⌖ Localidades</button>');

  document.body.insertAdjacentHTML('beforeend',`
    <div class="spares-modal" id="localitiesModal"><div class="spares-dialog" style="width:min(650px,100%)">
      <div class="head"><div><h2 style="margin:0">Localidades</h2><div class="sub">Cargalas una sola vez y después seleccionalas al crear recorridos.</div></div><button class="close" id="closeLocalities">×</button></div>
      <div class="sec">
        <div class="spares-field"><label>Nueva localidad</label><div style="display:flex;gap:8px"><input id="newLocalityName" placeholder="Ej. San Francisco"><button class="btn red" id="addLocalityBtn" type="button">+ Agregar</button></div></div>
      </div>
      <div class="sec"><div class="sectop"><b>Localidades cargadas</b><span class="sub" id="localityCount"></span></div><div id="localitiesList" class="category-list"></div></div>
    </div></div>`);

  const grid=$('routeOrigin')?.closest('.spares-grid');
  if(!grid)return false;
  $('routeOrigin').setAttribute('list','carrierLocalitiesDatalist');
  $('routeDestination').setAttribute('list','carrierLocalitiesDatalist');
  grid.insertAdjacentHTML('afterend',`
    <datalist id="carrierLocalitiesDatalist"></datalist>
    <div id="routeLocalitiesBox" style="margin-top:14px;padding:14px;border:1px solid #303036;border-radius:12px;background:#151518">
      <div><b>¿Por qué localidades pasa?</b><div class="sub">Podés crear varios recorridos con el mismo origen y destino. Marcá pueblos distintos para diferenciar cada variante.</div></div>
      <input id="routeLocalityPickerSearch" class="spares-input" style="margin-top:12px;width:100%" placeholder="Buscar dentro de mis localidades...">
      <div id="routeLocalityChoices" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:12px"></div>
      <div id="noRouteLocalities" class="sub" style="margin-top:10px;display:none">Todavía no cargaste localidades. Entrá en <b>Localidades</b> para agregarlas.</div>
    </div>`);

  const oldAdd=$('addRoute');if(oldAdd){const fresh=oldAdd.cloneNode(true);oldAdd.replaceWith(fresh);fresh.onclick=saveRoute}
  $('localitiesBtn').onclick=openLocalities;$('closeLocalities').onclick=closeLocalities;$('addLocalityBtn').onclick=addLocality;
  $('newLocalityName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addLocality()}});
  $('localitiesModal').onclick=e=>{if(e.target.id==='localitiesModal')closeLocalities()};
  $('routeLocalityPickerSearch').oninput=filterRouteChoices;

  installUnifiedMainSearch();
  if($('carrierRows'))new MutationObserver(()=>{patchRouteBadges();applyUnifiedCarrierFilter()}).observe($('carrierRows'),{childList:true,subtree:true});
  if($('favoriteCarrierRows'))new MutationObserver(()=>{patchRouteBadges();applyUnifiedCarrierFilter()}).observe($('favoriteCarrierRows'),{childList:true,subtree:true});
  refreshData();return true;
}

function openLocalities(){$('localitiesModal').classList.add('show');$('newLocalityName').focus();refreshData()}
function closeLocalities(){$('localitiesModal').classList.remove('show')}
async function addLocality(){
  const name=$('newLocalityName').value.trim();if(!name)return;
  const {data:{session}}=await sb.auth.getSession();
  const {error}=await sb.from('carrier_localities').insert({name,created_by:session?.user?.email||null});
  if(error){alert(error.code==='23505'?'Esa localidad ya está cargada.':error.message);return}
  $('newLocalityName').value='';await refreshData();$('newLocalityName').focus();
}
async function removeLocality(id){
  const l=localities.find(x=>Number(x.id)===Number(id));if(!l)return;
  if(!confirm(`¿Eliminar ${l.name} de la lista de localidades? Los recorridos ya guardados no se modificarán.`))return;
  const {error}=await sb.from('carrier_localities').delete().eq('id',id);if(error){alert(error.message);return}await refreshData();
}
function renderLocalities(){
  const box=$('localitiesList');if(!box)return;$('localityCount').textContent=`${localities.length} cargada${localities.length===1?'':'s'}`;
  box.innerHTML=localities.length?localities.map(l=>`<div class="category-item"><span><b>${esc(l.name)}</b></span><button class="mini remove-locality" data-id="${l.id}">Eliminar</button></div>`).join(''):'<div class="spares-empty">Todavía no hay localidades cargadas.</div>';
  box.querySelectorAll('.remove-locality').forEach(b=>b.onclick=()=>removeLocality(+b.dataset.id));
  const dl=$('carrierLocalitiesDatalist');if(dl)dl.innerHTML=localities.map(l=>`<option value="${esc(l.name)}"></option>`).join('');
}
function renderRouteChoices(){
  const box=$('routeLocalityChoices');if(!box)return;const current=new Set(selectedStops().map(norm));
  box.innerHTML=localities.map(l=>localityCheckbox(l.name)).join('');
  box.querySelectorAll('.route-locality-check').forEach(ch=>{ch.checked=current.has(norm(ch.value))});
  $('noRouteLocalities').style.display=localities.length?'none':'';filterRouteChoices();
}
function filterRouteChoices(){const q=norm($('routeLocalityPickerSearch')?.value||'');document.querySelectorAll('.route-locality-option').forEach(x=>x.style.display=!q||x.dataset.search.includes(q)?'flex':'none')}

async function saveRoute(){
  const origin=$('routeOrigin').value.trim(),destination=$('routeDestination').value.trim();if(!origin||!destination){alert('Ingresá origen y destino.');return}
  const stops=selectedStops();
  const duplicate=routes.some(r=>norm(r.origin)===norm(origin)&&norm(r.destination)===norm(destination)&&sameStops(r.intermediate_stops,stops));
  if(duplicate){alert('Ese recorrido, con esas mismas localidades intermedias, ya está cargado.');return}
  const {error}=await sb.from('carrier_routes').insert({origin,destination,intermediate_stops:stops});
  if(error){alert(error.message);return}
  $('routeOrigin').value='';$('routeDestination').value='';$('routeLocalityPickerSearch').value='';document.querySelectorAll('.route-locality-check').forEach(x=>x.checked=false);await refreshData();
}
async function removeRoute(id){
  const r=routes.find(x=>Number(x.id)===Number(id));if(!r||!confirm(`¿Eliminar el recorrido ${routeVariantLabel(r)}?`))return;
  const {error}=await sb.from('carrier_routes').delete().eq('id',id);if(error){alert(error.message);return}await refreshData();
}
function renderRoutes(){
  const box=$('routeList');if(!box)return;
  box.innerHTML=routes.length?routes.map(r=>`<div class="category-item"><span><b>${esc(routeLabel(r))}</b>${Array.isArray(r.intermediate_stops)&&r.intermediate_stops.length?`<div class="sub" style="margin-top:5px">Pasa por: ${esc(r.intermediate_stops.join(' · '))}</div>`:''}</span><button class="mini route-remove-custom" data-id="${r.id}">Eliminar</button></div>`).join(''):'<div class="spares-empty">Todavía no hay recorridos creados.</div>';
  box.querySelectorAll('.route-remove-custom').forEach(b=>b.onclick=()=>removeRoute(+b.dataset.id));
}
function syncRouteSelects(){
  const options=routes.map(r=>`<option value="${r.id}">${esc(routeVariantLabel(r))}</option>`).join('');
  const rf=$('routeFilter');if(rf){const old=rf.value;rf.innerHTML='<option value="">Todos los recorridos</option>'+options;rf.value=old}
  const cr=$('carrierRoute');if(cr){const old=cr.value;cr.innerHTML='<option value="">Sin recorrido</option>'+options;cr.value=old}
}
function patchRouteBadges(){
  document.querySelectorAll('.carrier-row').forEach(row=>{
    const rid=carrierRoutes.get(Number(row.dataset.id)),r=routes.find(x=>Number(x.id)===Number(rid));if(!r)return;
    const badge=row.querySelector('td:nth-child(4) span');if(badge)badge.textContent=routeVariantLabel(r);
  });
}

function installUnifiedMainSearch(){
  const input=$('carrierSearch'),routeFilter=$('routeFilter');if(!input||input.dataset.localityUnified==='1')return;
  input.dataset.localityUnified='1';input.placeholder='Buscar transportista, datos o localidad del recorrido...';
  let held='';
  input.addEventListener('input',()=>{held=input.value;input.value=''},true);
  input.addEventListener('input',()=>{input.value=held;applyUnifiedCarrierFilter()});
  if(routeFilter){
    routeFilter.addEventListener('change',()=>{held=input.value;input.value=''},true);
    routeFilter.addEventListener('change',()=>{input.value=held;setTimeout(()=>{patchRouteBadges();applyUnifiedCarrierFilter()},0)});
  }
}
function applyUnifiedCarrierFilter(){
  const input=$('carrierSearch');if(!input)return;const q=norm(input.value||'');
  const matches=id=>{
    if(!q)return true;
    const rid=carrierRoutes.get(Number(id)),r=routes.find(x=>Number(x.id)===Number(rid));
    const routeText=norm([r?.origin,r?.destination,...(Array.isArray(r?.intermediate_stops)?r.intermediate_stops:[])].join(' '));
    return (carrierSearchText.get(Number(id))||'').includes(q)||routeText.includes(q);
  };
  document.querySelectorAll('.carrier-row').forEach(row=>row.style.display=matches(row.dataset.id)?'':'none');
  const visible=[...document.querySelectorAll('#carrierRows .carrier-row')].filter(r=>r.style.display!=='none').length;
  if($('carrierCount'))$('carrierCount').textContent=`${visible} transportista${visible===1?'':'s'}`;
  const favVisible=[...document.querySelectorAll('#favoriteCarrierRows .carrier-row')].some(r=>r.style.display!=='none');
  if($('favoriteCarriersSection'))$('favoriteCarriersSection').style.display=favVisible?'':'none';
}

const boot=()=>{if(ensureUI())return;const obs=new MutationObserver(()=>{if(ensureUI())obs.disconnect()});obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>ensureUI(),700)};boot();
