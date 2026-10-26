import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=v=>String(v||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
let routes=[],carrierRoutes=new Map(),recentLocalities=[],searchTimer=null;

function uniq(arr){const seen=new Set();return arr.map(x=>String(x||'').trim()).filter(x=>{const k=norm(x);if(!k||seen.has(k))return false;seen.add(k);return true})}
function selectedStops(){return [...document.querySelectorAll('#simpleStops .simple-stop')].map(x=>x.dataset.name)}
function renderStops(names){const box=$('simpleStops');if(!box)return;box.innerHTML=uniq(names).map(n=>`<span class="simple-stop" data-name="${esc(n)}" style="display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #3a3a40;border-radius:999px;background:#1b1b1f"><span>${esc(n)}</span><button type="button" class="remove-simple-stop" style="border:0;background:none;color:#aaa;font-size:16px;line-height:1;cursor:pointer">×</button></span>`).join('');box.querySelectorAll('.remove-simple-stop').forEach(b=>b.onclick=()=>b.closest('.simple-stop').remove())}
function addStop(name){if(!name)return;renderStops([...selectedStops(),name]);const inp=$('localitySearch');if(inp){inp.value='';inp.focus()}renderSearchResults([])}
function renderRecent(){const box=$('recentLocalities');if(!box)return;box.innerHTML=recentLocalities.length?recentLocalities.map(n=>`<button type="button" class="mini recent-locality" data-name="${esc(n)}" style="border-radius:999px">${esc(n)}</button>`).join(''):'<span class="sub">Todavía no hay localidades recientes.</span>';box.querySelectorAll('.recent-locality').forEach(b=>b.onclick=()=>addStop(b.dataset.name))}
function renderSearchResults(items){const box=$('localityResults');if(!box)return;if(!items.length){box.innerHTML='';box.style.display='none';return}box.style.display='grid';box.innerHTML=items.map(x=>`<button type="button" class="locality-result" data-name="${esc(x.name)}" style="text-align:left;border:1px solid #34343a;background:#1a1a1e;color:#fff;border-radius:10px;padding:10px 12px;cursor:pointer"><b>${esc(x.name)}</b>${x.state?`<div class="sub">${esc(x.state)}</div>`:''}</button>`).join('');box.querySelectorAll('.locality-result').forEach(b=>b.onclick=()=>addStop(b.dataset.name))}
async function searchLocalities(){const q=$('localitySearch')?.value.trim()||'';if(q.length<2){renderSearchResults([]);return}const status=$('localitySearchStatus');status.textContent='Buscando…';try{const {data,error}=await sb.functions.invoke('carrier-locality-search',{body:{query:q}});if(error)throw new Error(error.message||'No se pudo buscar');if(data?.error)throw new Error(data.error);renderSearchResults(data?.results||[]);status.textContent=(data?.results||[]).length?'Tocá una localidad para agregarla.':'No encontré coincidencias.'}catch(e){renderSearchResults([]);status.textContent='No pude buscar localidades. Podés escribirla y agregarla manualmente.'}}
function onSearchInput(){clearTimeout(searchTimer);searchTimer=setTimeout(searchLocalities,300)}
function addTypedLocality(){const v=$('localitySearch')?.value.trim();if(v)addStop(v)}

async function refreshData(){
  const [{data:r},{data:c}]=await Promise.all([
    sb.from('carrier_routes').select('id,origin,destination,intermediate_stops,created_at').order('created_at',{ascending:false}),
    sb.from('carriers').select('id,route_id')
  ]);
  routes=r||[];carrierRoutes=new Map((c||[]).map(x=>[Number(x.id),Number(x.route_id)||null]));
  recentLocalities=uniq(routes.flatMap(r=>Array.isArray(r.intermediate_stops)?r.intermediate_stops:[])).slice(0,5);
  renderRecent();enhanceRouteList();applyLocalityFilter();
}
function ensureUI(){
  if(!$('routeModal')||$('simpleRouteBox'))return false;
  $('routeSuggestBox')?.remove();
  const grid=$('routeOrigin')?.closest('.spares-grid');if(!grid)return false;
  grid.insertAdjacentHTML('afterend',`
    <div id="simpleRouteBox" style="margin-top:14px;padding:14px;border:1px solid #303036;border-radius:12px;background:#151518">
      <div><b>Localidades intermedias</b><div class="sub">Escribí el nombre y elegí una sugerencia para agregarla al recorrido.</div></div>
      <div style="margin-top:12px"><div class="sub" style="margin-bottom:7px"><b>Recientes</b> · últimas 5 agregadas</div><div id="recentLocalities" style="display:flex;flex-wrap:wrap;gap:7px"></div></div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;position:relative">
        <input id="localitySearch" class="spares-input" autocomplete="off" style="flex:1;min-width:210px" placeholder="Escribí una localidad, ej. San Francisco">
        <button class="btn dark" id="addTypedLocality" type="button">+ Agregar</button>
      </div>
      <div id="localitySearchStatus" class="sub" style="margin-top:7px"></div>
      <div id="localityResults" style="display:none;gap:7px;margin-top:8px"></div>
      <div id="simpleStops" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px"></div>
    </div>`);
  $('localitySearch').addEventListener('input',onSearchInput);$('localitySearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addTypedLocality()}});$('addTypedLocality').onclick=addTypedLocality;
  const oldBtn=$('addRoute');if(oldBtn){const fresh=oldBtn.cloneNode(true);oldBtn.replaceWith(fresh);fresh.onclick=saveRoute}
  const filters=$('carrierSearch')?.parentElement;if(filters&&!$('routeLocalitySearch')){const i=document.createElement('input');i.id='routeLocalitySearch';i.className='spares-input';i.placeholder='Buscar localidad del recorrido...';i.oninput=applyLocalityFilter;filters.appendChild(i)}
  const list=$('routeList');if(list)new MutationObserver(()=>enhanceRouteList()).observe(list,{childList:true,subtree:true});
  if($('carrierRows'))new MutationObserver(()=>applyLocalityFilter()).observe($('carrierRows'),{childList:true,subtree:true});
  if($('favoriteCarrierRows'))new MutationObserver(()=>applyLocalityFilter()).observe($('favoriteCarrierRows'),{childList:true,subtree:true});
  refreshData();return true;
}
async function saveRoute(){
  const origin=$('routeOrigin').value.trim(),destination=$('routeDestination').value.trim();if(!origin||!destination){alert('Ingresá origen y destino.');return}
  const stops=selectedStops();const {error}=await sb.from('carrier_routes').insert({origin,destination,intermediate_stops:stops});
  if(error){alert(error.code==='23505'?'Ese recorrido ya existe.':error.message);return}
  $('routeOrigin').value='';$('routeDestination').value='';renderStops([]);$('localitySearch').value='';renderSearchResults([]);$('localitySearchStatus').textContent='';
  await refreshData();
}
function enhanceRouteList(){
  const list=$('routeList');if(!list)return;
  list.querySelectorAll('.category-item').forEach(item=>{
    const id=Number(item.querySelector('.remove-route')?.dataset.id),r=routes.find(x=>Number(x.id)===id);if(!r)return;
    item.querySelector('.simple-route-extra')?.remove();const stops=Array.isArray(r.intermediate_stops)?r.intermediate_stops:[];if(!stops.length)return;
    item.querySelector('span')?.insertAdjacentHTML('beforeend',`<div class="simple-route-extra sub" style="margin-top:5px">Pasa por: ${esc(stops.join(' · '))}</div>`)
  })
}
function applyLocalityFilter(){
  const q=norm($('routeLocalitySearch')?.value||'');document.querySelectorAll('.carrier-row').forEach(row=>{if(!q){row.style.display='';return}const rid=carrierRoutes.get(Number(row.dataset.id)),r=routes.find(x=>Number(x.id)===rid);const text=norm([r?.origin,r?.destination,...(Array.isArray(r?.intermediate_stops)?r.intermediate_stops:[])].join(' '));row.style.display=text.includes(q)?'':'none'})
}
const boot=()=>{if(ensureUI())return;const obs=new MutationObserver(()=>{if(ensureUI())obs.disconnect()});obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>ensureUI(),700)};boot();
