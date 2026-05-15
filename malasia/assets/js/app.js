/* Malasia & Singapur · app.js · v2.1 — Modo viaje en curso, etapas, pendientes, gastos rediseñados + 12 mejoras */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const escapeHtml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

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
      if (v === 'pendientes') renderPendientes();
      if (v === 'herramientas') { renderExpenses(); renderBudget(); }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }
  function goTab(v) {
    const t = $(`.tab[data-view="${v}"]`);
    if (t) t.click();
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
  const getStage = key => (DATA.etapas || []).find(e => e.key === key);

  // ---------- DUAL CLOCK ----------
  function startClock() {
    const tick = () => {
      const now = new Date();
      const mal = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      const esp = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
      const today = todayDay();
      const dayLabel = today ? `Día ${today.n}/32` : '';
      const fmt = d => String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
      const el = $('#dual-clock');
      if (el) el.innerHTML = `<span class="dc-zone">🇲🇾 <strong>${fmt(mal)}</strong></span><span class="dc-sep">·</span><span class="dc-zone">🇪🇸 ${fmt(esp)}</span>${dayLabel ? `<span class="dc-sep">·</span><span class="dc-day">${dayLabel}</span>` : ''}`;
    };
    tick();
    setInterval(tick, 30000);
  }

  // ---------- HERO TODAY (modo viaje en curso) ----------
  function classifyDay(d) {
    // Detect what kind of day this is, for the "today" hero
    const out = { tipos: [], vuelo: null, ferry: null, transfer: null, checkin: null, daytrip: null };
    (d.eventos || []).forEach(e => {
      if (e.tipo === 'vuelo' && !out.vuelo) { out.vuelo = e; out.tipos.push('vuelo'); }
      if (e.tipo === 'ferry' && !out.ferry) { out.ferry = e; out.tipos.push('ferry'); }
      if (e.tipo === 'transfer' && !out.transfer) { out.transfer = e; out.tipos.push('transfer'); }
      if (e.tipo === 'checkin' && !out.checkin) { out.checkin = e; out.tipos.push('checkin'); }
    });
    if (d.titulo && /daytrip|day\s*trip|→\s*\w/i.test(d.titulo)) { /* transit day */ }
    return out;
  }
  function nextMovement(d) {
    if (!d || !d.eventos) return null;
    const movers = d.eventos.filter(e => ['vuelo','ferry','transfer','checkin','checkout','transporte','llegada'].includes(e.tipo));
    return movers[0] || d.eventos[0] || null;
  }

  function renderHero() {
    const today = todayDay();
    const hero = $('#hero-today');
    if (!today) {
      const first = DATA.dias[0];
      const start = new Date(first.fecha + 'T00:00:00');
      const now = new Date(); now.setHours(0,0,0,0);
      const diff = Math.round((start - now) / 86400000);
      hero.innerHTML = diff > 0
        ? `<span class="pill">Cuenta atrás</span><h2>Quedan <em>${diff} días</em> para el viaje</h2><p class="next">Inicio: ${fmtDate(first.fecha)} · ${escapeHtml(first.titulo)}</p>
           <div class="hero-actions">
             <button class="hero-btn primary" data-action="open-day-1" data-testid="hero-open-day-1">Ver día 1 →</button>
             <button class="hero-btn ghost" data-action="open-pendientes" data-testid="hero-open-pendientes">Revisar pendientes</button>
           </div>`
        : `<span class="pill">Viaje finalizado</span><h2>Bienvenidos a <em>casa</em></h2><p class="next">Esperamos que haya sido inolvidable ✦</p>
           <div class="hero-actions"><button class="hero-btn primary" data-action="open-resumen" data-testid="hero-open-resumen">Ver resumen del viaje</button></div>`;
      hero.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => {
        const a = b.dataset.action;
        if (a === 'open-day-1') openDay(1);
        else if (a === 'open-pendientes') goTab('pendientes');
        else if (a === 'open-resumen') goTab('resumen');
      }));
      return;
    }

    const next = nextDay(today);
    const hotel = today.hotel ? DATA.lugares[today.hotel] : null;
    const mov = nextMovement(today);
    const docKey = today.doc_clave;
    const docPath = docKey ? DATA.documentos[docKey] : null;
    const etapa = getStage(today.etapa);

    hero.innerHTML = `
      <span class="pill">Hoy · Día ${today.n} de 32 · ${etapa ? escapeHtml(etapa.nombre) : ''}</span>
      <h2>${escapeHtml(today.titulo)}</h2>
      <div class="hero-meta">${fmtDate(today.fecha)} · ${escapeHtml(today.ciudad)}</div>

      <div class="hero-cards">
        ${mov ? `
        <div class="hero-card">
          <div class="hc-label">Siguiente movimiento</div>
          <div class="hc-value"><strong>${escapeHtml(mov.hora)}</strong> · ${escapeHtml(mov.tipo)}</div>
          <div class="hc-text">${escapeHtml(mov.texto)}</div>
        </div>` : ''}
        ${hotel ? `
        <div class="hero-card">
          <div class="hc-label">Hotel de hoy</div>
          <div class="hc-value">${escapeHtml(hotel.nombre)}</div>
          ${hotel.tel ? `<div class="hc-text">📞 ${escapeHtml(hotel.tel)}</div>` : ''}
        </div>` : ''}
      </div>

      ${next ? `<p class="next">Mañana — Día ${next.n}: ${escapeHtml(next.titulo)}</p>` : '<p class="next">Último día — feliz regreso ✦</p>'}

      <div class="hero-actions">
        <button class="hero-btn primary" data-action="open-day" data-testid="hero-open-today">Abrir jornada completa →</button>
        ${docPath ? `<a class="hero-btn ghost" href="${escapeHtml(docPath)}" target="_blank" rel="noopener" data-testid="hero-open-doc">📄 PDF clave del día</a>` : ''}
        ${hotel && hotel.lat ? `<a class="hero-btn ghost" href="https://www.google.com/maps/dir/?api=1&destination=${hotel.lat},${hotel.lng}" target="_blank" rel="noopener" data-testid="hero-open-map">📍 Ir al hotel</a>` : ''}
      </div>
    `;
    hero.querySelector('[data-action="open-day"]').addEventListener('click', () => openDay(today.n));
  }

  // ---------- DAY LIST WITH STAGES ----------
  function renderDayList() {
    const list = $('#day-list');
    const today = todayDay();
    const etapas = DATA.etapas || [];
    let html = '';
    etapas.forEach(et => {
      const dias = DATA.dias.filter(d => et.dias.includes(d.n));
      if (!dias.length) return;
      html += `
        <section class="stage" data-stage="${et.key}" data-testid="stage-${et.key}">
          <header class="stage-header">
            <h3>${escapeHtml(et.nombre)}</h3>
            <div class="stage-range">Día ${dias[0].n}${dias.length > 1 ? ` — ${dias[dias.length-1].n}` : ''} · ${dias.length} ${dias.length === 1 ? 'día' : 'días'}</div>
          </header>
          <div class="stage-intent">
            <div class="si-row"><span class="si-tag intencion">Intención</span><p>${escapeHtml(et.intencion)}</p></div>
            <div class="si-row"><span class="si-tag evitar">Evitar</span><p>${escapeHtml(et.evitar)}</p></div>
            <div class="si-row"><span class="si-tag prioridad">Prioridad real</span><p>${escapeHtml(et.prioridad)}</p></div>
          </div>
          <div class="stage-days">
            ${dias.map(d => renderDayCard(d, today)).join('')}
          </div>
        </section>`;
    });
    list.innerHTML = html;

    $$('.day-card', list).forEach(c => {
      const n = parseInt(c.dataset.day, 10);
      c.addEventListener('click', e => {
        if (e.target.closest('.dc-doc-btn')) return;
        openDay(n);
      });
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDay(n); } });
    });
  }

  function renderDayCard(d, today) {
    const isToday = today && today.n === d.n;
    const alertIcon = d.alerta ? (d.alerta.nivel === 'warning' ? '⚠️' : 'ℹ️') : '';
    const docPath = d.doc_clave ? DATA.documentos[d.doc_clave] : null;
    return `
      <article class="day-card ${isToday ? 'today' : ''}" data-testid="day-card-${d.n}" data-day="${d.n}" role="button" tabindex="0" aria-label="Día ${d.n}: ${escapeHtml(d.titulo)}">
        <div class="num"><span class="big">${d.n}</span><span class="lbl">Día</span></div>
        <div class="body">
          <h3>${escapeHtml(d.titulo)} ${alertIcon}</h3>
          <div class="meta">
            <span>${fmtDate(d.fecha)}</span>
            <span class="tag">${escapeHtml(d.ciudad)}</span>
            ${isToday ? '<span class="tag tag-today">HOY</span>' : ''}
          </div>
        </div>
        <div class="dc-actions">
          ${docPath ? `<a class="dc-doc-btn" href="${escapeHtml(docPath)}" target="_blank" rel="noopener" data-testid="dc-doc-${d.n}" title="Documento clave del día">📄</a>` : ''}
          <div class="chev">›</div>
        </div>
      </article>`;
  }

  // ---------- DAY DETAIL ----------
  function openDay(n) {
    const d = DATA.dias.find(x => x.n === n);
    if (!d) return;
    const detail = $('#day-detail');
    const hotel = d.hotel ? DATA.lugares[d.hotel] : null;
    const clima = DATA.clima_destinos[d.ciudad];
    const notes = JSON.parse(localStorage.getItem('notes') || '{}')[d.n] || '';
    const docKey = d.doc_clave;
    const docPath = docKey ? DATA.documentos[docKey] : null;
    const etapa = getStage(d.etapa);

    let next = nextDay(d);
    let tomorrowAlert = '';
    if (next && next.eventos) {
      const earlyTransit = next.eventos.find(e => ['vuelo','ferry','transfer','transporte'].includes(e.tipo) && e.hora && e.hora !== '—' && parseInt(e.hora) < 12);
      if (earlyTransit) tomorrowAlert = `<div class="alert alert-warning"><strong>⚠️ Mañana sales pronto:</strong> ${escapeHtml(earlyTransit.hora)} ${escapeHtml(earlyTransit.texto.substring(0, 80))}… Prepara maleta esta noche.</div>`;
    }

    detail.innerHTML = `
      <button class="day-back" data-testid="day-back-btn">← Volver al itinerario</button>
      <div class="day-hero" style="background-image:url('assets/headers/${d.header}')">
        <div class="hero-info">
          <span class="num-pill">DÍA ${d.n} DE 32${etapa ? ` · ${escapeHtml(etapa.nombre)}` : ''}</span>
          <h2>${escapeHtml(d.titulo)}</h2>
          <div class="date">${fmtDate(d.fecha)}</div>
        </div>
      </div>

      ${docPath ? `<div class="day-section">
        <a class="doc-clave-btn" href="${escapeHtml(docPath)}" target="_blank" rel="noopener" data-testid="day-doc-clave">
          <span>📄</span>
          <div><strong>Documento clave del día</strong><br><small>Abrir PDF en una pestaña nueva</small></div>
          <span class="arrow">→</span>
        </a>
      </div>` : ''}

      ${d.alerta ? `<div class="alert alert-${d.alerta.nivel}"><strong>${d.alerta.nivel==='warning'?'⚠️ Atención:':'ℹ️ Aviso:'}</strong> ${escapeHtml(d.alerta.texto)}</div>` : ''}
      ${tomorrowAlert}

      ${d.resumen ? `<div class="day-section"><p class="day-summary">${escapeHtml(d.resumen)}</p></div>` : ''}

      ${clima ? `<div class="day-section">
        <h4>Clima esperado</h4>
        <div class="climate-card">
          <div><strong>${escapeHtml(clima.temp)}</strong> · ${escapeHtml(clima.lluvia)}</div>
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
          ${d.eventos.map(e => renderEvent(e)).join('')}
        </div>
        <div class="events-legend">
          <span class="badge-estado confirmado">Confirmado</span>
          <span class="badge-estado pendiente">Pendiente</span>
          <span class="badge-estado recomendado">Recomendado</span>
          <span class="badge-estado opcional">Opcional</span>
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

  function renderEvent(e) {
    const estado = e.estado || 'confirmado';
    return `
      <div class="event estado-${estado}" data-estado="${estado}">
        <div class="ev-head">
          <span class="hour">${escapeHtml(e.hora)}</span>
          <span class="type-tag ${e.tipo}">${escapeHtml(e.tipo)}</span>
          <span class="badge-estado ${estado}">${estadoLabel(estado)}</span>
        </div>
        <div class="text">${escapeHtml(e.texto)}</div>
        ${e.pnr ? `<div class="pnr-box"><span class="pnr-label">Código de reserva</span><span class="pnr-value">${escapeHtml(e.pnr)}</span><button class="pnr-copy" data-pnr="${escapeHtml(e.pnr)}" data-testid="copy-pnr-${escapeHtml(e.pnr)}">Copiar</button></div>` : ''}
        ${e.doc && DATA.documentos[e.doc] ? `<a class="doc-link" href="${escapeHtml(DATA.documentos[e.doc])}" target="_blank" rel="noopener" data-testid="doc-link-${e.doc}">📄 Ver documento (PDF)</a>` : ''}
      </div>`;
  }
  function estadoLabel(e) {
    return ({
      confirmado: 'Confirmado',
      pendiente: 'Pendiente de contratar',
      recomendado: 'Recomendado',
      opcional: 'Opcional',
      plan_b: 'Plan B lluvia'
    })[e] || 'Confirmado';
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
    navigator.clipboard?.writeText(pnr).then(() => toast(`Código ${pnr} copiado`)).catch(() => toast(`Código: ${pnr}`));
  }

  // ---------- PENDIENTES ----------
  function loadPendDone() { return JSON.parse(localStorage.getItem('pend_done') || '{}'); }
  function savePendDone(d) { localStorage.setItem('pend_done', JSON.stringify(d)); }

  function renderPendientes() {
    const wrap = $('#pendientes-wrap');
    if (!wrap) return;
    const p = DATA.pendientes || { criticos: [], menores: [] };
    const done = loadPendDone();
    const renderItem = (it, level) => {
      const isDone = !!done[it.id];
      return `
        <label class="pend-item ${isDone ? 'done' : ''} level-${level}" data-testid="pend-${it.id}">
          <input type="checkbox" data-id="${it.id}" ${isDone ? 'checked' : ''}>
          <span class="pend-text">${escapeHtml(it.texto)}</span>
        </label>`;
    };
    const totalCrit = p.criticos.length;
    const doneCrit = p.criticos.filter(i => done[i.id]).length;
    const totalMen = p.menores.length;
    const doneMen = p.menores.filter(i => done[i.id]).length;

    wrap.innerHTML = `
      <header class="pend-header">
        <h2>Pendientes</h2>
        <p>Tareas críticas y menores fuera del itinerario. Lo que se marca aquí queda guardado en este dispositivo.</p>
      </header>

      <section class="pend-section pend-criticos" data-testid="pend-section-criticos">
        <header class="pend-section-head">
          <h3>🔴 Pendientes críticos</h3>
          <div class="pend-counter" data-testid="pend-counter-criticos">${doneCrit}/${totalCrit}</div>
        </header>
        <div class="pend-list">${p.criticos.map(i => renderItem(i, 'crit')).join('')}</div>
      </section>

      <section class="pend-section pend-menores" data-testid="pend-section-menores">
        <header class="pend-section-head">
          <h3>🟡 Pendientes menores</h3>
          <div class="pend-counter" data-testid="pend-counter-menores">${doneMen}/${totalMen}</div>
        </header>
        <div class="pend-list">${p.menores.map(i => renderItem(i, 'men')).join('')}</div>
      </section>

      <div class="pend-actions">
        <button class="ghost" id="pend-reset" data-testid="pend-reset-btn">Restablecer todos</button>
      </div>
    `;

    $$('input[type="checkbox"]', wrap).forEach(inp => inp.addEventListener('change', e => {
      const d = loadPendDone();
      d[e.target.dataset.id] = e.target.checked;
      savePendDone(d);
      e.target.closest('.pend-item').classList.toggle('done', e.target.checked);
      renderPendientes(); // refresh counters
    }));
    $('#pend-reset', wrap)?.addEventListener('click', () => {
      if (confirm('¿Restablecer todos los pendientes?')) { localStorage.removeItem('pend_done'); renderPendientes(); toast('Pendientes restablecidos'); }
    });
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
    return `<div class="personal-form">${fields.map(([k, l]) => `<div class="pf-row"><label>${escapeHtml(l)}</label><input class="personal-field" data-key="${k}" value="${escapeHtml(p[k]||'')}" type="text"></div>`).join('')}</div>`;
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

  // ---------- EXPENSES + BUDGET (rebuilt) ----------
  const loadExp = () => JSON.parse(localStorage.getItem('expenses_v2') || '[]');
  const saveExp = a => localStorage.setItem('expenses_v2', JSON.stringify(a));
  const loadPrev = () => {
    const saved = localStorage.getItem('presupuesto_previsto');
    if (saved) try { return JSON.parse(saved); } catch (e) {}
    return JSON.parse(JSON.stringify(DATA.presupuesto_previsto));
  };
  const savePrev = p => localStorage.setItem('presupuesto_previsto', JSON.stringify(p));

  function diaDeViaje(fechaIso) {
    const start = new Date(DATA.viaje.fecha_inicio + 'T00:00:00');
    const d = new Date(fechaIso + 'T00:00:00');
    const n = Math.floor((d - start) / 86400000) + 1;
    return (n >= 1 && n <= 32) ? n : null;
  }
  function todayIso() { return new Date().toISOString().slice(0,10); }

  function addExpense() {
    const fecha = $('#exp-fecha').value || todayIso();
    const concepto = $('#exp-concepto').value.trim();
    const amt = parseFloat($('#exp-amt').value);
    const cur = $('#exp-cur').value;
    const cat = $('#exp-cat').value;
    const pagador = $('#exp-pagador').value;
    if (!concepto || !amt || isNaN(amt)) { toast('Indica concepto e importe'); return; }
    const dia = diaDeViaje(fecha);
    const arr = loadExp();
    arr.push({
      id: Date.now() + '-' + Math.random().toString(36).slice(2,8),
      fecha, dia, concepto, amt, cur, cat, pagador,
      amtEur: amt / RATES[cur]
    });
    saveExp(arr);
    $('#exp-concepto').value = '';
    $('#exp-amt').value = '';
    renderExpenses();
    toast('Gasto añadido');
  }

  function delExpense(id) {
    const a = loadExp().filter(x => x.id !== id);
    saveExp(a);
    renderExpenses();
  }

  function renderExpenses() {
    const list = $('#exp-list');
    if (!list) return;
    const exp = loadExp();
    if (!exp.length) {
      list.innerHTML = '<p class="exp-empty">Aún no hay gastos registrados.</p>';
    } else {
      list.innerHTML = exp.slice().reverse().map(e => `
        <div class="exp-row" data-testid="exp-row-${e.id}">
          <div class="exp-main">
            <div class="exp-concepto">${escapeHtml(e.concepto)}</div>
            <div class="exp-meta">
              <span class="exp-tag cat-${slugify(e.cat)}">${escapeHtml(e.cat)}</span>
              <span>${fmtDateShort(e.fecha)}${e.dia ? ` · Día ${e.dia}` : ''}</span>
              <span>${escapeHtml(e.pagador)}</span>
            </div>
          </div>
          <div class="exp-amts">
            <div class="exp-amt-cur">${e.amt.toFixed(2)} ${escapeHtml(e.cur)}</div>
            <div class="exp-amt-eur">${e.amtEur.toFixed(2)} €</div>
          </div>
          <button class="exp-del" data-id="${e.id}" data-testid="exp-del-${e.id}" aria-label="Eliminar">×</button>
        </div>`).join('');
      $$('.exp-del', list).forEach(b => b.addEventListener('click', () => delExpense(b.dataset.id)));
    }
    renderBudget();
  }

  function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

  function renderBudget() {
    const wrap = $('#budget-wrap');
    if (!wrap) return;
    const prev = loadPrev();
    const exp = loadExp();
    const totalReg = exp.reduce((s,e)=> s + e.amtEur, 0);
    const totalPrev = prev.total_eur || 0;
    const totalReal = totalPrev + totalReg;
    const pct = totalPrev > 0 ? Math.min(100, (totalReg / totalPrev) * 100) : 0;
    const overBudget = totalReg > totalPrev;

    // by category breakdown
    const cats = DATA.categorias_gasto || [];
    const byCatReg = {};
    cats.forEach(c => byCatReg[c] = 0);
    exp.forEach(e => byCatReg[e.cat] = (byCatReg[e.cat] || 0) + e.amtEur);
    const byCatPrev = prev.por_categoria || {};

    // by payer
    const byPag = { Iria: 0, 'Iñaqui': 0, 'Común': 0 };
    exp.forEach(e => { byPag[e.pagador] = (byPag[e.pagador] || 0) + e.amtEur; });

    wrap.innerHTML = `
      <div class="budget-totals">
        <div class="bt-card bt-previsto">
          <div class="bt-lbl">Presupuesto previsto</div>
          <div class="bt-val" data-testid="bt-previsto">${totalPrev.toFixed(0)} €</div>
          <button class="bt-edit" id="bt-edit-btn" data-testid="bt-edit-btn">Editar</button>
        </div>
        <div class="bt-card bt-registrado">
          <div class="bt-lbl">Gastos registrados</div>
          <div class="bt-val" data-testid="bt-registrado">${totalReg.toFixed(0)} €</div>
          <div class="bt-sub">${exp.length} apunte${exp.length === 1 ? '' : 's'}</div>
        </div>
        <div class="bt-card bt-real ${overBudget ? 'over' : ''}">
          <div class="bt-lbl">Total real actualizado</div>
          <div class="bt-val" data-testid="bt-real">${totalReal.toFixed(0)} €</div>
          <div class="bt-sub">${overBudget ? `⚠️ ${(totalReg - totalPrev).toFixed(0)} € por encima` : `${(totalPrev - totalReg).toFixed(0)} € de margen`}</div>
        </div>
      </div>

      <div class="budget-bar-row">
        <div class="budget-progress"><div class="budget-fill ${overBudget?'over':''}" style="width:${pct}%"></div></div>
        <div class="budget-stats">
          <small>${pct.toFixed(0)}% del presupuesto previsto consumido por gastos registrados</small>
        </div>
      </div>

      <details class="budget-details">
        <summary>Desglose por categoría</summary>
        <div class="bcats">
          ${cats.map(c => {
            const reg = byCatReg[c] || 0;
            const pre = byCatPrev[c] || 0;
            return `<div class="bcat">
              <div class="bcat-name">${escapeHtml(c)}</div>
              <div class="bcat-vals"><span class="bcat-prev">${pre.toFixed(0)} € prev.</span><span class="bcat-reg">+ ${reg.toFixed(0)} € reg.</span></div>
            </div>`;
          }).join('')}
        </div>
      </details>

      <details class="budget-details">
        <summary>Quién ha pagado qué</summary>
        <div class="bcats">
          ${Object.entries(byPag).map(([p, v]) => `<div class="bcat"><div class="bcat-name">${escapeHtml(p)}</div><div class="bcat-vals"><span class="bcat-reg">${v.toFixed(0)} €</span></div></div>`).join('')}
        </div>
      </details>

      <div class="exp-tools">
        <button class="ghost" id="exp-export-csv" data-testid="exp-export-csv">Exportar CSV</button>
        <button class="ghost" id="exp-export-json" data-testid="exp-export-json">Exportar JSON</button>
        <label class="ghost-label" data-testid="exp-import-json">
          Importar JSON
          <input type="file" id="exp-import-input" accept=".json,application/json" style="display:none">
        </label>
        <button class="danger" id="exp-clear-all" data-testid="exp-clear-all">Borrar todo</button>
      </div>
    `;

    $('#bt-edit-btn', wrap)?.addEventListener('click', openBudgetEditor);
    $('#exp-export-csv', wrap)?.addEventListener('click', exportCSV);
    $('#exp-export-json', wrap)?.addEventListener('click', exportJSON);
    $('#exp-import-input', wrap)?.addEventListener('change', importJSON);
    $('#exp-clear-all', wrap)?.addEventListener('click', clearAllExpenses);
  }

  function openBudgetEditor() {
    const prev = loadPrev();
    const cats = DATA.categorias_gasto || [];
    const modal = document.createElement('div');
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="modal-inner">
        <button class="modal-close" id="be-close">×</button>
        <h3>Editar presupuesto previsto</h3>
        <p class="notes-hint">${escapeHtml(DATA.presupuesto_previsto.nota || '')}</p>
        <div class="be-form">
          <div class="pf-row"><label>Total previsto (€)</label><input type="number" id="be-total" value="${prev.total_eur}" step="50"></div>
          <h4 style="margin-top:14px;font-family:var(--font-display);color:var(--gold)">Por categoría</h4>
          ${cats.map(c => `<div class="pf-row"><label>${escapeHtml(c)}</label><input type="number" class="be-cat" data-cat="${escapeHtml(c)}" value="${(prev.por_categoria && prev.por_categoria[c]) || 0}" step="10"></div>`).join('')}
        </div>
        <div class="be-actions">
          <button class="primary" id="be-save" data-testid="be-save-btn">Guardar</button>
          <button class="ghost" id="be-reset">Restablecer al original</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    $('#be-close', modal).addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    $('#be-save', modal).addEventListener('click', () => {
      const total = parseFloat($('#be-total', modal).value) || 0;
      const por_categoria = {};
      $$('.be-cat', modal).forEach(i => por_categoria[i.dataset.cat] = parseFloat(i.value) || 0);
      savePrev({ total_eur: total, por_categoria, nota: DATA.presupuesto_previsto.nota });
      renderBudget();
      toast('Presupuesto guardado');
      close();
    });
    $('#be-reset', modal).addEventListener('click', () => {
      localStorage.removeItem('presupuesto_previsto');
      renderBudget();
      toast('Presupuesto restablecido');
      close();
    });
  }

  function exportCSV() {
    const exp = loadExp();
    if (!exp.length) return toast('No hay gastos para exportar');
    const headers = ['fecha','dia','concepto','categoria','importe','moneda','importe_eur','pagador'];
    const rows = exp.map(e => [e.fecha, e.dia||'', e.concepto, e.cat, e.amt.toFixed(2), e.cur, e.amtEur.toFixed(2), e.pagador]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'gastos_malasia.csv');
  }
  function exportJSON() {
    const data = { gastos: loadExp(), presupuesto: loadPrev(), exported_at: new Date().toISOString() };
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'gastos_malasia.json');
  }
  function importJSON(ev) {
    const f = ev.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result);
        if (Array.isArray(obj.gastos)) {
          if (confirm('¿Reemplazar gastos actuales por los del archivo?')) {
            saveExp(obj.gastos);
            if (obj.presupuesto) savePrev(obj.presupuesto);
            renderExpenses();
            toast('Importado correctamente');
          }
        } else toast('Archivo sin gastos válidos');
      } catch (e) { toast('Archivo no válido'); }
    };
    r.readAsText(f);
    ev.target.value = '';
  }
  function clearAllExpenses() {
    if (!loadExp().length) return toast('No hay gastos que borrar');
    if (confirm('¿Borrar TODOS los gastos? Esta acción no se puede deshacer.')) {
      saveExp([]); renderExpenses(); toast('Gastos borrados');
    }
  }
  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast(name + ' descargado');
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
    if (!wrap) return;
    const saved = JSON.parse(localStorage.getItem('checklist') || '{}');
    wrap.innerHTML = '';
    Object.entries(DEF_CHECK).forEach(([cat, items]) => {
      const h = document.createElement('h4');
      h.className = 'checklist-cat';
      h.textContent = cat; wrap.appendChild(h);
      const list = document.createElement('div'); list.className = 'checklist';
      items.forEach((item, i) => {
        const id = `chk-${cat}-${i}`.replace(/\s/g,'_');
        const done = !!saved[id];
        const row = document.createElement('label');
        row.className = 'check-item' + (done ? ' done' : '');
        row.innerHTML = `<input type="checkbox" data-id="${id}" ${done?'checked':''}><span>${escapeHtml(item)}</span>`;
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
    if (!wrap) return;
    if (!q.trim()) { wrap.innerHTML = '<p class="search-empty">Busca entre los 32 días, eventos, PNRs y consejos.</p>'; return; }
    const t = q.toLowerCase();
    const hits = IDX.filter(e => e.blob.includes(t)).slice(0, 30);
    if (!hits.length) { wrap.innerHTML = `<p class="search-empty">Sin resultados para "<strong>${escapeHtml(q)}</strong>".</p>`; return; }
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
      goTab('itinerario');
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
    "Urgencias": [["¡Ayuda!","Tolong!","Help!"],["Llamen a un médico","Panggil doktor","Call a doctor"],["Estoy enfermo / herido","Saya sakit / cedera","I'm sick / injured"],["Hospital / Farmacia","Hospital / Farmasi","Hospital / Pharmacy"],["Llamen a la policía","Panggil polis","Call the police"]],
    "Números y dinero": [["Uno, dos, tres","Satu, dua, tiga","One, two, three"],["¿Acepta tarjeta?","Boleh guna kad kredit?","Do you accept card?"]]
  };
  function renderPhrases() {
    const wrap = $('#phrases-wrap');
    if (!wrap) return;
    wrap.innerHTML = Object.entries(PH).map(([g, items]) => `
      <div class="phrase-group">
        <h4>${escapeHtml(g)}</h4>
        ${items.map(([es,ms,en], i) => `
          <div class="phrase">
            <div class="es">${escapeHtml(es)}</div>
            <div class="ms">› ${escapeHtml(ms)}</div>
            <div class="en">${escapeHtml(en)} <button class="speak-btn-inline" data-text="${escapeHtml(en)}" data-testid="phrase-speak-${slugify(g)}-${i}">🔊</button></div>
          </div>
        `).join('')}
      </div>`).join('');
    $$('.speak-btn-inline', wrap).forEach(b => b.addEventListener('click', () => speak(b.dataset.text)));
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
    const pendDone = loadPendDone();
    const pendTotal = (DATA.pendientes.criticos.length + DATA.pendientes.menores.length);
    const pendDoneN = Object.values(pendDone).filter(Boolean).length;

    wrap.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-num">${totalDays}</div><div class="stat-lbl">días de viaje</div></div>
        <div class="stat-card"><div class="stat-num">${cities.length}</div><div class="stat-lbl">destinos</div></div>
        <div class="stat-card"><div class="stat-num">${Object.keys(DATA.documentos).length}</div><div class="stat-lbl">PDFs guardados</div></div>
        <div class="stat-card"><div class="stat-num">${notesCount}</div><div class="stat-lbl">notas guardadas</div></div>
        <div class="stat-card"><div class="stat-num">${totalEur.toFixed(0)}€</div><div class="stat-lbl">gastado</div></div>
        <div class="stat-card"><div class="stat-num">${dayN}/${totalDays}</div><div class="stat-lbl">día actual</div></div>
        <div class="stat-card"><div class="stat-num">${pendDoneN}/${pendTotal}</div><div class="stat-lbl">pendientes hechos</div></div>
      </div>

      <h3 class="dash-h">Mini-timeline visual</h3>
      <div class="mini-timeline">
        ${DATA.dias.map(d => {
          const isToday = today && today.n === d.n;
          const stage = d.etapa || 'none';
          return `<div class="mt-day stage-${stage} ${isToday?'today':''}" data-day="${d.n}" title="Día ${d.n}: ${escapeHtml(d.titulo)}" data-testid="mt-day-${d.n}"></div>`;
        }).join('')}
      </div>
      <div class="mt-legend">
        ${(DATA.etapas||[]).map(et => `<span class="mt-leg"><i class="mt-sw stage-${et.key}"></i>${escapeHtml(et.nombre)}</span>`).join('')}
      </div>

      ${notesCount > 0 ? `<h3 class="dash-h">Tus notas del viaje</h3>
      <div class="notes-export">
        ${DATA.dias.filter(d => notes[d.n]).map(d => `
          <div class="note-entry">
            <strong>Día ${d.n} · ${fmtDate(d.fecha)} · ${escapeHtml(d.ciudad)}</strong>
            <p>${escapeHtml(notes[d.n])}</p>
          </div>`).join('')}
        <button class="primary" id="export-notes-btn" data-testid="export-notes-btn">📥 Exportar diario (.txt)</button>
      </div>` : '<p class="dash-empty">Aún no tienes notas guardadas. Abre cualquier día y escribe en "Mis notas del día".</p>'}
    `;

    $$('.mt-day', wrap).forEach(c => c.addEventListener('click', () => { goTab('itinerario'); openDay(parseInt(c.dataset.day,10)); }));
    $('#export-notes-btn', wrap)?.addEventListener('click', exportNotes);
  }

  function exportNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '{}');
    let txt = `# Diario de viaje · Malasia & Singapur\n# Iria e Iñaqui · ${DATA.viaje.fecha_inicio} → ${DATA.viaje.fecha_fin}\n\n`;
    DATA.dias.forEach(d => {
      if (notes[d.n] && notes[d.n].trim()) {
        txt += `## Día ${d.n} · ${fmtDate(d.fecha)} · ${d.ciudad}\n### ${d.titulo}\n\n${notes[d.n]}\n\n---\n\n`;
      }
    });
    downloadBlob(new Blob([txt], { type: 'text/plain;charset=utf-8' }), 'diario_malasia_iria_inaqui.txt');
  }

  // ---------- TOAST ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
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

    // Set default expense date
    const fechaInput = $('#exp-fecha');
    if (fechaInput) fechaInput.value = todayIso();
    // Populate category and payer selects
    const catSel = $('#exp-cat');
    if (catSel && !catSel.children.length) {
      (DATA.categorias_gasto || []).forEach(c => {
        const o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o);
      });
    }
    const pagSel = $('#exp-pagador');
    if (pagSel && !pagSel.children.length) {
      (DATA.pagadores || ['Iria','Iñaqui','Común']).forEach(p => {
        const o = document.createElement('option'); o.value = p; o.textContent = p; pagSel.appendChild(o);
      });
    }

    $('#theme-toggle')?.addEventListener('click', toggleTheme);
    $('#sos-btn')?.addEventListener('click', openSOS);
    $('#sos-close')?.addEventListener('click', closeSOS);
    $('#conv-amt')?.addEventListener('input', convCurrency);
    $('#conv-from')?.addEventListener('change', convCurrency);
    $('#conv-to')?.addEventListener('change', convCurrency);
    convCurrency();
    $('#exp-add')?.addEventListener('click', addExpense);
    $('#search-input')?.addEventListener('input', e => renderSearch(e.target.value));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(err => console.warn('SW reg failed', err));
    }
  }

  document.addEventListener('DOMContentLoaded', loadData);
})();
