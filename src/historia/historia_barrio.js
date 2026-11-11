// ============================================================
// MODO HISTORIA — EL BARRIO PARA RECORRER
// Rubén camina libre por la plaza (estado 'historia', sin rivales ni reloj). Los compañeros esperan en
// distintos puntos con una luz en el piso; se habla con E. Cada misión arranca un partido con la banda
// y el mapa que corresponde; al terminar se vuelve al barrio. El progreso se guarda en el navegador.
// ============================================================
const HIST = { on: false, active: null, mates: [], marks: [], talk: null, prog: null, ui: {} };
const HIST_KEY = 'gv_historia_v1';
function histLoad() {
  try { HIST.prog = JSON.parse(localStorage.getItem(HIST_KEY)) || null; } catch (e) { HIST.prog = null; }
  if (!HIST.prog) HIST.prog = { hechas: [], plata: 0, respeto: 0, prologo: false, pendiente: null };
  return HIST.prog;
}
function histSave() { try { localStorage.setItem(HIST_KEY, JSON.stringify(HIST.prog)); } catch (e) { } }
function histMission(id) { return HISTORIA.misiones.find(m => m.id === id); }
function histAvailable(m) {   // en orden: una misión se habilita cuando la anterior está hecha
  const i = HISTORIA.misiones.indexOf(m);
  return !m.bloqueada && (i === 0 || HIST.prog.hechas.includes(HISTORIA.misiones[i - 1].id));
}
function histFree(x, z) {   // corre el punto si cae adentro de un obstáculo
  const hit = (px, pz) => obstacles.some(o => px > o.minX - 0.6 && px < o.maxX + 0.6 && pz > o.minZ - 0.6 && pz < o.maxZ + 0.6);
  if (!hit(x, z)) return [x, z];
  for (let r = 0.8; r < 8; r += 0.8) for (let a = 0; a < 6.28; a += 0.5) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (!hit(px, pz)) return [px, pz]; }
  return [x, z];
}
// ---------- interfaz: objetivo, cartel de "E: hablar", diálogo, prólogo ----------
(function histUI() {
  const st = document.createElement('style');
  st.textContent = `
  #histObj{position:fixed;left:18px;top:16px;z-index:12;background:rgba(8,8,12,.82);border:3px solid #000;border-left:6px solid #e8d27a;padding:10px 14px;max-width:360px;transform:skew(-4deg);box-shadow:4px 4px 0 #000}
  #histObj .t{font:20px Impact,'Arial Black',sans-serif;letter-spacing:2px;color:#e8d27a}
  #histObj .s{font-size:13px;margin-top:4px;line-height:1.35}
  #histObj .p{font-size:12px;margin-top:6px;opacity:.8}
  #histPrompt{position:fixed;left:50%;bottom:16%;transform:translateX(-50%);z-index:12;font:22px Impact,'Arial Black',sans-serif;letter-spacing:2px;color:#fff;text-shadow:2px 2px 0 #000;background:rgba(0,0,0,.55);padding:6px 16px;border:2px solid #000}
  #histPrompt b{color:#e8d27a}
  #histTalk{position:fixed;left:8%;right:8%;bottom:6%;z-index:40;background:#f4efe0;color:#111;border:5px solid #000;box-shadow:10px 10px 0 #000;padding:14px 22px 16px;background-image:radial-gradient(rgba(0,0,0,.1) 1.2px,transparent 1.4px);background-size:7px 7px}
  #histTalk .n{font:26px Impact,'Arial Black',sans-serif;letter-spacing:2px;color:#c0300f}
  #histTalk .n.r{color:#2a4a9a}
  #histTalk .x{font:bold 19px 'Segoe UI',Arial,sans-serif;margin-top:6px;line-height:1.35;min-height:52px}
  #histTalk .h{font-size:12px;opacity:.6;margin-top:6px;text-align:right}
  #histTalk .ch{display:flex;gap:14px;justify-content:center;margin-top:10px}
  #histTalk .ch button{font-size:20px;padding:8px 22px}
  #histPro{position:fixed;inset:0;z-index:45;background:#05060a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8%}
  #histPro .t{font:64px Impact,'Arial Black',sans-serif;color:#ff5a1a;letter-spacing:3px;text-shadow:4px 4px 0 #000;transform:skewX(-8deg);text-align:center}
  #histPro .x{font:22px 'Segoe UI',Arial,sans-serif;margin-top:28px;max-width:820px;text-align:center;line-height:1.5;min-height:100px;color:#f4efe0}
  #histPro .h{font-size:13px;opacity:.6;margin-top:24px}
  #histBtn{background:#2a4a9a!important;color:#fff!important;margin:10px 8px 0!important}
  `;
  document.head.appendChild(st);
  const mk = (id, html) => { const d = document.createElement('div'); d.id = id; d.className = 'hidden'; d.innerHTML = html; document.body.appendChild(d); return d; };
  HIST.ui.obj = mk('histObj', '<div class="t"></div><div class="s"></div><div class="p"></div>');
  HIST.ui.prompt = mk('histPrompt', '');
  HIST.ui.talk = mk('histTalk', '<div class="n"></div><div class="x"></div><div class="ch"></div><div class="h">ENTER / E: seguir</div>');
  HIST.ui.pro = mk('histPro', '<div class="t"></div><div class="x"></div><div class="h">ENTER: seguir · ESC: saltar</div>');
  // botón en el menú
  const start = document.getElementById('startBtn');
  if (start) { const b = document.createElement('button'); b.id = 'histBtn'; b.textContent = '📖 MODO HISTORIA'; start.insertAdjacentElement('afterend', b); b.onclick = () => { initAudio(); histStart(); }; }
  // botón "volver al barrio" en la pantalla final
  const again = document.getElementById('againBtn');
  if (again) { const b = document.createElement('button'); b.id = 'histBack'; b.className = 'hidden'; b.textContent = 'VOLVER AL BARRIO'; again.parentNode.appendChild(b); b.onclick = () => { document.getElementById('endScreen').classList.add('hidden'); histEnterHub(); }; HIST.ui.back = b; }
})();
function histObjective() {
  const p = HIST.prog, next = HISTORIA.misiones.find(m => histAvailable(m) && !p.hechas.includes(m.id));
  const o = HIST.ui.obj; o.querySelector('.t').textContent = HISTORIA.titulo;
  if (next) { const who = ROSTER_ORIG[0][next.quien].name; o.querySelector('.s').innerHTML = `Buscá a <b>${who}</b> en la cuadra.<br>${next.resumen}`; }
  else o.querySelector('.s').textContent = 'Por esta noche no hay más misiones. Cacho prepara la pesca (próximamente).';
  o.querySelector('.p').textContent = `Plata: $${p.plata} · Respeto: ${'★'.repeat(p.respeto) || '—'} · Misiones: ${p.hechas.length}/${HISTORIA.misiones.filter(m => !m.bloqueada).length}`;
}
// ---------- prólogo ----------
function histPrologue(done) {
  const el = HIST.ui.pro; el.classList.remove('hidden'); el.querySelector('.t').textContent = HISTORIA.titulo;
  let i = 0; const show = () => { el.querySelector('.x').textContent = HISTORIA.prologo[i]; };
  show();
  HIST.proStep = (skip) => { i++; if (skip || i >= HISTORIA.prologo.length) { el.classList.add('hidden'); HIST.proStep = null; HIST.prog.prologo = true; histSave(); done(); } else show(); };
}
// ---------- diálogo ----------
function histDialog(lines, choice, onEnd) {
  const el = HIST.ui.talk; el.classList.remove('hidden'); let i = 0;
  const ch = el.querySelector('.ch'), hint = el.querySelector('.h');
  const show = () => {
    const [who, text] = lines[i]; const n = el.querySelector('.n'); n.textContent = who.toUpperCase(); n.className = 'n' + (who === 'Rubén' ? ' r' : '');
    el.querySelector('.x').textContent = text; ch.innerHTML = ''; hint.style.display = '';
    if (i === lines.length - 1 && choice) {
      hint.style.display = 'none';
      for (const [label, fn] of choice) { const b = document.createElement('button'); b.textContent = label; b.onclick = () => { histCloseTalk(); fn(); }; ch.appendChild(b); }
    }
  };
  HIST.talk = { next: () => { if (i === lines.length - 1) { if (choice) return; histCloseTalk(); if (onEnd) onEnd(); return; } i++; show(); }, choice };
  show();
}
function histCloseTalk() { HIST.ui.talk.classList.add('hidden'); HIST.talk = null; }
// ---------- entrar y salir del barrio ----------
function histStart() {
  histLoad();
  document.getElementById('menu').classList.add('hidden');
  if (!HIST.prog.prologo) histPrologue(() => histEnterHub()); else histEnterHub();
}
function histClearHub() {
  for (const n of HIST.mates) if (n.body) n.body.destroy();
  HIST.mates.length = 0;
  for (const m of HIST.marks) { if (m.g.parent) m.g.parent.remove(m.g); if (m.label) m.label.remove(); }
  HIST.marks.length = 0;
}
function histEnterHub() {
  HIST.on = true; HIST.active = null; CUR_MAP = 'plaza';
  const ms = document.getElementById('mapSel'); if (ms) ms.value = 'plaza';
  clearRound(); histClearHub(); buildCalle(); setScene(CALLE.scene);   // el barrio para caminar es la calle; la plaza queda para pelear
  for (const id of ['hud', 'endScreen', 'prep', 'menu']) { const e = document.getElementById(id); if (e) e.classList.add('hidden'); }
  if (HIST.ui.back) HIST.ui.back.classList.add('hidden');
  teamSel = ['original', 'original']; applyTeams();
  // Rubén
  const [sx, sz] = histFree(-33, 0);
  const rub = new Fighter(0, 0, ROSTER_ORIG[0][0], 1); rub.pos.set(sx, 0, sz); rub.facing = Math.PI / 2; rub.root.position.copy(rub.pos);
  fighters.push(rub); player = rub; if (rub.label) rub.label.style.display = 'none';   // en el barrio no hace falta su cartel
  // compañeros, cada uno en su lugar con una luz en el piso
  for (const m of HISTORIA.misiones) {
    const cfg = Object.assign({}, ROSTER_ORIG[0][m.quien]); const [x, z] = histFree(m.donde[0], m.donde[1]);
    const w = new Walker(cfg); w.body.pos.set(x, 0, z); w.body.root.position.copy(w.body.pos); w.mission = m; HIST.mates.push(w);
    const done = HIST.prog.hechas.includes(m.id), avail = histAvailable(m) && !done;
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const col = m.bloqueada ? 0x8a8a8a : done ? 0x5aff8a : 0xffcf3a;
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; g.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 7, 20, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: avail ? 0.16 : 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 3.5; g.add(beam); scene.add(g);
    const label = document.createElement('div'); label.style.cssText = 'position:fixed;z-index:11;pointer-events:none;font:16px Impact,Arial Black,sans-serif;letter-spacing:1px;color:#fff;text-shadow:2px 2px 0 #000;text-align:center;transform:translate(-50%,-100%);white-space:nowrap';
    label.innerHTML = `${cfg.name.toUpperCase()}<br><span style="font-size:12px;color:${m.bloqueada ? '#aaa' : done ? '#7aff9a' : '#ffcf3a'}">${m.bloqueada ? 'PRÓXIMAMENTE' : done ? '✔ ' + m.nombre : avail ? m.nombre : '🔒'}</span>`;
    document.body.appendChild(label);
    HIST.marks.push({ g, ring, beam, label, mate: w, m, x, z, avail, done });
  }
  HIST.ui.obj.classList.remove('hidden'); histObjective();
  gameState = 'historia';
  // si se vuelve de una misión, el compañero cuenta lo que pasó
  const pend = HIST.prog.pendiente; HIST.prog.pendiente = null; histSave();
  if (pend) { const m = histMission(pend); if (m && m.despues) histDialog(m.despues, null, () => { if (HISTORIA.misiones.filter(x => !x.bloqueada).every(x => HIST.prog.hechas.includes(x.id))) histDialog(HISTORIA.final, null, null); }); }
}
function histLaunch(m) {
  HIST.ui.obj.classList.add('hidden'); HIST.ui.prompt.classList.add('hidden');
  histClearHub(); HIST.on = false; HIST.active = m;
  teamSel = ['original', m.rival]; CUR_MAP = m.mapa;
  const ms = document.getElementById('mapSel'); if (ms) ms.value = m.mapa;
  banner(m.nombre, m.resumen, 'round');
  startMatch(m.tam);
}
// al terminar el partido de una misión: título de misión, premio y "volver al barrio"
{
  const baseEnd = endMatch;
  endMatch = function () {
    baseEnd();
    const m = HIST.active; if (!m) return;
    const won = score[0] >= 2, t = document.getElementById('endTitle'), s = document.getElementById('endSub');
    if (won) {
      if (!HIST.prog.hechas.includes(m.id)) { HIST.prog.hechas.push(m.id); HIST.prog.plata += m.premio.plata; HIST.prog.respeto += m.premio.respeto; }
      HIST.prog.pendiente = m.id; histSave();
      t.textContent = 'MISIÓN CUMPLIDA: ' + m.nombre; t.className = 'blueTxt';
      s.textContent = `Resultado ${score[0]} - ${score[1]} · +$${m.premio.plata} · +${'★'.repeat(m.premio.respeto)} respeto`;
    } else { t.textContent = 'LA NOCHE SE COMPLICÓ'; t.className = 'redTxt'; s.textContent = `Resultado ${score[0]} - ${score[1]} · Probá de nuevo con REVANCHA, o volvé al barrio.`; }
    if (HIST.ui.back) HIST.ui.back.classList.remove('hidden');
    HIST.active = won ? null : m;
  };
  // si desde la pantalla final se va al menú, se sale del modo historia
  const mb = document.getElementById('menuBtn'); if (mb) mb.addEventListener('click', () => { HIST.on = false; HIST.active = null; histClearHub(); HIST.ui.obj.classList.add('hidden'); HIST.ui.prompt.classList.add('hidden'); if (HIST.ui.back) HIST.ui.back.classList.add('hidden'); });
}
// ---------- cada cuadro en el barrio ----------
{
  const baseStep = step;
  step = function (rdt, render) {
    // prólogo y diálogos: Enter / E avanzan, Esc salta el prólogo
    if (HIST.proStep) { if (PR('Enter') || PR('Space')) HIST.proStep(false); else if (PR('Escape')) HIST.proStep(true); for (const k in pressed) delete pressed[k]; if (render !== false) renderFrame(rdt); return; }
    if (HIST.talk) { if (!HIST.talk.choice || true) { if (PR('Enter') || PR('KeyE') || PR('Space')) HIST.talk.next(); } for (const k in pressed) delete pressed[k]; if (render !== false) renderFrame(rdt); return; }
    baseStep(rdt, render);
    if (gameState !== 'historia' || !HIST.on) { for (const mk of HIST.marks) mk.label.style.display = 'none'; return; }   // los carteles del barrio nunca fuera del barrio
    const P = player; if (!P) return;
    // compañeros: respiran y miran a Rubén cuando se acerca
    let near = null, nd = 2.4;
    for (const mk of HIST.marks) {
      const b = mk.mate.body, d = Math.hypot(P.pos.x - mk.x, P.pos.z - mk.z);
      if (d < 7) mk.mate.face(P.pos.x, P.pos.z, rdt * 3);
      b.curSpeed = 0; b.root.position.copy(b.pos); b.animate(rdt);
      mk.ring.material.opacity = 0.55 + Math.sin(performance.now() / 300) * 0.25;
      if (d < nd) { nd = d; near = mk; }
      // etiqueta flotante sobre la cabeza
      const v = new THREE.Vector3(mk.x, 2.6, mk.z).project(camera);
      if (v.z < 1 && v.z > -1 && d < 25) { /* sólo los cercanos: los lejanos se amontonaban arriba */ mk.label.style.display = ''; mk.label.style.left = ((v.x + 1) / 2 * innerWidth) + 'px'; mk.label.style.top = ((1 - v.y) / 2 * innerHeight) + 'px'; } else mk.label.style.display = 'none';
    }
    const pr = HIST.ui.prompt;
    if (near) { pr.classList.remove('hidden'); pr.innerHTML = `<b>E</b> HABLAR CON ${near.mate.body.cfg.name.toUpperCase()}`; } else pr.classList.add('hidden');
    if (near && PR('KeyE') === false) { }
    if (near && HIST.wantTalk) {
      HIST.wantTalk = false; pr.classList.add('hidden');
      const m = near.m;
      if (m.bloqueada) histDialog(m.antes, null, null);
      else if (near.done) histDialog(m.despues || [[near.mate.body.cfg.name, '¡Qué noche, Rubén!']], null, null);
      else if (!near.avail) histDialog([[near.mate.body.cfg.name, 'Ahora no, Rubén. Primero arreglá lo otro.']], null, null);
      else histDialog(m.antes, [['¡VAMOS! · ' + m.nombre, () => histLaunch(m)], ['TODAVÍA NO', () => { }]], null);
    }
    HIST.wantTalk = false;
  };
  // la E se lee antes de que el paso del juego la consuma (en el barrio no hay nada para levantar)
  addEventListener('keydown', e => { if (e.code === 'KeyE' && gameState === 'historia' && HIST.on && !HIST.talk) HIST.wantTalk = true; });
}
window.GV_HIST = { HIST, testWin: () => { score[0] = 2; score[1] = 0; endMatch(); }, start: histStart, enterHub: histEnterHub, launch: id => histLaunch(histMission(id)), reset: () => { localStorage.removeItem(HIST_KEY); histLoad(); } };
// cámara del barrio: detrás y arriba de Rubén, lo sigue suave (la cámara de pelea no conoce este estado)
{
  const baseCam = updateCamera, hcPos = new THREE.Vector3(), hcLook = new THREE.Vector3(); let hcInit = false;
  updateCamera = function (dt) {
    if (window.__camLock || gameState !== 'historia' || !player) { hcInit = false; return baseCam(dt); }
    const P = player, back = 6.2, up = 3.6;
    const want = new THREE.Vector3(P.pos.x - Math.sin(P.facing) * back, up, P.pos.z - Math.cos(P.facing) * back);
    const look = new THREE.Vector3(P.pos.x + Math.sin(P.facing) * 2, 1.3, P.pos.z + Math.cos(P.facing) * 2);
    if (!hcInit) { hcPos.copy(want); hcLook.copy(look); hcInit = true; }
    const k = 1 - Math.exp(-dt * 3.2); hcPos.lerp(want, k); hcLook.lerp(look, k);
    camera.position.copy(hcPos); camera.lookAt(hcLook);
  };
}
