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
