// ============================================================
// BARRIO LAS ACACIAS (3): MUCHA MÁS VIDA
// Vecinos caminando por las veredas, la señora con el perrito, grupos charlando, la parada del colectivo,
// pibes jugando a la pelota en el potrero, la pareja y el abuelo en la plaza, el playero, el cuidacoches,
// el carrito de garrapiñada, La Romi en la esquina, contenedores, grafitis y el cartel de SE VENDE.
// La gente lejos de Rubén (más de 40 m) no se dibuja ni se calcula.
// ============================================================
const MV = { walkers: [], still: [], kids: [], ball: null, dog: null, leash: null, t: 0, romi: null, romiT: -99, smoke: [] };
const MV_ROPA = [
  ...VMX_ROPA,
  { top: 'remera', topColor: 0x8a8a86, pants: 0x2a3448, skin: 0xe0ac86, hair: 'short', hairColor: 0x9a9a9a },
  { top: 'remera', topColor: 0x1a3a7a, pants: 0x3a3428, skin: 0xb07e5a, hair: 'short', hairColor: 0x111111, cap: 0x2a6ad0 },
  { top: 'remera', topColor: 0xd8a020, pants: 0x1a1a22, skin: 0x8a5a3a, hair: 'rulos', hairColor: 0x111111 },
  { top: 'remera', topColor: 0xe85a8a, pants: 0x2e4058, skin: 0xf0c8a8, hair: 'long', hairColor: 0x3a2414, female: true },
  { top: 'remera', topColor: 0x5a3a7a, pants: 0x222228, skin: 0xd9a27a, hair: 'long', hairColor: 0x111111, female: true },
];
function mvBody(cfg, idx, name, walk) { const b = vmxBody(cfg, idx, name); if (walk) b.useIK = true; return b; }
// las veredas por donde camina la gente (a 5 m del centro de cada calle)
const MV_LANES = [{ axis: 'x', fixed: -5.0 }, { axis: 'x', fixed: 5.0 }, { axis: 'z', fixed: -5.0 }, { axis: 'z', fixed: 5.0 }];
function mvSmallDog(sc) {   // perrito chico (salchicha) para la señora
  const g = new THREE.Group(), fur = trofiMat(0x6a3a1a, { roughness: 0.8 }), dark = trofiMat(0x2a1a10);
  box(0.42, 0.14, 0.14, fur, 0, 0.2, 0, g); sph(0.08, 0.08, 0.09, fur, 0.25, 0.27, 0, g); box(0.08, 0.05, 0.06, dark, 0.33, 0.25, 0, g);
  const ears = [-0.04, 0.04].map(z => box(0.03, 0.08, 0.04, dark, 0.22, 0.27, z, g));
  const legs = []; for (const [x, z] of [[0.15, 0.05], [0.15, -0.05], [-0.15, 0.05], [-0.15, -0.05]]) { const l = new THREE.Group(); l.position.set(x, 0.14, z); g.add(l); box(0.04, 0.13, 0.04, fur, 0, -0.065, 0, l); legs.push(l); }
  const tail = box(0.16, 0.025, 0.025, fur, -0.27, 0.25, 0, g); tail.rotation.z = 0.5;
  box(0.02, 0.05, 0.15, trofiMat(0xc0302a), 0.19, 0.24, 0, g, false);   // collar
  sc.add(g); return { g, legs, tail };
}
function mvGarrapinada(sc, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); sc.add(g);
  const metal = trofiMat(0xb8bcc0, { metalness: 0.7, roughness: 0.35 });
  box(1.1, 0.8, 0.65, metal, 0, 0.75, 0, g); for (const s of [-0.4, 0.4]) { const w = cyl(0.22, 0.22, 0.08, trofiMat(0x1a1a1a), s, 0.22, 0.36, g, 12); w.rotation.x = Math.PI / 2; }
  cyl(0.28, 0.24, 0.18, trofiMat(0x6a6a6a, { metalness: 0.8 }), 0, 1.25, 0, g, 14);
  const l = trofiLabel('GARRAPIÑADA · MANÍ', 1.0, 0.2, '#c0302a', '#fff'); l.position.set(0, 0.85, 0.33); g.add(l);
  const glow = trofiHalo(g, 0, 1.3, 0, 0xff9a40, 0.9, 0.5);
  for (let i = 0; i < 6; i++) { const p = sph(0.12, 0.12, 0.12, new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.12, depthWrite: false }), x, 1.4, z, sc); MV.smoke.push({ p, ph: i / 6, x, z }); }
  addObstacle(x, z, 1.2, 0.8);
  return g;
}
function mvGraffiti(sc, x, y, z, rotY, text, col) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(text.length * 0.42 + 0.6, 1.0), new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.9, map: canvasTex(512, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.font = "bold 92px 'Arial Black', Impact"; c.textAlign = 'center'; c.lineWidth = 8; c.strokeStyle = '#111'; c.strokeText(text, w / 2, 98, w - 20); c.fillStyle = col; c.fillText(text, w / 2, 98, w - 20); }) }));
  m.position.set(x, y, z); m.rotation.y = rotY; m.rotation.z = rand(-0.06, 0.06); sc.add(m);
}
{
  const baseB = buildBarrio;
  buildBarrio = function () {
    baseB();
    const sc = CALLE.scene, prev = scene; scene = sc; const o0 = obstacles.length; obstacles.push(...CALLE.obst);
    let id = 30;
    // --- vecinos caminando por las veredas ---
    for (let i = 0; i < 14; i++) {
      const lane = MV_LANES[i % 4], cfg = MV_ROPA[i % MV_ROPA.length], b = mvBody(cfg, id++, cfg.female ? 'Vecina' : 'Vecino', true);
      const w = { b, lane, s: rand(-42, 42), dir: pick([1, -1]), v: rand(0.9, 1.45), pause: 0, phone: Math.random() < 0.3 };
      if (w.phone) b.poseFn = (P) => { if (w.pause > 0) { P.aR = -1.35; P.eR = -1.9; P.hX = 0.35; } };
      MV.walkers.push(w);
    }
    // --- la señora con el perrito chico (con correa) ---
    { const b = mvBody({ top: 'remera', topColor: 0xb8a0d8, pants: 0x3a3a48, skin: 0xf0c8a8, hair: 'long', hairColor: 0xc8c8c8, female: true }, id++, 'La señora del perrito', true);
      b.poseFn = (P) => { P.aR = -0.55; P.eR = -0.6; P.aRz = 0.2; };
      const w = { b, lane: { axis: 'z', fixed: 5.0 }, s: -10, dir: 1, v: 0.8, pause: 0, dogWalker: true }; MV.walkers.push(w);
      MV.dog = mvSmallDog(sc); const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); MV.leash = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xc0302a })); sc.add(MV.leash); MV.dogOwner = w; }
    // --- grupos charlando y la parada del colectivo ---
    const talk = (i) => (P) => { P.aL = -0.4 + Math.sin(MV.t * 2 + i) * 0.25; P.eL = -1.2; P.hY = Math.sin(MV.t * 0.6 + i) * 0.4; if (i % 2) { P.aR = P.aL = -1.0; P.eR = P.eL = -2.2; P.aLz = 0.55; P.aRz = -0.55; } };
    for (const [cx, cz, n] of [[-5.3, -18, 3], [5.3, -15, 2], [-20, 5.3, 2], [18, -5.3, 3]]) for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, cfg = MV_ROPA[(id + i) % MV_ROPA.length], b = mvBody(cfg, id++, 'Vecino'); b.pos.set(cx + Math.cos(a) * 0.7, 0, cz + Math.sin(a) * 0.7); b.facing = Math.atan2(cx - b.pos.x, cz - b.pos.z); b.poseFn = talk(i); MV.still.push(b);
    }
    // parada del colectivo: refugio, cartel y gente esperando
    { const px = -30, pz = 5.4; box(3.2, 0.08, 1.2, trofiMat(0x6a6c70, { metalness: 0.6 }), px, 2.4, pz, sc); for (const s of [-1.5, 1.5]) cyl(0.05, 0.05, 2.4, trofiMat(0x6a6c70, { metalness: 0.6 }), px + s, 1.2, pz + 0.5, sc, 6);
      box(3.0, 1.6, 0.04, trofiMat(0xbfe0ff, { transparent: true, opacity: 0.25, roughness: 0.05 }), px, 1.3, pz + 0.55, sc, false);
      const lb = trofiLabel('PARADA · LÍNEA 87', 1.4, 0.45, '#e8c020', '#1a1a1a'); lb.position.set(px - 2.0, 2.6, pz - 0.2); lb.rotation.y = Math.PI; sc.add(lb); cyl(0.04, 0.04, 2.8, trofiMat(0x6a6c70), px - 2.0, 1.4, pz - 0.2, sc, 6);
      addObstacle(px, pz + 0.5, 3.2, 0.3);
      for (let i = 0; i < 3; i++) { const cfg = MV_ROPA[(id + 3) % MV_ROPA.length], b = mvBody(cfg, id++, 'Esperando el bondi'); b.pos.set(px - 1 + i * 0.9, 0, pz - 0.2); b.facing = Math.PI; b.poseFn = (P) => { P.hY = Math.sin(MV.t * 0.4 + i) * 0.7 - 0.6; if (i === 1) { P.aR = -1.3; P.eR = -1.9; P.hX = 0.35; } }; MV.still.push(b); } }
    // --- pibes jugando a la pelota en el potrero ---
    { const ball = sph(0.11, 0.11, 0.11, trofiMat(0xf4f4f4), -26, 0.11, 36, sc); MV.ball = { m: ball, x: -26, z: 36, tx: -26, tz: 36, v: 0 };
      for (let i = 0; i < 4; i++) { const cfg = MV_ROPA[(i * 3) % MV_ROPA.length], b = mvBody(Object.assign({}, cfg, { female: false }), id++, 'Pibe del potrero', true); b.pos.set(-30 + i * 3, 0, 33 + (i % 2) * 5); b.root.scale.setScalar(0.82); MV.kids.push({ b, home: new THREE.Vector3(-34 + i * 5, 0, 34 + (i % 2) * 4) }); } }
    // --- la plaza: la pareja en un banco, el abuelo en otro ---
    { const cx = 26, cz = -26;
      for (const [dx, i] of [[-0.45, 0], [0.45, 1]]) { const cfg = MV_ROPA[i ? 4 : 1], b = mvBody(cfg, id++, i ? 'La novia' : 'El novio'); b.pos.set(cx - 6 + dx, 0, cz - 9 + 0.12); b.facing = 0; const q = { b, ph: i * 2 }; b.poseFn = (P) => { vmxSeatPose(q)(P); P.hY = (i ? -0.5 : 0.5); P.aR = -0.4; P.eR = -1.0; }; MV.still.push(b); }
      const ab = mvBody({ top: 'remera', topColor: 0x7a6a52, pants: 0x3a3428, skin: 0xe0ac86, hair: 'short', hairColor: 0xd8d8d8 }, id++, 'El abuelo'); ab.pos.set(cx + 6, 0, cz + 9 - 0.12); ab.facing = Math.PI; const qa = { b: ab, ph: 1 }; ab.poseFn = (P) => { vmxSeatPose(qa)(P); P.tX = 0.2; P.aR = -0.7; P.eR = -1.2; }; MV.still.push(ab);
      mvGarrapinada(sc, 8.6, -8.8);
      const vend = mvBody({ top: 'remera', topColor: 0xf0eee6, pants: 0x2a2a30, skin: 0xb07e5a, hair: 'short', hairColor: 0x111111, cap: 0xd83a2a }, id++, 'El de la garrapiñada'); vend.pos.set(8.6, 0, -9.8); vend.facing = 0; vend.poseFn = (P) => { P.aR = -0.9 + Math.sin(MV.t * 3) * 0.2; P.eR = -1.4; }; MV.still.push(vend); }
    // --- la estación: el playero cargando nafta a un 128 ---
    { const car = hd128(0xd8c8a0); car.position.set(13, 0, 14.2); sc.add(car); addObstacle(13, 14.2, 4.1, 1.8);
      const pl = mvBody({ top: 'remera', topColor: 0x1a4aa8, pants: 0x1a2a4a, skin: 0xc68b62, hair: 'short', hairColor: 0x111111, cap: 0x1a4aa8 }, id++, 'El playero'); pl.pos.set(14.6, 0, 13.0); pl.facing = Math.PI; pl.poseFn = (P) => { P.aR = -0.9; P.eR = -0.8; P.aRz = 0.3; P.hY = Math.sin(MV.t * 0.3) * 0.4; }; MV.still.push(pl); }
    // --- el cuidacoches con chaleco naranja ---
    { const cu = mvBody({ top: 'remera', topColor: 0xff7a1a, pants: 0x2a2e38, skin: 0x8a5a3a, hair: 'short', hairColor: 0x111111 }, id++, 'El cuidacoches'); cu.pos.set(-25, 0, -5.0); cu.facing = Math.PI / 2;
      cu.poseFn = (P) => { const s = Math.sin(MV.t * 2.2); if (s > 0) { P.aR = -2.4 + Math.sin(MV.t * 9) * 0.3; P.eR = -0.4; P.aRz = 0.3; } P.hY = Math.sin(MV.t * 0.5) * 0.6; }; MV.still.push(cu); MV.cuida = cu; }
    // --- La Romi, en la esquina de la estación: la que se sabe todos los chismes ---
    { const r = mvBody({ name: 'La Romi', top: 'remera', topColor: 0xe83a8a, pants: 0x14141a, skin: 0xc68b62, hair: 'long', hairColor: 0x2a1a10, female: true }, id++, 'La Romi'); r.pos.set(5.4, 0, 5.6); r.facing = -Math.PI * 0.75;
      r.poseFn = (P) => { P.aL = 0.15; P.eL = -1.55; P.aLz = -0.62; P.tZ = 0.05; if (MV.romiWave > 0) { P.aR = -2.6 + Math.sin(MV.t * 10) * 0.25; P.eR = -0.3; P.aRz = 0.25; } P.hY = Math.sin(MV.t * 0.45) * 0.5; };
      MV.still.push(r); MV.romi = r; }
    // --- contenedores verdes, grafitis, el cartel de SE VENDE ---
    for (const [x, z] of [[-34, -4.3], [-8, 4.3], [20, -4.3], [38, 4.3], [-4.3, -33], [4.3, 40]]) { const along = Math.abs(z) > 4 && Math.abs(z) < 5; box(along ? 1.6 : 1.0, 1.15, along ? 1.0 : 1.6, trofiMat(0x2a6a2a, { roughness: 0.55 }), x, 0.6, z, sc); box(along ? 1.65 : 1.05, 0.08, along ? 1.05 : 1.65, trofiMat(0x1e4e1e), x, 1.2, z, sc); addObstacle(x, z, along ? 1.7 : 1.1, along ? 1.1 : 1.7); }
    mvGraffiti(sc, -6.42, 1.6, -42, Math.PI / 2, 'VOLVÉ LUZ', '#ffd84a');
    mvGraffiti(sc, 30, 1.7, 6.42, Math.PI, 'LA PAR', '#2a8aff');
    mvGraffiti(sc, -40, 1.5, -6.42, 0, 'PANCHO GATO', '#ff4a3a');
    { const sv = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(400, 220, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#d8241c'; c.fillRect(0, 0, w, 78); c.fillStyle = '#ffffff'; c.font = "bold 58px 'Arial Black'"; c.textAlign = 'center'; c.fillText('SE VENDE', w / 2, 60); c.fillStyle = '#1a3a8a'; c.font = "bold 52px 'Arial Black'"; c.fillText('REMUX', w / 2, 140); c.fillStyle = '#333'; c.font = "bold 28px Arial"; c.fillText('4-555-0000', w / 2, 192); }) }));
      sv.position.set(-6.43, 2.9, 12); sv.rotation.y = Math.PI / 2; sc.add(sv); }
    CALLE.obst = obstacles.splice(o0); scene = prev;
  };
}
// ¿hay algo en ese punto? (obstáculos de la escena con un margen, gente quieta, Rubén)
function mvBlocked(x, z, self) {
  for (const o of obstacles) if (x > o.minX - 0.3 && x < o.maxX + 0.3 && z > o.minZ - 0.3 && z < o.maxZ + 0.3) return true;
  for (const b of MV.still) if (b !== self && Math.hypot(b.pos.x - x, b.pos.z - z) < 0.75) return true;
  const P = player; if (P && Math.hypot(P.pos.x - x, P.pos.z - z) < 0.9) return true;
  return false;
}
// ---------- cada cuadro ----------
{
  const baseWorld = updateWorld;
  updateWorld = function (dt) {
    baseWorld(dt); if (scene !== CALLE.scene || !BA.built) return;
    MV.t += dt; const P = player;
    const near = (b, r) => !P || Math.hypot(b.pos.x - P.pos.x, b.pos.z - P.pos.z) < (r || 30);   // más lejos: no se dibuja ni se calcula
    const vis = (b) => { const on = near(b); b.root.visible = on; return on; };
    // vecinos caminando: van y vienen por su vereda, a veces frenan (mirando el celular), le abren paso a Rubén
    for (const w of MV.walkers) {
      const b = w.b;
      if (w.pause > 0) { w.pause -= dt; b.curSpeed = 0; }
      else {
        w.s += w.dir * w.v * dt; if (w.s > 43 || w.s < -43) { w.dir *= -1; w.s = clamp(w.s, -43, 43); }
        if (Math.random() < dt * 0.05) w.pause = rand(2, 4.5);
        b.curSpeed = w.v;
      }
      // esquivar: obstáculos (garita, teléfono, mesas, árboles...), la gente parada y Rubén. Se mira un poco adelante
      // y se elige el corrimiento lateral libre más chico (sin meterse en las casas: las manzanas son obstáculos).
      const ahead = w.s + w.dir * 0.9, toXZ = (s_, o_) => w.lane.axis === 'x' ? [s_, w.lane.fixed + o_] : [w.lane.fixed + o_, s_];
      w.chk = (w.chk || 0) - dt; let off = w.want !== undefined ? w.want : 0;
      if (w.chk <= 0) { w.chk = 0.3; const cand = [0, -0.8, 0.8, -1.4, 1.4]; for (const c of cand) { const [x1, z1] = toXZ(ahead, c), [x0, z0] = toXZ(w.s, c); if (!mvBlocked(x1, z1, b) && !mvBlocked(x0, z0, b)) { off = c; break; } } w.want = off; }   // 3 veces por segundo
      w.off = (w.off || 0) + (off - (w.off || 0)) * Math.min(1, dt * 3);
      if (w.lane.axis === 'x') { b.pos.set(w.s, 0, w.lane.fixed + w.off); b.facing = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      else { b.pos.set(w.lane.fixed + w.off, 0, w.s); b.facing = w.dir > 0 ? 0 : Math.PI; }
      if (vis(b)) { b.root.position.copy(b.pos); b.root.rotation.y = b.facing; b.animate(dt); }
    }
    // el perrito sigue a la señora, con la correa
    if (MV.dog && MV.dogOwner) {
      const o = MV.dogOwner.b, d = MV.dog, fx = Math.sin(o.facing), fz = Math.cos(o.facing), moving = MV.dogOwner.pause <= 0;
      const tx = o.pos.x + fx * 1.3 + Math.sin(MV.t * 1.7) * 0.3, tz = o.pos.z + fz * 1.3 + Math.cos(MV.t * 1.3) * 0.3;
      d.g.position.x += (tx - d.g.position.x) * Math.min(1, dt * 4); d.g.position.z += (tz - d.g.position.z) * Math.min(1, dt * 4);
      d.g.rotation.y = o.facing - Math.PI / 2; d.legs.forEach((l, i) => { l.rotation.z = moving ? Math.sin(MV.t * 16 + i * Math.PI / 2) * 0.6 : 0; }); d.tail.rotation.y = Math.sin(MV.t * 12) * 0.6;
      d.g.visible = near(o);
      const hand = o.hand ? o.hand.getWorldPosition(new THREE.Vector3()) : o.pos.clone().setY(0.9), p = MV.leash.geometry.attributes.position;
      p.setXYZ(0, hand.x, hand.y, hand.z); p.setXYZ(1, d.g.position.x + Math.cos(-d.g.rotation.y) * 0.19, 0.24, d.g.position.z + Math.sin(-d.g.rotation.y) * 0.19); p.needsUpdate = true; MV.leash.visible = d.g.visible;
    }
    // quietos (grupos, parada, plaza, playero, cuidacoches, La Romi)
    for (const b of MV.still) { b.curSpeed = 0; if (vis(b)) { b.root.position.copy(b.pos); b.root.rotation.y = b.facing; b.animate(dt); } }
    // La Romi saluda y te tira chismes del misterio cuando pasás
    if (MV.romi && P) { MV.romiWave = (MV.romiWave || 0) - dt; const d = Math.hypot(P.pos.x - MV.romi.pos.x, P.pos.z - MV.romi.pos.z);
      if (d < 4 && MV.t - MV.romiT > 10) { MV.romiT = MV.t; MV.romiWave = 2.5; popText(new THREE.Vector3(MV.romi.pos.x, 2.3, MV.romi.pos.z), pick(['¡Rubén, divino! ¿Vos también sin luz?', 'El del pancho pasó en un auto gris hace un rato, eh.', 'Me pinté con la linterna del celu, ¿cómo quedé?', 'Cuidate, que esta noche el barrio está bravo.', 'Dicen que el del pancho le debe plata al Trofi...']), 'warn', 2.8); } }
    // pibes del potrero: corren a la pelota y la patean
    const bl = MV.ball;
    if (bl) {
      let closest = null, cd = 99; for (const k of MV.kids) { const d = Math.hypot(k.b.pos.x - bl.x, k.b.pos.z - bl.z); if (d < cd) { cd = d; closest = k; } }
      for (const k of MV.kids) { const b = k.b, chase = k === closest, tx = chase ? bl.x : k.home.x + Math.sin(MV.t * 0.5 + b.idx) * 2, tz = chase ? bl.z : k.home.z + Math.cos(MV.t * 0.4 + b.idx) * 1.5;
        const dx = tx - b.pos.x, dz = tz - b.pos.z, d = Math.hypot(dx, dz), sp = chase ? 3.2 : 1.2;
        if (d > 0.4) { b.pos.x += dx / d * Math.min(d, sp * dt); b.pos.z += dz / d * Math.min(d, sp * dt); b.facing = Math.atan2(dx, dz); b.curSpeed = sp; } else b.curSpeed = 0;
        if (chase && cd < 0.6 && bl.v < 0.5) { bl.tx = clamp(bl.x + rand(-9, 9), -42, -10); bl.tz = clamp(bl.z + rand(-6, 6), 28, 44); bl.v = 7; if (near(b, 20) && typeof AC !== 'undefined' && AC) tone('sine', 180, 90, 0.07, 0.08); }
        if (vis(b)) { b.root.position.copy(b.pos); b.root.rotation.y = b.facing; b.animate(dt); }
      }
      if (bl.v > 0) { const dx = bl.tx - bl.x, dz = bl.tz - bl.z, d = Math.hypot(dx, dz); if (d < 0.2) bl.v = 0; else { bl.x += dx / d * Math.min(d, bl.v * dt); bl.z += dz / d * Math.min(d, bl.v * dt); bl.v *= 1 - dt * 0.9; bl.m.rotation.x += bl.v * dt * 4; } }
      bl.m.position.set(bl.x, 0.11 + (bl.v > 4 ? Math.sin(MV.t * 9) * 0.15 + 0.15 : 0), bl.z);
    }
    // humo del carrito de garrapiñada
    for (const s of MV.smoke) { const u = (MV.t * 0.3 + s.ph) % 1; s.p.position.set(s.x + Math.sin(u * 6 + s.ph * 9) * 0.15, 1.4 + u * 1.8, s.z); s.p.scale.setScalar(0.6 + u * 1.8); s.p.material.opacity = 0.14 * (1 - u); }
  };
}
window.__MVW = () => MV.walkers.map(w => w.b);   // para las pruebas
// los cuerpos de la gente del barrio que están lejos de Rubén se actualizan menos seguido (no se nota a esa distancia)
{
  const baseDrive = chpDrive;
  chpDrive = function (f, dt) {
    if (f.team < 0 && player && scene === CALLE.scene) {
      const d = Math.hypot(f.pos.x - player.pos.x, f.pos.z - player.pos.z), every = d > 22 ? 3 : d > 14 ? 2 : 1;
      if (every > 1) { f._lod = ((f._lod || 0) + 1) % every; if (f._lod) return; return baseDrive(f, dt * every); }
    }
    return baseDrive(f, dt);
  };
}
window.__MV = MV;
