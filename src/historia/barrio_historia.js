// ============================================================
// MODO HISTORIA EN EL BARRIO: las misiones arrancan en LUGARES
// - Tito te manda a la plaza: al entrar a la plaza arranca la pelea.
// - La Colo te manda a la parada del remís: esperás, llega el remís por la calle y te lleva al Trofi.
// - Flecha arriba (adónde ir y a cuántos metros) y mini mapa en la esquina.
// ============================================================
HIST.goal = null;
{
  const baseLaunch = histLaunch;
  histLaunch = function (m) {
    if (m.lugar && !(HIST.goal && HIST.goal.go)) {   // primero hay que ir hasta el lugar
      HIST.goal = { m, x: m.lugar[0], z: m.lugar[1], r: m.lugar[2], text: m.lugar[3], remis: !!m.remis, go: false, t: 0 };
      histObjective(); banner('OBJETIVO', m.lugar[3] + ' · seguí la flecha', 'round'); return;   // que quede claro adónde ir
    }
    HIST.goal = null; return baseLaunch(m);
  };
  const baseObj = histObjective;
  histObjective = function () {
    baseObj();
    const g = HIST.goal; if (!g) return;
    HIST.ui.obj.querySelector('.s').innerHTML = `<b>${g.text}</b><br>${g.m.resumen}`;
  };
  // al volver al barrio (o al salir), se borra el objetivo pendiente
  const baseEnter = histEnterHub; histEnterHub = function () { HIST.goal = null; if (BA.remis) { BA.remis.g.visible = false; BA.remis.on = false; } return baseEnter.apply(this, arguments); };
}
// el remís que viene a buscarte
function baRemisLlega() {
  if (!BA.remis) { const car = trofiCar(0xe8e8e6, ''); service36(car, 'remis'); CALLE.scene.add(car); BA.remis = { g: car, x: -60, on: false }; }
  const r = BA.remis; r.x = -28; r.on = true;   /* arranca cerca: llega en ~5 s */ r.g.visible = true; r.g.rotation.y = 0; r.g.position.set(r.x, 0, 1.9);
  popText(new THREE.Vector3(BA.parada.x, 2.4, BA.parada.z), 'Esperando el remís...', 'warn', 3);
}
// ---------- flecha y mini mapa ----------
(function baUI() {
  const st = document.createElement('style');
  st.textContent = `#baArrow{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:12;display:flex;align-items:center;gap:10px;background:rgba(8,8,12,.75);border:3px solid #000;box-shadow:4px 4px 0 #000;padding:6px 14px;font:18px Impact,'Arial Black',sans-serif;letter-spacing:1px;color:#ffd84a;pointer-events:none}
  #baArrow i{display:inline-block;width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-bottom:22px solid #ffd84a;transition:transform .08s linear}
  #baMap{position:fixed;right:16px;top:16px;z-index:12;width:180px;height:180px;border:3px solid #000;box-shadow:4px 4px 0 #000;background:#0a0c12;pointer-events:none}`;
  document.head.appendChild(st);
  const a = document.createElement('div'); a.id = 'baArrow'; a.className = 'hidden'; a.innerHTML = '<i></i><span></span>'; document.body.appendChild(a);
  const c = document.createElement('canvas'); c.id = 'baMap'; c.width = 180; c.height = 180; c.className = 'hidden'; document.body.appendChild(c);
  HIST.ui.arrow = a; HIST.ui.map = c;
})();
function baTarget() {
  const g = HIST.goal; if (g) return { x: g.x, z: g.z, name: g.text.replace(/^Andá a /, '') };
  const next = HISTORIA.misiones.find(m => histAvailable(m) && !HIST.prog.hechas.includes(m.id));
  if (!next) return null; const mk = HIST.marks.find(k => k.m === next); return mk ? { x: mk.x, z: mk.z, name: ROSTER_ORIG[0][next.quien].name.toUpperCase() } : null;
}
function baDrawMap(P, tgt) {
  const c = HIST.ui.map, g = c.getContext('2d'), S = 180 / (BA_R * 2 + 4), X = x => (x + BA_R + 2) * S, Z = z => (z + BA_R + 2) * S;
  g.fillStyle = '#0a0c12'; g.fillRect(0, 0, 180, 180);
  g.fillStyle = '#3a3326'; for (const [x0, z0] of [[-BA_R, -BA_R], [-BA_R, BA_F], [BA_F, BA_F]]) g.fillRect(X(x0), Z(z0), (BA_R - BA_F) * S, (BA_R - BA_F) * S);
  g.fillStyle = '#2c5a2c'; g.fillRect(X(BA_F), Z(-BA_R), (BA_R - BA_F) * S, (BA_R - BA_F) * S);                                    // la plaza
  g.fillStyle = '#6a6c72'; g.fillRect(X(6.5), Z(6.5), 15.5 * S, 15.5 * S);                                                             // la estación
  g.fillStyle = '#4a4c52'; g.fillRect(X(-BA_R), Z(-4), (BA_R * 2) * S, 8 * S); g.fillRect(X(-4), Z(-BA_R), 8 * S, (BA_R * 2) * S);   // calles
  g.fillStyle = '#9a8a6a'; g.fillRect(0, Z(-49), 180, 2);                                                                              // vías
  g.font = 'bold 9px Arial'; g.fillStyle = '#cfe8c8'; g.fillText('PLAZA', X(21), Z(-26));
  for (const mk of HIST.marks) { g.fillStyle = mk.m.bloqueada ? '#888' : mk.done ? '#5aff8a' : '#ffcf3a'; g.beginPath(); g.arc(X(mk.x), Z(mk.z), 3.2, 0, 7); g.fill(); }
  if (tgt) { g.fillStyle = '#ff3fb4'; g.beginPath(); const tx = X(tgt.x), tz = Z(tgt.z); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7, a = i / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(tx + Math.cos(a) * r, tz + Math.sin(a) * r); } g.fill(); }
  if (P) { g.save(); g.translate(X(P.pos.x), Z(P.pos.z)); g.rotate(-P.facing + Math.PI); g.fillStyle = '#6aa8ff'; g.beginPath(); g.moveTo(0, -6); g.lineTo(4.5, 5); g.lineTo(-4.5, 5); g.closePath(); g.fill(); g.restore(); }
}
// ---------- cada cuadro: lugares, remís, flecha, mapa ----------
{
  const baseStep = step;
  step = function (rdt, render) {
    baseStep(rdt, render);
    const inHub = gameState === 'historia' && HIST.on && BA.built;
    HIST.ui.arrow.classList.toggle('hidden', !inHub); HIST.ui.map.classList.toggle('hidden', !inHub);
    if (!inHub) return;
    const P = player; if (!P) return;
    const g = HIST.goal, dt = Math.min(0.05, rdt || 0.016);
    if (g && !g.go) {
      const d = Math.hypot(P.pos.x - g.x, P.pos.z - g.z);
      if (d < g.r) {
        if (!g.remis) { g.go = true; banner(g.m.nombre, g.m.resumen, 'round'); setTimeout(() => histLaunch(g.m), 900); }
        else if (!BA.remis || !BA.remis.on) baRemisLlega();
      }
    }
    // el remís viene por la calle, frena en la parada y arranca la misión
    const R = BA.remis;
    if (R && R.on && g && g.remis && !g.go) {
      const stopX = BA.parada.x - 2.6; R.x += Math.max(0.6, Math.min(11, (stopX - R.x) * 1.2)) * dt; if (R.x > stopX) R.x = stopX;
      R.g.position.set(R.x, 0, 1.9);
      if (R.x >= stopX - 0.05 && Math.hypot(P.pos.x - g.x, P.pos.z - g.z) < g.r + 3) { g.go = true; popText(new THREE.Vector3(R.x, 2.4, 1.9), '¡Subí que te llevo al Trofi!', 'warn', 2); setTimeout(() => histLaunch(g.m), 1400); }
    }
    // flecha: hacia el objetivo, relativa a la cámara
    const tgt = baTarget(), a = HIST.ui.arrow;
    if (tgt) {
      const dx = tgt.x - P.pos.x, dz = tgt.z - P.pos.z, rel = Math.atan2(dx, dz) - (HIST.camYawS !== undefined ? HIST.camYawS : HIST.camYaw);
      a.querySelector('i').style.transform = `rotate(${(-rel * 180 / Math.PI).toFixed(1)}deg)`;
      a.querySelector('span').textContent = `${tgt.name} · ${Math.round(Math.hypot(dx, dz))} m`;
    } else a.querySelector('span').textContent = 'Por esta noche, nada más';
    baDrawMap(P, tgt);
  };
}
