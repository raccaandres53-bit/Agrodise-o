// Vistas esquemáticas basadas en las capturas del manual CNC MASTER XP.
const rect=(x,y,w,h,fill="#d4d4d4",stroke="#555",rx=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const txt=(x,y,t,size=17,color="#111",weight=600,anchor="start")=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${t}</text>`;
const btn=(x,y,w,h,t,fill="#d9e0e8",color="#111",size=15)=>rect(x,y,w,h,fill,"#444",4)+txt(x+w/2,y+h/2+size*.34,t,size,color,800,"middle");
const field=(x,y,w,h,t)=>rect(x,y,w,h,"#071d9a","#222",2)+txt(x+w/2,y+h/2+6,t,17,"#fff",700,"middle");
const focusRect=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#ef4444" fill-opacity=".08" stroke="#ef5964" stroke-width="7" stroke-dasharray="15 8"/>`;
const svgUrl=s=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
function mainSvg(focus){
 let s='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700" role="img">';
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
 let s='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="560" viewBox="0 0 1000 560" role="img">';
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
const visual=(kind,focus,caption)=>({src:svgUrl(kind==="params"?paramsSvg(focus):mainSvg(focus)),alt:"Vista esquemática de la pantalla CNC MASTER XP basada en el manual",caption:"Esquema de referencia basado en el manual CNC MASTER XP · "+caption});
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
