# AgroViajes

Primera versión móvil con Expo, React Native y TypeScript. Permite crear viajes, asignar empleados por nombre, registrar tareas y elementos, marcar su preparación, consultar ubicación GPS y abrir destinos en Google Maps.

## Desarrollo

Requiere Node.js 22.13+ o 24 LTS y npm.

```sh
npm ci
npm start
```

Abrir con una versión compatible de Expo Go (SDK 58) en Android/iOS, en una red que permita alcanzar el servidor de desarrollo. Alternativamente `npm run web` para desarrollo en navegador. No se ha validado una compilación nativa ni ejecución en dispositivo físico. La compilación iOS local requiere macOS/Xcode; Android requiere Android SDK/emulador. No se necesitan para la exportación web.

```sh
npm run typecheck
npm test
npm run build:web
```

## Datos y límites de esta versión

Los viajes se guardan automáticamente en AsyncStorage del dispositivo. Tras abrir/instalar la aplicación móvil, consultar y editar datos no requiere conexión. Borrar los datos de la app o desinstalarla puede eliminar los viajes; exportar copias periódicamente. La versión web no incluye un service worker y no garantiza arranque offline.

Exportar genera un JSON compartible; importar agrega viajes cuyo identificador no existe y conserva los existentes. Esto es traslado manual, no sincronización ni resolución de conflictos. Las copias incluyen nombres y destinos sin cifrado. No hay cuentas, servidor, permisos por empleado ni sincronización automática entre teléfonos.

GPS requiere autorización y servicios de ubicación del dispositivo; su precisión y disponibilidad dependen del equipo. Google Maps se abre por enlace externo, sin clave API ni mapa incrustado. Carga de mapas/rutas puede necesitar conexión; esta app no descarga mapas offline ni rastrea en segundo plano.

Próxima etapa: backend autenticado, asignaciones por usuario, almacenamiento SQLite con cola de cambios y resolución de conflictos, mapas integrados y pruebas en Android/iOS. Una API de mapas integrada requerirá configurar las credenciales y restricciones correspondientes.
