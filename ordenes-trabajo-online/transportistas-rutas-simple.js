import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=v=>String(v||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
let routes=[],carrierRoutes=new Map(),knownLocalities=[];

function uniq(arr){const seen=new Set();return arr.map(x=>String(x||'').trim()).filter(x=>{const k=norm(x);if(!k||seen.has(k))return false;seen.add(k);return true})}
function selectedStops(){return [...document.querySelectorAll('#simpleStops .simple-stop')].map(x=>x.dataset.name)}
function renderStops(names){const box=$('simpleStops');if(!box)return;box.innerHTML=uniq(names).map(n=>`<span class="simple-stop" data-name="${esc(n)}" style="display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #3a3a40;border-radius:999px;background:#1b1b1f"><span>${esc(n)}</span><button type="button" class="remove-simple-stop" style="border:0;background:none;color:#aaa;font-size:16px;line-height:1;cursor:pointer">×</button></span>`).join('');box.querySelectorAll('.remove-simple-stop').forEach(b=>b.onclick=()=>{b.closest('.simple-stop').remove()})}
function addStopsFromInput(){const inp=$('simpleStopInput');if(!inp)return;const parts=inp.value.split(',').map(x=>x.trim()).filter(Boolean);if(!parts.length)return;renderStops([...selectedStops(),...parts]);inp.value='';inp.focus()}
function renderSuggestions(items){const box=$('nearbySuggestions');if(!box)return;if(!items.length){box.innerHTML='<div class="sub">No encontré localidades cercanas con ese alcance.</div>';return}box.innerHTML=items.map(x=>`<label style="display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #3a3a40;border-radius:999px;background:#1b1b1f;cursor:pointer"><input type="checkbox" class="nearby-check" value="${esc(x.name)}" checked><span>${esc(x.name)}</span><span class="sub">${x.distance_km} km</span></label>`).join('')}
function addSelectedSuggestions(){const picks=[...document.querySelectorAll('.nearby-check:checked')].map(x=>x.value);renderStops([...selectedStops(),...picks])}

async function refreshData(){
  const [{data:r},{data:c}]=await Promise.all([
    sb.from('carrier_routes').select('id,origin,destination,intermediate_stops').order('origin').order('destination'),
    sb.from('carriers').select('id,route_id')
  ]);
  routes=r||[];carrierRoutes=new Map((c||[]).map(x=>[Number(x.id),Number(x.route_id)||null]));
  knownLocalities=uniq(routes.flatMap(r=>[r.origin,r.destination,...(Array.isArray(r.intermediate_stops)?r.intermediate_stops:[])]));
  const dl=$('knownLocalities');if(dl)dl.innerHTML=knownLocalities.map(n=>`<option value="${esc(n)}"></option>`).join('');
  enhanceRouteList();applyLocalityFilter();
}
function ensureUI(){
  if(!$('routeModal')||$('simpleRouteBox'))return false;
  const old=$('routeSuggestBox');if(old)old.remove();
  const grid=$('routeOrigin')?.closest('.spares-grid');if(!grid)return false;
  grid.insertAdjacentHTML('afterend',`
    <div id="simpleRouteBox" style="margin-top:14px;padding:14px;border:1px solid #303036;border-radius:12px;background:#151518">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
        <div><b>Localidades intermedias</b><div class="sub">Podés sugerir localidades cercanas al trayecto o agregarlas manualmente.</div></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="nearbyRadius" class="spares-select" style="width:auto"><option value="5">5 km</option><option value="15" selected>15 km</option><option value="30">30 km</option></select>
          <button class="btn dark" id="suggestNearbyBtn" type="button">Sugerir localidades</button>
        </div>
      </div>
      <div id="nearbyStatus" class="sub" style="margin-top:10px"></div>
      <div id="nearbySuggestions" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"></div>
      <div id="nearbyApplyWrap" style="display:none;margin-top:10px"><button class="mini" id="addSuggestedStops" type="button">+ Agregar seleccionadas</button></div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <input id="simpleStopInput" class="spares-input" list="knownLocalities" style="flex:1;min-width:210px" placeholder="Ej. Brinkmann, Freyre, San Francisco">
        <datalist id="knownLocalities"></datalist>
        <button class="btn dark" id="simpleAddStop" type="button">+ Agregar</button>
      </div>
      <div id="simpleStops" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"></div>
    </div>`);
  $('simpleAddStop').onclick=addStopsFromInput;$('simpleStopInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addStopsFromInput()}});
  $('suggestNearbyBtn').onclick=suggestNearby;$('addSuggestedStops').onclick=addSelectedSuggestions;
  const oldBtn=$('addRoute');if(oldBtn){const fresh=oldBtn.cloneNode(true);oldBtn.replaceWith(fresh);fresh.onclick=saveRoute}
  const filters=$('carrierSearch')?.parentElement;if(filters&&!$('routeLocalitySearch')){const i=document.createElement('input');i.id='routeLocalitySearch';i.className='spares-input';i.placeholder='Buscar localidad del recorrido...';i.oninput=applyLocalityFilter;filters.appendChild(i)}
  const list=$('routeList');if(list)new MutationObserver(()=>enhanceRouteList()).observe(list,{childList:true,subtree:true});
  if($('carrierRows'))new MutationObserver(()=>applyLocalityFilter()).observe($('carrierRows'),{childList:true,subtree:true});
  if($('favoriteCarrierRows'))new MutationObserver(()=>applyLocalityFilter()).observe($('favoriteCarrierRows'),{childList:true,subtree:true});
  refreshData();return true;
}
async function suggestNearby(){
  const origin=$('routeOrigin').value.trim(),destination=$('routeDestination').value.trim(),status=$('nearbyStatus'),btn=$('suggestNearbyBtn');
  if(!origin||!destination){alert('Ingresá origen y destino primero.');return}
  btn.disabled=true;status.textContent='Buscando localidades cercanas…';$('nearbySuggestions').innerHTML='';$('nearbyApplyWrap').style.display='none';
  try{
    const radius_km=Number($('nearbyRadius').value)||15;
    const {data,error}=await sb.functions.invoke('carrier-locality-suggest',{body:{origin,destination,radius_km}});
    if(error)throw new Error(error.message||'No pude consultar localidades');if(data?.error)throw new Error(data.error);
    const items=data?.localities||[];renderSuggestions(items);$('nearbyApplyWrap').style.display=items.length?'':'none';status.textContent=items.length?`Encontré ${items.length} localidad${items.length===1?'':'es'} dentro de ${radius_km} km del corredor. Marcá las que quieras guardar.`:'No encontré localidades cercanas. Podés ampliar el alcance o cargarlas manualmente.';
  }catch(e){status.textContent=`No pude sugerir localidades: ${e.message}. Podés seguir cargándolas manualmente.`}
  finally{btn.disabled=false}
}
async function saveRoute(){
  const origin=$('routeOrigin').value.trim(),destination=$('routeDestination').value.trim();if(!origin||!destination){alert('Ingresá origen y destino.');return}
  const stops=selectedStops();const {error}=await sb.from('carrier_routes').insert({origin,destination,intermediate_stops:stops});
  if(error){alert(error.code==='23505'?'Ese recorrido ya existe.':error.message);return}
  $('routeOrigin').value='';$('routeDestination').value='';renderStops([]);if($('simpleStopInput'))$('simpleStopInput').value='';$('nearbySuggestions').innerHTML='';$('nearbyStatus').textContent='';$('nearbyApplyWrap').style.display='none';
  await refreshData();
  const manage=$('manageRoutes');if($('routeModal')?.classList.contains('show')&&manage){const {data:r}=await sb.from('carrier_routes').select('*').order('origin').order('destination');routes=r||routes;enhanceRouteList()}
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
