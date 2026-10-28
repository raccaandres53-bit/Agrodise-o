import { sb } from './supabase-client.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=v=>String(v||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
let routes=[],localities=[],carrierRoutes=new Map();
let refreshPromise=null;

function routeLabel(r){return `${r.origin} ↔ ${r.destination}`}
function selectedStops(){return [...document.querySelectorAll('.route-locality-check:checked')].map(x=>x.value)}
function localityCheckbox(name){return `<label class="route-locality-option" data-search="${esc(norm(name))}" style="display:flex;align-items:center;gap:9px;border:1px solid #35353b;background:#1a1a1e;border-radius:10px;padding:10px 12px;cursor:pointer"><input type="checkbox" class="route-locality-check" value="${esc(name)}"><span>${esc(name)}</span></label>`}

async function refreshData(){
  if(refreshPromise)return refreshPromise;
  refreshPromise=(async()=>{
    const [{data:r,error:re},{data:l,error:le},{data:c}]=await Promise.all([
      sb.from('carrier_routes').select('id,origin,destination,intermediate_stops,created_at').order('origin').order('destination'),
      sb.from('carrier_localities').select('id,name,created_at').order('name'),
      sb.from('carriers').select('id,route_id')
    ]);
    if(re||le){console.error(re||le);return false}
    routes=r||[];localities=l||[];carrierRoutes=new Map((c||[]).map(x=>[Number(x.id),Number(x.route_id)||null]));
    renderLocalities();renderRouteChoices();renderRoutes();syncRouteSelects();applyLocalityFilter();
    return true;
  })();
  try{return await refreshPromise}finally{refreshPromise=null}
}

async function openRoutesReady(){
  const modal=$('routeModal');if(!modal)return;
  modal.classList.remove('show');
  await refreshData();
  renderRouteChoices();renderRoutes();syncRouteSelects();
  modal.classList.add('show');
  $('routeOrigin')?.focus();
}

function ensureUI(){
  if(!$('routeModal')||$('localitiesBtn'))return false;
  $('routeSuggestBox')?.remove();$('simpleRouteBox')?.remove();
  const routesBtn=$('routesBtn');
  if(!routesBtn)return false;
  routesBtn.insertAdjacentHTML('afterend','<button id="localitiesBtn">⌖ Localidades</button>');
  document.body.insertAdjacentHTML('beforeend',`
    <div class="spares-modal" id="localitiesModal"><div class="spares-dialog" style="width:min(650px,100%)">
      <div class="head"><div><h2 style="margin:0">Localidades</h2><div class="sub">Cargalas una sola vez y después seleccionalas al crear recorridos.</div></div><button class="close" id="closeLocalities">×</button></div>
      <div class="sec"><div class="spares-field"><label>Nueva localidad</label><div style="display:flex;gap:8px"><input id="newLocalityName" placeholder="Ej. San Francisco"><button class="btn red" id="addLocalityBtn" type="button">+ Agregar</button></div></div></div>
      <div class="sec"><div class="sectop"><b>Localidades cargadas</b><span class="sub" id="localityCount"></span></div><div id="localitiesList" class="category-list"></div></div>
    </div></div>`);
  const grid=$('routeOrigin')?.closest('.spares-grid');
  if(!grid)return false;
  $('routeOrigin').setAttribute('list','carrierLocalitiesDatalist');
  $('routeDestination').setAttribute('list','carrierLocalitiesDatalist');
  grid.insertAdjacentHTML('afterend',`
    <datalist id="carrierLocalitiesDatalist"></datalist>
    <div id="routeLocalitiesBox" style="margin-top:14px;padding:14px;border:1px solid #303036;border-radius:12px;background:#151518">
      <div><b>¿Por qué localidades pasa?</b><div class="sub">Tocá las localidades que correspondan a este recorrido de ida y vuelta.</div></div>
      <input id="routeLocalityPickerSearch" class="spares-input" style="margin-top:12px;width:100%" placeholder="Buscar dentro de mis localidades...">
      <div id="routeLocalityChoices" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:12px"></div>
      <div id="noRouteLocalities" class="sub" style="margin-top:10px;display:none">Todavía no cargaste localidades. Entrá en <b>Localidades</b> para agregarlas.</div>
    </div>`);
  const oldAdd=$('addRoute');if(oldAdd){const fresh=oldAdd.cloneNode(true);oldAdd.replaceWith(fresh);fresh.onclick=saveRoute}
  $('localitiesBtn').onclick=openLocalities;$('closeLocalities').onclick=closeLocalities;$('addLocalityBtn').onclick=addLocality;
  $('newLocalityName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addLocality()}});
  $('localitiesModal').onclick=e=>{if(e.target.id==='localitiesModal')closeLocalities()};
  $('routeLocalityPickerSearch').oninput=filterRouteChoices;

  routesBtn.onclick=openRoutesReady;
  if($('manageRoutes'))$('manageRoutes').onclick=openRoutesReady;

  if($('carrierRows'))new MutationObserver(()=>applyLocalityFilter()).observe($('carrierRows'),{childList:true,subtree:true});
  if($('favoriteCarrierRows'))new MutationObserver(()=>applyLocalityFilter()).observe($('favoriteCarrierRows'),{childList:true,subtree:true});
  refreshData();return true;
}

function openLocalities(){$('localitiesModal').classList.add('show');$('newLocalityName').focus();refreshData()}
function closeLocalities(){$('localitiesModal').classList.remove('show')}
async function addLocality(){const name=$('newLocalityName').value.trim();if(!name)return;const {data:{session}}=await sb.auth.getSession();const {error}=await sb.from('carrier_localities').insert({name,created_by:session?.user?.email||null});if(error){alert(error.code==='23505'?'Esa localidad ya está cargada.':error.message);return}$('newLocalityName').value='';await refreshData();$('newLocalityName').focus()}
async function removeLocality(id){const l=localities.find(x=>Number(x.id)===Number(id));if(!l)return;if(!confirm(`¿Eliminar ${l.name} de la lista de localidades? Los recorridos ya guardados no se modificarán.`))return;const {error}=await sb.from('carrier_localities').delete().eq('id',id);if(error){alert(error.message);return}await refreshData()}
function renderLocalities(){const box=$('localitiesList');if(!box)return;$('localityCount').textContent=`${localities.length} cargada${localities.length===1?'':'s'}`;box.innerHTML=localities.length?localities.map(l=>`<div class="category-item"><span><b>${esc(l.name)}</b></span><button class="mini remove-locality" data-id="${l.id}">Eliminar</button></div>`).join(''):'<div class="spares-empty">Todavía no hay localidades cargadas.</div>';box.querySelectorAll('.remove-locality').forEach(b=>b.onclick=()=>removeLocality(+b.dataset.id));const dl=$('carrierLocalitiesDatalist');if(dl)dl.innerHTML=localities.map(l=>`<option value="${esc(l.name)}"></option>`).join('')}
function renderRouteChoices(){const box=$('routeLocalityChoices');if(!box)return;const current=new Set(selectedStops().map(norm));box.innerHTML=localities.map(l=>localityCheckbox(l.name)).join('');box.querySelectorAll('.route-locality-check').forEach(ch=>{ch.checked=current.has(norm(ch.value))});$('noRouteLocalities').style.display=localities.length?'none':'';filterRouteChoices()}
function filterRouteChoices(){const q=norm($('routeLocalityPickerSearch')?.value||'');document.querySelectorAll('.route-locality-option').forEach(x=>x.style.display=!q||x.dataset.search.includes(q)?'flex':'none')}

async function saveRoute(){const origin=$('routeOrigin').value.trim(),destination=$('routeDestination').value.trim();if(!origin||!destination){alert('Ingresá origen y destino.');return}const stops=selectedStops();const {error}=await sb.from('carrier_routes').insert({origin,destination,intermediate_stops:stops});if(error){alert(error.code==='23505'?'Ese recorrido exacto ya existe.':error.message);return}$('routeOrigin').value='';$('routeDestination').value='';$('routeLocalityPickerSearch').value='';document.querySelectorAll('.route-locality-check').forEach(x=>x.checked=false);await refreshData()}
async function removeRoute(id){const r=routes.find(x=>Number(x.id)===Number(id));if(!r||!confirm(`¿Eliminar el recorrido ${routeLabel(r)}?`))return;const {error}=await sb.from('carrier_routes').delete().eq('id',id);if(error){alert(error.message);return}await refreshData()}
function renderRoutes(){const box=$('routeList');if(!box)return;box.innerHTML=routes.length?routes.map(r=>`<div class="category-item"><span><b>${esc(routeLabel(r))}</b>${Array.isArray(r.intermediate_stops)&&r.intermediate_stops.length?`<div class="sub" style="margin-top:5px">Pasa por: ${esc(r.intermediate_stops.join(' · '))}</div>`:''}</span><button class="mini route-remove-custom" data-id="${r.id}">Eliminar</button></div>`).join(''):'<div class="spares-empty">Todavía no hay recorridos creados.</div>';box.querySelectorAll('.route-remove-custom').forEach(b=>b.onclick=()=>removeRoute(+b.dataset.id))}
function syncRouteSelects(){const options=routes.map(r=>`<option value="${r.id}">${esc(routeLabel(r))}</option>`).join('');const rf=$('routeFilter');if(rf){const old=rf.value;rf.innerHTML='<option value="">Todos los recorridos</option>'+options;rf.value=old}const cr=$('carrierRoute');if(cr){const old=cr.value;cr.innerHTML='<option value="">Sin recorrido</option>'+options;cr.value=old}}
function applyLocalityFilter(){const q=norm($('carrierSearch')?.value||'');document.querySelectorAll('.carrier-row').forEach(row=>{if(!q){row.style.display='';return}const rid=carrierRoutes.get(Number(row.dataset.id)),r=routes.find(x=>Number(x.id)===rid);const routeText=norm([r?.origin,r?.destination,...(Array.isArray(r?.intermediate_stops)?r.intermediate_stops:[])].join(' '));const ownText=norm(row.textContent);row.style.display=(routeText.includes(q)||ownText.includes(q))?'':'none'})}

const boot=()=>{if(ensureUI())return;const obs=new MutationObserver(()=>{if(ensureUI())obs.disconnect()});obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>ensureUI(),700)};boot();
