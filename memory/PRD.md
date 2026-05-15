# Itinerario Malasia & Singapur — PWA operativa (Iria & Iñaqui)

## Problema
Pareja viajando 32 días por Malasia + Singapur (25 sept → 26 oct 2026). Necesitan herramienta diaria fiable: timeline, mapa, PDFs, checklist, gastos, búsqueda, offline, claro/oscuro.

## Activos copiados a /app/malasia/
- 7 imágenes header (KL, Cameron, Penang, Langkawi, Islas, Melaka, Singapur)
- 26 PDFs (vuelos, hoteles, ferries, transfers, daytrips)
- 2 iconos PWA

## Estructura destino
- /app/malasia/index.html (PWA monolítica limpia, sin base64)
- /app/malasia/manifest.webmanifest
- /app/malasia/service-worker.js (cachea todo offline)
- /app/malasia/data/itinerary.json (32 días con coords GPS, PDFs, horarios)
- /app/malasia/assets/css/styles.css (editorial: cremas/dorados/verde selva, Fraunces+Inter)
- /app/malasia/assets/js/app.js (timeline, mapa Leaflet, búsqueda, conversor, gastos, dark/light)

## Itinerario detectado (32 días)
KL → Cameron Highlands → Penang → Langkawi → Kota Bharu → Merang → Redang → Perhentian → KL → Melaka → KL → Singapur

## Pendiente (próximos turnos)
- P0: Generar itinerary.json con los 32 días (fechas, ciudad, hotel, transportes, PDFs asociados, coords GPS)
- P0: index.html + CSS + app.js con timeline navegable
- P0: Mapa Leaflet con todos los puntos
- P0: Service worker offline-first
- P1: Checklist equipaje + conversor + gastos (localStorage)
- P1: Búsqueda global indexada
- P1: Modo claro/oscuro
- P2: Contenido editorial ampliado por destino
- P2: Testing PWA + Lighthouse

## Próxima acción
Pedir al usuario continuar en nuevo mensaje. Generar primero data/itinerary.json completo, luego index.html, css, js, sw. Testing al final con testing_agent_v3.
