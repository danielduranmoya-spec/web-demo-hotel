/* Casa Lucerna · interacción de la web (sin dependencias)
   Cambia aquí teléfono, habitaciones, precios y capítulos del vídeo. */
(() => {
  'use strict';

  const CONFIG = {
    whatsapp: '34600000000',            // sin + ni espacios
    termasPrecio: 0,                    // la primera sesión está incluida
    descuentoDirecto: 0.08,
  };

  // Habitaciones: precio por noche con desayuno para 2 personas
  const HABITACIONES = [
    {
      id: 'cubiculum', nombre: 'Cubiculum', kicker: 'Doble clásica · 6 habitaciones', precio: 145,
      desc: 'Íntima y silenciosa, con vigas de madera originales y ventana al patio de los naranjos. La favorita de quien viene a dormir bien y salir a caminar.',
      datos: ['18 m²', 'Cama 180', 'Vista al patio', 'Hasta 2 personas'],
      paleta: ['#EBD9C4', '#D98E73', '#7C4A3A', '#141B33'], ventana: 'patio',
    },
    {
      id: 'atrium', nombre: 'Atrium', kicker: 'Superior · 5 habitaciones', precio: 190,
      desc: 'Techos de cuatro metros y suelo hidráulico de 1890. Tiene una zona de lectura junto al balcón y bañera exenta.',
      datos: ['26 m²', 'Cama 200', 'Bañera exenta', 'Balcón'],
      paleta: ['#E6E0D2', '#8C9A7A', '#4A5A44', '#141B33'], ventana: 'calle',
    },
    {
      id: 'peristilo', nombre: 'Peristilo', kicker: 'Junior suite · 3 habitaciones', precio: 260,
      desc: 'En la última planta, con terraza privada entre tejados y una pequeña bañera de inmersión al aire libre para las noches de verano.',
      datos: ['34 m²', 'Terraza 12 m²', 'Bañera exterior', 'Hasta 3 personas'],
      paleta: ['#F1E2CF', '#E9B44C', '#8A5A2B', '#1E2747'], ventana: 'tejados',
    },
    {
      id: 'proscaenium', nombre: 'Proscaenium', kicker: 'Suite con vista al Teatro · 2 habitaciones', precio: 380,
      desc: 'La joya de la casa. Un ventanal de cinco metros que encuadra las columnas iluminadas del Teatro Romano. Incluye cena en la terraza y termas sin límite.',
      datos: ['48 m²', 'Vista al Teatro', 'Termas ilimitadas', 'Cena incluida'],
      paleta: ['#EDE3D3', '#B8643F', '#5E2E22', '#141B33'], ventana: 'teatro',
    },
  ];

  // Capítulos y puntos interactivos del vídeo (segundos; x/y en % del fotograma)
  const CAPITULOS = [
    { t: 0, titulo: 'Llegada', sub: 'El patio' },
    { t: 10, titulo: 'Habitación', sub: 'Proscaenium' },
    { t: 20, titulo: 'Termas', sub: 'Balnea' },
    { t: 30, titulo: 'Terraza', sub: 'Noche en Mérida' },
  ];
  const HOTSPOTS = [
    { from: 2.5, to: 9, x: 50, y: 60, titulo: 'La fuente del patio', texto: 'Mármol de Estremoz y un naranjo de 1920. Aquí se sirve el desayuno de abril a octubre.' },
    { from: 12, to: 19, x: 70, y: 38, titulo: 'El ventanal', texto: 'Cinco metros de vidrio con vistas a las columnas del Teatro, iluminadas hasta la medianoche.' },
    { from: 22, to: 29, x: 36, y: 68, titulo: 'Baño a 40 grados', texto: 'Agua mineral calentada con solar térmica. Sesiones privadas de 60 minutos, también a medianoche.' },
    { from: 32, to: 39, x: 62, y: 30, titulo: 'Las estrellas de la Vía Láctea', texto: 'Apagamos las luces de la terraza a las 23:30 para ver el cielo. Te prestamos un pequeño telescopio.' },
  ];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const eur = n => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  /* ---------- Navegación ---------- */
  const nav = $('[data-nav]');
  const toggle = $('[data-menu-toggle]');
  const menu = $('#menu');
  const onScrollNav = () => nav.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    document.body.style.overflow = '';
  }));

  /* ---------- Textos del viaje (inicio) ---------- */
  const voyage = $('[data-voyage]');
  const steps = $$('[data-step]');
  const bars = $$('.voyage__progress li');
  const LIMITES = [0, 0.2, 0.45, 0.72, 1];
  function onVoyage() {
    const r = voyage.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / ((r.height - innerHeight) || 1)));
    let idx = 0;
    for (let i = 0; i < 4; i++) if (p >= LIMITES[i]) idx = i;
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    bars.forEach((b, i) => {
      const f = (p - LIMITES[i]) / (LIMITES[i + 1] - LIMITES[i]);
      b.style.setProperty('--p', Math.min(1, Math.max(0, f)).toFixed(3));
    });
    // contador de años: del 25 a. C. a hoy
    const k = Math.min(1, p / 0.8);
    const yr = Math.round(-25 + (HOY + 25) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2));
    yearEl.textContent = yr < 0 ? `${-yr} a. C.` : yr === 0 ? '1 d. C.' : String(yr);
    eraEl.textContent = (ERAS.find(e => yr < e[0]) || ERAS[ERAS.length - 1])[1];
    epochEl.classList.toggle('is-done', p > 0.85);
  }
  const HOY = new Date().getFullYear();
  const ERAS = [[0, 'Fundación de Augusta Emerita'], [409, 'Capital de Lusitania'], [713, 'Mérida visigoda'], [1230, 'Mérida andalusí'], [1890, 'Encomienda de Santiago'], [1993, 'Se construye Casa Lucerna'], [2024, 'Patrimonio de la Humanidad'], [9999, 'Hoy · Casa Lucerna']];
  const yearEl = $('[data-year]'), eraEl = $('[data-era]'), epochEl = $('.epoch');
  addEventListener('scroll', onVoyage, { passive: true });
  addEventListener('resize', onVoyage);
  onVoyage();

  const flameBtn = $('[data-flame-toggle]');
  flameBtn.addEventListener('click', () => {
    const on = flameBtn.getAttribute('aria-pressed') !== 'true';
    flameBtn.setAttribute('aria-pressed', on);
    flameBtn.textContent = on ? 'Apagar la lucerna' : 'Encender la lucerna';
    dispatchEvent(new CustomEvent('lucerna:flame', { detail: on }));
  });

  /* ---------- Aparición al hacer scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
      $$('[data-count]', e.target).forEach(countUp);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  function countUp(el) {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const fmt = v => v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: end >= 10000 });
    if (reduced) { el.textContent = fmt(end); return; }
    const start = end > 1000 ? end - 140 : 0;
    const t0 = performance.now();
    const dur = 1600;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(start + (end - start) * e);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Habitaciones ---------- */
  const tabs = $('[data-rooms-tabs]');
  const visual = $('[data-room-visual]');
  function roomSVG(h) {
    const [pared, acento, madera, noche] = h.paleta;
    const vistas = {
      patio: `<rect x="0" y="0" width="200" height="200" fill="#9DB5A0"/><circle cx="100" cy="150" r="70" fill="#5F7F5A"/><circle cx="70" cy="120" r="8" fill="#E9B44C"/><circle cx="120" cy="105" r="7" fill="#E9B44C"/><circle cx="135" cy="140" r="8" fill="#E9B44C"/>`,
      calle: `<rect width="200" height="200" fill="#C9D4DE"/><rect x="20" y="60" width="70" height="140" fill="#E8DCC8"/><rect x="110" y="40" width="80" height="160" fill="#F1E6D4"/><rect x="35" y="90" width="18" height="28" fill="#7A8C9C"/><rect x="130" y="70" width="18" height="28" fill="#7A8C9C"/>`,
      tejados: `<rect width="200" height="200" fill="#F2C6A0"/><circle cx="150" cy="70" r="26" fill="#FBE3B0"/><path d="M0 140 L50 110 L100 140 L150 105 L200 135 V200 H0Z" fill="#B8643F"/><path d="M0 170 L60 140 L120 170 L200 150 V200 H0Z" fill="#8F4A2E"/>`,
      teatro: `<rect width="200" height="200" fill="${noche}"/><circle cx="160" cy="40" r="10" fill="#F7F1E8"/><g fill="#F3E2C0">${[20, 50, 80, 110, 140, 170].map(x => `<rect x="${x}" y="70" width="10" height="100"/><rect x="${x - 4}" y="64" width="18" height="8"/>`).join('')}<rect x="10" y="56" width="180" height="8"/></g><rect y="170" width="200" height="30" fill="#2B355C"/>`,
    };
    return `<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ilustración de la habitación ${h.nombre}" class="is-entering">
      <rect width="800" height="600" fill="${pared}"/>
      <rect y="440" width="800" height="160" fill="${madera}" opacity=".85"/>
      <g opacity=".18" stroke="${noche}">${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 100}" y1="440" x2="${i * 100 - 60}" y2="600"/>`).join('')}</g>
      <rect x="0" y="0" width="800" height="40" fill="${madera}"/>
      ${[80, 260, 440, 620].map(x => `<rect x="${x}" y="0" width="40" height="60" fill="${madera}"/>`).join('')}
      <g transform="translate(470 90)">
        <path d="M0 230 V100 A100 100 0 0 1 200 100 V230Z" fill="${madera}"/>
        <svg x="12" y="12" width="176" height="210" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          <clipPath id="arco-${h.id}"><path d="M0 200 V100 A100 100 0 0 1 200 100 V200Z"/></clipPath>
          <g clip-path="url(#arco-${h.id})">${vistas[h.ventana]}</g>
        </svg>
      </g>
      <rect x="60" y="360" width="400" height="90" rx="10" fill="#FBF7F0"/>
      <rect x="60" y="300" width="400" height="70" rx="12" fill="${acento}"/>
      <rect x="40" y="250" width="440" height="40" rx="14" fill="${madera}"/>
      <rect x="90" y="330" width="120" height="40" rx="18" fill="#FFFDF8"/>
      <rect x="230" y="330" width="120" height="40" rx="18" fill="#FFFDF8"/>
      <rect x="500" y="390" width="70" height="60" rx="6" fill="${madera}"/>
      <g transform="translate(512 360)">
        <path d="M0 26c0-10 12-15 26-15s26 5 26 15-12 10-26 10S0 36 0 26Z" fill="#B8643F"/>
        <path d="M46 22l12-3-2 7-10 2Z" fill="#B8643F"/>
        <path class="mini-flame" d="M56 18c-4-6 1-12 3-17 2 6 6 11 1 17Z" fill="#FFC861"/>
        <circle cx="57" cy="10" r="18" fill="#FFC861" opacity=".18"/>
      </g>
    </svg>`;
  }
  function selectRoom(i, focus) {
    const h = HABITACIONES[i];
    $$('[role="tab"]', tabs).forEach((t, k) => {
      t.setAttribute('aria-selected', k === i);
      t.tabIndex = k === i ? 0 : -1;
      if (k === i && focus) t.focus();
    });
    visual.innerHTML = roomSVG(h);
    $('[data-room-kicker]').textContent = h.kicker;
    $('[data-room-name]').textContent = h.nombre;
    $('[data-room-desc]').textContent = h.desc;
    $('[data-room-facts]').innerHTML = h.datos.map(d => `<li>${d}</li>`).join('');
    $('[data-room-price]').textContent = eur(h.precio);
    $('[data-room-book]').onclick = () => { bookRoom.value = h.id; updateTotal(); };
  }
  HABITACIONES.forEach((h, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rooms__tab';
    b.setAttribute('role', 'tab');
    b.textContent = h.nombre;
    b.addEventListener('click', () => selectRoom(i));
    b.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + HABITACIONES.length) % HABITACIONES.length;
        selectRoom(n, true);
      }
    });
    tabs.appendChild(b);
  });

  /* ---------- Vídeo interactivo ---------- */
  const player = $('[data-player]');
  const video = $('[data-video]');
  const timeline = $('[data-timeline]');
  const progress = $('[data-progress]');
  const timeEl = $('[data-time]');
  const chaptersEl = $('[data-chapters]');
  const hsLayer = $('[data-hotspots]');
  const card = $('[data-hotspot-card]');
  const fmtT = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  CAPITULOS.forEach((c, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><small>Capítulo ${i + 1}</small>${c.titulo} · ${c.sub}</button>`;
    li.firstChild.addEventListener('click', () => { video.currentTime = c.t + 0.05; play(); });
    chaptersEl.appendChild(li);
  });
  const hsEls = HOTSPOTS.map(h => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hotspot';
    b.style.left = h.x + '%';
    b.style.top = h.y + '%';
    b.setAttribute('aria-label', h.titulo);
    b.tabIndex = -1;
    b.addEventListener('click', e => {
      e.stopPropagation();
      video.pause();
      $('[data-hotspot-title]').textContent = h.titulo;
      $('[data-hotspot-text]').textContent = h.texto;
      card.hidden = false;
      player.classList.add('has-card');
    });
    hsLayer.appendChild(b);
    return b;
  });
  $('[data-hotspot-close]').addEventListener('click', () => { card.hidden = true; play(); });

  function play() { card.hidden = true; player.classList.remove('has-card'); video.play().catch(() => {}); }
  const togglePlay = () => (video.paused ? play() : video.pause());
  $('[data-play]').addEventListener('click', togglePlay);
  $('[data-play-big]').addEventListener('click', play);
  video.addEventListener('click', togglePlay);
  video.addEventListener('play', () => player.classList.add('is-playing'));
  video.addEventListener('pause', () => player.classList.remove('is-playing'));
  video.addEventListener('loadedmetadata', () => {
    CAPITULOS.slice(1).forEach(c => {
      const m = document.createElement('span');
      m.className = 'player__marker';
      m.style.left = (c.t / video.duration * 100) + '%';
      timeline.appendChild(m);
    });
  });
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    const d = video.duration || 40;
    progress.style.transform = `scaleX(${t / d})`;
    timeline.setAttribute('aria-valuenow', Math.round(t / d * 100));
    timeEl.textContent = fmtT(t);
    let cur = 0;
    CAPITULOS.forEach((c, i) => { if (t >= c.t) cur = i; });
    $$('button', chaptersEl).forEach((b, i) => b.setAttribute('aria-current', i === cur));
    HOTSPOTS.forEach((h, i) => {
      const on = t >= h.from && t <= h.to;
      hsEls[i].classList.toggle('is-on', on);
      hsEls[i].tabIndex = on ? 0 : -1;
    });
  });
  function seekFrom(clientX) {
    const r = timeline.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    if (video.duration) video.currentTime = k * video.duration;
  }
  timeline.addEventListener('pointerdown', e => {
    seekFrom(e.clientX);
    const move = ev => seekFrom(ev.clientX);
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
  });
  timeline.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') video.currentTime += 5;
    if (e.key === 'ArrowLeft') video.currentTime -= 5;
  });
  // se pausa al salir de la pantalla
  new IntersectionObserver(([e]) => { if (!e.isIntersecting && !video.paused) video.pause(); }, { threshold: 0.2 }).observe(player);

  /* ---------- Opiniones ---------- */
  const quotes = $$('.quote');
  const dots = $('[data-quote-dots]');
  let qi = 0;
  const showQuote = i => {
    qi = i;
    quotes.forEach((q, k) => q.classList.toggle('is-active', k === i));
    $$('button', dots).forEach((d, k) => d.setAttribute('aria-current', k === i));
  };
  quotes.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Opinión ${i + 1}`);
    b.addEventListener('click', () => showQuote(i));
    dots.appendChild(b);
  });
  showQuote(0);
  if (!reduced) setInterval(() => { if (!document.hidden) showQuote((qi + 1) % quotes.length); }, 6500);

  /* ---------- Reserva ---------- */
  const form = $('[data-book]');
  const bookRoom = $('[data-book-room]');
  const fIn = form.elements.in;
  const fOut = form.elements.out;
  const errEl = $('[data-book-error]');
  HABITACIONES.forEach(h => bookRoom.add(new Option(`${h.nombre} · desde ${eur(h.precio)}`, h.id)));
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const hoy = new Date();
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
  fIn.min = iso(hoy);
  fIn.value = iso(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 14));
  fOut.value = iso(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 16));

  function nights() {
    const a = new Date(fIn.value), b = new Date(fOut.value);
    return Math.round((b - a) / 86400000);
  }
  function updateTotal() {
    fOut.min = fIn.value || iso(manana);
    const n = nights();
    const h = HABITACIONES.find(x => x.id === bookRoom.value);
    if (!(n > 0)) {
      $('[data-book-nights]').textContent = 'Elige las fechas';
      $('[data-book-total]').textContent = '—';
      return;
    }
    const total = h.precio * n * (1 - CONFIG.descuentoDirecto);
    $('[data-book-nights]').textContent = `${n} ${n === 1 ? 'noche' : 'noches'} · ${h.nombre} · −8 % directo`;
    $('[data-book-total]').textContent = eur(total);
  }
  ['change', 'input'].forEach(ev => form.addEventListener(ev, updateTotal));
  updateTotal();

  form.addEventListener('submit', e => {
    e.preventDefault();
    errEl.textContent = '';
    const n = nights();
    if (!(n > 0)) { errEl.textContent = 'La salida tiene que ser después de la llegada.'; return; }
    if (!form.elements.name.value.trim()) { errEl.textContent = 'Dinos tu nombre para la reserva.'; form.elements.name.focus(); return; }
    if (!form.elements.privacy.checked) { errEl.textContent = 'Acepta la política de privacidad para continuar.'; return; }
    const h = HABITACIONES.find(x => x.id === bookRoom.value);
    const fmtD = v => new Date(v).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const msg = [
      `Hola, soy ${form.elements.name.value.trim()}. Quiero reservar en Casa Lucerna:`,
      `· Habitación: ${h.nombre}`,
      `· Del ${fmtD(fIn.value)} al ${fmtD(fOut.value)} (${n} ${n === 1 ? 'noche' : 'noches'})`,
      `· Huéspedes: ${form.elements.guests.value}`,
      form.elements.termas.checked ? '· Quiero reservar mi sesión en las termas' : '',
      `· Total orientativo: ${$('[data-book-total]').textContent}`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  selectRoom(0);

  /* ---------- Cookies y mapa ---------- */
  const KEY = 'lucerna-consent';
  const banner = $('[data-cookies]');
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch { /* sin almacenamiento */ } },
  };
  function loadMap() {
    const box = $('[data-map]');
    if (box.querySelector('iframe')) return;
    box.innerHTML = '<iframe title="Mapa de Casa Lucerna en Mérida" loading="lazy" referrerpolicy="no-referrer" src="https://www.openstreetmap.org/export/embed.html?bbox=-6.3460%2C38.9110%2C-6.3320%2C38.9200&amp;layer=mapnik&amp;marker=38.9157%2C-6.3388"></iframe>';
  }
  $('[data-map-load]').addEventListener('click', loadMap);
  const consent = store.get();
  if (!consent) banner.hidden = false;
  if (consent === 'accept') loadMap();
  $$('[data-cookie]').forEach(b => b.addEventListener('click', () => {
    store.set(b.dataset.cookie);
    banner.hidden = true;
    if (b.dataset.cookie === 'accept') loadMap();
  }));
  $('[data-cookie-open]').addEventListener('click', () => { banner.hidden = false; });
})();
