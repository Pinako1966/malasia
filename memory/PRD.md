# Itinerario Malasia & Singapur — PWA operativa (Iria & Iñaqui)

## Estado: COMPLETADO Y TESTEADO ✅

## Problema
Pareja viaja 32 días naturales por Malasia + Singapur (24 sept → 26 oct 2026). Necesitan herramienta diaria fiable y offline.

## Resultado entregado
PWA monolítica en `/app/malasia/` (6.8 MB, 41 archivos) — también empaquetada en `/app/malasia_singapur_pwa.zip` (5.5 MB).

## Estructura final
```
/app/malasia/
├── index.html              # PWA shell (limpio, sin base64 incrustado)
├── manifest.webmanifest    # PWA manifest
├── service-worker.js       # Cache offline-first (app + PDFs + tiles OSM)
├── data/
│   ├── itinerary.json      # 33 días (0..32), 21 lugares con coords GPS, 26 PDFs vinculados
│   └── flights_verified.json
├── assets/
│   ├── css/styles.css      # Light + Dark themes, Fraunces + Inter
│   ├── js/app.js           # Vanilla JS, 504 líneas, modular
│   ├── headers/            # 7 imágenes (KL, Cameron, Penang, Langkawi, Islas, Melaka, Singapur)
│   ├── icons/              # 2 PNG (192, 512)
│   └── pdfs/               # 26 PDFs operativos (vuelos, hoteles, ferries, transfers, daytrips)
```

## Funcionalidades implementadas
1. **Timeline navegable día a día** — 33 cards (días 0..32) clicables con detalle expandido
2. **Mapa Leaflet** — 21 marcadores (✈️🏨⛴️🏝️) + polyline dorada conectando alojamientos
3. **Acceso rápido a PDFs** — botón 'Ver documento (PDF)' en cada evento que tiene doc asociado
4. **Checklist** — 38 items en 4 categorías (Antes de salir, Equipaje, Botiquín, Dinero/Tech), persistente en localStorage
5. **Conversor MYR/SGD/EUR** — tasas estáticas verificables
6. **Gastos del viaje** — registro con conversión automática, eliminables, persistente
7. **Búsqueda global** — índice precalculado, highlight de matches, click para abrir día
8. **Modo claro/oscuro** — paleta dual, persistencia, detección preferencia sistema
9. **Modo copiloto del día** — auto-detecta fecha actual; muestra "Hoy: Día X" o cuenta atrás
10. **Frases útiles** — 26 frases en 6 grupos (Saludos, Hotel, Taxi, Restaurante, Urgencias, Números) en español/malayo/inglés
11. **Service worker offline** — cachea app shell + PDFs on-demand + tiles OSM
12. **Responsive** — funciona en 375px (móvil) sin overflow

## Datos verificados desde PDFs reales (no inferidos)
- PNR Etihad 8BFUJH: MAD 24/9 10:45 → KUL 25/9 08:25; SIN 25/10 19:25 → MAD 26/10 07:35
- MH1336 KUL→TGG 25/9 16:45 (asiento 06E, PNR EK4K32)
- MH1397 KBR→KUL 3/10 18:25 (PNR EKFFE5)
- MH1433 LGK→KUL 18/10 11:15 (PNR EKW3GI)
- AirAsia PEN→LGK 14/10 13:45 (PNR SIEZ5X, asientos 20A/20B)
- Hoteles: Villa Wanie 25-26/9, Laguna Redang 26-28/9, Alunan 28/9-3/10, Santa Grand KL 3-8/10, Avillion Cameron 8-10/10, Muntri Mews 10-12/10, 22 Macalisterz 12-14/10, Pelangi Beach 14-18/10, Liu Men Melaka 18-21/10, JEN Singapur 21-25/10
- Ferries verificados: Merang→Redang 26/9 09:30, Redang→Perhentian 28/9 10:30
- Transfer TGG→Merang Jetty 25/9 19:00 (63€)
- Daytrips: KL→Tanah Rata 8/10 09:00 (151$), Tanah Rata→George Town 10/10 09:00 (173$), KLIA→Melaka 18/10 14:00 (98$)

## Testing
- testing_agent_v3 iteración 1: **13/13 escenarios PASSED (100%)**, cero errores de consola
- Polish aplicado: contraste hero móvil + XSS escape en search empty-state
- Reporte: `/app/test_reports/iteration_1.json`

## Cómo usar la app
1. Localmente: `cd /app/malasia && python3 -m http.server 8765` → abrir `http://127.0.0.1:8765`
2. En móvil: subir contenido a cualquier hosting estático (Netlify, Vercel, GitHub Pages, S3) → instalar como PWA desde Safari/Chrome → "Añadir a pantalla de inicio"
3. Offline: una vez visitado, todo cachea automáticamente

## Personas
- **Iria Feijoo Regueiro**
- **Ignacio (Iñaqui) González**

## Backlog futuro (opcional)
- P2: Sincronización en la nube (Firebase) si quieren compartir checklist entre dos móviles
- P2: Modo gastos con fotos de tickets
- P2: Integración weather API (clima por día/destino)
- P2: Páginas de "lugares" con galería fotográfica

## Credenciales
N/A — app sin autenticación, 100% local.
