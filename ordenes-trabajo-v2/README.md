# AgroDiseño · Órdenes de Trabajo V2

Sistema interno para gestionar ingreso de maquinaria, trabajos a realizar, checklist de recepción, piezas/repuestos, fotos, historial e impresión A4 para taller.

## Contenido

- `server.py`: servidor web local con base SQLite.
- `static/index.html`: interfaz web.
- `data/agrodiseno.db`: base inicial con una OT de ejemplo.
- `INICIAR_AGRODISENO.bat`: inicio rápido en Windows.
- `LEEME.txt`: instrucciones de uso.

## Inicio local

1. Tener Python 3 instalado.
2. Ejecutar `INICIAR_AGRODISENO.bat`.
3. Abrir `http://localhost:8765`.

## Uso en red local

Desde otras PCs de la misma red se puede ingresar con `http://IP-DE-LA-PC-SERVIDOR:8765` mientras el servidor esté ejecutándose.

## Próxima etapa

Migrar la persistencia a un backend online (por ejemplo Supabase) para evitar depender de una PC local y permitir acceso desde cualquier equipo.
