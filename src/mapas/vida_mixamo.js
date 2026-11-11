// ============================================================
// GENTE DE LA CALLE CON CUERPO DE MIXAMO (como los luchadores, los patovicas y Doña Chola)
// Reemplaza a los muñequitos simples: la gente del bar (sentada, tomando y charlando), el mozo con la bandeja
// y los dos del motochorro (montados en la moto). Sin IK de pies: así pueden sentarse y montar.
// ============================================================
const VMX = { bar: [], mozo: null, riders: [], t: 0 };
const VMX_ROPA = [
  { top: 'remera', topColor: 0xc83a2a, pants: 0x2a3448, skin: 0xd9a27a, hair: 'short', hairColor: 0x2a1a10 },
  { top: 'remera', topColor: 0x2a5ab8, pants: 0x1a1e28, skin: 0xc68b62, hair: 'short', hairColor: 0x111111, beard: true },
  { top: 'remera', topColor: 0xf0eee6, pants: 0x3a3428, skin: 0xe0ac86, hair: 'rulos', hairColor: 0x3a2414 },
  { top: 'remera', topColor: 0x2a8a5a, pants: 0x2a2a30, skin: 0x8a5a3a, hair: 'short', hairColor: 0x111111 },
  { top: 'remera', topColor: 0xe8c030, pants: 0x2e4058, skin: 0xd9a27a, hair: 'long', hairColor: 0x5a3a1a, female: true },
  { top: 'remera', topColor: 0x6a2a8a, pants: 0x1a1a22, skin: 0xf0c8a8, hair: 'long', hairColor: 0xd8b060, female: true },
];
function vmxBody(cfg, idx, name) {
  const b = new Fighter(-1, idx, Object.assign({ name: name || 'Vecino', civil: false }, cfg), false);
  if (b.label) { b.label.classList.add('npc'); b.label.style.display = 'none'; }
  b.useIK = false; b.root.position.copy(b.pos);
  return b;
}
// sentado en una silla: muslos horizontales, rodillas a 90°, cadera a la altura del asiento; cada tanto toma
function vmxSeatPose(q) {
  return (P) => {
    P.lL = P.lR = -1.5; P.kL = P.kR = 1.45; P.lLz = -0.08; P.lRz = 0.08; P.hipY = -0.56; P.tX = 0.06; P.tY = 0; P.tZ = 0;
    const s = Math.sin(VMX.t * 0.8 + q.ph);
    if (s > 0.75) { P.aR = -1.25; P.eR = -2.3; P.aRz = -0.15; P.hX = -0.25; }   // toma de la botella
    else { P.aR = -0.55; P.eR = -1.5; P.aRz = 0.1; P.hX = 0.05; }                 // botella apoyada en la mesa
    P.aL = -0.35 + Math.sin(VMX.t * 2.1 + q.ph) * 0.18; P.eL = -1.1; P.aLz = -0.2;   // gesticula charlando
    P.hY = Math.sin(VMX.t * 0.37 + q.ph) * 0.5;
  };
}
// montado en la moto: piernas abiertas hacia los apoyapiés, brazos al manubrio, inclinado adelante
function vmxRidePose(back) {
  return (P) => {
    P.lL = P.lR = -0.95; P.kL = P.kR = 1.25; P.lLz = -0.32; P.lRz = 0.32; P.hipY = back ? 0.04 : -0.02;
    if (back) { P.aL = P.aR = -0.6; P.eL = P.eR = -1.6; P.aLz = 0.5; P.aRz = -0.5; P.tX = 0.12; P.hY = Math.sin(VMX.t * 0.6) * 0.6; }   // el de atrás mira para los costados
    else { P.aL = P.aR = -1.15; P.eL = P.eR = -0.45; P.aLz = -0.15; P.aRz = 0.15; P.tX = 0.3; P.hX = -0.2; }
  };
}
{
  const baseBuild = buildCalle;
  buildCalle = function () {
    const fresh = !CALLE.built; baseBuild(); if (!fresh) return;
    const sc = CALLE.scene, prev = scene; scene = sc;
    // --- gente del bar: se sacan los muñequitos y se sientan cuerpos de Mixamo en las mismas sillas ---
    let k = 0;
    for (const q of BAR.people) {
      const old = q.p.g, pos = old.position.clone(), rot = old.rotation.y; sc.remove(old);
      const cfg = VMX_ROPA[k % VMX_ROPA.length], b = vmxBody(cfg, k, cfg.female ? 'La Vecina' : 'Vecino del bar');
      b.pos.set(pos.x, 0, pos.z); b.facing = rot; const nq = { b, ph: q.ph }; b.poseFn = vmxSeatPose(nq);
      const bottle = cyl(0.03, 0.035, 0.24, trofiMat(0x3a2410, { roughness: 0.12 }), 0, -0.05, 0.05, b.hand || b.root, 8);
      VMX.bar.push(nq); k++;
    }
    BAR.people.length = 0;
    // --- el mozo ---
    if (BAR.mozo) {
      sc.remove(BAR.mozo.p.g);
      const m = vmxBody({ top: 'remera', topColor: 0xf4f4f0, pants: 0x111111, skin: 0xc68b62, hair: 'short', hairColor: 0x111111 }, 7, 'El mozo');
      m.useIK = true;   // camina: pies plantados
      const tray = box(0.42, 0.02, 0.32, trofiMat(0xb8bcc0, { metalness: 0.8, roughness: 0.25 }), 0, 0.02, 0.12, m.hand || m.root);
      for (let i = 0; i < 2; i++) cyl(0.035, 0.04, 0.24, trofiMat(0x3a2410, { roughness: 0.12 }), -0.08 + i * 0.16, 0.14, 0.12, m.hand || m.root, 8);
      m.poseFn = (P) => { P.aL = -1.15; P.eL = -1.55; P.aLz = -0.25; };   // bandeja en alto
      VMX.mozo = { b: m, x0: BAR.mozo.x0, t: 0 }; BAR.mozo = null;
    }
    // --- los del motochorro: se sacan los muñequitos y se montan dos cuerpos de Mixamo ---
    const mo = VIDA.moto;
    if (mo) {
      mo.g.children.slice().forEach(o => { if (o.isGroup && o.name !== 'Enduro') mo.g.remove(o); });
      const r1 = vmxBody({ top: 'remera', topColor: 0x1a1a1e, pants: 0x2a2e38, skin: 0xb07e5a, hair: 'short', hairColor: 0x111111 }, 3, 'Motochorro');
      const r2 = vmxBody({ top: 'remera', topColor: 0x3a4a2a, pants: 0x1a1e28, skin: 0xd9a27a, hair: 'short', hairColor: 0x2a1a10 }, 4, 'El de atrás');
      r1.poseFn = vmxRidePose(false); r2.poseFn = vmxRidePose(true);
      for (const [b, dx] of [[r1, 0.08], [r2, -0.42]]) VMX.riders.push({ b, dx, helmCol: dx > 0 ? 0x111111 : 0xd8d8d8, helm: null });   // el casco va en el hueso de la cabeza de Mixamo (se pone en el primer cuadro)
    }
    scene = prev;
  };
  const baseWorld = updateWorld;
  updateWorld = function (dt) {
    baseWorld(dt); if (scene !== CALLE.scene) return;
    VMX.t += dt;
    for (const q of VMX.bar) { const b = q.b; b.curSpeed = 0; b.root.position.copy(b.pos); b.root.rotation.y = b.facing; b.animate(dt); }
    const mz = VMX.mozo;
    if (mz) {   // va y viene entre las mesas, por la vereda
      mz.t += dt; const u = (Math.sin(mz.t * 0.3) + 1) / 2, x = mz.x0 - 2.6 + u * 5.2, b = mz.b;
      const vx = (x - b.pos.x) / Math.max(dt, 1e-3);
      b.pos.set(x, 0, -3.75); b.curSpeed = Math.min(1.6, Math.abs(vx)); if (Math.abs(vx) > 0.05) b.facing = vx > 0 ? Math.PI / 2 : -Math.PI / 2;
      b.root.position.copy(b.pos); b.root.rotation.y = b.facing; b.animate(dt);
    }
    const mo = VIDA.moto;
    if (mo) for (const r of VMX.riders) {   // pegados a la moto, mirando hacia donde va
      const b = r.b, dir = mo.dir;
      if (!r.helm && b.chv && b.chv.v) {   // casco pegado a la cabeza del cuerpo de Mixamo, compensando la escala del hueso
        const v = b.chv.v, hb = v.bones[v.names.indexOf('Head')];
        if (hb) { b.root.updateMatrixWorld(true); const ws = hb.getWorldScale(new THREE.Vector3()).x || 1;
          const h = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), trofiMat(r.helmCol, { roughness: 0.22, metalness: 0.35 }));
          h.scale.set(0.15 / ws, 0.155 / ws, 0.165 / ws); h.position.set(0, 0.1 / ws, 0.005 / ws); h.castShadow = true; hb.add(h);
          const visor = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, -0.9, 1.8, 1.25, 0.5), trofiMat(0x0c1218, { roughness: 0.05, metalness: 0.6 }));
          visor.scale.set(0.152 / ws, 0.157 / ws, 0.167 / ws); visor.position.copy(h.position); visor.rotation.y = 0; hb.add(visor);
          r.helm = h; }
      }
      b.pos.set(mo.x + r.dx * dir, 0.0, mo.lane); b.facing = dir > 0 ? Math.PI / 2 : -Math.PI / 2; b.curSpeed = 0;
      b.root.position.copy(b.pos); b.root.rotation.y = b.facing; b.animate(dt);   /* la cadera ya queda a la altura del asiento (1,05 m) */
    }
  };
}
