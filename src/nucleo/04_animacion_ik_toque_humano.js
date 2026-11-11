// ============================================================
// ANIMACIÓN v4: capa de IK sobre la animación por articulaciones
// ------------------------------------------------------------
// La animación original (Fighter.animate) sigue calculando todas las poses (FK).
// Esta capa se mezcla ENCIMA, con un peso por miembro:
//  · Piernas: pies plantados en el MUNDO. Un pie apoyado no se mueve; los pasos
//    los decide un planificador (ciclo de marcha al moverse, pasos de ajuste al
//    girar, al recibir golpes o al quedar mal parado). IK de dos huesos y la
//    pelvis baja sola si un pie apoyado no llega.
//  · Brazos: el puño del jab / cruzado / gancho / puñalada viaja hacia la cabeza
//    del rival con IK, partiendo de la guardia que da la animación original.
//  · Cadera: se reparte el giro del torso entre pelvis y pecho.
//  · Cabeza: mira al rival más cercano.
// Si un estado no está cubierto (caídas, vuelos, sentado), el peso baja a 0 y se
// ve exactamente la animación original: nada se rompe.
// ============================================================
const IKC = { L1: 0.46, L2: 0.44, A1: 0.3, A2: 0.3, ANK: 0.1025, TOE: 0.2, HEEL: -0.1 };
const _ik = {
  t: new THREE.Vector3(), p: new THREE.Vector3(), d: new THREE.Vector3(), w: new THREE.Vector3(),
  x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3(), m: new THREE.Matrix4(),
  a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), e: new THREE.Euler(),
  q: new THREE.Quaternion(), q2: new THREE.Quaternion(), q3: new THREE.Quaternion(), qfk: new THREE.Quaternion(), qfk2: new THREE.Quaternion(),
};
// IK analítico de dos huesos (huesos hacia -Y). target/pole en espacio del padre de `up`.
// Escribe el resultado mezclado con la pose FK actual según w.
function ikSolve2(up, lo, target, pole, L1, L2, leg, w) {
  const V = _ik;
  V.qfk.copy(up.quaternion); V.qfk2.copy(lo.quaternion);
  V.t.copy(target).sub(up.position);
  let dist = V.t.length();
  if (dist < 1e-6) { V.t.set(0, -1, 0); dist = 1e-6; }
  V.t.divideScalar(dist);
  dist = clamp(dist, Math.abs(L1 - L2) + 1e-3, (L1 + L2) * 0.9995);
  const cosA = clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1), A = Math.acos(cosA);
  const cosB = clamp((L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2), -1, 1), bend = Math.PI - Math.acos(cosB);
  V.p.copy(pole).sub(up.position); V.p.addScaledVector(V.t, -V.p.dot(V.t));
  if (V.p.lengthSq() < 1e-8) V.p.set(0, 0, 1).cross(V.t);
  V.p.normalize();
  V.d.copy(V.t).multiplyScalar(cosA).addScaledVector(V.p, Math.sin(A));
  V.w.copy(V.t).multiplyScalar(Math.sin(A)).addScaledVector(V.p, -cosA);
  V.y.copy(V.d).negate(); V.z.copy(V.w); if (leg) V.z.negate();
  V.x.crossVectors(V.y, V.z).normalize(); V.z.crossVectors(V.x, V.y);
  V.m.makeBasis(V.x, V.y, V.z); V.q.setFromRotationMatrix(V.m);
  up.quaternion.copy(V.qfk).slerp(V.q, w);
  V.e.set(leg ? bend : -bend, 0, 0); V.q.setFromEuler(V.e);
  lo.quaternion.copy(V.qfk2).slerp(V.q, w);
}
function ankleFrom(plant, yaw, h, S, out) {   // tobillo (mundo) desde el punto de apoyo y el talón
  const fx = Math.sin(yaw), fz = Math.cos(yaw), pz = (h >= 0 ? IKC.TOE : IKC.HEEL) * S, ah = IKC.ANK * S;
  const bx = plant.x + fx * pz, bz = plant.z + fz * pz;
  const f = -pz * Math.cos(h) + ah * Math.sin(h), u = pz * Math.sin(h) + ah * Math.cos(h);
  return out.set(bx + fx * f, plant.y + u, bz + fz * f);
}
// Posiciones de los pies (espacio local del luchador, sin escala). x>0 = izquierda del personaje.
const FOOT_SETS = {
  fight: [{ x: -0.17, z: 0.27, yaw: 0.2, h: 0 }, { x: 0.18, z: -0.25, yaw: 0.65, h: 0.15 }],
  walk: [{ x: -0.13, z: 0.0, yaw: -0.05, h: 0 }, { x: 0.13, z: 0.0, yaw: 0.05, h: 0 }],
  relax: [{ x: -0.15, z: 0.02, yaw: -0.15, h: 0 }, { x: 0.15, z: -0.02, yaw: 0.15, h: 0 }],
  block: [{ x: -0.18, z: 0.22, yaw: 0.25, h: 0 }, { x: 0.2, z: -0.22, yaw: 0.6, h: 0.1 }],
};
// Pierna que patea (FK) por tipo de ataque: el resto queda apoyada.
const KICK_LEG = { kick: 1, stomp: 1, dropkick: 2 };

const smooth = t => t * t * (3 - 2 * t);
function smoothTo(cur, target, rate, dt) { return cur + (target - cur) * (1 - Math.exp(-rate * dt)); }

Fighter.prototype.initIK = function () {
  this.useIK = true;
  this.ikLeg = [0, 0]; this.ikArm = [0, 0]; this.twist = 0; this.lookY = 0;
  this.vel = new THREE.Vector3(); this.lastPos = this.pos.clone(); this.gaitOn = false; this.gaitPhase = 0;
  this.foot = [0, 1].map(() => ({ p: new THREE.Vector3(), yaw: 0, h: 0, valid: false, sw: null }));
  this.drop = 0;
};
Fighter.prototype.footSet = function () {
  const s = this.state;
  if (s === 'block') return FOOT_SETS.block;
  if (this.civil || gameState === 'house' || gameState === 'walkin' || (gameState === 'roundEnd' && s === 'normal')) return FOOT_SETS.relax;
  if (this.gaitOn) return FOOT_SETS.walk;
  return FOOT_SETS.fight;
};
// Pose de pie deseada (mundo) para el pie i.
Fighter.prototype.desiredFoot = function (i, out, lead) {
  const S = this.rig.scale.y, o = this.footSet()[i], f = this.facing;
  const c = Math.cos(f), sn = Math.sin(f);
  out.set(this.pos.x + c * o.x * S + sn * o.z * S, 0, this.pos.z - sn * o.x * S + c * o.z * S);
  if (lead) { out.x += this.vel.x * lead; out.z += this.vel.z * lead; }
  return { yaw: f + (i === 0 ? -o.yaw : o.yaw), h: o.h };   // yaw>0 en el set = punta hacia afuera
};

Fighter.prototype.ikLayer = function (dt) {
  if (!this.useIK || !this.root.visible) return;
  const s = this.state, rig = this.rig, S = rig.scale.y, a = this.attack;
  const lying = Math.min(1, Math.abs(Math.sin(rig.rotation.x)));
  // ---------- pesos por miembro ----------
  const uprightState = s === 'normal' || s === 'block' || s === 'hit' || s === 'grab' || s === 'held' || s === 'attack' || (s === 'getup' && this.stateTime > 0.3);
  const upright = uprightState && !this.airborne && lying < 0.25 && !this.sitting;
  for (let i = 0; i < 2; i++) {
    let w = upright ? 1 : 0;
    if (s === 'attack' && a) { const kl = KICK_LEG[a.type]; if (kl === 2 || kl === i) w = 0; }
    if (s === 'grab' && this.grabAct && this.grabAct.type === 'knee' && i === 1) w = 0;
    this.ikLeg[i] = w === 0 ? smoothTo(this.ikLeg[i], 0, 30, dt) : smoothTo(this.ikLeg[i], 1, 14, dt);
    if (this.ikLeg[i] < 0.02) this.foot[i].valid = false;
  }
  // ---------- velocidad real (incluye empujones, agarres, NPCs) ----------
  if (dt > 0) {
    const vx = (this.pos.x - this.lastPos.x) / dt, vz = (this.pos.z - this.lastPos.z) / dt;
    if (Math.hypot(vx, vz) < 30) { this.vel.x = smoothTo(this.vel.x, vx, 18, dt); this.vel.z = smoothTo(this.vel.z, vz, 18, dt); }
  }
  this.lastPos.copy(this.pos);
  const speed = Math.hypot(this.vel.x, this.vel.z);

  // ---------- cadera: reparte el giro del torso ----------
  const tw = upright ? (this.fkS ? this.fkS.tY || 0 : 0) * 0.45 : 0;
  this.twist = smoothTo(this.twist, tw, 16, dt);
  rig.rotation.y = this.twist * (1 - lying);
  this.torso.rotation.y -= this.twist * (1 - lying);

  // ---------- cabeza: mira al rival más cercano ----------
  let look = 0;
  if (upright && !this.civil && (s === 'normal' || s === 'block' || s === 'attack')) {
    let best = null, bd = 7;
    for (const e of fighters) { if (e.team === this.team || e.team < 0 || !e.alive) continue; const d = Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z); if (d < bd) { bd = d; best = e; } }
    if (best && !(this.isPlayer && V30.free && this.state === 'normal' && Math.hypot(this.moveX,this.moveZ) > 0.05)) look = clamp(angDiff(this.facing + (this.fkS ? this.fkS.tY || 0 : 0), Math.atan2(best.pos.x - this.pos.x, best.pos.z - this.pos.z)), -0.9, 0.9);
  }
  this.lookY = smoothTo(this.lookY, look, 8, dt);
  this.head.rotation.y += this.lookY * 0.8;

  for (let i = 0; i < 2; i++) if (this.ikLeg[i] < 0.001) { this.feet[i].quaternion.identity(); const fp = this.footPoint && this.state === 'attack' ? this.footPoint[i] : 0; if (fp) this.feet[i].rotation.x = fp; }   // v6: empeine estirado
  const legW = Math.max(this.ikLeg[0], this.ikLeg[1]);
  if (legW > 0.001) { this.planFeet(dt, speed); this.solveLegs(); }
  this.solveArms(dt);
  if (this.mocapLayer) this.mocapLayer(dt);
};

// ---------- planificador de pasos ----------
Fighter.prototype.planFeet = function (dt, speed) {
  const S = this.rig.scale.y, V = _ik;
  // Inicializa pies sin apoyo con la posición que da la FK (al levantarse, aterrizar, etc.)
  for (let i = 0; i < 2; i++) {
    const F = this.foot[i];
    if (!F.valid && this.ikLeg[i] > 0.02) {
      this.feet[i].updateWorldMatrix(true, false); this.feet[i].localToWorld(V.a.set(0, -IKC.ANK, 0.05)); F.p.set(V.a.x, 0, V.a.z);
      F.yaw = this.facing; F.h = 0; F.valid = true; F.sw = null;
    }
  }
  const run = speed > 5.6;
  const beta = run ? 0.28 : 0.4;   // fracción de apoyo: corriendo hay más vuelo
  // cadencia: lo suficiente para que el pie apoyado no tenga que recorrer más que el largo de pierna
  const freq = clamp(Math.max(0.9 + speed * 0.17, speed * beta / (0.8 * S)), 0.9, 2.9);
  const wantGait = speed > 0.9 && this.state !== 'grab';
  if (wantGait && !this.gaitOn) {   // arranca con el pie más atrasado respecto de la dirección de marcha
    const fx = this.vel.x / speed, fz = this.vel.z / speed;
    const d0 = (this.foot[0].p.x - this.pos.x) * fx + (this.foot[0].p.z - this.pos.z) * fz;
    const d1 = (this.foot[1].p.x - this.pos.x) * fx + (this.foot[1].p.z - this.pos.z) * fz;
    this.gaitPhase = beta + (d0 < d1 ? 0 : 0.5) - 1e-3;
    this.gaitOn = true;
  } else if (!wantGait && this.gaitOn && speed < 0.5) {
    this.gaitOn = false;   // una pisada de marcha a medias se termina como paso corto
    for (const F of this.foot) if (F.sw && F.sw.gait) Object.assign(F.sw, { from: F.p.clone(), fromYaw: F.yaw, gait: false, t: 0, dur: 0.12, lift: Math.max(F.p.y, 0.04 * S) });
  }
  const prevPhase = this.gaitPhase;
  if (this.gaitOn) this.gaitPhase = (this.gaitPhase + freq * dt) % 1;
  const stanceT = beta / freq, swingT = (1 - beta) / freq;
  for (let i = 0; i < 2; i++) {
    const F = this.foot[i]; if (!F.valid || this.ikLeg[i] < 0.02) continue;
    if (this.gaitOn) {
      const q = (this.gaitPhase + i * 0.5) % 1, qp = (prevPhase + i * 0.5) % 1;
      const inSwing = q >= beta;
      if (inSwing && !F.sw) F.sw = { from: F.p.clone(), fromYaw: F.yaw, gait: true, lift: (run ? 0.3 : 0.15) * S, t: 0, dur: swingT };
      if (F.sw && F.sw.gait) {
        const sp = inSwing ? clamp((q - beta) / (1 - beta), 0, 1) : 1;
        const rem = (1 - sp) * swingT;
        const tg = this.desiredFoot(i, V.b, rem + stanceT * 0.5);
        F.p.lerpVectors(F.sw.from, V.b, smooth(sp)); F.p.y = F.sw.lift * Math.sin(Math.PI * sp);
        F.yaw = F.sw.fromYaw + angDiff(F.sw.fromYaw, tg.yaw) * smooth(sp);
        F.h = sp < 0.5 ? (run ? 0.7 : 0.45) * (1 - sp * 2) : -0.2 * (sp - 0.5) * 2;
        if (!inSwing || qp > q && q < beta) { F.p.y = 0; F.sw = null; F.h = -0.2; }   // aterriza
      } else if (!inSwing) {
        const st = q / beta;   // apoyo: el pie no se mueve; sólo el talón
        F.h = st < 0.18 ? -0.2 * (1 - st / 0.18) : st > 0.6 ? (st - 0.6) / 0.4 * (run ? 0.7 : 0.45) : 0;
      }
    }
    // pasos de ajuste (quieto, girando, empujado): un pie por vez
    if (!F.sw && !this.gaitOn) {
      const other = this.foot[1 - i];
      const tg = this.desiredFoot(i, V.b, 0.12);
      const err = Math.hypot(F.p.x - V.b.x, F.p.z - V.b.z) / S, yerr = Math.abs(angDiff(F.yaw, tg.yaw));
      const myErr = err + yerr * 0.35;
      const oErr = other.valid && !other.sw ? (() => { const t2 = this.desiredFoot(1 - i, V.c, 0.12); return Math.hypot(other.p.x - V.c.x, other.p.z - V.c.z) / S + Math.abs(angDiff(other.yaw, t2.yaw)) * 0.35; })() : 0;
      if ((err > 0.16 || yerr > 0.55) && !other.sw && myErr >= oErr) {
        const far = err > 0.6;
        F.sw = { from: F.p.clone(), fromYaw: F.yaw, gait: false, lift: (far ? 0.14 : 0.08) * S, t: 0, dur: far ? 0.13 : 0.17 };
      }
      F.h = smoothTo(F.h, tg.h, 10, dt);
    }
    if (F.sw && !F.sw.gait) {
      const sw = F.sw; sw.t += dt;
      const sp = clamp(sw.t / sw.dur, 0, 1);
      const tg = this.desiredFoot(i, V.b, (1 - sp) * sw.dur);
      F.p.lerpVectors(sw.from, V.b, smooth(sp)); F.p.y = sw.lift * Math.sin(Math.PI * sp);
      F.yaw = sw.fromYaw + angDiff(sw.fromYaw, tg.yaw) * smooth(sp);
      if (sp >= 1) { F.p.y = 0; F.sw = null; }
    }
  }
  // Pivote del pie trasero en el cruzado y el gancho (talón arriba, punta hacia adelante)
  const a = this.attack;
  if (this.state === 'attack' && a && (a.type === 'cross' || a.type === 'hook' || a.type === 'swing' || a.type === 'throw')) {
    const f = a.t / a.def.dur, hf = a.def.hitAt / a.def.dur, k = f < hf ? smooth(f / hf) : 1 - smooth((f - hf) / (1 - hf));
    const F = this.foot[1];
    if (!F.sw) { F.h = Math.max(F.h, 0.55 * k); }
  }
};

Fighter.prototype.solveLegs = function () {
  const rig = this.rig, S = rig.scale.y, V = _ik;
  // pelvis: baja lo necesario para que los pies apoyados lleguen
  const Lmax = (IKC.L1 + IKC.L2) * 0.985 * S;
  // Tope de bajada: si un pie apoyado queda tan lejos que habría que agacharse más que eso,
  // se fuerza un paso rápido en vez de una sentadilla (pasaba con empujones fuertes).
  const maxDrop = 0.2 * S;
  let drop = 0;
  for (let i = 0; i < 2; i++) {
    const F = this.foot[i]; if (!F.valid || this.ikLeg[i] < 0.5 || F.p.y > 0.05) continue;
    this.legs[i].getWorldPosition(V.a);
    ankleFrom(F.p, F.yaw, F.h, S, V.b);
    const dxz = Math.hypot(V.a.x - V.b.x, V.a.z - V.b.z);
    const need = dxz < Lmax ? (V.a.y - V.b.y) - Math.sqrt(Lmax * Lmax - dxz * dxz) : 9;
    if (need > maxDrop && !F.sw) F.sw = { from: F.p.clone(), fromYaw: F.yaw, gait: false, lift: 0.1 * S, t: 0, dur: 0.11 };
    drop = Math.max(drop, Math.min(need, maxDrop));
  }
  this.drop = drop * Math.max(this.ikLeg[0], this.ikLeg[1]);
  rig.position.y -= this.drop;
  rig.updateWorldMatrix(true, false);
  this.root.getWorldQuaternion(V.q3);
  for (let i = 0; i < 2; i++) {
    const F = this.foot[i], w = this.ikLeg[i]; if (!F.valid || w < 0.001) continue;
    const thigh = this.legs[i], knee = this.knees[i], foot = this.feet[i];
    ankleFrom(F.p, F.yaw, F.h, S, V.a); rig.worldToLocal(V.a);
    thigh.getWorldPosition(V.c); V.c.x += Math.sin(F.yaw); V.c.z += Math.cos(F.yaw); V.c.y += 0.15 + (F.sw ? 0.9 : 0); rig.worldToLocal(V.c);   // en el aire la rodilla sube
    ikSolve2(thigh, knee, V.a, V.c, IKC.L1, IKC.L2, true, w);
    V.e.set(F.h, F.yaw, 0, 'YXZ'); V.q.setFromEuler(V.e);
    knee.getWorldQuaternion(V.q2).invert().multiply(V.q);
    foot.quaternion.identity().slerp(V.q2, w);
  }
};

// ---------- brazos: golpes con IK hacia el rival ----------
const PUNCH_ARM = { jab: 0, cross: 1, hook: 1 };
Fighter.prototype.solveArms = function (dt) {
  const a = this.attack, V = _ik;
  let arm = -1, k = 0, hook = false;
  if (this.state === 'attack' && a) {
    if (a.type in PUNCH_ARM) arm = PUNCH_ARM[a.type];
    if (a.type === 'swing' && a.stab) arm = 1;
    hook = a.type === 'hook';
    const f = a.t / a.def.dur, hf = a.def.hitAt / a.def.dur;
    k = f < hf ? Math.sin(clamp(f / hf, 0, 1) * Math.PI / 2) : 1 - smooth(clamp((f - hf) / (1 - hf), 0, 1));
  }
  for (let i = 0; i < 2; i++) this.ikArm[i] = smoothTo(this.ikArm[i], i === arm ? 1 : 0, i === arm ? 40 : 12, dt);
  for (let i = 0; i < 2; i++) {
    const w = this.ikArm[i]; if (w < 0.01) continue;
    const up = this.arms[i], el = this.elbows[i];
    el.updateWorldMatrix(true, false); el.localToWorld(V.a.set(0, -IKC.A2, 0.005));            // puño según la FK (guardia)
    // objetivo: cabeza del rival al que se apuntó, o al frente a la altura del mentón
    const tgt = a && a.tgt && a.tgt.alive ? a.tgt : null;
    if (tgt) { tgt.head.getWorldPosition(V.b); V.b.y += 0.1; }
    else { up.getWorldPosition(V.b); V.b.x += Math.sin(this.facing) * 2; V.b.z += Math.cos(this.facing) * 2; }
    up.getWorldPosition(V.c);
    const reach = (IKC.A1 + IKC.A2) * this.rig.scale.y * 0.98;
    V.b.sub(V.c); const L = V.b.length(); V.b.multiplyScalar(Math.min(1, reach / Math.max(L, 1e-3))).add(V.c);
    if (hook) {   // trayectoria curva: sale abierto y cierra
      const side = this.facing + Math.PI / 2;
      V.b.x += Math.sin(side) * 0.45 * (1 - k); V.b.z += Math.cos(side) * 0.45 * (1 - k);
    }
    V.a.lerp(V.b, k);
    this.torso.worldToLocal(V.a);
    const sx = i === 0 ? -1 : 1;
    V.c.copy(up.position).add(hook ? V.d.set(sx * 0.9, 0.4, -0.3) : V.d.set(sx * 0.35, -1, -0.45));
    ikSolve2(up, el, V.a, V.c, IKC.A1, IKC.A2, false, w);
  }
};

// ============================================================
// v5: TOQUE HUMANO (referencia: The Warriors)
// · Agarre con contacto real (manos a la nuca / a los antebrazos), agarrado encorvado que forcejea,
//   guardia cuadrada para que las piernas no se crucen.
// · Golpes del laboratorio: el hombro se adelanta y el torso se inclina hacia el golpe.
// · Cansancio visible con poca vida.
// · Marcas donde pega el golpe y sangre leve en el piso.
// ============================================================
FOOT_SETS.grab = [{ x: -0.16, z: 0.06, yaw: 0.1, h: 0 }, { x: 0.17, z: -0.14, yaw: 0.3, h: 0.1 }];
FOOT_SETS.held = [{ x: -0.15, z: -0.02, yaw: 0.1, h: 0.15 }, { x: 0.16, z: -0.2, yaw: 0.3, h: 0.25 }];
{
  const base = Fighter.prototype.footSet;
  Fighter.prototype.footSet = function () {
    if (this.state === 'grab') return FOOT_SETS.grab;
    if (this.state === 'held') return FOOT_SETS.held;
    return base.call(this);
  };
}
// cansancio: 0 con vida llena, 1 cerca del K.O. (empieza a notarse por debajo del 60 %)
Fighter.prototype.tiredness = function () { return smooth(clamp((0.6 - this.hp / this.maxHp) / 0.5, 0, 1)); };

// ---------- brazos: golpes (laboratorio) + contacto en el agarre ----------
const _h5 = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3() };
Fighter.prototype.armTo = function (i, worldTarget, w, poleLocal) {
  const up = this.arms[i], el = this.elbows[i], V = _h5;
  V.a.copy(worldTarget); this.torso.updateWorldMatrix(true, false); this.torso.worldToLocal(V.a);
  V.c.copy(up.position).add(poleLocal);
  ikSolve2(up, el, V.a, V.c, IKC.A1, IKC.A2, false, w);
};
Fighter.prototype.solveArms = function (dt) {
  const a = this.attack, V = _h5;
  if (!this.armBase) this.armBase = this.arms.map(x => x.position.clone());
  for (let i = 0; i < 2; i++) this.arms[i].position.copy(this.armBase[i]);
  // ---- golpe ----
  let arm = -1, k = 0, hook = false;
  if (this.state === 'attack' && a) {
    if (a.type in PUNCH_ARM) arm = PUNCH_ARM[a.type];
    if (a.type === 'swing' && a.stab) arm = 1;
    hook = a.type === 'hook';
    const f = a.t / a.def.dur, hf = a.def.hitAt / a.def.dur;
    k = f < hf ? smooth(clamp(f / hf, 0, 1)) : 1 - smooth(clamp((f - hf) / (1 - hf), 0, 1));
  }
  // ---- contacto del agarre ----
  const grabW = this.state === 'grab' && this.held ? 1 : this.state === 'held' && this.holder ? 1 : 0;
  this.ikGrab = smoothTo(this.ikGrab || 0, grabW, 12, dt);
  for (let i = 0; i < 2; i++) this.ikArm[i] = smoothTo(this.ikArm[i], i === arm ? 1 : 0, i === arm ? 40 : 12, dt);
  if (arm >= 0 && k > 0) {    // del laboratorio: el hombro se adelanta y el torso acompaña
    this.arms[arm].position.z += 0.09 * k;
    this.torso.rotation.x += (hook ? 0.1 : 0.16) * k;
  }
  for (let i = 0; i < 2; i++) {
    const wP = this.ikArm[i], wG = this.ikGrab * (1 - wP);
    if (wP < 0.01 && wG < 0.01) continue;
    const up = this.arms[i], el = this.elbows[i], sx = i === 0 ? -1 : 1;
    if (wP >= 0.01) {
      el.updateWorldMatrix(true, false); el.localToWorld(V.a.set(0, -IKC.A2, 0.005));   // puño en la guardia (FK)
      const tgt = a && a.tgt && a.tgt.alive ? a.tgt : null;
      if (tgt) { tgt.head.getWorldPosition(V.b); V.b.y += 0.1; }
      else { up.getWorldPosition(V.b); V.b.x += Math.sin(this.facing) * 2; V.b.z += Math.cos(this.facing) * 2; }
      up.getWorldPosition(V.c);
      const reach = (IKC.A1 + IKC.A2) * this.rig.scale.y * 0.98;
      V.b.sub(V.c); const L = V.b.length(); V.b.multiplyScalar(Math.min(1, reach / Math.max(L, 1e-3))).add(V.c);
      if (hook) { const side = this.facing + Math.PI / 2, back = 1 - k;   // v6: volado ancho, sale de costado y de atrás
        V.b.x += Math.sin(side) * 0.9 * back - Math.sin(this.facing) * 0.35 * back; V.b.z += Math.cos(side) * 0.9 * back - Math.cos(this.facing) * 0.35 * back; V.b.y -= 0.08 * back; }
      V.a.lerp(V.b, k);
      this.armTo(i, V.a, wP, hook ? V.d.set(sx * 0.9, 0.4, -0.3) : V.d.set(sx * 0.35, -1, -0.45));
    } else {
      // agarre: el que agarra va a la nuca (manos detrás del cuello), el agarrado a los antebrazos del otro
      const other = this.state === 'grab' ? this.held : this.holder;
      if (!other) continue;
      if (this.state === 'grab') {
        const g = this.grabAct, pull = g ? Math.sin(Math.min(1, g.t / g.dur) * Math.PI) : 0;
        other.torso.updateWorldMatrix(true, false);
        other.torso.localToWorld(V.b.set(-sx * 0.075, 0.66, -0.05));   // mano derecha al lado derecho del cuello del otro (enfrentados)
        V.b.y -= 0.12 * pull;                                            // en el rodillazo tira la cabeza para abajo
      } else {
        other.elbows[i === 0 ? 1 : 0].updateWorldMatrix(true, false);
        other.elbows[i === 0 ? 1 : 0].localToWorld(V.b.set(0, -0.14, 0.03));
      }
      this.armTo(i, V.b, wG, V.d.set(sx * 0.4, -1, -0.2));
    }
  }
};

// ---------- marcas donde pega el golpe y sangre leve ----------
const MARK_GEO5 = new THREE.SphereGeometry(1, 14, 10), _ray5 = new THREE.Raycaster();
const MK = {
  bruiseA: new THREE.Color(0x8e6068), bruiseB: new THREE.Color(0x4a3450), stain: new THREE.Color(0x3e322e), cut: new THREE.Color(0x861d1b),
};
if (typeof LINEAR !== 'undefined' && LINEAR) for (const k in MK) MK[k].convertSRGBToLinear();
function zoneOf(att, opts) {
  const t = att.attack && att.attack.type;
  if (opts && opts.held) return 'body';                                  // rodillazo en el agarre
  if (t === 'kick' || t === 'dropkick' || t === 'stomp') return 'body';
  if (t === 'swing' && Math.random() < 0.35) return 'body';
  return 'head';
}
Fighter.prototype.addMark = function (zone, tip, dmg, dir) {
  this.root.updateMatrixWorld(true);
  const bone = zone === 'head' ? this.head : this.torso;
  const center = zone === 'head' ? this.head.localToWorld(new THREE.Vector3(0, 0.14, 0.02)) : this.torso.localToWorld(new THREE.Vector3(0, 0.4, 0.05));
  const targets = [];
  bone.traverse(o => {
    if (!o.isMesh || o.userData.mark) return;
    if (zone === 'head' ? o.material === this.skinMat : (o.material === this.shirtMat || o.material === this.vestMat || o.material === this.skinMat)) {
      if (zone === 'body' && o.parent === this.head) return;
      targets.push(o);
    }
  });
  const d = center.clone().sub(tip); if (d.lengthSq() < 1e-8) d.set(0, 0, -1); d.normalize();
  if (dir) d.multiplyScalar(0.3).addScaledVector(dir, 0.7).normalize();
  // en la cara el golpe marca pómulos / ojo / sien (no la boca): el punto sube hacia el centro de la cabeza
  const q0 = zone === 'head' ? tip.clone().lerp(center, 0.6).add(new THREE.Vector3(0, 0.035, 0)) : tip.clone();
  _ray5.set(q0.addScaledVector(d, -0.4), d); _ray5.far = 1.5;
  let hit = _ray5.intersectObjects(targets, false)[0];
  if (!hit) { const d2 = center.clone().sub(tip).normalize(); _ray5.set(tip.clone().addScaledVector(d2, -0.4), d2); hit = _ray5.intersectObjects(targets, false)[0]; }
  if (!hit) return null;
  const parent = zone === 'head' ? this.head : hit.object.parent;
  const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  const pl = parent.worldToLocal(hit.point.clone().addScaledVector(n, 0.002));
  const nl = n.clone().transformDirection(new THREE.Matrix4().copy(parent.matrixWorld).invert()).normalize();
  this.marks = this.marks || [];
  let mk = this.marks.find(k => k.parent === parent && k.zone === zone && k.pos.distanceTo(pl) < 0.035);
  if (mk) mk.level = Math.min(1, mk.level + dmg / 20);
  else {
    if (this.marks.filter(k => k.zone === zone).length >= (zone === 'head' ? 10 : 8)) return null;
    const skin = zone === 'head' || hit.object.material === this.skinMat;
    const m = new THREE.MeshStandardMaterial({ color: (skin ? MK.bruiseA : MK.stain).clone(), roughness: 0.6, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const o = new THREE.Mesh(MARK_GEO5, m); o.userData.mark = true; o.renderOrder = 2;
    o.position.copy(pl); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nl); parent.add(o);
    mk = { o, parent, zone, skin, pos: pl.clone(), level: dmg / 20, cut: null };
    this.marks.push(mk);
  }
  const lv = mk.level, r = (zone === 'head' ? 0.017 : 0.035) * (0.8 + 0.6 * lv);
  mk.o.scale.set(r, r * 0.78, 0.002);
  mk.o.material.opacity = (mk.skin ? 0.35 : 0.25) + 0.5 * lv;
  if (mk.skin) mk.o.material.color.copy(MK.bruiseA).lerp(MK.bruiseB, lv);
  if (zone === 'head' && !mk.cut && (lv > 0.55 || dmg >= 14)) {
    const c = new THREE.Mesh(MARK_GEO5, new THREE.MeshStandardMaterial({ color: MK.cut, roughness: 0.3, transparent: true, opacity: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
    c.userData.mark = true; c.renderOrder = 3; c.position.copy(pl).addScaledVector(nl, 0.001); c.quaternion.copy(mk.o.quaternion);
    c.scale.set(0.013, 0.003, 0.0015); parent.add(c); mk.cut = c;
  }
  if (zone === 'head' && (dmg >= 10 || lv > 0.5)) bleed5(hit.point, n, dmg >= 14 ? 4 : 2);
  return mk;
};
const drops5 = [], stains5 = [], DROP_GEO5 = new THREE.SphereGeometry(1, 6, 4), STAIN_GEO5 = new THREE.CircleGeometry(1, 12);
const DROP_MAT5 = new THREE.MeshStandardMaterial({ color: 0x7a0f12, roughness: 0.25 });
if (typeof LINEAR !== 'undefined' && LINEAR) DROP_MAT5.color.convertSRGBToLinear();
function bleed5(p, n, count) {
  for (let i = 0; i < count && drops5.length < 30; i++) {
    const o = new THREE.Mesh(DROP_GEO5, DROP_MAT5), r = 0.005 + Math.random() * 0.005; o.scale.setScalar(r);
    o.position.copy(p); scene.add(o);
    drops5.push({ o, sc: scene, r, v: new THREE.Vector3(n.x * 1.1 + rand(-0.6, 0.6), rand(0.8, 1.8), n.z * 1.1 + rand(-0.6, 0.6)) });
  }
}
function updateBlood5(dt) {
  for (let i = drops5.length - 1; i >= 0; i--) {
    const d = drops5[i]; d.v.y -= 11 * dt; d.o.position.addScaledVector(d.v, dt);
    if (d.o.position.y <= 0.02) {
      d.sc.remove(d.o); drops5.splice(i, 1);
      if (stains5.length >= 60) { const old = stains5.shift(); old.sc.remove(old.o); }
      const m = new THREE.MeshStandardMaterial({ color: DROP_MAT5.color.clone().multiplyScalar(0.6), roughness: 0.35, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
      const s2 = new THREE.Mesh(STAIN_GEO5, m); s2.rotation.x = -Math.PI / 2; s2.position.set(d.o.position.x, 0.025, d.o.position.z);
      s2.scale.setScalar(d.r * 3); d.sc.add(s2); stains5.push({ o: s2, sc: d.sc, t: 0 });
    }
  }
  for (let i = stains5.length - 1; i >= 0; i--) {
    const s2 = stains5[i]; s2.t += dt;
    if (s2.t > 40) { s2.o.material.opacity = 0.85 * clamp(1 - (s2.t - 40) / 15, 0, 1); if (s2.t > 55) { s2.sc.remove(s2.o); stains5.splice(i, 1); } }
  }
}
function clearBlood5() { for (const d of drops5) d.sc.remove(d.o); drops5.length = 0; for (const s2 of stains5) s2.sc.remove(s2.o); stains5.length = 0; }

// ============================================================
// v6: patada de empeine, gancho ancho de costado, desplazamiento mirando al rival
// ============================================================
KICK_LEG.groundkick = 1;
// zona del golpe (redefinida: la última declaración gana)
function zoneOf(att, opts) {
  const t = att.attack && att.attack.type;
  if (opts && opts.held) return 'body';
  if (t === 'kick' || t === 'dropkick' || t === 'stomp' || t === 'groundkick') return 'body';
  if (t === 'swing' && Math.random() < 0.35) return 'body';
  return 'head';
}
// rival más cercano (se recalcula cada 0,2 s)
Fighter.prototype.nearFoe = function (maxD) {
  this._foeT = (this._foeT || 0) - (curDt || 0.016);
  if (this._foeT <= 0 || (this._foe && !this._foe.alive)) {
    this._foeT = 0.2; this._foe = null; let bd = 99;
    for (const e of fighters) { if (e.team === this.team || e.team < 0 || e.spectator || !e.alive || e.state === 'down') continue; const d = Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z); if (d < bd) { bd = d; this._foe = e; } }
    this._foeD = bd;
  }
  return this._foe && this._foeD <= maxD ? this._foe : null;
};

