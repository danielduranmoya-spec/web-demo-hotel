/*
  Casa Lucerna · escena 3D del inicio (three.js r180, en vendor/)

  Animación «Digital Epoch»: al hacer scroll un plano de escaneo dorado
  recorre Mérida del año 25 a. C. a hoy y convierte en piedra los monumentos
  dibujados en alambre, mientras la cámara baja en grúa sobre el acueducto
  hasta una lucerna romana encendida delante de las columnas del Teatro.

  Todo se genera con código (sin modelos externos):
  - cielo con degradado y estrellas
  - escaneo: aristas (EdgesGeometry) + plano con shader
  - acueducto y columnas: geometrías simples
  - lucerna: torno (LatheGeometry) + piquera + asa + llama con shader
*/
import * as THREE from 'three';

const canvas = document.querySelector('[data-scene]');
const section = document.querySelector('[data-voyage]');
const qualityLabel = document.querySelector('[data-quality]');

const COLORES = {
  noche: 0x141b33,
  terracota: 0xd98e73,
  barro: 0xb8643f,
  oro: 0xe9b44c,
  marmol: 0xe9dfd0,
  granito: 0x8a7468,
};

const LAMP_Z = -140;           // dónde está la lucerna
const AQUEDUCT_Z = -75;        // arco que cruza la cámara
const CAM_END = LAMP_Z + 6.6;  // parada final de la cámara

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

if (!canvas || !webglOk()) {
  document.documentElement.classList.add('no-webgl');
} else {
  try { init(); } catch (err) {
    console.warn('Escena 3D desactivada:', err);
    document.documentElement.classList.add('no-webgl');
  }
}

function init() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(innerWidth, innerHeight) < 700;
  const tier = small || coarse ? 'media' : 'alta';
  let maxDpr = tier === 'alta' ? 2 : 1.6;
  let dpr = Math.min(devicePixelRatio || 1, maxDpr);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier === 'alta', alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x5b4566, 0.0105);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 900);
  camera.position.set(0, 0.6, 8);

  /* ---------- Cielo ---------- */
  const skyUniforms = {
    uTop: { value: new THREE.Color(0x141b33) },
    uMid: { value: new THREE.Color(0x5e4670) },
    uLow: { value: new THREE.Color(0xe39a78) },
    uNight: { value: 0 },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `
        uniform vec3 uTop, uMid, uLow; uniform float uNight; varying vec3 vP;
        void main(){
          float h = vP.y;
          vec3 c = mix(uLow, uMid, smoothstep(-0.05, 0.18, h));
          c = mix(c, uTop, smoothstep(0.15, 0.6, h));
          c = mix(c, uTop * 0.75, uNight * smoothstep(0.0, 0.5, h));
          // halo del sol poniente hacia -z
          float sun = pow(max(dot(vP, normalize(vec3(0.0, 0.03, -1.0))), 0.0), 18.0);
          c += vec3(1.0, 0.62, 0.38) * sun * (0.55 - 0.35 * uNight);
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  scene.add(sky);

  // Estrellas
  {
    const n = tier === 'alta' ? 1400 : 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = 0.12 + Math.random() * 0.88;
      const r = 500;
      pos[i * 3] = Math.cos(u) * Math.sqrt(1 - v * v) * r;
      pos[i * 3 + 1] = v * r;
      pos[i * 3 + 2] = Math.sin(u) * Math.sqrt(1 - v * v) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var stars = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xfff3d6, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false,
    }));
    scene.add(stars);
  }

  /* ---------- Luces ---------- */
  const hemi = new THREE.HemisphereLight(0xb7a2d6, 0x2a1e2a, 1.1);
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight(0xffb489, 2.2);
  sunLight.position.set(-6, 4, -260);
  sunLight.target.position.set(0, 0, -60);
  scene.add(sunLight, sunLight.target);

  /* ---------- Suelo ---------- */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x2a2236, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -4, -120);
  scene.add(ground);

  /* ---------- Acueducto (dos pisos de arcos) ---------- */
  const granito = new THREE.MeshStandardMaterial({ color: COLORES.granito, roughness: 0.9 });
  const ladrillo = new THREE.MeshStandardMaterial({ color: 0x9c4f36, roughness: 0.85 });
  const aqueduct = new THREE.Group();
  const SPAN = 6, PW = 1.2;
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    const x = i * SPAN - Math.sign(i) * SPAN / 2;
    for (let k = 0; k < 5; k++) {                       // piedra + ladrillo alternos
      const m = new THREE.Mesh(new THREE.BoxGeometry(PW, 1.2, 1.4), k % 2 ? ladrillo : granito);
      m.position.set(x, -3.4 + k * 1.2, 0);
      aqueduct.add(m);
    }
    const up = new THREE.Mesh(new THREE.BoxGeometry(PW * 0.8, 3.6, 1.2), granito);
    up.position.set(x, 6.2, 0);
    aqueduct.add(up);
  }
  for (let i = -3; i <= 3; i++) {                       // arcos centrados entre pilares
    const arch = new THREE.Mesh(new THREE.TorusGeometry(SPAN / 2 - PW / 2, 0.45, 8, 28, Math.PI), ladrillo);
    arch.position.set(i * SPAN, 2.0, 0);
    arch.scale.z = 1.5;
    aqueduct.add(arch);
    const arch2 = new THREE.Mesh(new THREE.TorusGeometry(SPAN / 2 - PW / 2.5, 0.35, 8, 28, Math.PI), granito);
    arch2.position.set(i * SPAN, 8, 0);
    arch2.scale.z = 1.3;
    aqueduct.add(arch2);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(SPAN * 7 + PW, 0.5, 1.4), granito);
  deck.position.set(0, 4.7, 0);
  const specus = new THREE.Mesh(new THREE.BoxGeometry(SPAN * 7 + PW, 0.9, 1.3), ladrillo);
  specus.position.set(0, 10.9, 0);
  aqueduct.add(deck, specus);
  // nido de cigüeña, guiño a Los Milagros
  const nest = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.5, 0.5, 10), new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 }));
  nest.position.set(-9, 8.6, 0);
  aqueduct.add(nest);
  aqueduct.position.z = AQUEDUCT_Z;
  scene.add(aqueduct);

  // Un segundo acueducto lejano, en silueta
  const far = aqueduct.clone();
  far.position.set(14, -1, AQUEDUCT_Z - 38);
  far.rotation.y = 0.5;
  far.scale.setScalar(0.8);
  scene.add(far);

  /* ---------- Frons scaenae: columnas del Teatro ---------- */
  const marmol = new THREE.MeshStandardMaterial({ color: COLORES.marmol, roughness: 0.55 });
  const theatre = new THREE.Group();
  const colGeo = new THREE.CylinderGeometry(0.32, 0.38, 7, 18);
  const capGeo = new THREE.BoxGeometry(1, 0.4, 1);
  const N = 11;
  for (let i = 0; i < N; i++) {
    const a = THREE.MathUtils.lerp(-1.1, 1.1, i / (N - 1));
    const R = 10;
    const x = Math.sin(a) * R;
    const z = -Math.cos(a) * R;
    const col = new THREE.Mesh(colGeo, marmol);
    col.position.set(x, -0.5, z);
    const cap = new THREE.Mesh(capGeo, marmol);
    cap.position.set(x, 3.2, z);
    const base = cap.clone();
    base.position.y = -3.9;
    theatre.add(col, cap, base);
  }
  const lintel = new THREE.Mesh(new THREE.TorusGeometry(10, 0.35, 6, 48, 2.2), marmol);
  lintel.rotation.set(Math.PI / 2, 0, Math.PI / 2 - 1.1 + Math.PI);
  lintel.position.y = 3.6;
  lintel.rotation.set(-Math.PI / 2, 0, -Math.PI / 2 - 1.1);
  theatre.add(lintel);
  theatre.position.set(0, 0, LAMP_Z);
  scene.add(theatre);

  // Pedestal
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 3.2, 32), marmol);
  plinth.position.set(0, -2.75, LAMP_Z);
  scene.add(plinth);

  /* ---------- Digital Epoch: monumentos en alambre que el escaneo vuelve sólidos ---------- */
  const lineMat = new THREE.LineBasicMaterial({ color: COLORES.oro, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const pieces = [];
  scene.updateMatrixWorld(true);
  const wp = new THREE.Vector3();
  for (const root of [aqueduct, far, theatre, plinth]) {
    root.traverse(o => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.transparent = true;
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 30), lineMat.clone());
      o.add(line);
      o.getWorldPosition(wp);
      pieces.push({ mesh: o, line, z: wp.z, r: -1 });
    });
  }
  const grid = new THREE.GridHelper(320, 160, COLORES.oro, COLORES.oro);
  grid.material.transparent = true;
  grid.material.opacity = 0.3;
  grid.material.depthWrite = false;
  grid.position.set(0, -3.98, -100);
  scene.add(grid);
  // plano de escaneo: velo dorado con borde brillante
  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 34),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      uniforms: { uA: { value: 1 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `uniform float uA; varying vec2 vUv;
        void main(){
          float edge = smoothstep(0.0, 0.5, 1.0 - abs(vUv.x - 0.5) * 2.0);
          float lines = 0.5 + 0.5 * step(0.5, fract(vUv.y * 60.0));
          float a = (0.06 + 0.05 * lines) * (1.0 - vUv.y) * edge * uA;
          gl_FragColor = vec4(vec3(1.0, 0.75, 0.32) * a * 2.0, a);
        }`,
    })
  );
  scan.position.y = 13;
  const scanLine = new THREE.Mesh(new THREE.BoxGeometry(120, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0xffd98a, fog: false }));
  scanLine.position.y = -3.9;
  scene.add(scan, scanLine);

  /* ---------- Lucerna ---------- */
  const lampKey = new THREE.SpotLight(0xffd6a8, 0, 30, 0.5, 0.6, 1.2);
  lampKey.position.set(-4, 6, LAMP_Z + 7);
  lampKey.target.position.set(0, -0.6, LAMP_Z);
  scene.add(lampKey, lampKey.target);
  const lamp = buildLamp();
  lamp.group.position.set(0, -1.15, LAMP_Z);
  scene.add(lamp.group);

  function clayTexture() {
    const s = 512;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    g.fillStyle = '#b8643f';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 4000; i++) {
      const v = Math.random();
      g.fillStyle = v < 0.5 ? `rgba(80,30,15,${Math.random() * 0.12})` : `rgba(255,200,160,${Math.random() * 0.1})`;
      g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
    // franjas de torno
    for (let y = 0; y < s; y += 6) {
      g.fillStyle = `rgba(60,20,10,${0.03 + Math.random() * 0.05})`;
      g.fillRect(0, y, s, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  function buildLamp() {
    const group = new THREE.Group();
    const clay = new THREE.MeshStandardMaterial({ map: clayTexture(), roughness: 0.78, metalness: 0.0, color: 0xffffff });
    // cuerpo torneado (perfil radio/altura)
    const prof = [
      [0.0, 0.0], [0.5, 0.0], [0.56, 0.03], [0.6, 0.06], [0.82, 0.16], [0.95, 0.3], [0.94, 0.4],
      [0.86, 0.48], [0.8, 0.53], [0.74, 0.55], [0.68, 0.52], [0.5, 0.47], [0.3, 0.45], [0.14, 0.44],
      [0.1, 0.47], [0.07, 0.4], [0.0, 0.38],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, tier === 'alta' ? 96 : 56), clay);
    group.add(body);
    // piquera
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.9, 32), clay);
    noz.rotation.z = Math.PI / 2;
    noz.scale.set(1, 1, 0.75);
    noz.position.set(1.1, 0.27, 0);
    group.add(noz);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 16), clay);
    tip.scale.set(1, 0.78, 0.75);
    tip.position.set(1.55, 0.27, 0);
    group.add(tip);
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x1a0d08, roughness: 1 }));
    wick.position.set(1.62, 0.47, 0);
    group.add(wick);
    // asa
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.075, 12, 40), clay);
    handle.position.set(-0.98, 0.42, 0);
    handle.rotation.y = 0;
    group.add(handle);
    // perlas (ovas) alrededor del disco
    const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 10, 8), clay, 28);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      m.makeTranslation(Math.cos(a) * 0.77, 0.56, Math.sin(a) * 0.77);
      beads.setMatrixAt(i, m);
    }
    group.add(beads);
    // relieve del disco: una máscara de teatro dibujada
    const relief = document.createElement('canvas');
    relief.width = relief.height = 256;
    const g = relief.getContext('2d');
    g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.ellipse(128, 128, 62, 76, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#202020';
    g.beginPath(); g.ellipse(102, 112, 14, 9, 0.2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(154, 112, 14, 9, -0.2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(128, 160, 22, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    const reliefTex = new THREE.CanvasTexture(relief);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.52, 48),
      new THREE.MeshStandardMaterial({ map: clay.map, bumpMap: reliefTex, bumpScale: 4, roughness: 0.8 })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.475;
    group.add(disc);
    group.scale.setScalar(1.15);

    // llama
    const flameMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uOn: { value: 1 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `
        uniform float uTime, uOn; varying vec2 vUv;
        float n(float x){ return sin(x) * 0.5 + sin(x * 2.3 + 1.7) * 0.3 + sin(x * 5.1) * 0.2; }
        void main(){
          vec2 p = vUv - vec2(0.5, 0.15);
          p.x += n(uTime * 7.0 + p.y * 6.0) * 0.05 * p.y * 2.0;
          float w = mix(0.22, 0.0, smoothstep(0.0, 0.8, p.y));
          float d = abs(p.x) / max(w, 0.001);
          float body = (1.0 - smoothstep(0.55, 1.0, d)) * smoothstep(-0.12, 0.02, p.y) * (1.0 - smoothstep(0.55, 0.8, p.y));
          float core = (1.0 - smoothstep(0.0, 0.55, d)) * smoothstep(-0.08, 0.05, p.y) * (1.0 - smoothstep(0.15, 0.45, p.y));
          vec3 col = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.85, 0.45), body);
          col = mix(col, vec3(1.0, 0.98, 0.9), core);
          float a = body * uOn;
          gl_FragColor = vec4(col * a * 1.6, a);
        }`,
    });
    const flame = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.25), flameMat);
    flame.position.set(1.62, 0.9, 0);
    group.add(flame);

    // halo
    const haloC = document.createElement('canvas');
    haloC.width = haloC.height = 128;
    const hg = haloC.getContext('2d');
    const grd = hg.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,214,140,0.9)');
    grd.addColorStop(0.25, 'rgba(255,170,80,0.35)');
    grd.addColorStop(1, 'rgba(255,140,60,0)');
    hg.fillStyle = grd; hg.fillRect(0, 0, 128, 128);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(haloC), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.scale.set(3.2, 3.2, 1);
    halo.position.copy(flame.position);
    group.add(halo);

    const light = new THREE.PointLight(0xffa552, 0, 26, 1.6);
    light.position.set(1.62, 1.0, 0);
    group.add(light);

    // chispas
    const EN = 36;
    const ep = new Float32Array(EN * 3);
    const eLife = new Float32Array(EN);
    for (let i = 0; i < EN; i++) eLife[i] = Math.random();
    const eg = new THREE.BufferGeometry();
    eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
    const embers = new THREE.Points(eg, new THREE.PointsMaterial({ map: halo.material.map, color: 0xffc070, size: 0.09, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    group.add(embers);

    return { group, flame, flameMat, halo, light, embers, eLife };
  }

  /* ---------- Estado ---------- */
  const state = {
    target: 0, p: 0, pointerX: 0, pointerY: 0,
    yaw: -0.5, yawVel: 0, dragging: false, lastX: 0,
    flameOn: 1, flame: 1, visible: true, offsetX: 0, offsetY: 0,
  };

  function readScroll() {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    state.target = THREE.MathUtils.clamp(-r.top / (total || 1), 0, 1);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 64 : camera.aspect < 1.2 ? 54 : 44;
    // en la parada final la lucerna se coloca a la derecha (escritorio) o arriba (móvil)
    state.offsetX = camera.aspect >= 1.05 ? -w * 0.2 : 0;
    state.offsetY = camera.aspect < 1.05 ? h * 0.17 : 0;
    camera.updateProjectionMatrix();
  }

  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const sstep = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
  const tmpLook = new THREE.Vector3();
  const lampPos = new THREE.Vector3(0.35, -0.4, LAMP_Z);   // centro visual de la lucerna (incluye la piquera)

  function cameraAt(p, out, look) {
    const u = ease(THREE.MathUtils.clamp(p / 0.86, 0, 1));
    const z = THREE.MathUtils.lerp(22, CAM_END, u);
    const y = THREE.MathUtils.lerp(30, 0.25, sstep(0.45, 1, u));   // pasa por encima del acueducto
    const x = Math.sin(u * Math.PI) * 6;
    out.set(x, y, z);
    tmpLook.set(0, 3, z - 60);
    look.copy(tmpLook).lerp(lampPos, sstep(0.55, 0.9, p));
  }

  /* ---------- Interacción ---------- */
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { resize(); readScroll(); });
  addEventListener('pointermove', e => {
    state.pointerX = (e.clientX / innerWidth) * 2 - 1;
    state.pointerY = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  canvas.addEventListener('pointerdown', e => {
    if (state.p < 0.8) return;
    state.dragging = true;
    state.lastX = e.clientX;
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!state.dragging) return;
    const dx = e.clientX - state.lastX;
    state.lastX = e.clientX;
    state.yawVel = dx * 0.006;
    state.yaw += dx * 0.01;
  });
  const endDrag = () => { state.dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  addEventListener('lucerna:flame', e => { state.flameOn = e.detail ? 1 : 0; });

  new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; if (state.visible) loop(); })
    .observe(section);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  /* ---------- Bucle ---------- */
  const clock = new THREE.Clock();
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  let running = false;
  let slowFrames = 0;
  let frames = 0;

  function frame() {
    if (!state.visible || document.hidden) { running = false; return; }
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    state.p = reduced ? state.target : state.p + (state.target - state.p) * Math.min(1, dt * 4);
    const p = state.p;

    cameraAt(p, camPos, camLook);
    camPos.x += state.pointerX * 0.35;
    camPos.y += -state.pointerY * 0.2;
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    const endMix = sstep(0.72, 0.92, p);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (state.offsetX || state.offsetY) {
      camera.setViewOffset(w, h, state.offsetX * endMix, state.offsetY * endMix, w, h);
    } else if (camera.view) {
      camera.clearViewOffset();
    }

    // cielo: anochece durante el viaje
    skyUniforms.uNight.value = sstep(0.2, 0.9, p);
    stars.material.opacity = sstep(0.25, 0.85, p) * (0.75 + Math.sin(time * 2) * 0.05);
    scene.fog.density = THREE.MathUtils.lerp(0.0105, 0.016, sstep(0.6, 1, p));
    sunLight.intensity = THREE.MathUtils.lerp(2.2, 0.35, sstep(0.2, 0.9, p));
    hemi.intensity = THREE.MathUtils.lerp(1.1, 0.45, sstep(0.3, 0.95, p));

    // escaneo: del año 25 a. C. a hoy, los monumentos pasan de alambre a piedra
    const scanZ = THREE.MathUtils.lerp(14, LAMP_Z - 14, sstep(0.02, 0.8, p));
    scan.position.z = scanLine.position.z = scanZ;
    scan.material.uniforms.uA.value = 1 - sstep(0.75, 0.86, p);
    scanLine.visible = p < 0.84;
    grid.material.opacity = 0.32 * (1 - sstep(0.5, 0.9, p));
    for (const pc of pieces) {
      const r = 1 - sstep(pc.z - 4, pc.z + 4, scanZ);
      if (Math.abs(r - pc.r) < 0.004) continue;
      pc.r = r;
      pc.mesh.material.opacity = r;
      pc.mesh.material.depthWrite = r > 0.5;
      pc.line.material.opacity = 0.85 * (1 - r) + 0.06;
    }

    // lucerna: gira sola y con el dedo
    if (!state.dragging) {
      state.yawVel *= 0.94;
      state.yaw += state.yawVel + (reduced ? 0 : dt * 0.25);
    }
    lamp.group.rotation.y = state.yaw;
    lamp.group.position.y = -1.15 + (reduced ? 0 : Math.sin(time * 1.3) * 0.04);

    // llama
    const lit = sstep(0.55, 0.8, p) * state.flameOn;
    state.flame += (lit - state.flame) * Math.min(1, dt * 3);
    const flick = reduced ? 1 : 0.86 + Math.sin(time * 13) * 0.06 + Math.sin(time * 7.3) * 0.05 + Math.random() * 0.04;
    lamp.flameMat.uniforms.uTime.value = time;
    lamp.flameMat.uniforms.uOn.value = state.flame;
    lamp.halo.material.opacity = state.flame * flick;
    lamp.light.intensity = state.flame * 9 * flick;
    lampKey.intensity = sstep(0.6, 0.9, p) * 60;
    // la llama siempre mira a la cámara (solo gira en Y)
    const fw = new THREE.Vector3();
    lamp.flame.getWorldPosition(fw);
    lamp.flame.rotation.y = Math.atan2(camera.position.x - fw.x, camera.position.z - fw.z) - lamp.group.rotation.y;

    // chispas
    const ep = lamp.embers.geometry.attributes.position;
    for (let i = 0; i < lamp.eLife.length; i++) {
      lamp.eLife[i] += dt * (0.35 + (i % 5) * 0.06);
      if (lamp.eLife[i] > 1) lamp.eLife[i] = 0;
      const l = lamp.eLife[i];
      ep.setXYZ(i, 1.62 + Math.sin(i * 12.9 + time * 2) * 0.12 * l, 1.0 + l * 1.6, Math.cos(i * 7.1 + time) * 0.12 * l);
    }
    ep.needsUpdate = true;
    lamp.embers.material.opacity = state.flame * 0.9;

    renderer.render(scene, camera);

    // calidad adaptativa: si va lento, baja la resolución
    frames++;
    if (dt > 0.034) slowFrames++;
    if (frames % 90 === 0) {
      if (slowFrames > 40 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.35);
        renderer.setPixelRatio(dpr);
        resize();
        label();
      }
      slowFrames = 0;
    }
  }

  function loop() {
    if (running) return;
    running = true;
    clock.getDelta();
    frame();
  }

  function label() {
    if (qualityLabel) qualityLabel.textContent = `3D en tiempo real · calidad ${tier} · ${dpr.toFixed(1)}×`;
  }

  resize();
  readScroll();
  state.p = state.target;
  label();
  loop();

  window.LUCERNA = { state, renderer };
}
