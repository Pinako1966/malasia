# Itinerario Malasia & Singapur — PWA operativa (Iria & Iñaqui)

## Problema
Pareja viajando 32 días naturales por Malasia + Singapur. Necesitan herramienta diaria fiable: timeline, mapa, PDFs, checklist, gastos, búsqueda, offline, claro/oscuro.

## DATOS VERIFICADOS (extraídos de PDFs reales)
- **PNR Etihad**: 8BFUJH (Iria + Iñaqui)
- **Salida Madrid**: 24 sept 2026, 10:45 — EY102 MAD→AUH (T4 → TA)
- **Conexión**: EY488 AUH→KUL, 24 sept 21:00 → 25 sept 08:25 (T1)
- **Día 1 en Asia**: 25 sept 2026 (llegada KUL)
- **Último día Asia**: 25 oct 2026 — EY499 SIN→AUH 19:25
- **Regreso Madrid**: 26 oct 2026, 07:35 — EY101 AUH→MAD
- **Total**: 32 días naturales / 31 noches en Asia

## Activos disponibles en /app/malasia/
- 7 imágenes header (KL, Cameron, Penang, Langkawi, Islas, Melaka, Singapur)
- 26 PDFs operativos en /assets/pdfs/
- 2 iconos PWA
- /data/flights_verified.json (vuelos Etihad ya extraídos)

## PDFs pendientes de extraer (datos a verificar)
- malaysia_mh1336 (KUL→TGG) - vuelo doméstico inicial probablemente día ~12
- malaysia_mh1397 (KBR→KUL) - retorno desde Kota Bharu
- malaysia_mh1433 (LGK→KUL) - retorno desde Langkawi
- airasia_siez5x (PEN→LGK) - Penang a Langkawi
- 10 confirmaciones de hotel (fechas de check-in/out por hotel)
- 2 ferries (Merang→Redang, Redang→Perhentian)
- 1 transfer TGG→Merang Jetty
- 2 daytrips (KLIA→Melaka, Tanah Rata→George Town)

## Itinerario aproximado (a confirmar con PDFs hotel)
KL (santa_grand) → Cameron Highlands (avillion) → Penang (muntri_mews + 22_macalister) → Langkawi (pelangi_beach) → Kota Bharu → Merang (villa_wanie) → Redang (laguna) → Perhentian (alunan) → KL → Melaka (liu_men) → KL → Singapur (jen_orchardgateway)

## Próxima sesión - Plan ejecutable
**Turno 1**: Extraer en paralelo los 10 PDFs de hotel + 4 vuelos domésticos + ferries → generar `data/itinerary.json` completo con 31 días verificados (fechas, hotel, transporte, PDFs vinculados, coordenadas GPS de cada punto).

**Turno 2**: Crear `index.html` + `assets/css/styles.css` editorial (cremas/dorados/verde selva, Fraunces+Inter) + `assets/js/app.js` con timeline, conversor MYR/SGD/EUR, checklist equipaje, gastos (localStorage).

**Turno 3**: Mapa Leaflet con todos los puntos GPS + búsqueda global indexada + modo claro/oscuro + service-worker.js offline-first cacheando HTML/CSS/JS/PDFs/headers + tiles OSM del área del viaje.

**Turno 4**: Auditoría con testing_agent_v3, validación PWA (manifest, lighthouse), contenido editorial ampliado por destino (qué hacer, dónde comer, transporte local, horarios óptimos, frases útiles en malayo).

**Mejora propuesta (a confirmar)**: Modo "copiloto del día" que detecte fecha actual y muestre primero "Hoy: Día X — Penang" con próximo movimiento destacado.

## Status actual
Preparación + datos vuelos internacionales verificados. Pendiente todo lo demás.

## Credenciales/Keys necesarias
- Ninguna (Leaflet usa OSM sin API key, todo es estático)
