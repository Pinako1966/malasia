# PRD — Malasia & Singapur · PWA viaje de Iria e Iñaqui

## Problema original
Crear un itinerario personalizado y una herramienta digital perfecta para un viaje de un mes (24 sept – 26 oct 2026) por Malasia y Singapur, actuando como auditor experto. La app debe ser una PWA 100 % offline, evitar pérdidas de tiempo durante el viaje y reunir: timeline, mapa interactivo offline, acceso rápido a PDFs, checklist, gestor de gastos, búsqueda global y contenido editorial propio.

## Stack
- Vanilla JS + HTML5 + CSS3 (sin backend).
- Service Worker para offline.
- Leaflet.js para mapa (tiles cacheados).
- localStorage para notas, gastos, pendientes, datos personales, checklist y presupuesto editado.

## Arquitectura de archivos
```
/app/malasia/
├── index.html                  # Shell + tabs + modal SOS + FAB
├── manifest.webmanifest
├── service-worker.js           # Cache offline
├── data/
│   └── itinerary.json          # Viaje, etapas, pendientes, presupuesto, 33 días, eventos
└── assets/
    ├── css/styles.css
    ├── js/app.js               # Toda la lógica
    ├── headers/                # 7 imágenes de cabecera por destino
    ├── icons/
    └── pdfs/                   # 26 PDFs de reservas
```

## Fase 1 — Completada
- 33 días con eventos, alertas, consejos, hoteles, climas, mapa con ruta dorada.
- 26 PDFs vinculados, 7 hoteles geolocalizados.
- Service worker offline-first.
- ZIP v1 generado.

## Fase 2.1 — Completada (15/05/2026)
**Modo viaje en curso** (centro de la app):
- Hero "Hoy" enriquecido: día, etapa, siguiente movimiento, hotel, botones [abrir jornada · PDF clave · ir al hotel].
- Cuenta atrás antes del viaje con accesos a día 1 y pendientes.
- Documento clave por día: botón directo a PDF en cabecera de cada jornada + botón compacto en la tarjeta de la lista.
- Estados visuales en eventos: `Confirmado` · `Pendiente de contratar` · `Recomendado` · `Opcional` · `Plan B lluvia` (colores y badges).
- Etapas con frases de intención: 9 bloques (Vuelo ida · Islas · KL · Cameron · Penang · Langkawi · Melaka · Singapur · Vuelta) cada uno con "Intención / Evitar / Prioridad real".
- **Pestaña Pendientes** separada: 8 críticos + 11 menores con checkboxes persistentes, contadores y restablecer.
- **Gastos rediseñados**: fecha, día auto-detectado, concepto, categoría (7 nuevas), importe, moneda, pagado por (Iria/Iñaqui/Común). Tres totales separados (Previsto / Registrados / Total real). Barra de progreso. Desglose por categoría y por pagador. Exportar CSV / Exportar JSON / Importar JSON / Borrar todo.
- Presupuesto previsto editable en pantalla (modal): total + 7 categorías.

## Fase 2.2 — Completada en el mismo paso
- Modal SOS (FAB rojo flotante): emergencias 999/995, embajadas con tel+mail+mapa, frases urgentes con TTS, formulario de datos personales (seguro, contactos, salud).
- Reloj dual 🇲🇾/🇪🇸 en cabecera con "Día X/32".
- Pestaña Resumen: 7 stats, mini-timeline visual coloreada por etapa, leyenda, exportar diario .txt.
- Filtros de mapa (todos/hotel/aeropuerto/puerto/isla/ciudad) + botón "Ubicarme".
- TTS en frases urgentes y frases generales (inglés).
- Botón "Copiar PNR" en cada evento con código.
- Tarjeta clima por día, aviso automático de madrugón al día siguiente.
- Alertas info/warning por día.

## Tests realizados
- Smoke test: 8 screenshots (itinerario, pendientes, gastos, resumen, día 14 detalle, eventos con estados, gastos añadidos, modal SOS). Todo OK.
- Lint JS: 0 issues.
- Carga JSON: 33 días · 9 etapas · 8 críticos · 11 menores · presupuesto 7000 €.

## Tareas futuras (P1+)
- Exportación PDF del diario (ahora exporta .txt).
- Tarjetas hotel-card en la pestaña Mapa al filtrar.
- Foto-upload por día (con localStorage de URLs base64).
- Modo "viaje terminado" con resumen automático tras 26 oct.

## Credenciales / claves
N/A — App 100 % offline sin backend.

## Empaquetado
- `/app/malasia_singapur_pwa.zip` (v1)
- `/app/malasia_singapur_pwa_v2.zip` (v2.1 final, 5.5 MB, 49 archivos)
