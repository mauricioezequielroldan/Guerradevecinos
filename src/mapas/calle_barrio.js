// ============================================================
// MAPA DEL MODO HISTORIA: LA CALLE DEL BARRIO (Pasaje Las Acacias)
// Una cuadra porteña/conurbano de noche: adoquines, veredas de baldosas vainilla, casas bajas con rejas y
// persianas, maxikiosco, almacén, garaje, plátanos, postes de madera con cables, cesto de basura en altura.
// Sólo para caminar (sin peleas). La calle corre en X; veredas en z = ±(3.5..6); fachadas en z = ±6.
// ============================================================
const CALLE = window.__CALLE = { built: false, scene: null, saved: null, bounds: { x: 37, z: 5.6 }, obst: [], lamps: [], t: 0 };
function calleTexAdoquin() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2a2826'; g.fillRect(0, 0, w, h);
    const rw = 32, rh = 18;
    for (let y = 0, row = 0; y < h; y += rh, row++) for (let x = -(row % 2) * rw / 2; x < w; x += rw) {
      const v = 70 + Math.random() * 40 | 0; g.fillStyle = `rgb(${v},${v - 4},${v - 8})`;
      g.beginPath(); g.roundRect ? g.roundRect(x + 1.5, y + 1.5, rw - 3, rh - 3, 4) : g.rect(x + 1.5, y + 1.5, rw - 3, rh - 3); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 3, y + 3, rw - 8, 3);
    }
  }, 1, 1);
}
function calleTexVainilla() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#9a8a62'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
      const v = Math.random() * 16 | 0; g.fillStyle = `rgb(${200 - v},${184 - v},${138 - v})`; g.fillRect(x + 1, y + 1, 30, 30);
      g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillRect(x + 4 + i * 7, y + 4 + j * 7, 3, 3);   // los cuadraditos de la vainilla
    }
  });
}
function calleTexChapa() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, 'rgba(0,0,0,0.28)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0.28)'); g.fillStyle = gr; g.fillRect(x, 0, 8, h); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${120 + Math.random() * 60 | 0},${60 + Math.random() * 30 | 0},20,${Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1 + Math.random() * 10); }   // óxido y pintura saltada
  });
}
const CHAPA_TEX = calleTexChapa();
function calleHouse(sc, x0, w, side, kind, color) {
  // side = -1: vereda sur (la fachada mira a +z); side = 1: vereda norte (mira a -z)
  const z = side * 6.15, face = -side, h = kind === 'alta' ? 6.6 : 4.2 + Math.random() * 0.8;
  const chapa = kind !== 'kiosco' && kind !== 'almacen' && Math.random() < 0.65;   // estilo Caminito: chapa acanalada pintada
  const wall = chapa ? texMat(CHAPA_TEX, w / 1.6, h / 2, { color, roughness: 0.6, metalness: 0.25 }) : texMat(revoqueTex, w / 3, h / 3, { color, roughness: 0.92 });
  const trim = trofiMat(pick([0xf0e8d0, 0x1a6a3a, 0x2a4ad0, 0xe8c030, 0xd83a2a]), { roughness: 0.6 });
  box(w, h, 0.5, wall, x0, h / 2, z, sc);
  box(w + 0.1, 0.25, 0.7, texMat(revoqueTex, w / 3, 0.2, { color: 0xd8d2c4 }), x0, h - 0.1, z + face * 0.08, sc);   // cornisa
  box(w, 0.35, 0.56, trofiMat(0x3a3430), x0, 0.17, z, sc);                                                         // zócalo
  const dz = z + face * 0.27, wood = trofiMat(pick([0x5a3a22, 0x3a2a1a, 0x2a4a3a, 0x6a2a1a]), { roughness: 0.7 });
  const ry = face > 0 ? 0 : Math.PI;
  if (kind === 'garage') {
    const gate = box(3.2, 2.6, 0.08, trofiMat(0x6a6e72, { metalness: 0.5, roughness: 0.5 }), x0, 1.3, dz, sc);
    for (let i = 0; i < 12; i++) box(3.2, 0.03, 0.1, trofiMat(0x4a4e52), x0, 0.15 + i * 0.21, dz + face * 0.02, sc, false);
    const ne = trofiLabel('NO ESTACIONAR · SALIDA DE VEHÍCULOS', 2.6, 0.32, '#f2f0e8', '#c0300f'); ne.position.set(x0, 2.95, dz + face * 0.03); ne.rotation.y = ry; sc.add(ne);
    return;
  }
  if (kind === 'kiosco' || kind === 'almacen') {
    const win = box(w * 0.6, 1.8, 0.06, new THREE.MeshBasicMaterial({ color: 0xfff0c8 }), x0 - w * 0.12, 1.5, dz, sc, false);
    const rj = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.62, 1.85), new THREE.MeshBasicMaterial({ map: barsTex, transparent: true, color: 0x222222 })); rj.position.set(x0 - w * 0.12, 1.5, dz + face * 0.05); rj.rotation.y = ry; sc.add(rj);
    const t = kind === 'kiosco' ? ['MAXIKIOSCO 24 HS', '#c0302a', '#fff4d0'] : ['ALMACÉN LO DE TOTO', '#1e4a8a', '#ffe8a0'];
    const sg = trofiLabel(t[0], w * 0.85, 0.6, t[1], t[2]); sg.position.set(x0, 2.9, dz + face * 0.06); sg.rotation.y = ry; sc.add(sg);
    trofiHalo(sc, x0 - w * 0.12, 1.6, dz + face * 0.8, 0xffe0a0, 4.5, 0.35);
    const l = new THREE.PointLight(0xffe0a8, 0.9, 7, 1.8); l.position.set(x0 - w * 0.12, 2.2, dz + face * 1.4); sc.add(l);
    box(0.9, 2.2, 0.06, wood, x0 + w * 0.32, 1.1, dz, sc);
    return;
  }
  // casa común: puerta de madera, ventana con reja y persiana, a veces balconcito
  box(1.2, 2.4, 0.06, trim, x0 - w * 0.25, 1.2, dz - face * 0.01, sc, false); box(1.6, 1.5, 0.06, trim, x0 + w * 0.18, 1.6, dz - face * 0.01, sc, false);
  box(1.0, 2.25, 0.08, wood, x0 - w * 0.25, 1.12, dz, sc);
  box(0.08, 0.08, 0.06, trofiMat(0xc8a84a, { metalness: 0.8 }), x0 - w * 0.25 + 0.35, 1.1, dz + face * 0.05, sc, false);   // picaporte
  const lit = Math.random() < 0.45;
  box(1.4, 1.3, 0.06, lit ? new THREE.MeshBasicMaterial({ color: 0xffd8a0 }) : trofiMat(0x141820, { roughness: 0.2 }), x0 + w * 0.18, 1.6, dz, sc, false);
  const per = box(1.42, 0.5 + Math.random() * 0.7, 0.07, trofiMat(pick([0x7a6a52, 0x5a6a52, 0x8a5a3a, 0x6a6a6a])), x0 + w * 0.18, 2.1, dz + face * 0.02, sc, false);   // persiana a medio bajar
  const rj = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.4), new THREE.MeshBasicMaterial({ map: barsTex, transparent: true, color: 0x1a1a1a })); rj.position.set(x0 + w * 0.18, 1.6, dz + face * 0.08); rj.rotation.y = ry; sc.add(rj);
  if (lit) trofiHalo(sc, x0 + w * 0.18, 1.6, dz + face * 0.6, 0xffd090, 2.2, 0.25);
  if (kind === 'alta') {   // planta alta con balconcito
    box(1.6, 0.1, 0.7, trofiMat(0x8a8a86), x0 + w * 0.1, 3.4, z + face * 0.6, sc);
    for (let i = 0; i < 7; i++) box(0.03, 0.8, 0.03, trofiMat(0x1a1a1a, { metalness: 0.5 }), x0 + w * 0.1 - 0.75 + i * 0.25, 3.85, z + face * 0.93, sc, false);
    box(1.2, 1.6, 0.06, trofiMat(0x141820, { roughness: 0.2 }), x0 + w * 0.1, 4.4, dz, sc, false);
  }
  const num = trofiLabel(String(100 + (x0 * 7 | 0) * 2 + (side > 0 ? 1 : 0)).replace('-', ''), 0.32, 0.18, '#1a3a6a', '#ffffff'); num.position.set(x0 - w * 0.25, 2.5, dz + face * 0.05); num.rotation.y = ry; sc.add(num);
}
function buildCalle() {
  if (CALLE.built) return; CALLE.built = true;
  const sc = CALLE.scene = new THREE.Scene(), prev = scene; scene = sc; const o0 = obstacles.length;
  sc.background = new THREE.Color(0x0d1430); sc.fog = new THREE.Fog(0x0d1430, 40, 170);
  sc.add(new THREE.HemisphereLight(0x6070b0, 0x2a2218, 0.6));
  const moon = new THREE.DirectionalLight(0xa0b4e8, 0.45); moon.position.set(-15, 30, 10); sc.add(moon, moon.target);
  const L = 84;
  // piso: adoquines al medio, cordón, veredas de vainilla
  const ado = new THREE.Mesh(new THREE.PlaneGeometry(L, 7), texMat(calleTexAdoquin(), L / 4, 7 / 4, { roughness: 0.88 })); ado.rotation.x = -Math.PI / 2; ado.receiveShadow = true; sc.add(ado);
  for (const s of [-1, 1]) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(L, 2.6), texMat(calleTexVainilla(), L / 1.2, 2.6 / 1.2, { roughness: 0.9 })); v.rotation.x = -Math.PI / 2; v.position.set(0, 0.015, s * 4.8); /* casi al nivel de la calle: los personajes pisan a altura 0 */ v.receiveShadow = true; sc.add(v);
    box(L, 0.15, 0.25, texMat(concreteTex, 30, 1, { color: 0xb0aca2 }), 0, 0.07, s * 3.55, sc);
  }
  // casas a los dos lados: comunes, una alta, el kiosco, el almacén y el garaje de Cacho
  const colors = [0xd83a2a, 0x2a6ad0, 0xe8c030, 0x2a9a5a, 0xe87a2a, 0x7a3a9a, 0x4ab8d8, 0xe85a8a, 0xf0e8d0, 0x3ac0a0];   // paleta de Caminito
  for (const side of [-1, 1]) {
    let x = -L / 2;
    while (x < L / 2) {
      const w = 6 + Math.random() * 3, cx = x + w / 2;
      let kind = Math.random() < 0.45 ? 'alta' : 'casa';
      if (side > 0 && Math.abs(cx - 6) < w / 2) kind = 'kiosco';
      if (side > 0 && Math.abs(cx + 12) < w / 2) kind = 'almacen';
      if (side < 0 && Math.abs(cx - 24) < w / 2) kind = 'garage';
      calleHouse(sc, cx, w - 0.05, side, kind, pick(colors));
      x += w;
    }
    addObstacle(0, side * 6.2, L, 0.8);
  }
  // grafiti de La Par en una medianera
  const graf = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.6), new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.9, map: canvasTex(512, 200, (g, w, h) => { g.clearRect(0, 0, w, h); g.font = "bold 130px 'Arial Black', Impact"; g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = '#111'; g.strokeText('LA PAR', w / 2, 150); g.fillStyle = '#2a6ad0'; g.fillText('LA PAR', w / 2, 150); }) }));
  graf.position.set(-6, 1.8, -5.88); sc.add(graf);
  // plátanos con su cantero, postes de madera con cables, cestos de basura en altura, faroles
  for (let x = -38; x <= 38; x += 9) for (const s of [-1, 1]) {
    const tx = x + (s > 0 ? 4.5 : 0); if (Math.abs(tx - 6) < 2 || Math.abs(tx - 24) < 2.5) continue;
    box(1, 0.16, 1, trofiMat(0x3a2a1e), tx, 0.08, s * 4.4, sc);
    cyl(0.14, 0.2, 3.2, trofiMat(0x8a7a62), tx, 1.6, s * 4.4, sc, 8);
    for (let i = 0; i < 3; i++) sph(rand(1.3, 1.9), rand(1.0, 1.4), rand(1.3, 1.9), trofiMat(pick([0x2a4a22, 0x34582a, 0x2a4020])), tx + rand(-0.6, 0.6), 3.8 + rand(0, 0.8), s * 4.4 + rand(-0.4, 0.4), sc);
    addObstacle(tx, s * 4.4, 0.5, 0.5);
  }
  for (let x = -35; x <= 35; x += 14) {
    cyl(0.12, 0.16, 7.5, trofiMat(0x4a3a2a), x, 3.75, 3.9, sc, 8); addObstacle(x, 3.9, 0.4, 0.4);
    const arm = box(0.08, 0.08, 1.8, trofiMat(0x6a6c70, { metalness: 0.6 }), x, 7, 3.0, sc, false);
    box(0.4, 0.14, 0.3, new THREE.MeshBasicMaterial({ color: 0xffd8a0 }), x, 6.92, 2.2, sc, false); trofiHalo(sc, x, 6.8, 2.2, 0xffb060, 3.2, 0.5);
    const l = new THREE.PointLight(0xffb070, 1.5, 15, 1.6); l.position.set(x, 6.6, 2.2); sc.add(l); CALLE.lamps.push(l);
  }
  for (const y of [6.4, 6.1, 5.8]) box(L, 0.025, 0.025, trofiMat(0x111111), 0, y, 3.9, sc, false);
  for (let i = 0; i < 10; i++) { const c = box(0.02, 0.02, 12, trofiMat(0x111111), rand(-38, 38), 6.2, 0, sc, false); c.rotation.x = rand(-0.05, 0.05); }   // cables que cruzan la calle
  for (const [x, s] of [[-25, -1], [-2, 1], [15, -1], [31, 1]]) {   // cesto de basura en altura, con bolsas
    cyl(0.04, 0.04, 1.3, trofiMat(0x222222, { metalness: 0.5 }), x, 0.65, s * 3.8, sc, 6);
    box(0.7, 0.45, 0.5, trofiMat(0x2a2a2a, { metalness: 0.4 }), x, 1.45, s * 3.8, sc);
    sph(0.28, 0.24, 0.24, trofiMat(0x111111, { roughness: 0.35 }), x - 0.12, 1.75, s * 3.8, sc); sph(0.24, 0.2, 0.22, trofiMat(0x1a1a1a, { roughness: 0.35 }), x + 0.15, 1.73, s * 3.8, sc);
    addObstacle(x, s * 3.8, 0.7, 0.5);
  }
  // autos estacionados contra el cordón
  for (const [x, s, c] of [[-30, -1, 0xd8d0b8], [-8, 1, 0x8a1a1a], [12, -1, 0x2a4a8a], [33, 1, 0xe8e8e6]]) { const car = trofiCar(c, pick(['', 'suv'])); car.position.set(x, 0, s * 2.45); car.rotation.y = s > 0 ? Math.PI : 0; sc.add(car); addObstacle(x, s * 2.45, car.userData.L + 0.2, car.userData.W + 0.2); }
  // luz que sigue al jugador (sombras)
  const key = new THREE.DirectionalLight(0xffe0c0, 0.65); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, far: 50 }); sc.add(key, key.target); CALLE.key = key;
  CALLE.obst = obstacles.splice(o0);
  scene = prev;
}
function calleEnter() {
  buildCalle();
  if (!CALLE.saved) { CALLE.saved = { obst: obstacles.slice(), bx: BOUNDS.x, bz: BOUNDS.z }; obstacles.length = 0; obstacles.push(...CALLE.obst); BOUNDS.x = CALLE.bounds.x; BOUNDS.z = CALLE.bounds.z; }
}
function calleLeave() {
  if (!CALLE.saved) return;
  obstacles.length = 0; obstacles.push(...CALLE.saved.obst); BOUNDS.x = CALLE.saved.bx; BOUNDS.z = CALLE.saved.bz; CALLE.saved = null;
}
{
  const baseSet = setScene;
  setScene = function (s) { if (s && s === CALLE.scene) calleEnter(); else calleLeave(); baseSet(s); };
  const baseWorld = updateWorld;
  updateWorld = function (dt) { baseWorld(dt); if (scene === CALLE.scene) { CALLE.t += dt; const P = player; if (P) { CALLE.key.position.set(P.pos.x - 5, 14, P.pos.z + 7); CALLE.key.target.position.set(P.pos.x, 0, P.pos.z); } } };
}
