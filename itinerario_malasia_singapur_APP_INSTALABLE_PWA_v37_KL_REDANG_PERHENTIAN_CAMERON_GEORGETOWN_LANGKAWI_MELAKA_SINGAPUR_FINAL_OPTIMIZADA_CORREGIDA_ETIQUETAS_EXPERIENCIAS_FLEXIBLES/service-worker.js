const CACHE_NAME = 'malasia-singapur-v37-final-optimizada-corregida-2026-05-19';
const APP_SHELL = [
  "./",
  "./CONTROL_CALIDAD_v33_VIP_FINAL.txt",
  "./INSTRUCCIONES_INSTALACION_PWA.txt",
  "./LEEME_GASTOS_DURANTE_EL_VIAJE.txt",
  "./LEEME_HTML_CON_DOCUMENTOS.txt",
  "./LEEME_HTML_CON_DOCUMENTOS_VIP.txt",
  "./VERSION.txt",
  "./assets/headers/header_cameron.jpg",
  "./assets/headers/header_cameron_usuario_real.jpg",
  "./assets/headers/header_islas.jpg",
  "./assets/headers/header_islas_usuario_perhentians_real.jpg",
  "./assets/headers/header_kl.jpg",
  "./assets/headers/header_langkawi.jpg",
  "./assets/headers/header_langkawi_usuario_real.jpg",
  "./assets/headers/header_melaka.jpg",
  "./assets/headers/header_melaka_usuario_real.jpg",
  "./assets/headers/header_penang.jpg",
  "./assets/headers/header_penang_usuario_georgetown_real.jpg",
  "./assets/headers/header_singapur.jpg",
  "./assets/headers/header_singapur_usuario_real.jpg",
  "./assets/icons/app-icon-192.png",
  "./assets/icons/app-icon-512.png",
  "./documentos/MANIFIESTO_DOCUMENTOS_INCLUIDOS.txt",
  "./documentos/airasia_invoice_siez5x.pdf",
  "./documentos/airasia_itinerary_siez5x_penang_langkawi.pdf",
  "./documentos/daytrip_klia_melaka_6PD695Q3.pdf",
  "./documentos/daytrip_kuala_lumpur_tanah_rata_EM55LGEE.pdf",
  "./documentos/daytrip_tanah_rata_george_town_2XPAY1F5.pdf",
  "./documentos/etihad_ignacio_8bfujh.pdf",
  "./documentos/etihad_iria_8bfujh.pdf",
  "./documentos/ferry_merang_redang.pdf",
  "./documentos/ferry_redang_perhentian.pdf",
  "./documentos/gastos_malasia_singapur.xlsx",
  "./documentos/hotel_cameron_highlands_avillion_checkin.pdf",
  "./documentos/hotel_kuala_lumpur_santa_grand_signature_checkin.pdf",
  "./documentos/hotel_langkawi_pelangi_beach_resort_checkin.pdf",
  "./documentos/hotel_melaka_liu_men_melaka_checkin.pdf",
  "./documentos/hotel_merang_villa_wanie_inn_confirmacion.pdf",
  "./documentos/hotel_penang_22_macalisterz_checkin.pdf",
  "./documentos/hotel_penang_muntri_mews_checkin.pdf",
  "./documentos/hotel_perhentian_alunan_resort_checkin.pdf",
  "./documentos/hotel_singapur_jen_orchardgateway_confirmacion.pdf",
  "./documentos/malaysia_mh1336_ignacio_kul_tgg.pdf",
  "./documentos/malaysia_mh1336_iria_kul_tgg.pdf",
  "./documentos/malaysia_mh1397_ignacio_kbr_kul.pdf",
  "./documentos/malaysia_mh1397_iria_kbr_kul.pdf",
  "./documentos/malaysia_mh1433_ignacio_lgk_kul.pdf",
  "./documentos/malaysia_mh1433_iria_lgk_kul.pdf",
  "./documentos/pasaporte_ignacio.jpg",
  "./documentos/pasaporte_iria.jpg",
  "./documentos/reserva_laguna_redang.pdf",
  "./documentos/transfer_tgg_merang_jetty.pdf",
  "./documentos/transfer_kuala_besut_kota_bharu_hotel.docx",
  "./documentos/transfer_kuala_besut_kota_bharu_hotel.pdf",
  "./gastos_malasia_singapur.xlsx",
  "./index.html",
  "./manifest.webmanifest",
  "./offline.html",
  "./LEEME_MARCANDO_EL_POLO_KL_v37.txt",
  "./LEEME_ACTUALIZACION_KL_REDANG_PERHENTIAN_v37.txt",
  "./LEEME_ACTUALIZACION_CAMERON_v37.txt",
  "./LEEME_ACTUALIZACION_GEORGETOWN_v37.txt",
  "./LEEME_ACTUALIZACION_LANGKAWI_v37.txt",
  "./LEEME_ACTUALIZACION_MELAKA_v37.txt",
  "./LEEME_ACTUALIZACION_SINGAPUR_v37.txt",
  "./LEEME_ACTUALIZACION_OPTIMIZADA_v37.txt",
  "./itinerario_malasia_singapur_PDF_IMPRIMIBLE_v37_FINAL_OPTIMIZADA.pdf",
  "./itinerario_malasia_singapur_PDF_IMPRIMIBLE_v37_FINAL_OPTIMIZADA_CORREGIDA.pdf",
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.match('./offline.html');
        return caches.match('./index.html');
      });
    })
  );
});

/* v37-michelin-kl-final-2026-05-17: cache renovada tras integrar Gastronomía Michelin KL. */

/* v37-merdeka-square-final-2026-05-17: cache renovada tras incorporar Merdeka Square / Dataran Merdeka al Día 13. */

/* v37-cameron-final-2026-05-18: cache renovada tras integrar mejoras de Cameron Highlands. */


/* v37-georgetown-final-2026-05-18: cache renovada tras integrar mejoras de George Town / Penang. */


/* v37-langkawi-final-2026-05-18: cache renovada tras integrar mejoras de Langkawi. */


/* v37-melaka-final-2026-05-18: cache renovada tras integrar mejoras de Melaka. */

/* correccion-uso-final-conversor-2026-05-19: retirada pestaña Uso final, botón Guardar PDF en cabecera y etiqueta Conversor € restaurada. */
