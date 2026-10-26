import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
let carriers=[],routes=[],editingCarrierId=null;
let carrierSort={key:'name',dir:'asc'};

function digitsOnly(v){return String(v||'').replace(/\D/g,'')}
function whatsappHref(v){const d=digitsOnly(v);return d?`https://wa.me/${d}`:''}
function phoneHref(v){const p=String(v||'').trim();return p?`tel:${p.replace(/\s/g,'')}`:''}
function routeLabel(r){return r?`${r.origin} → ${r.destination}`:'Sin recorrido'}
function routeColor(value){
  const palette=['#d81f26','#2563eb','#16a34a','#f59e0b','#7c3aed','#0891b2','#db2777','#ea580c','#4f46e5','#65a30d'];
  const key=String(value||'sin-recorrido');let hash=0;for(let i=0;i<key.length;i++)hash=(hash*31+key.charCodeAt(i))>>>0;return palette[hash%palette.length];
}
function contrastColor(hex){const c=hex.replace('#','');const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);return((r*299+g*587+b*114)/1000)>=145?'#111':'#fff'}
function routeBadge(r){if(!r)return '—';const text=routeLabel(r),color=routeColor(text);return `<span style="background:${color};color:${contrastColor(color)};padding:4px 10px;border-radius:999px;font-weight:700;display:inline-block">${esc(text)}</span>`}
function phoneActions(c){
  const number=c.phone||c.whatsapp||'';if(!number)return '';
  const wa=whatsappHref(number),tel=phoneHref(number);
  return `<span style="display:inline-flex;gap:5px;margin-left:8px;vertical-align:middle">
    <a href="${wa}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Abrir WhatsApp" style="width:30px;height:30px;border-radius:8px;background:#1f8f4e;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-size:15px">💬</a>
    <a href="${esc(tel)}" onclick="event.stopPropagation()" title="Llamar" style="width:30px;height:30px;border-radius:8px;background:#2c2c31;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-size:15px">📞</a>
  </span>`;
}

function init(){
  if(!$('modulePicker')||$('goCarriers'))return false;
  const cards=document.querySelector('#modulePicker .module-cards');if(!cards)return false;
  cards.insertAdjacentHTML('beforeend',`<button class="module-card" id="goCarriers"><div class="module-icon">🚚</div><div class="module-name">Transportistas</div><div class="module-desc">Transportistas, recorridos y contactos.</div></button>`);
  document.body.insertAdjacentHTML('beforeend',`
  <div id="carriersApp" class="spares-app hidden"><div class="spares-shell">
    <aside class="spares-side"><div class="brand">AGRO<b>DISEÑO</b></div><div class="sub">Módulo de transportistas</div>
      <div class="spares-nav"><button id="carriersHomeBtn">▣ Transportistas</button><button id="routesBtn">⇄ Recorridos</button></div>
      <div class="spares-side-bottom"><button class="switch-module" id="carriersSwitch">← Cambiar módulo</button><button class="switch-module" id="carriersLogout">Cerrar sesión</button></div>
    </aside>
    <main class="spares-main">
      <div class="spares-toolbar"><div><h1 style="margin:0">Transportistas</h1><div class="sub">Directorio y recorridos habituales</div></div><div class="spares-toolbar-actions"><button class="btn dark" id="manageRoutes">Recorridos</button><button class="btn red" id="newCarrier">+ Nuevo transportista</button></div></div>
      <div class="spares-filters"><input id="carrierSearch" class="spares-input" placeholder="Buscar por nombre, CUIT/CUIL, email, teléfono o dirección..."><select id="routeFilter" class="spares-select"><option value="">Todos los recorridos</option></select></div>
      <div id="carrierCount" class="spares-count"></div>
      <div id="favoriteCarriersSection" style="margin:18px 0 24px"><h2 style="font-size:17px;margin:0 0 10px">★ Favoritos</h2><div class="spares-table-wrap"><table class="spares-table"><thead><tr><th style="width:46px"></th><th id="sortCarrierFav" style="cursor:pointer">Transportista ↕</th><th>Teléfono / WhatsApp</th><th id="sortRouteFav" style="cursor:pointer">Recorrido ↕</th><th>Dirección</th></tr></thead><tbody id="favoriteCarrierRows"></tbody></table></div></div>
      <div><h2 style="font-size:17px;margin:0 0 10px">Todos los transportistas</h2><div class="spares-table-wrap"><table class="spares-table"><thead><tr><th style="width:46px"></th><th id="sortCarrier" style="cursor:pointer">Transportista ↕</th><th>Teléfono / WhatsApp</th><th id="sortRoute" style="cursor:pointer">Recorrido ↕</th><th>Dirección</th></tr></thead><tbody id="carrierRows"></tbody></table></div></div>
    </main>
  </div></div>

  <div class="spares-modal" id="carrierModal"><div class="spares-dialog" style="width:min(920px,100%)">
    <div class="head"><div><h2 id="carrierModalTitle" style="margin:0">Transportista</h2><div class="sub">Datos comerciales, contacto, recorrido y pago</div></div><button class="close" id="closeCarrier">×</button></div>
    <div class="sec"><div class="sectop"><b>Datos generales</b></div><div class="spares-grid">
      <div class="spares-field"><label>Nombre</label><input id="carrierName" placeholder="Nombre del transportista"></div>
      <div class="spares-field"><label>CUIT / CUIL</label><input id="carrierTaxId" placeholder="Ej. 20-12345678-9"></div>
      <div class="spares-field"><label>Recorrido</label><select id="carrierRoute"></select></div>
      <div class="spares-field" style="grid-column:1/-1"><label>Dirección</label><input id="carrierAddress" placeholder="Localidad, calle, dirección..."></div>
    </div></div>
    <div class="sec"><div class="sectop"><b>Contacto</b></div><div class="spares-grid">
      <div class="spares-field"><label>Email</label><input id="carrierEmail" type="email" placeholder="transportista@empresa.com"></div>
      <div class="spares-field"><label>Teléfono / WhatsApp</label><input id="carrierPhone" type="tel" placeholder="Ej. 5493562123456"></div>
    </div></div>
    <div class="sec"><div class="sectop"><b>Datos bancarios</b></div><div class="spares-grid">
      <div class="spares-field"><label>Banco</label><input id="carrierBankName" placeholder="Nombre del banco"></div>
      <div class="spares-field"><label>Titular de la cuenta</label><input id="carrierBankHolder" placeholder="Titular"></div>
      <div class="spares-field"><label>CBU / CVU</label><input id="carrierBankCbu" inputmode="numeric" placeholder="22 dígitos"></div>
      <div class="spares-field"><label>Alias</label><input id="carrierBankAlias" placeholder="alias.de.pago"></div>
    </div></div>
    <div class="spares-actions"><button class="btn danger" id="deleteCarrier">Eliminar</button><button class="btn dark" id="cancelCarrier">Cancelar</button><button class="btn red" id="saveCarrier">Guardar transportista</button></div>
  </div></div>

  <div class="spares-modal" id="routeModal"><div class="spares-dialog">
    <div class="head"><div><h2 style="margin:0">Recorridos</h2><div class="sub">Creá pares de origen y destino para filtrar transportistas.</div></div><button class="close" id="closeRoutes">×</button></div>
    <div class="spares-grid" style="margin-top:15px"><div class="spares-field"><label>Origen</label><input id="routeOrigin" placeholder="Ej. Morteros"></div><div class="spares-field"><label>Destino</label><input id="routeDestination" placeholder="Ej. Rafaela"></div></div>
    <div style="display:flex;justify-content:flex-end;margin:12px 0 18px"><button class="btn red" id="addRoute">+ Agregar recorrido</button></div><div id="routeList" class="category-list"></div>
  </div></div>`);
  bind();return true;
}

function bind(){
  $('goCarriers').onclick=openCarriers;$('carriersSwitch').onclick=showPicker;$('carriersLogout').onclick=async()=>{await sb.auth.signOut();location.reload()};$('carriersHomeBtn').onclick=()=>{};
  $('newCarrier').onclick=()=>openCarrier();$('closeCarrier').onclick=$('cancelCarrier').onclick=()=>$('carrierModal').classList.remove('show');$('saveCarrier').onclick=saveCarrier;$('deleteCarrier').onclick=deleteCarrier;
  $('carrierSearch').oninput=renderCarriers;$('routeFilter').onchange=renderCarriers;
  $('sortCarrier').onclick=$('sortCarrierFav').onclick=()=>toggleSort('name');$('sortRoute').onclick=$('sortRouteFav').onclick=()=>toggleSort('route');
  $('manageRoutes').onclick=$('routesBtn').onclick=openRoutes;$('closeRoutes').onclick=()=>$('routeModal').classList.remove('show');$('addRoute').onclick=addRoute;
  $('routeOrigin').addEventListener('keydown',e=>{if(e.key==='Enter')$('routeDestination').focus()});$('routeDestination').addEventListener('keydown',e=>{if(e.key==='Enter')addRoute()});
  $('carrierModal').onclick=e=>{if(e.target.id==='carrierModal')$('carrierModal').classList.remove('show')};$('routeModal').onclick=e=>{if(e.target.id==='routeModal')$('routeModal').classList.remove('show')};
}
function showPicker(){$('carriersApp').classList.add('hidden');$('sparesApp')?.classList.add('hidden');$('shell')?.classList.add('hidden');$('modulePicker').classList.remove('hidden')}
async function openCarriers(){$('modulePicker').classList.add('hidden');$('sparesApp')?.classList.add('hidden');$('shell')?.classList.add('hidden');$('carriersApp').classList.remove('hidden');await loadData()}
function toggleSort(key){if(carrierSort.key===key)carrierSort.dir=carrierSort.dir==='asc'?'desc':'asc';else carrierSort={key,dir:'asc'};renderCarriers()}
function sortHeader(id,key,label){const e=$(id);if(!e)return;e.textContent=label+(carrierSort.key===key?(carrierSort.dir==='asc'?' ↑':' ↓'):' ↕')}

async function loadData(){
  const [{data:r,error:re},{data:c,error:ce}]=await Promise.all([sb.from('carrier_routes').select('*').order('origin').order('destination'),sb.from('carriers').select('*,carrier_routes(id,origin,destination)').order('name')]);
  if(re||ce){alert('No se pudieron cargar los transportistas. '+(re?.message||ce?.message||''));return}routes=r||[];carriers=c||[];fillRouteSelects();renderCarriers();renderRouteList();
}
function fillRouteSelects(){const opts=routes.map(r=>`<option value="${r.id}">${esc(routeLabel(r))}</option>`).join('');$('routeFilter').innerHTML='<option value="">Todos los recorridos</option>'+opts;$('carrierRoute').innerHTML='<option value="">Sin recorrido</option>'+opts}
function filteredRows(){
  const q=($('carrierSearch').value||'').trim().toLowerCase(),route=$('routeFilter').value||'';
  const rows=carriers.filter(c=>{const text=[c.name,c.tax_id,c.contact,c.phone,c.whatsapp,c.address,c.bank_name,c.bank_alias,c.bank_cbu_cvu,c.carrier_routes?.origin,c.carrier_routes?.destination].join(' ').toLowerCase();return(!q||text.includes(q))&&(!route||String(c.route_id)===route)});
  return rows.sort((a,b)=>{const dir=carrierSort.dir==='asc'?1:-1;if(carrierSort.key==='route'){const av=routeLabel(a.carrier_routes).toLowerCase(),bv=routeLabel(b.carrier_routes).toLowerCase();const x=av.localeCompare(bv,'es',{sensitivity:'base'});return x!==0?x*dir:(a.name||'').localeCompare(b.name||'','es',{sensitivity:'base'})}return(a.name||'').localeCompare(b.name||'','es',{sensitivity:'base'})*dir});
}
function rowHtml(c){const n=c.phone||c.whatsapp||'';return `<tr class="carrier-row" data-id="${c.id}"><td><button class="favorite-carrier" data-id="${c.id}" title="${c.is_favorite?'Quitar de favoritos':'Agregar a favoritos'}" style="border:0;background:none;font-size:22px;cursor:pointer;color:${c.is_favorite?'#f4b400':'#777'}">${c.is_favorite?'★':'☆'}</button></td><td><b>${esc(c.name)}</b>${c.tax_id?`<div class="sub">CUIT/CUIL ${esc(c.tax_id)}</div>`:''}</td><td>${n?`<span>${esc(n)}</span>${phoneActions(c)}`:'—'}</td><td>${routeBadge(c.carrier_routes)}</td><td>${esc(c.address||'')}</td></tr>`}
function renderCarriers(){
  const rows=filteredRows(),fav=rows.filter(c=>c.is_favorite);$('carrierCount').textContent=`${rows.length} transportista${rows.length===1?'':'s'}`;
  sortHeader('sortCarrier','name','Transportista');sortHeader('sortCarrierFav','name','Transportista');sortHeader('sortRoute','route','Recorrido');sortHeader('sortRouteFav','route','Recorrido');
  $('favoriteCarriersSection').style.display=fav.length?'':'none';$('favoriteCarrierRows').innerHTML=fav.map(rowHtml).join('');$('carrierRows').innerHTML=rows.length?rows.map(rowHtml).join(''):`<tr><td colspan="5" class="spares-empty">No hay transportistas para mostrar.</td></tr>`;
  document.querySelectorAll('.favorite-carrier').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFavorite(+b.dataset.id)});document.querySelectorAll('.carrier-row').forEach(r=>r.onclick=()=>openCarrier(+r.dataset.id));
}
async function toggleFavorite(id){const c=carriers.find(x=>x.id===id);if(!c)return;const{error}=await sb.from('carriers').update({is_favorite:!c.is_favorite,updated_at:new Date().toISOString()}).eq('id',id);if(error){alert(error.message);return}c.is_favorite=!c.is_favorite;renderCarriers()}
function openCarrier(id=null){editingCarrierId=id;const c=id?carriers.find(x=>x.id===id):null;$('carrierModalTitle').textContent=id?'Editar transportista':'Nuevo transportista';$('carrierName').value=c?.name||'';$('carrierTaxId').value=c?.tax_id||'';$('carrierEmail').value=c?.contact||'';$('carrierPhone').value=c?.phone||c?.whatsapp||'';$('carrierRoute').value=c?.route_id||'';$('carrierAddress').value=c?.address||'';$('carrierBankName').value=c?.bank_name||'';$('carrierBankHolder').value=c?.bank_holder||'';$('carrierBankCbu').value=c?.bank_cbu_cvu||'';$('carrierBankAlias').value=c?.bank_alias||'';$('deleteCarrier').style.display=id?'':'none';$('carrierModal').classList.add('show')}
async function saveCarrier(){const name=$('carrierName').value.trim();if(!name){alert('Ingresá el nombre del transportista.');return}const email=$('carrierEmail').value.trim();if(email&&!$('carrierEmail').checkValidity()){alert('Ingresá un email válido.');return}const phone=$('carrierPhone').value.trim()||null;const row={name,tax_id:$('carrierTaxId').value.trim()||null,contact:email||null,phone,whatsapp:phone,route_id:$('carrierRoute').value?Number($('carrierRoute').value):null,address:$('carrierAddress').value.trim()||null,bank_name:$('carrierBankName').value.trim()||null,bank_holder:$('carrierBankHolder').value.trim()||null,bank_cbu_cvu:$('carrierBankCbu').value.trim()||null,bank_alias:$('carrierBankAlias').value.trim()||null,updated_at:new Date().toISOString()};const res=editingCarrierId?await sb.from('carriers').update(row).eq('id',editingCarrierId):await sb.from('carriers').insert(row);if(res.error){alert(res.error.message);return}$('carrierModal').classList.remove('show');await loadData()}
async function deleteCarrier(){if(!editingCarrierId||!confirm('¿Eliminar este transportista?'))return;const{error}=await sb.from('carriers').delete().eq('id',editingCarrierId);if(error){alert(error.message);return}$('carrierModal').classList.remove('show');await loadData()}
function openRoutes(){renderRouteList();$('routeModal').classList.add('show')}
function renderRouteList(){$('routeList').innerHTML=routes.length?routes.map(r=>`<div class="category-item"><span><b>${esc(r.origin)} → ${esc(r.destination)}</b></span><button class="mini remove-route" data-id="${r.id}">Eliminar</button></div>`).join(''):'<div class="spares-empty">Todavía no hay recorridos creados.</div>';document.querySelectorAll('.remove-route').forEach(b=>b.onclick=()=>removeRoute(+b.dataset.id))}
async function addRoute(){const origin=$('routeOrigin').value.trim(),destination=$('routeDestination').value.trim();if(!origin||!destination){alert('Ingresá origen y destino.');return}const{error}=await sb.from('carrier_routes').insert({origin,destination});if(error){alert(error.code==='23505'?'Ese recorrido ya existe.':error.message);return}$('routeOrigin').value='';$('routeDestination').value='';await loadData();renderRouteList()}
async function removeRoute(id){const r=routes.find(x=>x.id===id);if(!r||!confirm(`¿Eliminar el recorrido ${routeLabel(r)}? Los transportistas quedarán sin recorrido.`))return;const{error}=await sb.from('carrier_routes').delete().eq('id',id);if(error){alert(error.message);return}await loadData();renderRouteList()}

if(!init()){
  const obs=new MutationObserver(()=>{if(init())obs.disconnect()});obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>init(),500);
}
