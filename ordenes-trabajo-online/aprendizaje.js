import { sb } from './supabase-client.js';
import { plasmaPath, plasmaQuiz } from './aprendizaje-plasma.js';
import { getPlasmaVisual } from './aprendizaje-visuales.js';

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
 const link=document.createElement('link');link.rel='stylesheet';link.href='./aprendizaje.css?v=20261124-visual1';document.head.appendChild(link);
}
// Vistas esquemáticas basadas en las capturas del manual CNC MASTER XP.
const rect=(x,y,w,h,fill="#d4d4d4",stroke="#555",rx=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const txt=(x,y,t,size=17,color="#111",weight=600,anchor="start")=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${t}</text>`;
const btn=(x,y,w,h,t,fill="#d9e0e8",color="#111",size=15)=>rect(x,y,w,h,fill,"#444",4)+txt(x+w/2,y+h/2+size*.34,t,size,color,800,"middle");
const field=(x,y,w,h,t)=>rect(x,y,w,h,"#071d9a","#222",2)+txt(x+w/2,y+h/2+6,t,17,"#fff",700,"middle");
const focusRect=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#ef4444" fill-opacity=".08" stroke="#ef5964" stroke-width="7" stroke-dasharray="15 8"/>`;
const svgUrl=s=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
function mainSvg(focus){
 let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" role="img">';
 s+=rect(0,0,1200,700,"#080808","#080808",0)+rect(0,0,1200,28,"#c5c5c5","#777",0)+txt(18,20,"Edición de pantalla:010 · Control CNC",15,"#222",600);
 s+=rect(12,38,600,565,"#f8f8f8","#777",4);
 s+=rect(620,38,570,160,"#999","#555",4);
 s+=btn(680,48,150,34,"PIEZA","#07528d","#fff",18)+btn(850,48,150,34,"MAQUINA","#07528d","#fff",18);
 const rows=[["X","31.6700","31.6700"],["Y","-55.2800","-55.2800"],["Z","0.0000","0.0000"],["U","0.0000","0.0000"],["V","0.0000","0.0000"]];
 rows.forEach((r,i)=>{let y=88+i*21;s+=rect(635,y,38,20,"#d5d5d5","#777",1)+txt(654,y+15,r[0],15,"#222",700,"middle")+rect(676,y,165,20,"#a8f2f4","#777",1)+txt(833,y+15,r[1],16,"#111",700,"end")+field(850,y,150,20,r[2]);});
 s+=btn(1010,130,125,38,"Z:DEFINIR CERO","#aab5cb","#111",13)+btn(1138,130,45,38,"HOME","#aab5cb","#111",13);
 s+=rect(620,205,570,72,"#aaa","#555",4);
 s+=btn(635,214,135,28,"A: ARCHIVO Nº","#ddd","#222",14)+field(773,214,55,28,"2")+txt(842,234,"Mensaje",17,"#172b88",600);
 s+=btn(635,245,110,25,"BLQ ACT","#ddd","#222",13)+field(746,245,55,25,"0")+btn(810,245,145,25,"BLQ INICIAL","#ddd","#222",13)+field(957,245,55,25,"0")+btn(1020,245,100,25,"BLQ FIN","#ddd","#222",13)+field(1122,245,55,25,"0");
 s+=rect(620,282,570,155,"#aaa","#555",4);
 s+=btn(635,294,125,34,"F8: CORTAR","#ef4747","#111",16)+btn(765,294,125,34,"F9: SIMULAR","#f2e74d","#111",16)+btn(895,294,125,34,"F7: CARGAR","#36a653","#111",16);
 s+=btn(635,333,125,34,"F10: ABORT","#ef4747","#111",15)+btn(765,333,125,34,"F11: PAUS/CONT","#37a65a","#111",12)+btn(895,333,125,34,"R: RETROCEDE OFF","#a9edf0","#111",12);
 s+=btn(635,376,125,34,"F12: BQ A BQ","#a9edf0","#111",13);
 s+=txt(1030,305,"ACEL:",15,"#111",700)+field(1080,287,95,25,"100.00")+txt(1030,334,"SANGRIA:",15,"#111",700)+field(1080,316,95,25,"1.0000")+txt(1030,363,"CODIGO M:",15,"#111",700)+field(1080,345,95,25,"0")+txt(1030,393,"VEL SIMULACION:",14,"#111",700)+field(1080,374,95,25,"6000");
 s+=txt(770,400,"VEL CORTE: 6900 mm/min",15,"#111",700)+txt(770,422,"VEL RAPIDA: 10000 mm/min",15,"#111",700);
 s+=rect(620,442,570,75,"#080808","#555",4)+btn(630,451,150,55,"PARAMETROS","#5688bd","#111",17);
 s+=btn(785,451,90,24,"Calent. 0.00","#1d36a6","#fff",12)+btn(785,479,90,24,"Perforado 0.00","#1d36a6","#fff",11)+btn(878,479,100,24,"Perf. Plasma 0.00","#1d36a6","#fff",11);
 s+=btn(1020,451,120,30,"A: IR A XY","#3aa45a","#111",15)+txt(1020,495,"CORTE X: 0.0000",14,"#fff",700)+txt(1020,512,"CORTE Y: 0.0000",14,"#fff",700);
 s+=rect(620,522,570,72,"#ddd","#555",4)+txt(635,548,"Mensaje",17,"#152c88",600)+rect(630,553,550,20,"#ed2027","#fff",1)+txt(640,569,"Mensaje",17,"#fff",600)+txt(635,589,"Mensaje",17,"#152c88",600);
 s+=btn(12,615,55,38,"TOT","#547fa9","#fff",13)+btn(70,615,60,38,"ZM+","#547fa9","#fff",13)+btn(133,615,60,38,"ZM-","#547fa9","#fff",13)+btn(196,615,60,38,"X-","#547fa9","#fff",13)+btn(259,615,60,38,"X+","#547fa9","#fff",13)+btn(322,615,60,38,"Y-","#547fa9","#fff",13)+btn(385,615,60,38,"Y+","#547fa9","#fff",13)+btn(448,615,110,38,"ZOOM  1","#183d77","#fff",13);
 const sel=[["OXI 1","NO"],["OXI 2","NO"],["OXI 3","NO"],["OXI 4","NO"],["Inyec","NO"],["PLS","SI"]];
 sel.forEach((v,i)=>{let x=625+i*93;s+=btn(x,615,54,38,v[0],i===5?"#8b2330":"#e99b45","#111",13)+btn(x+55,615,37,38,v[1],i===5?"#f3e54b":"#fff","#111",13);});
 const areas={graph:[12,38,600,565],positions:[620,38,570,160],files:[620,205,570,72],controls:[620,282,570,155],params:[620,442,570,75],selector:[620,615,570,38]};
 if(areas[focus]){const a=areas[focus];s+=focusRect(...a)}
 return s+'</svg>';
}
function paramsSvg(focus){
 let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" role="img">';
 s+=rect(0,0,1000,560,"#bcbcbc","#666",0);
 const panel=(x,y,w,h,title)=>{let p=rect(x,y,w,h,"#7775c9","#29278b",2)+txt(x+w/2,y+24,title,16,"#fff",800,"middle");return p};
 s+=panel(10,10,330,210,"DESPLAZAMIENTO");
 s+=txt(28,60,"VEL CORTE",16,"#fff")+field(175,40,115,27,"6900 mm/min 100%")+txt(28,92,"VEL RAPIDA",16,"#fff")+field(175,72,115,27,"10000")+txt(28,124,"ACEL",16,"#fff")+field(175,104,115,27,"100.00")+txt(28,156,"SANGRIA",16,"#fff")+field(175,136,115,27,"1.0000")+txt(28,190,"VEL SIMULACION",15,"#fff")+field(175,168,115,27,"6000");
 s+=panel(350,10,250,80,"ESQUINAS VIVAS")+txt(365,58,"Tiempo / velocidad / longitudes",13,"#fff");
 s+=panel(610,10,380,100,"PARAM PLASMA")+txt(630,59,"Tiempo de Roller",15,"#fff")+field(810,39,100,25,"0.50 seg")+txt(630,91,"Tiempo de perforado",15,"#fff")+field(810,71,100,25,"3.50 seg")+txt(925,91,"Arco transferido: SI",12,"#fff",700,"middle");
 s+=panel(350,100,250,160,"MODIFICADORES")+txt(365,145,"ESPEJADO EN EJE X",13,"#fff")+field(500,125,70,24,"NO")+txt(365,178,"ESPEJADO EN EJE Y",13,"#fff")+field(500,158,70,24,"NO")+txt(365,211,"ANGULO FIGURA",13,"#fff")+field(500,191,70,24,"0.000");
 s+=panel(610,120,380,130,"PARAM OXICORTE")+txt(630,171,"Calentamiento · Perforado · Venteo",13,"#fff")+txt(630,205,"Ignición · Gas",13,"#fff");
 s+=panel(10,230,330,130,"CURVAS CHICAS")+txt(28,280,"RADIO · VELOCIDAD DE CORTE",14,"#fff")+txt(28,315,"VELOCIDAD LÍMITE · RETARDO",14,"#fff");
 s+=panel(350,270,250,150,"REPETICIÓN DE FIGURAS")+txt(370,326,"FILAS · COLUMNAS",15,"#fff")+txt(370,360,"DESPLAZAMIENTO X / Y",14,"#fff");
 s+=panel(10,370,330,120,"INTERPRETACIÓN CÓDIGOS G")+txt(28,425,"Centro IC · G41/G42",14,"#fff")+txt(28,458,"Saltear bloques",14,"#fff");
 s+=panel(350,430,250,100,"OTRAS FUNCIONES")+txt(370,487,"Parámetros del equipo",14,"#fff");
 const areas={displacement:[10,10,330,210],plasma:[610,10,380,100],curves:[10,230,330,130],repetition:[350,270,250,150],advanced:[350,100,250,160]};
 if(areas[focus]){const a=areas[focus];s+=focusRect(...a)}
 if(focus==="advanced"){s+=focusRect(10,370,330,120)+focusRect(350,270,250,150)}
 return s+'</svg>';
}
const visual=(kind,focus,caption)=>({src:svgUrl(kind==="params"?paramsSvg(focus):mainSvg(focus)),alt:"Vista esquemática de la pantalla CNC MASTER XP basada en el manual",caption});
export function getPlasmaVisual(missionId,stepIndex){
 const main=(focus,caption)=>visual("main",focus,caption);
 const params=(focus,caption)=>visual("params",focus,caption);
 const map={
  pantalla:[
   main("graph","Pantalla principal · área gráfica donde aparece la pieza o el nesting · manual, pág. 1."),
   main("positions","Panel superior derecho · coordenadas de Pieza y Máquina · manual, pág. 2."),
   main("positions","Z:DEFINIR CERO y HOME son controles distintos · manual, pág. 2.")
  ],
  archivos:[
   main("files","Panel de carga · Archivo Nº, BLQ ACT, BLQ INICIAL y BLQ FIN · manual, pág. 3."),
   main("files","BLQ ACT muestra el bloque que está ejecutando el CNC · manual, pág. 3."),
   main("files","Los campos BLQ INICIAL y BLQ FIN delimitan el tramo del programa · manual, pág. 3.")
  ],
  simular:[
   main("controls","Panel de ejecución · F9 SIMULAR, F7 CARGAR y F8 CORTAR · manual, págs. 4–5."),
   main("controls","F7 vuelve a cargar la figura o el nesting · manual, pág. 4.")
  ],
  plasma:[
   main("selector","Selector de proceso · PLS activa o desactiva el plasma · manual, pág. 7."),
   params("plasma","Pantalla Parámetros · cuadro PARAM PLASMA resaltado · manual, pág. 10. Los valores visibles son ejemplos, no una receta."),
   params("plasma","El manual distingue sensor electrónico y control mecánico-neumático en la pág. 13. Esta vista muestra el panel de parámetros, no indica valores para copiar.")
  ],
  operar:[
   main("controls","Panel de ejecución · F8 CORTAR, F11 PAUS/CONT y F10 ABORT · manual, pág. 4."),
   main("controls","F11 PAUS/CONT aparece junto a los controles de ejecución · manual, pág. 4."),
   main("controls","F10 ABORT, R:RETROCEDE y F12:BQ A BQ · manual, págs. 4–5.")
  ],
  ajustes:[
   params("displacement","Panel DESPLAZAMIENTO · velocidad, aceleración y sangría · manual, pág. 10. Valores ilustrativos."),
   params("displacement","La sangría forma parte del panel DESPLAZAMIENTO · manual, pág. 10."),
   params("advanced","Vista general de ajustes avanzados del control: curvas, modificadores, repetición e interpretación de códigos G · manual, págs. 10–12.")
  ]
 };
 return map[missionId]?.[stepIndex]||main("graph","Vista general de la pantalla principal del CNC MASTER XP.");
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
function openQuiz(){
 quizIndex=0;quizAnswers={};$('learningAreaPage').hidden=true;$('learningLessonPage').hidden=true;$('learningQuizPage').hidden=false;renderQuizQuestion();
}
function renderQuizQuestion(){
 const q=plasmaQuiz[quizIndex],chosen=quizAnswers[quizIndex];
 $('quizStepCount').textContent='PREGUNTA '+(quizIndex+1)+' DE '+plasmaQuiz.length;
 $('learningQuizContent').innerHTML=`
  <article class="learning-simple-step learning-quiz-simple">
   <div class="learning-simple-step-label">PREGUNTA ${quizIndex+1}</div><h2>${q.q}</h2>
   <div class="learning-quiz-options">${q.opts.map((o,i)=>`<label class="learning-quiz-option ${chosen===i?'selected':''}"><input type="radio" name="plasmaAnswer" value="${i}" ${chosen===i?'checked':''}><span>${o}</span></label>`).join('')}</div>
   <div id="learningQuizExplanation"></div>
  </article>`;
 $('learningQuizContent').querySelectorAll('input[name="plasmaAnswer"]').forEach(el=>el.onchange=()=>{quizAnswers[quizIndex]=Number(el.value);renderQuizQuestion()});
 const correct=chosen===q.a;
 $('learningQuizActions').innerHTML=chosen===undefined
 ?'<span class="learning-quiz-hint">Elegí una respuesta para continuar.</span>'
 :`<div class="learning-quiz-explain ${correct?'is-correct':'is-review'}"><b>${correct?'¡Muy bien!':'Vamos a repasarlo'}</b><p>${q.why}</p></div><button type="button" class="learning-topic-action learning-next-step" id="learningQuizNext">${quizIndex===plasmaQuiz.length-1?'Ver resultado':'Siguiente pregunta →'}</button>`;
 $('learningQuizNext')?.addEventListener('click',()=>{
  if(quizIndex<plasmaQuiz.length-1){quizIndex++;renderQuizQuestion()}
  else{
   const score=plasmaQuiz.reduce((n,item,i)=>n+(quizAnswers[i]===item.a?1:0),0);
   $('learningQuizContent').innerHTML=`<div class="learning-quiz-final"><div class="learning-start-icon">🎉</div><h2>Terminaste el repaso</h2><strong>${score} de ${plasmaQuiz.length}</strong><p>${score===plasmaQuiz.length?'¡Excelente! Reconocés los conceptos principales.':'Buen comienzo. Podés volver a los temas y repasar lo que necesites.'}</p></div>`;
   $('learningQuizActions').innerHTML='<button type="button" class="learning-topic-action learning-next-step" id="learningQuizReturn">Volver al recorrido</button>';
   $('learningQuizReturn').onclick=showTopics;
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
