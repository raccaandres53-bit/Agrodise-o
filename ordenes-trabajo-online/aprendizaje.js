import { sb } from './supabase-client.js';

const $=id=>document.getElementById(id);
let allowed=false,canKnowledge=false;

const areas=[
 {id:'plasma',icon:'🔥',name:'Corte plasma',desc:'PCROB, preparación, corte y seguridad',topics:[['Simulador PCROB','Recreación interactiva del panel de control para practicar sin accionar la máquina.','En desarrollo'],['Preparación de máquina','Inspección previa, consumibles, referencias y puesta a punto.','Contenido por documentar'],['Programación y corte','Carga de archivos, trayectorias y parámetros de trabajo.','Contenido por documentar'],['Seguridad operativa','Riesgos, EPP, controles y respuesta ante incidentes.','Contenido por documentar']]},
 {id:'laser',icon:'⚡',name:'Láser',desc:'Operación, parámetros y mantenimiento',topics:[['Conocer el equipo','Componentes, fuentes, cabezal y sistemas auxiliares.','Contenido por documentar'],['Preparar un trabajo','Archivos, materiales, espesores y preparación del corte.','Contenido por documentar'],['Operación y parámetros','Secuencia de trabajo y parámetros autorizados.','Contenido por documentar'],['Seguridad y mantenimiento','Inspecciones, limpieza y mantenimiento preventivo.','Contenido por documentar']]},
 {id:'taller',icon:'🔧',name:'Taller',desc:'Procesos, herramientas y procedimientos',topics:[['Procedimientos de taller','Secuencias de trabajo y buenas prácticas.','Contenido por documentar'],['Herramientas y equipos','Uso correcto, inspección y cuidado.','Contenido por documentar'],['Seguridad general','Orden, limpieza, EPP y prevención de riesgos.','Contenido por documentar'],['Conocimiento 3D','Modelos, piezas, fotografías e instructivos interactivos.','Abrir módulo']]},
 {id:'torneria',icon:'⚙️',name:'Tornería',desc:'Torno CNC, programación y medición',topics:[['Conocer el torno','Componentes, mandril, herramientas y referencias.','Contenido por documentar'],['Programación CNC','Estructura de programas, ciclos y operaciones.','Contenido por documentar'],['Mecanizado y herramientas','Selección de herramientas y secuencias de trabajo.','Contenido por documentar'],['Medición y control','Instrumentos, tolerancias y verificación de piezas.','Contenido por documentar']]}
];

function injectCss(){
 if(document.querySelector('link[href*="aprendizaje.css"]'))return;
 const link=document.createElement('link');link.rel='stylesheet';link.href='./aprendizaje.css?v=20261124-1625';document.head.appendChild(link);
}
function build(){
 if($('learningApp'))return;
 injectCss();
 document.body.insertAdjacentHTML('beforeend',`
 <div id="learningApp" class="learning-app" aria-hidden="true">
  <header class="learning-header">
   <div><div class="learning-brand">AGRO<span>DISEÑO</span></div><div class="learning-kicker">CENTRO DE CAPACITACIÓN</div></div>
   <div class="learning-header-actions"><button type="button" id="learningHome" class="learning-btn learning-btn-quiet">← Inicio</button></div>
  </header>
  <main class="learning-main">
   <section id="learningIndex">
    <div class="learning-intro"><div class="learning-eyebrow">FORMACIÓN INTERNA</div><h1>Aprendizaje</h1><p>Elegí el sector para acceder a su capacitación, instructivos, simuladores y evaluaciones.</p></div>
    <div id="learningAreas" class="learning-area-grid"></div>
   </section>
   <section id="learningAreaPage" hidden>
    <button type="button" id="learningBackAreas" class="learning-back">← Todos los sectores</button>
    <div class="learning-intro learning-intro-compact"><div class="learning-eyebrow">SECTOR DE CAPACITACIÓN</div><h1 id="learningAreaTitle"></h1><p id="learningAreaDesc"></p></div>
    <div id="learningTopics" class="learning-topic-grid"></div>
   </section>
  </main>
  <footer class="learning-footer">AgroDiseño · Capacitación interna</footer>
 </div>`);
 $('learningHome').onclick=showModulePicker;
 $('learningBackAreas').onclick=showAreas;
 $('learningAreas').innerHTML=areas.map(a=>`<button type="button" class="learning-area-card" data-area="${a.id}"><span class="learning-area-icon">${a.icon}</span><span class="learning-area-name">${a.name}</span><span class="learning-area-desc">${a.desc}</span><span class="learning-area-link">Ingresar <b>→</b></span></button>`).join('');
 $('learningAreas').querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>openArea(b.dataset.area));
}
function showModulePicker(){
 $('learningApp')?.classList.remove('show');
 $('learningApp')?.setAttribute('aria-hidden','true');
 $('modulePicker')?.classList.remove('hidden');
}
function showAreas(){
 $('learningAreaPage').hidden=true;
 $('learningIndex').hidden=false;
}
function openArea(id){
 const area=areas.find(x=>x.id===id);if(!area)return;
 $('learningIndex').hidden=true;$('learningAreaPage').hidden=false;
 $('learningAreaTitle').textContent=area.name;$('learningAreaDesc').textContent=area.desc;
 $('learningTopics').innerHTML=area.topics.map((t,i)=>`<article class="learning-topic-card"><div class="learning-topic-top"><span class="learning-topic-number">${String(i+1).padStart(2,'0')}</span><span class="learning-topic-status ${t[2]==='Abrir módulo'&&canKnowledge?'is-ready':''}">${t[2]==='Abrir módulo'&&!canKnowledge?'Permiso adicional':t[2]}</span></div><h2>${t[0]}</h2><p>${t[1]}</p>${t[2]==='Abrir módulo'&&canKnowledge?'<button type="button" class="learning-topic-action" id="learningOpenKnowledge">Abrir Conocimiento 3D →</button>':`<span class="learning-topic-note">${t[2]==='Abrir módulo'?'Disponible para usuarios con permiso de Conocimiento.':'Material de capacitación a incorporar'}</span>`}</article>`).join('');
 $('learningOpenKnowledge')?.addEventListener('click',()=>{
  $('learningApp').classList.remove('show');
  $('modulePicker')?.classList.remove('hidden');
  const launcher=$('goKnowledgeLauncher')||$('goKnowledge');
  if(launcher){launcher.click();return}
  alert('No se encontró el acceso a Conocimiento 3D. Verificá que tu usuario tenga habilitado el permiso de Conocimiento.');
 });
}
function addLauncher(){
 const cards=document.querySelector('#modulePicker .module-cards');
 if(!cards||$('goLearning'))return false;
 const btn=document.createElement('button');btn.type='button';btn.className='module-card';btn.id='goLearning';
 btn.innerHTML='<div class="module-icon">📚</div><div class="module-name">Aprendizaje</div><div class="module-desc">Capacitación por sector, simuladores, instructivos y evaluaciones.</div>';
 btn.addEventListener('click',()=>{
  $('modulePicker')?.classList.add('hidden');
  $('shell')?.classList.add('hidden');
  $('sparesApp')?.classList.add('hidden');
  $('carriersApp')?.classList.add('hidden');
  $('transportApp')?.classList.add('hidden');
  $('knowledgeAppV5')?.classList.remove('show');
  build();showAreas();$('learningApp').classList.add('show');$('learningApp').setAttribute('aria-hidden','false');
 });
 cards.appendChild(btn);return true;
}
async function checkAccess(){
 const {data:{session}}=await sb.auth.getSession();
 const email=session?.user?.email?.trim().toLowerCase();
 if(!email)return false;
 const {data,error}=await sb.from('allowed_users').select('can_taller,can_conocimiento').eq('email',email).maybeSingle();
 if(error||!data)return {learning:false,knowledge:false};
 return {learning:!!data.can_taller||!!data.can_conocimiento,knowledge:!!data.can_conocimiento};
}
async function boot(){
 const access=await checkAccess();allowed=access.learning;canKnowledge=access.knowledge;
 if(!allowed)return;
 if(addLauncher())return;
 const observer=new MutationObserver(()=>{
  if(!allowed){observer.disconnect();return}
  if(addLauncher())observer.disconnect();
 });
 observer.observe(document.body,{childList:true,subtree:true});
 setTimeout(()=>{if(addLauncher())observer.disconnect()},2500);
}
boot();
sb.auth.onAuthStateChange(async()=>{
 const access=await checkAccess();allowed=access.learning;canKnowledge=access.knowledge;
 if(!allowed){$('goLearning')?.remove();$('learningApp')?.classList.remove('show');return}
 addLauncher();
});
