import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
let selectedOption=0;
let options=[];

function formatDuration(seconds){const m=Math.round(seconds/60),h=Math.floor(m/60),rm=m%60;return h?`${h} h ${rm?`${rm} min`:''}`:`${m} min`}
function uniqNames(arr){const seen=new Set();return arr.filter(x=>{const k=String(x||'').trim().toLowerCase();if(!k||seen.has(k))return false;seen.add(k);return true})}
function selectedStops(){return [...document.querySelectorAll('#routeStops input[type="checkbox"]:checked')].map(x=>x.value)}
function renderStops(stops){const box=$('routeStops');if(!box)return;box.innerHTML=uniqNames(stops).map(name=>`<label style="display:inline-flex;align-items:center;gap:6px;border:1px solid #3a3a40;background:#1b1b1f;border-radius:999px;padding:7px 10px;cursor:pointer"><input type="checkbox" checked value="${esc(name)}"><span>${esc(name)}</span></label>`).join('')}
function renderAlternatives(){const box=$('routeAlternatives');if(!box)return;box.innerHTML=options.map((o,i)=>`<button type="button" data-server-route="${i}" style="text-align:left;border:1px solid ${i===selectedOption?'#d51f27':'#35353b'};background:${i===selectedOption?'#231517':'#1b1b1f'};color:#fff;border-radius:10px;padding:10px 12px"><b>Ruta ${i+1}</b> · ${(o.distance/1000).toFixed(0)} km · ${formatDuration(o.duration)}<div class="sub" style="margin-top:4px">${o.stops?.length?o.stops.join(' · '):'Sin localidades intermedias detectadas'}</div></button>`).join('');box.querySelectorAll('[data-server-route]').forEach(b=>b.onclick=()=>{selectedOption=Number(b.dataset.serverRoute);renderAlternatives();renderStops(options[selectedOption]?.stops||[])})}
async function searchRoute(e){
  e.preventDefault();e.stopImmediatePropagation();
  const origin=$('routeOrigin')?.value.trim(),destination=$('routeDestination')?.value.trim(),status=$('routeSuggestStatus'),btn=$('findRouteBtn');
  if(!origin||!destination){alert('Ingresá origen y destino primero.');return}
  btn.disabled=true;status.textContent='Buscando ruta y localidades…';options=[];renderAlternatives();renderStops([]);
  try{
    const {data,error}=await sb.functions.invoke('carrier-route-suggest',{body:{origin,destination}});
    if(error)throw new Error(error.message||'No se pudo consultar la ruta');
    if(data?.error)throw new Error(data.error);
    options=data?.routes||[];
    if(!options.length)throw new Error('No encontré rutas disponibles');
    selectedOption=0;renderAlternatives();renderStops(options[0].stops||[]);
    status.textContent=`Encontré ${options.length} ruta${options.length===1?'':'s'} posible${options.length===1?'':'s'}. Marcá o desmarcá las localidades que quieras guardar.`;
  }catch(err){status.textContent=`No pude sugerir la ruta automáticamente: ${err.message||'error de conexión'}. Podés agregar las localidades manualmente.`}
  finally{btn.disabled=false}
}
function attach(){const btn=$('findRouteBtn');if(!btn||btn.dataset.serverRouteFix==='1')return false;btn.dataset.serverRouteFix='1';btn.addEventListener('click',searchRoute,true);return true}
const obs=new MutationObserver(()=>attach());obs.observe(document.body,{childList:true,subtree:true});attach();
