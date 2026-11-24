import { sb } from './supabase-client.js';
import { plasmaPath, plasmaQuiz } from './aprendizaje-plasma.js';
import { getPlasmaVisual } from './aprendizaje-visuales.js?v=20261124-visual2';

const $=id=>document.getElementById(id);
let allowed=false,canKnowledge=false,currentArea=null,currentMission=null,currentStep=0;
let quizIndex=0,quizAnswers={};

const areas=[
 {id:'plasma',icon:'🔥',name:'Corte plasma',desc:'Aprendé a usar el pantógrafo desde cero, paso a paso.'},
 {id:'laser',icon:'⚡',name:'Láser',desc:'Operación, parámetros y mantenimiento',topics:[['Conocer el equipo','Componentes, fuentes, cabezal y sistemas auxiliares.'],['Preparar un trabajo','Archivos, materiales y espesores.'],['Operación y parámetros','Secuencia de trabajo y parámetros autorizados.'],['Seguridad y mantenimiento','Inspecciones, limpieza y mantenimiento preventivo.']]},
 {id:'taller',icon:'🔧',name:'Taller',desc:'Procesos, herramientas y procedimientos',topics:[['Procedimientos de taller','Secuencias de trabajo y buenas prácticas.'],['Herramientas y equipos','Uso correcto, inspección y cuidado.'],['Seguridad general','Orden, limpieza, EPP y prevención de riesgos.'],['Conocimiento 3D','Modelos, piezas, fotografías e instructivos interactivos.','Abrir módulo']]},
 {id:'torneria',icon:'⚙️',name:'Tornería',desc:'Torno CNC, programación y medición',topics:[['Conocer el torno','Componentes, mandril, herramientas y referencias.'],['Programación CNC','Estructura de programas y operaciones.'],['Mecanizado y herramientas','Selección de herramientas y secuencias.'],['Medición y control','Instrumentos, tolerancias y verificación.']]}
];

function injectCss(){
 if(document.querySelector('link[href*="aprendizaje.css"]'))return;
 const link=document.createElement('link');link.rel='stylesheet';link.href='./aprendizaje.css?v=20261124-visual2';document.head.appendChild(link);
}
function build(){
 if($('learningApp'))return;
 injectCss();
 document.body.insertAdjacentHTML('beforeend',`
 <div id="learningApp" class="learning-app" aria-hidden="true">
  <header class="learning-header">
   <div><div class="learning-brand">AGRO<span>DISEÑO</span></div><div class="learning-kicker">CENTRO DE CAPACITACIÓN</div></div>
   <button type="button" id="learningHome" class="learning-btn learning-btn-quiet">← Inicio</button>
  </header>
  <main class="learning-main">
   <section id="learningIndex">
    <div class="learning-intro"><div class="learning-eyebrow">FORMACIÓN INTERNA</div><h1>Aprendizaje</h1><p>Elegí el sector que querés aprender.</p></div>
    <div id="learningAreas" class="learning-area-grid"></div>
   </section>
   <section id="learningAreaPage" hidden>
    <button type="button" id="learningBackAreas" class="learning-back">← Sectores</button>
    <div class="learning-intro learning-intro-compact"><div class="learning-eyebrow">CAPACITACIÓN</div><h1 id="learningAreaTitle"></h1><p id="learningAreaDesc"></p></div>
    <div id="learningTopics" class="learning-topic-grid"></div>
   </section>
   <section id="learningLessonPage" hidden>
    <button type="button" id="learningBackTopics" class="learning-back">← Volver al recorrido</button>
    <div class="learning-guided-head">
     <div class="learning-eyebrow" id="learningLessonSource"></div>
     <div class="learning-progress-track"><span id="learningProgressFill"></span></div>
     <div class="learning-step-count" id="learningStepCount"></div>
     <h1 id="learningLessonTitle"></h1><p id="learningLessonDesc"></p>
    </div>
    <div id="learningLessonContent" class="learning-guided-content"></div>
    <div class="learning-guided-actions" id="learningGuidedActions"></div>
   </section>
   <section id="learningQuizPage" hidden>
    <button type="button" id="learningBackQuiz" class="learning-back">← Volver al recorrido</button>
    <div class="learning-guided-head"><div class="learning-eyebrow">REPASO FINAL</div><div class="learning-step-count" id="quizStepCount"></div><h1>¿Qué aprendiste?</h1><p>Respondé tranquilo. Después de cada respuesta te explicamos por qué.</p></div>
    <div id="learningQuizContent" class="learning-guided-content"></div>
    <div id="learningQuizActions" class="learning-guided-actions"></div>
   </section>
  </main>
  <footer class="learning-footer">AgroDiseño · Capacitación interna</footer>
 </div>`);
 $('learningHome').onclick=showModulePicker;
 $('learningBackAreas').onclick=showAreas;
 $('learningBackTopics').onclick=showTopics;
 $('learningBackQuiz').onclick=showTopics;
 $('learningAreas').innerHTML=areas.map(a=>`<button type="button" class="learning-area-card" data-area="${a.id}"><span class="learning-area-icon">${a.icon}</span><span class="learning-area-name">${a.name}</span><span class="learning-area-desc">${a.desc}</span><span class="learning-area-link">Ingresar <b>→</b></span></button>`).join('');
 $('learningAreas').querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>openArea(b.dataset.area));
}
function showModulePicker(){
 $('learningApp')?.classList.remove('show');$('learningApp')?.setAttribute('aria-hidden','true');$('modulePicker')?.classList.remove('hidden');
}
function showAreas(){
 $('learningAreaPage').hidden=true;$('learningLessonPage').hidden=true;$('learningQuizPage').hidden=true;$('learningIndex').hidden=false;currentArea=null;
}
function showTopics(){
 $('learningLessonPage').hidden=true;$('learningQuizPage').hidden=true;$('learningIndex').hidden=true;$('learningAreaPage').hidden=false;
}
function openArea(id){
 const area=areas.find(x=>x.id===id);if(!area)return;currentArea=area;
 $('learningIndex').hidden=true;$('learningLessonPage').hidden=true;$('learningQuizPage').hidden=true;$('learningAreaPage').hidden=false;
 $('learningAreaTitle').textContent=area.name;$('learningAreaDesc').textContent=area.id==='plasma'?'No necesitás experiencia. Empezá por el primer tema y avanzá de a poco.':'Elegí un tema para conocer los procedimientos de este sector.';
 if(id==='plasma'){
  $('learningTopics').innerHTML=`
   <article class="learning-start-card"><div class="learning-start-icon">👋</div><div><div class="learning-start-label">SI NUNCA USASTE UN PANTÓGRAFO</div><h2>Empezá desde cero</h2><p>Te vamos a explicar qué mirar, qué significa cada control y cómo se prepara un trabajo. Un paso a la vez.</p><button type="button" class="learning-topic-action learning-start-button" id="learningStart">Comenzar aprendizaje →</button></div></article>
   <div class="learning-path-label">TU RECORRIDO · 6 TEMAS</div>
   `+plasmaPath.map((m,i)=>`<button type="button" class="learning-path-card" data-mission="${m.id}"><span class="learning-path-number">${String(i+1).padStart(2,'0')}</span><span class="learning-path-icon">${m.icon}</span><span class="learning-path-copy"><b>${m.title}</b><small>${m.subtitle}</small></span><span class="learning-path-arrow">›</span></button>`).join('')+`
   <article class="learning-plain-note"><b>Importante</b><p>Esta capacitación sirve para aprender los controles. No reemplaza la práctica con un operador autorizado. No cambies parámetros ni inicies un corte sin autorización.</p></article>
   <button type="button" class="learning-topic-action learning-quiz-open" id="learningOpenQuiz">Hacer un repaso de lo aprendido →</button>`;
  $('learningStart').onclick=()=>openMission(plasmaPath[0].id);
  $('learningTopics').querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>openMission(b.dataset.mission));
  $('learningOpenQuiz').onclick=openQuiz;
 }else{
  $('learningTopics').innerHTML=(area.topics||[]).map((t,i)=>`<article class="learning-topic-card"><div class="learning-topic-top"><span class="learning-topic-number">${String(i+1).padStart(2,'0')}</span><span class="learning-topic-status">Próximamente</span></div><h2>${t[0]}</h2><p>${t[1]}</p>${t[2]==='Abrir módulo'&&canKnowledge?'<button type="button" class="learning-topic-action" id="learningOpenKnowledge">Abrir Conocimiento 3D →</button>':'<span class="learning-topic-note">Material de capacitación a incorporar</span>'}</article>`).join('');
  $('learningOpenKnowledge')?.addEventListener('click',()=>{
   $('learningApp').classList.remove('show');$('modulePicker')?.classList.remove('hidden');
   const launcher=$('goKnowledgeLauncher')||$('goKnowledge');if(launcher){launcher.click();return}
   alert('No se encontró el acceso a Conocimiento 3D. Verificá que tu usuario tenga habilitado el permiso de Conocimiento.');
  });
 }
}
function openMission(id){
 currentMission=plasmaPath.find(m=>m.id===id);if(!currentMission)return;currentStep=0;
 $('learningAreaPage').hidden=true;$('learningQuizPage').hidden=true;$('learningLessonPage').hidden=false;
 $('learningLessonTitle').textContent=currentMission.title;$('learningLessonDesc').textContent=currentMission.subtitle;
 $('learningLessonSource').textContent='CORTE PLASMA · '+currentMission.icon;
 renderGuidedStep();
}
function renderGuidedStep(){
 const total=currentMission.steps.length,step=currentMission.steps[currentStep];
 const visual=getPlasmaVisual(currentMission.id,currentStep);
 $('learningProgressFill').style.width=((currentStep+1)/total*100)+'%';
 $('learningStepCount').textContent='PASO '+(currentStep+1)+' DE '+total;
 $('learningLessonContent').innerHTML=`
  <article class="learning-simple-step">
   <div class="learning-simple-step-label">AHORA VAMOS A APRENDER</div>
   <h2>${step.title}</h2><p>${step.body}</p>
   <figure class="learning-step-visual"><img src="${visual.src}" alt="${visual.alt}" loading="lazy"><figcaption>${visual.caption}</figcaption></figure>
   <div class="learning-control-example"><span>EN LA PANTALLA VAS A VER</span><strong>${step.key}</strong></div>
   <div class="learning-tip"><span>💡</span><div><b>Recordá esto</b><p>${step.tip}</p></div></div>
  </article>`;
 $('learningGuidedActions').innerHTML=`
  <button type="button" class="learning-back-step" id="learningPrevStep" ${currentStep===0?'disabled':''}>← Anterior</button>
  <button type="button" class="learning-topic-action learning-next-step" id="learningNextStep">${currentStep===total-1?'Terminé este tema ✓':'Siguiente paso →'}</button>`;
 $('learningPrevStep').onclick=()=>{if(currentStep>0){currentStep--;renderGuidedStep()}};
 $('learningNextStep').onclick=()=>{
  if(currentStep<total-1){currentStep++;renderGuidedStep();window.scrollTo({top:0,behavior:'smooth'});}
  else{showTopics();$('learningTopics')?.scrollIntoView({behavior:'smooth',block:'start'});}
 };
}
const panelKeys=[['F8','CORTAR','#c93636'],['F9','SIMULAR','#f4d03f'],['F7','CARGAR','#298b4c'],['F10','ABORT','#c93636'],['F11','PAUS/CONT','#298b4c'],['R','RETROCEDE','#a5dfe6'],['F12','BQ A BQ','#a5dfe6'],['Z','DEFINIR CERO','#a9b8d8'],['HOME','ORIGEN','#a9b8d8'],['PLS','PLASMA','#a9b8d8']];
const panelQuiz=[
 {q:'Querés comprobar el recorrido únicamente en la pantalla, sin movimiento de la máquina. ¿Qué control identificás?',a:'F9',why:'F9: SIMULAR representa gráficamente el recorrido.'},
 {q:'Después de rotar una figura, ¿qué control vuelve a cargar su dibujo?',a:'F7',why:'F7: CARGAR vuelve a cargar la figura o nesting.'},
 {q:'¿Qué control permite pausar o continuar una rutina?',a:'F11',why:'F11: PAUS/CONT permite pausar o continuar. No sustituye la parada de emergencia.'},
 {q:'¿Qué control corresponde al retorno al origen de máquina?',a:'HOME',why:'HOME corresponde al retorno al Cero Máquina. En una máquina real provoca movimiento.'},
 {q:'¿Qué selector corresponde al proceso de corte plasma?',a:'PLS',why:'PLS activa o desactiva la selección de plasma.'},
 {q:'¿Qué control permite abortar la secuencia?',a:'F10',why:'F10: ABORT permite abortar la secuencia; durante la ejecución puede mostrar PARAR.'},
 {q:'¿Qué función permite revisar el recorrido bloque a bloque?',a:'F12',why:'F12: BQ A BQ es una herramienta de revisión, no una función de corte.'},
 {q:'¿Qué control corresponde a definir el cero?',a:'Z',why:'Z: DEFINIR CERO establece el cero descrito en el manual.'},
 {q:'¿Qué control ejecuta la rutina cargada?',a:'F8',why:'F8: CORTAR ejecuta la rutina; puede producir movimiento o corte en el equipo real.'},
 {q:'¿Qué función está asociada a retroceder por la trayectoria?',a:'R',why:'R: RETROCEDE corresponde a la recuperación de trayectoria descrita en el manual.'}
];
let quizMode='panel';
function openQuiz(){
 quizIndex=0;quizAnswers={};$('learningAreaPage').hidden=true;$('learningLessonPage').hidden=true;$('learningQuizPage').hidden=false;
 $('quizStepCount').textContent='ELEGÍ EL TIPO DE REPASO';
 $('learningQuizContent').innerHTML='<article class="learning-simple-step"><h2>¿Cómo querés practicar?</h2><p>Identificá los controles del CNC en una botonera virtual o repasá los conceptos del manual.</p><div style="display:grid;gap:12px;margin-top:20px"><button type="button" class="learning-topic-action" id="quizPanelMode">Practicar con la botonera →</button><button type="button" class="learning-topic-action" id="quizTheoryMode">Preguntas teóricas →</button></div><p style="margin-top:18px">La práctica es únicamente una simulación educativa, sin conexión a la máquina.</p></article>';
 $('learningQuizActions').innerHTML='';
 $('quizPanelMode').onclick=()=>{quizMode='panel';renderQuizQuestion()};
 $('quizTheoryMode').onclick=()=>{quizMode='theory';renderQuizQuestion()};
}
function renderQuizQuestion(){
 const qs=quizMode==='panel'?panelQuiz:plasmaQuiz,q=qs[quizIndex],chosen=quizAnswers[quizIndex],answered=chosen!==undefined;
 $('quizStepCount').textContent='PREGUNTA '+(quizIndex+1)+' DE '+qs.length;
 const keys=quizMode==='panel'?panelKeys:q.opts.map((o,i)=>[i,o,'#dce3ed']);
 const keypad=keys.map(([id,label,color])=>{
 const correct=answered&&id===q.a,wrong=answered&&id===chosen&&id!==q.a;
 return `<button type="button" data-answer="${id}" ${answered?'disabled':''} style="min-height:64px; padding:10px 6px; border-radius:8px; border:3px solid ${correct?'#16a34a':wrong?'#ef4444':'#5a6472'}; background:${color}; color:${['#c93636','#298b4c'].includes(color)?'#fff':'#111827'}; font:inherit; font-weight:750; box-shadow:0 3px 0 #374151; cursor:${answered?'default':'pointer'}; opacity:${answered&&!correct&&!wrong ? 0.6 : 1}; overflow-wrap:anywhere;">${quizMode==='panel'?'<span style="display:block;font-size:1.2em">'+id+'</span>':''}<span style="display:block;font-size:.86em">${label}</span>${correct?' ✓':wrong?' ✗':''}</button>`;
 }).join('');
 $('learningQuizContent').innerHTML=`<article class="learning-simple-step learning-quiz-simple"><div class="learning-simple-step-label">${quizMode==='panel'?'SIMULADOR · CNC MASTER XP':'PREGUNTA '+(quizIndex+1)}</div><h2>${q.q}</h2>${quizMode==='panel'?'<p>Seleccioná el control en la botonera. No acciona ninguna máquina.</p>':''}<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;background:#202833;padding:14px;border-radius:12px;margin:18px 0;">${keypad}</div></article>`;
 $('learningQuizContent').querySelectorAll('[data-answer]').forEach(el=>el.onclick=()=>{if(answered)return;quizAnswers[quizIndex]=quizMode==='panel'?el.dataset.answer:Number(el.dataset.answer);renderQuizQuestion()});
 const correct=chosen===q.a;
 $('learningQuizActions').innerHTML=!answered?'<span class="learning-quiz-hint">Pulsá una opción para responder.</span>':`<div class="learning-quiz-explain ${correct?'is-correct':'is-review'}" role="status"><b>${correct?'¡Muy bien!':'Vamos a repasarlo'}</b><p>${q.why}</p></div><button type="button" class="learning-topic-action learning-next-step" id="learningQuizNext">${quizIndex===qs.length-1?'Ver resultado':'Siguiente pregunta →'}</button>`;
 $('learningQuizNext')?.addEventListener('click',()=>{
  if(quizIndex<qs.length-1){quizIndex++;renderQuizQuestion()}
  else{
   const score=qs.reduce((n,item,i)=>n+(quizAnswers[i]===item.a?1:0),0);
   $('quizStepCount').textContent='RESULTADO FINAL';
   $('learningQuizContent').innerHTML=`<div class="learning-quiz-final"><h2>Terminaste el repaso</h2><strong>${score} de ${qs.length}</strong><p>${Math.round(score/qs.length*100)}% de aciertos</p><p>Este resultado no reemplaza la capacitación práctica autorizada.</p></div>`;
   $('learningQuizActions').innerHTML='<button type="button" class="learning-topic-action learning-next-step" id="learningQuizRetry">Volver a practicar</button><button type="button" class="learning-back-step" id="learningQuizReturn">Volver al recorrido</button>';
   $('learningQuizRetry').onclick=openQuiz;$('learningQuizReturn').onclick=showTopics;
  }
 });
}
function addLauncher(){
 const cards=document.querySelector('#modulePicker .module-cards');if(!cards||$('goLearning'))return false;
 const btn=document.createElement('button');btn.type='button';btn.className='module-card';btn.id='goLearning';
 btn.innerHTML='<div class="module-icon">📚</div><div class="module-name">Aprendizaje</div><div class="module-desc">Capacitación por sector, simuladores, instructivos y evaluaciones.</div>';
 btn.addEventListener('click',()=>{
  $('modulePicker')?.classList.add('hidden');$('shell')?.classList.add('hidden');$('sparesApp')?.classList.add('hidden');
  $('carriersApp')?.classList.add('hidden');$('transportApp')?.classList.add('hidden');$('knowledgeAppV5')?.classList.remove('show');
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
