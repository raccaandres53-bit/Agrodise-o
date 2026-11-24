import { sb } from './supabase-client.js';
import { plasmaLessons, plasmaQuiz } from './aprendizaje-plasma.js';

const $=id=>document.getElementById(id);
let allowed=false,canKnowledge=false,currentArea=null;

const areas=[
 {id:'plasma',icon:'🔥',name:'Corte plasma',desc:'Control CNC MASTER XP, preparación, operación y parámetros',topics:plasmaLessons},
 {id:'laser',icon:'⚡',name:'Láser',desc:'Operación, parámetros y mantenimiento',topics:[['Conocer el equipo','Componentes, fuentes, cabezal y sistemas auxiliares.','Contenido por documentar'],['Preparar un trabajo','Archivos, materiales, espesores y preparación del corte.','Contenido por documentar'],['Operación y parámetros','Secuencia de trabajo y parámetros autorizados.','Contenido por documentar'],['Seguridad y mantenimiento','Inspecciones, limpieza y mantenimiento preventivo.','Contenido por documentar']]},
 {id:'taller',icon:'🔧',name:'Taller',desc:'Procesos, herramientas y procedimientos',topics:[['Procedimientos de taller','Secuencias de trabajo y buenas prácticas.','Contenido por documentar'],['Herramientas y equipos','Uso correcto, inspección y cuidado.','Contenido por documentar'],['Seguridad general','Orden, limpieza, EPP y prevención de riesgos.','Contenido por documentar'],['Conocimiento 3D','Modelos, piezas, fotografías e instructivos interactivos.','Abrir módulo']]},
 {id:'torneria',icon:'⚙️',name:'Tornería',desc:'Torno CNC, programación y medición',topics:[['Conocer el torno','Componentes, mandril, herramientas y referencias.','Contenido por documentar'],['Programación CNC','Estructura de programas, ciclos y operaciones.','Contenido por documentar'],['Mecanizado y herramientas','Selección de herramientas y secuencias de trabajo.','Contenido por documentar'],['Medición y control','Instrumentos, tolerancias y verificación de piezas.','Contenido por documentar']]}
];

function injectCss(){
 if(document.querySelector('link[href*="aprendizaje.css"]'))return;
 const link=document.createElement('link');link.rel='stylesheet';link.href='./aprendizaje.css?v=20261124-1725';document.head.appendChild(link);
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
   <section id="learningLessonPage" hidden>
    <button type="button" id="learningBackTopics" class="learning-back">← Volver a los temas</button>
    <div class="learning-lesson-head"><div class="learning-eyebrow" id="learningLessonSource"></div><h1 id="learningLessonTitle"></h1><p id="learningLessonDesc"></p></div>
    <div id="learningLessonContent" class="learning-lesson-content"></div>
   </section>
  </main>
  <footer class="learning-footer">AgroDiseño · Capacitación interna</footer>
 </div>`);
 $('learningHome').onclick=showModulePicker;
 $('learningBackAreas').onclick=showAreas;
 $('learningBackTopics').onclick=showTopics;
 $('learningAreas').innerHTML=areas.map(a=>`<button type="button" class="learning-area-card" data-area="${a.id}"><span class="learning-area-icon">${a.icon}</span><span class="learning-area-name">${a.name}</span><span class="learning-area-desc">${a.desc}</span><span class="learning-area-link">Ingresar <b>→</b></span></button>`).join('');
 $('learningAreas').querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>openArea(b.dataset.area));
}
function showModulePicker(){
 $('learningApp')?.classList.remove('show');
 $('learningApp')?.setAttribute('aria-hidden','true');
 $('modulePicker')?.classList.remove('hidden');
}
function showAreas(){
 $('learningAreaPage').hidden=true;$('learningLessonPage').hidden=true;$('learningIndex').hidden=false;currentArea=null;
}
function showTopics(){
 $('learningLessonPage').hidden=true;$('learningAreaPage').hidden=false;
}
function openArea(id){
 const area=areas.find(x=>x.id===id);if(!area)return;currentArea=area;
 $('learningIndex').hidden=true;$('learningLessonPage').hidden=true;$('learningAreaPage').hidden=false;
 $('learningAreaTitle').textContent=area.name;$('learningAreaDesc').textContent=area.desc;
 if(id==='plasma'){
  $('learningTopics').innerHTML=area.topics.map((t,i)=>`<article class="learning-topic-card"><div class="learning-topic-top"><span class="learning-topic-number">${String(i+1).padStart(2,'0')}</span><span class="learning-topic-status is-ready">${t.pages}</span></div><h2>${t.title}</h2><p>${t.desc}</p><button type="button" class="learning-topic-action" data-lesson="${t.id}">Estudiar tema →</button></article>`).join('')+`<article class="learning-topic-card learning-quiz-card"><div class="learning-topic-top"><span class="learning-topic-number">✓</span><span class="learning-topic-status">Autoevaluación</span></div><h2>Repaso del CNC MASTER XP</h2><p>Preguntas para comprobar lo aprendido del manual.</p><button type="button" class="learning-topic-action" id="learningOpenQuiz">Comenzar repaso →</button></article>`;
  $('learningTopics').querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>openLesson(b.dataset.lesson));
  $('learningOpenQuiz').onclick=openQuiz;
 }else{
  $('learningTopics').innerHTML=area.topics.map((t,i)=>`<article class="learning-topic-card"><div class="learning-topic-top"><span class="learning-topic-number">${String(i+1).padStart(2,'0')}</span><span class="learning-topic-status ${t[2]==='Abrir módulo'&&canKnowledge?'is-ready':''}">${t[2]==='Abrir módulo'&&!canKnowledge?'Permiso adicional':t[2]}</span></div><h2>${t[0]}</h2><p>${t[1]}</p>${t[2]==='Abrir módulo'&&canKnowledge?'<button type="button" class="learning-topic-action" id="learningOpenKnowledge">Abrir Conocimiento 3D →</button>':`<span class="learning-topic-note">${t[2]==='Abrir módulo'?'Disponible para usuarios con permiso de Conocimiento.':'Material de capacitación a incorporar'}</span>`}</article>`).join('');
  $('learningOpenKnowledge')?.addEventListener('click',()=>{
   $('learningApp').classList.remove('show');$('modulePicker')?.classList.remove('hidden');
   const launcher=$('goKnowledgeLauncher')||$('goKnowledge');
   if(launcher){launcher.click();return}
   alert('No se encontró el acceso a Conocimiento 3D. Verificá que tu usuario tenga habilitado el permiso de Conocimiento.');
  });
 }
}
function openLesson(id){
 const lesson=plasmaLessons.find(x=>x.id===id);if(!lesson)return;
 $('learningAreaPage').hidden=true;$('learningLessonPage').hidden=false;
 $('learningLessonTitle').textContent=lesson.title;$('learningLessonDesc').textContent=lesson.desc;
 $('learningLessonSource').textContent='CNC MASTER XP · '+lesson.pages;
 $('learningLessonContent').innerHTML=lesson.sections.map((s,i)=>`<article class="learning-lesson-section"><div class="learning-lesson-index">${String(i+1).padStart(2,'0')}</div><div><h2>${s.heading}</h2><p>${s.body}</p></div></article>`).join('')+`<div class="learning-source-note"><b>Base de este contenido:</b> manual CNC MASTER versión XP. Esta capacitación explica el documento; no reemplaza la formación práctica, los parámetros validados de la máquina ni los procedimientos de seguridad de AgroDiseño.</div>`;
}
function openQuiz(){
 $('learningAreaPage').hidden=true;$('learningLessonPage').hidden=false;
 $('learningLessonTitle').textContent='Autoevaluación · Corte Plasma';
 $('learningLessonDesc').textContent='Respondé según el manual CNC MASTER XP. Al finalizar vas a ver el resultado y la explicación de cada respuesta.';
 $('learningLessonSource').textContent='REPASO DEL MANUAL';
 $('learningLessonContent').innerHTML=`<form id="plasmaQuizForm" class="learning-quiz-form">${plasmaQuiz.map((q,i)=>`<fieldset class="learning-question"><legend>${i+1}. ${q.q}</legend>${q.opts.map((o,j)=>`<label class="learning-answer"><input type="radio" name="q${i}" value="${j}"><span>${o}</span></label>`).join('')}</fieldset>`).join('')}<button class="learning-topic-action learning-quiz-submit" type="submit">Corregir respuestas</button><div id="plasmaQuizResult" aria-live="polite"></div></form>`;
 $('plasmaQuizForm').onsubmit=e=>{
  e.preventDefault();let score=0;const details=plasmaQuiz.map((q,i)=>{const chosen=$('plasmaQuizForm').querySelector(`input[name="q${i}"]:checked`);const ok=!!chosen&&Number(chosen.value)===q.a;if(ok)score++;return `<div class="learning-quiz-feedback ${ok?'correct':'incorrect'}"><b>${i+1}. ${ok?'Correcto':'Para revisar'}</b><p>${q.why}</p></div>`});
  $('plasmaQuizResult').innerHTML=`<div class="learning-quiz-score">Resultado: ${score} de ${plasmaQuiz.length}</div>${details.join('')}`;
  $('plasmaQuizResult').scrollIntoView({behavior:'smooth',block:'start'});
 };
}
function addLauncher(){
 const cards=document.querySelector('#modulePicker .module-cards');
 if(!cards||$('goLearning'))return false;
 const btn=document.createElement('button');btn.type='button';btn.className='module-card';btn.id='goLearning';
 btn.innerHTML='<div class="module-icon">📚</div><div class="module-name">Aprendizaje</div><div class="module-desc">Capacitación por sector, simuladores, instructivos y evaluaciones.</div>';
 btn.addEventListener('click',()=>{
  $('modulePicker')?.classList.add('hidden');$('shell')?.classList.add('hidden');$('sparesApp')?.classList.add('hidden');
  $('carriersApp')?.classList.add('hidden');$('transportApp')?.classList.add('hidden');
  $('knowledgeAppV5')?.classList.remove('show');
  build();showAreas();$('learningApp').classList.add('show');$('learningApp').setAttribute('aria-hidden','false');
 });
 cards.appendChild(btn);return true;
}
async function checkAccess(){
 const {data:{session}}=await sb.auth.getSession();const email=session?.user?.email?.trim().toLowerCase();
 if(!email)return {learning:false,knowledge:false};
 const {data,error}=await sb.from('allowed_users').select('can_taller,can_conocimiento').eq('email',email).maybeSingle();
 if(error||!data)return {learning:false,knowledge:false};
 return {learning:!!data.can_taller||!!data.can_conocimiento,knowledge:!!data.can_conocimiento};
}
async function boot(){
 const access=await checkAccess();allowed=access.learning;canKnowledge=access.knowledge;if(!allowed)return;
 if(addLauncher())return;
 const observer=new MutationObserver(()=>{if(!allowed){observer.disconnect();return}if(addLauncher())observer.disconnect()});
 observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>{if(addLauncher())observer.disconnect()},2500);
}
boot();
sb.auth.onAuthStateChange(async()=>{
 const access=await checkAccess();allowed=access.learning;canKnowledge=access.knowledge;
 if(!allowed){$('goLearning')?.remove();$('learningApp')?.classList.remove('show');return}addLauncher();
});
