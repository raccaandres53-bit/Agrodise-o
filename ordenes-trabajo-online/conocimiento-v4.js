import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';
import * as THREE from 'https://esm.sh/three@0.181.1';
import { OrbitControls } from 'https://esm.sh/three@0.181.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.181.1/examples/jsm/loaders/GLTFLoader.js';

const sb=createClient('https://dcmlbriqiybegmwanwlf.supabase.co','sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const BUCKET='knowledge-models';
let assets=[],points=[],currentAsset=null;
let scene,camera,renderer,controls,rootModel,raycaster,pointer,selectedMesh,objectUrl;
let parts=[],downPoint=null;

function buildUI(){
  if($('knowledgeApp')) return;
  if(!document.querySelector('link[href*="conocimiento.css"]')) document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="./conocimiento.css?v=20261028-0075">');
  document.body.insertAdjacentHTML('beforeend',`
  <div id="knowledgeApp" class="knowledge-app"><div class="knowledge-shell">
    <aside class="knowledge-side">
      <div><div class="brand">AGRO<b>DISEÑO</b></div><div class="knowledge-sub">Conocimiento técnico</div></div>
      <button class="knowledge-btn red" id="knowledgeNewAsset">+ Nueva máquina / pieza</button>
      <div class="knowledge-list" id="knowledgeAssetList"></div>
      <div class="knowledge-side-bottom"><button class="knowledge-btn dark" id="knowledgeBack">🏠 Inicio</button></div>
    </aside>
    <main class="knowledge-main">
      <div class="knowledge-top">
        <div><h1 id="knowledgeTitle" style="margin:0">Conocimiento técnico</h1><div id="knowledgeSubtitle" class="knowledge-sub">Seleccioná o creá una máquina/pieza.</div></div>
        <div class="knowledge-top-actions"><button class="knowledge-btn dark" id="knowledgeMobileBack">🏠 Inicio</button><button class="knowledge-btn dark" id="knowledgeEditAsset">Editar ficha</button><button class="knowledge-btn red" id="knowledgeLoadModel">Cargar / reemplazar GLB</button><input id="knowledgeModelFile" class="knowledge-upload" type="file" accept=".glb,model/gltf-binary,application/octet-stream"></div>
      </div>
      <div class="knowledge-grid">
        <section class="knowledge-card">
          <div class="knowledge-model-info"><b>Visor 3D interactivo</b><div class="knowledge-sub" id="knowledgeModelStatus">El modelo queda guardado y se abre automáticamente.</div></div>
          <div class="knowledge-viewer" id="knowledgeViewer"><div class="knowledge-empty" id="knowledgeViewerEmpty"><div><div style="font-size:46px">🧩</div><b>Seleccioná una ficha</b></div></div></div>
          <div class="knowledge-tools"><b>Despiece</b><input id="knowledgeExplode" type="range" min="0" max="100" value="0"><span id="knowledgeExplodeValue">0%</span><button class="knowledge-btn dark" id="knowledgeResetView">Centrar vista</button></div>
          <div class="knowledge-selected">Componente seleccionado: <b id="knowledgeSelectedComponent">General</b></div>
        </section>
        <section class="knowledge-card">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b>Componentes detectados</b><div class="knowledge-sub">También podés seleccionar una pieza desde esta lista.</div></div><button class="knowledge-btn red" id="knowledgeNewPoint">+ Punto</button></div>
          <div class="knowledge-points" id="knowledgeComponentList"></div>
          <div style="margin-top:18px"><b>Puntos técnicos</b><div class="knowledge-sub">Fallas, controles, desarme, medidas y advertencias.</div></div>
          <div class="knowledge-points" id="knowledgePointList"></div>
        </section>
      </div>
    </main>
  </div></div>
  <div id="knowledgeAssetModal" class="knowledge-modal"><div class="knowledge-dialog"><div class="head"><h2 id="knowledgeAssetModalTitle" style="margin:0">Nueva ficha</h2><button class="knowledge-close" data-close="knowledgeAssetModal">×</button></div><div class="knowledge-form"><label>Nombre de máquina o pieza<input id="knowledgeAssetName" placeholder="Ej. Reductor Brevini 2255"></label><label>Marca / modelo<input id="knowledgeAssetBrand"></label><label>Descripción<textarea id="knowledgeAssetDescription"></textarea></label><button class="knowledge-btn red" id="knowledgeSaveAsset">Guardar ficha</button></div></div></div>
  <div id="knowledgePointModal" class="knowledge-modal"><div class="knowledge-dialog"><div class="head"><h2 style="margin:0">Registrar conocimiento</h2><button class="knowledge-close" data-close="knowledgePointModal">×</button></div><div class="knowledge-form"><div class="knowledge-sub">Se asociará a: <b id="knowledgePointComponent">General</b></div><label>Tipo<select id="knowledgePointType"><option>Revisar</option><option>Rotura frecuente</option><option>Desarme</option><option>Armado</option><option>Medida</option><option>Advertencia</option><option>Lubricación</option><option>Repuesto</option></select></label><label>Título<input id="knowledgePointTitle"></label><label>Detalle<textarea id="knowledgePointDetails"></textarea></label><button class="knowledge-btn red" id="knowledgeSavePoint">Guardar punto técnico</button></div></div></div>`);
  bind(); init3D(); addCard();
}

function addCard(){
  const cards=document.querySelector('#modulePicker .module-cards');
  if(!cards||$('goKnowledge')) return false;
  cards.insertAdjacentHTML('beforeend','<button class="module-card" id="goKnowledge"><div class="module-icon">🧠</div><div class="module-name">Conocimiento</div><div class="module-desc">Modelos 3D, despiece, fallas y procedimientos del taller.</div></button>');
  $('goKnowledge').onclick=openKnowledge;
  return true;
}

function bind(){
  $('knowledgeBack').onclick=$('knowledgeMobileBack').onclick=showPicker;
  $('knowledgeNewAsset').onclick=()=>openAsset(false);
  $('knowledgeEditAsset').onclick=()=>openAsset(true);
  $('knowledgeLoadModel').onclick=()=>{ if(!currentAsset){alert('Primero seleccioná una ficha.');return;} $('knowledgeModelFile').click(); };
  $('knowledgeModelFile').onchange=e=>persistAndLoadModel(e.target.files?.[0]);
  $('knowledgeNewPoint').onclick=openPoint;
  $('knowledgeSaveAsset').onclick=saveAsset;
  $('knowledgeSavePoint').onclick=savePoint;
  $('knowledgeExplode').oninput=applyExplode;
  $('knowledgeResetView').onclick=fitCamera;
  document.querySelectorAll('.knowledge-close').forEach(b=>b.onclick=()=>$(b.dataset.close)?.classList.remove('show'));
  document.querySelectorAll('.knowledge-modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('show')});
}

function showPicker(){ $('knowledgeApp').classList.remove('show'); $('modulePicker')?.classList.remove('hidden'); }
async function openKnowledge(){
  $('modulePicker')?.classList.add('hidden'); $('shell')?.classList.add('hidden'); $('sparesApp')?.classList.add('hidden'); $('carriersApp')?.classList.add('hidden');
  $('knowledgeApp').classList.add('show'); resize(); await loadAssets();
}

async function loadAssets(){
  const {data,error}=await sb.from('knowledge_assets').select('*').order('name');
  if(error){alert('No se pudo cargar Conocimiento: '+error.message);return}
  assets=data||[]; renderAssets();
  if(currentAsset){ currentAsset=assets.find(a=>a.id===currentAsset.id)||null; if(currentAsset) await selectAsset(currentAsset.id,false); }
}
function renderAssets(){
  $('knowledgeAssetList').innerHTML=assets.length?assets.map(a=>`<button class="knowledge-item ${currentAsset?.id===a.id?'active':''}" data-id="${a.id}"><b>${esc(a.name)}</b>${a.brand_model?`<div class="knowledge-sub">${esc(a.brand_model)}</div>`:''}${a.model_storage_path?'<div class="knowledge-sub">● Modelo guardado</div>':''}</button>`).join(''):'<div class="knowledge-sub">Todavía no hay fichas.</div>';
  document.querySelectorAll('.knowledge-item').forEach(b=>b.onclick=()=>selectAsset(Number(b.dataset.id),true));
}
async function selectAsset(id,loadModel=true){
  currentAsset=assets.find(a=>a.id===id)||null; renderAssets(); clearModel();
  $('knowledgeTitle').textContent=currentAsset?.name||'Conocimiento técnico';
  $('knowledgeSubtitle').textContent=[currentAsset?.brand_model,currentAsset?.description].filter(Boolean).join(' · ')||'Ficha técnica';
  await loadPoints();
  if(!currentAsset){ setViewerMessage('Seleccioná una ficha.'); return; }
  if(loadModel && currentAsset.model_storage_path) await loadStoredModel(currentAsset.model_storage_path);
  else if(!currentAsset.model_storage_path) setViewerMessage('Esta ficha todavía no tiene un GLB guardado.');
}

function openAsset(edit){
  const a=edit?currentAsset:null; if(edit&&!a){alert('Primero seleccioná una ficha.');return}
  $('knowledgeAssetModalTitle').textContent=edit?'Editar ficha':'Nueva ficha';
  $('knowledgeAssetName').value=a?.name||''; $('knowledgeAssetBrand').value=a?.brand_model||''; $('knowledgeAssetDescription').value=a?.description||'';
  $('knowledgeAssetModal').dataset.editId=edit?String(a.id):''; $('knowledgeAssetModal').classList.add('show');
}
async function saveAsset(){
  const name=$('knowledgeAssetName').value.trim(); if(!name){alert('Ingresá un nombre.');return}
  const row={name,brand_model:$('knowledgeAssetBrand').value.trim()||null,description:$('knowledgeAssetDescription').value.trim()||null,updated_at:new Date().toISOString()};
  const id=Number($('knowledgeAssetModal').dataset.editId)||0;
  const res=id?await sb.from('knowledge_assets').update(row).eq('id',id).select().single():await sb.from('knowledge_assets').insert(row).select().single();
  if(res.error){alert(res.error.message);return}
  currentAsset=res.data; $('knowledgeAssetModal').classList.remove('show'); await loadAssets(); await selectAsset(currentAsset.id,true);
}

async function persistAndLoadModel(file){
  $('knowledgeModelFile').value=''; if(!file||!currentAsset)return;
  if(!file.name.toLowerCase().endsWith('.glb')){alert('Para guardar el modelo usá un archivo .GLB.');return}
  const path=`${currentAsset.id}/modelo.glb`;
  $('knowledgeModelStatus').textContent='Subiendo modelo al servidor...'; setViewerMessage('Subiendo GLB...');
  const {error:uploadError}=await sb.storage.from(BUCKET).upload(path,file,{upsert:true,contentType:file.type||'model/gltf-binary',cacheControl:'3600'});
  if(uploadError){console.error(uploadError);alert('No se pudo guardar el GLB: '+uploadError.message);$('knowledgeModelStatus').textContent='Error al guardar el modelo.';return}
  const {error:updateError}=await sb.from('knowledge_assets').update({model_file_name:file.name,model_storage_path:path,updated_at:new Date().toISOString()}).eq('id',currentAsset.id);
  if(updateError){alert('El GLB se subió, pero no se pudo vincular a la ficha: '+updateError.message);return}
  currentAsset.model_file_name=file.name; currentAsset.model_storage_path=path;
  assets=assets.map(a=>a.id===currentAsset.id?{...a,...currentAsset}:a); renderAssets();
  $('knowledgeModelStatus').textContent='Modelo guardado. Se abrirá automáticamente desde ahora.';
  await loadStoredModel(path);
}

async function loadStoredModel(path){
  clearModel(); setViewerMessage('Cargando modelo guardado...'); $('knowledgeModelStatus').textContent='Cargando modelo guardado...';
  const {data,error}=await sb.storage.from(BUCKET).download(path);
  if(error){console.error(error);setViewerMessage('No se pudo descargar el modelo guardado.');$('knowledgeModelStatus').textContent='No se pudo descargar el modelo.';return}
  if(objectUrl)URL.revokeObjectURL(objectUrl); objectUrl=URL.createObjectURL(data);
  await loadGLBFromUrl(objectUrl);
  $('knowledgeModelStatus').textContent='Modelo cargado desde el servidor.';
}

function setViewerMessage(text){ $('knowledgeViewerEmpty').style.display='grid'; $('knowledgeViewerEmpty').innerHTML=`<div><div style="font-size:42px">🧩</div><b>${esc(text)}</b></div>`; }
function loadGLBFromUrl(url){
  return new Promise(resolve=>{
    new GLTFLoader().load(url,gltf=>{ prepareModel(gltf.scene); resolve(true); },undefined,err=>{console.error(err);setViewerMessage('No se pudo abrir el GLB.');resolve(false)});
  });
}
function prepareModel(model){
  clearModel(); rootModel=model; scene.add(rootModel); rootModel.updateMatrixWorld(true);
  const totalBox=new THREE.Box3().setFromObject(rootModel),center=new THREE.Vector3(),size=new THREE.Vector3(); totalBox.getCenter(center); totalBox.getSize(size); const modelScale=Math.max(size.x,size.y,size.z)||1;
  parts=[]; let idx=0;
  rootModel.traverse(o=>{
    if(!o.isMesh)return; idx++; if(!o.name)o.name=`Componente ${idx}`;
    const worldCenter=new THREE.Vector3(); new THREE.Box3().setFromObject(o).getCenter(worldCenter);
    let dir=worldCenter.clone().sub(center); if(dir.lengthSq()<1e-6){const axes=[new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,-1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1)];dir=axes[(idx-1)%axes.length].clone()} dir.normalize();
    parts.push({mesh:o,baseWorld:o.getWorldPosition(new THREE.Vector3()),dir,modelScale});
  });
  $('knowledgeViewerEmpty').style.display='none'; $('knowledgeExplode').value='0'; $('knowledgeExplodeValue').textContent='0%'; setSelected(null); renderComponents(); fitCamera(); resize();
}
function renderComponents(){
  $('knowledgeComponentList').innerHTML=parts.length?parts.map((p,i)=>`<button class="knowledge-item knowledge-component" data-i="${i}" style="width:100%"><b>${esc(p.mesh.name||`Componente ${i+1}`)}</b></button>`).join(''):'<div class="knowledge-sub">No hay componentes cargados.</div>';
  document.querySelectorAll('.knowledge-component').forEach(b=>b.onclick=()=>setSelected(parts[Number(b.dataset.i)]?.mesh||null));
}

function init3D(){
  const host=$('knowledgeViewer'); scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(45,1,.01,10000); camera.position.set(4,3,6);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; host.appendChild(renderer.domElement);
  controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true;
  scene.add(new THREE.HemisphereLight(0xffffff,0x333344,2.2)); const key=new THREE.DirectionalLight(0xffffff,2.5); key.position.set(5,7,5); scene.add(key); const fill=new THREE.DirectionalLight(0xffffff,1.2); fill.position.set(-5,2,-4); scene.add(fill);
  raycaster=new THREE.Raycaster(); pointer=new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown',e=>{downPoint={x:e.clientX,y:e.clientY}});
  renderer.domElement.addEventListener('pointerup',e=>{if(!downPoint)return;const d=Math.hypot(e.clientX-downPoint.x,e.clientY-downPoint.y);downPoint=null;if(d<6)pickMesh(e)});
  window.addEventListener('resize',resize); renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)}); resize();
}
function resize(){ if(!renderer)return; const host=$('knowledgeViewer'); const w=host.clientWidth||600,h=host.clientHeight||420; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
function worldToLocalPosition(mesh,worldPos){ if(!mesh.parent)return worldPos.clone(); mesh.parent.updateMatrixWorld(true); return mesh.parent.worldToLocal(worldPos.clone()); }
function applyExplode(){
  if(!rootModel)return; const pct=Number($('knowledgeExplode').value)||0; $('knowledgeExplodeValue').textContent=pct+'%'; const amount=pct/100;
  parts.forEach(p=>{const target=p.baseWorld.clone().add(p.dir.clone().multiplyScalar(p.modelScale*amount*.7));p.mesh.position.copy(worldToLocalPosition(p.mesh,target));}); rootModel.updateMatrixWorld(true);
}
function fitCamera(){
  if(!rootModel)return; const box=new THREE.Box3().setFromObject(rootModel),center=new THREE.Vector3(),size=new THREE.Vector3(); box.getCenter(center); box.getSize(size); const max=Math.max(size.x,size.y,size.z)||1; const dist=max/Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*.85; camera.position.copy(center).add(new THREE.Vector3(dist*.8,dist*.55,dist)); controls.target.copy(center); camera.near=Math.max(max/1000,.001); camera.far=max*100; camera.updateProjectionMatrix(); controls.update();
}
function pickMesh(e){ if(!rootModel)return; const rect=renderer.domElement.getBoundingClientRect(); pointer.x=((e.clientX-rect.left)/rect.width)*2-1; pointer.y=-((e.clientY-rect.top)/rect.height)*2+1; raycaster.setFromCamera(pointer,camera); const hits=raycaster.intersectObject(rootModel,true).filter(h=>h.object?.isMesh&&h.object.visible); if(hits.length)setSelected(hits[0].object); }
function setSelected(mesh){
  if(selectedMesh?.userData.__originalMaterial){selectedMesh.material=selectedMesh.userData.__originalMaterial; delete selectedMesh.userData.__originalMaterial;}
  selectedMesh=mesh;
  if(mesh){mesh.userData.__originalMaterial=mesh.material;const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];const cloned=mats.map(m=>{const c=m.clone();if(c.emissive)c.emissive.setHex(0x7a1010);return c});mesh.material=Array.isArray(mesh.material)?cloned:cloned[0];$('knowledgeSelectedComponent').textContent=mesh.name||'Componente';}
  else $('knowledgeSelectedComponent').textContent='General';
}
function clearModel(){
  setSelected(null); if(rootModel){scene.remove(rootModel);rootModel.traverse(o=>{o.geometry?.dispose?.();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.())});rootModel=null;} parts=[]; if($('knowledgeComponentList'))$('knowledgeComponentList').innerHTML='<div class="knowledge-sub">No hay componentes cargados.</div>';
}

async function loadPoints(){ if(!currentAsset){points=[];renderPoints();return} const {data,error}=await sb.from('knowledge_points').select('*').eq('asset_id',currentAsset.id).order('created_at',{ascending:false}); if(error){alert(error.message);return} points=data||[]; renderPoints(); }
function renderPoints(){ $('knowledgePointList').innerHTML=points.length?points.map(p=>`<div class="knowledge-point"><span class="tag">${esc(p.point_type)}</span><b style="display:block">${esc(p.title)}</b><div class="knowledge-sub">${esc(p.component_name||'General')}</div>${p.details?`<div style="margin-top:7px;white-space:pre-wrap">${esc(p.details)}</div>`:''}</div>`).join(''):'<div class="knowledge-sub">Todavía no hay puntos técnicos.</div>'; }
function openPoint(){ if(!currentAsset){alert('Primero seleccioná una ficha.');return} $('knowledgePointComponent').textContent=selectedMesh?.name||'General'; $('knowledgePointTitle').value=''; $('knowledgePointDetails').value=''; $('knowledgePointModal').classList.add('show'); }
async function savePoint(){ const title=$('knowledgePointTitle').value.trim(); if(!title){alert('Ingresá un título.');return} const row={asset_id:currentAsset.id,component_name:selectedMesh?.name||'General',point_type:$('knowledgePointType').value,title,details:$('knowledgePointDetails').value.trim()||null,updated_at:new Date().toISOString()}; const {error}=await sb.from('knowledge_points').insert(row); if(error){alert(error.message);return} $('knowledgePointModal').classList.remove('show'); await loadPoints(); }

function boot(){ buildUI(); if(addCard())return; const o=new MutationObserver(()=>{if(addCard())o.disconnect()}); o.observe(document.body,{childList:true,subtree:true}); }
boot();