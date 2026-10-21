# AgroViajes

App móvil con Expo, React Native y TypeScript para organizar viajes de trabajo y su preparación, con datos locales disponibles sin conexión.

## Funciones

- Crear, editar y eliminar viajes con destino, fecha, empleados e indicaciones.
- Estados manuales: planificado, en curso, finalizado y cancelado.
- Buscar por nombre, destino, empleado o notas y filtrar por estado.
- Directorio de empleados con puesto y teléfono; selección al organizar viajes. Los empleados también pueden ingresarse por nombre sin crear un contacto.
- Renombrar contactos actualiza sus asignaciones; eliminar un contacto conserva su nombre en viajes anteriores. El directorio no representa cuentas de acceso y no permite nombres duplicados.
- Listas de tareas y elementos, progreso y confirmación antes de eliminar.
- Duplicar un viaje conservando indicaciones y equipo, reiniciando las listas y su estado. La fecha se puede modificar antes de guardar.
- Ubicación GPS y enlace externo al destino en Google Maps.
- Exportar e importar copias JSON con viajes, empleados y cambios locales.

## Desarrollo

Requiere Node.js 22.13+ o 24 LTS y npm.

```sh
npm ci
npm start
```

Abrir con Expo Go compatible con SDK 58 en Android/iOS, en una red que permita alcanzar el servidor de desarrollo. Alternativamente `npm run web` para navegador. No se han validado un APK, una compilación iOS ni un dispositivo físico. Compilar iOS localmente requiere macOS/Xcode; Android nativo requiere su SDK/emulador.

```sh
npm run typecheck
npm test
npm run build:web
```

En este entorno cloud, para evitar consultas opcionales al servicio de Expo y usar una caché escribible:

```sh
XDG_CACHE_HOME=/tmp/agroviajes-cache EXPO_OFFLINE=1 npm run web -- --port 8083
```

`EXPO_OFFLINE` afecta a las herramientas de Expo, no simula la falta de red en el teléfono. No altera la verificación TLS ni los paquetes de npm.

## Almacenamiento y compatibilidad

AsyncStorage conserva los datos en el dispositivo bajo la clave original `agroviajes.v1`. El esquema de datos es versión 2; la lectura de datos/copias de versión 1 los migra en memoria sin perder listas ni asignaciones. Se guardan como versión 2 con la siguiente modificación. Las copias versión 2 no son compatibles con la app anterior.

Los cambios se serializan al guardar; el indicador muestra si la escritura terminó o falló y permite reintentar. Borrar datos de la app o desinstalarla puede eliminar los viajes. Exportar copias periódicamente.

La aplicación móvil permite consultar y editar datos locales sin conexión después de instalarla. La web no incluye service worker y no garantiza arranque offline. El navegador mantiene sus propios datos; no comparte almacenamiento con la instalación móvil.

## Copias y futura sincronización

Importar agrega registros nuevos sin reemplazar los existentes. No fusiona cambios ni ejecuta eliminaciones remotas sobre datos locales. Se conservan las marcas de eliminación para evitar reintroducir registros eliminados al importar copias antiguas. Los nombres del directorio migrado usan identificadores estables para evitar duplicados al reimportar la misma copia.

`pendingChanges` conserva el último cambio por entidad (`trip` o `employee`), su identificador, operación y fecha. Eliminar conserva una marca sin el contenido eliminado. Las copias incluyen esta cola. **No hay servidor, envío de datos, cuentas ni sincronización automática.** La cola prepara el almacenamiento para una integración posterior; aún no define un protocolo de conflictos entre dispositivos.

Las copias contienen nombres, teléfonos, indicaciones y destinos sin cifrar. Compartir solo con personas autorizadas.

## Mapas y ubicación

GPS requiere permiso y servicios de ubicación; su precisión depende del dispositivo. Google Maps se abre por enlace externo, sin clave API ni mapa incrustado. Cargar mapas o calcular rutas puede requerir conexión. No hay descarga de mapas offline, seguimiento de empleados ni ubicación en segundo plano.

## Validación

Nueve pruebas automatizadas cubren migración, validación de copias, fechas, cola de cambios, renombrado, importación y protección de eliminaciones. TypeScript y compilación web verificados. Se verificó también el paquete JavaScript/Hermes para Android con `EXPO_OFFLINE=1 npx expo export --platform android --output-dir /tmp/agro-v2-android`; no genera un APK.

Se probó en Chromium con ancho móvil: migración de datos anteriores, directorio y nombres duplicados, edición de viajes, asignación, estados y búsqueda, duplicación con listas reiniciadas, persistencia tras recarga, eliminación con confirmación sin red, exportación e importación sin sobrescribir cambios locales. GPS real y compartir archivos nativo siguen pendientes de validación en celular.

Próxima etapa: backend autenticado, usuarios y permisos, sincronización real con resolución de conflictos y pruebas en Android/iOS.
