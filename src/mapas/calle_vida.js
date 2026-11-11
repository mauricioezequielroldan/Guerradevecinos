// ============================================================
// LA CALLE DEL BARRIO, CON VIDA Y BIEN ARGENTINA
// Obelisco al fondo (la cuadra desemboca en la 9 de Julio), garita pintada, teléfono público viejo,
// banderines celeste y blanco, ropa colgada, mural, Amaroki, auto tuneado al piso con neón y cumbia,
// perros callejeros, el motochorro que da vueltas a la manzana y el vecino tomando mate.
// ============================================================
const VIDA = { dogs: [], moto: null, tuning: null, mate: null, t: 0, bassT: 0 };
// ---------- el Obelisco y la 9 de Julio, al fondo de la calle ----------
function vidaObelisco(sc) {
  const g = new THREE.Group(); g.position.set(118, 0, 0); sc.add(g);
  const white = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.6, emissive: 0x2a2a30, emissiveIntensity: 0.6 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 3.2, 52, 4), white); shaft.rotation.y = Math.PI / 4; shaft.position.y = 26; g.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(1.6 * 1.414, 4, 4), white); tip.rotation.y = Math.PI / 4; tip.position.y = 54; g.add(tip);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), new THREE.MeshBasicMaterial({ color: 0xffe8b0 })); win.position.set(-1.7, 50, 0); g.add(win);
  trofiHalo(sc, 118, 30, 0, 0xfff0d8, 30, 0.18); trofiHalo(sc, 118, 5, 0, 0xffe0b0, 26, 0.22);
  // la avenida: faroles altos, edificios con ventanas encendidas y carteles
  const winTex = canvasTex(64, 128, (c, w, h) => { c.fillStyle = '#1a1e28'; c.fillRect(0, 0, w, h); for (let y = 4; y < h; y += 10) for (let x = 4; x < w; x += 10) { c.fillStyle = Math.random() < 0.45 ? '#ffd890' : '#2a2e3a'; c.fillRect(x, y, 6, 6); } });
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
    const h = rand(18, 48), w = rand(8, 14), b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 10), new THREE.MeshBasicMaterial({ map: winTex, color: 0xffffff }));
    b.position.set(96 + i * 6 + rand(-2, 2), h / 2, side * rand(30, 48)); sc.add(b);
  }
  for (let z = -40; z <= 40; z += 8) { const l = trofiHalo(sc, 92, 10, z, 0xffc070, 3.5, 0.6); }
  const cartel = trofiLabel('AV. 9 DE JULIO', 5, 0.9, '#1e6a3a', '#ffffff'); cartel.position.set(44.5, 3.2, -3.9); cartel.rotation.y = -Math.PI / 2; sc.add(cartel);
}
// ---------- garita policial pintada ----------
function vidaGarita(sc, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); sc.add(g);
  const paint = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#6ab8e8'; c.fillRect(0, 0, w, h); c.fillStyle = '#f4f4f4'; c.fillRect(0, h / 3, w, h / 3);
    c.fillStyle = '#e8b830'; c.beginPath(); c.arc(w / 2, h / 2, 26, 0, 7); c.fill();   // el sol
    c.font = "bold 42px 'Arial Black'"; c.fillStyle = '#d82a6a'; c.save(); c.translate(30, 220); c.rotate(-0.15); c.fillText('LA PAR', 0, 0); c.restore();
    c.font = "bold 30px Arial"; c.fillStyle = '#1a1a1a'; c.fillText('VAMOS', 150, 60);
    for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`; c.fillRect(Math.random() * w, Math.random() * h, 3, 12); }
  });
  const m = new THREE.MeshStandardMaterial({ map: paint, roughness: 0.8 });
  box(1.5, 2.3, 1.5, m, 0, 1.15, 0, g); box(1.8, 0.15, 1.8, trofiMat(0x3a5a8a), 0, 2.38, 0, g);
  box(1.0, 0.6, 0.05, trofiMat(0x141820, { roughness: 0.1 }), 0, 1.6, 0.76, g, false);
  const l = trofiLabel('POLICÍA', 1.2, 0.22, '#1a3a7a', '#f4f4f4'); l.position.set(0, 2.15, 0.77); g.add(l);
  addObstacle(x, z, 1.6, 1.6);
}
// ---------- teléfono público de los viejos ----------
function vidaTelefono(sc, x, z, face) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face; sc.add(g);
  const blue = trofiMat(0x2a4a8a, { roughness: 0.5, metalness: 0.3 }), gray = trofiMat(0x8a9098, { metalness: 0.6 });
  cyl(0.06, 0.08, 1.2, gray, 0, 0.6, 0, g, 8);
  box(0.55, 0.75, 0.35, blue, 0, 1.55, 0, g); box(0.6, 0.12, 0.5, blue, 0, 1.98, 0.06, g);                   // caja y techito
  box(0.4, 0.28, 0.04, trofiMat(0x111316), 0, 1.68, 0.18, g, false);                                        // pantallita
  for (let i = 0; i < 12; i++) box(0.05, 0.04, 0.02, trofiMat(0xd8d8d8), -0.09 + (i % 3) * 0.09, 1.42 - Math.floor(i / 3) * 0.06, 0.18, g, false);   // teclado
  const tub = box(0.08, 0.32, 0.08, trofiMat(0x111111), 0.22, 1.5, 0.2, g); tub.rotation.z = 0.12;          // tubo
  const cord = cyl(0.01, 0.01, 0.35, trofiMat(0x222222), 0.2, 1.25, 0.2, g, 4); cord.rotation.z = 0.3;
  const lbl = trofiLabel('TELÉFONO PÚBLICO · TARJETAS Y COSPELES', 0.55, 0.09, '#f2f0e8', '#1a3a7a'); lbl.position.set(0, 1.9, 0.19); g.add(lbl);
  addObstacle(x, z, 0.6, 0.6);
}
// ---------- banderines celeste y blanco, ropa colgada, mural ----------
function vidaBanderines(sc) {
  for (const x of [-20, 14]) {   // dos sogas, altas, para no tapar el Obelisco
    const n = 22;
    for (let i = 0; i < n; i++) {
      const z = -5.6 + i * (11.2 / (n - 1)), y = 6.6 - Math.sin(i / (n - 1) * Math.PI) * 0.7;
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 3), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xc8c8c8 : 0x4a90c0, side: THREE.DoubleSide }));   // con color propio: de noche no se ven negros
      f.position.set(x, y - 0.18, z); f.rotation.x = Math.PI; f.scale.z = 0.15; sc.add(f);
    }
    box(0.015, 0.015, 11.2, trofiMat(0x222222), x, 6.45, 0, sc, false);
  }
}
function vidaRopa(sc, x, z) {
  const cols = [0xd83a2a, 0xf4f4f4, 0x2a6ad0, 0xe8c030, 0x2a9a5a, 0xe85a8a];
  box(3.2, 0.012, 0.012, trofiMat(0x222222), x, 3.9, z, sc, false);
  for (let i = 0; i < 6; i++) { const w = rand(0.35, 0.55), h = rand(0.45, 0.8), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: cols[i], side: THREE.DoubleSide, roughness: 0.9 })); m.position.set(x - 1.3 + i * 0.52, 3.9 - h / 2, z); sc.add(m); VIDA.ropa = (VIDA.ropa || []).concat(m); }
}
function vidaMural(sc) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(7, 3), new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(700, 300, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6ab8e8'); gr.addColorStop(0.5, '#f4f4f4'); gr.addColorStop(1, '#6ab8e8'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e8b830'; c.beginPath(); c.arc(110, 150, 70, 0, 7); c.fill(); for (let a = 0; a < 16; a++) { c.save(); c.translate(110, 150); c.rotate(a / 16 * 6.283); c.fillRect(75, -6, 30, 12); c.restore(); }
    c.fillStyle = '#1a1a1a'; c.font = "bold 46px 'Arial Black'"; c.fillText('EN ESTE BARRIO', 230, 120); c.fillStyle = '#c0300f'; c.fillText('NO SE RINDE NADIE', 220, 190);
    c.font = "italic 26px Georgia"; c.fillStyle = '#1a3a6a'; c.fillText('— Las Acacias', 470, 250);
  }) }));
  m.position.set(-34, 2.2, 5.88); m.rotation.y = Math.PI; sc.add(m);
}
// ---------- el auto tuneado al piso: neón abajo, llantas grandes, alerón y cumbia ----------
function vidaTuning(sc, x, z) {
  const car = trofiCar(0x7ad82a, ''); car.position.set(x, -0.12, z); car.rotation.y = Math.PI; sc.add(car);       // al piso
  car.traverse(o => { if (o.isMesh && o.geometry.type === 'CylinderGeometry' && o.position.y > 0.3 && o.position.y < 0.45) o.scale.set(1.08, 1.0, 1.08); });
  const sp = box(0.5, 0.06, 1.7, trofiMat(0x111111, { roughness: 0.3 }), -2.3, 1.18, 0, car); for (const s of [-0.7, 0.7]) box(0.08, 0.22, 0.06, trofiMat(0x111111), -2.25, 1.05, s, car);   // alerón
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.0), new THREE.MeshBasicMaterial({ color: 0x2af0ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  neon.rotation.x = -Math.PI / 2; neon.position.set(x, 0.02, z); sc.add(neon);
  const glow = new THREE.PointLight(0x2af0ff, 1.4, 6, 2); glow.position.set(x, 0.3, z); sc.add(glow);
  const st = trofiLabel('TURBO · 1.6 · FULL', 1.2, 0.18, 'rgba(0,0,0,0)', '#111'); st.position.set(0, 0.95, 0.92); car.add(st);
  const owner = person37(0x111111); owner.g.position.set(x + 1.6, 0, z + 1.3 * Math.sign(-z)); owner.g.rotation.y = -0.6; sc.add(owner.g);   // el dueño, apoyado
  addObstacle(x, z, car.userData.L + 0.2, car.userData.W + 0.2);
  VIDA.tuning = { car, neon, glow, owner, x, z };
}
// ---------- el motochorro: dos en una moto, dan vueltas a la manzana ----------
function vidaMoto(sc) {
  const g = new THREE.Group(); sc.add(g);
  const black = trofiMat(0x111214, { roughness: 0.4, metalness: 0.4 }), red = trofiMat(0xb02a1a, { roughness: 0.35, metalness: 0.4 });
  for (const x of [-0.65, 0.65]) { const w = cyl(0.32, 0.32, 0.12, black, x, 0.32, 0, g, 16); w.rotation.x = Math.PI / 2; }
  box(1.1, 0.3, 0.3, red, 0, 0.65, 0, g); box(0.6, 0.12, 0.32, black, -0.2, 0.86, 0, g); box(0.1, 0.5, 0.1, black, 0.55, 0.85, 0, g); box(0.08, 0.06, 0.7, black, 0.58, 1.1, 0, g);
  const head = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), new THREE.MeshBasicMaterial({ color: 0xfff4d0 })); head.position.set(0.67, 0.85, 0); head.rotation.y = Math.PI / 2; g.add(head);
  const riders = [];
  for (const [rx, c] of [[0.05, 0x2a2a30], [-0.45, 0x3a4a2a]]) {
    const p = person37(c); p.g.scale.setScalar(0.92); p.g.position.set(rx, 0.25, 0); p.g.rotation.y = Math.PI / 2; g.add(p.g);
    p.legs.forEach(l => { l.rotation.x = -1.25; }); p.arms.forEach(a => { a.rotation.x = -1.0; });
    const helmet = sph(0.16, 0.16, 0.17, trofiMat(rx > 0 ? 0x111111 : 0xd8d8d8, { roughness: 0.3, metalness: 0.3 }), 0, 1.62, 0, p.g);
    riders.push(p);
  }
  VIDA.moto = { g, x: -50, lane: -1.8, dir: 1, v: 9, slow: 0, said: 0, riders };
}
// ---------- perros de la calle (el perro de la plaza, paseando por la cuadra) ----------
class CalleDog extends Dog {
  constructor(color, x, z) {
    super(); this.pos.set(x, 0, z); this.root.position.copy(this.pos);
    this.root.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0xb07a3a) { o.material = o.material.clone(); o.material.color.setHex(color); } });
  }
  randGoal() { return new THREE.Vector3(rand(-34, 34), 0, pick([-4.6, 4.6, rand(-2.5, 2.5)])); }
}
// ---------- armar todo junto con la calle ----------
{
  const baseBuild = buildCalle;
  buildCalle = function () {
    const fresh = !CALLE.built; baseBuild(); if (!fresh) return;
    const sc = CALLE.scene, prev = scene; scene = sc; const o0 = obstacles.length;
    obstacles.push(...CALLE.obst);   // para que addObstacle sume a la lista de la calle
    vidaObelisco(sc); vidaGarita(sc, -4, 4.7); vidaTelefono(sc, 17.2, -4.75, 0); vidaTelefono(sc, -22, 4.75, Math.PI);
    vidaBanderines(sc); vidaRopa(sc, -14, -3.9); vidaRopa(sc, 19, 3.9); vidaMural(sc);
    const ama = pickup36(0xbac1c5); ama.position.set(-19, 0, 2.45); ama.rotation.y = Math.PI; sc.add(ama); addObstacle(-19, 2.45, 5.6, 2.3);
    vidaTuning(sc, 27, -2.45);
    vidaMoto(sc);
    for (const [c, x, z] of [[0x2a1a10, -10, 4.4], [0xe8d8b8, 12, -4.4], [0x8a6a4a, 30, 0]]) VIDA.dogs.push(new CalleDog(c, x, z));
    // el vecino tomando mate en la silla de playa, en la puerta
    const mate = person37(0x7a5a3a); mate.g.position.set(33, 0, 4.9); mate.g.rotation.y = Math.PI; sc.add(mate.g);
    mate.legs.forEach(l => { l.rotation.x = -1.4; }); mate.g.position.y = -0.38;
    box(0.6, 0.06, 0.55, trofiMat(0x2a6ad0), 33, 0.42, 4.95, sc); box(0.6, 0.6, 0.05, trofiMat(0x2a6ad0), 33, 0.72, 5.2, sc);   // silla
    cyl(0.07, 0.07, 0.3, trofiMat(0x9aa0a6, { metalness: 0.7 }), 33.5, 0.15, 4.7, sc, 10);                                    // termo
    VIDA.mate = mate;
    CALLE.obst = obstacles.splice(o0);
    scene = prev;
  };
  const baseWorld = updateWorld;
  updateWorld = function (dt) {
    baseWorld(dt);
    if (scene !== CALLE.scene) return;
    VIDA.t += dt; const P = player;
    for (const d of VIDA.dogs) d.update(dt);
    // motochorro: vuelta a la manzana; afloja al pasar al lado de Rubén y tira una frase
    const m = VIDA.moto;
    if (m) {
      const near = P && Math.abs(P.pos.x - m.x) < 4 && Math.abs(P.pos.z - m.lane) < 3;
      const want = near ? 2.5 : 9; m.v += (want - m.v) * Math.min(1, dt * 2);
      m.x += m.dir * m.v * dt; m.g.position.set(m.x, 0, m.lane); m.g.rotation.y = m.dir > 0 ? 0 : Math.PI;
      m.g.rotation.z = Math.sin(VIDA.t * 3) * 0.03;
      if (near && VIDA.t - m.said > 6) { m.said = VIDA.t; popText(new THREE.Vector3(m.x, 2.2, m.lane), pick(['¿Tenés hora, amigo?', '¿Qué hacés, rey? ¿Tenés un cargador?', 'Linda la llanta, jefe...', '¡Tranqui, tranqui, vamos de paso!']), 'warn', 2.2); if (typeof AC !== 'undefined' && AC) tone('square', 520, 500, 0.12, 0.06); }
      if (m.x * m.dir > 52) { m.dir *= -1; m.lane = m.dir > 0 ? -1.8 : 1.8; }   // dobla la esquina y vuelve por el otro carril
    }
    // auto tuneado: el neón respira y la cumbia retumba cuando Rubén está cerca
    const tu = VIDA.tuning;
    if (tu) {
      const pulse = 0.5 + 0.5 * Math.sin(VIDA.t * 6.3);
      tu.neon.material.opacity = 0.35 + pulse * 0.3; tu.glow.intensity = 0.9 + pulse * 0.8;
      tu.owner.g.rotation.y = -0.6 + Math.sin(VIDA.t * 0.7) * 0.15;
      const d = P ? Math.hypot(P.pos.x - tu.x, P.pos.z - tu.z) : 99;
      VIDA.bassT -= dt;
      if (d < 14 && VIDA.bassT <= 0 && typeof AC !== 'undefined' && AC) { VIDA.bassT = 0.625; const v = (1 - d / 14) * 0.25; tone('sine', 62, 48, 0.18, v); setTimeout(() => tone('sine', 62, 48, 0.12, v * 0.7), 312); }
    }
    if (VIDA.ropa) VIDA.ropa.forEach((r, i) => { r.rotation.x = Math.sin(VIDA.t * 1.3 + i) * 0.12; });
    if (VIDA.mate) VIDA.mate.arms[0].rotation.x = -1.2 + Math.max(0, Math.sin(VIDA.t * 0.5)) * -0.6;   // levanta el mate cada tanto
  };
}
