import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';
import * as THREE from 'https://esm.sh/three@0.181.1';
import { OrbitControls } from 'https://esm.sh/three@0.181.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.181.1/examples/jsm/loaders/GLTFLoader.js';

const sb=createClient('https://dcmlbriqiybegmwanwlf.supabase.co','sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

let assets=[];
let currentAsset=null;
let scene,camera,renderer,controls,rootModel,raycaster,pointer,selectedMesh,objectUrl;
let parts=[];
let downPoint=null;

function ensureCss(){
  if(document.querySelector('link[data-knowledge-css]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';link.href='./conocimiento.css?v=20261028-0065';link.dataset.knowledgeCss='1';
  document.head.appendChild(link);
}

function buildUI(){
  if($('knowledgeApp'))return;
  ensureCss();
  document.body.insertAdjacentHTML('beforeend',`
  <div id="knowledgeApp" class="knowledge-app"><div class="knowledge-shell">
    <aside class="knowledge-side">
      <div><div class="brand">AGRO<b>DISEÑO</b></div><div class="knowledge-sub">Conocimiento técnico</div></div>
      <button class="knowledge-btn red" id="knowledgeNewAsset">+ Nueva máquina / pieza</button>
      <div class="knowledge-list" id="knowledgeAssetList"></div>
      <div class="knowledge-side-bottom"><button class="knowledge-btn dark" id="knowledgeBack">← Módulos</button></div>
    </aside>
    <main class="knowledge-main">
      <div class="knowledge-top">
        <div><h1 id="knowledgeTitle" style="margin:0">Conocimiento técnico</h1><div id="knowledgeSubtitle" class="knowledge-sub">Seleccioná o creá una ficha.</div></div>
        <div class="knowledge-top-actions">
          <button class="knowledge-btn dark" id="knowledgeMobileBack">← Módulos</button>
          <button class="knowledge-btn red" id="knowledgeLoadModel">Cargar modelo 3D</button>
          <input id="knowledgeModelFile" class="knowledge-upload" type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json">
        </div>
      </div>
      <div class="knowledge-grid">
        <section class="knowledge-card">
          <div class="knowledge-model-info"><b>Visor 3D interactivo</b><div class="knowledge-sub">Arrastrá para girar. Hacé clic corto para seleccionar una pieza.</div></div>
          <div class="knowledge-viewer" id="knowledgeViewer"><div class="knowledge-empty" id="knowledgeViewerEmpty"><div><div style="font-size:46px">🧩</div><b>Cargá un modelo 3D</b><div class="knowledge-sub" style="margin-top:6px">GLB recomendado.</div></div></div></div>
          <div class="knowledge-tools"><b>Despiece</b><input id="knowledgeExplode" type="range" min="0" max="100" value="0"><span id="knowledgeExplodeValue">0%</span><button class="knowledge-btn dark" id="knowledgeResetView">Centrar vista</button></div>
          <div class="knowledge-selected">Componente seleccionado: <b id="knowledgeSelectedComponent">General</b></div>
        </section>
        <section class="knowledge-card"><b>Prueba de componentes</b><div class="knowledge-sub" style="margin-top:7px">Primero validamos selección y despiece. Después reactivamos los puntos técnicos sobre cada componente.</div><div id="knowledgePartsList" class="knowledge-points" style="margin-top:12px"></div></section>
      </div>
    </main>
  </div></div>
  <div id="knowledgeAssetModal" class="knowledge-modal"><div class="knowledge-dialog"><div class="head"><h2 style="margin:0">Nueva ficha</h2><button class="knowledge-close" id="knowledgeCloseAsset">×</button></div><div class="knowledge-form"><label>Nombre<input id="knowledgeAssetName"></label><label>Marca / modelo<input id="knowledgeAssetBrand"></label><label>Descripción<textarea id="knowledgeAssetDescription"></textarea></label><button class="knowledge-btn red" id="knowledgeSaveAsset">Guardar ficha</button></div></div></div>`);

  $('knowledgeBack').onclick=$('knowledgeMobileBack').onclick=showPicker;
  $('knowledgeNewAsset').onclick=()=>{$('knowledgeAssetName').value='';$('knowledgeAssetBrand').value='';$('knowledgeAssetDescription').value='';$('knowledgeAssetModal').classList.add('show')};
  $('knowledgeCloseAsset').onclick=()=>$('knowledgeAssetModal').classList.remove('show');
  $('knowledgeAssetModal').onclick=e=>{if(e.target.id==='knowledgeAssetModal')$('knowledgeAssetModal').classList.remove('show')};
  $('knowledgeSaveAsset').onclick=saveAsset;
  $('knowledgeLoadModel').onclick=()=>$('knowledgeModelFile').click();
  $('knowledgeModelFile').onchange=e=>loadModel(e.target.files?.[0]);
  $('knowledgeExplode').oninput=applyExplode;
  $('knowledgeResetView').onclick=fitCamera;

  init3D();
}

function addCard(){
  const cards=document.querySelector('#modulePicker .module-cards');
  if(!cards||$('goKnowledge'))return false;
  cards.insertAdjacentHTML('beforeend','<button class="module-card" id="goKnowledge"><div class="module-icon">🧠</div><div class="module-name">Conocimiento</div><div class="module-desc">Modelos 3D, despiece y conocimiento técnico del taller.</div></button>');
  $('goKnowledge').onclick=openKnowledge;
  return true;
}

function showPicker(){
  $('knowledgeApp')?.classList.remove('show');
  $('modulePicker')?.classList.remove('hidden');
}

async function openKnowledge(){
  $('modulePicker')?.classList.add('hidden');
  $('shell')?.classList.add('hidden');
  $('sparesApp')?.classList.add('hidden');
  $('carriersApp')?.classList.add('hidden');
  $('knowledgeApp').classList.add('show');
  resize();
  await loadAssets();
}

async function loadAssets(){
  const {data,error}=await sb.from('knowledge_assets').select('*').order('name');
  if(error){alert('No se pudieron cargar las fichas: '+error.message);return}
  assets=data||[];
  renderAssets();
}

function renderAssets(){
  $('knowledgeAssetList').innerHTML=assets.length?assets.map(a=>`<button class="knowledge-item ${currentAsset?.id===a.id?'active':''}" data-id="${a.id}"><b>${esc(a.name)}</b>${a.brand_model?`<div class="knowledge-sub">${esc(a.brand_model)}</div>`:''}</button>`).join(''):'<div class="knowledge-sub">Todavía no hay fichas.</div>';
  document.querySelectorAll('.knowledge-item').forEach(b=>b.onclick=()=>selectAsset(Number(b.dataset.id)));
}

function selectAsset(id){
  currentAsset=assets.find(a=>a.id===id)||null;
  renderAssets();
  $('knowledgeTitle').textContent=currentAsset?.name||'Conocimiento técnico';
  $('knowledgeSubtitle').textContent=[currentAsset?.brand_model,currentAsset?.description].filter(Boolean).join(' · ')||'Ficha técnica';
  clearModel();
  if(currentAsset?.model_file_name){
    $('knowledgeViewerEmpty').innerHTML=`<div><div style="font-size:42px">📦</div><b>${esc(currentAsset.model_file_name)}</b><div class="knowledge-sub" style="margin-top:6px">Volvé a cargar el GLB para visualizarlo.</div></div>`;
  }
}

async function saveAsset(){
  const name=$('knowledgeAssetName').value.trim();
  if(!name){alert('Ingresá un nombre.');return}
  const row={name,brand_model:$('knowledgeAssetBrand').value.trim()||null,description:$('knowledgeAssetDescription').value.trim()||null,updated_at:new Date().toISOString()};
  const {data,error}=await sb.from('knowledge_assets').insert(row).select().single();
  if(error){alert(error.message);return}
  $('knowledgeAssetModal').classList.remove('show');
  currentAsset=data;
  await loadAssets();
  selectAsset(data.id);
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
  const a=new THREE.DirectionalLight(0xffffff,2.5);a.position.set(5,7,5);scene.add(a);
  const b=new THREE.DirectionalLight(0xffffff,1.2);b.position.set(-5,2,-4);scene.add(b);
  raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown',e=>{downPoint={x:e.clientX,y:e.clientY}});
  renderer.domElement.addEventListener('pointerup',e=>{if(!downPoint)return;const d=Math.hypot(e.clientX-downPoint.x,e.clientY-downPoint.y);downPoint=null;if(d<6)pickMesh(e)});
  window.addEventListener('resize',resize);
  renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
  resize();
}

function resize(){
  if(!renderer)return;
  const host=$('knowledgeViewer');
  const w=host.clientWidth||600,h=host.clientHeight||420;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}

async function loadModel(file){
  if(!currentAsset){alert('Primero creá o seleccioná una ficha.');return}
  if(!file)return;
  clearModel();
  if(objectUrl)URL.revokeObjectURL(objectUrl);
  objectUrl=URL.createObjectURL(file);
  $('knowledgeViewerEmpty').style.display='grid';
  $('knowledgeViewerEmpty').innerHTML='<div><b>Cargando modelo 3D...</b></div>';

  new GLTFLoader().load(objectUrl,async gltf=>{
    rootModel=gltf.scene;
    scene.add(rootModel);
    rootModel.updateMatrixWorld(true);
    const totalBox=new THREE.Box3().setFromObject(rootModel);
    const center=new THREE.Vector3(),size=new THREE.Vector3();
    totalBox.getCenter(center);totalBox.getSize(size);
    const modelScale=Math.max(size.x,size.y,size.z)||1;
    parts=[];
    let index=0;
    rootModel.traverse(o=>{
      if(!o.isMesh)return;
      index+=1;
      if(!o.name)o.name=`Componente ${index}`;
      const worldBox=new THREE.Box3().setFromObject(o);
      const worldCenter=new THREE.Vector3();worldBox.getCenter(worldCenter);
      let dir=worldCenter.clone().sub(center);
      if(dir.lengthSq()<1e-6){
        const axes=[new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,-1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1)];
        dir=axes[(index-1)%axes.length].clone();
      }
      dir.normalize();
      parts.push({mesh:o,baseWorld:o.getWorldPosition(new THREE.Vector3()),dir,modelScale});
    });
    $('knowledgeViewerEmpty').style.display='none';
    $('knowledgeExplode').value='0';$('knowledgeExplodeValue').textContent='0%';
    renderParts();fitCamera();
    const {error}=await sb.from('knowledge_assets').update({model_file_name:file.name,updated_at:new Date().toISOString()}).eq('id',currentAsset.id);
    if(!error){currentAsset.model_file_name=file.name;await loadAssets()}
  },undefined,err=>{
    console.error(err);
    $('knowledgeViewerEmpty').style.display='grid';
    $('knowledgeViewerEmpty').innerHTML='<div><b>No se pudo abrir el modelo.</b><div class="knowledge-sub">Probá con otro GLB.</div></div>';
  });
}

function renderParts(){
  $('knowledgePartsList').innerHTML=parts.length?parts.map((p,i)=>`<button type="button" class="knowledge-item knowledge-part-btn" data-part="${i}">${esc(p.mesh.name||`Componente ${i+1}`)}</button>`).join(''):'<div class="knowledge-sub">No se detectaron mallas.</div>';
  document.querySelectorAll('.knowledge-part-btn').forEach(b=>b.onclick=()=>setSelected(parts[Number(b.dataset.part)]?.mesh||null));
}

function worldToLocal(mesh,worldPos){
  if(!mesh.parent)return worldPos.clone();
  mesh.parent.updateMatrixWorld(true);
  return mesh.parent.worldToLocal(worldPos.clone());
}

function applyExplode(){
  if(!rootModel)return;
  const pct=Number($('knowledgeExplode').value)||0;
  $('knowledgeExplodeValue').textContent=pct+'%';
  const amount=pct/100;
  parts.forEach(p=>{
    const targetWorld=p.baseWorld.clone().add(p.dir.clone().multiplyScalar(p.modelScale*amount*.75));
    p.mesh.position.copy(worldToLocal(p.mesh,targetWorld));
  });
  rootModel.updateMatrixWorld(true);
}

function fitCamera(){
  if(!rootModel)return;
  const box=new THREE.Box3().setFromObject(rootModel),center=new THREE.Vector3(),size=new THREE.Vector3();
  box.getCenter(center);box.getSize(size);
  const max=Math.max(size.x,size.y,size.z)||1;
  const dist=max/Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*.8;
  camera.position.copy(center).add(new THREE.Vector3(dist*.8,dist*.55,dist));
  controls.target.copy(center);camera.near=Math.max(max/1000,.001);camera.far=max*100;camera.updateProjectionMatrix();controls.update();
}

function setSelected(mesh){
  if(selectedMesh?.userData.__knowledgeOriginalMaterial){selectedMesh.material=selectedMesh.userData.__knowledgeOriginalMaterial;delete selectedMesh.userData.__knowledgeOriginalMaterial}
  selectedMesh=mesh;
  if(!mesh){$('knowledgeSelectedComponent').textContent='General';return}
  mesh.userData.__knowledgeOriginalMaterial=mesh.material;
  const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const cloned=mats.map(m=>{const c=m.clone();if(c.emissive)c.emissive.setHex(0x8a1515);return c});
  mesh.material=Array.isArray(mesh.material)?cloned:cloned[0];
  $('knowledgeSelectedComponent').textContent=mesh.name||'Componente';
}

function pickMesh(e){
  if(!rootModel)return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((e.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObject(rootModel,true).filter(h=>h.object?.isMesh&&h.object.visible);
  if(hits.length)setSelected(hits[0].object);
}

function clearModel(){
  setSelected(null);
  if(rootModel){
    scene.remove(rootModel);
    rootModel.traverse(o=>{o.geometry?.dispose?.();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.())});
    rootModel=null;
  }
  parts=[];
  if($('knowledgePartsList'))$('knowledgePartsList').innerHTML='';
  if($('knowledgeViewerEmpty'))$('knowledgeViewerEmpty').style.display='grid';
}

function boot(){
  buildUI();
  if(addCard())return;
  const observer=new MutationObserver(()=>{if(addCard())observer.disconnect()});
  observer.observe(document.body,{childList:true,subtree:true});
}

boot();
