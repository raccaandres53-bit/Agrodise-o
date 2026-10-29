import { sb } from './supabase-client.js';

let aliases=new Map();
let currentAssetId=null;
let currentMeshName=null;
let mutating=false;

function ensureCss(){
  if(document.querySelector('link[href*="conocimiento-component-names.css"]'))return;
  const l=document.createElement('link');l.rel='stylesheet';l.href='./conocimiento-component-names.css?v=20261029-1840';document.head.appendChild(l);
}

function activeAssetId(){
  const el=document.querySelector('#kv5Assets .kv5-item.active');
  return el?Number(el.dataset.id):null;
}

async function loadAliases(){
  const assetId=activeAssetId();
  if(!assetId){aliases.clear();currentAssetId=null;decorate();return}
  if(assetId===currentAssetId&&aliases.size)return decorate();
  currentAssetId=assetId;
  const {data,error}=await sb.from('knowledge_component_names').select('mesh_name,display_name').eq('asset_id',assetId);
  if(error){console.error('No se pudieron cargar los nombres de componentes',error);return}
  aliases=new Map((data||[]).map(x=>[x.mesh_name,x.display_name]));
  decorate();
}

function ensureEditor(){
  const card=document.getElementById('kvproCard');
  if(!card||document.getElementById('kvcnEditor'))return;
  const actions=card.querySelector('.kvpro-card-actions');
  const box=document.createElement('div');
  box.id='kvcnEditor';box.className='kvcn-editor';
  box.innerHTML='<label>Nombre visible</label><div class="kvcn-row"><input id="kvcnInput" placeholder="Ej. Rodamiento delantero" disabled><button id="kvcnSave" type="button" disabled>Guardar nombre</button></div><div class="kvcn-help">El nombre interno del GLB se conserva para que los instructivos sigan funcionando.</div>';
  card.insertBefore(box,actions||null);
  document.getElementById('kvcnSave').onclick=saveAlias;
  document.getElementById('kvcnInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();saveAlias()}});
  syncEditor();
}

function syncEditor(){
  const input=document.getElementById('kvcnInput'),save=document.getElementById('kvcnSave');
  if(!input||!save)return;
  if(!currentMeshName){input.value='';input.disabled=true;save.disabled=true;return}
  input.disabled=false;save.disabled=false;input.value=aliases.get(currentMeshName)||currentMeshName;
}

async function saveAlias(){
  const assetId=activeAssetId();
  const input=document.getElementById('kvcnInput');
  if(!assetId||!currentMeshName||!input)return;
  const displayName=input.value.trim();
  if(!displayName)return alert('Ingresá un nombre para la pieza.');
  const {error}=await sb.from('knowledge_component_names').upsert({asset_id:assetId,mesh_name:currentMeshName,display_name:displayName,updated_at:new Date().toISOString()},{onConflict:'asset_id,mesh_name'});
  if(error)return alert('No se pudo guardar el nombre: '+error.message);
  aliases.set(currentMeshName,displayName);
  decorate();
  const name=document.getElementById('kvproName');
  if(name){mutating=true;name.dataset.kvInternalName=currentMeshName;name.textContent=displayName;mutating=false}
}

function decorateLegacyList(){
  document.querySelectorAll('#kv5Components .kv5-component').forEach(btn=>{
    const internal=btn.dataset.kvInternalName||btn.textContent.trim();
    if(!internal)return;
    btn.dataset.kvInternalName=internal;
    const alias=aliases.get(internal);
    if(alias){btn.dataset.kvAlias=alias;btn.title=internal}else{delete btn.dataset.kvAlias;btn.title=''}
  });
}

function decorateStepSelect(){
  const sel=document.getElementById('kv5StepComponent');
  if(!sel)return;
  Array.from(sel.options).forEach(opt=>{
    if(!opt.value)return;
    const alias=aliases.get(opt.value);
    opt.textContent=alias||opt.value;
  });
}

function decorateCard(){
  ensureEditor();
  const name=document.getElementById('kvproName');
  if(!name||mutating)return;
  const shown=name.textContent.trim();
  if(shown==='Tocá una pieza'){
    currentMeshName=null;delete name.dataset.kvInternalName;syncEditor();return;
  }
  const internal=name.dataset.kvInternalName||shown;
  if(!aliases.has(internal)&&aliases.has(shown)===false&&shown!==currentMeshName){currentMeshName=internal}
  if(currentMeshName&&aliases.has(currentMeshName)){
    const alias=aliases.get(currentMeshName);
    if(name.textContent!==alias){mutating=true;name.dataset.kvInternalName=currentMeshName;name.textContent=alias;mutating=false}
  }
  syncEditor();
}

function decorate(){decorateLegacyList();decorateStepSelect();decorateCard()}

function captureSelection(e){
  const c=e.target.closest?.('#kv5Components .kv5-component');
  if(c){currentMeshName=c.dataset.kvInternalName||c.textContent.trim();setTimeout(decorateCard,20);return}
  const canvas=e.target.closest?.('#kvproCanvas canvas');
  if(canvas){
    setTimeout(()=>{
      const name=document.getElementById('kvproName');
      if(!name)return;
      const shown=name.dataset.kvInternalName||name.textContent.trim();
      if(shown&&shown!=='Tocá una pieza')currentMeshName=shown;
      decorateCard();
    },40);
  }
}

document.addEventListener('pointerup',captureSelection,true);
document.addEventListener('click',e=>{
  if(e.target.closest?.('.kv5-tab[data-tab="model"]')||e.target.closest?.('#kv5Assets .kv5-item'))setTimeout(loadAliases,120);
  if(e.target.closest?.('.kv5-edit-step'))setTimeout(()=>{loadAliases();decorateStepSelect()},80);
},true);

const observer=new MutationObserver(()=>{
  if(mutating)return;
  ensureEditor();
  const assetId=activeAssetId();
  if(assetId&&assetId!==currentAssetId)loadAliases();
  decorate();
});
observer.observe(document.body,{childList:true,subtree:true});

ensureCss();
setTimeout(loadAliases,700);
