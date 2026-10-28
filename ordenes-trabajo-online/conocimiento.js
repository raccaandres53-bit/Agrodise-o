import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';
import * as THREE from 'https://esm.sh/three@0.181.1';
import { OrbitControls } from 'https://esm.sh/three@0.181.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.181.1/examples/jsm/loaders/GLTFLoader.js';

const sb=createClient('https://dcmlbriqiybegmwanwlf.supabase.co','sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

let assets=[];
let points=[];
let currentAsset=null;
let scene,camera,renderer,controls,rootModel,raycaster,pointer,selectedMesh;
let meshState=[];
let objectUrl=null;

function buildUI(){
  if($('knowledgeApp'))return;
  document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="./conocimiento.css?v=20261027-2315">');
  document.body.insertAdjacentHTML('beforeend',`
  <div id="knowledgeApp" class="knowledge-app">
    <div class="knowledge-shell">
      <aside class="knowledge-side">
        <div><div class="brand">AGRO<b>DISEÑO</b></div><div class="knowledge-sub">Conocimiento técnico</div></div>
        <button class="knowledge-btn red" id="knowledgeNewAsset">+ Nueva máquina / pieza</button>
        <div class="knowledge-list" id="knowledgeAssetList"></div>
        <div class="knowledge-side-bottom"><button class="knowledge-btn dark" id="knowledgeBack">← Cambiar módulo</button></div>
      </aside>
      <main class="knowledge-main">
        <div class="knowledge-top">
          <div><h1 id="knowledgeTitle" style="margin:0">Conocimiento técnico</h1><div id="knowledgeSubtitle" class="knowledge-sub">Seleccioná o creá una máquina/pieza para comenzar.</div></div>
          <div class="knowledge-top-actions">
            <button class="knowledge-btn dark" id="knowledgeMobileBack">← Módulos</button>
            <button class="knowledge-btn dark" id="knowledgeEditAsset">Editar ficha</button>
            <button class="knowledge-btn red" id="knowledgeLoadModel">Cargar modelo 3D</button>
            <input id="knowledgeModelFile" class="knowledge-upload" type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json">
          </div>
        </div>
        <div class="knowledge-grid">
          <section class="knowledge-card">
            <div class="knowledge-model-info"><b>Visor 3D interactivo</b><div class="knowledge-sub">GLB recomendado. Tocá una pieza del modelo para asociarle conocimiento.</div></div>
            <div class="knowledge-viewer" id="knowledgeViewer"><div class="knowledge-empty" id="knowledgeViewerEmpty"><div><div style="font-size:46px">🧩</div><b>Cargá un modelo 3D de la pieza o máquina</b><div class="knowledge-sub" style="margin-top:6px">Podés girarlo, hacer zoom, seleccionar componentes y separar el conjunto.</div></div></div></div>
            <div class="knowledge-tools">
              <b>Despiece</b><input id="knowledgeExplode" type="range" min="0" max="100" value="0"><span id="knowledgeExplodeValue">0%</span>
              <button class="knowledge-btn dark" id="knowledgeResetView">Centrar vista</button>
            </div>
            <div class="knowledge-selected">Componente seleccionado: <b id="knowledgeSelectedComponent">General</b></div>
          </section>
          <section class="knowledge-card">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b>Puntos técnicos</b><div class="knowledge-sub">Fallas, controles, desarme, medidas y advertencias.</div></div><button class="knowledge-btn red" id="knowledgeNewPoint">+ Punto</button></div>
            <div class="knowledge-points" id="knowledgePointList"></div>
          </section>
        </div>
      </main>
    </div>
  </div>
  <div id="knowledgeAssetModal" class="knowledge-modal"><div class="knowledge-dialog"><div class="head"><h2 id="knowledgeAssetModalTitle" style="margin:0">Nueva ficha</h2><button class="knowledge-close" data-close="knowledgeAssetModal">×</button></div><div class="knowledge-form"><label>Nombre de máquina o pieza<input id="knowledgeAssetName" placeholder="Ej. Reductor Brevini / Caja sinfín"></label><label>Marca / modelo<input id="knowledgeAssetBrand" placeholder="Ej. Brevini modelo... (opcional)"></label><label>Descripción<textarea id="knowledgeAssetDescription" placeholder="Qué es, dónde se usa, observaciones generales..."></textarea></label><button class="knowledge-btn red" id="knowledgeSaveAsset">Guardar ficha</button></div></div></div>
  <div id="knowledgePointModal" class="knowledge-modal"><div class="knowledge-dialog"><div class="head"><h2 style="margin:0">Registrar conocimiento</h2><button class="knowledge-close" data-close="knowledgePointModal">×</button></div><div class="knowledge-form"><div class="knowledge-sub">Se asociará a: <b id="knowledgePointComponent">General</b></div><label>Tipo<select id="knowledgePointType"><option>Revisar</option><option>Rotura frecuente</option><option>Desarme</option><option>Armado</option><option>Medida</option><option>Advertencia</option><option>Lubricación</option><option>Repuesto</option></select></label><label>Título<input id="knowledgePointTitle" placeholder="Ej. Revisar juego axial del rodamiento"></label><label>Detalle<textarea id="knowledgePointDetails" placeholder="Qué revisar, cómo se hace, qué suele romperse, medidas, trucos del taller..."></textarea></label><button class="knowledge-btn red" id="knowledgeSavePoint">Guardar punto técnico</button></div></div></div>`);
  bindUI();
  addModuleCard();
  init3D();
}

function addModuleCard(){
  const cards=document.querySelector('#modulePicker .module-cards');
  if(!cards||$('goKnowledge'))return false;
  cards.insertAdjacentHTML('beforeend',`<button class="module-card" id="goKnowledge"><div class="module-icon">🧠</div><div class="module-name">Conocimiento</div><div class="module-desc">Modelos 3D, despiece, fallas, controles y procedimientos del taller.</div></button>`);
  $('goKnowledge').onclick=openKnowledge;
  return true;
}

function bindUI(){
  $('knowledgeBack').onclick=$('knowledgeMobileBack').onclick=showPicker;
  $('knowledgeNewAsset').onclick=()=>openAssetModal(false);
  $('knowledgeEditAsset').onclick=()=>openAssetModal(true);
  $('knowledgeLoadModel').onclick=()=>$('knowledgeModelFile').click();
  $('knowledgeModelFile').onchange=e=>loadLocalModel(e.target.files?.[0]);
  $('knowledgeNewPoint').onclick=openPointModal;
  $('knowledgeSaveAsset').onclick=saveAsset;
  $('knowledgeSavePoint').onclick=savePoint;
  $('knowledgeExplode').oninput=applyExplode;
  $('knowledgeResetView').onclick=fitCamera;
  document.querySelectorAll('.knowledge-close').forEach(b=>b.onclick=()=>$((b.dataset.close)).classList.remove('show'));
  document.querySelectorAll('.knowledge-modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('show')});
}

function showPicker(){
  $('knowledgeApp').classList.remove('show');
  $('modulePicker')?.classList.remove('hidden');
}

async function openKnowledge(){
  $('modulePicker')?.classList.add('hidden');
  $('shell')?.classList.add('hidden');
  $('sparesApp')?.classList.add('hidden');
  $('carriersApp')?.classList.add('hidden');
  $('transportApp')?.classList.add('hidden');
  $('knowledgeApp').classList.add('show');
  resizeRenderer();
  await loadAssets();
}

async function loadAssets(){
  const {data,error}=await sb.from('knowledge_assets').select('*').order('name');
  if(error){alert('No se pudo cargar Conocimiento: '+error.message);return}
  assets=data||[];
  renderAssets();
  if(currentAsset){const fresh=assets.find(a=>a.id===currentAsset.id);if(fresh)currentAsset=fresh}
}

function renderAssets(){
  $('knowledgeAssetList').innerHTML=assets.length?assets.map(a=>`<button class="knowledge-item ${currentAsset?.id===a.id?'active':''}" data-id="${a.id}"><b>${esc(a.name)}</b>${a.brand_model?`<div class="knowledge-sub">${esc(a.brand_model)}</div>`:''}</button>`).join(''):'<div class="knowledge-sub">Todavía no hay fichas cargadas.</div>';
  document.querySelectorAll('.knowledge-item').forEach(b=>b.onclick=()=>selectAsset(Number(b.dataset.id)));
}

async function selectAsset(id){
  currentAsset=assets.find(a=>a.id===id)||null;
  renderAssets();
  $('knowledgeTitle').textContent=currentAsset?.name||'Conocimiento técnico';
  $('knowledgeSubtitle').textContent=[currentAsset?.brand_model,currentAsset?.description].filter(Boolean).join(' · ')||'Ficha técnica';
  clearModel();
  if(currentAsset?.model_file_name)$('knowledgeViewerEmpty').innerHTML=`<div><div style="font-size:42px">📦</div><b>${esc(currentAsset.model_file_name)}</b><div class="knowledge-sub" style="margin-top:6px">El modelo se guarda por ahora solo como referencia. Volvé a cargar el archivo GLB para visualizarlo en esta sesión.</div></div>`;
  else $('knowledgeViewerEmpty').innerHTML='<div><div style="font-size:46px">🧩</div><b>Cargá un modelo 3D de la pieza o máquina</b><div class="knowledge-sub" style="margin-top:6px">GLB recomendado.</div></div>';
  await loadPoints();
}

function openAssetModal(edit){
  const a=edit?currentAsset:null;
  if(edit&&!a){alert('Primero seleccioná una ficha.');return}
  $('knowledgeAssetModalTitle').textContent=edit?'Editar ficha':'Nueva ficha';
  $('knowledgeAssetName').value=a?.name||'';
  $('knowledgeAssetBrand').value=a?.brand_model||'';
  $('knowledgeAssetDescription').value=a?.description||'';
  $('knowledgeAssetModal').dataset.editId=edit?String(a.id):'';
  $('knowledgeAssetModal').classList.add('show');
}

async function saveAsset(){
  const name=$('knowledgeAssetName').value.trim();if(!name){alert('Ingresá un nombre.');return}
  const row={name,brand_model:$('knowledgeAssetBrand').value.trim()||null,description:$('knowledgeAssetDescription').value.trim()||null,updated_at:new Date().toISOString()};
  const id=Number($('knowledgeAssetModal').dataset.editId)||0;
  const res=id?await sb.from('knowledge_assets').update(row).eq('id',id).select().single():await sb.from('knowledge_assets').insert(row).select().single();
  if(res.error){alert(res.error.message);return}
  currentAsset=res.data;
  $('knowledgeAssetModal').classList.remove('show');
  await loadAssets();
  await selectAsset(currentAsset.id);
}

async function loadPoints(){
  if(!currentAsset){points=[];renderPoints();return}
  const {data,error}=await sb.from('knowledge_points').select('*').eq('asset_id',currentAsset.id).order('created_at',{ascending:false});
  if(error){alert(error.message);return}
  points=data||[];renderPoints();
}

function renderPoints(){
  $('knowledgePointList').innerHTML=points.length?points.map(p=>`<div class="knowledge-point"><span class="tag">${esc(p.point_type)}</span><b style="display:block">${esc(p.title)}</b><div class="knowledge-sub">${esc(p.component_name||'General')}</div>${p.details?`<div style="margin-top:7px;white-space:pre-wrap">${esc(p.details)}</div>`:''}<div style="margin-top:8px"><button class="knowledge-btn dark knowledge-delete-point" data-id="${p.id}" style="padding:6px 9px">Eliminar</button></div></div>`).join(''):'<div class="knowledge-sub">Todavía no hay puntos técnicos. Seleccioná una pieza del 3D y tocá “+ Punto”.</div>';
  document.querySelectorAll('.knowledge-delete-point').forEach(b=>b.onclick=()=>deletePoint(Number(b.dataset.id)));
}

function openPointModal(){
  if(!currentAsset){alert('Primero creá o seleccioná una ficha.');return}
  $('knowledgePointComponent').textContent=selectedMesh?.name||'General';
  $('knowledgePointTitle').value='';$('knowledgePointDetails').value='';$('knowledgePointType').value='Revisar';
  $('knowledgePointModal').classList.add('show');
}

async function savePoint(){
  const title=$('knowledgePointTitle').value.trim();if(!title){alert('Ingresá un título.');return}
  const row={asset_id:currentAsset.id,component_name:selectedMesh?.name||'General',point_type:$('knowledgePointType').value,title,details:$('knowledgePointDetails').value.trim()||null,updated_at:new Date().toISOString()};
  const {error}=await sb.from('knowledge_points').insert(row);if(error){alert(error.message);return}
  $('knowledgePointModal').classList.remove('show');await loadPoints();
}

async function deletePoint(id){
  if(!confirm('¿Eliminar este punto técnico?'))return;
  const {error}=await sb.from('knowledge_points').delete().eq('id',id);if(error){alert(error.message);return}await loadPoints();
}

function init3D(){
  const host=$('knowledgeViewer');
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(45,1,.01,10000);
  camera.position.set(4,3,6);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
  scene.add(new THREE.HemisphereLight(0xffffff,0x333344,2.2));
  const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(5,7,5);scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,1.2);fill.position.set(-5,2,-4);scene.add(fill);
  raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown',pickMesh);
  window.addEventListener('resize',resizeRenderer);
  renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
  resizeRenderer();
}

function resizeRenderer(){
  if(!renderer)return;const host=$('knowledgeViewer');const w=host.clientWidth||600,h=host.clientHeight||420;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}

async function loadLocalModel(file){
  if(!currentAsset){alert('Primero creá o seleccioná una ficha.');$('knowledgeModelFile').value='';return}
  if(!file)return;
  clearModel();
  if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(file);
  $('knowledgeViewerEmpty').innerHTML='<div><b>Cargando modelo 3D...</b></div>';
  const loader=new GLTFLoader();
  loader.load(objectUrl,async gltf=>{
    rootModel=gltf.scene;scene.add(rootModel);meshState=[];
    const totalBox=new THREE.Box3().setFromObject(rootModel);const totalCenter=new THREE.Vector3();totalBox.getCenter(totalCenter);const totalSize=new THREE.Vector3();totalBox.getSize(totalSize);const scale=Math.max(totalSize.x,totalSize.y,totalSize.z)||1;
    rootModel.traverse(o=>{if(o.isMesh){if(!o.name)o.name=`Componente ${meshState.length+1}`;o.userData.originalPosition=o.position.clone();const box=new THREE.Box3().setFromObject(o);const c=new THREE.Vector3();box.getCenter(c);const dir=c.sub(totalCenter).normalize();if(!Number.isFinite(dir.x)||dir.lengthSq()<.001)dir.set((meshState.length%3)-1,((meshState.length+1)%3)-1,((meshState.length+2)%3)-1).normalize();meshState.push({mesh:o,origin:o.position.clone(),dir,scale});}});
    $('knowledgeViewerEmpty').style.display='none';$('knowledgeExplode').value='0';$('knowledgeExplodeValue').textContent='0%';fitCamera();
    const {error}=await sb.from('knowledge_assets').update({model_file_name:file.name,updated_at:new Date().toISOString()}).eq('id',currentAsset.id);if(!error){currentAsset.model_file_name=file.name;await loadAssets()}
  },undefined,err=>{console.error(err);$('knowledgeViewerEmpty').style.display='grid';$('knowledgeViewerEmpty').innerHTML='<div><b>No se pudo abrir el modelo.</b><div class="knowledge-sub">Probá exportándolo como GLB desde tu software 3D.</div></div>'});
}

function clearModel(){
  if(rootModel){scene.remove(rootModel);rootModel.traverse(o=>{if(o.geometry)o.geometry.dispose?.();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose?.())}});rootModel=null}
  meshState=[];selectedMesh=null;$('knowledgeSelectedComponent').textContent='General';$('knowledgeViewerEmpty').style.display='grid';
}

function applyExplode(){
  const pct=Number($('knowledgeExplode').value)||0;$('knowledgeExplodeValue').textContent=pct+'%';const amount=pct/100;
  meshState.forEach(s=>s.mesh.position.copy(s.origin).add(s.dir.clone().multiplyScalar(s.scale*amount*.65)));
}

function fitCamera(){
  if(!rootModel)return;
  const box=new THREE.Box3().setFromObject(rootModel);const center=new THREE.Vector3();const size=new THREE.Vector3();box.getCenter(center);box.getSize(size);const max=Math.max(size.x,size.y,size.z)||1;const dist=max/Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*0.8;camera.position.copy(center).add(new THREE.Vector3(dist*.8,dist*.55,dist));controls.target.copy(center);camera.near=Math.max(max/1000,.001);camera.far=max*100;camera.updateProjectionMatrix();controls.update();
}

function pickMesh(e){
  if(!rootModel)return;const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObject(rootModel,true).filter(h=>h.object?.isMesh);if(!hits.length)return;selectedMesh=hits[0].object;$('knowledgeSelectedComponent').textContent=selectedMesh.name||'Componente';
}

function boot(){
  buildUI();
  if(addModuleCard())return;
  const obs=new MutationObserver(()=>{if(addModuleCard())obs.disconnect()});obs.observe(document.body,{childList:true,subtree:true});
}
boot();
