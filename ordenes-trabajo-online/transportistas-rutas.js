import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

let routeOptions=[];
let selectedOption=0;
let routeMap=new Map();
let carrierRouteMap=new Map();
let applyingFilter=false;

function normalizeName(v){return String(v||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function uniqNames(arr){const seen=new Set();return arr.filter(x=>{const k=normalizeName(x);if(!k||seen.has(k))return false;seen.add(k);return true})}
function routeText(r){return r?`${r.origin} → ${r.destination}`:''}
function formatDuration(seconds){const m=Math.round(seconds/60),h=Math.floor(m/60),rm=m%60;return h?`${h} h ${rm?`${rm} min`:''}`:`${m} min`}
function kmBetween(a,b){const R=6371,toRad=x=>x*Math.PI/180;const dLat=toRad(b[1]-a[1]),dLon=toRad(b[0]-a[0]);const la1=toRad(a[1]),la2=toRad(b[1]);const x=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function pointSegmentKm(p,a,b){
  const lat0=p[1]*Math.PI/180, kx=111.32*Math.cos(lat0), ky=110.57;
  const px=p[0]*kx,py=p[1]*ky,ax=a[0]*kx,ay=a[1]*ky,bx=b[0]*kx,by=b[1]*ky;
  const dx=bx-ax,dy=by-ay;const l2=dx*dx+dy*dy;if(!l2)return Math.hypot(px-ax,py-ay);
  const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2));return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
}
function nearestOnRoute(point,coords){
  let best=Infinity,index=0;for(let i=0;i<coords.length-1;i++){const d=pointSegmentKm(point,coords[i],coords[i+1]);if(d<best){best=d;index=i}}return {distance:best,index};
}

async function refreshRouteMaps(){
  const [{data:routes},{data:carriers}]=await Promise.all([
    sb.from('carrier_routes').select('id,origin,destination,intermediate_stops'),
    sb.from('carriers').select('id,route_id')
  ]);
  routeMap=new Map((routes||[]).map(r=>[Number(r.id),r]));
  carrierRouteMap=new Map((carriers||[]).map(c=>[Number(c.id),Number(c.route_id)||null]));
  enhanceRouteList();
  applyLocalityFilter();
}

function ensureUI(){
  if(!$('carriersApp')||$('routeLocalitySearch'))return false;
  const filters=$('carrierSearch')?.parentElement;
  if(filters){
    const input=document.createElement('input');input.id='routeLocalitySearch';input.className='spares-input';input.placeholder='Buscar localidad del recorrido...';input.addEventListener('input',applyLocalityFilter);filters.appendChild(input);
  }
  const modal=$('routeModal')?.querySelector('.spares-dialog');
  if(!modal)return false;
  const origin=$('routeOrigin'),dest=$('routeDestination');
  if(origin&&dest){
    const grid=origin.closest('.spares-grid');
    grid.insertAdjacentHTML('afterend',`
      <div id="routeSuggestBox" style="margin-top:14px;padding:14px;border:1px solid #303036;border-radius:12px;background:#151518">
        <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap">
          <div><b>Localidades por donde pasa</b><div class="sub">Buscá la ruta y elegí las localidades que querés guardar.</div></div>
          <button class="btn dark" id="findRouteBtn" type="button">Buscar ruta</button>
        </div>
        <div id="routeSuggestStatus" class="sub" style="margin-top:10px"></div>
        <div id="routeAlternatives" style="display:grid;gap:8px;margin-top:10px"></div>
        <div id="routeStops" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"></div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <input id="manualStopInput" class="spares-input" style="flex:1;min-width:190px" placeholder="Agregar localidad manualmente">
          <button class="btn dark" id="manualStopBtn" type="button">+ Agregar</button>
        </div>
        <div class="sub" style="margin-top:9px">Rutas y localidades basadas en datos de OpenStreetMap.</div>
      </div>`);
  }
  $('findRouteBtn')?.addEventListener('click',findSuggestedRoutes);
  $('manualStopBtn')?.addEventListener('click',addManualStop);
  $('manualStopInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addManualStop()}});
  interceptAddRoute();
  new MutationObserver(()=>{enhanceRouteList();applyLocalityFilter()}).observe($('routeList'),{childList:true,subtree:true});
  new MutationObserver(()=>applyLocalityFilter()).observe($('carrierRows'),{childList:true,subtree:true});
  if($('favoriteCarrierRows'))new MutationObserver(()=>applyLocalityFilter()).observe($('favoriteCarrierRows'),{childList:true,subtree:true});
  refreshRouteMaps();
  return true;
}

function selectedStops(){return [...document.querySelectorAll('#routeStops input[type="checkbox"]:checked')].map(x=>x.value)}
function renderStops(stops){
  const box=$('routeStops');if(!box)return;
  box.innerHTML=uniqNames(stops).map(name=>`<label style="display:inline-flex;align-items:center;gap:6px;border:1px solid #3a3a40;background:#1b1b1f;border-radius:999px;padding:7px 10px;cursor:pointer"><input type="checkbox" checked value="${esc(name)}"><span>${esc(name)}</span></label>`).join('');
}
function addManualStop(){
  const inp=$('manualStopInput');const name=inp?.value.trim();if(!name)return;
  const current=selectedStops();current.push(name);renderStops(current);inp.value='';
}
function renderAlternatives(){
  const box=$('routeAlternatives');if(!box)return;
  box.innerHTML=routeOptions.map((o,i)=>`<button type="button" data-route-option="${i}" style="text-align:left;border:1px solid ${i===selectedOption?'#d51f27':'#35353b'};background:${i===selectedOption?'#231517':'#1b1b1f'};color:#fff;border-radius:10px;padding:10px 12px"><b>Ruta ${i+1}</b> · ${(o.distance/1000).toFixed(0)} km · ${formatDuration(o.duration)}<div class="sub" style="margin-top:4px">${o.stops.length?o.stops.join(' · '):'Sin localidades intermedias detectadas'}</div></button>`).join('');
  box.querySelectorAll('[data-route-option]').forEach(b=>b.onclick=()=>{selectedOption=Number(b.dataset.routeOption);renderAlternatives();renderStops(routeOptions[selectedOption]?.stops||[])});
}

async function geocode(name){
  const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ar&q=${encodeURIComponent(name+', Argentina')}`;
  const r=await fetch(url,{headers:{'Accept':'application/json'}});if(!r.ok)throw new Error('No se pudo ubicar '+name);const j=await r.json();if(!j.length)throw new Error('No encontré '+name+' en Argentina');return [Number(j[0].lon),Number(j[0].lat)];
}
async function overpassSettlements(coords){
  let minLon=Infinity,minLat=Infinity,maxLon=-Infinity,maxLat=-Infinity;coords.forEach(([lon,lat])=>{minLon=Math.min(minLon,lon);maxLon=Math.max(maxLon,lon);minLat=Math.min(minLat,lat);maxLat=Math.max(maxLat,lat)});
  const pad=.12;const s=minLat-pad,w=minLon-pad,n=maxLat+pad,e=maxLon+pad;
  const q=`[out:json][timeout:25];(node[place~"city|town|village"](${s},${w},${n},${e});way[place~"city|town|village"](${s},${w},${n},${e});relation[place~"city|town|village"](${s},${w},${n},${e}););out center tags;`;
  const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(q)});if(!r.ok)throw new Error('No pude obtener localidades cercanas');const j=await r.json();return (j.elements||[]).map(x=>({name:x.tags?.name,lon:x.lon??x.center?.lon,lat:x.lat??x.center?.lat})).filter(x=>x.name&&Number.isFinite(x.lon)&&Number.isFinite(x.lat));
}
function stopsForRoute(route,settlements,origin,destination){
  const coords=route.geometry.coordinates;const o=normalizeName(origin),d=normalizeName(destination);const byName=new Map();
  for(const s of settlements){const key=normalizeName(s.name);if(!key||key===o||key===d)continue;const near=nearestOnRoute([s.lon,s.lat],coords);if(near.distance>8)continue;const prev=byName.get(key);if(!prev||near.distance<prev.distance)byName.set(key,{name:s.name,index:near.index,distance:near.distance});}
  return [...byName.values()].sort((a,b)=>a.index-b.index).map(x=>x.name);
}
async function findSuggestedRoutes(){
  const origin=$('routeOrigin')?.value.trim(),destination=$('routeDestination')?.value.trim(),status=$('routeSuggestStatus');
  if(!origin||!destination){alert('Ingresá origen y destino primero.');return}
  $('findRouteBtn').disabled=true;status.textContent='Buscando ruta y localidades…';routeOptions=[];renderAlternatives();renderStops([]);
  try{
    const [a,b]=await Promise.all([geocode(origin),geocode(destination)]);
    const routeUrl=`https://router.project-osrm.org/route/v1/driving/${a[0]},${a[1]};${b[0]},${b[1]}?alternatives=2&overview=full&geometries=geojson`;
    const rr=await fetch(routeUrl);if(!rr.ok)throw new Error('No pude calcular la ruta');const rj=await rr.json();if(rj.code!=='Ok'||!rj.routes?.length)throw new Error('No encontré una ruta vial entre esas localidades');
    const allCoords=rj.routes.flatMap(r=>r.geometry.coordinates);const settlements=await overpassSettlements(allCoords);
    routeOptions=rj.routes.map(r=>({...r,stops:stopsForRoute(r,settlements,origin,destination)}));selectedOption=0;renderAlternatives();renderStops(routeOptions[0].stops);status.textContent=`Encontré ${routeOptions.length} ruta${routeOptions.length===1?'':'s'} posible${routeOptions.length===1?'':'s'}. Marcá o desmarcá las localidades que quieras guardar.`;
  }catch(e){status.textContent=`No pude sugerir la ruta automáticamente: ${e.message}. Podés agregar las localidades manualmente.`}
  finally{$('findRouteBtn').disabled=false}
}

function interceptAddRoute(){
  const btn=$('addRoute');if(!btn||btn.dataset.extendedRoute==='1')return;btn.dataset.extendedRoute='1';
  btn.addEventListener('click',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    const origin=$('routeOrigin').value.trim(),destination=$('routeDestination').value.trim();if(!origin||!destination){alert('Ingresá origen y destino.');return}
    const stops=selectedStops();
    const {error}=await sb.from('carrier_routes').insert({origin,destination,intermediate_stops:stops});
    if(error){alert(error.code==='23505'?'Ese recorrido ya existe.':error.message);return}
    $('routeOrigin').value='';$('routeDestination').value='';$('manualStopInput').value='';routeOptions=[];renderAlternatives();renderStops([]);$('routeSuggestStatus').textContent='';
    await refreshRouteMaps();
    const oldClose=$('closeRoutes');oldClose?.click();setTimeout(()=>document.getElementById('manageRoutes')?.click(),60);
  },true);
}

function enhanceRouteList(){
  const list=$('routeList');if(!list)return;
  list.querySelectorAll('.category-item').forEach(item=>{
    const id=Number(item.querySelector('.remove-route')?.dataset.id);const r=routeMap.get(id);if(!r||item.querySelector('.route-stops-extra'))return;
    const stops=Array.isArray(r.intermediate_stops)?r.intermediate_stops:[];if(!stops.length)return;
    const main=item.querySelector('span');if(main)main.insertAdjacentHTML('beforeend',`<div class="route-stops-extra sub" style="margin-top:5px">Pasa por: ${esc(stops.join(' · '))}</div>`);
  });
}

function carrierMatchesLocality(carrierId,q){
  if(!q)return true;const routeId=carrierRouteMap.get(carrierId),r=routeMap.get(routeId);if(!r)return false;
  const text=[r.origin,r.destination,...(Array.isArray(r.intermediate_stops)?r.intermediate_stops:[])].join(' ').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');return text.includes(normalizeName(q));
}
function applyLocalityFilter(){
  if(applyingFilter)return;applyingFilter=true;
  const q=$('routeLocalitySearch')?.value.trim()||'';
  document.querySelectorAll('.carrier-row').forEach(row=>{const id=Number(row.dataset.id);row.style.display=carrierMatchesLocality(id,q)?'':'none'});
  applyingFilter=false;
}

const boot=()=>{if(ensureUI())return;const obs=new MutationObserver(()=>{if(ensureUI())obs.disconnect()});obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>ensureUI(),700)};
boot();
