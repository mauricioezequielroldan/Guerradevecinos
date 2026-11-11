// ============================================================
// COMBATE
// ============================================================
let hitStop = 0, shakeAmt = 0, lastPopT = -9;
function shake(a) { shakeAmt = Math.max(shakeAmt, a); }
function hitFighter(att, tgt, dmg, kb, knockdown, stun, weapon, opts) {
  if(att&&tgt){ bandVoice14(att, knockdown?'down':'hit', knockdown?.42:.12); bandVoice14(tgt,'hurt', knockdown?.35:.10); }
  const res = tgt.takeHit(att, dmg, kb, knockdown, stun, opts);
  const p = tgt.chest(); p.x = lerp(p.x, att.pos.x, 0.3); p.z = lerp(p.z, att.pos.z, 0.3);
  const involvesPlayer = att.isPlayer || tgt.isPlayer;
  const vol = distVol(tgt.pos.x, tgt.pos.z);
  npcNotify(tgt.pos, res === 'ko' ? 3 : (res === 'down' ? 2 : 1));
  if (res === 'block') {
    spawnParticles(p, 0x9fd8ff, 6, 3, 0.25, 0.06); sfx('block', vol);
    if (tgt.isPlayer && worldT - lastPopT > 1.5) { lastPopT = worldT; popText(p, 'BLOQUEO', 'block', 0.5); }
    return;
  }
  att.rage = Math.min(100, att.rage + dmg * 1.1);
  { // v5: marca en el punto real del impacto (cara o torso) + sangre leve con golpes fuertes a la cara
    const zone = zoneOf(att, opts), at = att.attack && att.attack.type, tip = new THREE.Vector3();
    if (at in PUNCH_ARM) { const el = att.elbows[PUNCH_ARM[at]]; el.updateWorldMatrix(true, false); el.localToWorld(tip.set(0, -0.3, 0)); }
    else if (weapon && att.hand) att.hand.getWorldPosition(tip);
    else if (zone === 'head') tgt.head.getWorldPosition(tip).add(new THREE.Vector3(Math.sin(att.facing) * -0.3, 0.12, Math.cos(att.facing) * -0.3));
    else tgt.torso.getWorldPosition(tip).add(new THREE.Vector3(Math.sin(att.facing) * -0.35, 0.35, Math.cos(att.facing) * -0.35));
    tgt.addMark(zone, tip, dmg, at === 'hook' ? null : new THREE.Vector3(Math.sin(att.facing), 0, Math.cos(att.facing)));   // el gancho marca de costado
  }
  const heavy = res === 'down' || res === 'ko' || dmg >= 14;
  spawnSpark(p, heavy);
  spawnParticles(p, 0xfff1a8, heavy ? 12 : 6, heavy ? 5 : 3.5, 0.3, 0.07);
  spawnParticles(p, 0xff8a3a, heavy ? 6 : 3, 4, 0.35, 0.05);
  if (weapon && weapon.def.snd) sfx(weapon.def.snd, vol);
  if (!weapon || weapon.def.snd !== 'slash') sfx(heavy ? 'heavy' : 'hit', vol);
  if (SHOW_WORDS && worldT - lastPopT > (involvesPlayer ? 0.2 : 0.7) && (heavy || (involvesPlayer && Math.random() < 0.35))) { lastPopT = worldT; popText(p, weapon && weapon.def.word ? pick(weapon.def.word) : pick(HIT_WORDS), heavy ? 'big' : '', 0.8); }
  if (involvesPlayer) { hitStop = Math.max(hitStop, heavy ? 0.09 : 0.045); shake(heavy ? 0.32 : 0.1); }
  else if (heavy) shake(0.06);
  if (res === 'ko') {
    sfx('ko', vol); lastKO = tgt;
    if (involvesPlayer) hitStop = 0.14;
    if (aliveCount(tgt.team) === 0) { slowMo = 1.4; hitStop = 0; }
    popText(new THREE.Vector3(tgt.pos.x, 2.4, tgt.pos.z), 'K.O.', 'ko', 1.4);
    if (Math.random() < 0.6) att.say(pick(TAUNTS), 1.8);
    if (tgt.weapon) tgt.dropWeapon();
  } else if (res === 'down' && Math.random() < 0.25) att.say(pick(TAUNTS), 1.6);
}

const projectiles = [];
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const pr = projectiles[i];
    pr.vy -= 14 * dt;
    pr.mesh.position.x += pr.vx * dt; pr.mesh.position.y += pr.vy * dt; pr.mesh.position.z += pr.vz * dt;
    pr.mesh.rotation.x += pr.spin * dt; pr.mesh.rotation.z += pr.spin * 0.4 * dt;
    if (!pr.spent) {
      for (const e of fighters) {
        if (e.team === pr.team || e.spectator || e.team < 0 || !e.alive || e.state === 'down' || e.state === 'getup' || e.invuln > 0) continue;
        const d = Math.hypot(e.pos.x - pr.mesh.position.x, e.pos.z - pr.mesh.position.z);
        if (d < 0.8 && pr.mesh.position.y < 2.4) {
          const mult = pr.owner.dmgMult * (pr.owner.rageTime > 0 ? 1.5 : 1);
          hitFighter(pr.owner, e, pr.def.throwDmg * mult, 8, true, 0.5, null);
          pr.vx *= -0.15; pr.vz *= -0.15; pr.vy = 2; pr.spent = true; break;
        }
      }
    }
    const pp = pr.mesh.position;
    for (const o of obstacles) {
      if (pp.x > o.minX && pp.x < o.maxX && pp.z > o.minZ && pp.z < o.maxZ && pp.y < 3) { pr.vx *= -0.3; pr.vz *= -0.3; pr.spent = true; pp.x += pr.vx * dt * 3; pp.z += pr.vz * dt * 3; }
    }
    if (Math.abs(pp.x) > BOUNDS.x + 0.5 || Math.abs(pp.z) > BOUNDS.z + 0.5) { pr.vx *= -0.3; pr.vz *= -0.3; pp.x = clamp(pp.x, -BOUNDS.x, BOUNDS.x); pp.z = clamp(pp.z, -BOUNDS.z, BOUNDS.z); pr.spent = true; }
    if (pp.y <= pr.def.gy && pr.vy < 0) {
      spawnDust(pp.x, pp.z, 2);
      if (pr.dur > 0) { sfx('hit', 0.5); spawnPickupFromMesh(pr.key, pr.mesh, pp.x, pp.z, pr.dur); }
      else {
        if (pr.mesh.parent) pr.mesh.parent.remove(pr.mesh);
        const glass = pr.key === 'botella';
        spawnParticles(new THREE.Vector3(pp.x, 0.3, pp.z), pr.def.chips || 0x777777, 12, 3, 0.6, 0.07);
        sfx(glass ? 'glass' : 'break', distVol(pp.x, pp.z));
      }
      projectiles.splice(i, 1);
    }
  }
}
// ============================================================
// VIDA DEL BARRIO: chusma, el pibe que filma, el abuelo con el mate, el perro
// ============================================================
const npcs = [];
let dog = null;
let lastEvent = { pos: new THREE.Vector3(), level: 0, t: -99 };
function npcNotify(pos, level) {
  if (level >= lastEvent.level || worldT - lastEvent.t > 1) lastEvent = { pos: pos.clone(), level, t: worldT };
  if (dog) dog.react(pos, level);
  for (const n of npcs) if (n.react) n.react(pos, level);
}
function fightCenter() {
  let x = 0, z = 0, n = 0;
  for (const f of fighters) if (f.alive) { x += f.pos.x; z += f.pos.z; n++; }
  return n ? new THREE.Vector3(x / n, 0, z / n) : new THREE.Vector3(0, 0, 0);
}
function nearestFighter(p) {
  let best = null, bd = 1e9;
  for (const f of fighters) { const d = Math.hypot(f.pos.x - p.x, f.pos.z - p.z); if (d < bd) { bd = d; best = f; } }
  return { f: best, d: bd };
}
const NPC_CFG = {
  chusma: { name: 'Doña Chola', civil: true, top: 'remera', topColor: 0xd88ab0, dress: 0xd88ab0, pants: 0x8a6a7a, skin: 0xf0c4a0, hair: 'bun', hairColor: 0x9a9a9a, rollers: true, glasses: true, slim: true, shoe: 0x8a5a7a, shorts: true },
  filmador: { name: 'El Pibe del Celu', civil: true, top: 'remera', topColor: 0x2a2a30, pants: 'jogging', skin: 0xc89870, hair: 'short', hairColor: 0x1a1008, cap: 0x2a6ad0, slim: true },
  abuelo: { name: 'Don Ramón', civil: true, top: 'remera', topColor: 0xd8d0b8, pants: 0x5a5040, skin: 0xe0b090, hair: 'bald', hairColor: 0xe8e8e8, mustache: true, glasses: true, belly: true, shoe: 0x3a2a1a },
};

class Walker {
  constructor(cfg) { this.body = new Fighter(-1, 0, cfg, false); this.body.label.classList.add('npc'); this.t = 0; this.say = (s, t) => this.body.say(s, t); this.dodgeT = 0; }
  get pos() { return this.body.pos; }
  setVisible(v) { this.body.root.visible = v; this.hidden = !v; if (!v) this.body.barkEl.style.opacity = 0; }
  moveTo(tx, tz, speed, dt) {
    const p = this.body.pos, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.25) { this.body.curSpeed = 0; return true; }
    const s = Math.min(speed, d / dt);
    p.x += dx / d * s * dt; p.z += dz / d * s * dt;
    this.body.facing += angDiff(this.body.facing, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
    this.body.curSpeed = speed; collideObstacles(p, 0.35);
    return false;
  }
  face(x, z, dt) { this.body.facing += angDiff(this.body.facing, Math.atan2(x - this.body.pos.x, z - this.body.pos.z)) * Math.min(1, dt * 5); }
  dodge(dt) {
    const nf = nearestFighter(this.body.pos);
    if (nf.f && nf.d < 2.2) {
      const dx = this.body.pos.x - nf.f.pos.x, dz = this.body.pos.z - nf.f.pos.z, d = Math.hypot(dx, dz) || 1;
      this.body.pos.x += dx / d * 3.2 * dt; this.body.pos.z += dz / d * 3.2 * dt; this.body.curSpeed = 3.2;
      collideObstacles(this.body.pos, 0.35);
      if (this.dodgeT <= 0) { this.dodgeT = 4; this.onDodge && this.onDodge(); }
      return true;
    }
    return false;
  }
  tickBark(dt) { const b = this.body; if (b.barkT > 0) { b.barkT -= dt; if (b.barkT <= 0) b.barkEl.style.opacity = 0; } this.dodgeT -= dt; }
}

// ---- Doña Chola, la chusma ----
class Chusma extends Walker {
  constructor() {
    super(NPC_CFG.chusma);
    const h = SPOTS.chusma; this.door = h.door.clone(); this.out = h.out.clone();
    this.corner = new THREE.Vector3(-16.5, 0, -24.5);
    this.body.pos.copy(this.door); this.state = 'home'; this.t = rand(4, 8); this.setVisible(false);
    this.shock = 0; this.lineT = 0;
    this.onDodge = () => this.say(pick(['¡Ay! ¡Cuidado, animal!', '¡A mí no me toquen!', '¡Que tengo la presión alta!']), 1.8);
    this.body.poseFn = (P) => {
      if (this.state === 'watch' && this.body.curSpeed < 0.3) {
        if (this.shock > 0) { P.aL = P.aR = -2.6; P.eL = P.eR = -2.2; P.aLz = 0.5; P.aRz = -0.5; P.hX = -0.15; }
        else { P.aL = -0.55; P.eL = -2.1; P.aR = -0.6; P.eR = -2.0; P.aLz = 0.55; P.aRz = -0.55; P.hY = Math.sin(this.t * 0.8) * 0.25; P.tX = -0.05; }
      }
    };
  }
  react(pos, level) { if (this.state === 'watch' && level >= 2) { this.shock = 1.6; if (Math.random() < 0.6) this.say(pick(['¡MARTAAAAAA!', '¡Ay, Dios mío!', '¡Lo mataron!', '¡Pobre chico!', '¡Llamen a una ambulancia!']), 1.8); } }
  update(dt) {
    this.t -= dt; this.shock -= dt; this.lineT -= dt; this.tickBark(dt);
    const b = this.body;
    if (this.state === 'home') { b.curSpeed = 0; if (this.t <= 0 && fighters.length && (gameState === 'fight' || gameState === 'roundEnd')) { this.state = 'goOut'; this.setVisible(true); sfx('door', 0.5); this.leg = 0; } }
    else if (this.state === 'goOut') {
      const pts = [this.out, this.corner];
      if (this.moveTo(pts[this.leg].x, pts[this.leg].z, 2.2, dt)) { this.leg++; if (this.leg >= pts.length) { this.state = 'approach'; } }
    } else if (this.state === 'approach') {
      const c = fightCenter(), dx = this.corner.x - c.x, dz = this.corner.z - c.z, d = Math.hypot(dx, dz) || 1;
      const wx = clamp(c.x + dx / d * 7.5, -BOUNDS.x, BOUNDS.x), wz = clamp(c.z + dz / d * 7.5, -BOUNDS.z, BOUNDS.z);
      if (this.moveTo(wx, wz, 2.0, dt) || Math.hypot(b.pos.x - c.x, b.pos.z - c.z) < 8) { this.state = 'watch'; this.t = rand(16, 24); this.say(pick(['¿Qué pasa acá? ¡Son los de siempre!', '¡Ay, yo sabía que esto iba a terminar así!', '¡Rubén! ¡Tu madre se va a enterar!']), 2.6); this.lineT = 5; }
    } else if (this.state === 'watch') {
      const c = fightCenter();
      if (!this.dodge(dt)) { b.curSpeed = 0; this.face(c.x, c.z, dt); }
      if (this.lineT <= 0) { this.lineT = rand(5, 8); this.say(pick(['¡Ayyy, Marta! ¡Qué quilombooo!', '¡Llamá a la policíaaa!', '¡Estos están endrogados!', '¡MARTAAAAAA!', '¡Qué barbaridad!', '¡Yo los conozco a todos, eh!', 'Voy a llamar al 911...', '¡Esto en mi época no pasaba!', '¡Mañana lo cuento en la verdulería!', '¡Más fuerte, que no veo!']), 2.4); }
      if (this.t <= 0 || gameState === 'menu' || gameState === 'matchEnd') { this.state = 'back'; this.leg = 0; this.say('Me voy, que se me quema la milanesa.', 2); }
    } else if (this.state === 'back') {
      const pts = [this.corner, this.out, this.door];
      if (this.moveTo(pts[this.leg].x, pts[this.leg].z, 2.4, dt)) { this.leg++; if (this.leg >= pts.length) { this.state = 'home'; this.t = rand(10, 16); this.setVisible(false); } }
    }
    b.root.position.copy(b.pos); b.animate(dt);
  }
}

// ---- El pibe que filma con el celular ----
const CORNERS = [new THREE.Vector3(-24, 0, 27), new THREE.Vector3(24, 0, -27), new THREE.Vector3(24, 0, 27), new THREE.Vector3(-24, 0, -27)];
class Filmador extends Walker {
  constructor() {
    super(NPC_CFG.filmador);
    this.phone = new THREE.Group(); this.phone.position.set(0, -0.3, 0.06); this.phone.rotation.x = 0.4; this.body.elbows[0].add(this.phone);
    box(0.075, 0.15, 0.012, mat(0x111111, { metalness: 0.6, roughness: 0.3 }), 0, -0.02, 0, this.phone);
    box(0.065, 0.13, 0.002, mat(0xbfe0ff, { emissive: 0x9acfff, emissiveIntensity: 2.2 }), 0, -0.02, -0.008, this.phone, false);
    this.rec = sph(0.012, 0.012, 0.012, mat(0xff2020, { emissive: 0xff0000, emissiveIntensity: 3 }), 0.025, 0.04, 0.008, this.phone, false);
    this.phone.visible = false;
    this.state = 'off'; this.t = rand(8, 14); this.setVisible(false); this.lineT = 0; this.side = 1;
    this.onDodge = () => this.say(pick(['¡Uh, casi me la dan!', '¡Ey, que estoy grabando!']), 1.6);
    this.body.poseFn = (P) => {
      if (this.state === 'film') { P.aL = -1.45; P.eL = -0.6; P.aLz = 0.25; P.hX = 0.05; P.tX = 0.05; if (this.body.curSpeed < 0.3) { P.lL = -0.2; P.kL = 0.25; P.kR = 0.2; } }
    };
  }
  react(pos, level) { if (this.state === 'film' && level >= 3) { this.say(pick(['¡UHH, boludo! ¡Lo mató!', '¡Uhhh, qué quilombooo!', '¡UHHHH! ¡Esto es viral!', '¡Lo tengo en cámara lenta!', '¡JAJAJA! ¡Lo durmió!']), 2); sfx('shutter', 0.5); } }
  update(dt) {
    this.t -= dt; this.lineT -= dt; this.tickBark(dt);
    const b = this.body;
    this.rec.visible = Math.floor(worldT * 2) % 2 === 0;
    if (this.state === 'off') { b.curSpeed = 0; if (this.t <= 0 && fighters.length && gameState === 'fight') { this.entry = pick(CORNERS); b.pos.copy(this.entry); this.setVisible(true); this.state = 'arrive'; this.say('¿Qué onda? ¿Se están cagando a trompadas?', 2.2); } }
    else if (this.state === 'arrive') {
      const c = fightCenter(), dx = this.entry.x - c.x, dz = this.entry.z - c.z, d = Math.hypot(dx, dz) || 1;
      if (this.moveTo(clamp(c.x + dx / d * 6.5, -BOUNDS.x, BOUNDS.x), clamp(c.z + dz / d * 6.5, -BOUNDS.z, BOUNDS.z), 5.0, dt) || Math.hypot(b.pos.x - c.x, b.pos.z - c.z) < 7) {
        this.state = 'film'; this.t = rand(11, 16); this.phone.visible = true; this.lineT = 2; sfx('shutter', 0.6);
      }
    } else if (this.state === 'film') {
      const c = fightCenter(), dx = b.pos.x - c.x, dz = b.pos.z - c.z, d = Math.hypot(dx, dz) || 1;
      if (!this.dodge(dt)) {
        if (d > 8) this.moveTo(c.x + dx / d * 6.5, c.z + dz / d * 6.5, 2.5, dt);
        else if (d < 5) this.moveTo(b.pos.x + dx / d, b.pos.z + dz / d, 2.0, dt);
        else { // se mueve de costado buscando el mejor ángulo
          const tx = b.pos.x - dz / d * this.side, tz = b.pos.z + dx / d * this.side;
          this.moveTo(clamp(tx, -BOUNDS.x, BOUNDS.x), clamp(tz, -BOUNDS.z, BOUNDS.z), 0.8, dt);
          if (Math.random() < dt * 0.3) this.side *= -1;
        }
        this.face(c.x, c.z, dt * 3);
      }
      if (this.lineT <= 0) { this.lineT = rand(4, 7); this.say(pick(['Desde acá, transmitiendo en vivo...', 'Siempre lo mismo...', '¡Síganme para más videos!', 'No me meto ni en pedooo.', 'Grabando, grabando...', '¡Dale, pegale!', '¡Esto va directo a TikTok!', 'Chicos, saluden a la cámara.', '¡Mirá lo que es esto, loco!']), 2.2); }
      if (this.t <= 0 || gameState !== 'fight') { this.state = 'leave'; this.phone.visible = false; this.exit = CORNERS.slice().sort((a, b2) => Math.hypot(b2.x - b.pos.x, b2.z - b.pos.z) - Math.hypot(a.x - b.pos.x, a.z - b.pos.z))[1]; this.say(pick(['¡Ya tengo el video! ¡Me voy antes que vuelva la luz!', '¡Me voy, que esto se pone feo!', '¡A subirlo! ¡Chau!']), 2.2); }
    } else if (this.state === 'leave') {
      if (this.moveTo(this.exit.x, this.exit.z, 6.5, dt)) { this.state = 'off'; this.t = rand(18, 30); this.setVisible(false); }
    }
    b.root.position.copy(b.pos); b.animate(dt);
  }
}

// ---- Don Ramón con el mate ----
class Abuelo extends Walker {
  constructor() {
    super(NPC_CFG.abuelo);
    const b = this.body; b.useIK = false; b.pos.copy(SPOTS.abuelo); b.pos.x -= 0.05; b.facing = Math.PI / 2;
    const m = new THREE.Group(); m.position.set(0, 0.02, 0.02); m.rotation.x = 1.25; b.hand.add(m);
    sph(0.05, 0.06, 0.05, mat(0x7a5a2a, { roughness: 0.6 }), 0, 0.02, 0, m); cyl(0.006, 0.006, 0.14, mat(0xd8d8d0, { metalness: 0.9 }), 0.01, 0.1, 0, m, 6);
    this.sip = 0; this.sipT = rand(4, 7); this.lineT = rand(10, 18);
    b.poseFn = (P) => {
      P.lL = P.lR = -1.5; P.kL = P.kR = 1.5; P.hipY = -0.4; P.tX = -0.08; P.lLz = -0.12; P.lRz = 0.12;
      P.aL = -0.35; P.eL = -0.9; P.aLz = -0.05;
      if (this.sip > 0) { P.aR = -1.1; P.eR = -2.25; P.hX = -0.25; P.aRz = -0.25; } else { P.aR = -0.4; P.eR = -1.3; P.aRz = 0.05; }
      if (fighters.length) { const c = fightCenter(); P.hY = clamp(angDiff(b.facing, Math.atan2(c.x - b.pos.x, c.z - b.pos.z)), -1.1, 1.1); P.tY = P.hY * 0.25; }
    };
  }
  react(pos, level) { if (level >= 3 && Math.random() < 0.35) this.say(pick(['¡Eso! ¡La izquierda, pibe!', '¡En el \'78 nos peleábamos con más estilo!', '¡Ese no se levanta más!']), 2.2); }
  update(dt) {
    this.tickBark(dt); this.sip -= dt; this.sipT -= dt; this.lineT -= dt;
    if (this.sipT <= 0) { this.sip = 1.6; this.sipT = rand(6, 10); }
    if (this.lineT <= 0) { this.lineT = rand(14, 24); if (gameState === 'fight') this.say(pick(['Este mate está frío...', 'Mirá vos, otra vez estos.', '¿Alguien quiere un amargo?']), 2.2); }
    const b = this.body; b.curSpeed = 0; b.root.position.copy(b.pos); b.animate(dt);
  }
}

// ---- El perro del barrio ----
class Dog {
  constructor() {
    const g = this.root = new THREE.Group(); scene.add(g);
    const fur = mat(0xb07a3a, { roughness: 0.95 }), light = mat(0xe8d8b8, { roughness: 0.95 }), dark = mat(0x2a1a10, { roughness: 0.5 });
    this.body = new THREE.Group(); this.body.position.y = 0.5; g.add(this.body);
    sph(0.17, 0.17, 0.36, fur, 0, 0, -0.02, this.body); sph(0.15, 0.16, 0.15, light, 0, -0.02, 0.24, this.body);
    this.headG = new THREE.Group(); this.headG.position.set(0, 0.16, 0.36); this.body.add(this.headG);
    sph(0.12, 0.115, 0.13, fur, 0, 0.04, 0, this.headG); sph(0.06, 0.055, 0.1, light, 0, 0.0, 0.12, this.headG);
    sph(0.025, 0.02, 0.02, dark, 0, 0.03, 0.21, this.headG, false);
    for (const s of [-1, 1]) { sph(0.016, 0.016, 0.01, dark, s * 0.05, 0.08, 0.11, this.headG, false); const e = sph(0.035, 0.07, 0.02, mat(0x8a5a2a), s * 0.075, 0.13, -0.02, this.headG); e.rotation.z = s * 0.5; }
    this.jaw = sph(0.05, 0.02, 0.07, light, 0, -0.04, 0.12, this.headG, false);
    this.tail = new THREE.Group(); this.tail.position.set(0, 0.08, -0.34); this.body.add(this.tail);
    const tl = cyl(0.03, 0.015, 0.3, fur, 0, 0.13, -0.05, this.tail, 6); tl.rotation.x = -0.4;
    this.legs = [];
    for (const [x, z] of [[-0.09, 0.2], [0.09, 0.2], [-0.09, -0.22], [0.09, -0.22]]) {
      const l = new THREE.Group(); l.position.set(x, -0.08, z); this.body.add(l);
      cyl(0.045, 0.035, 0.38, fur, 0, -0.19, 0, l, 8); sph(0.04, 0.025, 0.05, light, 0, -0.39, 0.015, l, false);
      this.legs.push(l);
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.pos = new THREE.Vector3(8, 0, 14); this.facing = 0; this.speed = 0; this.ph = 0; this.state = 'wander'; this.t = 0; this.goal = this.randGoal(); this.barkT = 0;
  }
  randGoal() { return new THREE.Vector3(rand(-15, 15), 0, rand(-18, 18)); }
  bark() { this.barkT = 0.35; sfx('bark', distVol(this.pos.x, this.pos.z)); if (Math.random() < 0.45 && Math.hypot(this.pos.x - camera.position.x, this.pos.z - camera.position.z) < 22) popText(new THREE.Vector3(this.pos.x, 1.1, this.pos.z), pick(['¡GUAU!', '¡GUAU GUAU!', '¡GRRR!']), 'dog', 0.8); }
  react(pos, level) {
    const d = Math.hypot(pos.x - this.pos.x, pos.z - this.pos.z);
    if (level >= 2 && d < 4) { this.flee(pos); }
    else if (level >= 1 && d < 11 && this.state === 'wander' && Math.random() < 0.3) { this.state = 'barkAt'; this.t = rand(2.5, 4); this.target = pos.clone(); }
    else if (level >= 3 && d < 14 && Math.random() < 0.5) { this.state = 'sniff'; this.t = 4; this.target = pos.clone(); }
  }
  flee(from) { this.state = 'flee'; this.t = 1.4; const dx = this.pos.x - from.x, dz = this.pos.z - from.z, d = Math.hypot(dx, dz) || 1; this.goal = new THREE.Vector3(this.pos.x + dx / d * 9, 0, this.pos.z + dz / d * 9); if (Math.random() < 0.35) popText(new THREE.Vector3(this.pos.x, 1.0, this.pos.z), '¡CAIII!', 'dog', 0.7); }
  steer(tx, tz, sp, dt) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.3) { this.speed = lerp(this.speed, 0, dt * 6); return true; }
    this.facing += angDiff(this.facing, Math.atan2(dx, dz)) * Math.min(1, dt * 7);
    this.speed = lerp(this.speed, sp, dt * 5);
    return false;
  }
  update(dt) {
    this.t -= dt; this.barkT -= dt;
    const nf = nearestFighter(this.pos);
    if (nf.f && nf.d < 1.8 && this.state !== 'flee' && (nf.f.state === 'attack' || nf.f.curSpeed > 5)) this.flee(nf.f.pos);
    switch (this.state) {
      case 'wander':
        if (this.steer(this.goal.x, this.goal.z, 2.2, dt) || this.t < -8) { this.goal = this.randGoal(); this.t = 0; if (Math.random() < 0.3) { this.state = 'sit'; this.t = rand(2, 4); } }
        if (fighters.length && Math.random() < dt * 0.15) { this.state = 'barkAt'; this.t = rand(2.5, 4); this.target = fightCenter(); }
        break;
      case 'sit': this.speed = lerp(this.speed, 0, dt * 6); if (this.t <= 0) this.state = 'wander'; break;
      case 'barkAt': {
        const dx = this.target.x - this.pos.x, dz = this.target.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
        if (d > 4.5) this.steer(this.target.x - dx / d * 4, this.target.z - dz / d * 4, 5.5, dt);
        else { this.speed = lerp(this.speed, 0, dt * 8); this.facing += angDiff(this.facing, Math.atan2(dx, dz)) * Math.min(1, dt * 6); if (this.barkT < -0.25 && gameState !== 'menu') this.bark(); }
        if (this.t <= 0) { this.state = 'wander'; this.goal = this.randGoal(); }
        break;
      }
      case 'sniff': { const dx = this.target.x - this.pos.x, dz = this.target.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
        if (d > 0.9) this.steer(this.target.x - dx / d * 0.8, this.target.z - dz / d * 0.8, 4, dt); else this.speed = lerp(this.speed, 0, dt * 8);
        if (this.t <= 0) { this.state = 'wander'; this.goal = this.randGoal(); } break; }
      case 'flee': this.steer(this.goal.x, this.goal.z, 9, dt); if (this.t <= 0) { this.state = 'wander'; this.goal = this.randGoal(); } break;
    }
    this.pos.x += Math.sin(this.facing) * this.speed * dt; this.pos.z += Math.cos(this.facing) * this.speed * dt;
    collideObstacles(this.pos, 0.35);
    this.pos.x = clamp(this.pos.x, -BOUNDS.x, BOUNDS.x); this.pos.z = clamp(this.pos.z, -BOUNDS.z, BOUNDS.z);
    // animación
    this.ph += dt * (this.speed * 2.6 + 0.01);
    const amp = clamp(this.speed / 5, 0, 1) * 0.75, gal = this.speed > 6;
    this.legs.forEach((l, i) => { const off = gal ? (i < 2 ? 0 : Math.PI * 0.9) + (i % 2) * 0.4 : [0, Math.PI, Math.PI, 0][i]; l.rotation.x = Math.sin(this.ph + off) * amp; });
    const sitting = this.state === 'sit' || (this.state === 'sniff' && this.speed < 0.5);
    this.body.rotation.x = lerp(this.body.rotation.x, this.state === 'sit' ? -0.45 : this.state === 'sniff' ? 0.3 : gal ? Math.sin(this.ph) * 0.12 : 0, dt * 8);
    this.body.position.y = 0.5 + (gal ? Math.abs(Math.sin(this.ph)) * 0.08 : 0) - (this.state === 'sit' ? 0.12 : 0);
    if (this.state === 'sit') { this.legs[2].rotation.x = -1.2; this.legs[3].rotation.x = -1.2; }
    this.headG.rotation.x = this.barkT > 0 ? -0.35 : this.state === 'sniff' ? 0.5 + Math.sin(worldT * 14) * 0.08 : 0;
    this.jaw.position.y = this.barkT > 0.15 ? -0.07 : -0.04;
    this.tail.rotation.z = Math.sin(worldT * (this.state === 'flee' ? 4 : 14)) * (this.state === 'flee' ? 0.15 : 0.5);
    this.tail.rotation.x = this.state === 'flee' ? 1.2 : (sitting ? 0.3 : 0);
    this.root.position.copy(this.pos); this.root.rotation.y = this.facing;
  }
}
