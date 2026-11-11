// v19 SONIDOS MÁS REALES: golpes secos de cuerpo, piel, ropa y objetos (sin tonos "de videojuego viejo")
// Se generan una vez como muestras de audio y se varían un poco en cada golpe.
// ============================================================
const SFX19 = { bufs: null };
function sfx19Build() {
  if (SFX19.bufs || !AC) return;
  const R = AC.sampleRate;
  const mk = (dur, fn) => { const n = Math.floor(dur * R), b = AC.createBuffer(1, n, R), d = b.getChannelData(0); fn(d, n, R); let m = 0; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(d[i])); if (m > 0) for (let i = 0; i < n; i++) d[i] /= m; return b; };
  // filtros simples sobre ruido
  const lp = (d, f) => { const a = Math.exp(-2 * Math.PI * f / R); let y = 0; for (let i = 0; i < d.length; i++) { y = (1 - a) * d[i] + a * y; d[i] = y; } };
  const hp = (d, f) => { const a = Math.exp(-2 * Math.PI * f / R); let y = 0, x0 = 0; for (let i = 0; i < d.length; i++) { const x = d[i]; y = a * (y + x - x0); x0 = x; d[i] = y; } };
  const noiseArr = n => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1; return a; };
  const layer = (d, n, src, att, dec, gain, delay) => { const o = Math.floor((delay || 0) * R); for (let i = 0; i + o < n && i < src.length; i++) { const t = i / R, e = (t < att ? t / att : Math.exp(-(t - att) / dec)); d[i + o] += src[i] * e * gain; } };
  const body = (n, f0, f1, k) => { const a = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / R, f = f1 + (f0 - f1) * Math.exp(-t * k); ph += 2 * Math.PI * f / R; a[i] = Math.sin(ph); } return a; };
  const B = {};
  // piña: golpe sordo de carne + chasquido de piel + roce de ropa
  B.punch = [0, 1, 2].map(v => mk(0.22, (d, n) => {
    const lo = noiseArr(n); lp(lo, 160 + v * 25); lp(lo, 220);
    const sl = noiseArr(n); hp(sl, 1800); lp(sl, 5000 - v * 600);
    const cl = noiseArr(n); hp(cl, 500); lp(cl, 1400);
    layer(d, n, lo, 0.002, 0.045 + v * 0.008, 1.6); layer(d, n, body(n, 95, 55, 60), 0.001, 0.035, 0.9);
    layer(d, n, sl, 0.0005, 0.007 + v * 0.002, 0.7); layer(d, n, cl, 0.002, 0.03, 0.25, 0.004);
  }));
  // golpe fuerte / patada: más cuerpo y más grave
  B.heavy = [0, 1].map(v => mk(0.38, (d, n) => {
    const lo = noiseArr(n); lp(lo, 120); lp(lo, 160);
    const sl = noiseArr(n); hp(sl, 1300); lp(sl, 4200);
    const cl = noiseArr(n); hp(cl, 350); lp(cl, 1100);
    layer(d, n, lo, 0.002, 0.08 + v * 0.02, 1.8); layer(d, n, body(n, 75, 42, 35), 0.001, 0.07, 1.1);
    layer(d, n, sl, 0.0005, 0.012, 0.55); layer(d, n, cl, 0.003, 0.05, 0.35, 0.006);
  }));
  // caída al piso: cuerpo contra el suelo + ropa + raspón
  B.thud = mk(0.6, (d, n) => {
    const lo = noiseArr(n); lp(lo, 90); lp(lo, 120);
    const sc = noiseArr(n); hp(sc, 900); lp(sc, 3000);
    layer(d, n, lo, 0.004, 0.12, 2); layer(d, n, body(n, 60, 38, 25), 0.002, 0.1, 1);
    layer(d, n, lo, 0.003, 0.06, 0.8, 0.09); layer(d, n, sc, 0.02, 0.12, 0.25, 0.05);
  });
  // bloqueo: antebrazo contra puño, más corto y seco
  B.block = mk(0.16, (d, n) => {
    const m = noiseArr(n); hp(m, 400); lp(m, 1800); const lo = noiseArr(n); lp(lo, 200);
    layer(d, n, m, 0.001, 0.02, 1); layer(d, n, lo, 0.002, 0.03, 0.9);
  });
  // movimiento de brazo/arma por el aire
  B.swing = [0, 1].map(v => mk(0.26, (d, n) => {
    const w = noiseArr(n);
    const a = new Float32Array(n); let y1 = 0, y2 = 0;           // banda que sube y baja (whoosh)
    for (let i = 0; i < n; i++) { const t = i / n, f = 350 + 1100 * Math.sin(Math.PI * t) * (0.8 + v * 0.3), q = 2 * Math.PI * f / R; y1 += q * (w[i] - y1 - y2 * 0.6); y2 += q * y1; a[i] = y1; }
    layer(d, n, a, 0.06, 0.08, 1);
  }));
  // madera: golpe de palo, con resonancia fija (sin barridos)
  B.wood = mk(0.3, (d, n) => {
    const k = noiseArr(n); hp(k, 700); lp(k, 3500);
    let ph1 = 0, ph2 = 0, ph3 = 0; const r = new Float32Array(n);
    for (let i = 0; i < n; i++) { ph1 += 2 * Math.PI * 310 / R; ph2 += 2 * Math.PI * 740 / R; ph3 += 2 * Math.PI * 1260 / R; r[i] = Math.sin(ph1) + 0.6 * Math.sin(ph2) + 0.3 * Math.sin(ph3); }
    layer(d, n, k, 0.0005, 0.008, 0.9); layer(d, n, r, 0.001, 0.045, 0.6); const lo = noiseArr(n); lp(lo, 180); layer(d, n, lo, 0.002, 0.05, 1.1);
  });
  // metal: caño/llave, parciales inarmónicos que se apagan
  B.metal = mk(0.9, (d, n) => {
    const fr = [523, 1377, 2210, 3170], g = [1, 0.7, 0.45, 0.25], dc = [0.35, 0.22, 0.14, 0.09];
    for (let j = 0; j < 4; j++) { let ph = 0; for (let i = 0; i < n; i++) { ph += 2 * Math.PI * fr[j] / R; d[i] += Math.sin(ph) * g[j] * Math.exp(-i / R / dc[j]) * 0.5; } }
    const k = noiseArr(n); hp(k, 2000); layer(d, n, k, 0.0003, 0.006, 0.8); const lo = noiseArr(n); lp(lo, 200); layer(d, n, lo, 0.002, 0.04, 0.9);
  });
  // corte: roce rápido y agudo
  B.slash = mk(0.2, (d, n) => { const k = noiseArr(n); hp(k, 2500); lp(k, 9000); layer(d, n, k, 0.01, 0.05, 1); const lo = noiseArr(n); lp(lo, 200); layer(d, n, lo, 0.002, 0.03, 0.6, 0.03); });
  // agarre: ropa que se tensa
  B.grab = mk(0.25, (d, n) => { const k = noiseArr(n); hp(k, 600); lp(k, 2600); layer(d, n, k, 0.015, 0.07, 1); const lo = noiseArr(n); lp(lo, 220); layer(d, n, lo, 0.003, 0.04, 0.7); });
  // levantar objeto / salto: roce corto, sin "pling"
  B.pickup = mk(0.15, (d, n) => { const k = noiseArr(n); hp(k, 800); lp(k, 3000); layer(d, n, k, 0.008, 0.035, 1); });
  B.jump = mk(0.22, (d, n) => { const k = noiseArr(n); hp(k, 300); lp(k, 1500); layer(d, n, k, 0.01, 0.05, 0.8); const lo = noiseArr(n); lp(lo, 150); layer(d, n, lo, 0.002, 0.05, 1); });
  // K.O.: golpe muy pesado + caída
  B.ko = mk(0.9, (d, n) => {
    const lo = noiseArr(n); lp(lo, 100); lp(lo, 140); layer(d, n, lo, 0.002, 0.11, 2); layer(d, n, body(n, 70, 38, 25), 0.001, 0.09, 1.1);
    const lo2 = noiseArr(n); lp(lo2, 90); layer(d, n, lo2, 0.004, 0.13, 1.5, 0.32); const sc = noiseArr(n); hp(sc, 900); lp(sc, 2800); layer(d, n, sc, 0.03, 0.15, 0.25, 0.34);
  });
  SFX19.bufs = B;
}
function sfx19Play(buf, vol, rate) {
  const s = AC.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate || 1;
  const g = AC.createGain(); g.gain.value = vol; s.connect(g); g.connect(master); s.start();
}
{
  const _old = sfx;
  const MAP = { hit: ['punch', 0.85], heavy: ['heavy', 1.0], thud: ['thud', 0.9], block: ['block', 0.7], swing: ['swing', 0.35], wood: ['wood', 0.8], metal: ['metal', 0.55], slash: ['slash', 0.6], grab: ['grab', 0.6], pickup: ['pickup', 0.45], throw: ['swing', 0.45], jump: ['jump', 0.6], ko: ['ko', 1.0] };
  sfx = function (kind, vol) {
    if (!AC) return;
    const m = MAP[kind]; if (!m) return _old(kind, vol);
    sfx19Build();
    let b = SFX19.bufs[m[0]]; if (Array.isArray(b)) b = b[Math.floor(Math.random() * b.length)];
    sfx19Play(b, m[1] * (vol == null ? 1 : vol), 0.92 + Math.random() * 0.16);
  };
}


// ============================================================
// v24 EL MAPA, REVISADO ENTERO
// - saca lo de la v13 que había quedado mal (cubos en medio de la calle)
// - pizzería de verdad, casa de la cumbia con fiesta, cartonero con caballo y carro,
//   patrullero que pasa y sigue, moto de delivery que se cae, pelota, vecinos en las ventanas
// - más luz en la calle, cables con zapatillas, grafitis, canastos de basura, carteles de calle
// - "nivel de quilombo": el barrio reacciona según cómo viene la pelea
// - la cámara hace transparente lo que tapa al jugador
// ============================================================
const MAP = { chaos: 0, level: 0, lights: [], upd: [], occ: [], built: false };
const LEVELS = ['QUIETO', 'RUIDO', 'QUILOMBO', 'BARDO'];
function chaosLevel() { const c = MAP.chaos; return c < 1 ? 0 : c < 4 ? 1 : c < 9 ? 2 : 3; }
function mapTex(w, h, draw) { const t = canvasTex(w, h, draw); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }
function emiMat(tex, k) { return new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: k == null ? 1 : k, roughness: 0.6 }); }
function decal(tex, w, h, x, y, z, ry, opts) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial(Object.assign({ map: tex, transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }, opts || {})));
  m.position.set(x, y, z); m.rotation.y = ry || 0; scene.add(m); return m;
}
function sprayText(text, color, w, h, font) {
  return mapTex(w, h, (g) => {
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = font || `bold ${Math.floor(h * 0.62)}px Impact, 'Arial Black', sans-serif`;
    g.save(); g.translate(w / 2, h / 2); g.rotate(rand(-0.08, 0.06));
    g.shadowColor = color; g.shadowBlur = 6; g.lineWidth = h * 0.08; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.strokeText(text, 0, 0);
    g.fillStyle = color; g.fillText(text, 0, 0);
    for (let i = 0; i < 26; i++) { g.fillStyle = color; g.globalAlpha = rand(0.2, 0.7); g.beginPath(); g.arc(rand(-w / 2, w / 2), rand(-h / 2, h / 2), rand(0.5, 2.2), 0, 7); g.fill(); }   // salpicado del aerosol
    g.globalAlpha = 0.8; for (let i = 0; i < 4; i++) { const x = rand(-w * 0.35, w * 0.35); g.fillRect(x, h * 0.1, 2, rand(8, h * 0.35)); }       // chorreado
    g.restore();
  });
}
// ---------- 1. limpieza de la v13 ----------
function map24Cleanup() {
  if (typeof BARRIO13 !== 'undefined') {
    if (BARRIO13.root && BARRIO13.root.parent) BARRIO13.root.parent.remove(BARRIO13.root);
    BARRIO13.police = null; BARRIO13.horse = null; BARRIO13.cart = null; BARRIO13.policeActive = 0;
  }
  barrioCumbia13 = function () { };   // la cumbia ahora sale de la casa de verdad (ver más abajo)
}
// ---------- 2. luz: más clara la noche, faroles de sodio en las veredas ----------
function map24Lights() {
  plazaScene.traverse(o => {
    if (o.isHemisphereLight) { o.intensity = 0.5; o.color.setHex(0x5a6ab8); o.groundColor.setHex(0x1a2210); }
    if (o.isDirectionalLight) { o.intensity = 0.5; o.color.setHex(0xb0c4ff); }
  });
  if (plazaScene.fog) { plazaScene.fog.color.setHex(0x16204a); plazaScene.fog.near = 55; plazaScene.fog.far = 150; }
  const poleM = mat(0x4a4a4a, { metalness: 0.5, roughness: 0.6 });
  const pools = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xb07a30, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.75 });
  // [x, z, hacia dónde cuelga la lámpara (dx,dz), luz real?]
  const L = [[27.2, -16, -1, 0, true], [27.2, 12, -1, 0, false], [-27.2, -15, 1, 0, true], [-27.2, 19, 1, 0, false],
             [-6, -28.6, 0, 1, false], [8, -28.6, 0, 1, true], [3, 29.6, 0, -1, true], [-21, 29.6, 0, -1, false]];
  for (const [x, z, dx, dz, real] of L) {
    cyl(0.08, 0.12, 6.5, poleM, x, 3.25, z, scene, 8);
    const hx = x + dx * 1.5, hz = z + dz * 1.5;
    const arm = box(Math.abs(dx) * 1.5 + 0.08, 0.08, Math.abs(dz) * 1.5 + 0.08, poleM, x + dx * 0.75, 6.45, z + dz * 0.75, scene);
    box(0.55, 0.14, 0.32, mat(0xffd090, { emissive: 0xff9a30, emissiveIntensity: 2.6 }), hx, 6.35, hz, scene, false).rotation.y = dx ? Math.PI / 2 : 0;
    glow(hx, 6.2, hz, 0xffa040, 3.4);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), pools); p.rotation.x = -Math.PI / 2; p.position.set(hx, 0.045, hz); p.renderOrder = 2; scene.add(p);
    if (real) { const pl = new THREE.PointLight(0xffa850, 1.7, 17, 1.6); pl.position.set(hx, 6.0, hz); scene.add(pl); }
    if (Math.abs(x) < 25.3 && Math.abs(z) < 27.3) addObstacle(x, z, 0.3, 0.3);
  }
}
// ---------- 3. nivel de quilombo ----------
{
  const _nn = npcNotify;
  npcNotify = function (pos, level) { MAP.chaos = Math.min(16, MAP.chaos + ([0, 1, 2.5, 4][level] || 0)); return _nn(pos, level); };
}
// ---------- 4. pizzería "Lo de Cacho" ----------
function map24Pizzeria() {
  const S = SPOTS.pizzaSlot || new THREE.Vector3(34, 0, -3);
  const g = new THREE.Group(); g.position.copy(S); g.rotation.y = -Math.PI / 2; scene.add(g);
  const W = 9, D = 8, H = 4.8, fz = D / 2;
  const wall = texMat(revoqueTex, 3, 1.6, { color: 0xf0e2c0 });
  box(W, H, D, wall, 0, H / 2, 0, g);
  box(W + 0.2, 0.3, D + 0.2, mat(0x2a7a3a), 0, H + 0.1, 0, g);                     // cornisa verde
  box(W + 0.04, 0.12, 0.06, mat(0xc8302a), 0, H - 0.25, fz + 0.03, g, false);       // filete rojo
  box(W + 0.04, 0.45, 0.06, mat(0x6a2a1a), 0, 0.22, fz + 0.03, g, false);           // zócalo
  // vidriera con el local adentro (horno de barro, mostrador, el pizzero)
  const inside = mapTex(512, 256, (c, w, h) => {
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#f6d29a'); bg.addColorStop(1, '#c8884a'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e8d8b8'; for (let y = 0; y < h * 0.6; y += 18) for (let x = (y / 18) % 2 ? 0 : 18; x < w; x += 36) c.fillRect(x, y, 34, 16);   // azulejos
    c.fillStyle = '#8a4a2a'; c.beginPath(); c.ellipse(140, 150, 105, 95, 0, Math.PI, 0); c.fill();       // horno de barro
    c.fillStyle = '#1a0a04'; c.beginPath(); c.ellipse(140, 150, 50, 42, 0, Math.PI, 0); c.fill();
    const fire = c.createRadialGradient(140, 140, 4, 140, 140, 48); fire.addColorStop(0, '#fff2a0'); fire.addColorStop(0.5, '#ff8a20'); fire.addColorStop(1, 'rgba(120,20,0,0)');
    c.fillStyle = fire; c.beginPath(); c.ellipse(140, 150, 48, 40, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#6a3a1a'; c.fillRect(0, 175, w, 81); c.fillStyle = '#4a2410'; c.fillRect(0, 175, w, 8);   // mostrador
    c.fillStyle = '#222'; c.fillRect(300, 30, 170, 95); c.fillStyle = '#f2f2e8'; c.font = 'bold 20px Arial';
    ['MUZZA', 'FUGAZZETA', 'NAPOLITANA', 'FAINÁ', 'EMPANADAS'].forEach((t, i) => c.fillText(t, 312, 54 + i * 17));
    c.fillStyle = '#2a1a12'; c.beginPath(); c.arc(330, 135, 16, 0, 7); c.fill(); c.fillRect(312, 150, 36, 30);   // el pizzero
    c.fillStyle = '#f8f8f0'; c.beginPath(); c.arc(330, 120, 14, Math.PI, 0); c.fill();                          // gorro
    for (let i = 0; i < 3; i++) { c.fillStyle = '#f0c040'; c.beginPath(); c.arc(220 + i * 70, 172, 26, Math.PI, 0); c.fill(); }   // pizzas en el mostrador
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.9), emiMat(inside, 0.95)); win.position.set(-1.6, 1.85, fz + 0.04); g.add(win);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.9), new THREE.MeshStandardMaterial({ color: 0x8aa0b8, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.9 })); glass.position.set(-1.6, 1.85, fz + 0.07); g.add(glass);
  for (const x of [-3.85, -1.6, 0.65]) box(0.08, 1.95, 0.08, mat(0x2a2a2a, { metalness: 0.6 }), x, 1.85, fz + 0.08, g, false);
  box(4.6, 0.08, 0.1, mat(0x2a2a2a, { metalness: 0.6 }), -1.6, 2.83, fz + 0.08, g, false); box(4.6, 0.08, 0.1, mat(0x2a2a2a, { metalness: 0.6 }), -1.6, 0.88, fz + 0.08, g, false);
  // puerta vidriada
  const dTex = mapTex(128, 256, (c, w, h) => { c.fillStyle = '#e8b878'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a2a1a'; c.fillRect(0, 0, 8, h); c.fillRect(w - 8, 0, 8, h); c.fillRect(0, 0, w, 8); c.fillRect(0, h * 0.55, w, 6); c.fillStyle = '#fff'; c.font = 'bold 18px Arial'; c.textAlign = 'center'; c.fillText('EMPUJE', w / 2, h * 0.5); });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.25), emiMat(dTex, 0.75)); door.position.set(2.6, 1.13, fz + 0.04); g.add(door);
  // cartel luminoso
  const signTex = mapTex(1024, 160, (c, w, h) => {
    const bg = c.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, '#1f7a32'); bg.addColorStop(0.33, '#1f7a32'); bg.addColorStop(0.33, '#f6f2e6'); bg.addColorStop(0.66, '#f6f2e6'); bg.addColorStop(0.66, '#c8302a'); bg.addColorStop(1, '#c8302a');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.font = "bold 96px Impact, 'Arial Black', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 12; c.strokeStyle = '#1a1a1a'; c.strokeText('PIZZERÍA LO DE CACHO', w / 2, h / 2 + 4); c.fillStyle = '#ffe680'; c.fillText('PIZZERÍA LO DE CACHO', w / 2, h / 2 + 4);
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.95, 0.18), [mat(0x1a1a1a), mat(0x1a1a1a), mat(0x1a1a1a), mat(0x1a1a1a), emiMat(signTex, 1.2), mat(0x1a1a1a)]);
  sign.position.set(0, 3.75, fz + 0.12); g.add(sign);
  // "ABIERTO" de neón que titila
  const neonTex = mapTex(256, 96, (c, w, h) => { c.fillStyle = '#100'; c.fillRect(0, 0, w, h); c.font = "bold 60px 'Arial Black', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#ff3a6a'; c.shadowBlur = 18; c.fillStyle = '#ff6a8a'; c.fillText('ABIERTO', w / 2, h / 2); });
  const neonM = emiMat(neonTex, 1.6), neon = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.42), neonM); neon.position.set(-0.35, 2.5, fz + 0.1); g.add(neon);
  // toldo a rayas
  const toldoTex = canvasTex(256, 64, (c, w, h) => { const C = ['#c8302a', '#f4efe2', '#1f7a32', '#f4efe2']; for (let i = 0; i < 16; i++) { c.fillStyle = C[i % 4]; c.fillRect(i * 16, 0, 16, h); } });
  const toldo = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.05, 1.6), new THREE.MeshStandardMaterial({ map: toldoTex, roughness: 0.85 }));
  toldo.position.set(0, 3.0, fz + 0.8); toldo.rotation.x = 0.32; toldo.castShadow = true; g.add(toldo);
  const fleco = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.28, 0.04), new THREE.MeshStandardMaterial({ map: toldoTex, roughness: 0.85 })); fleco.position.set(0, 2.6, fz + 1.55); g.add(fleco);
  // vereda de baldosas, mesas de plástico, pizzas y el pizarrón
  const ver = new THREE.Mesh(new THREE.PlaneGeometry(W, 4.4), texMat(concreteTex, 4, 2, { color: 0xb8b0a0 })); ver.rotation.x = -Math.PI / 2; ver.position.set(0, 0.02, fz + 2.2); ver.receiveShadow = true; g.add(ver);
  const white = mat(0xf2f0ea, { roughness: 0.45 });
  const pizzaTex = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#c88a3a'; c.beginPath(); c.arc(64, 64, 63, 0, 7); c.fill(); c.fillStyle = '#f2c440'; c.beginPath(); c.arc(64, 64, 54, 0, 7); c.fill();
    for (let i = 0; i < 14; i++) { c.fillStyle = pick(['#b8281a', '#2a6a2a', '#f8f0d8']); c.beginPath(); c.arc(64 + rand(-40, 40), 64 + rand(-40, 40), rand(3, 6), 0, 7); c.fill(); }
    c.strokeStyle = '#a8701a'; c.lineWidth = 2; for (let a = 0; a < 6.28; a += 0.785) { c.beginPath(); c.moveTo(64, 64); c.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); c.stroke(); } });
  for (const [tx, tz] of [[-2.6, 6.3], [0.4, 6.5]]) {
    cyl(0.42, 0.42, 0.04, white, tx, 0.74, tz, g, 20); cyl(0.04, 0.05, 0.72, white, tx, 0.37, tz, g, 8);
    const pz = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 24), [mat(0xc88a3a), new THREE.MeshStandardMaterial({ map: pizzaTex, roughness: 0.7 }), mat(0xc88a3a)]); pz.position.set(tx + 0.05, 0.77, tz); g.add(pz);
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4, ch = new THREE.Group(); ch.position.set(tx + Math.sin(a) * 0.72, 0, tz + Math.cos(a) * 0.72); ch.rotation.y = a + Math.PI; g.add(ch);
      box(0.42, 0.04, 0.4, white, 0, 0.44, 0, ch); box(0.42, 0.42, 0.04, white, 0, 0.66, -0.2, ch); for (const [lx, lz] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) box(0.03, 0.44, 0.03, white, lx, 0.22, lz, ch); }
    cyl(0.03, 0.03, 0.12, mat(0x2a6a2a, { transparent: true, opacity: 0.7, roughness: 0.1 }), tx - 0.2, 0.82, tz + 0.15, g, 8);
  }
  const boardTex = mapTex(256, 320, (c, w, h) => { c.fillStyle = '#1e2a22'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a5a2a'; c.lineWidth = 14; c.strokeRect(0, 0, w, h);
    c.fillStyle = '#f2f0e0'; c.textAlign = 'center'; c.font = "bold 44px 'Comic Sans MS', cursive"; c.fillText('HOY', w / 2, 62); c.font = "30px 'Comic Sans MS', cursive";
    c.fillText('MUZZA + FAINÁ', w / 2, 120); c.fillStyle = '#ffd84a'; c.fillText('2x1 LOS MARTES', w / 2, 170); c.fillStyle = '#f2f0e0'; c.font = "24px 'Comic Sans MS', cursive"; c.fillText('¡NO SE FÍA!', w / 2, 230); c.fillText('Delivery 🛵', w / 2, 270); });
  const bd = new THREE.Group(); bd.position.set(-4.0, 0, 7.4); bd.rotation.y = 0.25; g.add(bd);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), s > 0 ? new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.8 }) : mat(0x6a4a2a)); p.position.set(0, 0.5, s * 0.12); p.rotation.x = s * -0.25; p.rotation.y = s > 0 ? 0 : Math.PI; bd.add(p); }
  // chimenea del horno con humo
  box(0.55, 1.2, 0.55, texMat(brickTexC, 0.6, 1.2), -2.4, H + 0.6, -1.5, g);
  const smoke = []; for (let i = 0; i < 5; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x6a6460, transparent: true, opacity: 0.3, depthWrite: false })); g.add(s); smoke.push({ s, t: i * 0.8 }); }
  // luz cálida sobre la vereda
  const L = new THREE.PointLight(0xffb070, 2.1, 13, 1.6); L.position.set(0, 2.6, fz + 2.4); g.add(L);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xa86a28, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.05, fz + 3.0); g.add(pool);
  g.traverse(o => { if (o.isMesh) o.castShadow = o.castShadow !== false; });
  MAP.pizzeria = { g, neonM, smoke, H };
  MAP.upd.push(dt => {
    const flick = (worldT % 7) > 6.4 ? (Math.random() < 0.5 ? 0.2 : 1.6) : 1.6; neonM.emissiveIntensity = flick;
    for (const p of smoke) { p.t = (p.t + dt) % 4; const u = p.t / 4; p.s.position.set(-2.4 + u * 0.6, H + 1.3 + u * 3.2, -1.5 + u * 0.4); const k = 0.5 + u * 1.8; p.s.scale.set(k, k, 1); p.s.material.opacity = 0.32 * (1 - u); }
  });
  // moto de delivery estacionada en la calle (se cae si le pasa algo cerca)
  map24DeliveryMoto(new THREE.Vector3(23.7, 0, -1.6));
}
// ---------- 5. moto de delivery: si alguien se cae cerca o le pegan, se cae y suena la alarma ----------
function map24DeliveryMoto(p) {
  const g = new THREE.Group(); g.position.copy(p); scene.add(g);
  const tilt = new THREE.Group(); g.add(tilt); tilt.rotation.z = 0.12;     // apoyada en la pata
  const wheels = buildMoto(tilt, 0xc8302a, true);
  const caja = box(0.5, 0.42, 0.5, mat(0xc8302a, { roughness: 0.5 }), 0, 1.08, -0.62, tilt);
  const cTex = mapTex(128, 64, (c, w, h) => { c.fillStyle = '#c8302a'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe680'; c.font = "bold 34px Impact, sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PIZZA', w / 2, h / 2); });
  for (const s of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.24), new THREE.MeshStandardMaterial({ map: cTex })); pl.position.set(s * 0.26, 1.1, -0.62); pl.rotation.y = s * Math.PI / 2; tilt.add(pl); }
  const pata = box(0.03, 0.34, 0.03, mat(0x2a2a2a), -0.12, 0.17, -0.1, g); pata.rotation.z = -0.35;
  addObstacle(p.x, p.z, 0.8, 1.8);
  const M = MAP.moto = { g, tilt, fallen: false, t: 0, alarm: 0, beep: 0 };
  MAP.upd.push(dt => {
    if (gameState === 'walkin' || gameState === 'house' || gameState === 'menu') { if (M.fallen) { M.fallen = false; M.t = 0; } }
    if (!M.fallen && gameState === 'fight') {
      for (const f of fighters) {
        const d = Math.hypot(f.pos.x - p.x, f.pos.z - p.z);
        if (d < 1.35 && (f.state === 'down' && f.stateTime < 0.35 || f.state === 'hit' && Math.hypot(f.knock.x, f.knock.y) > 3 || f.airborne)) { map24MotoFall(f); break; }
      }
      const B = MAP.ball; if (B && B.v.length() > 5 && Math.hypot(B.p.x - p.x, B.p.z - p.z) < 0.9) map24MotoFall(null);
    }
    M.t += dt;
    const target = M.fallen ? Math.PI / 2 - 0.12 : 0.12;
    tilt.rotation.z += (target - tilt.rotation.z) * Math.min(1, dt * (M.fallen ? 7 : 3));
    tilt.position.y = M.fallen ? 0.08 * Math.min(1, M.t * 3) : 0;
    if (M.alarm > 0 && AC) { M.alarm -= dt; M.beep -= dt; if (M.beep <= 0) { M.beep = 0.32; tone('square', M.alarm % 0.64 > 0.32 ? 1250 : 930, M.alarm % 0.64 > 0.32 ? 1250 : 930, 0.22, 0.07 * distVol(p.x, p.z)); } }
  });
}
function map24MotoFall(f) {
  const M = MAP.moto; if (!M || M.fallen) return;
  M.fallen = true; M.t = 0; M.alarm = 3.2; M.beep = 0.3;
  sfx('metal', 0.7 * distVol(M.g.position.x, M.g.position.z)); sfx('thud', 0.5);
  popText(new THREE.Vector3(M.g.position.x, 1.6, M.g.position.z), '¡LA MOTOOO!', 'warn', 1.4);
  const who = npcs.filter(n => !n.hidden && n.body && n.body.root.visible);
  if (who.length) pick(who).say(pick(['¡EH, LA MOTO!', '¡La moto del delivery, animal!', '¡Ahora la pagás vos, eh!']), 2);
  else if (f) f.say(pick(['Uh... la moto.', '¡Yo no fui!']), 1.6);
  MAP.chaos += 1.5;
}
// ---------- 6. la casa de la cumbia: cumpleaños del Turco ----------
function map24Cumbia() {
  const H = SPOTS.cumbia; const fx = H ? -30 : -30, cz = 6.5;
  const S = new THREE.Vector3(-28.3, 0, 9.4);
  // parlante grande con luces
  const sp = new THREE.Group(); sp.position.copy(S); sp.rotation.y = Math.PI / 2 - 0.35; scene.add(sp);
  box(0.66, 1.15, 0.5, mat(0x141416, { roughness: 0.4 }), 0, 0.58, 0, sp);
  const ringM = new THREE.MeshStandardMaterial({ color: 0x2a6aff, emissive: 0x2a6aff, emissiveIntensity: 2.2 });
  const cones = [];
  for (const [y, r] of [[0.36, 0.22], [0.82, 0.12]]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.6, 0.06, 20), mat(0x2a2a2e, { roughness: 0.7 })); c.rotation.x = Math.PI / 2; c.position.set(0, y, 0.26); sp.add(c); cones.push(c);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.015, 6, 24), ringM); ring.position.set(0, y, 0.27); sp.add(ring);
  }
  box(0.3, 0.06, 0.12, mat(0x2a2a2a), 0, 1.18, 0, sp);   // manija
  // guirnalda de lamparitas desde la casa hasta un palo
  cyl(0.06, 0.08, 2.9, mat(0x6a4a2a), -26.0, 1.45, 10.8, scene, 6);
  addObstacle(-26.0, 10.8, 0.25, 0.25);
  const A = new THREE.Vector3(-29.9, 2.75, 3.0), B = new THREE.Vector3(-26.0, 2.85, 10.8), C2 = new THREE.Vector3(-29.9, 2.75, 10.2);
  wire(A, B, 0.45); wire(C2, B, 0.3);
  const bulbs = [], BC = [0xff3a3a, 0xffd23a, 0x3aff6a, 0x3a8aff, 0xff3aff, 0xffffff];
  const seg = (a, b, sag, n) => { for (let i = 1; i < n; i++) { const t = i / n, q = new THREE.Vector3().lerpVectors(a, b, t); q.y -= sag * 4 * t * (1 - t) + 0.07;
    const m = new THREE.MeshStandardMaterial({ color: BC[bulbs.length % 6], emissive: BC[bulbs.length % 6], emissiveIntensity: 1.8 }); const s = sph(0.05, 0.065, 0.05, m, q.x, q.y, q.z, scene, false); bulbs.push(m); } };
  seg(A, B, 0.45, 12); seg(C2, B, 0.3, 7);
  // cartel del cumple sobre la puerta
  const banTex = mapTex(512, 96, (c, w, h) => { c.fillStyle = '#f6f2e6'; c.fillRect(0, 0, w, h); for (let i = 0; i < 18; i++) { c.fillStyle = pick(['#ff3a6a', '#3a8aff', '#ffd23a', '#3ac06a']); c.beginPath(); c.moveTo(i * 30, 0); c.lineTo(i * 30 + 15, 22); c.lineTo(i * 30 + 30, 0); c.fill(); }
    c.font = "bold 46px Impact, 'Arial Black', sans-serif"; c.textAlign = 'center'; c.fillStyle = '#c8302a'; c.fillText('¡FELIZ CUMPLE TURCO!', w / 2, 76); });
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.64), new THREE.MeshStandardMaterial({ map: banTex, side: THREE.DoubleSide, roughness: 0.9 })); ban.position.set(-29.8, 3.2, 6.6); ban.rotation.y = Math.PI / 2; scene.add(ban);
  // parrilla con chorizos y humo
  const pg = new THREE.Group(); pg.position.set(-28.6, 0, 4.8); pg.rotation.y = Math.PI / 2; scene.add(pg);
  box(1.3, 0.75, 0.6, texMat(brickTexC, 1.2, 0.8), 0, 0.38, 0, pg);
  box(1.2, 0.04, 0.55, mat(0x2a2a2a, { metalness: 0.7, roughness: 0.4 }), 0, 0.84, 0, pg);
  for (let i = 0; i < 6; i++) { const ch = cyl(0.035, 0.035, 0.3, mat(0x6a2a14, { roughness: 0.5 }), -0.42 + i * 0.16, 0.89, 0, pg, 8); ch.rotation.x = Math.PI / 2; }
  const brasa = glow(0, 0.8, 0, 0xff6a20, 1.4, pg);
  const smk = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x8a8580, transparent: true, opacity: 0.3, depthWrite: false })); scene.add(s); smk.push({ s, t: i * 0.6 }); }
  // heladerita, sillas de plástico, cajón de cerveza... de gaseosa
  box(0.62, 0.42, 0.4, mat(0x2a6ad0, { roughness: 0.5 }), -27.1, 0.21, 9.95, scene); box(0.64, 0.1, 0.42, mat(0xf2f2ee), -27.1, 0.46, 9.95, scene);
  const white = mat(0xf2f0ea, { roughness: 0.45 });
  for (const [x, z, r] of [[-28.4, 7.2, 0.6], [-27.6, 5.9, -0.3], [-26.8, 9.0, 2.6]]) { const ch = new THREE.Group(); ch.position.set(x, 0, z); ch.rotation.y = r; scene.add(ch); box(0.44, 0.04, 0.42, white, 0, 0.44, 0, ch); box(0.44, 0.44, 0.04, white, 0, 0.66, -0.21, ch); for (const [lx, lz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) box(0.03, 0.44, 0.03, white, lx, 0.22, lz, ch); }
  box(0.5, 0.3, 0.34, mat(0xd8302a, { roughness: 0.6 }), -26.5, 0.15, 6.5, scene);
  addObstacle(-27.6, 7.6, 2.4, 6.4);
  // luz de colores que va con la música
  const CL = new THREE.PointLight(0xff3aff, 1.4, 10, 1.6); CL.position.set(-27.6, 2.4, 8.0); scene.add(CL);
  // el Turco bailando (y si se pudre todo, para y mira)
  const turco = map24Dancer(new THREE.Vector3(-27.0, 0, 8.0));
  // música: una cumbia sintetizada que sale del parlante (más fuerte cuanto más cerca)
  const CU = MAP.cumbia = { S, next: 0, step: 0, cut: 0, turco };
  const CH = [[110, 165, 220, 262], [98, 147, 196, 247], [87, 131, 175, 220], [82, 123, 165, 208]];   // La m · Sol · Fa · Mi
  MAP.upd.push(dt => {
    const beat = (worldT * 96 / 60) % 1, b8 = Math.floor(worldT * 96 / 30) % 8;
    ringM.emissiveIntensity = 1.2 + (1 - beat) * 2.4; ringM.emissive.setHSL((worldT * 0.05) % 1, 1, 0.5);
    for (const c of cones) c.position.z = 0.26 + (1 - beat) * 0.02 * (CU.cut > 0 ? 0 : 1);
    bulbs.forEach((m, i) => { m.emissiveIntensity = ((i + b8) % 3 === 0) ? 2.6 : 0.6; });
    CL.color.setHSL((worldT * 0.12) % 1, 1, 0.55); CL.intensity = CU.cut > 0 ? 0.3 : 0.9 + (1 - beat) * 1.2;
    brasa.scale.setScalar(1.2 + Math.sin(worldT * 9) * 0.15);
    for (const p of smk) { p.t = (p.t + dt) % 3.6; const u = p.t / 3.6; p.s.position.set(-28.6 + u * 0.5, 1.0 + u * 3, 4.8 + Math.sin(u * 6) * 0.2); const k = 0.4 + u * 1.6; p.s.scale.set(k, k, 1); p.s.material.opacity = 0.28 * (1 - u); }
    // si la pelea se pone pesada, bajan la música un rato
    if (CU.cut > 0) CU.cut -= dt;
    else if (MAP.level >= 3 && gameState === 'fight' && Math.random() < dt * 0.25) { CU.cut = 7; if (turco) turco.say(pick(['¡Bajá la música, bajá! ¡Se están matando!', '¡Eh, eh! ¡Que es mi cumple!']), 2.2); }
    if (!AC || !master || scene !== plazaScene || (typeof MUS !== 'undefined' && !MUS.on) || CU.cut > 0) { CU.next = 0; return; }
    const spb = 60 / 96 / 2, now = AC.currentTime;
    if (!CU.next || CU.next < now) CU.next = now + 0.05;
    const lp = camera.position, d = Math.hypot(lp.x - S.x, lp.z - S.z), v = Math.max(0, 0.11 * (1 - d / 48)) * (gameState === 'menu' ? 0.45 : 1);
    if (v < 0.004) return;
    while (CU.next < now + 0.18) {
      const st = CU.step % 8, bar = Math.floor(CU.step / 8) % 4, ch = CH[bar], dl = CU.next - now;
      if (st === 0 || st === 4) tone('sine', ch[0] * (st === 4 ? 1.5 : 1) / 1, ch[0] * (st === 4 ? 1.5 : 1) * 0.98, 0.26, v * 1.4, dl);            // bajo: tónica y quinta
      if (st === 3 || st === 7) tone('sine', ch[0] * 2, ch[0] * 1.96, 0.12, v * 0.6, dl);
      noise(st % 2 ? 0.05 : 0.11, 3600, v * (st % 2 ? 0.45 : 0.7), 'bandpass', 2.5, dl);                                                   // güiro: largo-corto
      if (st === 2 || st === 6) noise(0.06, 1500, v * 0.9, 'bandpass', 1.5, dl);                                                           // palmas
      if (st % 2 === 1) { for (const f of ch.slice(1)) tone('square', f * 2, f * 2, 0.09, v * 0.13, dl); }                                     // acorde de acordeón a contratiempo
      if (st === 6 && bar % 2 === 1) tone('triangle', ch[3] * 2, ch[2] * 2, 0.25, v * 0.35, dl);                                                // firulete
      CU.next += spb; CU.step++;
    }
  });
}
function map24Dancer(pos) {
  const cfg = { name: 'El Turco', civil: true, top: 'musculosa', topColor: 0xe8e4da, pants: 0x2e4470, skin: 0xc68b62, hair: 'rulos', hairColor: 0x1a1008, belly: true, chain: true, mustache: true, shoe: 0xf0f0f0 };
  const prev = scene; setScene(plazaScene);
  const W = new Walker(cfg); setScene(prev);
  const b = W.body; b.useIK = false; b.pos.copy(pos); b.facing = Math.PI / 2;
  W.mode = 'dance'; W.t = 0; W.lineT = rand(8, 14);
  b.poseFn = (P) => {
    const t = worldT * 96 / 60 * Math.PI;   // pasito de cumbia: de un lado al otro
    if (W.mode === 'dance' && !(MAP.cumbia && MAP.cumbia.cut > 0)) {
      const s = Math.sin(t), c = Math.cos(t * 2);
      P.kL = 0.25 + Math.max(0, s) * 0.45; P.kR = 0.25 + Math.max(0, -s) * 0.45; P.lL = -0.15 - Math.max(0, s) * 0.3; P.lR = -0.15 - Math.max(0, -s) * 0.3;
      P.hipY = -0.05 - Math.abs(c) * 0.04; P.tY = s * 0.35; P.tZ = s * 0.08; P.hY = -s * 0.2;
      P.aL = -0.7; P.eL = -1.5; P.aLz = -0.35 + s * 0.15; P.aR = -0.55 + Math.sin(t * 0.5) * 0.4; P.eR = -1.7; P.aRz = 0.4;
    } else { P.aL = P.aR = -0.3; P.eL = P.eR = -2.1; P.aLz = 0.5; P.aRz = -0.5; const c = fightCenter(); P.hY = clamp(angDiff(b.facing, Math.atan2(c.x - b.pos.x, c.z - b.pos.z)), -1.1, 1.1); }
  };
  W.react = (p, level) => { if (level >= 3 && Math.random() < 0.3) W.say(pick(['¡Uhhh! ¡Qué piña!', '¡Eso, eso! ¡Pegale!', '¡Ahora sí que es un cumple!']), 2); };
  W.update = (dt) => {
    W.tickBark(dt); W.lineT -= dt;
    if (W.lineT <= 0) { W.lineT = rand(14, 22); if (gameState === 'fight') W.say(pick(['¡Vengan que hay chori!', '¡Esta es la mejor cumbia del mundo!', '¡Feliz cumple a mí!', 'Turco no se mueve de la fiesta.']), 2.2); }
    W.mode = MAP.level >= 3 ? 'watch' : 'dance';
    const p = b.pos; p.x = pos.x + Math.sin(worldT * 96 / 60 * Math.PI * 0.5) * (W.mode === 'dance' ? 0.12 : 0);
    b.curSpeed = 0; b.facing = Math.PI / 2 + (W.mode === 'dance' ? Math.sin(worldT * 0.4) * 0.5 : 0);
    b.root.position.copy(b.pos); b.animate(dt);
  };
  npcs.push(W); return W;
}
// ---------- 7. el cartonero: caballo, carro cargado y el que junta ----------
function map24Horse(parent) {
  const g = new THREE.Group(); parent.add(g);
  const coat = mat(0x6a3e22, { roughness: 0.85 }), dark = mat(0x2a1a10, { roughness: 0.8 }), white = mat(0xe8e0d0, { roughness: 0.85 }), hoof = mat(0x1a1410, { roughness: 0.6 }), leather = mat(0x1e140c, { roughness: 0.5 });
  const body = new THREE.Group(); body.position.y = 1.18; g.add(body);
  sph(0.3, 0.33, 0.62, coat, 0, 0, 0, body);                       // barril
  sph(0.31, 0.34, 0.3, coat, 0, 0.04, 0.42, body);                 // pecho
  sph(0.32, 0.33, 0.32, coat, 0, 0.06, -0.48, body);               // anca
  sph(0.27, 0.2, 0.4, coat, 0, -0.13, 0.02, body);                 // panza
  // patas: muslo, caña, casco (con articulación)
  const legs = [];
  for (const [x, z, front] of [[-0.15, 0.48, 1], [0.15, 0.48, 1], [-0.16, -0.52, 0], [0.16, -0.52, 0]]) {
    const up = new THREE.Group(); up.position.set(x, -0.08, z); body.add(up);
    cyl(front ? 0.09 : 0.11, 0.065, 0.5, coat, 0, -0.25, 0, up, 10);
    const kn = new THREE.Group(); kn.position.y = -0.5; up.add(kn);
    sph(0.06, 0.06, 0.06, coat, 0, 0, 0, kn, false);
    cyl(0.045, 0.045, 0.46, x > 0 && !front ? white : dark, 0, -0.23, 0, kn, 8);
    cyl(0.07, 0.08, 0.09, hoof, 0, -0.48, 0.01, kn, 10);
    legs.push({ up, kn, front });
  }
  // cuello, cabeza, crin, orejas, anteojeras
  const neck = new THREE.Group(); neck.position.set(0, 0.16, 0.6); neck.rotation.x = 0.62; body.add(neck);
  cyl(0.11, 0.17, 0.72, coat, 0, 0.3, 0, neck, 12);
  for (let i = 0; i < 7; i++) box(0.05, 0.12, 0.1, dark, 0, 0.08 + i * 0.1, -0.13 + i * 0.006, neck, false);
  const head = new THREE.Group(); head.position.set(0, 0.68, 0.02); neck.add(head);
  const hd = sph(0.1, 0.12, 0.27, coat, 0, -0.03, 0.18, head); hd.rotation.x = 0.95;
  const mz = sph(0.085, 0.08, 0.1, mat(0x3a2418, { roughness: 0.8 }), 0, -0.24, 0.32, head);
  for (const s of [-1, 1]) {
    const ear = cyl(0.025, 0.04, 0.13, coat, s * 0.06, 0.13, 0.02, head, 6); ear.rotation.z = -s * 0.2;
    sph(0.018, 0.018, 0.012, mat(0x050505, { roughness: 0.2 }), s * 0.095, 0.0, 0.12, head, false);
    box(0.01, 0.09, 0.09, leather, s * 0.11, 0.0, 0.1, head, false);                                       // anteojera
  }
  box(0.2, 0.02, 0.02, leather, 0, -0.12, 0.26, head, false); box(0.22, 0.02, 0.02, leather, 0, -0.22, 0.36, head, false);
  // collera y arneses
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 18), leather); collar.position.set(0, 0.22, 0.12); collar.rotation.x = Math.PI / 2 - 0.62; neck.add(collar);
  box(0.64, 0.05, 0.12, leather, 0, 0.28, -0.05, body); box(0.66, 0.42, 0.05, leather, 0, 0.02, -0.08, body, false);
  // cola
  const tail = new THREE.Group(); tail.position.set(0, 0.16, -0.76); body.add(tail);
  let tp = tail; for (let i = 0; i < 4; i++) { const s = new THREE.Group(); s.position.y = i ? -0.16 : 0; s.rotation.x = i ? 0.12 : 0.5; tp.add(s); cyl(0.05 - i * 0.008, 0.06 - i * 0.008, 0.18, dark, 0, -0.09, 0, s, 6); tp = s; }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, body, neck, head, tail, legs };
}
function map24Cartonero() {
  const C = new THREE.Vector3(-13.6, 0, 27.15);
  const g = new THREE.Group(); g.position.copy(C); g.rotation.y = Math.PI / 2; scene.add(g);   // hacia +x
  const wood = mat(0x8a6a44, { roughness: 0.95 }), wood2 = mat(0x6a4e30, { roughness: 0.95 }), tire = mat(0x141414, { roughness: 0.85 }), rim = mat(0x9aa0a6, { metalness: 0.7, roughness: 0.4 });
  box(1.5, 0.08, 2.4, wood, 0, 0.78, 0, g);
  for (const x of [-0.72, 0.72]) for (let k = 0; k < 3; k++) box(0.05, 0.08, 2.4, wood2, x, 0.92 + k * 0.16, 0, g);   // barandas de tablas
  for (const x of [-0.7, -0.2, 0.3, 0.7]) box(0.05, 0.45, 0.05, wood2, x, 1.0, -1.18, g);
  for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(s * 0.86, 0.4, -0.15); g.add(w);
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.09, 10, 22), tire); t.rotation.y = Math.PI / 2; w.add(t);
    const r = cyl(0.22, 0.22, 0.14, rim, 0, 0, 0, w, 14); r.rotation.z = Math.PI / 2;
    // varas hacia el caballo
    const v = box(0.07, 0.07, 2.2, wood2, s * 0.42, 0.95, 2.1, g); v.rotation.x = -0.1;
  }
  box(1.0, 0.06, 0.06, wood2, 0, 0.82, 1.2, g);
  // carga: cartones atados, bolsón, botellas, chapa
  const cart = mapTex(128, 128, (c, w, h) => { c.fillStyle = '#b08a5a'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 6) { c.fillStyle = 'rgba(80,55,30,0.35)'; c.fillRect(x, 0, 2, h); } c.fillStyle = '#d8c8a0'; c.fillRect(0, h * 0.45, w, 10); c.fillStyle = 'rgba(40,30,20,0.6)'; c.font = '20px Arial'; c.fillText('FRÁGIL', 20, 40); });
  const cm = new THREE.MeshStandardMaterial({ map: cart, roughness: 1 });
  for (let i = 0; i < 9; i++) { const b = box(rand(0.5, 0.8), rand(0.25, 0.45), rand(0.4, 0.7), cm, rand(-0.4, 0.4), 1.0 + (i % 3) * 0.32, -0.8 + Math.floor(i / 3) * 0.6, g); b.rotation.y = rand(-0.3, 0.3); }
  sph(0.5, 0.55, 0.5, mat(0xe8e8e0, { roughness: 0.95 }), 0.1, 1.5, 0.75, g);                        // bolsón
  for (let i = 0; i < 6; i++) cyl(0.04, 0.04, 0.26, mat(pick([0x3a8a3a, 0x8ac0e0, 0xe8e8e8]), { transparent: true, opacity: 0.75, roughness: 0.1 }), rand(-0.5, 0.5), 1.22, rand(0.3, 1.0), g, 8);
  const ch = box(0.9, 0.03, 0.7, mat(0x8a8e92, { metalness: 0.6, roughness: 0.5 }), -0.2, 1.65, -0.3, g); ch.rotation.z = 0.2;
  const sTex = mapTex(256, 96, (c, w, h) => { c.fillStyle = '#f2ead8'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1a1a'; c.font = "bold 26px 'Comic Sans MS', cursive"; c.textAlign = 'center'; c.fillText('COMPRO BOTELLAS', w / 2, 38); c.fillText('CARTÓN · METAL', w / 2, 74); });
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshStandardMaterial({ map: sTex, side: THREE.DoubleSide })); sg.position.set(0, 1.25, -1.24); sg.rotation.y = Math.PI; g.add(sg);
  // caballo entre las varas
  const hz = map24Horse(g); hz.g.position.set(0, 0, 2.95);
  // pila de cartones en la vereda que va juntando
  const pile = new THREE.Vector3(-19.6, 0, 27.4);
  for (let i = 0; i < 5; i++) { const b = box(rand(0.5, 0.8), 0.12, rand(0.4, 0.7), cm, pile.x + rand(-0.3, 0.3), 0.06 + i * 0.12, pile.z + rand(-0.2, 0.2), scene); b.rotation.y = rand(0, 3); }
  addObstacle(-12.15, 27.15, 5.9, 1.7);
  // el que junta
  const cfg = { name: 'El Cartonero', civil: true, top: 'remera', topColor: 0x4a5a3a, pants: 'jogging', skin: 0xb88968, hair: 'short', hairColor: 0x1a1008, cap: 0x8a2a1a, shoe: 0x3a3a3a };
  const prev = scene; setScene(plazaScene); const W = new Walker(cfg); setScene(prev);
  const b = W.body; b.pos.set(-15.6, 0, 25.9); b.facing = -Math.PI / 2;
  const caja = box(0.5, 0.3, 0.42, cm, 0, 0.95, 0.32, b.root); caja.visible = false;
  W.st = 'idle'; W.t = rand(2, 4); W.lineT = rand(10, 16);
  b.poseFn = (P) => {
    if (W.st === 'pick') { P.tX = 0.75; P.aL = P.aR = -1.0; P.eL = P.eR = -0.3; P.kL = P.kR = 0.5; P.lL = P.lR = -0.4; }
    else if (caja.visible) { P.aL = P.aR = -1.1; P.eL = P.eR = -1.3; P.aLz = 0.15; P.aRz = -0.15; }
    else if (W.st === 'watch') { P.aL = P.aR = -0.2; P.eL = P.eR = -2.2; P.aLz = 0.5; P.aRz = -0.5; }
  };
  W.react = (p, level) => { if (level >= 2 && Math.hypot(p.x - b.pos.x, p.z - b.pos.z) < 14 && Math.random() < 0.35) W.say(pick(['Uhh, otra vez estos...', '¡Cuidado con el caballo, eh!', 'Yo junto los cartones y me voy, ¿eh?', '¡Tranqui, Tormenta, tranqui!']), 2.2); };
  const H = MAP.horse = Object.assign(hz, { nerv: 0, eat: 0 });
  W.update = (dt) => {
    W.tickBark(dt); W.t -= dt; W.lineT -= dt;
    const c = fighters.length ? fightCenter() : null, near = c && Math.hypot(c.x - b.pos.x, c.z - b.pos.z) < 7 && gameState === 'fight';
    if (W.lineT <= 0) { W.lineT = rand(14, 22); if (gameState === 'fight') W.say(pick(['¿Tienen botellas? Compro.', 'Con esta luz no se ve nada...', 'Tormenta, quieta.']), 2); }
    if (near && W.st !== 'watch') { W.st = 'watch'; caja.visible = false; }
    if (W.st === 'watch') { if (!W.dodge(dt)) { b.curSpeed = 0; W.face(c.x, c.z, dt); } if (!near) { W.st = 'idle'; W.t = 1; } }
    else if (W.st === 'idle') { b.curSpeed = 0; W.face(-12, 27.15, dt); if (W.t <= 0) W.st = 'go'; }
    else if (W.st === 'go') { if (W.moveTo(pile.x + 0.6, pile.z - 0.7, 1.4, dt)) { W.st = 'pick'; W.t = 1.4; } }
    else if (W.st === 'pick') { b.curSpeed = 0; W.face(pile.x, pile.z, dt); if (W.t <= 0) { caja.visible = true; W.st = 'back'; } }
    else if (W.st === 'back') { if (W.moveTo(-15.6, 25.9, 1.2, dt)) { caja.visible = false; W.st = 'idle'; W.t = rand(5, 9); sfx('pickup', 0.25 * distVol(b.pos.x, b.pos.z)); } }
    b.root.position.copy(b.pos); b.animate(dt);
  };
  npcs.push(W);
  // animación del caballo: come, mueve la cola, cambia de pata; si hay bardo cerca, se pone nervioso
  MAP.upd.push(dt => {
    const c = fighters.length && gameState === 'fight' ? fightCenter() : null;
    const dc = c ? Math.hypot(c.x - (C.x + 2.95), c.z - C.z) : 99;
    H.nerv = Math.max(0, H.nerv - dt * 0.4); if (dc < 6 && MAP.level >= 2) H.nerv = Math.min(1, H.nerv + dt * 1.5);
    const t = worldT, n = H.nerv;
    H.eat = (Math.sin(t * 0.21) > 0.55 && n < 0.2) ? Math.min(1, H.eat + dt) : Math.max(0, H.eat - dt * 1.5);
    H.neck.rotation.x = 0.62 + H.eat * 0.9 - n * 0.35 + Math.sin(t * 1.3) * 0.03 + (n > 0.5 ? Math.sin(t * 9) * 0.12 : 0);
    H.head.rotation.x = -H.eat * 0.4;
    H.tail.rotation.z = Math.sin(t * (2.2 + n * 6)) * (0.25 + n * 0.3); H.tail.rotation.x = 0.1 + n * 0.5;
    const shift = Math.sin(t * 0.15) > 0.3 ? 1 : 0;   // descansa una pata de atrás
    H.legs[3].up.rotation.x = shift * -0.05; H.legs[3].kn.rotation.x = shift * 0.35;
    if (n > 0.6) { H.legs[0].up.rotation.x = -Math.max(0, Math.sin(t * 7)) * 0.5; H.legs[0].kn.rotation.x = Math.max(0, Math.sin(t * 7)) * 0.9; }
    else { H.legs[0].up.rotation.x *= 0.9; H.legs[0].kn.rotation.x *= 0.9; }
    H.body.position.y = 1.18 + Math.sin(t * 1.6) * 0.006;
    if (n > 0.7 && AC && Math.random() < dt * 0.4) { noise(0.35, 700, 0.25 * distVol(C.x, C.z), 'bandpass', 3); tone('sawtooth', 420, 260, 0.45, 0.04 * distVol(C.x, C.z), 0.05); }   // relincho
  });
}
// ---------- 8. patrullero (pickup blanca y azul): pasa despacio, mira y sigue de largo ----------
function map24Patrol() {
  const g = new THREE.Group(); g.visible = false; scene.add(g);
  const white = mat(0xf2f4f6, { roughness: 0.35, metalness: 0.3 }), blue = mat(0x1f4fa8, { roughness: 0.4, metalness: 0.3 }), black = mat(0x15161a, { roughness: 0.6 }), glass = mat(0x1a2430, { roughness: 0.08, metalness: 0.8 });
  const dTex = mapTex(512, 128, (c, w, h) => { c.fillStyle = '#f2f4f6'; c.fillRect(0, 0, w, h); c.fillStyle = '#1f4fa8'; c.fillRect(0, 50, w, 40); c.fillStyle = '#f2f4f6'; c.font = "bold 34px Arial"; c.textAlign = 'center'; c.fillText('POLICÍA', w * 0.35, 82); c.fillStyle = '#1f4fa8'; c.font = "bold 26px Arial"; c.fillText('MÓVIL 214', w * 0.75, 38); });
  const side = new THREE.MeshStandardMaterial({ map: dTex, roughness: 0.35, metalness: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.62, 5.1), [side, side, white, black, white, white]); body.position.y = 0.78; body.castShadow = true; g.add(body);
  box(1.8, 0.62, 2.05, white, 0, 1.39, 0.55, g);                             // cabina doble
  box(1.82, 0.42, 1.95, glass, 0, 1.43, 0.55, g, false);
  const ws = box(1.7, 0.5, 0.06, glass, 0, 1.38, 1.62, g, false); ws.rotation.x = -0.45;
  box(1.84, 0.12, 1.4, blue, 0, 1.14, 1.95, g);                              // capó
  box(1.9, 0.26, 0.2, black, 0, 0.55, 2.6, g); box(1.9, 0.26, 0.2, black, 0, 0.55, -2.6, g);   // paragolpes
  for (const z of [-1.1, -2.4]) box(0.06, 0.32, z === -1.1 ? 0.06 : 1.3, white, 0, 1.25, z === -1.1 ? -0.5 : -1.8, g, false);
  for (const s of [-1, 1]) box(0.06, 0.3, 2.3, white, s * 0.9, 1.22, -1.55, g, false);                       // caja
  const rb = new THREE.Group(); rb.position.set(0, 1.75, -0.55); g.add(rb);                                  // barra antivuelco
  for (const s of [-1, 1]) box(0.06, 0.6, 0.06, black, s * 0.85, -0.25, 0, rb); box(1.76, 0.06, 0.06, black, 0, 0.05, 0, rb);
  const red = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff2020, emissiveIntensity: 0 }), blu = new THREE.MeshStandardMaterial({ color: 0x000a40, emissive: 0x2050ff, emissiveIntensity: 0 });
  const bar = new THREE.Group(); bar.position.set(0, 1.76, 0.5); g.add(bar);
  box(1.3, 0.12, 0.3, black, 0, 0, 0, bar); box(0.6, 0.12, 0.3, red, -0.33, 0.08, 0, bar, false); box(0.6, 0.12, 0.3, blu, 0.33, 0.08, 0, bar, false);
  const LR = new THREE.PointLight(0xff2020, 0, 16, 1.4), LB = new THREE.PointLight(0x2050ff, 0, 16, 1.4); LR.position.set(-0.4, 2.1, 0.5); LB.position.set(0.4, 2.1, 0.5); g.add(LR, LB);
  const head = mat(0xfff8e0, { emissive: 0xfff2c0, emissiveIntensity: 2 });
  for (const s of [-1, 1]) { box(0.36, 0.14, 0.06, head, s * 0.66, 0.92, 2.7, g, false); box(0.3, 0.12, 0.06, mat(0x600000, { emissive: 0xff2010, emissiveIntensity: 1.5 }), s * 0.72, 0.92, -2.7, g, false); glow(s * 0.66, 0.92, 2.9, 0xfff2c0, 1.6, g); }
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 8), new THREE.MeshBasicMaterial({ map: glowTex, color: 0x8a8060, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 })); beam.rotation.x = -Math.PI / 2; beam.position.set(0, 0.05, 6.4); g.add(beam);
  const wheels = [];
  for (const [x, z] of [[-0.9, 1.65], [0.9, 1.65], [-0.9, -1.55], [0.9, -1.55]]) {
    const w = new THREE.Group(); w.position.set(x, 0.42, z); g.add(w);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 18), black); t.rotation.z = Math.PI / 2; w.add(t);
    const r = cyl(0.25, 0.25, 0.32, mat(0xb8bcc2, { metalness: 0.8, roughness: 0.3 }), 0, 0, 0, w, 10); r.rotation.z = Math.PI / 2;
    for (let k = 0; k < 3; k++) { const sp = box(0.33, 0.06, 0.4, mat(0x6a6e74, { metalness: 0.8 }), 0, 0, 0, w, false); sp.rotation.x = k * Math.PI / 3; }
    wheels.push(w);
  }
  g.traverse(o => { if (o.isMesh && o.material !== beam.material) o.castShadow = true; });
  const P = MAP.patrol = { g, LR, LB, red, blu, wheels, mode: 'off', x: 0, dir: 1, v: 0, cd: 35, t: 0, stopX: 0, said: 0, parked: false };
  const LANE = 24.3;
  function npcSay(cls, txt) { const n = npcs.find(k => k instanceof cls && !k.hidden && k.body.root.visible); if (n) n.say(txt, 2.4); return !!n; }
  MAP.upd.push(dt => {
    P.cd -= dt;
    // la policía "oficial" de los 3 minutos llega en este mismo móvil
    if (gameState === 'police' && P.mode !== 'police') { P.mode = 'police'; P.dir = 1; P.x = -40; P.v = 11; P.stopX = clamp(fightCenter().x, -12, 12); g.visible = true; P.parked = false; }
    if (P.mode === 'off' && gameState === 'fight' && P.cd <= 0 && MAP.level >= 2 && Math.random() < dt * 0.25) {
      P.mode = 'pass'; P.dir = Math.random() < 0.5 ? 1 : -1; P.x = -42 * P.dir; P.v = 9; P.stopX = clamp(fightCenter().x, -14, 14); P.said = 0; g.visible = true; P.cd = rand(60, 95);
      if (AC) { tone('square', 700, 980, 0.18, 0.05); tone('square', 980, 700, 0.18, 0.05, 0.2); }   // "bloop" corto, sin sirena
    }
    if (P.mode === 'off') { if (g.visible) g.visible = false; LR.intensity = LB.intensity = 0; red.emissiveIntensity = blu.emissiveIntensity = 0; return; }
    P.t += dt;
    const ahead = P.x + P.dir * 3.4, toStop = (P.stopX - P.x) * P.dir;
    let target = P.mode === 'police' ? (P.parked ? 0 : toStop > 6 ? 10 : Math.max(0, toStop * 1.6)) : (toStop > 7 ? 9 : toStop > -1 ? 2.2 : (P.t - (P.slowT || 0) > 1.8 ? 10 : 1.2));
    if (P.mode === 'pass' && toStop <= -1 && !P.slowT) P.slowT = P.t;
    // frena si hay alguien parado delante
    for (const f of fighters.concat(npcs.map(n => n.body))) if (f && f.root && f.root.visible && Math.abs(f.pos.z - LANE) < 1.6 && (f.pos.x - P.x) * P.dir > 0 && (f.pos.x - P.x) * P.dir < 4.2) target = 0;
    P.v += (target - P.v) * Math.min(1, dt * (target < P.v ? 3.5 : 1.2));
    P.x += P.v * P.dir * dt;
    if (P.mode === 'police' && toStop < 0.3) P.parked = true;
    g.position.set(P.x, 0, LANE); g.rotation.y = P.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    for (const w of P.wheels) w.rotation.x += P.v * dt / 0.42;
    const on = Math.floor(worldT * 7) % 2 === 0;
    red.emissiveIntensity = on ? 3 : 0.2; blu.emissiveIntensity = on ? 0.2 : 3; LR.intensity = on ? 3.2 : 0; LB.intensity = on ? 0 : 3.2;
    // los del barrio reaccionan
    if (P.mode === 'pass') {
      if (P.said === 0 && Math.abs(P.x - P.stopX) < 9) { P.said = 1; npcSay(Chusma, '¡ACÁÁÁ! ¡ACÁ ES, OFICIAL!'); const f = pick(fighters.filter(k => k.alive)); if (f) f.say(pick(['¡La yuta!', 'Uh... la cana.']), 1.6); }
      if (P.said === 1 && (P.x - P.stopX) * P.dir > 8) { P.said = 2; npcSay(Chusma, '¡MARTAAAA, SE FUERON!'); npcSay(Filmador, 'Nooo... siguieron de largo. Siempre lo mismo.'); }
      if (Math.abs(P.x) > 45) { P.mode = 'off'; P.slowT = 0; }
    } else if (P.mode === 'police' && gameState !== 'police') { P.mode = 'pass'; P.parked = false; P.said = 2; P.stopX = P.x - P.dir * 20; P.slowT = P.t - 2; }
  });
}
// ---------- 9. la pelota del potrero ----------
function map24Ball() {
  const tex = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#f4f4ee'; c.fillRect(0, 0, w, h); c.fillStyle = '#151515';
    for (let i = 0; i < 12; i++) { const x = (i % 6) * 44 + (i > 5 ? 22 : 0), y = i > 5 ? 92 : 36; c.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283 - 1.57; c.lineTo(x + Math.cos(a) * 15, y + Math.sin(a) * 15); } c.fill(); }
    c.fillStyle = 'rgba(80,60,30,0.25)'; for (let i = 0; i < 200; i++) c.fillRect(rand(0, w), rand(0, h), 2, 2); });
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 12), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })); m.castShadow = true; scene.add(m);
  const B = MAP.ball = { m, p: new THREE.Vector3(0.8, 0.11, -17.5), v: new THREE.Vector3(), cd: 0 };
  const tmp = new THREE.Vector3(), ax = new THREE.Vector3(), q = new THREE.Quaternion(), R = 0.11;
  MAP.upd.push(dt => {
    B.cd -= dt;
    if (gameState === 'walkin') { B.p.set(0.8, R, -17.5); B.v.set(0, 0, 0); }
    // la patean al pasar, o de verdad si tiran una patada cerca
    if (B.cd <= 0) for (const f of fighters.concat(npcs.map(n => n.body))) {
      if (!f || !f.root || !f.root.visible) continue;
      const dx = B.p.x - f.pos.x, dz = B.p.z - f.pos.z, d = Math.hypot(dx, dz);
      const kicking = f.state === 'attack' && f.attack && /kick/.test(f.attack.type) && d < 1.4;
      if (d < 0.55 + R && (f.curSpeed > 0.6 || kicking) || kicking) {
        const nx = dx / (d || 1), nz = dz / (d || 1), sp = kicking ? 11 : f.curSpeed * 1.35 + 1.2;
        B.v.set(nx * sp, kicking ? 4.5 : (f.curSpeed > 5 ? 2.2 : 0.6), nz * sp); B.cd = 0.25;
        if (AC) noise(0.07, 380, 0.3 * distVol(B.p.x, B.p.z), 'lowpass');
        if (kicking && Math.random() < 0.4) f.say(pick(['¡GOOOL!', '¡Al ángulo!', '¡Tomá, Maradona!']), 1.4);
        break;
      }
    }
    // el perro la persigue
    if (typeof dog !== 'undefined' && dog && dog.state === 'wander' && B.v.length() > 2.5) dog.goal = new THREE.Vector3(B.p.x, 0, B.p.z);
    B.v.y -= 9.8 * dt; tmp.copy(B.p); B.p.addScaledVector(B.v, dt);
    if (B.p.y < R) { B.p.y = R; if (B.v.y < -1) { B.v.y = -B.v.y * 0.5; if (AC && B.v.y > 1.2) noise(0.05, 300, 0.12 * distVol(B.p.x, B.p.z), 'lowpass'); } else B.v.y = 0; }
    const ground = B.p.y <= R + 0.01, fr = Math.exp(-dt * (ground ? 1.1 : 0.15)); B.v.x *= fr; B.v.z *= fr;
    // rebota contra las cosas y los bordes
    const before = B.p.clone(); collideObstacles(B.p, R);
    const push = B.p.clone().sub(before); push.y = 0;
    if (push.lengthSq() > 1e-8) { push.normalize(); const vn = B.v.x * push.x + B.v.z * push.z; if (vn < 0) { B.v.x -= 1.7 * vn * push.x; B.v.z -= 1.7 * vn * push.z; } }
    if (Math.abs(B.p.x) > BOUNDS.x) { B.p.x = Math.sign(B.p.x) * BOUNDS.x; B.v.x *= -0.6; }
    if (Math.abs(B.p.z) > BOUNDS.z) { B.p.z = Math.sign(B.p.z) * BOUNDS.z; B.v.z *= -0.6; }
    if (!isFinite(B.p.x)) { B.p.set(0.8, R, -17.5); B.v.set(0, 0, 0); }
    m.position.copy(B.p);
    const sp = Math.hypot(B.v.x, B.v.z); if (sp > 0.01 && ground) { ax.set(B.v.z, 0, -B.v.x).normalize(); q.setFromAxisAngle(ax, sp * dt / R); m.quaternion.premultiply(q); }
  });
}
// ---------- 10. vecinos que se asoman por las ventanas cuando se arma ----------
function map24Windows() {
  const person = mapTex(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(14,10,8,0.92)'; c.beginPath(); c.arc(64, 46, 20, 0, 7); c.fill();
    c.beginPath(); c.moveTo(22, 128); c.quadraticCurveTo(26, 74, 64, 70); c.quadraticCurveTo(102, 74, 106, 128); c.fill(); });
  const curtain = mapTex(64, 128, (c, w, h) => { const g2 = c.createLinearGradient(0, 0, w, 0); g2.addColorStop(0, '#8a3a3a'); g2.addColorStop(0.5, '#b85a4a'); g2.addColorStop(1, '#8a3a3a'); c.fillStyle = g2; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = 0; x < w; x += 10) c.fillRect(x, 0, 3, h); });
  const lit = mat(0xffc477, { emissive: 0xffa040, emissiveIntensity: 1.1 });
  const cand = [];
  plazaScene.updateMatrixWorld(true);
  plazaScene.traverse(o => {
    if (!o.isMesh || o.geometry !== BOX) return;
    if (Math.abs(o.scale.x - 1.3) > 0.01 || Math.abs(o.scale.y - 1.0) > 0.01 || Math.abs(o.scale.z - 0.06) > 0.01) return;
    const p = o.getWorldPosition(new THREE.Vector3()); if (p.y > 5) return;
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(o.getWorldQuaternion(new THREE.Quaternion()));
    if (n.dot(p.clone().negate().setY(0).normalize()) < 0.6) return;   // tiene que mirar a la plaza
    cand.push({ o, p, n, d: Math.hypot(p.x, p.z) });
  });
  cand.sort((a, b) => a.d - b.d);
  const W = MAP.windows = [];
  for (const c of cand.slice(0, 18)) {
    const pp = c.p.clone().addScaledVector(c.n, 0.045);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.85), new THREE.MeshBasicMaterial({ map: person, transparent: true, depthWrite: false }));
    s.geometry.translate(0, 0.425, 0); s.position.copy(pp).setY(c.p.y - 0.5); s.lookAt(pp.clone().add(c.n).setY(c.p.y - 0.5)); s.scale.y = 0.001; s.renderOrder = 3; scene.add(s);
    const cu = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.98), new THREE.MeshStandardMaterial({ map: curtain, roughness: 1 }));
    cu.position.copy(pp).addScaledVector(c.n, 0.005); cu.lookAt(cu.position.clone().add(c.n)); scene.add(cu);
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), c.n).normalize();
    W.push({ o: c.o, s, cu, right, base: pp.clone(), orig: c.o.material, up: 0, t: rand(0, 5), on: false, lineT: rand(2, 8) });
    cu.position.addScaledVector(right, -0.48);
  }
  MAP.upd.push(dt => {
    const L = MAP.level;
    for (const w of W) {
      w.t -= dt;
      if (!w.on && w.t <= 0 && L >= 1 && gameState === 'fight' && Math.random() < dt * (L === 1 ? 0.05 : L === 2 ? 0.15 : 0.35)) {
        w.on = true; w.t = rand(4, 10); if (w.o.material !== lit) { w.o.material = lit; }       // prende la luz
      }
      if (w.on && w.t <= 0) { w.on = false; w.t = rand(6, 14); }
      w.up += ((w.on ? 1 : 0) - w.up) * Math.min(1, dt * 3);
      w.s.scale.y = Math.max(0.001, w.up); w.s.visible = w.up > 0.01;
      w.cu.position.copy(w.base).addScaledVector(w.right, -0.48 + w.up * 0.15).addScaledVector(w.cu.getWorldDirection(new THREE.Vector3()), 0.005);
      if (w.on && w.up > 0.9) { w.lineT -= dt; if (w.lineT <= 0) { w.lineT = rand(8, 16); if (Math.random() < 0.5) popText(w.base.clone().setY(w.base.y + 0.6), pick(['¡CALLENSEEE!', '¡Vayan a pelear a otro lado!', '¡Ya llamé a la policía!', '¡Mañana trabajo, eh!', '¡Rubén, entrá a tu casa!', '¡Uhhh, qué piña!']), 'warn', 1.8); } }
      if (gameState === 'menu' && w.o.material !== w.orig && !w.on) w.o.material = w.orig;
    }
  });
}
// ---------- 11. detalles: grafitis, cables con zapatillas, canastos, carteles de calle ----------
function map24Details() {
  // grafitis en los frentes (lejos de puertas y ventanas)
  const G = [['LA PAR', '#5ad1ff', -18.9, -29.47, 0], ['AGUANTE EL BARRIO', '#ff3a6a', 9.6, -29.47, 0], ['B° LAS ACACIAS', '#ffd23a', 28.6, -29.47, 0],
             ['IMPAR GIL', '#7aff6a', -12.6, 30.47, Math.PI], ['TE AMO VALE ♥', '#ff6ad8', 15.9, 30.47, Math.PI],
             ['NO SE FÍA', '#ffffff', 29.97, -10.9, -Math.PI / 2], ['LOS PIBES', '#ffa03a', 29.97, 17.6, -Math.PI / 2], ['ACÁ NO', '#5ad1ff', -29.97, -23.6, Math.PI / 2], ['RUBÉN GIL', '#ff3a3a', -29.97, 14.4, Math.PI / 2]];
  for (const [t, c, x, z, ry] of G) decal(sprayText(t, c, 512, 160), 1.9, 0.6, x, 0.78, z, ry);
  // cables cruzando la calle con un par de zapatillas colgadas
  const poste = mat(0x5a4632, { roughness: 0.95 });
  const zap = (p) => { const g = new THREE.Group(); g.position.copy(p); scene.add(g);
    for (const s of [-1, 1]) { const z1 = new THREE.Group(); z1.position.set(s * 0.09, -0.32 - (s > 0 ? 0.06 : 0), 0); z1.rotation.z = s * 0.25; g.add(z1);
      box(0.1, 0.09, 0.27, mat(0xf2f2ee, { roughness: 0.6 }), 0, 0, 0.03, z1); box(0.11, 0.025, 0.29, mat(0xc8302a), 0, -0.055, 0.03, z1); box(0.008, 0.32, 0.008, mat(0xf2f2ee), -s * 0.04, 0.16, -0.02, z1, false); }
    MAP.upd.push(() => { g.rotation.z = Math.sin(worldT * 1.3 + p.x) * 0.12; g.rotation.x = Math.sin(worldT * 0.9) * 0.08; }); };
  for (const [a, b] of [[[14, -22.0], [14, -29.0]], [[17.9, 12.6], [27.0, 12.6]], [[-17.9, -8.2], [-27.0, -8.2]]]) {
    for (const [x, z] of [a, b]) { cyl(0.11, 0.14, 7.2, poste, x, 3.6, z, scene, 8); box(1.0, 0.08, 0.08, poste, x, 6.8, z, scene); if (Math.abs(x) < 25.3 && Math.abs(z) < 27.3) addObstacle(x, z, 0.3, 0.3); }
    for (const dy of [6.7, 6.35]) wire(new THREE.Vector3(a[0], dy, a[1]), new THREE.Vector3(b[0], dy, b[1]), 0.55);
    zap(new THREE.Vector3((a[0] + b[0]) / 2, 6.7 - 0.55, (a[1] + b[1]) / 2));
  }
  // canastos de basura en la vereda, con bolsas (y una rota en el piso)
  const metal = mat(0x2a2a2e, { metalness: 0.6, roughness: 0.5 });
  for (const [x, z] of [[27.0, -18.5], [-27.0, -11.5], [6.5, 29.0], [-23.0, -28.8], [27.0, 20.5]]) {
    cyl(0.04, 0.04, 1.2, metal, x, 0.6, z, scene, 6);
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.5, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.6, wireframe: true })); k.position.set(x, 1.45, z); scene.add(k);
    for (let i = 0; i < 3; i++) sph(0.2, 0.18, 0.2, mat(0x101012, { roughness: 0.3 }), x + rand(-0.15, 0.15), 1.4 + i * 0.12, z + rand(-0.15, 0.15), scene);
    sph(0.22, 0.14, 0.25, mat(0x101012, { roughness: 0.3 }), x + 0.5, 0.12, z + 0.3, scene);
    for (let i = 0; i < 4; i++) { const p = plane(rand(0.15, 0.3), rand(0.15, 0.3), mat(pick([0xe8e4d8, 0xd8402a, 0xf2c440]), { side: THREE.DoubleSide }), x + rand(0.2, 1.1), 0.03, z + rand(-0.4, 0.8)); p.rotation.z = rand(0, 3); }
  }
  // carteles con el nombre de las calles en las esquinas
  const st = (txt) => mapTex(256, 64, (c, w, h) => { c.fillStyle = '#1f4fa8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f2f2ee'; c.lineWidth = 4; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#f2f2ee'; c.font = "bold 30px Arial"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 2); });
  const NS = ['LAS ACACIAS', 'LOS PARAÍSOS'], EW = ['PASAJE 14', 'GRAL. GÜEMES'];
  for (const [x, z] of [[-18.5, -22.5], [18.5, -22.5], [-18.5, 22.5], [18.5, 22.5]]) {
    const m1 = new THREE.MeshStandardMaterial({ map: st(z < 0 ? EW[0] : EW[1]), side: THREE.DoubleSide }), m2 = new THREE.MeshStandardMaterial({ map: st(x < 0 ? NS[0] : NS[1]), side: THREE.DoubleSide });
    const a = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), m1); a.position.set(x, 3.0, z); scene.add(a);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), m2); b.position.set(x, 3.35, z); b.rotation.y = Math.PI / 2; scene.add(b);
  }
}
// ---------- 12. la cámara: lo que tapa al jugador se vuelve transparente ----------
function map24Occluders() {
  const skip = new Set();
  for (const n of npcs) if (n.body && n.body.root) n.body.root.traverse(o => skip.add(o));
  if (typeof dog !== 'undefined' && dog && dog.root) dog.root.traverse(o => skip.add(o));
  const tmpB = new THREE.Box3();
  plazaScene.updateMatrixWorld(true);
  plazaScene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || skip.has(o) || !o.visible) return;
    if (o.material && (o.material.blending === THREE.AdditiveBlending || Array.isArray(o.material))) return;
    tmpB.setFromObject(o); const s = tmpB.getSize(new THREE.Vector3());
    if (s.y < 1.3 || tmpB.max.y < 1.6) return;          // solo cosas altas: paredes, postes, árboles, carteles
    if (s.x > 30 || s.z > 30) return;
    MAP.occ.push(o);
  });
  const ray = new THREE.Raycaster(), faded = new Map(); let tick = 0;
  MAP.upd.push(dt => {
    tick -= dt;
    const active = player && (gameState === 'fight' || gameState === 'roundEnd' || gameState === 'intro' || gameState === 'police');
    if (tick <= 0) {
      tick = 0.08;
      const now = new Set();
      if (active) {
        for (const yOff of [1.0, 1.7]) {
          const tgt = player.pos.clone().setY(yOff), dir = tgt.clone().sub(camera.position), dist = dir.length();
          ray.set(camera.position, dir.normalize()); ray.far = dist - 0.4;
          for (const h of ray.intersectObjects(MAP.occ, false)) now.add(h.object);
        }
      }
      for (const o of now) if (!faded.has(o)) { const orig = o.material, fm = orig.clone(); fm.transparent = true; fm.depthWrite = false; fm.opacity = 1; o.material = fm; faded.set(o, { orig, fm, a: 1, want: 0.22 }); }
      for (const [o, f] of faded) f.want = now.has(o) ? 0.22 : 1;
    }
    for (const [o, f] of faded) {
      f.a += (f.want - f.a) * Math.min(1, dt * 10); f.fm.opacity = f.a;
      if (f.want === 1 && f.a > 0.97) { o.material = f.orig; f.fm.dispose(); faded.delete(o); }
    }
  });
}
// ---------- arranque y actualización ----------
function map24Build() {
  if (MAP.built) return; MAP.built = true;
  const prev = scene; setScene(plazaScene);
  try { map24Cleanup(); } catch (e) { console.warn('mapa: limpieza', e); }
  for (const [n, fn] of [['luces', map24Lights], ['pizzería', map24Pizzeria], ['cumbia', map24Cumbia], ['cartonero', map24Cartonero], ['patrullero', map24Patrol], ['pelota', map24Ball], ['detalles', map24Details], ['ventanas', map24Windows], ['cámara', map24Occluders]]) {
    try { fn(); } catch (e) { console.warn('mapa: ' + n, e); }
  }
  // el del celular avisa cuando aparece un cuchillo
  let knifeT = 0;
  MAP.upd.push(dt => {
    knifeT -= dt; if (knifeT > 0 || gameState !== 'fight') return;
    const fil = npcs.find(n => n instanceof Filmador && n.state === 'film');
    if (fil && fighters.some(f => f.alive && f.weapon && (f.weapon.key === 'cuchillo' || f.weapon.key === 'facon') && f.state === 'attack')) { fil.say(pick(['¡Uhhh, sacó un cuchillo!', '¡Nooo, amigo, un cuchillo!']), 2.2); knifeT = 25; }
  });
  setScene(prev);
}
function map24Update(dt) {
  if (!MAP.built) return;
  MAP.chaos = Math.max(0, MAP.chaos - dt * (gameState === 'fight' ? 0.22 : 1.2));
  MAP.level = chaosLevel();
  for (const u of MAP.upd) u(dt);
}
map24Build();
window.__MAP = MAP;


// ============================================================
