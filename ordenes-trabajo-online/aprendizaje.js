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
   <button type="button" class="learning-topic-action learning-quiz-open" id="learningOpenQuiz">Hacer un repaso de lo aprendido →</button><article class="learning-start-card" style="margin-top:16px"><div class="learning-start-icon">⚠️</div><div><div class="learning-start-label">HYPERTHERM SENSOR PHC</div><h2>Búsqueda de averías</h2><p>14 códigos de error y 15 síntomas del control de altura. Consultá qué significa cada alarma y qué debe verificar mantenimiento.</p><button type="button" class="learning-topic-action" id="learningFaults">Consultar errores →</button></div></article>`;
  $('learningStart').onclick=()=>openMission(plasmaPath[0].id);
  $('learningTopics').querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>openMission(b.dataset.mission));
  $('learningOpenQuiz').onclick=openQuiz;
  $('learningFaults').onclick=openFaults;
 }else{
  $('learningTopics').innerHTML=(area.topics||[]).map((t,i)=>`<article class="learning-topic-card"><div class="learning-topic-top"><span class="learning-topic-number">${String(i+1).padStart(2,'0')}</span><span class="learning-topic-status">Próximamente</span></div><h2>${t[0]}</h2><p>${t[1]}</p>${t[2]==='Abrir módulo'&&canKnowledge?'<button type="button" class="learning-topic-action" id="learningOpenKnowledge">Abrir Conocimiento 3D →</button>':'<span class="learning-topic-note">Material de capacitación a incorporar</span>'}</article>`).join('');
  $('learningOpenKnowledge')?.addEventListener('click',()=>{
   $('learningApp').classList.remove('show');$('modulePicker')?.classList.remove('hidden');
   const launcher=$('goKnowledgeLauncher')||$('goKnowledge');if(launcher){launcher.click();return}
   alert('No se encontró el acceso a Conocimiento 3D. Verificá que tu usuario tenga habilitado el permiso de Conocimiento.');
  });
 }
}

const phcFaults=[["E.01","Arranque de ciclo al encender","CNC CYCLE START activo al encender el PHC.","Registrar si el error aparece al encender.","Revisar la señal CYCLE START y su estado inactivo en el CNC antes de autorizar el arranque.",47,"Se elimina al inactivar la señal."],["E.02","Contacto de placa en origen","Contacto óhmico detectado con la antorcha totalmente retraída; posible cortocircuito en cable o consumibles, o fuga de refrigerante.","Informar si se observa humedad o daño externo, sin tocar la antorcha energizada.","Comprobar cable de contacto, consumibles y posibles fugas con aislamiento seguro.",47,"Próximo CYCLE START, una vez corregida la causa."],["E.03","Tiempo agotado del levantador","No se detectó la llegada al destino del movimiento. Posible acople flojo, mangueras o cables trabados, falla de motor o impulsador.","Observar desde una posición segura si hay obstrucciones externas.","Revisar mecánica, acople, cableado y motor con energías aisladas.",48,"Próximo CYCLE START tras corregir la causa."],["E.04","Límite durante operación automática","El levantador alcanzó su límite durante el control por voltaje de arco; recorrido insuficiente o problema de interruptores de límite.","Registrar espesor y posición visible del levantador.","Verificar recorrido disponible, montaje y finales de carrera.",48,"Próximo CYCLE START tras corregir la causa."],["E.05","Tiempo agotado IHS SYNC","Espera de liberación de IHS-SYNC por el CNC después de llegar a altura de perforación. Señal usada en instalaciones de varias antorchas.","Informar que la antorcha alcanzó la posición pero no continuó.","Verificar cableado y programación de la señal IHS-SYNC según la instalación.",48,"Próximo CYCLE START tras corregir la causa."],["E.06","Tiempo agotado de transferencia","No llegó TRANSFER dentro de 5 segundos del inicio de la antorcha. Posibles causas: altura excesiva por IHS fallido, consumibles, gas, conexión a la pieza o señal TRANSFER.","Registrar si hubo arco y si llegó a transferir; no repetir intentos sin autorización.","Revisar altura de perforación, consumibles, configuración de gas, conexión a pieza y señal TRANSFER.",48,"Próximo CYCLE START tras corregir la causa."],["E.07","Arco de plasma perdido","Se perdió transferencia antes de retirar CYCLE START. Posibles causas: salida del borde de chapa, consumibles o ajustes de altura.","Informar dónde se interrumpió el corte y si coincide con un borde de chapa.","Verificar trayectoria, consumibles y ajustes de altura validados.",48,"Próximo CYCLE START tras corregir la causa."],["E.08","Rompedor de antorcha","Se activó el liberador de traba de la antorcha, posiblemente por choque con la pieza.","Detener el trabajo, informar el posible choque y no forzar el montaje.","Comprobar el liberador, sensor magnético y conexiones con procedimiento autorizado. Consultar el diagnóstico del manual; no puentear ni anular protecciones.",48,"Requiere corregir la causa y verificar el sistema de protección antes de reanudar."],["E.09","Tensión de entrada baja","Alimentación del PHC 20% inferior a la nominal.","Registrar el código; no abrir ni intervenir el equipo.","Personal eléctrico autorizado: comprobar alimentación nominal y causa de la caída.",49,"Restablecer alimentación dentro de la gama nominal."],["E.10","Tensión de entrada alta","Alimentación del PHC 15% superior a la nominal.","Registrar el código y avisar a mantenimiento.","Personal eléctrico autorizado: comprobar alimentación y causa de sobretensión.",49,"Restablecer alimentación dentro de la gama nominal."],["E.11","Sobretemperatura","Protección térmica del circuito impulsador del motor.","Detener el trabajo y permitir el enfriamiento; informar si se repite.","Verificar la causa de sobretemperatura si reaparece.",49,"Permitir enfriamiento de la unidad."],["E.12","Traba externa activada","Se activó la traba externa.","No anular la protección; informar al responsable.","Verificar el estado de la entrada de traba externa y el circuito de seguridad.",49,"Restablecer la condición segura; no puentear la traba."],["E.13","Contacto excesivo con placa","La punta tocó la chapa durante el corte; posible tensión de arco fijada demasiado baja o consumibles desgastados.","Informar contacto de antorcha y estado aparente del trabajo.","Revisar consumibles y ajuste de voltaje conforme al proceso validado.",49,"Próximo CYCLE START tras corregir la causa."],["E.99","Error interno de software","Condición inesperada del software del PHC.","Registrar código y avisar al responsable.","Rearme mediante apagado y encendido controlado del PHC; si persiste, servicio autorizado.",49,"Rearme de alimentación según el manual."]];
const phcSymptoms=[["LED rojo y código visible","Registrar el código E.XX y consultar su ficha.",50],["Sin reacción a CYCLE START","Comprobar alimentación, fusible y señal de arranque por personal autorizado.",50],["La antorcha enciende antes de completar IHS","Revisar configuración de preflujo durante IHS y señal de sostén de esquina, si se utiliza.",50],["No hay movimiento IHS","Comprobar modo automático, obstrucción de cables/mangueras y fuerza de detención.",50],["IHS impreciso por contacto óhmico","Revisar modo automático, contacto óhmico, capucha, humedad o recubrimientos de chapa, boquilla/protección y conexión a pieza.",50],["IHS impreciso por fuerza de detención","Revisar configuración de detección, fuerza de detención, flexión y soporte de chapa.",50],["La antorcha no enciende","Comprobar alimentación del plasma, altura IHS, señal IHS SYNC y consumibles.",50],["La antorcha no transfiere","Revisar altura de perforación, conexión a pieza, consumibles y flujo de gas de preflujo.",50],["Arco se apaga tras transferir y deja agujero grande","Revisar demora de perforación, señal de movimiento y estado/velocidad del CNC.",51],["Comienza a cortar antes de completar perforación","Revisar si la demora de perforación es demasiado corta.",51],["Antorcha baja al iniciar control de voltaje","Revisar voltaje de arco fijado, demora de aceleración y calibración del voltaje.",51],["Antorcha sube al iniciar control de voltaje","Revisar voltaje de arco fijado, altura de perforación y calibración.",51],["Control de voltaje errático","Verificar conexiones de tierra y posibles fugas de agua de la antorcha.",51],["No se retrae al finalizar corte","Revisar configuración de retracción y obstrucciones de antorcha, cables y mangueras.",51],["Error del rompedor sin desprendimiento visible","Mantenimiento debe diagnosticar sensor magnético, tierra, cableado y PHC; consultar servicio autorizado. No puentear protecciones.",51]];
function openFaults(){
 $('learningAreaPage').hidden=true;$('learningLessonPage').hidden=true;$('learningQuizPage').hidden=false;
 $('quizStepCount').textContent='DIAGNÓSTICO · HYPERTHERM SENSOR PHC';
 $('learningQuizContent').innerHTML=`<article class="learning-simple-step"><div class="learning-simple-step-label">SECCIÓN 4 · BÚSQUEDA DE AVERÍAS</div><h2>¿Qué error aparece?</h2><p>Consultá los códigos del controlador de altura Sensor PHC, no los códigos de la fuente Powermax ni del CNC MASTER XP.</p><div style="background:#202833;color:#fff;border-radius:12px;padding:16px;text-align:center;margin:16px 0"><small>Hypertherm · Sensor PHC (representación)</small><div style="background:#151515;color:#ff6565;font:bold 44px monospace;margin:10px auto;padding:8px;max-width:200px;border-radius:6px" id="phcDisplay">E.--</div><span style="color:#ff7373">● ERROR</span></div><label for="phcSearch"><b>Buscar código o síntoma</b></label><input id="phcSearch" type="search" placeholder="Ej. E.06, arco, levantador" style="width:100%;box-sizing:border-box;padding:12px;font:inherit;border:1px solid #999;border-radius:8px;margin:8px 0"><div id="phcCodeButtons" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(85px,1fr));gap:8px"></div><div id="phcDetail" aria-live="polite" style="margin-top:16px"></div><h2 style="margin-top:25px">Buscar por síntoma</h2><div id="phcSymptoms"></div><p><small>Fuente: Hypertherm Sensor PHC, guía de instalación y operación (2008), sección 4, págs. 47–52. IHS = percepción inicial de altura. Aplicar solamente al modelo indicado.</small></p></article>`;
 $('learningQuizActions').innerHTML='<button type="button" class="learning-back-step" id="phcBack">Volver a Corte plasma</button>';
 $('phcBack').onclick=showTopics;
 const norm=t=>t.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9 ]/g,'');
 function selectFault(c){
  $('phcDisplay').textContent=c[0];
  $('phcDetail').innerHTML=`<div style="border:1px solid #dc2626;border-radius:10px;padding:14px"><h2>${c[0]} · ${c[1]}</h2><h3>Qué significa / posibles causas</h3><p>${c[2]}</p><h3>Operario · primera comprobación</h3><p>${c[3]}</p><h3>Mantenimiento autorizado</h3><p>${c[4]}</p><h3>Rearme según el manual</h3><p>${c[6]}</p><p><small>Manual, pág. ${c[5]}. No iniciar un ciclo solo para borrar el error; verificar primero la condición segura.</small></p></div>`;
  $('phcCodeButtons').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.code===c[0])));
 }
 function render(){
  const q=norm($('phcSearch').value.trim()),list=phcFaults.filter(c=>norm(c.join(' ')).includes(q)),syms=phcSymptoms.filter(c=>norm(c.join(' ')).includes(q));
  $('phcCodeButtons').innerHTML=list.map(c=>`<button type="button" data-code="${c[0]}" aria-pressed="false" class="learning-back-step" style="min-height:46px;font-weight:bold">${c[0]}</button>`).join('')||'<p>No hay códigos coincidentes.</p>';
  $('phcCodeButtons').querySelectorAll('button').forEach(b=>b.onclick=()=>selectFault(phcFaults.find(c=>c[0]===b.dataset.code)));
  $('phcSymptoms').innerHTML=syms.map(c=>`<details style="border-bottom:1px solid #cbd5e1;padding:12px 0"><summary style="cursor:pointer;font-weight:700">${c[0]}</summary><p>${c[1]}</p><small>Comprobaciones de mantenimiento · manual pág. ${c[2]}</small></details>`).join('')||'<p>No hay síntomas coincidentes.</p>';
  if(list.length===1)selectFault(list[0]);else{$('phcDisplay').textContent='E.--';$('phcDetail').innerHTML=''}
 }
 $('phcSearch').oninput=render;render();
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
const fieldKeys=[['ARCHIVO','Nº de programa','#dce3ed'],['BLQ ACT','Bloque actual','#dce3ed'],['BLQ INICIAL','Inicio','#dce3ed'],['BLQ FIN','Fin','#dce3ed'],['PIEZA','Coordenadas','#a5dfe6'],['MAQUINA','Coordenadas','#a9b8d8'],['VEL CORTE','Velocidad','#a9b8d8'],['VEL RAPIDA','Desplazamiento','#a9b8d8'],['SANGRIA','Compensación','#a9b8d8'],['ACEL','Aceleración','#a9b8d8'],['PERF PLASMA','Tiempo restante','#a9b8d8'],['MENSAJE','Información','#dce3ed']];
const fieldQuiz=[
{q:'¿Dónde se identifica el número del programa cargado?',a:'ARCHIVO',why:'Archivo Nº identifica el programa (pág. 3).'},
{q:'¿Qué campo muestra la instrucción que está ejecutando el CNC?',a:'BLQ ACT',why:'BLQ ACT indica el bloque actual (pág. 3).'},
{q:'¿Qué campo identifica el límite de inicio de un tramo del programa?',a:'BLQ INICIAL',why:'BLQ INICIAL delimita el comienzo (pág. 3). No modificar sin autorización.'},
{q:'¿Qué campo identifica el límite final de un tramo del programa?',a:'BLQ FIN',why:'BLQ FIN delimita el final (pág. 3).'},
{q:'¿Qué cuadro muestra la posición relativa al cero de la pieza?',a:'PIEZA',why:'El cuadro PIEZA muestra las coordenadas relativas al cero de pieza (pág. 2).'},
{q:'¿Qué cuadro muestra la posición respecto al origen de máquina?',a:'MAQUINA',why:'El cuadro MAQUINA muestra la posición respecto al cero máquina (pág. 2).'},
{q:'¿Qué campo corresponde a la velocidad durante el corte?',a:'VEL CORTE',why:'VEL CORTE es la velocidad de trabajo (pág. 5).'},
{q:'¿Qué campo corresponde a la velocidad de desplazamiento rápido?',a:'VEL RAPIDA',why:'VEL RAPIDA corresponde al desplazamiento (pág. 5).'},
{q:'¿Qué campo compensa el ancho del corte?',a:'SANGRIA',why:'SANGRIA compensa el material retirado (pág. 5).'},
{q:'¿Qué campo determina cómo se alcanza la velocidad programada?',a:'ACEL',why:'ACEL representa la aceleración (pág. 5).'},
{q:'¿Dónde aparece el tiempo de perforado restante del plasma?',a:'PERF PLASMA',why:'Perf. Plasma muestra ese tiempo (pág. 6).'},
{q:'¿En qué cuadro puede aparecer el nombre de la pieza?',a:'MENSAJE',why:'El manual indica que Mensaje puede mostrar el nombre de la pieza (pág. 3).'}
];
const scenarioQuiz=[
{q:'Llegás al pantógrafo y no sabés dónde está definido el cero. ¿Qué hacés?',opts:['Iniciar el trabajo','Solicitar al responsable que verifique el cero','Cambiar los parámetros'],a:1,why:'La ubicación del cero debe verificarse antes de operar. No inicies un movimiento sin autorización.'},
{q:'La pieza en pantalla no coincide con el trabajo solicitado. ¿Cómo actuás?',opts:['Continuar con el archivo actual','Modificar la sangría','Detener la preparación y verificar el programa con el responsable'],a:2,why:'Antes de operar se debe comprobar que el archivo corresponde al trabajo.'},
{q:'Necesitás observar el recorrido sin mover el pantógrafo. ¿Qué función corresponde?',opts:['F9 SIMULAR','F8 CORTAR','HOME'],a:0,why:'F9 simula a nivel gráfico (pág. 4).'},
{q:'Encontrás valores de velocidad y perforado en una captura del manual. ¿Qué hacés?',opts:['Copiarlos para cualquier chapa','Consultar la configuración validada del trabajo','Aumentarlos hasta que corte'],a:1,why:'Las capturas muestran ejemplos; los parámetros dependen del equipo y del proceso.'},
{q:'Durante una práctica observás una pérdida de corte. ¿Qué corresponde a un principiante?',opts:['Intentar recuperar el corte sin ayuda','Modificar el cero','Avisar al operador responsable y seguir el procedimiento autorizado'],a:2,why:'La recuperación exige capacitación y un procedimiento autorizado.'},
{q:'Una pieza sale fuera de medida. ¿Cuál es la respuesta apropiada?',opts:['Informar y verificar medidas con el responsable','Cambiar la sangría sin consultar','Aumentar la velocidad'],a:0,why:'La sangría afecta la medida (pág. 5), pero no debe modificarse sin validar la causa.'}
];
let activeQuestions=[],isRetry=false;
function startPractice(mode,subset=null){
 quizMode=mode;quizIndex=0;quizAnswers={};isRetry=!!subset;
 activeQuestions=subset||[...(mode==='panel'?panelQuiz:mode==='fields'?fieldQuiz:mode==='scenario'?scenarioQuiz:plasmaQuiz)];
 for(let i=activeQuestions.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[activeQuestions[i],activeQuestions[j]]=[activeQuestions[j],activeQuestions[i]]}
 renderQuizQuestion();
}
let quizMode='panel';
function openQuiz(){
 quizIndex=0;quizAnswers={};$('learningAreaPage').hidden=true;$('learningLessonPage').hidden=true;$('learningQuizPage').hidden=false;
 $('quizStepCount').textContent='ELEGÍ EL TIPO DE REPASO';
 $('learningQuizContent').innerHTML='<article class="learning-simple-step"><h2>¿Cómo querés practicar?</h2><p>Identificá los controles del CNC en una botonera virtual o repasá los conceptos del manual.</p><div style="display:grid;gap:12px;margin-top:20px"><button type="button" class="learning-topic-action" id="quizPanelMode">Practicar con la botonera →</button><button type="button" class="learning-topic-action" id="quizFieldsMode">Reconocer campos del CNC · 12 preguntas →</button><button type="button" class="learning-topic-action" id="quizScenarioMode">Situaciones de taller · 6 casos →</button><button type="button" class="learning-topic-action" id="quizTheoryMode">Preguntas teóricas →</button></div><p style="margin-top:18px">La práctica es únicamente una simulación educativa, sin conexión a la máquina.</p></article>';
 $('learningQuizActions').innerHTML='';
 $('quizPanelMode').onclick=()=>startPractice('panel');
 $('quizFieldsMode').onclick=()=>startPractice('fields');
 $('quizScenarioMode').onclick=()=>startPractice('scenario');
 $('quizTheoryMode').onclick=()=>startPractice('theory');
}
function renderQuizQuestion(){
 const qs=activeQuestions,q=qs[quizIndex],chosen=quizAnswers[quizIndex],answered=chosen!==undefined;
 $('quizStepCount').textContent='PREGUNTA '+(quizIndex+1)+' DE '+qs.length;
 const visualMode=quizMode==='panel'||quizMode==='fields';
 const keys=quizMode==='panel'?panelKeys:quizMode==='fields'?fieldKeys:q.opts.map((o,i)=>[i,o,'#dce3ed']);
 const keypad=keys.map(([id,label,color])=>{
 const correct=answered&&id===q.a,wrong=answered&&id===chosen&&id!==q.a;
 return `<button type="button" data-answer="${id}" ${answered?'disabled':''} style="min-height:64px; padding:10px 6px; border-radius:8px; border:3px solid ${correct?'#16a34a':wrong?'#ef4444':'#5a6472'}; background:${color}; color:${['#c93636','#298b4c'].includes(color)?'#fff':'#111827'}; font:inherit; font-weight:750; box-shadow:0 3px 0 #374151; cursor:${answered?'default':'pointer'}; opacity:${answered&&!correct&&!wrong ? 0.6 : 1}; overflow-wrap:anywhere;">${visualMode?'<span style="display:block;font-size:1.2em">'+id+'</span>':''}<span style="display:block;font-size:.86em">${label}</span>${correct?' ✓':wrong?' ✗':''}</button>`;
 }).join('');
 $('learningQuizContent').innerHTML=`<article class="learning-simple-step learning-quiz-simple"><div class="learning-simple-step-label">${visualMode?'SIMULADOR · CNC MASTER XP':'PREGUNTA '+(quizIndex+1)}</div><div role="progressbar" aria-valuenow="${quizIndex+1}" aria-valuemin="0" aria-valuemax="${qs.length}" style="height:7px;border-radius:8px;background:#dce3ed;overflow:hidden;margin:12px 0"><div style="height:100%;background:#dc2626;width:${(quizIndex+1)/qs.length*100}%"></div></div><h2>${q.q}</h2>${visualMode?'<p>Seleccioná el control en la botonera. No acciona ninguna máquina.</p>':''}<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;background:#202833;padding:14px;border-radius:12px;margin:18px 0;">${keypad}</div></article>`;
 $('learningQuizContent').querySelectorAll('[data-answer]').forEach(el=>el.onclick=()=>{if(answered)return;quizAnswers[quizIndex]=visualMode?el.dataset.answer:Number(el.dataset.answer);renderQuizQuestion()});
 const correct=chosen===q.a;
 $('learningQuizActions').innerHTML=!answered?'<span class="learning-quiz-hint">Pulsá una opción para responder.</span>':`<div class="learning-quiz-explain ${correct?'is-correct':'is-review'}" role="status"><b>${correct?'¡Muy bien!':'Vamos a repasarlo'}</b><p>${q.why}</p></div><button type="button" class="learning-topic-action learning-next-step" id="learningQuizNext">${quizIndex===qs.length-1?'Ver resultado':'Siguiente pregunta →'}</button>`;
 $('learningQuizNext')?.addEventListener('click',()=>{
  if(quizIndex<qs.length-1){quizIndex++;renderQuizQuestion()}
  else{
   const score=qs.reduce((n,item,i)=>n+(quizAnswers[i]===item.a?1:0),0);
   const errors=qs.filter((item,i)=>quizAnswers[i]!==item.a);
   $('quizStepCount').textContent='RESULTADO FINAL';
   $('learningQuizContent').innerHTML=`<div class="learning-quiz-final"><h2>Terminaste el repaso</h2><strong>${score} de ${qs.length}</strong><p>${Math.round(score/qs.length*100)}% de aciertos</p><p>Este resultado no reemplaza la capacitación práctica autorizada.</p></div>${errors.length?'<article class="learning-simple-step"><h2>Temas para repasar</h2>'+errors.map(e=>'<div style="padding:12px 0;border-bottom:1px solid #dce3ed"><b>'+e.q+'</b><p>'+e.why+'</p></div>').join('')+'</article>':''}`;
   $('learningQuizActions').innerHTML='<button type="button" class="learning-topic-action learning-next-step" id="learningQuizRetry">Volver a practicar</button><button type="button" class="learning-back-step" id="learningQuizReturn">Volver al recorrido</button>';
   if(errors.length){$('learningQuizActions').insertAdjacentHTML('afterbegin','<button type="button" class="learning-topic-action" id="quizRetryErrors">Practicar solamente mis errores →</button>');$('quizRetryErrors').onclick=()=>startPractice(quizMode,errors);}
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
