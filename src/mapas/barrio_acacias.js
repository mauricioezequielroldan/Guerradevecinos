// ============================================================
// BARRIO LAS ACACIAS — el mapa del modo historia (reemplaza a la calle sola)
// Dos calles que se cruzan (Calle Las Acacias en X, Pasaje 14 en Z) y cuatro manzanas:
//   NO: comercios (kiosco 24 hs, almacén, bar, panchería, carnicería, chino, pizzería, barcito hipster)
//   NE: la plaza (entrar = misión 1)
//   SO: casas (Rubén, Tito), escuelita, potrero, los fisuras con el tacho prendido fuego
//   SE: estación de servicio, gomería, remisería + parada del remís (misión 2), garaje de Cacho, mural
// Noche SIN LUZ: faroles apagados, velas en las ventanas; iluminan el fuego, el generador de la estación, el chino y el kiosco.
// Coordenadas: calzadas |z| < 4 (calle) y |x| < 4 (pasaje); veredas hasta 6,5; fachadas en 6,5. Mapa: ±46.
// ============================================================
const BA = window.__BA = { built: false, lights: [], fire: null, train: null, barrier: null, kids: [], fisuras: [], dogs: [], bar: [], t: 0, trainT: 25, remis: null };
const BA_R = 46, BA_F = 6.5;   // mitad del mapa, línea de fachadas
// ---------- texturas propias ----------
const BA_TEX = {};
function baTex(name, fn) { return BA_TEX[name] || (BA_TEX[name] = fn()); }
function baFlagTex() { return canvasTex(192, 128, (g, w, h) => { g.fillStyle = '#74acdf'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(0, h / 3, w, h / 3); g.fillStyle = '#f6b40e'; g.beginPath(); g.arc(w / 2, h / 2, 13, 0, 7); g.fill(); }); }
function baBrickTex() { return canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#6a5a4a'; g.fillRect(0, 0, w, h); for (let y = 0, r = 0; y < h; y += 10, r++) for (let x = -(r % 2) * 14; x < w; x += 28) { const v = Math.random() * 30 | 0; g.fillStyle = `rgb(${150 + v},${70 + v / 2},${45 + v / 3})`; g.fillRect(x + 1, y + 1, 26, 8); } }); }
function baTejaTex() { return canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#7a2a1a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 16) { const v = Math.random() * 30 | 0; g.fillStyle = `rgb(${160 + v},${70 + v / 2},${40})`; g.beginPath(); g.ellipse(x + 8, y + 8, 8, 6, 0, 0, Math.PI); g.fill(); } }); }
function baTileTex(c1, c2) { return canvasTex(64, 64, (g, w, h) => { for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { g.fillStyle = ((x + y) / 16) % 2 ? c1 : c2; g.fillRect(x, y, 16, 16); } }); }
// ---------- fachada genérica (local: la fachada mira a +z, en z = 0; el edificio va hacia -z) ----------
function baFacade(sc, x, z, rotY, w, h, o) {
  o = o || {};
  let g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; sc.add(g);
  const color = o.color !== undefined ? o.color : pick([0xd83a2a, 0x2a6ad0, 0xe8c030, 0x2a9a5a, 0xe87a2a, 0x7a3a9a, 0x4ab8d8, 0xe85a8a, 0xf0e8d0, 0x3ac0a0, 0xc8b8a0]);
  const chapa = o.chapa !== undefined ? o.chapa : Math.random() < 0.5;
  const brick = !chapa && !o.shop && (o.brick !== undefined ? o.brick : Math.random() < 0.3);
  const wall = chapa ? texMat(CHAPA_TEX, w / 1.6, h / 2, { color, roughness: 0.6, metalness: 0.25 })
    : brick ? texMat(baTex('ladrillo', baBrickTex), w / 2.2, h / 1.4, { roughness: 0.9 }) : texMat(revoqueTex, w / 3, h / 3, { color, roughness: 0.92 });
  // casa con jardincito al frente: la fachada se corre 2 m para atrás y adelante va la reja con plantas
  const jardin = !o.shop && (o.jardin !== undefined ? o.jardin : Math.random() < 0.3), back = jardin ? 2.2 : 0;
  const body = new THREE.Group(); body.position.z = -back; g.add(body);
  box(w, h, 9, wall, 0, h / 2, -4.5, body);
  if (jardin) {
    const pasto = new THREE.Mesh(new THREE.PlaneGeometry(w, back), texMat(grassTex, w / 3, 1, { color: 0x5a7a4a })); pasto.rotation.x = -Math.PI / 2; pasto.position.set(0, 0.02, -back / 2); g.add(pasto);
    box(w, 0.5, 0.18, texMat(revoqueTex, w / 2, 0.3, { color: 0xd8d0c0 }), 0, 0.25, -0.05, g);                           // murito
    const rj = new THREE.Mesh(new THREE.PlaneGeometry(w - 1.4, 1.1), new THREE.MeshBasicMaterial({ map: barsTex, transparent: true, color: 0x1a1a1a })); rj.position.set(0.7, 1.05, -0.05); g.add(rj);   // reja
    box(1.2, 1.6, 0.05, trofiMat(0x1a1a1a, { metalness: 0.5 }), -w / 2 + 0.7, 0.8, -0.05, g, false);                         // portoncito
    for (let i = 0; i < 3; i++) sph(rand(0.3, 0.5), rand(0.4, 0.7), rand(0.3, 0.5), trofiMat(pick([0x2a5a24, 0x3a6a2a, 0x2a4a1e])), rand(-w / 2 + 1.5, w / 2 - 0.6), 0.4, -back + 0.6, g);
  }
  // techo de tejas a dos aguas en algunas casas bajas
  if (!o.shop && h < 5 && Math.random() < 0.4) {
    const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.3, 0); sh.lineTo(w / 2 + 0.3, 0); sh.lineTo(0, 1.6); sh.closePath();
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 9.4, bevelEnabled: false }), texMat(baTex('tejas', baTejaTex), w / 2, 3, { roughness: 0.85 })); roof.position.set(0, h, -9.2); roof.castShadow = true; body.add(roof);
  }
  // equipo de aire y reja alta en la puerta, a veces
  if (!o.shop && Math.random() < 0.35) { box(0.85, 0.55, 0.4, trofiMat(0xd8d8d0, { roughness: 0.5 }), rand(-w / 3, w / 3), h - 1.0, 0.2, body); }
  const G0 = g; g = body;   // de acá en adelante la fachada se arma sobre el cuerpo (corrido si tiene jardín)
  box(w + 0.12, 0.28, 0.5, texMat(revoqueTex, w / 3, 0.2, { color: 0xd8d2c4 }), 0, h - 0.12, 0.05, g);   // cornisa
  box(w, 0.4, 0.08, trofiMat(0x2e2a26), 0, 0.2, 0.04, g);                                                 // zócalo
  if (o.tanque !== false && Math.random() < 0.6) {   // tanque de agua en el techo (bien porteño)
    const tx = rand(-w / 3, w / 3); cyl(0.6, 0.6, 1.1, trofiMat(pick([0x2a2a2a, 0x8a8a86, 0x1a4a8a]), { roughness: 0.5 }), tx, h + 0.75, -3, g, 12);
    for (const s of [-0.4, 0.4]) box(0.08, 0.5, 0.08, trofiMat(0x3a3a3a), tx + s, h + 0.25, -3, g, false);
  }
  if (Math.random() < 0.3) { cyl(0.02, 0.02, 2.2, trofiMat(0x888888, { metalness: 0.6 }), rand(-w / 3, w / 3), h + 1.1, -1.5, g, 4); }   // antena
  if (o.shop) baShopFront(g, w, h, o.shop);
  else {
    const wood = trofiMat(pick([0x5a3a22, 0x3a2a1a, 0x2a4a3a, 0x6a2a1a]), { roughness: 0.7 });
    const trim = trofiMat(pick([0xf0e8d0, 0x1a6a3a, 0x2a4ad0, 0xe8c030, 0xd83a2a]), { roughness: 0.6 });
    const dx = o.doorX !== undefined ? o.doorX : -w * 0.25;
    box(1.2, 2.4, 0.06, trim, dx, 1.2, 0.03, g, false); box(1.0, 2.25, 0.08, wood, dx, 1.12, 0.06, g);
    const wx = dx > 0 ? -w * 0.2 : w * 0.18, candle = o.candle !== undefined ? o.candle : Math.random() < 0.5;
    box(1.6, 1.5, 0.06, trim, wx, 1.6, 0.03, g, false);
    box(1.4, 1.3, 0.06, candle ? new THREE.MeshBasicMaterial({ color: 0x3a2410 }) : trofiMat(0x0e1218, { roughness: 0.2 }), wx, 1.6, 0.06, g, false);
    if (candle) { const v = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc060 })); v.position.set(wx + rand(-0.4, 0.4), 1.15, 0.08); g.add(v); trofiHalo(g, v.position.x, 1.2, 0.2, 0xff9a30, 0.9, 0.55); }   // vela en la ventana
    const rj = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.4), new THREE.MeshBasicMaterial({ map: barsTex, transparent: true, color: 0x1a1a1a })); rj.position.set(wx, 1.6, 0.12); g.add(rj);
    box(1.42, rand(0.4, 1.0), 0.07, trofiMat(pick([0x7a6a52, 0x5a6a52, 0x8a5a3a, 0x6a6a6a])), wx, 2.1, 0.1, g, false);
    if (o.num) { const n = trofiLabel(String(o.num), 0.42, 0.2, '#1a3a6a', '#ffffff'); n.position.set(dx, 2.55, 0.08); g.add(n); }
    if (Math.random() < 0.3) { const rr = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.4), new THREE.MeshBasicMaterial({ map: barsTex, transparent: true, color: 0x111111 })); rr.position.set(dx, 1.2, 0.14); g.add(rr); }   // reja alta en la puerta
    if (h > 5.5) { box(1.6, 0.1, 0.7, trofiMat(0x8a8a86), wx, 3.4, 0.4, g); for (let i = 0; i < 7; i++) box(0.03, 0.8, 0.03, trofiMat(0x1a1a1a, { metalness: 0.5 }), wx - 0.75 + i * 0.25, 3.85, 0.72, g, false); box(1.2, 1.6, 0.06, trofiMat(0x0e1218, { roughness: 0.2 }), wx, 4.4, 0.04, g, false); }
  }
  G0.userData.body = body; return G0;
}
// frente de negocio: vidriera (iluminada si tiene luz propia), cartel, toldo, puerta
function baShopFront(g, w, h, s) {
  const lit = !!s.lit;
  box(w * 0.62, 1.9, 0.06, lit ? new THREE.MeshStandardMaterial({ color: 0x1a1410, emissive: s.glow || 0x6a4a20, emissiveIntensity: 0.9 }) : trofiMat(0x0c0e12, { roughness: 0.15 }), -w * 0.12, 1.45, 0.05, g, false);
  const rj = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.64, 1.95), new THREE.MeshBasicMaterial({ map: barsTex, transparent: true, color: 0x1a1a1a, opacity: 0.6 })); rj.position.set(-w * 0.12, 1.45, 0.1); g.add(rj);
  box(1.0, 2.3, 0.08, trofiMat(s.door || 0x4a3a2a), w * 0.32, 1.15, 0.05, g);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, 0.75), new THREE.MeshBasicMaterial({ map: s.tex || canvasTex(512, 96, (c, cw, ch) => { c.fillStyle = s.bg || '#1a1a1a'; c.fillRect(0, 0, cw, ch); c.strokeStyle = s.fg || '#fff'; c.lineWidth = 3; c.strokeRect(5, 5, cw - 10, ch - 10); c.fillStyle = s.fg || '#fff'; c.font = `bold ${s.font || 50}px 'Arial Black', Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.sign, cw / 2, ch / 2 + 2, cw - 24); }) }));
  sg.position.set(0, 2.95, 0.09); g.add(sg);
  if (s.sub) { const sub = trofiLabel(s.sub, w * 0.55, 0.22, '#f2f0e8', '#1a1a1a'); sub.position.set(-w * 0.12, 0.7, 0.11); g.add(sub); }
  if (s.awning) { const awn = canvasTex(256, 64, (c, cw, ch) => { for (let x = 0; x < cw; x += 32) { c.fillStyle = (x / 32) % 2 ? s.awning[0] : s.awning[1]; c.fillRect(x, 0, 32, ch); } }); const t = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.95, 1.5), new THREE.MeshStandardMaterial({ map: awn, side: THREE.DoubleSide, roughness: 0.8 })); t.position.set(0, 2.45, 0.7); t.rotation.x = -Math.PI / 2 + 0.45; g.add(t); }
  if (lit) { const l = new THREE.PointLight(s.light || 0xffd8a0, 0.9, 8, 1.8); l.position.set(0, 2.0, 1.6); g.add(l); BA.lights.push(l); trofiHalo(g, -w * 0.12, 1.5, 0.4, s.light || 0xffd8a0, 3.2, 0.25); }
}
// ---------- calles, veredas, cordones, esquinas ----------
function baStreets(sc) {
  const L = BA_R * 2;
  const plane = (w, d, x, z, m, y) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y || 0, z); p.receiveShadow = true; sc.add(p); return p; };
  plane(L + 40, 8, 0, 0, texMat(calleTexAdoquin(), (L + 40) / 4, 2, { roughness: 0.88 }), 0.002);                // Calle Las Acacias (adoquines)
  plane(8, L + 20, 0, 0, texMat(asphaltTex, 2, (L + 20) / 6, { color: 0x6a6c70, roughness: 0.95 }), 0.004);       // Pasaje 14 (asfalto)
  const vain = texMat(calleTexVainilla(), 2, 1, { roughness: 0.9 });
  for (const s of [-1, 1]) {
    plane(L, 2.5, 0, s * 5.25, texMat(calleTexVainilla(), L / 1.2, 2, { roughness: 0.9 }), 0.012);
    plane(2.5, L, s * 5.25, 0, texMat(calleTexVainilla(), 2, L / 1.2, { roughness: 0.9 }), 0.013);
    for (const t of [-1, 1]) { box(BA_R - 4, 0.15, 0.22, texMat(concreteTex, 16, 1, { color: 0xb0aca2 }), t * (4 + (BA_R - 4) / 2), 0.07, s * 4.05, sc); box(0.22, 0.15, BA_R - 4, texMat(concreteTex, 1, 16, { color: 0xb0aca2 }), s * 4.05, 0.07, t * (4 + (BA_R - 4) / 2), sc); }
  }
  // senda peatonal en la esquina
  for (let i = -3; i <= 3; i++) { box(0.5, 0.01, 2.2, new THREE.MeshBasicMaterial({ color: 0xa8a49a }), i * 1.0, 0.016, -5.2, sc, false); box(2.2, 0.01, 0.5, new THREE.MeshBasicMaterial({ color: 0xa8a49a }), 5.2, 0.017, i * 1.0, sc, false); }
  // más allá de las manzanas: piso oscuro
  plane(400, 400, 0, 0, trofiMat(0x15171c, { roughness: 1 }), -0.02);
}
// ---------- árboles, postes apagados, cables ----------
function baStreetFurniture(sc) {
  const skip = (x, z) => (Math.abs(x) < 9 && Math.abs(z) < 9) || (x > 6 && x < 23 && z > 6 && z < 23);   // esquina y estación
  for (let a = -40; a <= 40; a += 10) for (const s of [-1, 1]) {
    for (const [x, z] of [[a, s * 5.6], [s * 5.6, a]]) {
      if (skip(x, z)) continue;
      box(0.9, 0.12, 0.9, trofiMat(0x3a2a1e), x, 0.06, z, sc);
      cyl(0.14, 0.2, 3.2, trofiMat(0x8a7a62), x, 1.6, z, sc, 8);
      for (let i = 0; i < 3; i++) sph(rand(1.2, 1.7), rand(0.9, 1.3), rand(1.2, 1.7), trofiMat(pick([0x22401e, 0x2c4c24, 0x223a1c])), x + rand(-0.5, 0.5), 3.8 + rand(0, 0.7), z + rand(-0.4, 0.4), sc);
      addObstacle(x, z, 0.45, 0.45);
    }
  }
  // postes de luz APAGADOS (se cortó la luz) y cables
  for (let a = -38; a <= 38; a += 19) for (const [x, z] of [[a, 4.6], [4.6, a]]) {
    if (skip(x, z)) continue;
    cyl(0.1, 0.14, 7, trofiMat(0x4a3a2a), x, 3.5, z, sc, 8);
    box(0.4, 0.14, 0.3, trofiMat(0x2a2a26, { roughness: 0.4 }), x - (z === 4.6 ? 0 : 0.8), 6.85, z - (z === 4.6 ? 0.8 : 0), sc, false);
    addObstacle(x, z, 0.35, 0.35);
  }
  for (const y of [6.3, 6.0]) { box(BA_R * 2, 0.025, 0.025, trofiMat(0x111111), 0, y, 4.6, sc, false); box(0.025, 0.025, BA_R * 2, trofiMat(0x111111), 4.6, y, 0, sc, false); }
  for (let i = 0; i < 8; i++) { const c = box(0.02, 0.02, 9.5, trofiMat(0x111111), rand(-40, 40), 6.1, 0, sc, false); }
}
// ---------- manzana NO: comercios ----------
function baComercios(sc) {
  const sh = (x, z, r, w, h, shop, extra) => { const g = baFacade(sc, x, z, r, w, h, { shop, tanque: true, chapa: false, color: shop.wall }); if (extra) extra(g); return g; };
  // sobre la Calle Las Acacias (fachadas mirando a +z en z = -6.5), desde la esquina hacia el oeste
  sh(-10, -BA_F, 0, 7, 4.6, { sign: 'MAXIKIOSCO 24 HS', bg: '#c0302a', fg: '#fff4d0', lit: true, light: 0xfff0d0, glow: 0x8a7a50, sub: 'HAY PILAS · VELAS · HIELO', wall: 0xe8e0d0 });
  sh(-18, -BA_F, 0, 8, 4.4, { sign: 'ALMACÉN "LO DE TOTO"', bg: '#1e4a8a', fg: '#ffe8a0', sub: 'FIAMBRES · BEBIDAS · LIBRETA', wall: 0xd8c8a0 }, g => { for (let i = 0; i < 3; i++) { box(0.6, 0.35, 0.45, trofiMat(0x9a6a3a), -2.4 + i * 0.75, 0.2, 0.6, g); sph(0.24, 0.16, 0.18, trofiMat(pick([0xd83a2a, 0xe8a020, 0x5a9a3a])), -2.4 + i * 0.75, 0.45, 0.6, g); } });
  BA.barSpot = sh(-27, -BA_F, 0, 9, 4.8, { sign: 'Bar El Gomero', tex: hdFiletTex('Bar El Gomero'), wall: 0x2a6a4a, awning: ['#f4f0e0', '#2a6a3a'] });
  sh(-36, -BA_F, 0, 7, 4.2, { sign: 'PANCHOS EL GORDO', bg: '#e8c020', fg: '#c02a1a', sub: 'SUPER PANCHO · PAPAS PAY', wall: 0xe87a2a, awning: ['#e8c020', '#c02a1a'] });
  sh(-43.5, -BA_F, 0, 6, 4.2, { sign: 'CARNICERÍA DON JULIO', bg: '#a01a14', fg: '#fff', sub: 'ASADO · VACÍO · MOLLEJAS', wall: 0xf2f2ea, door: 0x7a1a14 });
  // sobre el Pasaje 14 (fachadas mirando a +x en x = -6.5), desde la esquina hacia el norte
  sh(-BA_F, -12, Math.PI / 2, 8, 4.6, { sign: 'SUPERMERCADO "EL DRAGÓN"', bg: '#b81a14', fg: '#ffd84a', lit: true, light: 0xffb0a0, glow: 0x8a3a2a, sub: 'ABIERTO · HAY GENERADOR', wall: 0xe8e8e0 }, g => { for (const x of [-2.5, 0, 2.5]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff3020 })); l.position.set(x, 3.55, 0.5); l.scale.y = 1.25; g.add(l); trofiHalo(g, x, 3.55, 0.6, 0xff4020, 1.2, 0.45); } });
  sh(-BA_F, -21, Math.PI / 2, 8, 4.4, { sign: 'PIZZERÍA LA MUZZA', bg: '#1a6a3a', fg: '#fff', lit: true, light: 0xff9a40, glow: 0x9a4a10, sub: 'HORNO A LEÑA · SIN LUZ IGUAL HORNEAMOS', wall: 0xd8b890, awning: ['#d83a2a', '#f4f0e0'] });
  sh(-BA_F, -30, Math.PI / 2, 8, 4.8, { sign: 'BIRRA & CAFÉ DE ESPECIALIDAD', bg: '#141414', fg: '#e8e0c8', font: 40, sub: 'BRUNCH · VINILOS · PLANTAS', wall: 0x2a2a2c, door: 0x111111 }, g => {
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd090 })); b.position.set(-3.6 + i * 0.9, 3.4 - Math.sin(i / 8 * Math.PI) * 0.25, 0.4); g.add(b); if (i % 2 === 0) trofiHalo(g, b.position.x, b.position.y, 0.5, 0xffc070, 0.7, 0.5); }   // lamparitas a batería
    for (const x of [-3, -1.2]) { const bike = baBike(); bike.position.set(x, 0, 1.2); bike.rotation.y = 0.2; g.add(bike); }
    for (const x of [2.8, 3.4]) { cyl(0.22, 0.18, 0.45, trofiMat(0x7a5a3a), x, 0.22, 0.5, g, 10); sph(0.35, 0.55, 0.35, trofiMat(0x2a6a2a), x, 0.8, 0.5, g); }   // macetas
  });
  baFacade(sc, -BA_F, -39, Math.PI / 2, 7, 4.2, {});   // casas comunes (sin cartel)
  baFacade(sc, -BA_F, -44, Math.PI / 2, 4, 4.0, {});
}
// bici sencilla (también para los pibes que hacen willy)
function baBike() {
  const g = new THREE.Group(), metal = trofiMat(pick([0xd83a2a, 0x2a6ad0, 0x111111, 0xe8c030]), { metalness: 0.5, roughness: 0.4 }), black = trofiMat(0x111111);
  for (const x of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 24), black); w.position.set(x, 0.35, 0); g.add(w); }
  const tube = (x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy); const c = cyl(0.02, 0.02, l, metal, (x1 + x2) / 2, (y1 + y2) / 2, 0, g, 6); c.rotation.z = Math.atan2(dx, dy) * -1; };
  tube(-0.5, 0.35, -0.05, 0.75); tube(-0.05, 0.75, 0.42, 0.78); tube(-0.05, 0.75, 0.05, 0.35); tube(0.05, 0.35, 0.42, 0.78); tube(0.42, 0.78, 0.5, 0.35); tube(-0.5, 0.35, 0.05, 0.35);
  box(0.22, 0.05, 0.1, black, -0.08, 0.82, 0, g); box(0.04, 0.04, 0.5, black, 0.44, 0.92, 0, g);
  return g;
}
// ---------- manzana NE: la plaza ----------
function baPlaza(sc) {
  const cx = 26, cz = -26, S = 39;
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(S, S), texMat(grassTex, 10, 10, { color: 0x4a6a3a })); grass.rotation.x = -Math.PI / 2; grass.position.set(cx, 0.01, cz); grass.receiveShadow = true; sc.add(grass);
  const dirt = texMat(concreteTex, 4, 1, { color: 0x8a7a5a, roughness: 0.95 });
  for (const a of [Math.PI / 4, -Math.PI / 4]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(S * 1.35, 3), dirt); p.rotation.x = -Math.PI / 2; p.rotation.z = a; p.position.set(cx, 0.02, cz); p.receiveShadow = true; sc.add(p); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(5, 8, 40), dirt); ring.rotation.x = -Math.PI / 2; ring.position.set(cx, 0.021, cz); sc.add(ring);
  // mástil con bandera en el centro
  cyl(0.08, 0.1, 9, trofiMat(0xd8d8d8, { metalness: 0.7 }), cx, 4.5, cz, sc, 10); box(2.0, 0.5, 0.06, texMat(revoqueTex, 1, 0.3, { color: 0xb8b0a0 }), cx, 0.25, cz, sc);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2, 8, 4), new THREE.MeshStandardMaterial({ map: baTex('flag', baFlagTex), side: THREE.DoubleSide, roughness: 0.8 })); flag.position.set(cx + 0.95, 8.2, cz); sc.add(flag); BA.flag = flag;
  addObstacle(cx, cz, 2.2, 0.6);
  // árboles, bancos, juegos, cartel
  for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14], [-15, 0], [15, 0], [0, -15], [0, 15], [-8, -16], [8, 16]]) {
    cyl(0.2, 0.28, 3.4, trofiMat(0x4a3a2a), cx + x, 1.7, cz + z, sc, 8); sph(2.0, 1.8, 2.0, trofiMat(pick([0x22401e, 0x2c4c24, 0x1e3a18])), cx + x, 4.4, cz + z, sc); addObstacle(cx + x, cz + z, 0.6, 0.6);
  }
  for (const [x, z, r] of [[-6, -9, 0], [6, 9, Math.PI], [-9, 6, Math.PI / 2], [9, -6, -Math.PI / 2]]) {
    const b = new THREE.Group(); b.position.set(cx + x, 0, cz + z); b.rotation.y = r; sc.add(b);
    box(2.0, 0.08, 0.5, trofiMat(0x6a4a2a), 0, 0.48, 0, b); box(2.0, 0.45, 0.06, trofiMat(0x6a4a2a), 0, 0.78, -0.25, b); for (const s of [-0.85, 0.85]) box(0.08, 0.48, 0.5, trofiMat(0x2a2a2a, { metalness: 0.5 }), s, 0.24, 0, b);
    addObstacle(cx + x, cz + z, r === 0 || r === Math.PI ? 2.0 : 0.6, r === 0 || r === Math.PI ? 0.6 : 2.0);
  }
  // hamacas y tobogán
  const jx = cx + 11, jz = cz - 8, red = trofiMat(0xc0302a, { metalness: 0.4 }), blue = trofiMat(0x2a4ab8, { metalness: 0.4 });
  for (const s of [-1.6, 1.6]) { const p = cyl(0.06, 0.06, 2.8, red, jx + s, 1.3, jz, sc, 6); p.rotation.z = s > 0 ? -0.15 : 0.15; }
  box(3.6, 0.08, 0.08, red, jx, 2.6, jz, sc);
  for (const s of [-0.6, 0.6]) { box(0.45, 0.05, 0.25, trofiMat(0x222222), jx + s, 0.55, jz, sc); for (const d of [-0.18, 0.18]) box(0.015, 2.05, 0.015, trofiMat(0x888888), jx + s + d, 1.58, jz, sc, false); }
  addObstacle(jx, jz, 3.8, 0.6);
  const sl = box(0.7, 0.06, 3.2, blue, cx - 11, 1.0, cz - 9, sc); sl.rotation.x = 0.5; box(0.9, 0.9, 0.9, blue, cx - 11, 1.6, cz - 10.6, sc, false); for (let i = 0; i < 4; i++) box(0.6, 0.05, 0.12, red, cx - 11, 0.4 + i * 0.4, cz - 11.3, sc, false);
  addObstacle(cx - 11, cz - 9.8, 1.0, 3.4);
  const sign = trofiLabel('LA PLAZA ES DEL BARRIO', 4.5, 0.7, '#2a6ad0', '#ffffff'); sign.position.set(cx - 12, 2.4, -7.0); sc.add(sign);
  for (const s of [-2, 2]) cyl(0.06, 0.06, 2.6, trofiMat(0x6a6c70, { metalness: 0.6 }), cx - 12 + s, 1.3, -7.0, sc, 6);
  BA.plaza = { x: cx, z: cz, r: 16 };
}
