// ============================================================
// v12: MOVIMIENTOS CAPTURADOS (Mixamo) TRASLADADOS A NUESTROS LUCHADORES
// Se leen las posiciones de cadera, columna, cabeza, hombros, codos, manos, caderas, rodillas, tobillos y
// puntas de pie de cada cuadro, se escalan a nuestras proporciones y se aplican con la IK que ya existe.
// ============================================================
const MOCAP = (() => {
  const J = MOCAP_DATA.joints, idx = {}; J.forEach((n, i) => idx[n] = i);
  const clips = {};
  for (const k of ['jabcross', 'flyknee', 'longstep']) {
    const c = MOCAP_DATA[k], n = c.n, d = c.data, NJ = J.length;
    const at = (f, j, out) => out.set(d[(f * NJ + j) * 3], d[(f * NJ + j) * 3 + 1], d[(f * NJ + j) * 3 + 2]);
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    const len = (j1, j2) => { at(0, idx[j1], a); at(0, idx[j2], b); return a.distanceTo(b); };
    clips[k] = { n, fps: c.fps, dur: (n - 1) / c.fps, at,
      leg: len('LeftUpLeg', 'LeftLeg') + len('LeftLeg', 'LeftFoot'), arm: len('LeftArm', 'LeftForeArm') + len('LeftForeArm', 'LeftHand') };
  }
  return { J, idx, clips };
})();
// muestra interpolada de una articulación (espejada si mirror: izquierda<->derecha y x negativo)
const _mA = new THREE.Vector3(), _mB = new THREE.Vector3();
function mocapJoint(clip, t, name, mirror, out) {
  if (mirror) name = name.startsWith('Left') ? 'Right' + name.slice(4) : name.startsWith('Right') ? 'Left' + name.slice(5) : name;
  const f = clamp(t * clip.fps, 0, clip.n - 1), f0 = Math.floor(f), f1 = Math.min(clip.n - 1, f0 + 1), k = f - f0, j = MOCAP.idx[name];
  clip.at(f0, j, _mA); clip.at(f1, j, _mB); out.copy(_mA).lerp(_mB, k);
  if (mirror) out.x = -out.x;
  return out;
}
// qué movimiento usa cada ataque y cómo se sincroniza (el pico del golpe cae en el hitAt del juego)
const MOCAP_ATK = {
  jab: { segs: [{ clip: 'jabcross', from: 0.15, peak: 13 / 30, to: 0.62 }], mirror: true },
  cross: { segs: [{ clip: 'jabcross', from: 0.48, peak: 21 / 30, to: 1.05 }], mirror: true },
  stepjab: { segs: [{ clip: 'longstep', from: 0.0, to: 0.9, t0: 0, t1: 0.42, travel: true }, { clip: 'jabcross', from: 0.2, peak: 13 / 30, to: 0.62, t0: 0.42, t1: 0.8 }], mirror: true },
  flyknee: { segs: [{ clip: 'flyknee', from: 0.35, to: 2.45, t0: 0, t1: 2.1, travel: true }], mirror: true },
};
ATK.stepjab = { dur: 0.8, hitAt: 0.56, range: 1.6, arc: 1.05, dmg: 7, kb: 3, stun: 0.35 };                  // paso largo + jab
// rodilla voladora (derriba) y remate arrodillado en el piso: tiempos tomados de la captura (rodilla 0,93 s; piñas en el piso 1,8 / 2,05 / 2,3 s)
ATK.flyknee = { dur: 2.1, hitAt: 0.52, hitEnd: 0.75, multi: true, range: 1.9, arc: 1.3, dmg: 14, kb: 5, knockdown: true, extra: [[1.45, 2], [1.7, 2], [1.95, 2]] };

// ============================================================
// v15 - NUEVOS MOVIMIENTOS MIXAMO / CAPA DE GAMEPLAY
// Fuentes entregadas: Flying Kick, Head Hit, Standing Melee Combo v2,
// Knee Jabs To Uppercut y Strike Forward Jog.
// Esta capa preserva el MOCAP existente y usa perfiles jugables compatibles.
// ============================================================
const MOVE15 = {
  flyingkick: { source:'Flying Kick', dur:1.35, hitAt:.58, hitEnd:.78, dmg:16, kb:6.2, knockdown:true, range:2.35, arc:1.45 },
  headhit: { source:'Head Hit', dur:1.67, reaction:true },
  meleecombo: { source:'Standing Melee Combo Attack Ver. 2', dur:4.2, weapon:true, dmgMul:1.12 },
  kneeupper: { source:'Knee Jabs To Uppercut', dur:5.67, combo:true },
  strikejog: { source:'Strike Foward Jog', dur:1.05, travel:true, weapon:true }
};
function applyMove15Visual(f,key,t){
  if(!f||!f.torso)return;
  const u=Math.max(0,Math.min(1,t));
  if(key==='flyingkick'){
    f.torso.rotation.x=-.12*Math.sin(Math.PI*u);
    f.torso.rotation.z=.08*Math.sin(Math.PI*u);
    if(f.legs&&f.legs[1]) f.legs[1].rotation.x=-1.15*Math.sin(Math.PI*u);
    if(f.knees&&f.knees[1]) f.knees[1].rotation.x=.38*Math.sin(Math.PI*u);
  } else if(key==='meleecombo'||key==='strikejog'){
    f.torso.rotation.y += .16*Math.sin(Math.PI*2*u);
    if(f.arms){ f.arms[0].rotation.x-=.45*Math.sin(Math.PI*u); f.arms[1].rotation.x-=.85*Math.sin(Math.PI*u); }
  } else if(key==='kneeupper'){
    f.torso.rotation.x=-.09*Math.sin(Math.PI*u);
    if(f.legs&&f.legs[0]) f.legs[0].rotation.x=-.7*Math.sin(Math.PI*u);
    if(f.arms&&f.arms[1]) f.arms[1].rotation.x=-.9*Math.sin(Math.PI*u);
  }
}
// Nueva patada voladora jugable. Se mantiene flyknee intacto.
ATK.flyingkick15={dur:1.35,hitAt:.58,hitEnd:.78,range:2.35,arc:1.45,dmg:16,kb:6.2,knockdown:true};
// Perfiles para ataques con herramienta: combo parado y golpe avanzando.
function weaponVariant15(f){
  if(!f||!f.weapon)return null;
  return f.curSpeed>2.2?'strikejog':'meleecombo';
}

PUNCH_ARM.stepjab = 0;

// tiempo del clip para un tiempo de ataque dado
function mocapSegTime(spec, t, dur, hitAt) {
  for (const s of spec.segs) {
    const t0 = s.t0 !== undefined ? s.t0 : 0, t1 = s.t1 !== undefined ? s.t1 : dur;
    if (t > t1 && s !== spec.segs[spec.segs.length - 1]) continue;
    const u = clamp((t - t0) / Math.max(1e-3, t1 - t0), 0, 1);
    let ct;
    if (s.peak !== undefined) {   // dos tramos: hasta el impacto y después
      const hu = clamp((hitAt - t0) / Math.max(1e-3, t1 - t0), 0.05, 0.95);
      ct = u < hu ? lerp(s.from, s.peak, u / hu) : lerp(s.peak, s.to, (u - hu) / (1 - hu));
    } else ct = lerp(s.from, s.to, u);
    return { seg: s, ct };
  }
  return null;
}
Fighter.prototype.mocapLayer = function (dt) {
  const a = this.attack, spec = this.state === 'attack' && a ? MOCAP_ATK[a.type] : null;
  // entra rápido, sale suave (se sigue mostrando el último cuadro mientras se apaga)
  if (spec) { this.mcW = Math.min(1, (this.mcW || 0) + dt / 0.06); this.mcLast = { spec, t: a.t, dur: a.def.dur, hitAt: a.def.hitAt }; }
  else this.mcW = Math.max(0, (this.mcW || 0) - dt / 0.18);
  const w = this.mcW; if (w <= 0.001 || !this.mcLast) { this.mcTravel = null; if (this.mcLast) { this.rig.position.x = 0; this.rig.position.z = 0; this.mcLast = null; } return; }
  const L = this.mcLast, st = mocapSegTime(L.spec, spec ? a.t : L.t, L.dur, L.hitAt); if (!st) return;
  const clip = MOCAP.clips[st.seg.clip], t = st.ct, mir = L.spec.mirror, S = this.rig.scale.y;
  const sL = (IKC.L1 + IKC.L2) * S / clip.leg, sA = (IKC.A1 + IKC.A2) * S / clip.arm;
  const V = (n, o) => mocapJoint(clip, t, n, mir, o || new THREE.Vector3());
  const hips = V('Hips');
  // desplazamiento real (paso largo, rodilla voladora): el luchador avanza lo que avanza la captura
  if (spec && st.seg.travel) {
    const key = st.seg.clip;
    if (!this.mcTravel || this.mcTravel.key !== key || this.mcTravel.atk !== a) this.mcTravel = { key, atk: a, x: hips.x, z: hips.z };
    const dx = (hips.x - this.mcTravel.x) * sL, dz = (hips.z - this.mcTravel.z) * sL; this.mcTravel.x = hips.x; this.mcTravel.z = hips.z;
    const c = Math.cos(this.facing), s = Math.sin(this.facing);
    this.pos.x += (c * dx + s * dz) * w; this.pos.z += (-s * dx + c * dz) * w;
    collideObstacles(this.pos, 0.4); this.root.position.x = this.pos.x; this.root.position.z = this.pos.z;
  }
  // pelvis
  const lu = V('LeftUpLeg'), ru = V('RightUpLeg'), sp = V('Spine'), q = new THREE.Quaternion(), m = new THREE.Matrix4();
  const basis = (x, yHint, out) => { const X = x.clone().normalize(), Z = new THREE.Vector3().crossVectors(X, yHint).normalize(), Y = new THREE.Vector3().crossVectors(Z, X); m.makeBasis(X, Y, Z); return out.setFromRotationMatrix(m); };
  const qRig = basis(lu.clone().sub(ru), sp.clone().sub(hips), new THREE.Quaternion());
  this.rig.quaternion.slerp(qRig, w);
  const travelling = spec && st.seg.travel;
  this.rig.position.y = lerp(this.rig.position.y, hips.y * sL, w);
  this.rig.position.x = travelling ? 0 : hips.x * sL * w; this.rig.position.z = travelling ? 0 : hips.z * sL * w;   // se calcula desde cero cada cuadro
  // torso y cabeza
  const la = V('LeftArm'), ra = V('RightArm'), s2 = V('Spine2'), nk = V('Neck'), hd = V('Head'), ht = V('HeadTop_End');
  const qT = basis(la.clone().sub(ra), nk.clone().sub(s2), new THREE.Quaternion());
  this.torso.quaternion.slerp(q.copy(qRig).invert().multiply(qT), w);
  const qH = basis(la.clone().sub(ra), ht.clone().sub(hd), new THREE.Quaternion());
  this.head.quaternion.slerp(q.copy(qT).invert().multiply(qH), w);
  this.root.updateMatrixWorld(true);
  // brazos (nuestro índice 1 = izquierda del personaje)
  const W2 = (v) => this.root.localToWorld(v.clone());
  for (let i = 0; i < 2; i++) {
    const side = i === 1 ? 'Left' : 'Right', up = this.arms[i], el = this.elbows[i];
    const sh = up.getWorldPosition(new THREE.Vector3());
    const rel = (n) => W2(V(side + n).sub(V(side + 'Arm'))).sub(W2(new THREE.Vector3()));   // dirección en el mundo
    const tgt = sh.clone().addScaledVector(rel('Hand'), sA), pole = sh.clone().addScaledVector(rel('ForeArm'), sA);
    pole.addScaledVector(rel('ForeArm').cross(rel('Hand')).normalize(), 0.02);
    this.torso.worldToLocal(tgt); this.torso.worldToLocal(pole);
    ikSolve2(up, el, tgt, pole, IKC.A1, IKC.A2, false, w);
  }
  // piernas + pies
  this.root.getWorldQuaternion(q);
  for (let i = 0; i < 2; i++) {
    const side = i === 1 ? 'Left' : 'Right', th = this.legs[i], kn = this.knees[i], ft = this.feet[i];
    const hip = th.getWorldPosition(new THREE.Vector3());
    const rel = (n) => W2(V(side + n).sub(V(side + 'UpLeg'))).sub(W2(new THREE.Vector3()));
    const tgt = hip.clone().addScaledVector(rel('Foot'), sL), pole = hip.clone().addScaledVector(rel('Leg'), sL);
    const mn = IKC.ANK * S; if (tgt.y < mn) tgt.y = mn;        // el tobillo no se mete en el piso
    this.rig.worldToLocal(tgt); this.rig.worldToLocal(pole);
    ikSolve2(th, kn, tgt, pole, IKC.L1, IKC.L2, true, w);
    th.updateMatrixWorld(true);
    const toe = V(side + 'ToeBase').sub(V(side + 'Foot')); const yaw = Math.atan2(toe.x, toe.z), pitch = -Math.atan2(toe.y, Math.hypot(toe.x, toe.z));
    const qf = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')).premultiply(q);
    const ql = kn.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(qf);
    ft.quaternion.slerp(ql, w);
    if (w > 0.5 && this.foot) this.foot[i].valid = false;        // al terminar, los pies se vuelven a plantar donde quedaron
  }
};
// impactos extra (rodilla voladora: después de la rodilla vienen 4 piñas; la última tira al piso)
{
  const baseUpdate = Fighter.prototype.update;
  Fighter.prototype.update = function (dt) {
    const a = this.state === 'attack' ? this.attack : null, t0 = a ? a.t : 0;
    baseUpdate.call(this, dt);
    if (a && this.attack === a && a.def.extra && this.state === 'attack') {
      for (const [et, last] of a.def.extra) if (t0 < et && a.t >= et) {
        const keep = a.def;
        if (last === 2) a.def = Object.assign({}, keep, { dmg: 7, kb: 0, knockdown: false, onDowned: true, range: 1.7, arc: 1.5 });   // piña al caído
        else if (last === 1) a.def = Object.assign({}, keep, { kb: 10, knockdown: true, dmg: 12 });
        else a.def = Object.assign({}, keep, { dmg: 7, kb: 2.5, knockdown: false });
        this.performHit(); a.def = keep;
      }
    }
  };
}

function collideObstacles(p, r) {
  for (const o of obstacles) {
    const cx = clamp(p.x, o.minX, o.maxX), cz = clamp(p.z, o.minZ, o.maxZ);
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
      else {
        const pen = [p.x - o.minX, o.maxX - p.x, p.z - o.minZ, o.maxZ - p.z];
        const i = pen.indexOf(Math.min.apply(null, pen));
        if (i === 0) p.x = o.minX - r; else if (i === 1) p.x = o.maxX + r; else if (i === 2) p.z = o.minZ - r; else p.z = o.maxZ + r;
      }
    }
  }
}

