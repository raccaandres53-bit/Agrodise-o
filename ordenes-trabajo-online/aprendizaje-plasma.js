export const plasmaLessons=[
{id:'pantalla',title:'Conocer la pantalla principal',desc:'Identificar los cuadros de posición, el área gráfica y los controles principales.',pages:'Páginas 1, 2 y 9',sections:[
{heading:'Qué muestra la pantalla',body:'El CNC MASTER XP reúne las funciones para cargar rutinas, visualizar recorridos, simular y seleccionar el tipo de corte. El cuadro gráfico muestra la pieza o el nesting cargado; su escala puede ajustarse y permite desplazarse por los ejes X e Y.'},
{heading:'Posición de máquina y de pieza',body:'El panel muestra las coordenadas respecto del Cero Máquina y del Cero Pieza. Normalmente coinciden, salvo que el operador haya corrido la pieza a otra posición.'},
{heading:'Definir Cero',body:'El pulsador Z:DEFINIR CERO pone en cero las coordenadas de máquina y pieza. Se utiliza para establecer dónde se quiere comenzar a cortar, por ejemplo al trabajar con recortes de chapa.'},
{heading:'HOME',body:'El pulsador HOME devuelve el equipo al Cero Máquina mediante un desplazamiento continuo hasta las coordenadas de origen.'}
]},
{id:'archivos',title:'Cargar archivos y trabajar por bloques',desc:'Seleccionar un programa, reconocer el bloque actual y delimitar una parte del nesting.',pages:'Página 3',sections:[
{heading:'A: Archivo Nº',body:'Al ingresar el número de programa, la pieza o el nesting se visualiza en el cuadro gráfico. El campo Mensaje puede mostrar el nombre de la pieza si fue cargado.'},
{heading:'BLQ ACT',body:'Indica el bloque actual, es decir, la línea de comando que el CNC está ejecutando.'},
{heading:'BLQ INICIAL y BLQ FIN',body:'Permiten indicar desde qué bloque retomar y en qué bloque detener el programa. El manual recomienda, al retomar un trabajo, no redefinir el Cero y detener el equipo al terminar un corte, no en mitad de una pieza.'},
{heading:'Ejemplo del manual',body:'Para ejecutar solamente la parte de un nesting comprendida entre los bloques 27 y 42, se carga 27 en BLQ INICIAL y 42 en BLQ FIN.'}
]},
{id:'ejecucion',title:'Simulación y control de ejecución',desc:'Diferenciar simular, cortar, cargar, pausar y abortar una rutina.',pages:'Páginas 4 y 5',sections:[
{heading:'F8 · CORTAR',body:'Ejecuta la rutina cargada. Según el manual, si hay un pico de oxicorte o la torcha de plasma activada, el pantógrafo realiza el corte. Si no hay ningún pico activo, recorre el contorno sin cortar la chapa.'},
{heading:'F9 · SIMULAR',body:'Ejecuta la rutina solamente a nivel gráfico para visualizar el recorrido en el cuadro gráfico.'},
{heading:'F7 · CARGAR',body:'Vuelve a cargar la figura o el nesting; el manual indica que sirve para visualizar la pieza después de rotarla o espejarla.'},
{heading:'F10 y F11',body:'F10 permite abortar la secuencia. F11 pausa o continúa la rutina y tiene, según el manual, la misma función que el hongo negro del tablero.'},
{heading:'R · Retrocede y F12 · BQ A BQ',body:'R:Retrocede se utiliza en la situación de pérdida de corte descrita en el manual para volver por la trayectoria hasta el punto de interrupción. F12 recorre la pieza bloque a bloque y se presenta como herramienta para encontrar errores, no como función de corte.'}
]},
{id:'parametros',title:'Parámetros generales del CNC',desc:'Comprender velocidad, aceleración, sangría y los valores de desplazamiento.',pages:'Páginas 5, 6 y 10',sections:[
{heading:'Velocidad de corte',body:'Se ingresa según el espesor y la potencia de trabajo. El manual no establece una tabla universal de velocidades.'},
{heading:'Velocidad rápida',body:'Es la velocidad de desplazamiento del equipo y el manual indica que no debe superar los 15.000 mm/min.'},
{heading:'Aceleración',body:'Determina qué tan rápido alcanza la velocidad programada. El manual recomienda no exceder el valor 150.'},
{heading:'Sangría',body:'Compensa el material retirado por el ancho del corte. El manual explica que una pieza exterior tiende a quedar más chica y un agujero interior más grande; la compensación corrige esa diferencia.'},
{heading:'Velocidad de simulación',body:'Afecta únicamente la velocidad con la que se representa la simulación gráfica. Los valores que aparecen en las capturas del manual son ejemplos de configuración, no una receta para todos los trabajos.'}
]},
{id:'plasma',title:'Selección y parámetros del plasma',desc:'Reconocer el selector PLS y distinguir las configuraciones según el control de altura.',pages:'Páginas 7, 10 y 13',sections:[
{heading:'Selector PLS',body:'El pulsador PLS activa o desactiva el corte plasma. Al activarlo, se desmarcan los picos de oxicorte. El selector de plasma y los de oxicorte cambian entre sí según la descripción del manual.'},
{heading:'Perf. Plasma',body:'En la pantalla principal se muestra el tiempo de perforado restante del plasma. El manual indica que este tiempo se ajusta desde la pantalla Parámetros y que, en equipos con control automático de altura, no entra en juego de la misma manera.'},
{heading:'Equipo con sensor electrónico de altura',body:'Para el corte plasma con sensor de altura electrónico, el manual indica que basta con tener activo el cuadro Arco transferido, porque el control de altura configura los tiempos de perforado y espera del plasma.'},
{heading:'Equipo con control mecánico-neumático',body:'En equipos sin control electrónico de altura, el manual indica ajustar el tiempo de descenso del Roller y el tiempo que tarda el plasma en perforar la chapa.'},
{heading:'Importante sobre los valores',body:'El documento muestra valores de ejemplo en capturas de pantalla. No los tomes como parámetros recomendados para cualquier espesor, material o equipo: deben corresponder a la configuración validada de la máquina y del proceso.'}
]},
{id:'ajustes',title:'Ajustes avanzados y funciones especiales',desc:'Repasar corrimiento de cero, recuperación de trayectoria y opciones del control.',pages:'Páginas 8, 11 y 12',sections:[
{heading:'Corrimiento del Cero',body:'El manual describe que, al ejecutar sin un pico activo, pausar y mover el equipo manualmente antes de continuar, se puede desplazar el Cero para ubicar una pieza sobre un sobrante de chapa.'},
{heading:'Perforar fuera de la pieza al retomar',body:'Para una interrupción durante un corte, el manual describe retirar el equipo hacia un costado antes de continuar, para evitar una marca grande sobre la pieza al reiniciar la perforación. Aplicar únicamente con capacitación y procedimiento operativo autorizado.'},
{heading:'Curvas chicas',body:'El control permite definir un radio máximo para considerar una curva como chica, un porcentaje de velocidad de corte, una velocidad límite y el retardo durante la curva. El manual explica que estas funciones ayudan a mejorar la definición en radios pequeños.'},
{heading:'Modificadores y repetición',body:'Los modificadores permiten espejar en X o Y y rotar la figura. La repetición permite definir filas, columnas y desplazamientos X e Y para piezas repetitivas.'},
{heading:'Interpretación de códigos G',body:'Para la modalidad Lantek, el manual indica Centro IC Coord. Absolutas en SI e Invertir Interpretación G41/G42 en NO. Son indicaciones del documento para esa modalidad, no deben extrapolarse a otros postprocesadores.'}
]}
];

export const plasmaQuiz=[
{q:'¿Qué tecla ejecuta una simulación solamente gráfica?',opts:['F8','F9','F7'],a:1,why:'F9:SIMULAR ejecuta la rutina a nivel gráfico.'},
{q:'¿Qué hace Z:DEFINIR CERO?',opts:['Vuelve al origen de máquina','Pone en cero las coordenadas de máquina y pieza','Carga nuevamente el archivo'],a:1,why:'El manual lo describe como la función para definir dónde se quiere comenzar el corte.'},
{q:'Según el manual, ¿cuál es el límite indicado para la velocidad rápida?',opts:['6.000 mm/min','10.000 mm/min','15.000 mm/min'],a:2,why:'La velocidad rápida no debe superar 15.000 mm/min.'},
{q:'En un equipo con sensor electrónico de altura, ¿qué indica el manual para el plasma?',opts:['Activar Arco transferido','Ajustar el tiempo de descenso del Roller','Desactivar PLS'],a:0,why:'El control de altura electrónico configura los tiempos de perforado y espera.'},
{q:'En un equipo con control mecánico-neumático, ¿qué tiempos se deben ajustar?',opts:['Solo velocidad de simulación','Descenso del Roller y perforación del plasma','Solo velocidad rápida'],a:1,why:'Así lo especifica el apartado de plasma de la página 13.'},
{q:'¿Qué sucede si se ejecuta una rutina sin ningún pico activo?',opts:['El pantógrafo recorre el contorno sin cortar','Se activa automáticamente el plasma','Se borra el programa'],a:0,why:'El manual describe ese comportamiento para el pulsador F8:CORTAR.'}
];


// Recorrido guiado para personas que empiezan desde cero.
// Los conceptos y funciones se mantienen fieles al manual CNC MASTER XP.
export const plasmaPath=[
{id:'pantalla',title:'Conocé la pantalla',subtitle:'Primero vamos a reconocer qué estás viendo.',icon:'👀',steps:[
{title:'Esta es la pantalla de trabajo',body:'Acá vas a ver el dibujo de la pieza que se va a cortar y los datos que usa el pantógrafo para moverse. No hace falta entender todo de una vez: primero reconocé el área donde aparece el dibujo.',key:'Área gráfica',tip:'Antes de tocar algo, mirá qué pieza o trabajo aparece dibujado.'},
{title:'Hay dos posiciones importantes',body:'Cero Máquina es el punto de origen del pantógrafo. Cero Pieza es el punto que se toma como inicio para ubicar el trabajo. El manual indica que normalmente coinciden, salvo que se haya movido el cero de la pieza.',key:'Cero Máquina / Cero Pieza',tip:'Si no sabés dónde está ubicado el cero, no inicies un corte: pedile al responsable que lo verifique.'},
{title:'¿Para qué sirven HOME y DEFINIR CERO?',body:'HOME lleva el equipo al origen de máquina. DEFINIR CERO pone en cero las coordenadas de máquina y pieza para establecer dónde se quiere comenzar el corte.',key:'HOME · DEFINIR CERO',tip:'Son funciones distintas. No las uses por prueba: primero aprendé con el operador responsable cuándo corresponde cada una.'}
]},
{id:'archivos',title:'Abrí el trabajo',subtitle:'Ahora vamos a reconocer cómo se carga la pieza que se va a cortar.',icon:'📂',steps:[
{title:'Elegí el archivo del trabajo',body:'En Archivo Nº se ingresa el número del programa. Al cargarlo, el dibujo de la pieza o del conjunto de piezas aparece en el área gráfica.',key:'Archivo Nº',tip:'Antes de seguir, compará el dibujo de la pantalla con el trabajo que te entregaron.'},
{title:'¿Qué son los bloques?',body:'El programa está formado por instrucciones. El CNC las muestra como bloques. BLQ ACT indica cuál está ejecutando en ese momento.',key:'BLQ ACT',tip:'No necesitás editar bloques para empezar. Por ahora, solo reconocé dónde se muestra el bloque actual.'},
{title:'¿Desde dónde hasta dónde trabaja?',body:'BLQ INICIAL y BLQ FIN permiten indicar desde qué bloque comenzar y en cuál detenerse. El manual muestra como ejemplo ejecutar desde el bloque 27 hasta el 42.',key:'BLQ INICIAL · BLQ FIN',tip:'No cambies estos números sin indicación del responsable. Un límite incorrecto puede dejar el trabajo incompleto.'}
]},
{id:'simular',title:'Probá el recorrido sin cortar',subtitle:'Este es el paso para mirar el trabajo antes de hacer un corte.',icon:'▶️',steps:[
{title:'Primero, mirá el recorrido',body:'F9 · SIMULAR reproduce el recorrido en la pantalla, a nivel gráfico. Sirve para observar por dónde va a pasar el pantógrafo sin cortar la chapa.',key:'F9 · SIMULAR',tip:'Usá la simulación para revisar que el recorrido corresponda al dibujo y al trabajo preparado.'},
{title:'F7 vuelve a cargar el dibujo',body:'F7 · CARGAR vuelve a cargar la figura o el nesting. El manual indica que también sirve para visualizar la pieza después de rotarla o espejarla.',key:'F7 · CARGAR',tip:'Si el dibujo cambió por una rotación o un espejo, volvé a cargarlo y revisalo antes de continuar.'}
]},
{id:'plasma',title:'Prepará el plasma',subtitle:'Vamos a reconocer qué cambia cuando se trabaja con plasma.',icon:'🔥',steps:[
{title:'Seleccioná el modo plasma',body:'El botón PLS activa o desactiva el corte plasma. Al activarlo, se desmarcan los picos de oxicorte, según explica el manual.',key:'PLS',tip:'Antes de seleccionar el proceso, confirmá con el responsable qué trabajo y qué equipo están preparados.'},
{title:'¿Qué significa Perf. Plasma?',body:'Es el tiempo que el plasma necesita para perforar la chapa antes de continuar el recorrido. El manual indica que se ajusta desde la pantalla Parámetros.',key:'Perf. Plasma',tip:'El tiempo correcto depende de la configuración del equipo y del trabajo. No copies valores de una captura del manual.'},
{title:'La altura puede controlarse de dos maneras',body:'El manual diferencia equipos con sensor electrónico de altura y equipos con control mecánico-neumático. En el primero indica tener activo Arco transferido; en el segundo, ajustar el descenso del Roller y el tiempo de perforación.',key:'Control electrónico / mecánico-neumático',tip:'Primero averiguá qué sistema tiene instalado nuestro pantógrafo. No cambies estos ajustes sin autorización.'}
]},
{id:'operar',title:'Empezá y detené el trabajo',subtitle:'Conocé los controles. La operación real requiere autorización.',icon:'🛠️',steps:[
{title:'F8 inicia el corte',body:'F8 · CORTAR ejecuta la rutina cargada. El manual indica que, si la torcha de plasma está activada, el pantógrafo realiza el corte. Si no hay un pico activo, recorre el contorno sin cortar la chapa.',key:'F8 · CORTAR',tip:'No presiones F8 para practicar. Solo debe hacerlo una persona capacitada, después de revisar el programa, el cero y la preparación de la máquina.'},
{title:'F11 pausa o continúa',body:'F11 permite pausar o continuar la rutina. El manual indica que tiene la misma función que el hongo negro del tablero.',key:'F11',tip:'Identificá este control antes de operar. En una situación real, seguí el procedimiento de seguridad del taller.'},
{title:'F10 aborta la secuencia',body:'F10 permite abortar la secuencia. El manual también describe R:Retrocede y F12:BQ A BQ para situaciones específicas de recuperación o revisión del recorrido.',key:'F10 · R · F12',tip:'No intentes recuperar un corte por tu cuenta. Avisá al responsable y seguí el procedimiento establecido.'}
]},
{id:'ajustes',title:'Ajustes para más adelante',subtitle:'Estos valores existen, pero no son el primer paso para un operador nuevo.',icon:'🎚️',steps:[
{title:'Velocidad y aceleración',body:'La velocidad de corte se ingresa según el espesor y la potencia de trabajo. La velocidad rápida es el desplazamiento del equipo. La aceleración determina qué tan rápido alcanza la velocidad programada.',key:'Velocidad · Aceleración',tip:'El manual muestra límites y ejemplos, pero no una receta para todos los materiales y espesores. No cambies estos valores sin una configuración validada.'},
{title:'¿Qué es la sangría?',body:'Es la compensación por el material que se pierde con el ancho del corte. El manual explica que ayuda a corregir la medida final de las piezas y de los agujeros.',key:'Sangría',tip:'La compensación correcta depende del proceso. Si una pieza sale fuera de medida, informalo antes de modificar el parámetro.'},
{title:'Otras funciones',body:'El control también permite trabajar con curvas pequeñas, rotar o espejar figuras, repetir piezas y configurar la interpretación de códigos G.',key:'Curvas · Repetición · Códigos G',tip:'Son ajustes avanzados. Aprendelos con el responsable de programación, no modificando un trabajo de producción.'}
]}
];
