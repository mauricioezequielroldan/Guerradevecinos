// MAPA 2: TROFI CAMBIO — boliche sobre la colectora de la Panamericana
// Se pelea afuera: vereda, colectora y cantero. Patovicas en la puerta, fila de gente, autos que pasan
// (y te llevan puesto), una Amarok, el limpiavidrios del semáforo, el vivero y la concesionaria.
// Coordenadas: la fachada mira a +Z (z = -10); la colectora corre en X entre z = -6 y z = 2;
// el cantero va de z = 2 a 5 y la Panamericana (no se puede pisar) de z = 5 a 16.
// ============================================================
const TROFI = window.__TROFI = { built: false, scene: null, cars: [], hiway: [], npcs: [], crowd: [], lampLights: [], neon: [], t: 0, light: 'green', lightT: 0,
  saved: null, bounds: { x: 26, z: 10.2 }, spots: [] };
let CUR_MAP = 'plaza';
function trofiMat(c, o) { return mat(c, Object.assign({ roughness: 0.85 }, o || {})); }
function trofiSignTex(text, sub) {
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#111317'; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = '#ff3fb4'; g.shadowBlur = 28; g.fillStyle = '#fff4fb';
    g.font = "bold 150px 'Arial Black', Impact, sans-serif"; g.fillText(text, w / 2, h * 0.42, w - 40);
    g.shadowColor = '#3fd8ff'; g.shadowBlur = 18; g.fillStyle = '#bff4ff';
    g.font = "bold 46px Arial, sans-serif"; g.fillText(sub, w / 2, h * 0.84, w - 80);
  });
}
function trofiCar(color, kind) {   // autos con más forma: capó, techo, vidrios, llantas, faros que brillan
  const g = new THREE.Group(), body = trofiMat(color, { roughness: 0.28, metalness: 0.55 }), dark = trofiMat(0x0a0c10, { roughness: 0.08, metalness: 0.7 });
  const pick_ = kind === 'amarok', suv = kind === 'suv', van = kind === 'van';
  const L = pick_ ? 5.25 : van ? 5.6 : suv ? 4.25 : 4.4, W = pick_ ? 1.95 : van ? 2.05 : 1.8, H = van ? 2.2 : 0;
  if (van) {   // camión chico de reparto (como el de la foto): cabina y caja con lona
    box(1.6, 1.5, W, body, L / 2 - 0.8, 1.25, 0, g); box(1.5, 0.7, W * 0.94, dark, L / 2 - 0.75, 1.55, 0, g, false);
    box(L - 1.7, 2.1, W + 0.1, trofiMat(0x2a5ab8, { roughness: 0.9 }), -0.85, 1.65, 0, g);
  } else {
    box(L, 0.62, W, body, 0, 0.66, 0, g);
    const hood = box(L * 0.24, 0.12, W * 0.96, body, L * 0.36, 0.98, 0, g); hood.rotation.z = -0.08;
    const cabL = pick_ ? 2.55 : suv ? 2.55 : 2.15, cabX = pick_ ? 0.5 : suv ? -0.25 : -0.1;
    box(cabL, 0.6, W * 0.9, body, cabX, 1.27, 0, g);
    box(cabL * 1.0, 0.46, W * 0.92, dark, cabX, 1.28, 0, g, false);
    const ws = box(0.05, 0.5, W * 0.86, dark, cabX + cabL / 2 + 0.12, 1.22, 0, g, false); ws.rotation.z = 0.55;
    if (pick_) { box(1.95, 0.42, W * 0.98, body, -1.6, 1.12, 0, g); box(1.9, 0.06, W * 0.86, trofiMat(0x111214), -1.6, 1.1, 0, g, false);
      for (const sz of [-1, 1]) box(1.9, 0.06, 0.06, trofiMat(0x111214, { metalness: 0.6 }), -1.6, 1.36, sz * W * 0.47, g, false); }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = cyl(0.37, 0.37, 0.26, trofiMat(0x0e0e0e, { roughness: 0.95 }), sx * L * 0.32, 0.37, sz * W * 0.5, g, 18); w.rotation.x = Math.PI / 2;
    const r = cyl(0.22, 0.22, 0.28, trofiMat(0xb8bcc2, { metalness: 0.85, roughness: 0.3 }), sx * L * 0.32, 0.37, sz * W * 0.5, g, 12); r.rotation.x = Math.PI / 2;
  }
  const head = new THREE.MeshBasicMaterial({ color: 0xfff6d8 }), tail = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
  const lights = [];
  for (const sz of [-0.62, 0.62]) {
    box(0.06, 0.16, 0.34, head, L / 2 + 0.01, 0.78, sz * W * 0.62, g, false); box(0.06, 0.14, 0.3, tail, -L / 2 - 0.01, 0.86, sz * W * 0.62, g, false);
    const hs = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff0c8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.75 }));
    hs.position.set(L / 2 + 0.2, 0.78, sz * W * 0.62); hs.scale.set(1.1, 0.7, 1); g.add(hs);
    const ts = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff3020, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
    ts.position.set(-L / 2 - 0.15, 0.86, sz * W * 0.62); ts.scale.set(0.6, 0.45, 1); g.add(ts); lights.push(ts);
  }
  g.userData = { L, W, tails: lights };
  return g;
}
function trofiPerson(top, skin) {   // gente de la fila: figuras simples que se mueven (no pelean)
  const g = new THREE.Group(), s = trofiMat(skin), t = trofiMat(top), p = trofiMat(pick([0x1a1a22, 0x2e4058, 0x3a3030]));
  cyl(0.11, 0.1, 0.8, p, 0, 0.42, 0, g, 8); cyl(0.17, 0.14, 0.62, t, 0, 1.12, 0, g, 10); sph(0.12, 0.14, 0.12, s, 0, 1.6, 0, g);
  sph(0.125, 0.07, 0.125, trofiMat(pick([0x1a120c, 0x3a2414, 0x111111, 0xd8b060])), 0, 1.68, -0.01, g);
  for (const sx of [-1, 1]) { const a = cyl(0.045, 0.04, 0.58, t, sx * 0.21, 1.1, 0, g, 6); a.rotation.z = sx * 0.12; }
  return g;
}
function trofiLabel(text, w, h, bg, fg, font) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(512, Math.round(512 * h / w), (c, cw, ch) => { c.fillStyle = bg; c.fillRect(0, 0, cw, ch); c.fillStyle = fg; c.font = font || `bold ${Math.round(ch * 0.62)}px 'Arial Black', Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, cw / 2, ch * 0.54, cw - 16); }), transparent: true }));
}
function trofiAmaroki() {   // la camioneta cruzada en la vereda, con balizas
  const g = trofiCar(0xa8adb2, 'amarok');
  const back = trofiLabel('AMAROKI', 1.2, 0.2, 'rgba(0,0,0,0)', '#1a1a1a'); back.position.set(-g.userData.L / 2 - 0.02, 0.98, 0); back.rotation.y = -Math.PI / 2; g.add(back);
  for (const sz of [-1, 1]) { const sd = trofiLabel('AMAROKI V6', 1.3, 0.2, 'rgba(0,0,0,0)', '#222'); sd.position.set(-1.6, 1.05, sz * (g.userData.W / 2 + 0.01)); sd.rotation.y = sz > 0 ? 0 : Math.PI; g.add(sd); }
  return g;
}
function trofiGarbageTruck() {   // camión recolector municipal: cabina, compactadora, baliza y dos recolectores colgados
  const g = new THREE.Group(), white = trofiMat(0xe8e6de, { roughness: 0.5 }), orange = trofiMat(0xe8701a, { roughness: 0.5 }), dark = trofiMat(0x0a0c10, { roughness: 0.1, metalness: 0.6 });
  box(2.0, 2.2, 2.3, white, 3.0, 1.55, 0, g); box(1.9, 0.9, 2.2, dark, 3.1, 2.0, 0, g, false);
  box(5.6, 2.7, 2.4, orange, -0.9, 1.9, 0, g); box(5.4, 0.18, 2.42, white, -0.9, 1.0, 0, g);
  box(1.1, 2.4, 2.5, trofiMat(0x3a3a3c, { metalness: 0.5 }), -4.2, 1.75, 0, g);
  const lbl = trofiLabel('RECOLECCIÓN · MUNICIPIO', 4.2, 0.5, '#e8701a', '#ffffff'); for (const sz of [-1, 1]) { const l = lbl.clone(); l.position.set(-0.9, 2.3, sz * 1.21); l.rotation.y = sz > 0 ? 0 : Math.PI; g.add(l); }
  for (const x of [2.6, -0.4, -2.6]) for (const sz of [-1, 1]) { const w = cyl(0.5, 0.5, 0.36, trofiMat(0x0e0e0e), x, 0.5, sz * 1.15, g, 18); w.rotation.x = Math.PI / 2; }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffa020 })); beacon.position.set(3.0, 2.75, 0); g.add(beacon);
  const bl = new THREE.PointLight(0xffa020, 0, 9, 1.8); bl.position.copy(beacon.position); g.add(bl);
  for (const sz of [-0.7, 0.7]) { const p = trofiPerson(0xf0a020, 0xc68b62); p.scale.setScalar(0.95); p.position.set(-4.9, 0.25, sz); p.rotation.y = -Math.PI / 2; g.add(p); }
  g.userData = { L: 9.2, W: 2.4, beacon, bl, tails: [] };
  return g;
}
function trofiPanelTex(base, line, step) {   // paneles de chapa con juntas (fachada)
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},0.025)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.fillStyle = line; for (let x = 0; x < w; x += step) g.fillRect(x, 0, 2, h); for (let y = 0; y < h; y += step * 2) g.fillRect(0, y, w, 1);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);   // mugre abajo
  });
}
function trofiHalo(sc, x, y, z, color, s, op) {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op || 0.55, fog: false }));
  h.position.set(x, y, z); h.scale.set(s, s, 1); sc.add(h); return h;
}
function buildTrofi() {
  if (TROFI.built) return; TROFI.built = true;
  const sc = TROFI.scene = new THREE.Scene(), prev = scene; scene = sc; TROFI.obstStart = obstacles.length;
  sc.background = new THREE.Color(0x0a0f22); sc.fog = new THREE.Fog(0x0a0f22, 34, 110);
  sc.add(new THREE.HemisphereLight(0x6070b0, 0x2a2218, 0.6));
  const moon = new THREE.DirectionalLight(0xa0b4e8, 0.5); moon.position.set(-20, 34, 24); sc.add(moon, moon.target); TROFI.moon = moon;
  const X = 34;   // mitad del largo del mapa
  // ---------- piso con textura: vereda de hormigón, colectora de asfalto, cantero, Panamericana ----------
  const ground = (w, d, x, z, t, rx, ry, c, rough) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), texMat(t, rx, ry, { color: c || 0xffffff, roughness: rough || 0.9 })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0, z); m.receiveShadow = true; sc.add(m); return m; };
  ground(X * 2, 7, 0, -13.5, concreteTex, 34, 3.5, 0xb8b4ac);
  ground(X * 2, 8.4, 0, -2, asphaltTex, 30, 4, 0x6a6c70, 0.95);
  ground(X * 2, 3, 0, 3.7, grassTex, 30, 1.5, 0x6a8a5a);
  ground(X * 2, 11, 0, 10.7, asphaltTex, 30, 5, 0x5a5c60, 0.95);
  ground(X * 2, 26, 0, 29, grassTex, 30, 12, 0x4a6a3a);
  // parches, manchas de aceite y tapas de cloaca en la colectora
  const stain = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(8,8,10,0.55)'); gr.addColorStop(1, 'rgba(8,8,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.8, 2.2), rand(0.6, 1.6)), new THREE.MeshStandardMaterial({ map: stain, transparent: true, depthWrite: false, roughness: 0.25 })); m.rotation.x = -Math.PI / 2; m.rotation.z = rand(0, 3); m.position.set(rand(-X, X), 0.012, rand(-5.5, 1.6)); sc.add(m); }
  for (let i = 0; i < 6; i++) { const pt = box(rand(1.5, 3), 0.01, rand(0.8, 1.6), trofiMat(0x3a3c40, { roughness: 0.95 }), rand(-X + 4, X - 4), 0.011, rand(-5, 1), sc, false); pt.rotation.y = rand(-0.3, 0.3); }
  for (const x of [-18, 2, 21]) cyl(0.4, 0.4, 0.02, trofiMat(0x2a2a2a, { metalness: 0.6, roughness: 0.5 }), x, 0.012, -1.2, sc, 16);
  const lineM = new THREE.MeshBasicMaterial({ color: 0xd8d4c0 }), yel = new THREE.MeshBasicMaterial({ color: 0xd8b020 });
  for (let x = -X; x < X; x += 4) { box(2, 0.01, 0.14, lineM, x, 0.013, -2, sc, false); for (const z of [8, 13.4]) box(2.6, 0.01, 0.14, lineM, x, 0.013, z, sc, false); }
  box(X * 2, 0.01, 0.16, yel, 0, 0.013, 10.7, sc, false);
  box(X * 2, 0.2, 0.32, texMat(concreteTex, 30, 1, { color: 0xa8a8a2 }), 0, 0.1, -6.25, sc);       // cordón
  for (let x = -X; x < X; x += 2.2) box(0.1, 0.72, 0.1, trofiMat(0x9a9a9a, { metalness: 0.6 }), x, 0.36, 5.25, sc);
  box(X * 2, 0.3, 0.08, trofiMat(0xc0c0bc, { metalness: 0.75, roughness: 0.35 }), 0, 0.62, 5.25, sc);   // guardarraíl
  addObstacle(0, 5.4, X * 2, 0.4);                                                                        // no se puede cruzar a la Panamericana
  // ---------- el boliche: bloques con paneles, torre oscura, marquesina, reflectores ----------
  const panelGray = trofiPanelTex('#4a4c50', 'rgba(20,20,24,0.55)', 32), panelDark = trofiPanelTex('#2a2c30', 'rgba(0,0,0,0.6)', 18);
  box(16, 9, 8, texMat(panelGray, 4, 3, { roughness: 0.7, metalness: 0.15 }), 1, 4.5, -14.5, sc);
  box(4.6, 11.8, 8.4, texMat(panelDark, 2, 4, { roughness: 0.6, metalness: 0.25 }), 7.6, 5.9, -14.7, sc);
  box(9, 6, 8, texMat(revoqueTex, 3, 2, { color: 0x8a8c90 }), -11.5, 3, -14.5, sc);
  box(11, 3.8, 0.3, trofiMat(0x121317, { roughness: 0.55 }), 1.5, 1.9, -10.45, sc);
  box(2.3, 2.7, 0.32, trofiMat(0x08080a, { roughness: 0.25, metalness: 0.5 }), 1.2, 1.35, -10.4, sc);
  const doorLight = new THREE.PointLight(0xff4fb8, 0.9, 7, 1.8); doorLight.position.set(1.2, 3, -9.4); sc.add(doorLight); TROFI.neon.push(doorLight);
  trofiHalo(sc, 1.2, 2.9, -10.1, 0xff4fb8, 3.2, 0.35);
  // marquesina con estructura
  const truss = trofiMat(0x5a5c62, { metalness: 0.75, roughness: 0.35 });
  const marq = box(10, 0.25, 3.4, texMat(panelGray, 3, 1, { color: 0xb0b2b6 }), -11, 4.3, -9.6, sc); marq.rotation.x = -0.12;
  for (let x = -15.6; x <= -6.4; x += 1) { const b = box(0.06, 0.06, 3.2, truss, x, 4.08, -9.6, sc, false); b.rotation.x = -0.12; }
  for (const x of [-15.6, -6.4]) cyl(0.07, 0.07, 4.1, truss, x, 2.05, -8.1, sc, 8);
  // estructura de reflectores arriba, con haces de luz hacia el cielo
  box(14, 0.12, 0.12, truss, 1, 9.6, -10.4, sc); box(14, 0.12, 0.12, truss, 1, 10.4, -10.4, sc);
  for (let x = -6; x <= 8; x += 0.7) { const d = box(0.05, 0.85, 0.05, truss, x, 10, -10.4, sc, false); d.rotation.z = (Math.round(x / 0.7) % 2) ? 0.6 : -0.6; }
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xc8d8ff, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  TROFI.beams = [];
  for (let x = -5.5; x <= 7.5; x += 2.6) {
    cyl(0.14, 0.18, 0.28, trofiMat(0x111214), x, 9.35, -10.25, sc, 10); trofiHalo(sc, x, 9.3, -10.05, 0xfff0d0, 0.9, 0.8);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 24, 16, 1, true), beamMat); beam.position.set(x, 21.4, -10.2); beam.rotation.set(0.15, 0, (x % 2) * 0.1); sc.add(beam); TROFI.beams.push(beam);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.9), new THREE.MeshBasicMaterial({ map: trofiSignTex('TROFI CAMBIO', 'BAILABLE · VIERNES Y SÁBADOS'), toneMapped: false }));
  sign.position.set(1.4, 6.7, -10.42); sc.add(sign); TROFI.sign = sign; trofiHalo(sc, 1.4, 6.7, -10.2, 0xff4fb8, 8.5, 0.22);
  for (const [c, x] of [[0xff3fb4, -2], [0x3fd8ff, 5]]) { const l = new THREE.PointLight(c, 1.0, 10, 1.8); l.position.set(x, 6.4, -8.9); sc.add(l); TROFI.neon.push(l); }
  // detalles de fachada: equipos de aire, rejillas, afiches, grafitis en el bloque bajo
  for (const [x, y] of [[-14, 5.2], [-9, 5.2], [10.2, 7], [-3, 8.2]]) { box(0.9, 0.6, 0.45, trofiMat(0xb8b8b2, { roughness: 0.5 }), x, y, -10.3, sc); cyl(0.22, 0.22, 0.05, trofiMat(0x333333), x, y, -10.06, sc, 14).rotation.x = Math.PI / 2; }
  const poster = (txt, sub, x, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.8), new THREE.MeshStandardMaterial({ roughness: 0.8, map: canvasTex(128, 176, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = "bold 22px 'Arial Black'"; g.textAlign = 'center'; g.fillText(txt, w / 2, 60, w - 10); g.font = '14px Arial'; g.fillText(sub, w / 2, 100, w - 10); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, h - 30, w, 30); }) })); m.position.set(x, 1.6, -10.09); sc.add(m); };
  poster('SÁBADO', 'LOS PIBES DEL BARRIO · EN VIVO', -14.5, '#c8302a'); poster('2x1', 'HASTA LA 1 · CON ENTRADA', -12.8, '#2a4aa8'); poster('CUMBIA', 'TODA LA NOCHE', -9, '#7a2a8a');
  // vallas y la fila
  for (let x = -14.5; x <= -1.5; x += 1.1) { box(1.0, 0.05, 0.05, trofiMat(0xc0c0b8, { metalness: 0.6 }), x, 1.0, -8.6, sc, false); box(0.05, 1.0, 0.05, trofiMat(0xc0c0b8, { metalness: 0.6 }), x - 0.5, 0.5, -8.6, sc, false); }
  addObstacle(-8, -8.6, 13.5, 0.3);
  const tops = [0xd83a8a, 0x111111, 0xf0f0f0, 0x2a6ad0, 0xd8402a, 0xe8c040, 0x6a2a8a, 0x1a1a1a];
  for (let i = 0; i < 16; i++) { const p = trofiPerson(pick(tops), pick([0xd9a27a, 0xc68b62, 0x8a5a3a, 0xf0c8a8])); p.position.set(-14.2 + i * 0.82 + rand(-0.15, 0.15), 0, -9.4 + rand(-0.25, 0.2)); p.rotation.y = rand(-0.6, 0.6); sc.add(p); TROFI.crowd.push({ g: p, ph: rand(0, 6), y0: p.rotation.y }); }
  addObstacle(1, -14.6, 34, 8.6);
  // ---------- estacionados: Jeep blanco, hatch gris, el camión de reparto; y la AMAROKI cruzada ----------
  for (const [x, c, k] of [[-21, 0xeeeeec, 'suv'], [-16.4, 0x5a6068, ''], [16, 0xf0f0ee, 'van']]) { const car = trofiCar(c, k); car.position.set(x, 0, -13.2); car.rotation.y = Math.PI / 2; sc.add(car); addObstacle(x, -13.2, car.userData.W + 0.2, car.userData.L + 0.2); }
  const ama = trofiAmaroki(); ama.position.set(9.5, 0, -7.3); ama.rotation.y = 0.62; sc.add(ama); addObstacle(9.5, -7.3, 4.2, 3.6);
  TROFI.amaroki = ama; ama.userData.tails.forEach(t => t.material.color.setHex(0xffa020));
  // ---------- vivero (izquierda) y concesionaria (derecha) ----------
  for (let i = 0; i < 3; i++) box(7, 3.2, 6, trofiMat(0xb8d8c0, { transparent: true, opacity: 0.25, roughness: 0.15 }), -28, 1.6, -13.5 - i * 6.4, sc, false);
  for (let i = 0; i < 50; i++) { const x = rand(-34, -22), z = rand(-26, -9); cyl(0.25, 0.2, 0.35, trofiMat(0x9a5a32), x, 0.18, z, sc, 8); sph(rand(0.3, 0.6), rand(0.4, 0.9), rand(0.3, 0.6), trofiMat(pick([0x2a5a24, 0x3a6a2a, 0x2a4a1e, 0x4a7a2a])), x, 0.72, z, sc); }
  const viv = trofiLabel('VIVERO EL BOTÁNICO', 6, 1.1, '#1e4a24', '#f0e8c0'); viv.position.set(-25, 3.6, -9.6); sc.add(viv);
  addObstacle(-28, -18, 12, 18);
  box(12, 5.4, 10, texMat(panelDark, 3, 2, { roughness: 0.6 }), 26, 2.7, -15.5, sc);
  box(11.4, 4.4, 0.1, trofiMat(0xbfe0ff, { transparent: true, opacity: 0.3, roughness: 0.04, metalness: 0.2 }), 26, 2.4, -10.45, sc, false);
  const show = new THREE.PointLight(0xfff4e0, 1.6, 12, 1.5); show.position.set(26, 4, -13.5); sc.add(show);
  const jeep = trofiCar(0xc82a1a, 'suv'); jeep.position.set(25, 0, -13.4); jeep.rotation.y = 0.5; sc.add(jeep);
  const jeep2 = trofiCar(0x2a2a30, 'suv'); jeep2.position.set(28.6, 0, -13.6); jeep2.rotation.y = -0.4; sc.add(jeep2);
  const cd = trofiLabel('AUTOS DEL OESTE', 7, 0.95, '#0c0c10', '#e8e8ea'); cd.position.set(26, 5.7, -10.4); sc.add(cd); addObstacle(26, -15.5, 12.4, 10.4);
  // ---------- esquina con semáforo, columnas de luz con halos, tendido eléctrico ----------
  const pole = trofiMat(0x6a6c70, { metalness: 0.6 });
  cyl(0.08, 0.1, 4, pole, 19.3, 2, -6.6, sc, 8); box(0.4, 1.1, 0.4, trofiMat(0x111111), 19.3, 3.6, -6.6, sc);
  TROFI.semaf = ['r', 'y', 'g'].map((k, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0x222222 })); m.position.set(19.3, 3.95 - i * 0.34, -6.38); sc.add(m); return m; });
  TROFI.semafHalo = trofiHalo(sc, 19.3, 3.6, -6.2, 0x2aff6a, 0.9, 0.5);
  addObstacle(19.3, -6.6, 0.4, 0.4);
  for (let x = -30; x <= 30; x += 10) {
    cyl(0.1, 0.14, 8, pole, x, 4, -6.8, sc, 8); const arm = box(2.2, 0.1, 0.1, pole, x, 7.9, -5.8, sc, false); arm.rotation.y = Math.PI / 2;
    box(0.5, 0.15, 0.3, new THREE.MeshBasicMaterial({ color: 0xffd8a0 }), x, 7.82, -4.8, sc, false); trofiHalo(sc, x, 7.7, -4.8, 0xffb060, 3.4, 0.5);
    const l = new THREE.PointLight(0xffb870, 1.5, 18, 1.6); l.position.set(x, 7.5, -4.8); sc.add(l); TROFI.lampLights.push(l); addObstacle(x, -6.8, 0.4, 0.4);
  }
  for (let x = -X; x <= X; x += 14) cyl(0.12, 0.15, 10, trofiMat(0x4a3a2a), x, 5, -7.4, sc, 8);
  for (const y of [9.4, 9.0, 8.7]) { const w_ = box(X * 2, 0.025, 0.025, trofiMat(0x111111), 0, y, -7.4, sc, false); }
  // arbustos del cantero; árboles del otro lado de la Panamericana; cartel verde
  for (let x = -X; x <= X; x += rand(2.4, 3.6)) sph(rand(0.5, 0.9), rand(0.35, 0.55), rand(0.5, 0.8), trofiMat(pick([0x24461e, 0x2e5224, 0x1e3a18])), x, 0.3, rand(3.0, 4.4), sc);
  for (let x = -X; x <= X; x += rand(4, 7)) { cyl(0.18, 0.24, 2.6, trofiMat(0x3a2a1a), x, 1.3, 17.8, sc, 8); sph(rand(1.4, 2.2), rand(1.6, 2.4), rand(1.4, 2.2), trofiMat(pick([0x24461e, 0x2e5224, 0x1e3a18])), x, 3.6, 17.8, sc); }
  for (let i = 0; i < 30; i++) { const x = rand(-X, X), z = rand(20, 38); cyl(0.2, 0.3, 3, trofiMat(0x3a2a1a), x, 1.5, z, sc, 6); sph(rand(2, 3.4), rand(2.2, 3.6), rand(2, 3.4), trofiMat(pick([0x1e3a18, 0x24461e])), x, 4.2, z, sc); }
  const hs = new THREE.Mesh(new THREE.PlaneGeometry(7, 2), new THREE.MeshBasicMaterial({ map: canvasTex(512, 146, (c, w, h) => { c.fillStyle = '#1e6a3a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#fff'; c.font = "bold 44px Arial"; c.textAlign = 'center'; c.fillText('PANAMERICANA', w / 2, 62); c.font = "34px Arial"; c.fillText('Ramal Pilar ↑   Capital ←', w / 2, 112); }) }));
  hs.position.set(-8, 6.5, 10.7); sc.add(hs); for (const x of [-11.3, -4.7]) cyl(0.12, 0.12, 6.5, pole, x, 3.25, 10.7, sc, 8);
  // ---------- tránsito: 6 autos en la colectora, el camión de basura, y la Panamericana ----------
  const colors = [0xe8e8e6, 0x2a2a30, 0x8a1a1a, 0x2a4a8a, 0x9a9a96, 0x1a3a2a, 0xd8c8a0];
  for (let i = 0; i < 6; i++) {
    const kind = pick(['', '', 'suv', 'amarok']), car = trofiCar(pick(colors), kind), dir = i % 2 ? -1 : 1;
    car.rotation.y = dir > 0 ? 0 : Math.PI; sc.add(car);
    TROFI.cars.push({ g: car, dir, lane: dir > 0 ? -4.0 : -0.1, x: rand(-45, 45), v: 0, vmax: rand(9, 13), wait: rand(0, 8), amarok: kind === 'amarok', horn: 0 });
  }
  const truck = trofiGarbageTruck(); truck.rotation.y = Math.PI; sc.add(truck);
  TROFI.cars.push({ g: truck, dir: -1, lane: -0.4, x: 50, v: 0, vmax: 4.2, wait: rand(4, 10), truck: true, horn: 0, beep: 0 });
  for (let i = 0; i < 14; i++) { const dir = i % 2 ? -1 : 1, car = trofiCar(pick(colors), pick(['', 'suv', '', 'van'])); car.rotation.y = dir > 0 ? 0 : Math.PI; sc.add(car); TROFI.hiway.push({ g: car, dir, z: dir > 0 ? 7.3 + (i % 4 < 2 ? 0 : 1.6) : 12.4 + (i % 4 < 2 ? 0 : 1.6), x: rand(-50, 50), v: rand(22, 32) }); }
  const key = new THREE.DirectionalLight(0xffe0c0, 0.7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, far: 60 }); sc.add(key, key.target); TROFI.key = key;
  TROFI.obst = obstacles.splice(TROFI.obstStart);
  TROFI.npcs.push(new Patovica(-0.6, -9.1), new Patovica(2.9, -9.1), new Patovica(1.2, -8.7));
  TROFI.npcs.push(new Limpiavidrios());
  scene = prev;
}
// ---------- patovicas: en la puerta, de brazos cruzados; si la pelea se acerca, empujan ----------
const PATO_LINES = ['¡Acá no, flaco!', '¡Afuera, afuera!', '¡Con esa ropa no entrás!', 'Tranqui, que llamo a la yuta.', '¡Ni se te ocurra!'];
class Patovica extends Walker {
  constructor(x, z) {
    super({ name: 'Patovica', civil: true, patovica: true, top: 'remera', topColor: 0x0e0e10, pants: 0x121216, skin: pick([0xc68b62, 0x8a5a3a, 0xd9a27a]), hair: 'bald', hairColor: 0x111111, big: true, shoe: 0x111111, beard: Math.random() < 0.5 });
    const b = this.body; b.pos.set(x, 0, z); b.facing = 0; this.home = new THREE.Vector3(x, 0, z); this.state = 'guard'; this.t = 0; this.cd = 0;
    b.poseFn = (P) => { if (this.state === 'guard') { P.aL = P.aR = -1.0; P.eL = P.eR = -2.2; P.aLz = 0.75; P.aRz = -0.75; P.tX = -0.05; } else if (this.state === 'shove') { const k = Math.min(1, this.t / 0.25); P.aL = P.aR = -1.45 * k; P.eL = P.eR = -0.3; P.tX = 0.25 * k; } };
  }
  update(dt) {
    const b = this.body; this.t += dt; this.cd -= dt; this.tickBark && this.tickBark(dt);
    let near = null, bd = 3.4;
    for (const f of fighters) { if (!f.alive || f.team < 0) continue; const d = Math.hypot(f.pos.x - this.home.x, f.pos.z - this.home.z); if (d < bd && f.pos.z < -5.5) { bd = d; near = f; } }
    if (near && this.state === 'guard' && this.cd <= 0) { this.state = 'go'; this.target = near; this.t = 0; }
    if (this.state === 'go') {
      const f = this.target; if (!f || !f.alive) { this.state = 'back'; }
      else if (this.moveTo(f.pos.x, f.pos.z, 3.2, dt) || Math.hypot(f.pos.x - b.pos.x, f.pos.z - b.pos.z) < 1.1) {
        this.state = 'shove'; this.t = 0; this.say(pick(PATO_LINES), 1.8);
        const dx = f.pos.x - b.pos.x, dz = f.pos.z - b.pos.z, d = Math.hypot(dx, dz) || 1;
        if (f.state === 'normal' || f.state === 'block' || f.state === 'attack') { f.knock.set(dx / d * 6 + 0, Math.max(3, dz / d * 6 + 4)); if (f.setState) f.setState('hit'); f.stun = 0.45; }
        sfx('thud', distVol(b.pos.x, b.pos.z) * 0.7);
      } else if (this.t > 3) this.state = 'back';
    } else if (this.state === 'shove') { b.curSpeed = 0; if (this.t > 0.6) { this.state = 'back'; this.cd = 1.2; } }
    else if (this.state === 'back') { if (this.moveTo(this.home.x, this.home.z, 2, dt)) { this.state = 'guard'; b.facing = 0; } }
    else b.curSpeed = 0;
    b.root.position.copy(b.pos); b.animate(dt);
  }
}
// ---------- el limpiavidrios: cuando el semáforo corta, va al auto con el balde y el secador ----------
class Limpiavidrios extends Walker {
  constructor() {
    super({ name: 'El del semáforo', civil: true, top: 'remera', topColor: 0x8a6a3a, pants: 0x3a3428, skin: 0xb07e5a, hair: 'short', hairColor: 0x2a1a10, shoe: 0x3a2a1a, cap: 0xd8402a });
    const b = this.body; this.home = new THREE.Vector3(18.2, 0, -5.7); b.pos.copy(this.home); b.facing = -Math.PI / 2; this.state = 'wait'; this.t = 0; this.car = null;
    const bucket = cyl(0.14, 0.11, 0.26, trofiMat(0x2a6ad0), 0.45, 0.13, 0.1, b.root, 10); this.bucket = bucket;
    b.poseFn = (P) => { if (this.state === 'clean') { const s = Math.sin(this.t * 9); P.aR = -1.7 + s * 0.25; P.eR = -0.6; P.aRz = 0.3 * s; P.tX = 0.2; } if (this.state === 'run') { P.tX = 0.3; } };
  }
  update(dt) {
    const b = this.body; this.t += dt; this.tickBark && this.tickBark(dt);
    let close = false; for (const f of fighters) if (f.alive && f.team >= 0 && Math.hypot(f.pos.x - b.pos.x, f.pos.z - b.pos.z) < 2.6) close = true;
    if (close && this.state !== 'run') { this.state = 'run'; this.t = 0; this.say(pick(['¡Uy, me voy!', '¡No me metan!', '¡Pará, pará!']), 1.6); }
    if (this.state === 'run') { if (this.moveTo(30, -8.5, 5.5, dt) || this.t > 4) { this.state = 'wait'; b.pos.copy(this.home); } }
    else if (this.state === 'wait') {
      b.curSpeed = 0;
      const c = TROFI.cars.find(c => c.stopped && !c.truck && Math.abs(c.x - 16.2) < 5.5);   // los autos frenan ~4 m antes de la esquina
      if (c) { this.car = c; this.state = 'go'; this.t = 0; }
    } else if (this.state === 'go') {
      const c = this.car; if (!c || !c.stopped) { this.state = 'back'; }
      else if (this.moveTo(c.x + c.dir * 2.0, c.lane + (c.dir > 0 ? 1.2 : -1.2), 2.4, dt)) { this.state = 'clean'; this.t = 0; if (Math.random() < 0.5) this.say(pick(['¿Te lo limpio, jefe?', 'Una moneda, jefe...', 'Queda brillando.']), 1.8); }
    } else if (this.state === 'clean') { b.curSpeed = 0; if (this.car) this.face(this.car.x, this.car.lane, dt * 4); if (this.t > 2.4 || !this.car.stopped) this.state = 'back'; }
    else if (this.state === 'back') { if (this.moveTo(this.home.x, this.home.z, 2.2, dt)) this.state = 'wait'; }
    b.root.position.copy(b.pos); b.animate(dt);
  }
}
// los patovicas usan el cuerpo de Mixamo (como Doña Chola)
{ const base = chpTagFor; chpTagFor = function (f) { if (f.cfg && (f.cfg.patovica || f.cfg.name === 'El del semáforo')) return 'ch01'; return base(f); }; }
// ---------- cada cuadro en el Trofi: semáforo, tránsito, atropellos, gente, luces ----------
function P0x() { const P = player || fighters[0]; return P ? P.pos.x : 0; }
function updateTrofi(dt) {
  const T = TROFI; T.t += dt;
  // semáforo de la esquina: verde 9 s, amarillo 2 s, rojo 7 s
  T.lightT += dt; const cyc = { green: 9, yellow: 2, red: 7 }, next = { green: 'yellow', yellow: 'red', red: 'green' };
  if (T.lightT > cyc[T.light]) { T.lightT = 0; T.light = next[T.light]; }
  T.semaf[0].material.color.setHex(T.light === 'red' ? 0xff2a1a : 0x2a0a08); T.semaf[1].material.color.setHex(T.light === 'yellow' ? 0xffb020 : 0x2a2008); T.semaf[2].material.color.setHex(T.light === 'green' ? 0x2aff6a : 0x082a10);
  for (const c of T.cars) {
    if (c.wait > 0) { c.wait -= dt; c.g.visible = false; continue; }
    c.g.visible = true;
    // frena en rojo antes del semáforo; frena si hay alguien parado adelante (a veces no llega)
    const stopX = 16.2 - c.dir * 3, ahead = c.dir > 0 ? stopX - c.x : c.x - stopX;
    let want = c.vmax;
    if (T.light !== 'green' && ahead > 0 && ahead < 14) want = Math.min(want, Math.max(0, (ahead - 1) * 1.1));
    for (const f of fighters) { if (!f.alive) continue; const dx = (f.pos.x - c.x) * c.dir; if (dx > 0 && dx < 9 && Math.abs(f.pos.z - c.lane) < 1.4) { want = Math.min(want, (c.amarok || c.truck) ? c.vmax : 2); /* la Amarok y el camión de basura no frenan */ if (c.horn <= 0) { c.horn = 1.2; tone('square', 330, 320, 0.45, 0.22); setTimeout(() => tone('square', 330, 320, 0.35, 0.2), 500); } } }
    c.horn -= dt;
    c.v += (want - c.v) * Math.min(1, dt * (want < c.v ? 2.6 : 1.2));
    c.stopped = c.v < 0.4 && T.light !== 'green' && ahead > 0 && ahead < 5;
    c.x += c.dir * c.v * dt; c.g.position.set(c.x, 0, c.lane);
    // atropello: si te agarra con velocidad, volás
    if (c.v > 3) for (const f of fighters) {
      if (!f.alive || f.state === 'down' || f.state === 'ko' || f.airborne) continue;
      const dx = Math.abs(f.pos.x - c.x), dz = Math.abs(f.pos.z - c.lane);
      if (dx < c.g.userData.L / 2 + 0.3 && dz < c.g.userData.W / 2 + 0.3) {
        const dmg = Math.round(12 + c.v * 1.4); f.hp = Math.max(0, f.hp - dmg);
        f.setState(f.hp <= 0 ? 'ko' : 'down'); f.vy = 4 + c.v * 0.25; f.knock.set(c.dir * c.v * 0.9, (f.pos.z > c.lane ? 1 : -1) * 3);
        sfx('thud', 1); sfx('metal', 0.7); spawnDust(f.pos.x, f.pos.z, 8, true); if (f.isPlayer) shake(0.6);
        f.say(pick(['¡AAAH!', '¡Me llevó puesto!', '¡La puta, el auto!']), 1.5);
        c.v *= 0.4; c.horn = 2;
      }
    }
    if (c.x * c.dir > 46) { c.x = -46 * c.dir; c.wait = c.truck ? rand(14, 26) : rand(1.5, 7); c.vmax = c.truck ? 4.2 : rand(9, 13); }
  }
  // camión de basura: baliza y pitido; Amaroki con balizas; haces de los reflectores; halo del semáforo
  const blink = Math.floor(T.t * 3) % 2 === 0;
  for (const c of T.cars) if (c.truck && c.g.visible) { const b = c.g.userData; b.beacon.material.color.setHex(blink ? 0xffa020 : 0x5a3008); b.bl.intensity = blink ? 1.4 : 0; c.beep -= dt; if (c.beep <= 0 && Math.abs(c.x - (P0x())) < 22) { c.beep = 1.1; tone('square', 1180, 1180, 0.16, 0.06); } }
  if (T.amaroki) T.amaroki.userData.tails.forEach(t => { t.material.opacity = blink ? 0.85 : 0.08; });
  if (T.beams) T.beams.forEach((b, i) => { b.rotation.z = Math.sin(T.t * 0.5 + i * 1.3) * 0.22; b.rotation.x = 0.15 + Math.cos(T.t * 0.4 + i) * 0.08; });
  if (T.semafHalo) T.semafHalo.material.color.setHex(T.light === 'red' ? 0xff2a1a : T.light === 'yellow' ? 0xffb020 : 0x2aff6a);
  for (const h of T.hiway) { h.x += h.dir * h.v * dt; if (h.x * h.dir > 52) h.x = -52 * h.dir; h.g.position.set(h.x, 0, h.z); }
  // la fila baila un poco y mira la pelea
  const center = fighters.length ? fightCenter() : null;
  for (const p of T.crowd) { p.g.position.y = Math.abs(Math.sin(T.t * 3 + p.ph)) * 0.05; if (center) p.g.rotation.y += (Math.atan2(center.x - p.g.position.x, center.z - p.g.position.z) * 0.6 + p.y0 * 0.4 - p.g.rotation.y) * Math.min(1, dt * 2); }
  // neón que titila
  T.neon.forEach((l, i) => { l.intensity = 1.0 + Math.sin(T.t * (5 + i * 3)) * 0.25 + (Math.random() < 0.01 ? -1.5 : 0); });
  for (const n of T.npcs) n.update(dt);
  // la luz de sombras sigue al jugador
  const P = player || fighters[0];
  if (P) { T.key.position.set(P.pos.x - 6, 16, P.pos.z + 8); T.key.target.position.set(P.pos.x, 0, P.pos.z); }
}
// ---------- cambiar de mapa: escena, límites y obstáculos ----------
function trofiEnter() {
  buildTrofi();
  if (!TROFI.saved) { TROFI.saved = { obst: obstacles.slice(), bx: BOUNDS.x, bz: BOUNDS.z }; obstacles.length = 0; obstacles.push(...TROFI.obst); BOUNDS.x = TROFI.bounds.x; BOUNDS.z = TROFI.bounds.z; }
}
function trofiLeave() {
  if (!TROFI.saved) return;
  obstacles.length = 0; obstacles.push(...TROFI.saved.obst); BOUNDS.x = TROFI.saved.bx; BOUNDS.z = TROFI.saved.bz; TROFI.saved = null;
}
{
  const baseSet = setScene;
  setScene = function (s) {
    if (s === plazaScene && CUR_MAP === 'trofi') { trofiEnter(); s = TROFI.scene; }
    else if (s !== TROFI.scene) trofiLeave();
    baseSet(s);
  };
  // en el Trofi se pelea de costado: La Par desde la izquierda, el rival desde la derecha
  const baseSpot = finalSpot;
  finalSpot = function (t, i) {
    if (CUR_MAP !== 'trofi') return baseSpot(t, i);
    return new THREE.Vector3(t === 0 ? -6.5 - (i % 2) * 1.2 : 6.5 + (i % 2) * 1.2, 0, -2.6 + i * 1.3 - (t === 1 ? 0.4 : 0));
  };
  const baseRound = startRound;
  startRound = function () {
    baseRound();
    if (CUR_MAP === 'trofi') for (const f of fighters) if (!f.spectator) f.facing = f.team === 0 ? Math.PI / 2 : -Math.PI / 2;
  };
  // no hay salida desde las casas: se arranca directo en la vereda del boliche
  const baseWalk = startWalkin;
  startWalkin = function () { if (CUR_MAP === 'trofi') { startRound(); return; } baseWalk(); };
  const baseWorld = updateWorld;
  updateWorld = function (dt) { baseWorld(dt); if (scene === TROFI.scene) updateTrofi(dt); };
}
// ---------- selector de mapa en el menú ----------
