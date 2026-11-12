// ============================================================
// COMBATE v56: estilos por banda, patada al caído con más cuerpo, cansancio con poca vida,
// bebidas que curan (Fernandito, cartón de vino) y contraataque con la guardia justa.
// Ideas tomadas de: The Warriors / Bully (estilos), Streets of Rage (comida que cura),
// Sleeping Dogs / Batman (contraataque), Bully / Sleeping Dogs (cansancio).
// ============================================================
// ---------- 1. ESTILOS DE PELEA POR BANDA ----------
// speed: velocidad de los golpes · dmg: daño · hp: aguante · y qué tan seguido usa cada cosa la IA
const ESTILOS = {
  original: { nombre: 'Equilibrado', speed: 1.0, dmg: 1.0, hp: 1.0, kick: 0.15, grab: 0.05 },
  cumbieros: { nombre: 'Rápido', speed: 1.2, dmg: 0.85, hp: 0.95, kick: 0.05, punch: 0.5, grab: 0.03 },
  motoqueros: { nombre: 'Pesado', speed: 0.82, dmg: 1.35, hp: 1.15, kick: 0.15, grab: 0.12, block: 1.6 },
  rugbier: { nombre: 'Tacleador', speed: 0.95, dmg: 1.05, hp: 1.12, kick: 0.05, grab: 0.3, tackle: 0.35 },
  gauchos: { nombre: 'Pateador', speed: 1.0, dmg: 1.05, hp: 1.0, kick: 0.55, grab: 0.05 },
  floggers: { nombre: 'Acróbata', speed: 1.18, dmg: 0.9, hp: 0.9, kick: 0.3, flying: 0.3, grab: 0.02, block: 0.6 },
};
function estiloDe(f) { if (f.team !== 0 && f.team !== 1) return null; const id = (typeof teamSel !== 'undefined' && teamSel[f.team]) || 'original'; return ESTILOS[id] || ESTILOS.original; }
const PELEA = { tragos: [], spawnT: 18, t: 0 };
{
  // al empezar a actualizarse por primera vez: se aplica el aguante del estilo
  const baseUpdate = Fighter.prototype.update;
  Fighter.prototype.update = function (dt) {
    if (!this._estiloOk) { this._estiloOk = true; const e = estiloDe(this); this.estilo = e; if (e && e.hp !== 1) { this.maxHp = Math.round(this.maxHp * e.hp); this.hp = this.maxHp; } }
    if (this._parado) { const q = this._parado; this._parado = null; this.attack = null; this.setState('hit'); this.stun = 0.65; this.stateTime = 0; this.knock.x += q.dx * 4; this.knock.y += q.dz * 4; }   // le desviaron el golpe: queda aturdido
    const st0 = this.state, x0 = this.pos.x, z0 = this.pos.z;
    baseUpdate.call(this, dt);
    // guardia: cuándo se levantó (para el contraataque)
    if (this.state === 'block' && st0 !== 'block') this._blockT0 = performance.now();
    // cansado (menos del 30 % de vida): se mueve más lento; mareado por el vino: se desvía
    const low = this.hp > 0 && this.hp < this.maxHp * 0.3;
    if (this.state === 'normal' && (low || this._mareo > 0)) {
      const k = low ? 0.72 : 0.9; this.pos.x = x0 + (this.pos.x - x0) * k; this.pos.z = z0 + (this.pos.z - z0) * k;
      if (this._mareo > 0) { const s = Math.sin(PELEA.t * 2.1 + this.idx) * 0.9 * dt; this.pos.x += s; this.pos.z += Math.cos(PELEA.t * 1.7) * 0.5 * dt; }
    }
    if (this._mareo > 0) this._mareo -= dt;
    if (this._trago && this._trago.mesh) {   // el vaso sigue a la mano, parado, y se inclina hacia la boca al tomar
      const m = this._trago.mesh, h = (this.hand || this.root).getWorldPosition(new THREE.Vector3());
      m.position.set(h.x + Math.sin(this.facing) * 0.04, h.y - 0.1, h.z + Math.cos(this.facing) * 0.04);
      m.quaternion.setFromEuler(new THREE.Euler(-Math.min(0.9, this._trago.t * 1.4), this.facing, 0, 'YXZ'));
    }
    // tomando: se cura de a poco, y si le pegan se le cae
    if (this._trago) { const T = this._trago; T.t += dt; if (this.state !== 'normal' && this.state !== 'attack') { tragoSacar(this); this._trago = null; popText(this.pos.clone().setY(2.3), '¡Se le cayó!', 'warn', 1.2); }
      else if (T.t >= 1.0) { const cur = Math.round(this.maxHp * T.def.heal); this.hp = Math.min(this.maxHp, this.hp + cur); if (T.def.mareo) this._mareo = T.def.mareo; popText(this.pos.clone().setY(2.4), '+' + T.def.nombre.toUpperCase(), 'big', 1.4); tragoSacar(this); this._trago = null; } }
  };
  // golpes más rápidos o más lentos y más o menos fuertes según el estilo; cansado: más lentos
  const baseStart = Fighter.prototype.startAttack;
  Fighter.prototype.startAttack = function (type, target) {
    if (!ATK[type]) return;   // un golpe que no existe en esta versión: no se arranca (antes rompía el juego)
    baseStart.call(this, type, target);
    const a = this.attack; if (!a || !a.def || type === 'pickup') return;
    const e = this.estilo; let s = e ? e.speed : 1; const m = e ? e.dmg : 1;
    if (this.hp < this.maxHp * 0.3) s *= 0.82;
    if (s === 1 && m === 1) return;
    const d = a.def; a.def = Object.assign({}, d, { dur: d.dur / s, hitAt: d.hitAt / s, dmg: (d.dmg || 0) * m });
    if (d.hitEnd !== undefined) a.def.hitEnd = d.hitEnd / s;
  };
  // la IA pelea según su estilo: los pateadores patean, los rápidos tiran piñas, los rugbiers taclean y agarran
  const baseLight = Fighter.prototype.doLight, baseHeavy = Fighter.prototype.doHeavy;
  Fighter.prototype.doLight = function () {
    const e = this.estilo;
    if (!this.isPlayer && e && !this._redir && this.canAct && this.canAct()) {
      this._redir = true;
      try {
        const foe = this.nearFoe ? this.nearFoe(7) : null, d = foe ? Math.hypot(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z) : 99;
        const corrida = ATK.runstrike ? 'runstrike' : ATK.dropkick ? 'dropkick' : null, voladora = ATK.flyingkick ? 'flyingkick' : ATK.dropkick ? 'dropkick' : null;   // sólo golpes que existen en esta versión
        if (false && e.tackle && corrida) { this.running = true; this.curSpeed = Math.max(this.curSpeed || 0, 6); this.facing = Math.atan2(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z); return this.startAttack(corrida, foe); }
        if (e.flying && voladora && d > 3 && d < 6.5 && Math.random() < e.flying) { this.running = true; this.curSpeed = Math.max(this.curSpeed || 0, 6); this.facing = Math.atan2(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z); return this.startAttack(voladora, foe); }
        if (e.grab && d < 1.6 && Math.random() < e.grab && this.doClinch) return this.doClinch();
        if (e.kick && Math.random() < e.kick) return baseHeavy.call(this);
      } finally { this._redir = false; }
    }
    return baseLight.call(this);
  };
  Fighter.prototype.doHeavy = function () {
    const e = this.estilo;
    if (!this.isPlayer && e && e.punch && !this._redir && Math.random() < e.punch && this.canAct && this.canAct() && !this.findDowned()) { this._redir = true; try { return baseLight.call(this); } finally { this._redir = false; } }
    return baseHeavy.call(this);
  };
}
// ---------- 2. PATADA AL CAÍDO CON MÁS CUERPO ----------
// toma impulso (pierna bien atrás, torso adelante, brazos de contrapeso), da un pasito y acompaña la patada
{
  const basePost = Fighter.prototype.postPose;
  Fighter.prototype.postPose = function (P, dt) {
    if (basePost) basePost.call(this, P, dt);
    const a = this.attack;
    if (this.state === 'attack' && a && a.type === 'groundkick') {
      const f = a.t / a.def.dur, wind = smooth(clamp(f / 0.42, 0, 1)), strike = smooth(clamp((f - 0.42) / 0.2, 0, 1)), back = smooth(clamp((f - 0.7) / 0.3, 0, 1));
      P.lR = lerp(lerp(0.15, 1.05, wind), -1.25, strike) * (1 - back) + 0.15 * back;    // atrás bien lejos, después adelante y arriba
      P.kR = lerp(lerp(0.4, 1.7, wind), 0.15, strike) * (1 - back) + 0.4 * back;
      P.tX = lerp(0.1, 0.32, wind) - 0.35 * strike * (1 - back); P.tY = (-0.35 * wind + 0.5 * strike) * (1 - back);
      P.aL = lerp(-0.4, 0.6, strike) * (1 - back); P.aLz = 0.5 + 0.3 * strike; P.aR = lerp(0.5, -0.9, strike) * (1 - back); P.aRz = -0.4; P.eL = P.eR = -0.9;
      P.hX = 0.5; P.kL = 0.35 + 0.15 * wind; P.hipY = -0.05 * wind;
      if (f < 0.45 && !a._paso) { a._paso = 0; } if (f < 0.45) { const s = 0.9 * dt / (a.def.dur * 0.45); this.pos.x += Math.sin(this.facing) * s; this.pos.z += Math.cos(this.facing) * s; }   // el pasito
    }
    // ---------- 3. CANSANCIO (y el mareo del vino) ----------
    const r = this.maxHp ? this.hp / this.maxHp : 1;
    if (this.hp > 0 && (this.state === 'normal' || this.state === 'block') && (r < 0.3 || this._mareo > 0)) {
      const tt = PELEA.t + this.idx * 1.3, k = r < 0.3 ? 1 - r / 0.3 : 0.4;
      P.tX = (P.tX || 0) + 0.16 * k + Math.sin(tt * 4.2) * 0.04 * k;          // encorvado, jadeando
      P.tZ = (P.tZ || 0) + Math.sin(tt * 1.3) * 0.12 * k;                     // se tambalea
      P.hX = (P.hX || 0) + 0.2 * k; P.hY = (P.hY || 0) + Math.sin(tt * 0.8) * 0.2 * k;
      if (this.state === 'normal') { P.aL = (P.aL || 0) * (1 - 0.5 * k) + 0.1 * k; P.aR = (P.aR || 0) * (1 - 0.5 * k) + 0.1 * k; }   // la guardia baja
      // muy cansado y sin nadie cerca: manos en las rodillas
      if (r < 0.15 && this.state === 'normal' && (this.curSpeed || 0) < 0.3 && !(this.foeNear5 && this.foeNear5())) { P.tX = 0.62 + Math.sin(tt * 4.5) * 0.05; P.aL = P.aR = -0.55; P.eL = P.eR = -0.25; P.aLz = 0.15; P.aRz = -0.15; P.kL = P.kR = 0.35; P.hipY = -0.12; P.hX = -0.25; }
    }
    // tomando: el vaso a la boca
    if (this._trago) { P.aR = -1.35; P.eR = -2.35; P.aRz = -0.1; P.hX = -0.35; }
  };
  // el caído se sacude y se corre con la patada
  const baseTake = Fighter.prototype.takeHit;
  Fighter.prototype.takeHit = function (att, dmg, kb, knockdown, stun, opts) {
    // ---------- 4. CONTRAATAQUE: guardia levantada justo antes del golpe (0,35 s) ----------
    if (att && this.state === 'block' && this._blockT0 && performance.now() - this._blockT0 < 350 && !(opts && (opts.flip || opts.unblock || opts.held))) {
      const dx = att.pos.x - this.pos.x, dz = att.pos.z - this.pos.z, toAtt = Math.atan2(dx, dz);
      if (Math.abs(angDiff(this.facing, toAtt)) < 1.2) {
        this._blockT0 = 0; popText(this.pos.clone().setY(2.4), '¡CONTRA!', 'big', 1.2); sfx('block', 1);
        att._parado = { dx: dx / (Math.hypot(dx, dz) || 1), dz: dz / (Math.hypot(dx, dz) || 1) };   // se aplica en su próximo cuadro (ahora su golpe todavía se está procesando)
        const me = this; setTimeout(() => { if (me.alive && (me.state === 'block' || me.state === 'normal')) { me.setState('normal'); me.startAttack('cross', att); } }, 120);
        return 'block';
      }
    }
    if (this._trago && !(opts && opts.held)) { tragoSacar(this); this._trago = null; }
    const r = baseTake.call(this, att, dmg, kb, knockdown, stun, opts);
    if (att && att.attack && att.attack.type === 'groundkick' && this.state === 'down') {
      const dx = this.pos.x - att.pos.x, dz = this.pos.z - att.pos.z, d = Math.hypot(dx, dz) || 1;
      this.knock.x += dx / d * 5; this.knock.y += dz / d * 5; this.hitShakeT = 0.3; if (this.isPlayer) shake(0.35);
    }
    return r;
  };
}
// ---------- 5. BEBIDAS QUE CURAN: Fernandito y cartón de vino ----------
const TRAGOS = {
  fernet: { nombre: 'Fernandito', heal: 0.25 },
  vino: { nombre: 'Cartón de vino', heal: 0.35, mareo: 4.5 },
};
function tragoMesh(tipo) {
  const g = new THREE.Group();
  if (tipo === 'fernet') {   // vaso con fernet con coca y espuma
    const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.24, 16, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05, side: THREE.DoubleSide })); vaso.position.y = 0.12; g.add(vaso);
    cyl(0.082, 0.065, 0.18, trofiMat(0x2a140a, { roughness: 0.2 }), 0, 0.1, 0, g, 14); cyl(0.086, 0.084, 0.04, trofiMat(0xd8b088, { roughness: 0.9 }), 0, 0.21, 0, g, 14);
    const sorb = cyl(0.008, 0.008, 0.3, trofiMat(0xd83a2a), 0.03, 0.26, 0, g, 5); sorb.rotation.z = 0.25;
  } else {                   // cartón de vino (tetra)
    box(0.14, 0.26, 0.08, trofiMat(0x6a1a5a, { roughness: 0.5 }), 0, 0.13, 0, g); box(0.144, 0.08, 0.084, trofiMat(0xe8e0d0), 0, 0.17, 0, g);
    sph(0.025, 0.025, 0.01, trofiMat(0x3a1a4a), -0.02, 0.17, 0.045, g); sph(0.025, 0.025, 0.01, trofiMat(0x3a1a4a), 0.02, 0.17, 0.045, g);   // uvas
    box(0.03, 0.04, 0.03, trofiMat(0x2a6a2a), 0.03, 0.29, 0, g);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: tipo === 'fernet' ? 0x7aff9a : 0xff7ad8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }));
  glow.scale.set(0.9, 0.9, 1); glow.position.y = 0.15; g.add(glow);   // (el tamaño se fija con set: no se puede reasignar)
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 24), new THREE.MeshBasicMaterial({ color: tipo === 'fernet' ? 0x7aff9a : 0xff7ad8, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
  g.scale.setScalar(1.6);
  return g;
}
// el vaso (o el cartón) en la mano mientras toma
function tragoEnMano(tipo, f) {
  const m = tragoMesh(tipo); m.children.slice().forEach(c => { if (c.isSprite || (c.geometry && c.geometry.type === 'RingGeometry')) m.remove(c); });
  m.scale.setScalar(0.62); scene.add(m); return m;   // en el mundo (no colgado de la mano: heredaba su escala y su giro)
}
function tragoSacar(f) { const T = f._trago; if (T && T.mesh && T.mesh.parent) T.mesh.parent.remove(T.mesh); }
function tragoSpawn() {
  if (PELEA.tragos.length >= 2) return;
  const tipo = Math.random() < 0.6 ? 'fernet' : 'vino', p = randomFreeSpot(BOUNDS.x * 0.7, BOUNDS.z * 0.7); if (!p) return;
  const m = tragoMesh(tipo); m.position.set(p.x, 0, p.z); scene.add(m);
  PELEA.tragos.push({ tipo, def: TRAGOS[tipo], m, x: p.x, z: p.z, t: 0 });
}
function tragoLimpiar() { for (const t of PELEA.tragos) if (t.m.parent) t.m.parent.remove(t.m); PELEA.tragos.length = 0; PELEA.spawnT = 18; }
{
  const baseGrab = Fighter.prototype.doGrab;
  Fighter.prototype.doGrab = function () {
    if (this.canAct() && !this._trago) {
      let best = null, bd = 1.6; for (const t of PELEA.tragos) { const d = Math.hypot(t.x - this.pos.x, t.z - this.pos.z); if (d < bd) { bd = d; best = t; } }
      if (best) { PELEA.tragos.splice(PELEA.tragos.indexOf(best), 1); if (best.m.parent) best.m.parent.remove(best.m); this._trago = { def: best.def, t: 0, mesh: tragoEnMano(best.tipo, this) }; sfx('pickup');
        popText(this.pos.clone().setY(2.35), pick(best.tipo === 'fernet' ? ['¡Uhh, un fernecito!', 'Con coca, como Dios manda', '¡Fernandito, mi amor!', 'Esto me levanta un muerto'] : ['¡Salud, muchachos!', 'Un vinito en cartón...', 'Mmm, cosecha 2024', '¡Este es de los buenos!']), 'warn', 1.6); return; }
    }
    return baseGrab.call(this);
  };
  // la IA va a buscar un trago cuando está baja de vida y no tiene a nadie encima
  const baseAI = Fighter.prototype.aiUpdate;
  Fighter.prototype.aiUpdate = function (dt) {
    baseAI.call(this, dt);
    // rugbiers taclean y floggers se tiran en voladora MIENTRAS se acercan (de cerca ya no hay carrera)
    const e = this.estilo;
    // tacle de rugby: sale corriendo hacia el rival y, al llegar, lo agarra (después puede rodillazo o revoleo)
    if (this._tacle) {
      const T = this._tacle, f = T.foe; T.t += dt;
      if (!f || !f.alive || f.state === 'down' || T.t > 1.8 || this.state !== 'normal') this._tacle = null;
      else { const dx = f.pos.x - this.pos.x, dz = f.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1; this.moveX = dx / d; this.moveZ = dz / d; this.running = true; this.facing = Math.atan2(dx, dz);
        if (d < 1.45) { this._tacle = null; if (this.doClinch) { this.doClinch(); if (this.isPlayer === false && this.state === 'grab') popText(this.pos.clone().setY(2.3), '¡TACLE!', 'big', 1); } } return; }
    }
    if (e && !this.isPlayer && e.tackle && this.canAct && this.canAct() && this.state === 'normal' && this.hp > this.maxHp * 0.3) {
      const foe = this.nearFoe ? this.nearFoe(7) : null;
      if (foe && foe.alive && foe.state !== 'down') { const d = Math.hypot(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z); if (d > 3 && d < 6.5 && Math.random() < e.tackle * dt * 0.9) { this._tacle = { foe, t: 0 }; this.say && this.say(pick(['¡Adentro!', '¡Al piso!', '¡Te tacleo!']), 1); return; } }
    }
    if (e && !this.isPlayer && e.flying && this.canAct && this.canAct() && this.state === 'normal' && this.hp > this.maxHp * 0.3) {
      const foe = this.nearFoe ? this.nearFoe(7) : null;
      if (foe && foe.alive && foe.state !== 'down') {
        const d = Math.hypot(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z), chance = e.flying * dt * 0.9;
        const tipo = ATK.flyingkick ? 'flyingkick' : ATK.dropkick ? 'dropkick' : null;
        if (tipo && d > 3 && d < 6.5 && Math.random() < chance) { this.facing = Math.atan2(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z); this.running = true; this.curSpeed = Math.max(this.curSpeed || 0, 6); this.startAttack(tipo, foe); return; }
      }
    }
    if (this.isPlayer || !PELEA.tragos.length || this.hp > this.maxHp * 0.45 || this.state !== 'normal') return;
    if (this.foeNear5 && this.foeNear5() && this.nearFoe && this.nearFoe(2.5)) return;
    let best = null, bd = 12; for (const t of PELEA.tragos) { const d = Math.hypot(t.x - this.pos.x, t.z - this.pos.z); if (d < bd) { bd = d; best = t; } }
    if (!best) return;
    const dx = best.x - this.pos.x, dz = best.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    if (d < 1.3) this.doGrab(); else { this.moveX = dx / d; this.moveZ = dz / d; this.running = d > 4; }
  };
  const baseWorld = updateWorld;
  updateWorld = function (dt) {
    baseWorld(dt); PELEA.t += dt;
    if (gameState !== 'fight') return;
    PELEA.spawnT -= dt; if (PELEA.spawnT <= 0) { PELEA.spawnT = rand(20, 30); tragoSpawn(); }
    for (const t of PELEA.tragos) { t.t += dt; t.m.position.y = 0.05 + Math.abs(Math.sin(t.t * 2.2)) * 0.08; t.m.rotation.y += dt * 1.2; }
  };
  const baseClear = clearRound;
  clearRound = function () { tragoLimpiar(); return baseClear.apply(this, arguments); };
}
window.GV_PELEA = { ESTILOS, PELEA, TRAGOS, spawn: tragoSpawn };
