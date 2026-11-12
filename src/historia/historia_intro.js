// ============================================================
// INTRO DEL MODO HISTORIA: cinemática con el barrio de verdad (barras de cine y subtítulos)
// 1) el barrio desde arriba, con las luces prendidas  2) titilan y se corta la luz  3) la calle a oscuras
// 4) Rubén sale de su casa (quién es)  5) primer plano y el título. ENTER / ESC: saltear.
// ============================================================
const INTRO_HIST = [
  { t: 0, txt: 'Barrio Las Acacias. Conurbano bonaerense. 23:39.' },
  { t: 5.2, txt: '23:40. Se corta la luz en todo el barrio.' },
  { t: 8.8, txt: 'En la oscuridad empiezan a correr mensajes raros. Notas, audios... y una foto de perfil con un pancho.' },
  { t: 14.2, txt: '<b>Rubén.</b> Capitán de <span class="b">La Par</span>. Nació y se crió en el Pasaje 14.' },
  { t: 17.6, txt: 'Laburante, buen tipo, de los que ayudan a todos... pero no le toques el barrio.' },
  { t: 21.0, txt: '"Si el barrio se va a pelear esta noche, que La Par esté junta."' },
];
const INTRO_DUR = 25.5;
function histIntroStart() {
  const sc = CALLE.scene; if (!sc) return;
  const I = HIST.cine = { t: 0, line: -1, lamps: [], halos: [], hemi: null, hemi0: 0, out: false };
  // luces de calle prendidas (antes del corte)
  for (let a = -38; a <= 38; a += 19) for (const [x, z] of [[a, 3.8], [3.8, a]]) {
    if (Math.abs(x) < 9 && Math.abs(z) < 9) continue;
    const l = new THREE.PointLight(0xffb060, 1.6, 22, 1.6); l.position.set(x, 6.6, z); sc.add(l); I.lamps.push(l);
    I.halos.push(trofiHalo(sc, x, 6.7, z, 0xffb060, 3.2, 0.6));
  }
  sc.traverse(o => { if (o.isHemisphereLight && !I.hemi) { I.hemi = o; I.hemi0 = o.intensity; o.intensity = I.hemi0 * 2.2; } });
  // interfaz: barras de cine, subtítulo; se oculta lo del barrio
  for (const id of ['histObj', 'baArrow', 'baMap', 'histPrompt']) { const e = document.getElementById(id); if (e) e.classList.add('hidden'); }
  HIST.marks.forEach(m => { m.label.style.display = 'none'; });
  document.getElementById('cine').classList.add('on');
  window.__camLock = true;
  const P = player; if (P) { P.pos.set(-7.4, 0, 26.5); P.facing = Math.PI / 2; P.root.position.copy(P.pos); P.root.visible = false; if (P.ring) P.ring.visible = false; }   // Rubén adentro de su casa (no se ve hasta que sale)
}
function histIntroEnd() {
  const I = HIST.cine; if (!I) return;
  for (const l of I.lamps) if (l.parent) l.parent.remove(l); for (const h of I.halos) if (h.parent) h.parent.remove(h);
  if (I.hemi) I.hemi.intensity = I.hemi0;
  HIST.cine = null; window.__camLock = false;
  document.getElementById('cine').classList.remove('on'); const cap = document.getElementById('caption'); cap.classList.remove('in'); cap.innerHTML = '';
  const P = player; if (P && BA.ruben) { P.pos.set(BA.ruben.x, 0, BA.ruben.z); P.facing = Math.PI / 2; P.root.visible = true; if (P.ring) P.ring.visible = true; }
  HIST.camYaw = Math.PI / 2; HIST.camYawS = undefined;
  HIST.prog.prologo = true; histSave();
  HIST.ui.obj.classList.remove('hidden'); histObjective();
  banner('UNA NOCHE SIN LUZ', 'Buscá a Tito. Seguí la flecha.', 'round');
}
function histIntroUpdate(dt) {
  const I = HIST.cine, t = (I.t += dt), P = player, c = camera, cap = document.getElementById('caption');
  // subtítulos
  let li = -1; INTRO_HIST.forEach((l, i) => { if (t >= l.t) li = i; });
  if (li !== I.line) { I.line = li; cap.classList.remove('in'); void cap.offsetWidth; cap.innerHTML = INTRO_HIST[li].txt; cap.classList.add('in'); }
  // el corte de luz: titilan y se apagan
  if (t > 4.6 && !I.out) {
    const on = t < 6.0 ? (Math.random() < 0.55) : false;
    for (const l of I.lamps) l.intensity = on ? 1.6 : 0; for (const h of I.halos) h.visible = on;
    if (I.hemi) I.hemi.intensity = on ? I.hemi0 * 2.2 : I.hemi0;
    if (t >= 6.0) { I.out = true; if (typeof AC !== 'undefined' && AC) { tone('sawtooth', 90, 35, 0.5, 0.25); [0.6, 0.95, 1.5].forEach(d => setTimeout(() => tone('square', 560, 380, 0.11, 0.07), d * 1000)); } }
  }
  // cámara por tomas
  if (t < 8.8) {                       // 1 y 2: el barrio desde arriba, girando despacio
    const a = 0.6 + t * 0.06; c.position.set(Math.sin(a) * 42, 30 - t * 0.6, Math.cos(a) * 42); c.lookAt(0, 0, 0);
  } else if (t < 14.2) {               // 3: la calle a oscuras, por el Pasaje hacia el fuego
    const u = (t - 8.8) / 5.4; c.position.set(1.2 - u * 2.5, 2.4 - u * 0.4, 6 + u * 24); c.lookAt(-4.5, 1.3, 30 + u * 9);
  } else if (t < 21.0) {               // 4: Rubén sale de su casa
    const u = Math.min(1, (t - 14.6) / 2.4);
    if (P && u > 0) { const x = -7.4 + u * 2.8; P.curSpeed = u < 1 ? 1.2 : 0; P.pos.set(x, 0, 26.5); P.facing = Math.PI / 2; P.root.visible = true; }
    c.position.set(-0.8, 1.9, 23.6); c.lookAt(-5.2, 1.35, 26.6);
  } else {                             // 5: primer plano
    const u = Math.min(1, (t - 21) / 4); if (P) { P.curSpeed = 0; P.facing = Math.PI / 2 + 0.25; }
    c.position.set(-2.0 - u * 0.25, 2.05, 27.4 - u * 0.2); c.lookAt(-4.6, 1.95, 26.5);   // a la altura de la cara
    if (t > 23.6 && !I.title) { I.title = true; banner('UNA NOCHE SIN LUZ', 'Modo historia · Guerra de Vecinos', 'round'); }
  }
  if (t >= INTRO_DUR) histIntroEnd();
}
{
  // en la intro Rubén no se maneja
  const baseHC2 = humanControl;
  humanControl = function (p, c) { if (HIST.cine) { p.moveX = p.moveZ = 0; return; } return baseHC2(p, c); };
  const baseStep = step;
  step = function (rdt, render) {
    if (HIST.cine) { if (PR('Enter') || PR('Escape') || PR('Space')) { histIntroEnd(); return baseStep(rdt, render); } }
    if (HIST.cine && gameState === 'historia') histIntroUpdate(Math.min(0.05, rdt || 0.016));   // la cámara se mueve antes de que se dibuje el cuadro
    baseStep(rdt, render);
    if (HIST.cine) { for (const id of ['baArrow', 'baMap', 'histPrompt']) { const e = document.getElementById(id); if (e) e.classList.add('hidden'); } HIST.marks.forEach(m => { m.label.style.display = 'none'; }); }
  };
  // la primera vez, en lugar del prólogo de textos va la cinemática
  histStart = function () {
    histLoad();
    document.getElementById('menu').classList.add('hidden');
    histEnterHub();
    if (!HIST.prog.prologo) histIntroStart();
  };
}
window.GV_INTRO = { start: histIntroStart, end: histIntroEnd };
if (window.GV_HIST) GV_HIST.start = histStart;   // las pruebas usan esta entrada
