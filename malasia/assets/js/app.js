/* ============================================================
   Malasia & Singapur · App logic
   Vanilla JS · PWA offline-first
   ============================================================ */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  let DATA = null;
  let mapInstance = null;

  // ---------- LOAD DATA ----------
  async function loadData() {
    const res = await fetch('data/itinerary.json');
    DATA = await res.json();
    init();
  }

  // ---------- THEME ----------
  function initTheme() {
    const saved = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
  }
  function updateThemeIcon(theme) {
    const btn = $('#theme-toggle');
    if (!btn) return;
    btn.innerHTML = theme === 'dark'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  // ---------- TABS / VIEWS ----------
  function initTabs() {
    $$('.tab').forEach(t => {
      t.addEventListener('click', () => {
        const target = t.dataset.view;
        $$('.tab').forEach(x => x.setAttribute('aria-selected', x === t ? 'true' : 'false'));
        $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${target}`));
        if (target === 'mapa') setTimeout(initMap, 80);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // ---------- DATE HELPERS ----------
  const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  function fmtDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
  }
  function fmtDateShort(iso) {
    const d = new Date(iso + 'T00:00:00');
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  }
  function todayDay() {
    const today = new Date(); today.setHours(0,0,0,0);
    for (const day of DATA.dias) {
      const d = new Date(day.fecha + 'T00:00:00');
      if (d.getTime() === today.getTime()) return day;
    }
    return null;
  }
  function nextDay(current) {
    return DATA.dias.find(d => d.n === current.n + 1);
  }

  // ---------- TODAY HERO ----------
  function renderHero() {
    const today = todayDay();
    const hero = $('#hero-today');
    if (today) {
      const next = nextDay(today);
      hero.innerHTML = `
        <span class="pill">Hoy · Día ${today.n} de 32</span>
        <h2>${today.titulo.replace('·', '<em>·</em>')}</h2>
        <div style="opacity:.85;font-size:.92rem;margin-top:6px">${fmtDate(today.fecha)} · ${today.ciudad}</div>
        ${next ? `<p class="next">↓ Mañana — Día ${next.n}: ${next.titulo}</p>` : '<p class="next">Último día — feliz regreso ✦</p>'}
        <button class="primary" data-day="${today.n}" style="margin-top:18px;background:var(--gold);color:var(--ink);border:none;padding:10px 18px;border-radius:8px;font-weight:600;cursor:pointer">Ver detalle del día</button>
      `;
      $('button[data-day]', hero).addEventListener('click', () => openDay(today.n));
    } else {
      const first = DATA.dias[0];
      const start = new Date(first.fecha + 'T00:00:00');
      const now = new Date(); now.setHours(0,0,0,0);
      const diff = Math.round((start - now) / 86400000);
      hero.innerHTML = diff > 0
        ? `<span class="pill">Cuenta atrás</span>
           <h2>Quedan <em>${diff} días</em> para el viaje</h2>
           <p class="next">Inicio: ${fmtDate(first.fecha)} · ${first.titulo}</p>`
        : `<span class="pill">Viaje finalizado</span>
           <h2>Bienvenidos a <em>casa</em></h2>
           <p class="next">Esperamos que el viaje haya sido inolvidable ✦</p>`;
    }
  }

  // ---------- DAY LIST ----------
  function renderDayList() {
    const list = $('#day-list');
    const today = todayDay();
    list.innerHTML = DATA.dias.map(d => {
      const isToday = today && today.n === d.n;
      return `
        <article class="day-card ${isToday ? 'today' : ''}" data-testid="day-card-${d.n}" data-day="${d.n}" role="button" tabindex="0" aria-label="Ver día ${d.n}: ${d.titulo}">
          <div class="num">
            <span class="big">${d.n}</span>
            <span class="lbl">Día</span>
          </div>
          <div class="body">
            <h3>${d.titulo}</h3>
            <div class="meta">
              <span>${fmtDate(d.fecha)}</span>
              <span class="tag">${d.ciudad}</span>
              ${isToday ? '<span class="tag" style="background:var(--gold);color:var(--ink)">HOY</span>' : ''}
            </div>
          </div>
          <div class="chev">›</div>
        </article>
      `;
    }).join('');
    $$('.day-card').forEach(card => {
      const n = parseInt(card.dataset.day, 10);
      card.addEventListener('click', () => openDay(n));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDay(n); } });
    });
  }

  // ---------- DAY DETAIL ----------
  function openDay(n) {
    const d = DATA.dias.find(x => x.n === n);
    if (!d) return;
    const detail = $('#day-detail');
    const hotelObj = d.hotel ? DATA.lugares[d.hotel] : null;
    detail.innerHTML = `
      <button class="day-back" data-testid="day-back-btn" aria-label="Volver a la lista">← Volver al itinerario</button>
      <div class="day-hero" style="background-image:url('assets/headers/${d.header}')">
        <div class="hero-info">
          <span class="num-pill">DÍA ${d.n} DE 32</span>
          <h2>${d.titulo}</h2>
          <div class="date">${fmtDate(d.fecha)}</div>
        </div>
      </div>
      ${d.resumen ? `<div class="day-section"><p class="day-summary">${d.resumen}</p></div>` : ''}
      ${hotelObj ? `<div class="day-section">
        <h4>Alojamiento</h4>
        <div class="hotel-card">
          <div class="label">Hotel de la noche</div>
          <div class="name">${hotelObj.nombre}</div>
          ${hotelObj.direccion ? `<div class="addr">${hotelObj.direccion}</div>` : ''}
        </div>
      </div>` : ''}
      ${d.eventos && d.eventos.length ? `<div class="day-section">
        <h4>Agenda del día</h4>
        <div class="events">
          ${d.eventos.map(e => `
            <div class="event">
              <div class="ev-head">
                <span class="hour">${e.hora}</span>
                <span class="type-tag ${e.tipo}">${e.tipo}</span>
              </div>
              <div class="text">${e.texto}</div>
              ${e.doc && DATA.documentos[e.doc] ? `<a class="doc-link" href="${DATA.documentos[e.doc]}" target="_blank" rel="noopener" data-testid="doc-link-${e.doc}">📄 Ver documento (PDF)</a>` : ''}
            </div>
          `).join('')}
        </div>
      </div>` : ''}
      ${d.consejos && d.consejos.length ? `<div class="day-section">
        <h4>Consejos prácticos</h4>
        <ul class="tips">${d.consejos.map(c => `<li>${c}</li>`).join('')}</ul>
      </div>` : ''}
    `;
    $('#hero-today').style.display = 'none';
    $('#day-list').style.display = 'none';
    detail.classList.add('active');
    $('.day-back', detail).addEventListener('click', closeDay);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function closeDay() {
    $('#day-detail').classList.remove('active');
    $('#day-detail').innerHTML = '';
    $('#hero-today').style.display = '';
    $('#day-list').style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- MAP ----------
  function initMap() {
    if (mapInstance) { mapInstance.invalidateSize(); return; }
    if (typeof L === 'undefined') return;
    mapInstance = L.map('map', { scrollWheelZoom: true }).setView([4.5, 102.0], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '© OpenStreetMap'
    }).addTo(mapInstance);

    const iconHotel = L.divIcon({ html: '🏨', className: 'map-icon', iconSize: [30, 30] });
    const iconAir = L.divIcon({ html: '✈️', className: 'map-icon', iconSize: [30, 30] });
    const iconPort = L.divIcon({ html: '⛴️', className: 'map-icon', iconSize: [30, 30] });
    const iconIsl = L.divIcon({ html: '🏝️', className: 'map-icon', iconSize: [30, 30] });

    const bounds = [];
    Object.entries(DATA.lugares).forEach(([key, p]) => {
      if (!p.lat || !p.lng) return;
      let icon = iconHotel;
      if (p.tipo === 'aeropuerto') icon = iconAir;
      else if (p.tipo === 'puerto') icon = iconPort;
      else if (p.tipo === 'isla') icon = iconIsl;
      const m = L.marker([p.lat, p.lng], { icon }).addTo(mapInstance);
      m.bindPopup(`<strong>${p.nombre}</strong>${p.direccion ? '<br><small>'+p.direccion+'</small>' : ''}`);
      bounds.push([p.lat, p.lng]);
    });

    // Connecting line — main route excluding airports/transfers
    const routeKeys = ['villa_wanie','laguna_redang','alunan_resort','santa_grand_kl','avillion_cameron','muntri_mews','macalisterz_22','pelangi_beach','liu_men_melaka','jen_singapur'];
    const line = routeKeys.filter(k => DATA.lugares[k]).map(k => [DATA.lugares[k].lat, DATA.lugares[k].lng]);
    L.polyline(line, { color: '#C4922A', weight: 3, opacity: 0.7, dashArray: '6, 8' }).addTo(mapInstance);

    if (bounds.length) mapInstance.fitBounds(bounds, { padding: [40, 40] });
  }

  // ---------- TOOLS ----------
  // Currency converter (static rates Nov 2026 estimation)
  const RATES = { EUR: 1, MYR: 5.05, SGD: 1.45 };
  function convCurrency() {
    const amt = parseFloat($('#conv-amt').value) || 0;
    const from = $('#conv-from').value;
    const to = $('#conv-to').value;
    const eur = amt / RATES[from];
    const out = eur * RATES[to];
    $('#conv-result').textContent = `${out.toFixed(2)} ${to}`;
  }

  // Checklist
  const DEFAULT_CHECKLIST = {
    "Antes de salir de casa": [
      "Pasaportes (vigencia ≥6 meses desde 25 oct 2026)",
      "Visado eTA Malasia (MDAC online 3 días antes)",
      "Visado SG Arrival Card (3 días antes)",
      "Seguro de viaje internacional contratado",
      "Tarjeta sanitaria + tarjeta crédito + tarjeta débito",
      "Carnet de conducir internacional",
      "Copia digital de todos los documentos en email",
      "Notificar al banco las fechas de viaje",
      "Activar eSIM o tener SIM local lista",
      "Itinerario + esta web descargada en el móvil (offline)"
    ],
    "Equipaje": [
      "Ropa ligera de algodón / lino",
      "Bañadores ×2 y toalla microfibra",
      "Forro polar / chaqueta ligera (Cameron + AC)",
      "Calzado: 1 zapatillas trekking, 1 chanclas, 1 deportivas",
      "Sombrero, gafas de sol, gorra de repuesto",
      "Chubasquero plegable",
      "Adaptador enchufe tipo G (Reino Unido) ×2",
      "Powerbank + cables USB-C/Lightning",
      "Mochila pequeña diaria",
      "Bolsa estanca para playa/snorkel",
      "Gafas/tubo snorkel propios (opcional)"
    ],
    "Botiquín": [
      "Repelente mosquitos con DEET ≥30%",
      "Crema solar SPF 50 reef-safe",
      "Aftersun + crema hidratante",
      "Loperamida (diarrea del viajero)",
      "Sales de rehidratación oral",
      "Paracetamol + ibuprofeno",
      "Tiritas + apósitos",
      "Antihistamínico",
      "Pinzas + tijeras pequeñas",
      "Vacunas: hepatitis A, fiebre tifoidea (consultar)"
    ],
    "Dinero y tecnología": [
      "Ringgit malayo (MYR) en efectivo (~200 €)",
      "Dólar singapurense (SGD) en efectivo (~100 €)",
      "App Grab descargada (taxi/comida)",
      "App Google Maps con mapas descargados offline",
      "App moneda XE Converter",
      "WhatsApp activado (verificar 2FA)",
      "Backup fotos en Google Photos / iCloud"
    ]
  };
  function renderChecklist() {
    const wrap = $('#checklist-wrap');
    const saved = JSON.parse(localStorage.getItem('checklist') || '{}');
    wrap.innerHTML = '';
    Object.entries(DEFAULT_CHECKLIST).forEach(([cat, items]) => {
      const h = document.createElement('h4');
      h.style.cssText = 'font-family:var(--font-display);color:var(--gold);font-size:.85rem;letter-spacing:.12em;text-transform:uppercase;margin:18px 0 10px';
      h.textContent = cat;
      wrap.appendChild(h);
      const list = document.createElement('div');
      list.className = 'checklist';
      items.forEach((item, i) => {
        const id = `chk-${cat}-${i}`.replace(/\s/g, '_');
        const done = !!saved[id];
        const row = document.createElement('label');
        row.className = 'check-item' + (done ? ' done' : '');
        row.innerHTML = `<input type="checkbox" data-id="${id}" ${done ? 'checked' : ''}><label>${item}</label>`;
        $('input', row).addEventListener('change', e => {
          saved[id] = e.target.checked;
          localStorage.setItem('checklist', JSON.stringify(saved));
          row.classList.toggle('done', e.target.checked);
        });
        list.appendChild(row);
      });
      wrap.appendChild(list);
    });
  }

  // Expenses
  function loadExpenses() { return JSON.parse(localStorage.getItem('expenses') || '[]'); }
  function saveExpenses(arr) { localStorage.setItem('expenses', JSON.stringify(arr)); }
  function renderExpenses() {
    const list = $('#exp-list');
    const exp = loadExpenses();
    if (!exp.length) {
      list.innerHTML = '<p style="color:var(--mist);padding:10px;font-size:.9rem">Aún no hay gastos registrados.</p>';
      $('#exp-total').textContent = '0.00 €';
      return;
    }
    list.innerHTML = exp.map((e, i) => `
      <div class="exp-item">
        <span class="desc">${e.desc} <small style="color:var(--mist)">· ${e.date}</small></span>
        <span class="amt">${e.amtEur.toFixed(2)} €</span>
        <button class="del" data-i="${i}" data-testid="del-exp-${i}" aria-label="Eliminar">×</button>
      </div>
    `).join('');
    $$('#exp-list .del').forEach(b => {
      b.addEventListener('click', () => {
        const arr = loadExpenses();
        arr.splice(parseInt(b.dataset.i, 10), 1);
        saveExpenses(arr);
        renderExpenses();
      });
    });
    const total = exp.reduce((s, e) => s + e.amtEur, 0);
    $('#exp-total').textContent = total.toFixed(2) + ' €';
  }
  function addExpense() {
    const desc = $('#exp-desc').value.trim();
    const amt = parseFloat($('#exp-amt').value);
    const cur = $('#exp-cur').value;
    if (!desc || !amt) { toast('Indica descripción e importe'); return; }
    const amtEur = amt / RATES[cur];
    const arr = loadExpenses();
    arr.push({ desc, amt, cur, amtEur, date: fmtDateShort(new Date().toISOString().slice(0,10)) });
    saveExpenses(arr);
    $('#exp-desc').value = ''; $('#exp-amt').value = '';
    renderExpenses();
    toast('Gasto añadido');
  }

  // ---------- SEARCH ----------
  function buildSearchIndex() {
    const idx = [];
    DATA.dias.forEach(d => {
      const blob = [d.titulo, d.ciudad, d.resumen,
        ...(d.eventos || []).map(e => e.hora + ' ' + e.texto),
        ...(d.consejos || [])].filter(Boolean).join(' ');
      idx.push({ n: d.n, titulo: d.titulo, fecha: d.fecha, ciudad: d.ciudad, blob: blob.toLowerCase(), original: blob });
    });
    return idx;
  }
  let SEARCH_IDX = null;
  function search(q) {
    if (!SEARCH_IDX) SEARCH_IDX = buildSearchIndex();
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return SEARCH_IDX.filter(e => e.blob.includes(t)).slice(0, 30);
  }
  function highlight(text, q) {
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }
  function renderSearchResults(q) {
    const wrap = $('#search-results');
    if (!q.trim()) { wrap.innerHTML = '<p style="color:var(--mist)">Escribe arriba para buscar entre los 32 días, ciudades, eventos y consejos.</p>'; return; }
    const hits = search(q);
    if (!hits.length) { wrap.innerHTML = `<p style="color:var(--mist)">Sin resultados para "<strong>${q}</strong>".</p>`; return; }
    wrap.innerHTML = hits.map(h => {
      const idx = h.blob.indexOf(q.toLowerCase());
      const excerpt = h.original.substring(Math.max(0, idx - 30), idx + 100);
      return `
        <article class="search-hit" data-day="${h.n}" data-testid="search-hit-${h.n}">
          <div class="sh-day">Día ${h.n} · ${fmtDate(h.fecha)} · ${h.ciudad}</div>
          <div class="sh-title">${h.titulo}</div>
          <div class="sh-excerpt">…${highlight(excerpt, q)}…</div>
        </article>
      `;
    }).join('');
    $$('#search-results .search-hit').forEach(el => {
      el.addEventListener('click', () => {
        const n = parseInt(el.dataset.day, 10);
        $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.view === 'itinerario' ? 'true' : 'false'));
        $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-itinerario'));
        openDay(n);
      });
    });
  }

  // ---------- PHRASES ----------
  const PHRASES = {
    "Saludos y cortesía": [
      { es: "Hola / Buenos días", ms: "Selamat pagi", en: "Hello / Good morning" },
      { es: "Gracias", ms: "Terima kasih", en: "Thank you" },
      { es: "De nada", ms: "Sama-sama", en: "You're welcome" },
      { es: "Por favor", ms: "Tolong", en: "Please" },
      { es: "Perdón / Disculpe", ms: "Maaf", en: "Excuse me / Sorry" },
      { es: "Sí / No", ms: "Ya / Tidak", en: "Yes / No" }
    ],
    "Hotel": [
      { es: "Tengo una reserva a nombre de…", ms: "Saya ada tempahan atas nama…", en: "I have a reservation under the name…" },
      { es: "¿A qué hora es el desayuno?", ms: "Pukul berapa sarapan?", en: "What time is breakfast?" },
      { es: "¿Hay wifi gratis?", ms: "Ada wifi percuma?", en: "Is there free wifi?" },
      { es: "Necesito una toalla limpia", ms: "Saya perlukan tuala bersih", en: "I need a clean towel" }
    ],
    "Taxi / Grab": [
      { es: "¿Cuánto cuesta hasta…?", ms: "Berapa harganya ke…?", en: "How much to…?" },
      { es: "Lléveme a esta dirección, por favor", ms: "Tolong bawa saya ke alamat ini", en: "Please take me to this address" },
      { es: "Pare aquí, por favor", ms: "Tolong berhenti di sini", en: "Stop here, please" }
    ],
    "Restaurante": [
      { es: "¿Tienen menú en inglés?", ms: "Ada menu dalam bahasa Inggeris?", en: "Do you have an English menu?" },
      { es: "Sin picante, por favor", ms: "Tidak pedas, tolong", en: "Not spicy, please" },
      { es: "La cuenta, por favor", ms: "Bil, tolong", en: "The bill, please" },
      { es: "Vegetariano / sin carne", ms: "Vegetarian / tanpa daging", en: "Vegetarian / no meat" }
    ],
    "Urgencias": [
      { es: "Ayuda", ms: "Tolong!", en: "Help!" },
      { es: "Llamen a un médico", ms: "Panggil doktor", en: "Call a doctor" },
      { es: "Estoy enfermo / herido", ms: "Saya sakit / cedera", en: "I'm sick / injured" },
      { es: "Hospital / Farmacia", ms: "Hospital / Farmasi", en: "Hospital / Pharmacy" },
      { es: "Llamen a la policía", ms: "Panggil polis", en: "Call the police" }
    ],
    "Números y dinero": [
      { es: "Uno, dos, tres", ms: "Satu, dua, tiga", en: "One, two, three" },
      { es: "¿Cuánto cuesta?", ms: "Berapa harganya?", en: "How much?" },
      { es: "Demasiado caro", ms: "Terlalu mahal", en: "Too expensive" },
      { es: "¿Acepta tarjeta?", ms: "Boleh guna kad kredit?", en: "Do you accept card?" }
    ]
  };
  function renderPhrases() {
    const wrap = $('#phrases-wrap');
    wrap.innerHTML = Object.entries(PHRASES).map(([group, items]) => `
      <div class="phrase-group">
        <h4>${group}</h4>
        ${items.map(p => `
          <div class="phrase">
            <div class="es">${p.es}</div>
            <div class="ms">› ${p.ms}</div>
            <div class="en">${p.en}</div>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  // ---------- TOAST ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- INIT ----------
  function init() {
    initTheme();
    initTabs();
    renderHero();
    renderDayList();
    renderChecklist();
    renderExpenses();
    renderPhrases();
    renderSearchResults('');

    $('#theme-toggle').addEventListener('click', toggleTheme);
    $('#conv-amt').addEventListener('input', convCurrency);
    $('#conv-from').addEventListener('change', convCurrency);
    $('#conv-to').addEventListener('change', convCurrency);
    convCurrency();
    $('#exp-add').addEventListener('click', addExpense);
    $('#search-input').addEventListener('input', e => renderSearchResults(e.target.value));

    // Service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', loadData);
})();
