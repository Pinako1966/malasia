/* Malasia & Singapur · app.js · v2 con 12 mejoras */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

  let DATA = null;
  let mapInstance = null;

  // ---------- LOAD ----------
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

  // ---------- TABS ----------
  function initTabs() {
    $$('.tab').forEach(t => t.addEventListener('click', () => {
      const v = t.dataset.view;
      $$('.tab').forEach(x => x.setAttribute('aria-selected', x === t ? 'true' : 'false'));
      $$('.view').forEach(x => x.classList.toggle('active', x.id === `view-${v}`));
      if (v === 'mapa') setTimeout(initMap, 80);
      if (v === 'resumen') renderDashboard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }

  // ---------- DATES ----------
  const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const fmtDate = iso => { const d = new Date(iso+'T00:00:00'); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtDateShort = iso => { const d = new Date(iso+'T00:00:00'); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; };
  function todayDay() {
    const t = new Date(); t.setHours(0,0,0,0);
    return DATA.dias.find(d => new Date(d.fecha+'T00:00:00').getTime() === t.getTime()) || null;
  }
  const nextDay = c => DATA.dias.find(d => d.n === c.n + 1);

  // ---------- DUAL CLOCK ----------
  function startClock() {
    const tick = () => {
      const now = new Date();
      // Malasia/Singapur UTC+8
      const mal = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      const esp = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
      const today = todayDay();
      const dayLabel = today ? `Día ${today.n}/32` : '';
      const fmt = d => String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
      const el = $('#dual-clock');
      if (el) el.innerHTML = `🇲🇾 <strong>${fmt(mal)}</strong> · 🇪🇸 ${fmt(esp)} ${dayLabel ? '· '+dayLabel : ''}`;
    };
    tick();
    setInterval(tick, 30000);
  }

  // ---------- HERO ----------
  function renderHero() {
    const today = todayDay();
    const hero = $('#hero-today');
    if (today) {
      const next = nextDay(today);
      hero.innerHTML = `
        <span class="pill">Hoy · Día ${today.n} de 32</span>
        <h2>${escapeHtml(today.titulo)}</h2>
        <div style="opacity:.9;font-size:.92rem;margin-top:6px">${fmtDate(today.fecha)} · ${escapeHtml(today.ciudad)}</div>
        ${next ? `<p class="next">Mañana — Día ${next.n}: ${escapeHtml(next.titulo)}</p>` : '<p class="next">Último día — feliz regreso ✦</p>'}
        <button class="primary hero-btn" data-day="${today.n}">Ver el día completo →</button>
      `;
      $('button[data-day]', hero).addEventListener('click', () => openDay(today.n));
    } else {
      const first = DATA.dias[0];
      const start = new Date(first.fecha + 'T00:00:00');
      const now = new Date(); now.setHours(0,0,0,0);
      const diff = Math.round((start - now) / 86400000);
      hero.innerHTML = diff > 0
        ? `<span class="pill">Cuenta atrás</span><h2>Quedan <em>${diff} días</em> para el viaje</h2><p class="next">Inicio: ${fmtDate(first.fecha)} · ${escapeHtml(first.titulo)}</p>`
        : `<span class="pill">Viaje finalizado</span><h2>Bienvenidos a <em>casa</em></h2><p class="next">Esperamos que haya sido inolvidable ✦</p>`;
    }
  }

  // ---------- DAY LIST ----------
  function renderDayList() {
    const list = $('#day-list');
    const today = todayDay();
    list.innerHTML = DATA.dias.map(d => {
      const isToday = today && today.n === d.n;
      const alertIcon = d.alerta ? (d.alerta.nivel === 'warning' ? '⚠️' : 'ℹ️') : '';
      return `
        <article class="day-card ${isToday ? 'today' : ''}" data-testid="day-card-${d.n}" data-day="${d.n}" role="button" tabindex="0" aria-label="Día ${d.n}: ${escapeHtml(d.titulo)}">
          <div class="num"><span class="big">${d.n}</span><span class="lbl">Día</span></div>
          <div class="body">
            <h3>${escapeHtml(d.titulo)} ${alertIcon}</h3>
            <div class="meta">
              <span>${fmtDate(d.fecha)}</span>
              <span class="tag">${escapeHtml(d.ciudad)}</span>
              ${isToday ? '<span class="tag" style="background:var(--gold);color:var(--ink)">HOY</span>' : ''}
            </div>
          </div>
          <div class="chev">›</div>
        </article>`;
    }).join('');
    $$('.day-card').forEach(c => {
      const n = parseInt(c.dataset.day, 10);
      c.addEventListener('click', () => openDay(n));
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDay(n); } });
    });
  }

  // ---------- DAY DETAIL ----------
  function openDay(n) {
    const d = DATA.dias.find(x => x.n === n);
    if (!d) return;
    const detail = $('#day-detail');
    const hotel = d.hotel ? DATA.lugares[d.hotel] : null;
    const clima = DATA.clima_destinos[d.ciudad];
    const notes = JSON.parse(localStorage.getItem('notes') || '{}')[d.n] || '';

    let next = nextDay(d);
    let tomorrowAlert = '';
    if (next && next.eventos) {
      const earlyTransit = next.eventos.find(e => ['vuelo','ferry','transfer'].includes(e.tipo) && e.hora && e.hora !== '—' && parseInt(e.hora) < 12);
      if (earlyTransit) tomorrowAlert = `<div class="alert alert-warning"><strong>⚠️ Mañana sales pronto:</strong> ${escapeHtml(earlyTransit.hora)} ${escapeHtml(earlyTransit.texto.substring(0, 80))}… Prepara maleta esta noche.</div>`;
    }

    detail.innerHTML = `
      <button class="day-back" data-testid="day-back-btn">← Volver al itinerario</button>
      <div class="day-hero" style="background-image:url('assets/headers/${d.header}')">
        <div class="hero-info">
          <span class="num-pill">DÍA ${d.n} DE 32</span>
          <h2>${escapeHtml(d.titulo)}</h2>
          <div class="date">${fmtDate(d.fecha)}</div>
        </div>
      </div>

      ${d.alerta ? `<div class="alert alert-${d.alerta.nivel}"><strong>${d.alerta.nivel==='warning'?'⚠️ Atención:':'ℹ️ Aviso:'}</strong> ${escapeHtml(d.alerta.texto)}</div>` : ''}
      ${tomorrowAlert}

      ${d.resumen ? `<div class="day-section"><p class="day-summary">${escapeHtml(d.resumen)}</p></div>` : ''}

      ${clima ? `<div class="day-section">
        <h4>Clima esperado</h4>
        <div class="climate-card">
          <div><strong>${clima.temp}</strong> · ${escapeHtml(clima.lluvia)}</div>
          <div class="climate-tip">${escapeHtml(clima.consejo)}</div>
        </div>
      </div>` : ''}

      ${hotel ? `<div class="day-section">
        <h4>Alojamiento</h4>
        <div class="hotel-card">
          <div class="label">Hotel de la noche</div>
          <div class="name">${escapeHtml(hotel.nombre)}</div>
          ${hotel.direccion ? `<div class="addr">${escapeHtml(hotel.direccion)}</div>` : ''}
          <div class="hotel-actions">
            ${hotel.tel ? `<a class="action-btn" href="tel:${hotel.tel.replace(/\s/g,'')}" data-testid="hotel-call">📞 Llamar</a>` : ''}
            ${hotel.lat ? `<a class="action-btn" href="https://www.google.com/maps/dir/?api=1&destination=${hotel.lat},${hotel.lng}" target="_blank" rel="noopener" data-testid="hotel-maps">📍 Cómo llegar</a>` : ''}
            <a class="action-btn" href="https://www.grab.com/sg/transport/" target="_blank" rel="noopener" data-testid="hotel-grab">🚖 Grab</a>
          </div>
        </div>
      </div>` : ''}

      ${d.eventos && d.eventos.length ? `<div class="day-section">
        <h4>Agenda del día</h4>
        <div class="events">
          ${d.eventos.map(e => `
            <div class="event">
              <div class="ev-head">
                <span class="hour">${escapeHtml(e.hora)}</span>
                <span class="type-tag ${e.tipo}">${e.tipo}</span>
              </div>
              <div class="text">${escapeHtml(e.texto)}</div>
              ${e.pnr ? `<div class="pnr-box"><span class="pnr-label">Código de reserva</span><span class="pnr-value" data-pnr="${escapeHtml(e.pnr)}">${escapeHtml(e.pnr)}</span><button class="pnr-copy" data-pnr="${escapeHtml(e.pnr)}" data-testid="copy-pnr-${escapeHtml(e.pnr)}">Copiar</button></div>` : ''}
              ${e.doc && DATA.documentos[e.doc] ? `<a class="doc-link" href="${DATA.documentos[e.doc]}" target="_blank" rel="noopener" data-testid="doc-link-${e.doc}">📄 Ver documento (PDF)</a>` : ''}
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <div class="day-section">
        <h4>Mis notas del día</h4>
        <textarea id="day-notes" class="notes-input" placeholder="Escribe aquí recuerdos, recomendaciones, cosas a recordar..." data-day="${d.n}">${escapeHtml(notes)}</textarea>
        <p class="notes-hint">Se guarda automáticamente en este dispositivo.</p>
      </div>

      ${d.consejos && d.consejos.length ? `<div class="day-section">
        <h4>Consejos prácticos</h4>
        <ul class="tips">${d.consejos.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
      </div>` : ''}
    `;

    $('#hero-today').style.display = 'none';
    $('#day-list').style.display = 'none';
    detail.classList.add('active');

    $('.day-back', detail).addEventListener('click', closeDay);
    $$('.pnr-copy', detail).forEach(b => b.addEventListener('click', e => copyPNR(e.target.dataset.pnr)));
    const ta = $('#day-notes', detail);
    if (ta) ta.addEventListener('input', e => saveNote(e.target.dataset.day, e.target.value));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeDay() {
    $('#day-detail').classList.remove('active');
    $('#day-detail').innerHTML = '';
    $('#hero-today').style.display = '';
    $('#day-list').style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveNote(dayN, txt) {
    const notes = JSON.parse(localStorage.getItem('notes') || '{}');
    notes[dayN] = txt;
    localStorage.setItem('notes', JSON.stringify(notes));
  }

  function copyPNR(pnr) {
    navigator.clipboard.writeText(pnr).then(() => toast(`Código ${pnr} copiado`));
  }

  // ---------- SOS ----------
  function openSOS() {
    const m = $('#sos-modal');
    const e = DATA.emergencias;
    $('#sos-body').innerHTML = `
      <h3>🚨 Números de emergencia</h3>
      <div class="sos-list">
        ${e.numeros.map(n => `<a class="sos-item urgent" href="tel:${n.tel}"><div><strong>${escapeHtml(n.numero)}</strong><br><small>${escapeHtml(n.tipo)} · ${escapeHtml(n.pais)}</small></div><span>📞</span></a>`).join('')}
      </div>

      <h3 style="margin-top:24px">🏛️ Embajadas de España</h3>
      <div class="sos-list">
        ${e.embajadas.map(em => `
          <div class="sos-item">
            <div>
              <strong>${escapeHtml(em.ciudad)}</strong><br>
              <small>${escapeHtml(em.direccion)}</small><br>
              <a href="tel:${em.tel.replace(/\s/g,'')}">${escapeHtml(em.tel)}</a> · <a href="tel:${em.tel_emergencias_24h.replace(/\s/g,'')}">${escapeHtml(em.tel_emergencias_24h)} (24h)</a><br>
              <a href="mailto:${em.email}">${escapeHtml(em.email)}</a>
            </div>
            <a class="action-btn" href="https://www.google.com/maps/dir/?api=1&destination=${em.lat},${em.lng}" target="_blank" rel="noopener">📍 Mapa</a>
          </div>
        `).join('')}
      </div>

      <h3 style="margin-top:24px">🩺 Frases urgentes (toca para escuchar)</h3>
      <div class="sos-list">
        ${e.frases_urgencia.map((f, i) => `
          <div class="sos-item phrase-row">
            <div>
              <strong>${escapeHtml(f.es)}</strong><br>
              <em>${escapeHtml(f.ms)}</em><br>
              <small>${escapeHtml(f.en)}</small>
            </div>
            <button class="action-btn speak-btn" data-text="${escapeHtml(f.en)}" data-testid="speak-${i}">🔊</button>
          </div>
        `).join('')}
      </div>

      <h3 style="margin-top:24px">📝 Datos personales (rellenar)</h3>
      <p class="notes-hint">Rellena aquí información sensible. Solo se guarda en tu dispositivo.</p>
      ${renderPersonalForm()}
    `;
    $$('.speak-btn', m).forEach(b => b.addEventListener('click', () => speak(b.dataset.text)));
    $$('.personal-field', m).forEach(i => i.addEventListener('input', savePersonal));
    m.classList.add('open');
  }
  function closeSOS() { $('#sos-modal').classList.remove('open'); }

  function renderPersonalForm() {
    const p = JSON.parse(localStorage.getItem('personal') || '{}');
    const fields = [
      ['seguro_compania', 'Compañía del seguro de viaje'],
      ['seguro_poliza', 'Número de póliza'],
      ['seguro_tel', 'Teléfono 24h del seguro'],
      ['contacto1_nombre', 'Contacto familiar 1 (nombre)'],
      ['contacto1_tel', 'Contacto familiar 1 (tel.)'],
      ['contacto2_nombre', 'Contacto familiar 2 (nombre)'],
      ['contacto2_tel', 'Contacto familiar 2 (tel.)'],
      ['iria_grupo', 'Iria · grupo sanguíneo'],
      ['iria_alergias', 'Iria · alergias / medicación'],
      ['inaqui_grupo', 'Iñaqui · grupo sanguíneo'],
      ['inaqui_alergias', 'Iñaqui · alergias / medicación']
    ];
    return `<div class="personal-form">${fields.map(([k, l]) => `<div class="pf-row"><label>${l}</label><input class="personal-field" data-key="${k}" value="${escapeHtml(p[k]||'')}" type="text"></div>`).join('')}</div>`;
  }
  function savePersonal() {
    const p = {};
    $$('.personal-field').forEach(i => p[i.dataset.key] = i.value);
    localStorage.setItem('personal', JSON.stringify(p));
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return toast('Tu navegador no soporta TTS');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.85;
    speechSynthesis.speak(u);
  }

  // ---------- MAP ----------
  let mapMarkers = { hotel: [], aeropuerto: [], puerto: [], isla: [], ciudad: [] };
  let mapFilter = 'all';
  function initMap() {
    if (mapInstance) { mapInstance.invalidateSize(); return; }
    if (typeof L === 'undefined') return;
    mapInstance = L.map('map', { scrollWheelZoom: true }).setView([4.5, 102.0], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(mapInstance);
    const icons = {
      hotel: L.divIcon({ html: '🏨', className: 'map-icon', iconSize: [30,30] }),
      aeropuerto: L.divIcon({ html: '✈️', className: 'map-icon', iconSize: [30,30] }),
      puerto: L.divIcon({ html: '⛴️', className: 'map-icon', iconSize: [30,30] }),
      isla: L.divIcon({ html: '🏝️', className: 'map-icon', iconSize: [30,30] }),
      ciudad: L.divIcon({ html: '🏙️', className: 'map-icon', iconSize: [30,30] })
    };
    const bounds = [];
    Object.entries(DATA.lugares).forEach(([k, p]) => {
      if (!p.lat) return;
      const m = L.marker([p.lat, p.lng], { icon: icons[p.tipo] || icons.hotel });
      m.bindPopup(`<strong>${escapeHtml(p.nombre)}</strong>${p.direccion?`<br><small>${escapeHtml(p.direccion)}</small>`:''}${p.tel?`<br><a href="tel:${p.tel.replace(/\s/g,'')}">${escapeHtml(p.tel)}</a>`:''}`);
      m.addTo(mapInstance);
      (mapMarkers[p.tipo] = mapMarkers[p.tipo] || []).push(m);
      bounds.push([p.lat, p.lng]);
    });
    const routeKeys = ['villa_wanie','laguna_redang','alunan_resort','santa_grand_kl','avillion_cameron','muntri_mews','macalisterz_22','pelangi_beach','liu_men_melaka','jen_singapur'];
    const line = routeKeys.filter(k => DATA.lugares[k]).map(k => [DATA.lugares[k].lat, DATA.lugares[k].lng]);
    L.polyline(line, { color: '#C4922A', weight: 3, opacity: 0.7, dashArray: '6,8' }).addTo(mapInstance);
    if (bounds.length) mapInstance.fitBounds(bounds, { padding: [40,40] });

    // Filter buttons
    $$('.map-filter').forEach(b => b.addEventListener('click', () => {
      $$('.map-filter').forEach(x => x.classList.toggle('active', x === b));
      mapFilter = b.dataset.filter;
      applyMapFilter();
    }));

    $('#map-locate')?.addEventListener('click', () => {
      if (!navigator.geolocation) return toast('Geolocalización no disponible');
      navigator.geolocation.getCurrentPosition(pos => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        L.marker(ll, { icon: L.divIcon({ html: '📍', className: 'map-icon', iconSize: [34,34] }) }).addTo(mapInstance).bindPopup('Tú').openPopup();
        mapInstance.setView(ll, 13);
      }, () => toast('No se pudo obtener tu ubicación'));
    });
  }
  function applyMapFilter() {
    Object.entries(mapMarkers).forEach(([tipo, list]) => {
      list.forEach(m => {
        const show = mapFilter === 'all' || mapFilter === tipo;
        if (show) m.addTo(mapInstance); else mapInstance.removeLayer(m);
      });
    });
  }

  // ---------- CURRENCY ----------
  const RATES = { EUR: 1, MYR: 5.05, SGD: 1.45 };
  function convCurrency() {
    const a = parseFloat($('#conv-amt').value) || 0;
    const from = $('#conv-from').value, to = $('#conv-to').value;
    $('#conv-result').textContent = `${(a / RATES[from] * RATES[to]).toFixed(2)} ${to}`;
  }

  // ---------- EXPENSES + BUDGET ----------
  const CATEGORIES = ['Alojamiento','Comida','Transporte','Actividades','Otros'];
  const loadExp = () => JSON.parse(localStorage.getItem('expenses') || '[]');
  const saveExp = a => localStorage.setItem('expenses', JSON.stringify(a));

  function renderExpenses() {
    const list = $('#exp-list');
    const exp = loadExp();
    if (!exp.length) {
      list.innerHTML = '<p style="color:var(--mist);padding:10px;font-size:.9rem">Aún no hay gastos registrados.</p>';
      $('#exp-total').textContent = '0.00 €';
      renderBudget();
      return;
    }
    list.innerHTML = exp.map((e, i) => `
      <div class="exp-item">
        <span class="desc">${escapeHtml(e.desc)} <small style="color:var(--mist)">· ${escapeHtml(e.cat||'Otros')} · ${escapeHtml(e.date)}</small></span>
        <span class="amt">${e.amtEur.toFixed(2)} €</span>
        <button class="del" data-i="${i}" data-testid="del-exp-${i}" aria-label="Eliminar">×</button>
      </div>`).join('');
    $$('#exp-list .del').forEach(b => b.addEventListener('click', () => {
      const a = loadExp(); a.splice(parseInt(b.dataset.i,10),1); saveExp(a); renderExpenses();
    }));
    $('#exp-total').textContent = exp.reduce((s,e) => s+e.amtEur, 0).toFixed(2) + ' €';
    renderBudget();
  }
  function addExpense() {
    const desc = $('#exp-desc').value.trim();
    const amt = parseFloat($('#exp-amt').value);
    const cur = $('#exp-cur').value;
    const cat = $('#exp-cat').value;
    if (!desc || !amt) { toast('Indica descripción e importe'); return; }
    const arr = loadExp();
    arr.push({ desc, amt, cur, cat, amtEur: amt / RATES[cur], date: fmtDateShort(new Date().toISOString().slice(0,10)) });
    saveExp(arr);
    $('#exp-desc').value=''; $('#exp-amt').value='';
    renderExpenses();
    toast('Gasto añadido');
  }
  function renderBudget() {
    const exp = loadExp();
    const total = exp.reduce((s,e) => s+e.amtEur, 0);
    const max = DATA.viaje.presupuesto_total_eur;
    const pct = Math.min(100, (total/max)*100);
    const remaining = Math.max(0, max - total);
    const byCat = {};
    CATEGORIES.forEach(c => byCat[c] = 0);
    exp.forEach(e => byCat[e.cat || 'Otros'] = (byCat[e.cat || 'Otros']||0) + e.amtEur);

    // Days passed
    const start = new Date(DATA.viaje.fecha_inicio);
    const now = new Date();
    const daysIn = Math.max(1, Math.min(32, Math.ceil((now-start)/86400000)));
    const avgDay = total / daysIn;

    const wrap = $('#budget-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="budget-bar-row">
        <div class="budget-progress"><div class="budget-fill" style="width:${pct}%"></div></div>
        <div class="budget-stats">
          <div><strong>${total.toFixed(0)} €</strong> de ${max} € · <small style="color:var(--mist)">quedan ${remaining.toFixed(0)} €</small></div>
          <div style="font-size:.85rem;color:var(--mist)">Promedio: ${avgDay.toFixed(0)} €/día (${daysIn} días)</div>
        </div>
      </div>
      <div class="budget-cats">
        ${CATEGORIES.map(c => `<div class="bcat"><span class="bcat-name">${c}</span><span class="bcat-amt">${byCat[c].toFixed(0)} €</span></div>`).join('')}
      </div>`;
  }

  // ---------- CHECKLIST ----------
  const DEF_CHECK = {
    "Antes de salir": ["Pasaportes vigencia ≥6 meses desde 26/10/2026","MDAC Malasia online 3 días antes","SG Arrival Card online 3 días antes","Seguro viaje contratado","Tarjeta sanitaria + crédito + débito","Carnet conducir internacional","Copia documentos en email","Avisar al banco","eSIM activada","Web descargada offline en el móvil"],
    "Equipaje": ["Ropa ligera algodón / lino","Bañadores ×2 + toalla microfibra","Forro polar (Cameron + AC)","Calzado: 1 trekking, 1 chanclas, 1 deportivas","Sombrero, gafas sol, gorra extra","Chubasquero plegable","Adaptador tipo G (UK) ×2","Powerbank + cables","Mochila pequeña diaria","Bolsa estanca","Snorkel propio (opcional)"],
    "Botiquín": ["Repelente DEET ≥30%","Solar SPF 50 reef-safe","Aftersun","Loperamida","Sales rehidratación","Paracetamol + ibuprofeno","Tiritas + apósitos","Antihistamínico","Pinzas + tijeras","Vacunas: hepatitis A, tifoidea"],
    "Dinero y tech": ["MYR cash ~200 €","SGD cash ~100 €","App Grab","Google Maps offline","XE Converter","WhatsApp 2FA","Backup fotos en nube"]
  };
  function renderChecklist() {
    const wrap = $('#checklist-wrap');
    const saved = JSON.parse(localStorage.getItem('checklist') || '{}');
    wrap.innerHTML = '';
    Object.entries(DEF_CHECK).forEach(([cat, items]) => {
      const h = document.createElement('h4');
      h.style.cssText = 'font-family:var(--font-display);color:var(--gold);font-size:.85rem;letter-spacing:.12em;text-transform:uppercase;margin:18px 0 10px';
      h.textContent = cat; wrap.appendChild(h);
      const list = document.createElement('div'); list.className = 'checklist';
      items.forEach((item, i) => {
        const id = `chk-${cat}-${i}`.replace(/\s/g,'_');
        const done = !!saved[id];
        const row = document.createElement('label');
        row.className = 'check-item' + (done ? ' done' : '');
        row.innerHTML = `<input type="checkbox" data-id="${id}" ${done?'checked':''}><label>${escapeHtml(item)}</label>`;
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

  // ---------- SEARCH ----------
  let IDX = null;
  function buildIdx() {
    return DATA.dias.map(d => ({
      n: d.n, titulo: d.titulo, fecha: d.fecha, ciudad: d.ciudad,
      blob: [d.titulo, d.ciudad, d.resumen, ...(d.eventos||[]).map(e=>e.hora+' '+e.texto+' '+(e.pnr||'')), ...(d.consejos||[])].filter(Boolean).join(' ').toLowerCase(),
      original: [d.titulo, d.ciudad, d.resumen, ...(d.eventos||[]).map(e=>e.texto), ...(d.consejos||[])].filter(Boolean).join(' · ')
    }));
  }
  function renderSearch(q) {
    if (!IDX) IDX = buildIdx();
    const wrap = $('#search-results');
    if (!q.trim()) { wrap.innerHTML = '<p style="color:var(--mist)">Busca entre los 32 días, eventos, PNRs y consejos.</p>'; return; }
    const t = q.toLowerCase();
    const hits = IDX.filter(e => e.blob.includes(t)).slice(0, 30);
    if (!hits.length) { wrap.innerHTML = `<p style="color:var(--mist)">Sin resultados para "<strong>${escapeHtml(q)}</strong>".</p>`; return; }
    wrap.innerHTML = hits.map(h => {
      const idx = h.blob.indexOf(t);
      const excerpt = h.original.substring(Math.max(0,idx-30), idx+120);
      const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
      return `<article class="search-hit" data-day="${h.n}" data-testid="search-hit-${h.n}">
        <div class="sh-day">Día ${h.n} · ${fmtDate(h.fecha)} · ${escapeHtml(h.ciudad)}</div>
        <div class="sh-title">${escapeHtml(h.titulo)}</div>
        <div class="sh-excerpt">…${escapeHtml(excerpt).replace(re,'<mark>$1</mark>')}…</div>
      </article>`;
    }).join('');
    $$('#search-results .search-hit').forEach(el => el.addEventListener('click', () => {
      const n = parseInt(el.dataset.day,10);
      $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.view==='itinerario'?'true':'false'));
      $$('.view').forEach(v => v.classList.toggle('active', v.id==='view-itinerario'));
      openDay(n);
    }));
  }

  // ---------- PHRASES ----------
  const PH = {
    "Saludos y cortesía": [["Hola / Buenos días","Selamat pagi","Hello / Good morning"],["Gracias","Terima kasih","Thank you"],["De nada","Sama-sama","You're welcome"],["Por favor","Tolong","Please"],["Perdón","Maaf","Excuse me / Sorry"],["Sí / No","Ya / Tidak","Yes / No"]],
    "Hotel": [["Tengo una reserva a nombre de…","Saya ada tempahan atas nama…","I have a reservation under…"],["¿A qué hora es el desayuno?","Pukul berapa sarapan?","What time is breakfast?"],["¿Hay wifi gratis?","Ada wifi percuma?","Is there free wifi?"],["Necesito toalla limpia","Saya perlukan tuala bersih","I need a clean towel"]],
    "Taxi / Grab": [["¿Cuánto cuesta hasta…?","Berapa harganya ke…?","How much to…?"],["Lléveme a esta dirección","Tolong bawa saya ke alamat ini","Please take me to this address"],["Pare aquí, por favor","Tolong berhenti di sini","Stop here, please"]],
    "Restaurante": [["¿Tienen menú en inglés?","Ada menu dalam bahasa Inggeris?","Do you have an English menu?"],["Sin picante, por favor","Tidak pedas, tolong","Not spicy, please"],["La cuenta, por favor","Bil, tolong","The bill, please"],["Vegetariano / sin carne","Vegetarian / tanpa daging","Vegetarian / no meat"]],
    "Compras y regateo": [["¿Cuánto cuesta?","Berapa harganya?","How much?"],["Demasiado caro","Terlalu mahal","Too expensive"],["¿Me hace descuento?","Boleh kurang harga?","Can you give a discount?"],["Es para regalo","Untuk hadiah","It's for a gift"]],
    "Snorkel / playa": [["¿Hay corrientes hoy?","Ada arus hari ini?","Are there currents today?"],["¿Cuándo es la bajamar?","Bila air surut?","When is low tide?"],["¿Puedo alquilar máscara?","Boleh sewa mask?","Can I rent a mask?"]],
    "Urgencias": [["Ayuda!","Tolong!","Help!"],["Llamen a un médico","Panggil doktor","Call a doctor"],["Estoy enfermo / herido","Saya sakit / cedera","I'm sick / injured"],["Hospital / Farmacia","Hospital / Farmasi","Hospital / Pharmacy"],["Llamen a la policía","Panggil polis","Call the police"]],
    "Números y dinero": [["Uno, dos, tres","Satu, dua, tiga","One, two, three"],["¿Acepta tarjeta?","Boleh guna kad kredit?","Do you accept card?"]]
  };
  function renderPhrases() {
    $('#phrases-wrap').innerHTML = Object.entries(PH).map(([g, items]) => `
      <div class="phrase-group">
        <h4>${escapeHtml(g)}</h4>
        ${items.map(([es,ms,en], i) => `
          <div class="phrase">
            <div class="es">${escapeHtml(es)}</div>
            <div class="ms">› ${escapeHtml(ms)}</div>
            <div class="en">${escapeHtml(en)} <button class="speak-btn-inline" data-text="${escapeHtml(en)}" data-testid="phrase-speak-${escapeHtml(g)}-${i}">🔊</button></div>
          </div>
        `).join('')}
      </div>`).join('');
    $$('.speak-btn-inline').forEach(b => b.addEventListener('click', () => speak(b.dataset.text)));
  }

  // ---------- DASHBOARD ----------
  function renderDashboard() {
    const wrap = $('#dashboard-wrap');
    if (!wrap) return;
    const exp = loadExp();
    const notes = JSON.parse(localStorage.getItem('notes') || '{}');
    const notesCount = Object.values(notes).filter(v => v && v.trim()).length;
    const totalEur = exp.reduce((s,e)=>s+e.amtEur,0);
    const today = todayDay();
    const dayN = today ? today.n : 0;
    const totalDays = 32;
    const cities = [...new Set(DATA.dias.map(d => d.ciudad).filter(c => c !== 'vuelo'))];

    wrap.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-num">${totalDays}</div><div class="stat-lbl">días de viaje</div></div>
        <div class="stat-card"><div class="stat-num">${cities.length}</div><div class="stat-lbl">destinos</div></div>
        <div class="stat-card"><div class="stat-num">${Object.keys(DATA.documentos).length}</div><div class="stat-lbl">reservas / PDFs</div></div>
        <div class="stat-card"><div class="stat-num">${notesCount}</div><div class="stat-lbl">notas guardadas</div></div>
        <div class="stat-card"><div class="stat-num">${totalEur.toFixed(0)}€</div><div class="stat-lbl">gastado</div></div>
        <div class="stat-card"><div class="stat-num">${dayN}/${totalDays}</div><div class="stat-lbl">día actual</div></div>
      </div>

      <h3 style="font-family:var(--font-display);color:var(--forest);margin:24px 0 12px;font-weight:500">Mini-timeline visual</h3>
      <div class="mini-timeline">
        ${DATA.dias.map(d => {
          const isToday = today && today.n === d.n;
          const colorClass = d.ciudad.toLowerCase().replace(/[^a-z]/g,'');
          return `<div class="mt-day ${isToday?'today':''}" data-day="${d.n}" title="Día ${d.n}: ${escapeHtml(d.titulo)}" data-city="${escapeHtml(d.ciudad)}"></div>`;
        }).join('')}
      </div>
      <p style="color:var(--mist);font-size:.85rem;text-align:center;margin-top:8px">Cada cuadrado = 1 día. Los colores representan el destino.</p>

      ${notesCount > 0 ? `<h3 style="font-family:var(--font-display);color:var(--forest);margin:30px 0 12px;font-weight:500">Tus notas del viaje</h3>
      <div class="notes-export">
        ${DATA.dias.filter(d => notes[d.n]).map(d => `
          <div class="note-entry">
            <strong>Día ${d.n} · ${fmtDate(d.fecha)} · ${escapeHtml(d.ciudad)}</strong>
            <p>${escapeHtml(notes[d.n])}</p>
          </div>`).join('')}
        <button class="primary" id="export-notes-btn" data-testid="export-notes-btn">📥 Exportar todas las notas</button>
      </div>` : ''}
    `;

    $$('.mt-day').forEach(c => c.addEventListener('click', () => openDay(parseInt(c.dataset.day,10))));
    $('#export-notes-btn')?.addEventListener('click', exportNotes);
  }

  function exportNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '{}');
    let txt = `# Diario de viaje · Malasia & Singapur\n# Iria e Iñaqui · ${DATA.viaje.fecha_inicio} → ${DATA.viaje.fecha_fin}\n\n`;
    DATA.dias.forEach(d => {
      if (notes[d.n] && notes[d.n].trim()) {
        txt += `## Día ${d.n} · ${fmtDate(d.fecha)} · ${d.ciudad}\n### ${d.titulo}\n\n${notes[d.n]}\n\n---\n\n`;
      }
    });
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'diario_malasia_iria_inaqui.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast('Diario descargado');
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
    startClock();
    renderHero();
    renderDayList();
    renderChecklist();
    renderExpenses();
    renderPhrases();
    renderSearch('');

    $('#theme-toggle').addEventListener('click', toggleTheme);
    $('#sos-btn').addEventListener('click', openSOS);
    $('#sos-close').addEventListener('click', closeSOS);
    $('#conv-amt').addEventListener('input', convCurrency);
    $('#conv-from').addEventListener('change', convCurrency);
    $('#conv-to').addEventListener('change', convCurrency);
    convCurrency();
    $('#exp-add').addEventListener('click', addExpense);
    $('#search-input').addEventListener('input', e => renderSearch(e.target.value));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(err => console.warn('SW reg failed', err));
    }
  }

  document.addEventListener('DOMContentLoaded', loadData);
})();
