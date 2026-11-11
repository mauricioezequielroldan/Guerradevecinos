// ============================================================
// v7: EL BARRIO MÁS PESADO — auto desarmado, tacho con fuego, barro, calesita, linyera,
// golpes contra los objetos (mesas, calesita, auto) y caídas que no parecen una bolsa de papas.
// ============================================================
const SUB = { fire: null, calesita: null, mud: [], litter: [], smoke: [], emberT: 0 };
function inMud(x, z) { for (const m of SUB.mud) { const dx = (x - m.x) / m.rx, dz = (z - m.z) / m.rz; if (dx * dx + dz * dz < 1) return true; } return false; }

function rustTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6a3a22'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${pick([40, 120, 150, 90])},${pick([20, 60, 70, 40])},${pick([10, 30, 20])},${rand(0.1, 0.5)})`; g.fillRect(rand(0, w), rand(0, h), rand(1, 6), rand(1, 6)); }
    for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(30,15,8,${rand(0.2, 0.5)})`; g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(6, 30), rand(4, 18), rand(0, 3), 0, 7); g.fill(); }
  });
}
function mudTex() {
  return canvasTex(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(48,34,22,0.95)'); gr.addColorStop(0.7, 'rgba(58,42,28,0.85)'); gr.addColorStop(1, 'rgba(70,52,34,0)');
    g.fillStyle = gr; g.beginPath();
    for (let a = 0; a <= 6.3; a += 0.3) { const r = w * (0.36 + Math.sin(a * 3.1) * 0.06 + Math.random() * 0.06); g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
    g.fill();
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(20,14,8,${rand(0.2, 0.5)})`; g.beginPath(); g.arc(rand(60, 196), rand(60, 196), rand(2, 9), 0, 7); g.fill(); }
    for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(150,130,110,${rand(0.15, 0.35)})`; g.lineWidth = 2; g.beginPath(); g.arc(rand(70, 186), rand(70, 186), rand(6, 18), rand(0, 3), rand(3, 6)); g.stroke(); }  // brillos de agua
  });
}
function buildSuburbio() {
  const sc = plazaScene, prev = scene; scene = sc;
  const rust = rustTex();
  // ---------- barro: charcos marrones con brillo húmedo en la tierra ----------
  const mt = mudTex();
  for (const [x, z, rx, rz, rot] of [[6.5, -3.5, 1.9, 1.2, 0.4], [-5.5, 9.5, 2.3, 1.4, -0.3], [-13.2, -1.5, 1.5, 1.0, 0.9], [11.5, 3.0, 1.3, 0.9, 1.6], [1.5, 12.5, 1.7, 1.1, 0.2]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(rx * 2.4, rz * 2.4), new THREE.MeshStandardMaterial({ map: mt, transparent: true, roughness: 0.18, metalness: 0.05, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, 0.022, z); m.renderOrder = 1; sc.add(m);
    SUB.mud.push({ x, z, rx, rz });
  }
  // ---------- calesita (gira despacio y chirría) ----------
  {
    const g = new THREE.Group(); g.position.set(4.6, 0, 9.2); sc.add(g);
    const spin = new THREE.Group(); g.add(spin);
    const COLS = [0xd8402a, 0xe8c02a, 0x2a6ad0, 0x3aa04a, 0xe8e4d8, 0xd85aa0];
    cyl(1.75, 1.8, 0.16, texMat(rust, 2, 1, { roughness: 0.7, metalness: 0.4 }), 0, 0.22, 0, spin, 28);
    for (let i = 0; i < 12; i++) { const s = box(0.5, 0.02, 1.0, mat(COLS[i % COLS.length], { roughness: 0.5 }), 0, 0.31, 0, spin); const a = i / 12 * Math.PI * 2; s.position.set(Math.sin(a) * 1.2, 0.31, Math.cos(a) * 1.2); s.rotation.y = a; }
    cyl(0.09, 0.09, 2.6, mat(0xb8b4aa, { metalness: 0.7, roughness: 0.35 }), 0, 1.45, 0, spin, 10);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.75, 12, 1, true), mat(0xd8402a, { side: THREE.DoubleSide, roughness: 0.6 }));
    roof.position.y = 2.95; roof.castShadow = true; spin.add(roof);
    for (let i = 0; i < 6; i++) {   // caños y "caballitos" (asientos de colores)
      const a = i / 6 * Math.PI * 2, x = Math.sin(a) * 1.35, z = Math.cos(a) * 1.35;
      cyl(0.03, 0.03, 2.3, mat(0xd8d0b8, { metalness: 0.8, roughness: 0.3 }), x, 1.45, z, spin, 6);
      const seat = box(0.55, 0.32, 0.22, mat(COLS[i], { roughness: 0.5 }), x, 0.85 + (i % 2) * 0.25, z, spin); seat.rotation.y = a + Math.PI / 2;
    }
    addObstacle(4.6, 9.2, 3.4, 3.4); SUB.calesita = spin;
  }
  // ---------- auto desarmado en la vereda (sobre ladrillos, sin ruedas de un lado, vidrios rotos) ----------
  {
    const g = new THREE.Group(); g.position.set(-21.3, 0, 8.8); g.rotation.y = 0.06; sc.add(g);
    const paint = texMat(rust, 2, 1, { roughness: 0.55, metalness: 0.35, color: 0xb8c0a8 });
    const body = box(1.85, 0.62, 4.3, paint, 0, 0.62, 0, g); body.rotation.z = -0.07;    // inclinado: le faltan las ruedas del lado izquierdo
    const cab = box(1.6, 0.55, 2.1, paint, 0, 1.18, -0.25, g); cab.rotation.z = -0.07;
    const glass = mat(0x1a2026, { roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.55 });
    box(1.45, 0.42, 0.04, glass, 0, 1.2, 0.83, g, false);                                   // parabrisas (rajado: lo dibuja la textura de óxido)
    box(0.04, 0.38, 0.9, mat(0x050505), 0.81, 1.18, 0.15, g, false); box(0.04, 0.38, 0.9, glass, -0.81, 1.18, -0.75, g, false);   // ventanilla rota
    const hood = box(1.7, 0.05, 1.2, paint, 0, 1.22, 1.5, g); hood.rotation.x = -0.9; hood.position.set(0, 1.45, 1.05);        // capó abierto
    box(1.4, 0.35, 0.9, mat(0x1a1a1a, { roughness: 0.9 }), 0, 0.75, 1.55, g, false);       // motor sin nada
    for (const z of [-1.4, 1.35]) {   // lado derecho con ruedas pinchadas; lado izquierdo sobre ladrillos
      const w = cyl(0.33, 0.33, 0.22, mat(0x141414, { roughness: 0.9 }), 0.92, 0.3, z, g, 14); w.rotation.z = Math.PI / 2; w.scale.set(1, 1, 0.85);
      for (let k = 0; k < 3; k++) box(0.22, 0.09, 0.42, mat(0xa04a2a, { roughness: 0.95 }), -0.82, 0.05 + k * 0.1, z, g);
    }
    box(1.9, 0.18, 0.12, mat(0x2a2a2a), 0, 0.42, 2.18, g); box(1.9, 0.18, 0.12, mat(0x2a2a2a), 0, 0.42, -2.18, g);   // paragolpes
    addObstacle(-21.3, 8.8, 2.1, 4.4); SPOTS.auto = new THREE.Vector3(-21.3, 0, 8.8);
  }
  // ---------- tacho de 200 litros con fuego ----------
  {
    const x = -19.0, z = 12.6;
    const d = cyl(0.36, 0.36, 0.9, texMat(rust, 1, 1, { roughness: 0.75, metalness: 0.4 }), x, 0.45, z, sc, 18);
    for (const y of [0.2, 0.7]) cyl(0.375, 0.375, 0.04, mat(0x3a2418, { metalness: 0.5 }), x, y, z, sc, 18);
    const L = new THREE.PointLight(0xff8a2a, 2.6, 11, 1.6); L.position.set(x, 1.4, z); sc.add(L);
    const flames = [];
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: i % 2 ? 0xff6a10 : 0xffc040, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      s.position.set(x + rand(-0.12, 0.12), 1.0 + i * 0.12, z + rand(-0.12, 0.12)); sc.add(s); flames.push({ s, ph: rand(0, 6), base: 0.7 - i * 0.12 });
    }
    const smokeMat = () => new THREE.SpriteMaterial({ map: glowTex, color: 0x1a1612, transparent: true, opacity: 0.35, depthWrite: false });
    for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(smokeMat()); sc.add(s); SUB.smoke.push({ s, t: i / 6 * 4, x, z }); }
    addObstacle(x, z, 0.8, 0.8);
    SUB.fire = { L, flames, x, z };
    SPOTS.tacho = new THREE.Vector3(x, 0, z);
  }
  // ---------- ranchito del linyera: colchón, cartones, carrito ----------
  {
    const x = -19.4, z = 15.4;
    const ma = box(0.95, 0.14, 1.9, mat(0x8a7a5a, { roughness: 1 }), x, 0.07, z, sc); ma.rotation.y = 0.3;
    for (let i = 0; i < 4; i++) { const c = box(rand(0.5, 0.9), 0.01, rand(0.4, 0.7), mat(0xa88a5a, { roughness: 1 }), x + rand(-1, 1), 0.03, z + rand(-1.2, 1.2), sc, false); c.rotation.y = rand(0, 3); }
    const cart = new THREE.Group(); cart.position.set(x - 0.9, 0, z + 1.6); cart.rotation.y = 0.8; sc.add(cart);
    box(0.6, 0.45, 0.85, mat(0x9aa0a6, { metalness: 0.7, roughness: 0.4, wireframe: true }), 0, 0.6, 0, cart, false);
    for (const [cx, cz] of [[-0.25, -0.35], [0.25, -0.35], [-0.25, 0.35], [0.25, 0.35]]) sph(0.06, 0.06, 0.06, mat(0x111111), cx, 0.06, cz, cart, false);
    sph(0.35, 0.25, 0.3, mat(0x2a2a2a, { roughness: 0.4 }), 0, 0.85, 0, cart);   // bolsa de consorcio
    addObstacle(x, z, 1.1, 2.0);
    SPOTS.linyera = new THREE.Vector3(x + 0.85, 0, z - 0.1);
  }
  // ---------- basura que vuela con el viento ----------
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.18, 0.35), rand(0.2, 0.4)), mat(pick([0xe8e4d8, 0xd8402a, 0x2a6ad0, 0xf0f0f0, 0x3a6a3a]), { side: THREE.DoubleSide, roughness: 0.9 }));
    m.rotation.x = -Math.PI / 2; m.position.set(rand(-16, 16), 0.03, rand(-16, 16)); sc.add(m);
    SUB.litter.push({ m, vy: 0, air: false, t: rand(0, 10) });
  }
  scene = prev;
}
function updateSuburbio(dt) {
  if (SUB.calesita && !BREAK.calesitaRota) SUB.calesita.rotation.y += dt * 0.18;   // rota, queda trabada
  const F = SUB.fire;
  if (F) {
    F.L.intensity = 3.4 + Math.sin(worldT * 17) * 0.35 + Math.sin(worldT * 7.3) * 0.25 + rand(-0.2, 0.2);
    for (const f of F.flames) { const k = f.base * (0.85 + 0.25 * Math.sin(worldT * 11 + f.ph) + rand(-0.06, 0.06)); f.s.scale.set(k * 1.3, k * 2.1, 1); }
    SUB.emberT -= dt;
    if (SUB.emberT <= 0 && scene === plazaScene) { SUB.emberT = 0.18; spawnParticles(new THREE.Vector3(F.x, 1.0, F.z), 0xffa040, 1, 0.6, 1.2, 0.03, 1.5); }
  }
  for (const s of SUB.smoke) {
    s.t = (s.t + dt) % 4; const u = s.t / 4;
    s.s.position.set(s.x + Math.sin(u * 5 + s.x) * 0.3 + u * 0.8, 1.5 + u * 4, s.z + u * 0.3);
    const k = 0.6 + u * 2.2; s.s.scale.set(k, k, 1); s.s.material.opacity = 0.32 * (1 - u);
  }
  // ráfagas de viento: la basura se levanta, gira y vuelve a caer
  const gust = Math.max(0, Math.sin(worldT * 0.23) * Math.sin(worldT * 0.61));
  for (const l of SUB.litter) {
    l.t += dt;
    if (!l.air && gust > 0.55 && Math.random() < dt * 0.8) { l.air = true; l.vy = rand(0.8, 1.8); }
    if (l.air) {
      l.vy -= 3.2 * dt; l.m.position.x += (1.6 + gust * 2) * dt; l.m.position.z += Math.sin(l.t * 2) * 0.6 * dt; l.m.position.y += l.vy * dt;
      l.m.rotation.x += dt * 4; l.m.rotation.y += dt * 3;
      if (l.m.position.y <= 0.03) { l.m.position.y = 0.03; l.air = false; l.m.rotation.set(-Math.PI / 2, 0, rand(0, 3)); }
      if (l.m.position.x > 17) l.m.position.x = -17;
    }
  }
}

// ---------- contra los objetos: chocan, se apoyan, se dan contra la mesa ----------
{
  const baseUpdate = Fighter.prototype.update;
  Fighter.prototype.update = function (dt) {
    this.slamCd = (this.slamCd || 0) - dt; this.leanT = Math.max(0, (this.leanT || 0) - dt);
    baseUpdate.call(this, dt);
    // barro: salpica al correr y al caer
    if (scene === plazaScene && !this.airborne && inMud(this.pos.x, this.pos.z)) {
      if (this.curSpeed > 2.5 && Math.random() < dt * 7) spawnParticles(new THREE.Vector3(this.pos.x, 0.1, this.pos.z), 0x3a2a1a, 2, 1.6, 0.4, 0.05);
      if (this._wasAir && (this.state === 'down' || this.state === 'ko')) {
        spawnParticles(new THREE.Vector3(this.pos.x, 0.2, this.pos.z), 0x3a2a1a, 14, 3.2, 0.6, 0.07);
        if (this.addMark) this.addMark('body', this.torso.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.6, 0)), 8);
        if (Math.random() < 0.5) this.say(pick(['¡Puaj, barro!', '¡Me arruinaste la ropa!', 'Mi vieja me mata...']), 1.6);
      }
    }
    this._wasAir = this.airborne;
  };
}
Fighter.prototype.onObstacle = function (bx, bz) {
  const ks = Math.hypot(this.knock.x, this.knock.y);
  let nx = this.pos.x - bx, nz = this.pos.z - bz; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;   // normal de la superficie
  const into = -(this.knock.x * nx + this.knock.y * nz);
  if (into > 0) { this.knock.x += nx * into * 1.25; this.knock.y += nz * into * 1.25; }   // rebota (no lo atraviesa)
  if (this.slamCd > 0 || ks < 4.2) return;
  const hurt = this.state === 'hit' || this.state === 'down' || this.state === 'ko';
  if (!hurt) return;
  this.slamCd = 0.7;
  sfx('thud', distVol(this.pos.x, this.pos.z)); spawnDust(this.pos.x, this.pos.z, 5, true);
  shake(this.isPlayer ? 0.28 : 0.08);
  if (this.state === 'hit') {
    this.hp = Math.max(1, this.hp - 4);
    if (ks > 6.2) { this.setState("down"); this.vy = 3; this.fallSign = 1; }   // un palazo contra la mesa lo tira por encima
    else { this.leanT = 0.75; this.leanYaw = Math.atan2(nx, nz); this.stun = Math.max(this.stun, this.stateTime + 0.5); }
    if (Math.random() < 0.4) this.say(pick(['¡Ay, la espalda!', '¡Contra la mesa no!', '¡Uh, qué palo!']), 1.4);
  }
};
// pose: apoyado contra el objeto (espalda contra la mesa / calesita / auto, manos atrás)
// y caídas con variantes y asentamiento (que no parezca una bolsa de papas)
Fighter.prototype.postPose = function (P, dt) {
  const s = this.state;
  if (this.leanT > 0 && (s === 'hit' || s === 'normal')) {
    const k = smooth(Math.min(1, this.leanT / 0.25));
    this.facing += angDiff(this.facing, this.leanYaw) * Math.min(1, dt * 10);
    P.tX = lerp(P.tX, -0.38, k); P.hX = lerp(P.hX, -0.25, k); P.aL = lerp(P.aL, 0.75, k); P.aR = lerp(P.aR, 0.75, k);
    P.eL = lerp(P.eL, -0.35, k); P.eR = lerp(P.eR, -0.35, k); P.aLz = lerp(P.aLz, -0.35, k); P.aRz = lerp(P.aRz, 0.35, k);
    P.kL = lerp(P.kL, 0.35, k); P.kR = lerp(P.kR, 0.35, k); P.hipY = lerp(P.hipY, -0.08, k);
  }
  if (s === 'down' || s === 'ko') {
    if (this.fallVar === undefined) this.fallVar = Math.floor(Math.random() * 4);
    if (this.airborne) {
      this.landT = 0;
      if (this.vy < 0) { P.aL = P.aR = 0.95; P.aLz = -1.0; P.aRz = 1.0; P.eL = P.eR = -0.35; P.kL = 1.0; P.kR = 0.5; P.hX = 0.45; }   // amortigua: brazos atrás, rodillas, cabeza adelante
    } else {
      this.landT = (this.landT || 0) + dt;
      const v = this.fallVar;
      if (v === 0) { P.lL = -0.75; P.kL = 1.3; }                                                     // una rodilla arriba
      else if (v === 1) { P.lL = -0.05; P.kL = 0.1; P.lR = -0.3; P.kR = 0.65; P.lLz = -0.4; }          // piernas cruzadas
      else if (v === 2) { P.aL = P.aR = -2.6; P.eL = P.eR = -0.35; P.aLz = -0.5; P.aRz = 0.5; }        // brazos por encima de la cabeza
      else { P.aR = -1.15; P.eR = -2.2; P.aRz = -0.3; P.kR = 0.95; P.lR = -0.5; }                      // se agarra el estómago
      if (s === 'down') { const br = Math.sin(this.idleT * 4.5); P.tX += br * 0.04; P.hX += 0.08 + br * 0.04; }   // respira, se queja
      if (this.landT < 0.6) { const q = 1 - this.landT / 0.6; P.kL += 0.6 * q * Math.sin(this.landT * 22); P.kR += 0.4 * q * Math.sin(this.landT * 18 + 1); P.tX += 0.35 * q; P.hX += 0.4 * q; }   // asentamiento
    }
  } else this.fallVar = undefined;
  // el cuerpo acostado rueda un poco hacia un costado (no queda como una tabla)
  const lyingNow = (s === 'down' || s === 'ko') && !this.airborne;
  const tz = lyingNow ? ((this.fallVar || 0) % 2 ? 0.3 : -0.3) : 0;
  this.rig.rotation.z += (tz - this.rig.rotation.z) * Math.min(1, dt * 6);
};

// ---------- el linyera: duerme al lado del fuego; si la pelea se le viene encima, rajá o tira la botella ----------
NPC_CFG.linyera = { name: 'El Linyera', civil: true, top: 'remera', topColor: 0x4a4236, pants: 0x3e3428, skin: 0xb07e5a, hair: 'long', hairColor: 0x8a8478, beard: true, shoe: 0x2a2218, belly: false };
class Linyera extends Walker {
  constructor() {
    super(NPC_CFG.linyera);
    const b = this.body; b.pos.copy(SPOTS.linyera); b.facing = Math.PI / 2 + 0.2; b.useIK = false;
    this.home = SPOTS.linyera.clone(); this.state = 'sit'; this.t = 0; this.lineT = rand(8, 14); this.bottle = true; this.sipT = rand(3, 6);
    b.poseFn = (P) => {
      if (this.state === 'sit') {   // sentado en el colchón, apoyado, piernas estiradas
        P.lL = P.lR = -1.45; P.kL = 0.25; P.kR = 0.55; P.hipY = -0.78; P.tX = -0.22; P.hX = 0.15; P.lLz = -0.1; P.lRz = 0.15;
        P.aL = -0.2; P.eL = -0.6; P.aLz = -0.25;
        if (this.sipT < 1.2) { P.aR = -1.2; P.eR = -2.3; P.aRz = -0.2; P.hX = -0.3; } else { P.aR = -0.35; P.eR = -1.2; P.aRz = 0.1; }
        P.tY = 0; P.hY = Math.sin(this.t * 0.5) * 0.3;
      } else if (this.state === 'throw') {
        const k = clamp(this.t / 0.55, 0, 1);
        P.aR = lerp(-0.4, -2.9, smooth(Math.min(1, k * 1.6))) * (k < 0.75 ? 1 : 1 - (k - 0.75) * 3); P.eR = -1.2; P.tY = 0.5 - k * 0.9; P.tX = -0.1 + k * 0.35;
      }
    };
  }
  nearFight() {
    let best = null, bd = 6;
    for (const f of fighters) { if (!f.alive || f.team < 0) continue; const d = Math.hypot(f.pos.x - this.body.pos.x, f.pos.z - this.body.pos.z); if (d < bd) { bd = d; best = f; } }
    return best;
  }
  react(pos, level) {
    if (this.state === 'sit' && level >= 2 && pos.distanceTo(this.body.pos) < 9) this.wake();
  }
  wake() {
    const f = this.nearFight(), b = this.body; b.useIK = true; this.t = 0;
    if (f && this.bottle && Math.random() < 0.55) { this.state = 'throw'; this.target = f; this.say(pick(['¡Vayan a pelear a otro lado!', '¡Dejen dormir, che!', '¡Tomá, por molestar!']), 2); }
    else { this.flee(); this.say(pick(['¡Uy, uy, uy! ¡Me voy!', '¡Otra vez estos!', '¡Mi carrito no lo toquen!']), 2); }
  }
  flee() {
    const c = fighters.length ? fightCenter() : this.body.pos, p = this.body.pos;
    const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz) || 1;
    this.dest = new THREE.Vector3(clamp(p.x + dx / d * 14, -BOUNDS.x + 1, BOUNDS.x - 1), 0, clamp(p.z + dz / d * 14, -BOUNDS.z + 1, BOUNDS.z - 1));
    this.state = 'flee'; this.t = 0;
  }
  update(dt) {
    this.t += dt; this.lineT -= dt; this.sipT -= dt; this.tickBark(dt);
    const b = this.body;
    if (this.state === 'sit') {
      b.curSpeed = 0; if (this.sipT < 0) this.sipT = rand(5, 9);
      if (gameState === 'fight' && this.nearFight()) this.wake();
      else if (this.lineT <= 0 && gameState === 'fight') { this.lineT = rand(12, 20); this.say(pick(['¿Alguno tiene una moneda?', 'Estos pibes no tienen remedio...', 'Zzz...']), 2.2); }
    } else if (this.state === 'throw') {
      const f = this.target; b.curSpeed = 0;
      if (f && f.alive) this.face(f.pos.x, f.pos.z, dt * 3);
      if (this.t > 0.42 && this.bottle && f) {
        this.bottle = false;
        const mesh = makeWeaponMesh('botella'), hp = b.hand.getWorldPosition(new THREE.Vector3()); hp.y = Math.max(hp.y, 1.5);
        mesh.position.copy(hp); scene.add(mesh);
        const dx = f.pos.x - hp.x, dz = f.pos.z - hp.z, d = Math.hypot(dx, dz) || 1, sp = 11, T = d / sp;
        projectiles.push({ key: 'botella', def: WEAPONS.botella, mesh, dur: 0, owner: b, team: -1, vx: dx / d * sp, vy: 7 * T + 0.3, vz: dz / d * sp, spin: rand(8, 12) });
        sfx('throw');
      }
      if (this.t > 0.75) this.flee();
    } else if (this.state === 'flee') {
      if (this.moveTo(this.dest.x, this.dest.z, 5.2, dt) || this.t > 6) { this.state = 'gone'; this.t = 0; this.setVisible(false); }
    } else if (this.state === 'gone') {
      if (this.t > rand(14, 22) && (gameState !== 'fight' || !fighters.some(f => f.alive && Math.hypot(f.pos.x - this.home.x, f.pos.z - this.home.z) < 8))) {
        this.state = 'back'; this.t = 0; this.setVisible(true); b.pos.copy(this.dest);
      }
    } else if (this.state === 'back') {
      if (this.moveTo(this.home.x, this.home.z, 1.6, dt)) { this.state = 'sit'; this.bottle = true; b.useIK = false; b.facing = Math.PI / 2 + 0.2; this.say('Bueno... a dormir.', 1.6); }
    }
    b.root.position.copy(b.pos); b.animate(dt);
  }
}

// ============================================================
// v8: furia con animación + efecto sutil en pantalla
// ============================================================
{
  const baseUpdate = Fighter.prototype.update;
  Fighter.prototype.update = function (dt) {
    if (this.hypeT > 0) {
      this.hypeT -= dt; this.moveX = this.moveZ = 0; this.running = false;
      const t = 0.9 - this.hypeT;
      if (this.hypeFx === 0 && t > 0.28) { this.hypeFx = 1; sfx('hit', distVol(this.pos.x, this.pos.z) * 0.6); }                 // cachetada propia
      if (this.hypeFx === 1 && t > 0.55) { this.hypeFx = 2; sfx('thud', distVol(this.pos.x, this.pos.z) * 0.7); }                // golpes en el pecho
      if (this.hypeFx === 2 && t > 0.78) { this.hypeFx = 3; sfx('rage'); if (this.isPlayer) shake(0.25); }                       // grito
      if (this.hypeT <= 0) { this.hypeT = 0; this.rageTime = 9; }
    }
    baseUpdate.call(this, dt);
  };
  const basePost = Fighter.prototype.postPose;
  Fighter.prototype.postPose = function (P, dt) {
    if (basePost) basePost.call(this, P, dt);
    if (this.hypeT > 0 && this.state === 'normal') {
      const t = 0.9 - this.hypeT;
      if (t < 0.42) {          // cachetada: mano derecha a la propia cara, la cabeza se sacude
        const k = smooth(clamp(t / 0.28, 0, 1)), j = t > 0.28 ? Math.sin((t - 0.28) * 40) * (0.42 - t) * 3 : 0;
        P.aL = lerp(P.aL, -1.75, k); P.eL = lerp(P.eL, -2.2, k); P.aLz = lerp(P.aLz, 0.75, k);
        P.hY = 0.35 * (t > 0.28 ? 1 : 0) + j; P.hX = -0.1;
      } else if (t < 0.72) {   // golpes en el pecho con los dos puños
        const b2 = Math.abs(Math.sin((t - 0.42) * 22));
        P.aL = P.aR = -0.9 - 0.25 * b2; P.eL = P.eR = -2.3; P.aLz = 0.7; P.aRz = -0.7; P.tX = 0.05 - 0.08 * b2; P.hX = -0.15;
      } else {                 // grito: brazos abiertos, cabeza atrás
        const k = smooth(clamp((t - 0.72) / 0.12, 0, 1));
        P.aL = P.aR = lerp(-0.9, -0.3, k); P.aLz = -0.9 * k; P.aRz = 0.9 * k; P.eL = P.eR = -0.9; P.tX = -0.2 * k; P.hX = -0.45 * k; P.hipY = -0.05;
      }
      P.lL = -0.25; P.kL = 0.3; P.lR = 0.15; P.kR = 0.35;
    } else if (this.rageTime > 0 && (this.state === 'normal' || this.state === 'block')) {
      // sacado: hombros encorvados, cabeza adelante, respira rápido, guardia más baja y abierta
      const br = Math.sin(this.idleT * 9);
      P.tX += 0.12 + br * 0.03; P.hX += 0.12; P.aLz += 0.12; P.aRz -= 0.12; P.hipY += br * 0.012 - 0.02;
    }
  };
}
// borde de pantalla teñido para el jugador en furia (sutil, sin cambiar el color de todo)
const rageVig = document.createElement('div');
rageVig.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8;opacity:0;transition:opacity .25s;background:radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(150,10,0,0.42) 100%)';
document.body.appendChild(rageVig);
function updateRageVig() {
  const pl = [player, player2].filter(Boolean);
  const on = pl.some(f => f.rageTime > 0), hype = pl.some(f => f.hypeT > 0);
  rageVig.style.opacity = on ? String(0.75 + Math.sin(worldT * 6) * 0.12) : hype ? '0.35' : '0';
}

// ============================================================
// v9: el escenario se rompe y se usa para pegar + furia de los Rugbier (se inflan)
// ============================================================
const BREAK = { calesitaHits: 0, calesitaRota: false, mesas: [] };
function findBoards() {   // tablas de ajedrez de las mesas (para poder arrancarlas) + estado original para reconstruir
  BREAK.mesas = [];
  plazaScene.traverse(o => { if (o.isMesh && o.material && o.material.map === checkerTex && o.position.y > 0.7 && o.position.y < 0.9) BREAK.mesas.push({ m: o, x: o.position.x, z: o.position.z, hits: 0, rota: false, p0: o.position.clone(), r0: o.rotation.clone() }); });
  BREAK.roof = []; if (SUB.calesita) for (const o of SUB.calesita.children) if (o.geometry && o.geometry.type === 'ConeGeometry') BREAK.roof.push({ o, p0: o.position.clone(), r0: o.rotation.clone() });
}
// cada round arranca con la plaza entera (como cada nivel en The Warriors)
function resetBreakables() {
  BREAK.calesitaHits = 0; BREAK.calesitaRota = false;
  for (const r of BREAK.roof || []) { r.o.position.copy(r.p0); r.o.rotation.copy(r.r0); }
  for (const ms of BREAK.mesas) { ms.rota = false; ms.hits = 0; ms.m.visible = true; ms.m.position.copy(ms.p0); ms.m.rotation.copy(ms.r0); }
}
function breakCalesita() {
  BREAK.calesitaRota = true;
  const sp = SUB.calesita, g = sp.parent;
  sfx('break', 1); sfx('metal', 0.8); shake(0.35); spawnDust(g.position.x, g.position.z, 14, true);
  spawnParticles(new THREE.Vector3(g.position.x, 1.5, g.position.z), 0xd8402a, 16, 4, 0.8, 0.08);
  // el techo se viene abajo torcido y la calesita se traba
  for (const o of sp.children) if (o.geometry && o.geometry.type === 'ConeGeometry') { o.rotation.z = 0.55; o.position.y = 1.9; o.position.x = 0.5; }
  SUB.calesitaSpeed = 0;
  // dos caños quedan sueltos para usar de arma
  spawnPickup('cano', g.position.x + 2.1, g.position.z + 0.4);
  spawnPickup('cano', g.position.x - 1.9, g.position.z - 0.9);
  for (const f of fighters) if (f.alive && Math.random() < 0.3 && f.pos.distanceTo(g.position) < 9) f.say(pick(['¡Rompieron la calesita!', '¡Uh, la calesita!', '¡La vamos a tener que pagar!']), 1.8);
  for (const n of npcs) if (n.react) n.react(g.position, 3);
}
function breakMesa(ms) {
  ms.rota = true; sfx('break', 0.9); spawnDust(ms.x, ms.z, 8, true);
  ms.m.position.set(ms.x + rand(-0.6, 0.6), 0.06, ms.z + rand(-0.6, 0.6)); ms.m.rotation.set(rand(-0.2, 0.2), rand(0, 3), rand(-0.3, 0.3));
  ms.m.visible = false;                      // la tabla queda como arma en el piso
  spawnPickup('tabla', ms.m.position.x, ms.m.position.z);
}
{
  const baseOn = Fighter.prototype.onObstacle;
  Fighter.prototype.onObstacle = function (bx, bz) {
    const ks = Math.hypot(this.knock.x, this.knock.y), was = this.slamCd;
    baseOn.call(this, bx, bz);
    if (!(this.slamCd > 0 && was <= 0)) return;            // sólo cuando hubo golpe contra el objeto
    const c = SUB.calesita && SUB.calesita.parent;
    if (c && !BREAK.calesitaRota && Math.hypot(this.pos.x - c.position.x, this.pos.z - c.position.z) < 2.6) {
      BREAK.calesitaHits++; sfx('metal', 0.6);
      if (BREAK.calesitaHits >= 3) breakCalesita();
      return;
    }
    for (const ms of BREAK.mesas) if (!ms.rota && Math.hypot(this.pos.x - ms.x, this.pos.z - ms.z) < 1.3) {
      ms.hits += ks > 6 ? 2 : 1;
      if (ms.hits >= 2) breakMesa(ms);
      break;
    }
  };
}
// ---------- furia de los Rugbier: se golpean los muslos, gritan y se inflan ----------
{
  const baseUpdate = Fighter.prototype.update;
  Fighter.prototype.update = function (dt) {
    baseUpdate.call(this, dt);
    const rug = this.cfg.teamDef && this.cfg.teamDef.look === 'rugby';
    if (!rug) return;
    const target = this.rageTime > 0 ? 1.2 : this.hypeT > 0 ? 1 + 0.2 * smooth(clamp((0.9 - this.hypeT) / 0.9, 0, 1)) : 1;
    this.inflate = (this.inflate || 1) + (target - (this.inflate || 1)) * Math.min(1, dt * 5);
    const k = this.inflate;
    this.torso.scale.setScalar(k);   // escala pareja: una escala desigual en un hueso deforma a los hijos al rotar
    if (!this._infl) { this._infl = []; for (const g of [...this.arms, ...this.elbows]) for (const m of g.children) if (m.isMesh) this._infl.push({ m, sx: m.scale.x, sz: m.scale.z }); }
    const w = 1 + (k - 1) * 1.6;      // brazos más gruesos (sólo las piezas, no los huesos)
    for (const it of this._infl) { it.m.scale.x = it.sx * w; it.m.scale.z = it.sz * w; }
  };
  const baseRage = Fighter.prototype.doRage;
  Fighter.prototype.doRage = function () {
    const before = this.hypeT;
    baseRage.call(this);
    if (this.hypeT > 0 && !(before > 0) && this.cfg.teamDef && this.cfg.teamDef.look === 'rugby')
      this.say(pick(['¡A LA CARGA!', '¡SCRUM, MUCHACHOS!', '¡VAMOS EL CLUB!']), 2);
  };
}

// ============================================================
