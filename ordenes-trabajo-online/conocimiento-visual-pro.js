import { sb } from './supabase-client.js';
import * as THREE from 'https://esm.sh/three@0.181.1';
import { OrbitControls } from 'https://esm.sh/three@0.181.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.181.1/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.181.1/examples/jsm/environments/RoomEnvironment.js';

const BUCKET='knowledge-models';
let host=null, scene=null, camera=null, renderer=null, controls=null, model=null, meshes=[], raycaster=null, pointer=null;
let currentAssetId=null, currentPath=null, objectUrl=null, selected=null, isolated=false, animationId=null, modelSize=1;
const originals=new Map();

function ensureCss(){
  if(document.querySelector('link[href*="conocimiento-visual-pro.css"]')) return;
  const l=document.createElement('link');l.rel='stylesheet';l.href='./conocimiento-visual-pro.css?v=20261029-1635';document.head.appendChild(l);
}

function activeAssetId(){
  const el=document.querySelector('#kv5Assets .kv5-item.active');
  return el?Number(el.dataset.id):null;
}

function modelTabVisible(){
  const tab=document.getElementById('kv5TabModel');
  return !!tab && !tab.hidden && document.getElementById('knowledgeAppV5')?.classList.contains('show');
}

function disposeRenderer(){
  if(animationId) cancelAnimationFrame(animationId); animationId=null;
  controls?.dispose?.(); renderer?.dispose?.();
  if(model){model.traverse(o=>{if(o.isMesh){o.geometry?.dispose?.();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m?.dispose?.())}})}
  scene=camera=renderer=controls=model=raycaster=pointer=null;meshes=[];originals.clear();selected=null;
}

function buildShell(target){
  target.innerHTML=`<div class="kvpro-wrap"><div class="kvpro-toolbar"><div><b>Vista 3D Pro</b><div class="kvpro-sub">Tocá una pieza para verla en detalle.</div></div><div class="kvpro-tools"><button id="kvproFit" class="kvpro-btn">Centrar conjunto</button><button id="kvproShow" class="kvpro-btn">Mostrar todo</button><button id="kvproIsolate" class="kvpro-btn" disabled>Aislar pieza</button></div></div><div class="kvpro-stage"><div id="kvproCanvas" class="kvpro-canvas"><div id="kvproLoading" class="kvpro-loading">Cargando modelo 3D…</div></div><div id="kvproCard" class="kvpro-card"><div class="kvpro-kicker">COMPONENTE</div><h3 id="kvproName">Tocá una pieza</h3><div id="kvproInfo" class="kvpro-info">El resto del conjunto se atenuará automáticamente para que puedas identificarla mejor.</div><div class="kvpro-card-actions"><button id="kvproFocus" class="kvpro-btn" disabled>Ver detalle</button><button id="kvproClear" class="kvpro-btn" disabled>Quitar selección</button></div></div></div></div>`;
  host=document.getElementById('kvproCanvas');
  document.getElementById('kvproFit').onclick=()=>fitObject(model,true);
  document.getElementById('kvproShow').onclick=showAll;
  document.getElementById('kvproIsolate').onclick=()=>{if(selected){isolated=!isolated;applySelection(selected);document.getElementById('kvproIsolate').textContent=isolated?'Mostrar contexto':'Aislar pieza'}};
  document.getElementById('kvproFocus').onclick=()=>selected&&fitObject(selected,true,1.9);
  document.getElementById('kvproClear').onclick=clearSelection;
}

function setupScene(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0xf4f5f7);
  camera=new THREE.PerspectiveCamera(35,1,0.01,10000);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xffffff,0xb9c0c9,2.15));
  const key=new THREE.DirectionalLight(0xffffff,3.0);key.position.set(4,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);
  const fill=new THREE.DirectionalLight(0xdbe9ff,1.25);fill.position.set(-5,2,4);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffeee4,0.9);rim.position.set(1,4,-6);scene.add(rim);
  const front=new THREE.DirectionalLight(0xffffff,0.65);front.position.set(0,1,7);scene.add(front);

  controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.065;controls.zoomToCursor=true;controls.screenSpacePanning=true;
  controls.minPolarAngle=.05;controls.maxPolarAngle=Math.PI-.05;
  raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
  renderer.domElement.addEventListener('pointerup',pick);
  renderer.domElement.addEventListener('dblclick',()=>selected&&fitObject(selected,true,1.9));
  window.addEventListener('resize',resize);
  animate();resize();
}

function rememberMaterial(mesh){
  const mats=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(m=>m.clone());
  originals.set(mesh.uuid,{materials:mats,visible:mesh.visible});
}

function prepModel(root){
  model=root;meshes=[];originals.clear();
  root.traverse(o=>{
    if(!o.isMesh) return;
    o.castShadow=true;o.receiveShadow=true;
    o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();
    const mats=Array.isArray(o.material)?o.material:[o.material];
    mats.forEach(m=>{
      if('roughness' in m) m.roughness=Math.min(Math.max(m.roughness??.55,.32),.78);
      if('metalness' in m) m.metalness=Math.min(Math.max(m.metalness??.25,.08),.8);
      if('envMapIntensity' in m) m.envMapIntensity=1.1;
      m.needsUpdate=true;
    });
    rememberMaterial(o);meshes.push(o);
  });
  scene.add(root);
  const b=new THREE.Box3().setFromObject(root),s=new THREE.Vector3();b.getSize(s);modelSize=Math.max(s.x,s.y,s.z)||1;
  controls.minDistance=modelSize*.12;controls.maxDistance=modelSize*8;
  camera.near=Math.max(modelSize/1500,.001);camera.far=modelSize*100;camera.updateProjectionMatrix();
  addFloor(b);
  fitObject(root,false,1.35);
  document.getElementById('kvproLoading')?.remove();
}

function addFloor(box){
  const old=scene.getObjectByName('kvpro-floor');if(old)scene.remove(old);
  const size=Math.max(modelSize*4,10);
  const geo=new THREE.PlaneGeometry(size,size);
  const mat=new THREE.ShadowMaterial({color:0x343a40,opacity:.13});
  const floor=new THREE.Mesh(geo,mat);floor.name='kvpro-floor';floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
  floor.position.y=box.min.y-modelSize*.035;scene.add(floor);
}

function fitObject(obj,animateCamera=false,padding=1.35){
  if(!obj) return;
  const box=new THREE.Box3().setFromObject(obj);if(box.isEmpty())return;
  const size=new THREE.Vector3(),center=new THREE.Vector3();box.getSize(size);box.getCenter(center);
  const maxDim=Math.max(size.x,size.y,size.z)||modelSize||1;
  const fov=THREE.MathUtils.degToRad(camera.fov);let distance=(maxDim/2)/Math.tan(fov/2)*padding;
  distance=Math.max(distance,modelSize*.22);
  const dir=new THREE.Vector3(1.15,.72,1.35).normalize();
  const end=center.clone().add(dir.multiplyScalar(distance));
  if(!animateCamera){camera.position.copy(end);controls.target.copy(center);controls.update();return;}
  const start=camera.position.clone(),startTarget=controls.target.clone(),t0=performance.now();
  const tick=now=>{const t=Math.min((now-t0)/340,1),e=1-Math.pow(1-t,3);camera.position.lerpVectors(start,end,e);controls.target.lerpVectors(startTarget,center,e);controls.update();if(t<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);
}

function restoreMesh(mesh){
  const o=originals.get(mesh.uuid);if(!o)return;
  const current=Array.isArray(mesh.material)?mesh.material:[mesh.material];current.forEach(m=>m?.dispose?.());
  mesh.material=o.materials.map(m=>m.clone());if(mesh.material.length===1)mesh.material=mesh.material[0];mesh.visible=o.visible;
}

function resetMaterials(){meshes.forEach(restoreMesh)}

function applySelection(mesh){
  resetMaterials();
  meshes.forEach(m=>{
    const mats=Array.isArray(m.material)?m.material:[m.material];
    if(m===mesh){
      m.visible=true;
      mats.forEach(mat=>{mat.transparent=false;mat.opacity=1;mat.depthWrite=true;if(mat.emissive){mat.emissive.setHex(0xe6b800);mat.emissiveIntensity=.42}if('envMapIntensity'in mat)mat.envMapIntensity=1.3;mat.needsUpdate=true});
    }else if(isolated){m.visible=false}
    else{
      mats.forEach(mat=>{mat.transparent=true;mat.opacity=.24;mat.depthWrite=false;if(mat.emissive){mat.emissive.setHex(0x000000);mat.emissiveIntensity=0}mat.needsUpdate=true});
    }
  });
}

function selectMesh(mesh,focus=true){
  if(!mesh)return;selected=mesh;isolated=false;applySelection(mesh);
  document.getElementById('kvproName').textContent=mesh.name||'Componente sin nombre';
  document.getElementById('kvproInfo').textContent='Pieza seleccionada. Podés aislarla, centrarla o tocar otra pieza del conjunto.';
  document.getElementById('kvproFocus').disabled=false;document.getElementById('kvproClear').disabled=false;document.getElementById('kvproIsolate').disabled=false;document.getElementById('kvproIsolate').textContent='Aislar pieza';
  syncLegacyList(mesh.name);if(focus)fitObject(mesh,true,2.15);
}

function clearSelection(){
  selected=null;isolated=false;resetMaterials();
  document.getElementById('kvproName').textContent='Tocá una pieza';document.getElementById('kvproInfo').textContent='El resto del conjunto se atenuará automáticamente para que puedas identificarla mejor.';
  ['kvproFocus','kvproClear','kvproIsolate'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=true});
  document.querySelectorAll('#kv5Components .kv5-component').forEach(x=>x.classList.remove('active'));
}

function showAll(){clearSelection();meshes.forEach(m=>m.visible=originals.get(m.uuid)?.visible??true);fitObject(model,true,1.35)}

function pick(e){
  if(!renderer||!camera)return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes.filter(m=>m.visible),false)[0];if(hit?.object)selectMesh(hit.object,true);
}

function syncLegacyList(name){
  document.querySelectorAll('#kv5Components .kv5-component').forEach(x=>x.classList.toggle('active',x.textContent.trim()===name));
}

function resize(){
  if(!host||!renderer||!camera)return;const r=host.getBoundingClientRect();if(r.width<10||r.height<10)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
}
function animate(){animationId=requestAnimationFrame(animate);controls?.update();renderer?.render(scene,camera)}

async function loadAsset(assetId){
  const {data,error}=await sb.from('knowledge_assets').select('id,model_storage_path').eq('id',assetId).maybeSingle();
  if(error||!data?.model_storage_path){const l=document.getElementById('kvproLoading');if(l)l.textContent='Esta ficha no tiene modelo 3D guardado.';return}
  currentPath=data.model_storage_path;
  const {data:blob,error:dl}=await sb.storage.from(BUCKET).download(currentPath);if(dl){const l=document.getElementById('kvproLoading');if(l)l.textContent='No se pudo cargar el modelo.';return}
  if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);
  new GLTFLoader().load(objectUrl,g=>prepModel(g.scene),undefined,()=>{const l=document.getElementById('kvproLoading');if(l)l.textContent='No se pudo interpretar el GLB.'});
}

async function mount(){
  if(!modelTabVisible())return;
  const target=document.getElementById('kv5Viewer');if(!target)return;
  const assetId=activeAssetId();if(!assetId)return;
  if(target.dataset.kvpro==='1'&&currentAssetId===assetId)return;
  disposeRenderer();currentAssetId=assetId;target.dataset.kvpro='1';ensureCss();buildShell(target);setupScene();await loadAsset(assetId);
}

function bindLegacyComponentClicks(){
  document.addEventListener('click',e=>{
    const c=e.target.closest?.('#kv5Components .kv5-component');if(!c||!modelTabVisible()||!meshes.length)return;
    const name=c.textContent.trim();const mesh=meshes.find(m=>m.name===name);if(mesh){e.preventDefault();e.stopPropagation();selectMesh(mesh,true)}
  },true);
}

ensureCss();bindLegacyComponentClicks();
document.addEventListener('click',e=>{
  const tab=e.target.closest?.('.kv5-tab[data-tab="model"]');if(tab)setTimeout(mount,120);
  const item=e.target.closest?.('#kv5Assets .kv5-item');if(item)setTimeout(()=>{if(modelTabVisible())mount()},180);
});
const observer=new MutationObserver(()=>{if(modelTabVisible())setTimeout(mount,80)});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
setTimeout(mount,800);
