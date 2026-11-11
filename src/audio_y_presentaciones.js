// v9: MÚSICA — cumbia-rock de barrio generada en vivo (sin archivos). Progresión Am-G-F-E.
// 3 niveles: tranquila (menú/casa), con todo (pelea), a pleno (últimos 30 s, mano a mano, furia).
// Se corta con la policía. Tecla M: silencio.
// ============================================================
const MUS = { on: true, gain: null, step: 0, next: 0, bpm: 98, level: 0, timer: null };
const CHORDS = [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function startMusic() {
  if (!AC || MUS.gain) return;
  MUS.gain = AC.createGain(); MUS.gain.gain.value = 0; MUS.gain.connect(master);
  MUS.next = AC.currentTime + 0.1; MUS.timer = setInterval(schedMusic, 25);
}
function mnote(type, f, t, dur, vol, cut) {
  const o = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
  o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cut || 2000;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(fl); fl.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + dur + 0.05);
}
function mnoise(t, dur, vol, f, type) {
  const s = AC.createBufferSource(); s.buffer = noiseBuf;
  const fl = AC.createBiquadFilter(); fl.type = type || 'highpass'; fl.frequency.value = f;
  const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(MUS.gain); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
function mkick(t, v) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + 0.3);
}
function schedMusic() {
  if (!AC || !MUS.gain) return;
  const spb = 60 / MUS.bpm / 4;      // semicorchea
  while (MUS.next < AC.currentTime + 0.15) { playStep(MUS.step, MUS.next); MUS.next += spb; MUS.step = (MUS.step + 1) % 64; }
}
function playStep(st, t) {
  const L = MUS.level, bar = Math.floor(st / 16), s = st % 16, ch = CHORDS[bar];
  if (s % 2 === 0) mnoise(t, s % 4 === 2 ? 0.09 : 0.04, 0.045 + 0.03 * L, 5500);                         // güiro
  if (L >= 1) {
    if (s === 0 || s === 8 || (L >= 2 && (s === 10 || s === 14))) mkick(t, 0.5);                        // bombo
    if (s === 4 || s === 12) mnoise(t, 0.14, 0.2, 1800, 'bandpass');                                    // redoblante / palmas
    if (L >= 2 && s % 2 === 1) mnoise(t, 0.03, 0.03, 8000);                                               // hi-hat
  }
  const root = ch[0] - 24, bp = { 0: root, 6: root + 7, 8: root, 12: root + 7, 14: root + 5 };
  if (bp[s] !== undefined) mnote('triangle', mtof(bp[s]), t, 0.22, 0.2, 650);                          // bajo cumbiero
  if (s % 4 === 2) for (const n of ch) mnote('sawtooth', mtof(n), t, 0.12, 0.028 + 0.014 * L, 1400 + L * 700);   // teclado a contratiempo
  if (L >= 2) {                                                                                           // punteo
    const riff = [0, null, 3, null, 5, 7, null, 5, 3, null, 0, null, -2, null, 0, null], r = riff[s];
    if (r !== null) mnote('square', mtof(ch[0] + 12 + r), t, 0.11, 0.032, 2600);
  }
}
function updateMusic() {
  if (!MUS.gain) return;
  let L = 0;
  if (gameState === 'fight' || gameState === 'roundEnd' || gameState === 'intro') {
    L = 1; if ((typeof roundClock !== 'undefined' && roundClock < 30 && gameState === 'fight') || (typeof duel !== 'undefined' && duel) || (player && player.rageTime > 0)) L = 2;
  }
  const police = gameState === 'police';
  MUS.level = L; MUS.bpm = L >= 2 ? 106 : 98;
  const vol = !MUS.on || police ? 0 : L === 0 ? 0.3 : 0.45;
  MUS.gain.gain.setTargetAtTime(vol, AC.currentTime, police ? 0.08 : 0.5);
}
window.addEventListener('keydown', e => {
  if(e.code==='KeyQ' && typeof player!=='undefined' && player && gameState==='fight' && player.alive && player.state==='idle') player.startAttack('flyingkick15'); if (e.code === 'KeyM') MUS.on = !MUS.on; });

// ============================================================
// v10: CARAS Y MANOS MÁS HUMANAS + PRESENTACIÓN DE LAS BANDAS
// ============================================================
// piel con poros sutiles (relieve), compartida por todos
const SKIN_BUMP = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) { const v = Math.random() < 0.5 ? 60 : 200; g.fillStyle = `rgba(${v},${v},${v},${rand(0.05, 0.2)})`; g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(0.4, 1.4), 0, 7); g.fill(); }
});
SKIN_BUMP.encoding = THREE.LinearEncoding;
const EYE_COLORS = [0x4a2e1a, 0x3a2414, 0x5a3a1e, 0x2e4a3a, 0x3a5a7a, 0x2a1a10];
const hashName = n => { let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

// ---------- cara: nariz, labios, ojos con párpados, pómulos ----------
Fighter.prototype.refineFace = function () {
  const c = this.cfg, H = this.head, S = this.skinMat;
  if (S.bumpMap !== SKIN_BUMP) { S.bumpMap = SKIN_BUMP; S.bumpScale = 0.0025; S.needsUpdate = true; }
  const lipC = new THREE.Color(c.skin).lerp(new THREE.Color(0x9a4a42), 0.4);
  const lipM = uniqueMat(lipC.getHex(), { roughness: 0.45 });
  // nariz: puente, punta y aletas
  sph(0.017, 0.04, 0.02, S, 0, 0.152, 0.15, H, false);
  sph(0.024, 0.021, 0.022, S, 0, 0.106, 0.166, H, false);
  for (const s of [-1, 1]) sph(0.016, 0.012, 0.014, S, s * 0.021, 0.102, 0.153, H, false);
  // labios y boca (la boca se abre al hablar, al gritar y al recibir)
  const up = sph(0.048, 0.011, 0.013, lipM, 0, 0.077, 0.145, H, false);
  const gap = sph(0.038, 0.004, 0.006, mat(0x2a1210), 0, 0.069, 0.15, H, false);
  const low = sph(0.044, 0.013, 0.014, lipM, 0, 0.061, 0.141, H, false);
  this.mouth = { up, gap, low, y0: low.position.y, open: 0 };
  // pómulos y mentón
  for (const s of [-1, 1]) sph(0.03, 0.016, 0.014, S, s * 0.074, 0.13, 0.112, H, false);   // pómulos (sutiles)
  for (const o of H.children) if (o.isMesh && o.geometry === SPH && Math.abs(o.position.y - 0.12) < 0.002 && Math.abs(o.position.z - 0.152) < 0.002) o.scale.multiplyScalar(0.78);   // nariz vieja más chica
  sph(0.04, 0.03, 0.028, S, 0, 0.03, 0.12, H, false);
  // ojos con iris y párpados
  const iris = mat(EYE_COLORS[hashName(c.name || 'x') % EYE_COLORS.length], { roughness: 0.25 });
  this.lids = [];
  for (const s of [-1, 1]) {
    sph(0.0115, 0.0115, 0.006, iris, s * 0.055, 0.165, 0.146, H, false);
    sph(0.0055, 0.0055, 0.004, mat(0x050505, { roughness: 0.1 }), s * 0.055, 0.165, 0.1505, H, false);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), S);
    lid.position.set(s * 0.055, 0.166, 0.136); lid.scale.set(0.028, 0.012, 0.016); lid.rotation.x = 0.35; H.add(lid);
    this.lids.push(lid);
  }
  this.blinkT = rand(1, 4);
};
// ---------- puño: palma, nudillos, dedos doblados y pulgar ----------
Fighter.prototype.refineHands = function () {
  for (let i = 0; i < 2; i++) {
    const el = this.elbows[i], s = i === 0 ? -1 : 1, S = this.skinMat;
    for (const o of el.children) if (o.isMesh && Math.abs(o.position.y + 0.3) < 0.01 && o.geometry === SPH) o.visible = false;   // el puño-esfera viejo
    sph(0.046, 0.052, 0.04, S, 0, -0.29, 0.0, el);                                    // palma
    sph(0.045, 0.019, 0.026, S, 0, -0.325, 0.03, el, false);                           // dedos doblados
    for (let k = 0; k < 4; k++) sph(0.013, 0.012, 0.014, S, -0.03 + k * 0.02, -0.336, 0.026, el, false);   // nudillos
    const th = sph(0.014, 0.03, 0.014, S, -s * 0.036, -0.305, 0.03, el, false); th.rotation.z = s * 0.5;   // pulgar
  }
};
// ---------- cuello y brazos: trapecios y bíceps ----------
Fighter.prototype.refineBody = function () {
  const c = this.cfg, W = (c.belly ? 1.18 : c.slim ? 0.88 : c.big ? 1.12 : 1.02) * 1.06;
  const topM = c.top === 'remera' || c.top === 'musculosa' ? this.shirtMat : this.skinMat;
  for (const s of [-1, 1]) { const t = sph(0.1 * W, 0.045, 0.07, topM, s * 0.13 * W, 0.605, -0.01, this.torso, false); t.rotation.z = -s * 0.38; }
  for (let i = 0; i < 2; i++) sph(0.05 * (c.big ? 1.2 : 1), 0.085, 0.048, this.skinMat, 0, -0.13, 0.018, this.arms[i], false);
};
// parpadeo y boca
{
  const basePost = Fighter.prototype.postPose;
  Fighter.prototype.postPose = function (P, dt) {
    if (basePost) basePost.call(this, P, dt);
    if (this.lids) {
      this.blinkT -= dt;
      const ko = this.state === 'ko' || (this.state === 'down' && this.stateTime > 0.5 && this.hp <= 0);
      let closed = ko ? 1 : 0;
      if (this.blinkT < 0) { closed = Math.max(closed, 1 - Math.abs(this.blinkT + 0.07) / 0.07); if (this.blinkT < -0.14) this.blinkT = rand(2, 5.5); }
      if (this.flash > 0) closed = Math.max(closed, 0.8);   // cierra los ojos al recibir
      for (const l of this.lids) { l.scale.y = 0.012 + closed * 0.012; l.rotation.x = 0.35 - closed * 0.9; }
    }
    if (this.mouth) {
      const talk = this.barkT > 0 ? 0.5 + 0.5 * Math.sin(this.idleT * 22) : 0;
      const yell = this.hypeT > 0 ? 1 : this.rageTime > 0 && this.state === 'attack' ? 0.8 : this.flash > 0 ? 0.7 : 0;
      const target = Math.max(talk * 0.6, yell);
      this.mouth.open += (target - this.mouth.open) * Math.min(1, dt * 18);
      const o = this.mouth.open;
      this.mouth.low.position.y = this.mouth.y0 - 0.014 * o; this.mouth.gap.scale.y = 0.004 + 0.016 * o;
      this.mouth.gap.position.y = 0.069 - 0.006 * o;
    }
  };
}

// ---------- presentación de la banda en la casa (paso al frente, pose y nombre) ----------
const INTRO = { on: false, t: 0, i: -1, card: null };
const INTRO_EACH = 1.25;
const INTRO_POSES = [
  P => { P.aL = P.aR = -1.05; P.eL = P.eR = -2.2; P.aLz = 0.75; P.aRz = -0.75; P.tX = -0.06; P.hX = -0.08; },           // capitán: brazos cruzados
  P => { P.aR = -2.8; P.eR = -0.5; P.aRz = 0.15; P.aL = -0.45; P.eL = -1.4; P.hX = -0.15; },                            // puño arriba
  P => { const b = Math.abs(Math.sin(INTRO.t * 9)); P.aL = P.aR = -0.95 - 0.2 * b; P.eL = P.eR = -2.3; P.aLz = 0.7; P.aRz = -0.7; },   // se golpea el pecho
  P => { P.aR = -1.55; P.eR = -0.1; P.aRz = 0.05; P.aL = -0.5; P.eL = -1.8; P.tY = -0.15; },                            // señala a cámara
];
function roleLabel(t, i) {
  const def = teamDefs[t];
  if (i === 0) return 'CAPITÁN';
  const R = ['', 'EL MÁS RÁPIDO', 'EL QUE AGUANTA', 'EL TÉCNICO'];
  return def ? R[i] : (STATS[ROSTER[t][i].name] && STATS[ROSTER[t][i].name].tag) || R[i];
}
function startIntro() {
  INTRO.on = true; INTRO.t = 0; INTRO.i = -1;
  prepEl.classList.add('hidden');
  if (!INTRO.card) {
    INTRO.card = document.createElement('div');
    INTRO.card.style.cssText = 'position:fixed;left:6%;bottom:12%;z-index:20;pointer-events:none;font-family:Impact,"Arial Black",sans-serif;color:#fff;text-shadow:4px 4px 0 #000;transition:opacity .2s;opacity:0';
    document.body.appendChild(INTRO.card);
    const skip = () => { if (INTRO.on) endIntro(); };
    window.addEventListener('keydown', skip); window.addEventListener('pointerdown', skip);
  }
}
function endIntro() {
  INTRO.on = false; INTRO.card.style.opacity = 0;
  const spots = [[0, 3.7], [-1.9, 2.9], [1.9, 2.9], [3.7, 2.2]];
  fighters.forEach((f, i) => { if (spots[i]) { f.pos.set(spots[i][0], 0, spots[i][1]); f.facing = -spots[i][0] * 0.06; } f.introPose = null; });
  if (gameState === 'house') prepEl.classList.remove('hidden');
}
function introUpdate(dt) {
  if (!INTRO.on) return;
  INTRO.t += dt;
  const n = Math.min(teamSize, fighters.length), i = Math.floor(INTRO.t / INTRO_EACH);
  if (i >= n) { endIntro(); return; }
  const spots = [[0, 3.7], [-1.9, 2.9], [1.9, 2.9], [3.7, 2.2]];
  if (i !== INTRO.i) {
    INTRO.i = i; const f = fighters[i], def = teamDefs[0];
    INTRO.card.innerHTML = `<div style="font-size:20px;letter-spacing:6px;color:#ffd84a">${def ? def.name : 'VEREDA PAR'}</div>` +
      `<div style="font-size:clamp(34px,6vw,64px);letter-spacing:3px;line-height:1">${f.name.toUpperCase()}</div>` +
      `<div style="font-size:22px;letter-spacing:4px;color:#e8e2d0">${roleLabel(0, i)}</div>`;
    INTRO.card.style.opacity = 1;
    sfx('thud', 0.6);
    fighters.forEach((g, k) => { g.introPose = k === i ? INTRO_POSES[i % INTRO_POSES.length] : null; });
  }
  // el que se presenta da un paso al frente
  fighters.forEach((g, k) => {
    if (!spots[k]) return;
    const fwd = k === i ? smooth(clamp((INTRO.t - i * INTRO_EACH) / 0.35, 0, 1)) * 0.7 : 0;
    g.pos.set(spots[k][0], 0, spots[k][1] + fwd); g.facing = -spots[k][0] * 0.06;
  });
}
function introCam() {
  if (!INTRO.on || INTRO.i < 0) return false;
  const f = fighters[INTRO.i]; if (!f) return false;
  const u = smooth(clamp((INTRO.t - INTRO.i * INTRO_EACH) / 0.5, 0, 1));
  camera.position.set(f.pos.x + 0.55 - 0.15 * u, 1.75 - 0.05 * u, f.pos.z + 2.9 - 0.5 * u);
  camera.lookAt(f.pos.x, 1.55, f.pos.z); return true;
}
{
  const basePost = Fighter.prototype.postPose;
  Fighter.prototype.postPose = function (P, dt) {
    if (basePost) basePost.call(this, P, dt);
    if (this.introPose && gameState === 'house') this.introPose(P);
  };
}
// ---------- placa "BANDA A vs BANDA B" al salir a la plaza ----------
function showVS() {
  let el = document.getElementById('vsCard');
  if (!el) {
    el = document.createElement('div'); el.id = 'vsCard';
    el.style.cssText = 'position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;gap:4vw;padding:0 3vw;pointer-events:none;font-family:Impact,"Arial Black",sans-serif;color:#fff;text-shadow:4px 4px 0 #000;background:linear-gradient(90deg,rgba(20,40,90,.55),rgba(0,0,0,.2) 50%,rgba(110,20,10,.55));transition:opacity .4s;opacity:0';
    document.body.appendChild(el);
  }
  const col = (t) => `<div style="text-align:${t ? 'left' : 'right'}"><div style="font-size:clamp(22px,4.6vw,56px);letter-spacing:2px">${teamDefs[t] ? teamDefs[t].name : 'LA ' + TEAM_NAMES[t]}</div>` +
    ROSTER[t].slice(0, teamSize).map((m, i) => `<div style="font-size:clamp(13px,1.8vw,22px);letter-spacing:3px;color:${i ? '#e8e2d0' : '#ffd84a'}">${i ? '' : '★ '}${m.name.toUpperCase()}</div>`).join('') + '</div>';
  el.innerHTML = col(0) + '<div style="font-size:clamp(40px,7vw,90px);color:#ffd84a">VS</div>' + col(1);
  el.style.opacity = 1; sfx('thud', 0.8);
  clearTimeout(showVS.t); showVS.t = setTimeout(() => { el.style.opacity = 0; }, 2600);
}

// ============================================================
// v11: CUERPOS ESCULPIDOS — cada cilindro del cuerpo se reemplaza por una forma de una sola pieza
// (torso con pecho/cintura/hombros, brazos con deltoide/bíceps/antebrazo, piernas con cuádriceps/rodilla/
// pantorrilla, cráneo con mandíbula/mentón/pómulos/arco de cejas). Mismos materiales y mismos huesos:
// las animaciones y la ropa de cada banda no cambian. + trama de tela y arrugas.
// ============================================================
const gauss = (x, w) => Math.exp(-(x * x) / (w * w));
// perfil (0 = arriba, 1 = abajo) → radio relativo; bumps = [{y, w, a, ang, p}] bultos según el ángulo (0 = adelante)
function sculptLathe(h, r0, r1, prof, bumps, seg) {
  const pts = [], N = 22;
  // de abajo hacia arriba: así LatheGeometry arma las caras hacia afuera (al revés se ve el interior)
  for (let i = N; i >= 0; i--) { const t = i / N; const base = lerp(r0, r1, t) * prof(t); pts.push(new THREE.Vector2(Math.max(0.0005, base), h / 2 - t * h)); }
  const g = new THREE.LatheGeometry(pts, seg || 28);
  if (!(bumps && bumps.length)) g.computeVertexNormals();
  if (bumps && bumps.length) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z); if (r < 1e-5) continue;
      const t = (h / 2 - y) / h, ang = Math.atan2(x, z); let k = 0;
      for (const b of bumps) { const da = Math.atan2(Math.sin(ang - b.ang), Math.cos(ang - b.ang)); k += b.a * gauss(t - b.y, b.w) * Math.pow(Math.max(0, Math.cos(da)), b.p || 2); }
      p.setX(i, x * (1 + k)); p.setZ(i, z * (1 + k));
    }
    g.computeVertexNormals();
  }
  return g;
}
const PROF = {
  thigh: t => 1.0 + 0.05 * gauss(t - 0.25, 0.25) - 0.05 * t * t,
  shin: t => 0.96 + 0.1 * gauss(t - 0.3, 0.2) - 0.12 * Math.pow(t, 3) + 0.03 * gauss(t, 0.06),
  upper: t => 1.0 + 0.06 * gauss(t - 0.15, 0.15) - 0.06 * t,
  fore: t => 1.0 + 0.06 * gauss(t - 0.22, 0.2) - 0.08 * t * t,
  sleeve: t => 1.14 + 0.05 * t,   // holgada: cubre el bíceps
  torso: t => {   // t=0 base del cuello (arriba) → t=1 cintura
    const neck = 0.5 + 0.5 * smooth(clamp(t / 0.09, 0, 1));      // caída del hombro hacia el cuello
    const chest = 1 + 0.06 * gauss(t - 0.3, 0.16);
    const waist = 1 - 0.13 * gauss(t - 0.8, 0.18);
    return neck * chest * waist;
  },
  pelvis: t => 1.0 + 0.04 * gauss(t - 0.5, 0.3),
};
const BUMPS = {
  thigh: [{ y: 0.35, w: 0.25, a: 0.09, ang: 0, p: 2 }, { y: 0.25, w: 0.3, a: 0.05, ang: Math.PI, p: 2 }],           // cuádriceps / isquios
  shin: [{ y: 0.3, w: 0.18, a: 0.12, ang: Math.PI, p: 2 }, { y: 0.05, w: 0.08, a: 0.02, ang: 0, p: 3 }],           // pantorrilla / rótula
  upper: [{ y: 0.5, w: 0.25, a: 0.055, ang: 0, p: 2 }, { y: 0.45, w: 0.3, a: 0.035, ang: Math.PI, p: 2 }],            // bíceps / tríceps
  fore: [{ y: 0.2, w: 0.2, a: 0.04, ang: Math.PI * 0.5, p: 2 }],
  torso: [{ y: 0.32, w: 0.14, a: 0.05, ang: 0, p: 4 }, { y: 0.3, w: 0.18, a: 0.05, ang: Math.PI, p: 3 }],         // pecho / omóplatos
  pelvis: [{ y: 0.65, w: 0.3, a: 0.12, ang: Math.PI, p: 2 }],                                                        // glúteos
};
// cráneo de una pieza: mandíbula más angosta, mentón, pómulos, arco de cejas, cuencas, nuca
let HEAD_GEO = null;
function headGeometry() {
  if (HEAD_GEO) return HEAD_GEO;
  const g = new THREE.SphereGeometry(1, 44, 32), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < -0.15) { const k = (-y - 0.15); x *= 1 - 0.32 * k; y -= 0.12 * k * k; if (z > 0) z *= 1 - 0.1 * k; }           // mandíbula
    if (z > 0.3 && y < -0.55) z += 0.12 * (-y - 0.55) * 2.2;                                                       // mentón adelante
    x *= 1 + 0.06 * gauss(y + 0.05, 0.2) * gauss(Math.abs(x) - 0.75, 0.3) * (z > 0.2 ? 1 : 0.4);                   // pómulos
    z += 0.06 * gauss(y - 0.3, 0.1) * Math.max(0, z) * gauss(Math.abs(x) - 0.35, 0.35);                          // arco de las cejas
    z -= 0.05 * gauss(y - 0.12, 0.12) * gauss(Math.abs(x) - 0.38, 0.14) * (z > 0.6 ? 1 : 0);                     // cuencas de los ojos
    if (z < 0 && y > -0.2) z *= 1.07;                                                                              // nuca
    if (y > 0.7) y = 0.7 + (y - 0.7) * 0.85;                                                                       // coronilla más plana
    if (Math.abs(x) > 0.85 && Math.abs(y) < 0.35) x *= 0.97;                                                       // sienes
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return (HEAD_GEO = g);
}
// trama de tela y arrugas (relieve). v = a lo largo del miembro: arrugas en codo y rodilla.
const FABRIC = {};
function fabricTex(kind) {
  if (FABRIC[kind]) return FABRIC[kind];
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    if (kind === 'denim') for (let i = -w; i < w * 2; i += 3) { g.strokeStyle = `rgba(255,255,255,${rand(0.12, 0.3)})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); }
    else for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { if ((x + y) % 4 === 0) { g.fillStyle = `rgba(255,255,255,${rand(0.05, 0.16)})`; g.fillRect(x, y, 1, 1); } }
    for (let i = 0; i < 9; i++) {                                                                                   // arrugas suaves
      const y = h * (kind === 'denim' ? (i < 5 ? 0.45 + i * 0.03 : rand(0, 1)) : rand(0.05, 0.95));
      const gr = g.createLinearGradient(0, y - 6, 0, y + 6); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(0,0,0,${rand(0.15, 0.3)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.save(); g.translate(w / 2, y); g.rotate(rand(-0.25, 0.25)); g.fillRect(-w, -6, w * 2, 12); g.restore();
    }
  });
  t.encoding = THREE.LinearEncoding;
  return (FABRIC[kind] = t);
}
Fighter.prototype.sculptBody = function () {
  const c = this.cfg, W = (c.belly ? 1.18 : c.slim ? 0.88 : c.big ? 1.12 : 1.02) * 1.06;
  const isCyl = (o, rt, rb, h) => o.isMesh && o.geometry.type === 'CylinderGeometry' && Math.abs(o.geometry.parameters.radiusTop - rt) < 1e-4 && Math.abs(o.geometry.parameters.radiusBottom - rb) < 1e-4 && Math.abs(o.geometry.parameters.height - h) < 1e-4;
  const swap = (o, key, rt, rb, h) => { const old = o.geometry; o.geometry = sculptLathe(h, rt, rb, PROF[key], BUMPS[key]); if (old !== o.geometry && !old._shared) old.dispose(); };
  // piernas
  for (let i = 0; i < 2; i++) {
    for (const o of this.legs[i].children) if (isCyl(o, 0.105 * W, 0.082, 0.46)) swap(o, 'thigh', 0.105 * W, 0.082, 0.46);
    for (const o of this.knees[i].children) if (isCyl(o, 0.08, 0.062, 0.44)) swap(o, 'shin', 0.08, 0.062, 0.44);
  }
  // brazos
  const ur = 0.068 * (c.big ? 1.15 : 1);
  for (let i = 0; i < 2; i++) {
    for (const o of this.arms[i].children) { if (isCyl(o, ur, 0.056, 0.3)) swap(o, 'upper', ur, 0.056, 0.3); else if (isCyl(o, 0.08, 0.072, 0.17)) swap(o, 'sleeve', 0.08, 0.072, 0.17); }
    for (const o of this.elbows[i].children) if (isCyl(o, 0.055, 0.043, 0.27)) swap(o, 'fore', 0.055, 0.043, 0.27);
  }
  // mangas de la campera: holgadas sobre el brazo esculpido
  if (c.jacket) for (let i = 0; i < 2; i++) {
    for (const o of this.arms[i].children) if (isCyl(o, 0.075, 0.066, 0.3)) { swap(o, 'sleeve', 0.075, 0.066, 0.3); o.position.y += 0.025; o.scale.y *= 1.08; }   // sube hasta el hombro
    for (const o of this.elbows[i].children) if (isCyl(o, 0.064, 0.052, 0.25)) swap(o, 'sleeve', 0.064, 0.052, 0.25);
  }
  // con campera, el hombro es de campera (antes asomaba la bola blanca de la remera)
  if (c.jacket && this.jacketMat) for (const o of this.torso.children) if (o.isMesh && o.geometry === SPH && Math.abs(o.position.y - 0.56) < 0.002 && Math.abs(Math.abs(o.position.x) - 0.245 * W) < 0.002) o.material = this.jacketMat;
  // la ropa agregada en la v8 (mangas de campera, cañas de bota, medias) se creó después del ensanche horneado
  // de brazos (×1,25) y piernas (×1,2): siempre fue más fina que el miembro que cubre. Se le aplica el mismo ensanche.
  const widen = (o, k) => { if (!o.userData.widened) { o.scale.x *= k; o.scale.z *= k; o.userData.widened = true; } };
  for (let i = 0; i < 2; i++) {
    if (c.jacket) { for (const o of this.arms[i].children) if (o.isMesh && o.material !== this.skinMat && o.material !== this.shirtMat && o.position.y < -0.05) widen(o, 1.3);
      for (const o of this.elbows[i].children) if (o.isMesh && o.material !== this.skinMat && o.geometry.type !== 'SphereGeometry') widen(o, 1.3); }
    for (const o of this.knees[i].children) if (o.isMesh && o.geometry.type === 'CylinderGeometry' && (isCyl(o, 0.078, 0.07, 0.2) || isCyl(o, 0.083, 0.068, 0.26) || isCyl(o, 0.085, 0.085, 0.04))) widen(o, 1.24);
  }
  // con campera, la manga de la remera queda adentro (antes asomaba por encima de la campera)
  if (c.jacket) for (let i = 0; i < 2; i++) for (const o of this.arms[i].children) if (o.isMesh && o.geometry.type === 'LatheGeometry' && Math.abs(o.position.y + 0.08) < 0.002) o.visible = false;
  // torso: el pecho pasa a ser el torso entero (de la cintura al cuello) y el abdomen se oculta
  for (const o of this.torso.children) {
    if (isCyl(o, 0.172 * W, 0.185 * W, 0.3)) o.visible = false;
    else if (isCyl(o, 0.24 * W, 0.18 * W, 0.36)) { o.geometry = sculptLathe(0.62, 0.255 * W, 0.18 * W, PROF.torso, BUMPS.torso, 32); o.position.y = 0.32; }
    else if (isCyl(o, 0.25 * W, 0.2 * W, 0.6)) { o.geometry = sculptLathe(0.64, 0.272 * W, 0.2 * W, PROF.torso, BUMPS.torso, 32); o.position.y = 0.32; }   // campera
  }
  // hombros de la remera: menos "pelota"
  for (const o of this.torso.children) if (o.isMesh && o.geometry === SPH && Math.abs(o.position.y - 0.56) < 0.002 && Math.abs(Math.abs(o.position.x) - 0.245 * W) < 0.002) {
    o.scale.multiplyScalar(0.94); o.scale.y *= 0.88; o.position.x *= 0.96; o.position.y = 0.55;   // deltoide fundido con el torso
  }
  // articulaciones: rodilla y codo del tamaño del miembro (antes sobresalían como bolas)
  for (let i = 0; i < 2; i++) {
    for (const o of this.knees[i].children) if (o.isMesh && o.geometry === SPH && o.position.y === 0 && o.scale.x > 0.07) o.scale.multiplyScalar(0.84);
    for (const o of this.elbows[i].children) if (o.isMesh && o.geometry === SPH && o.position.y === 0) o.scale.multiplyScalar(0.88);
  }
  // pelvis con glúteos
  for (const o of this.rig.children) if (isCyl(o, 0.19 * W, 0.17 * W, 0.22)) swap(o, 'pelvis', 0.19 * W, 0.17 * W, 0.22);
  // cráneo esculpido (la mandíbula aparte se oculta: ya está en la forma)
  for (const o of this.head.children) {
    if (!o.isMesh || o.geometry !== SPH || o.material !== this.skinMat) continue;
    if (Math.abs(o.position.y - 0.15) < 0.002 && Math.abs(o.scale.x - 0.145) < 0.002) o.geometry = headGeometry();
    else if (Math.abs(o.position.y - 0.065) < 0.002 && Math.abs(o.scale.x - 0.118) < 0.002) o.visible = false;
  }
  // tela: trama + arrugas en remeras, camperas y pantalones
  const done = new Map();
  this.root.traverse(o => {
    if (!o.isMesh || !o.material || o.material === this.skinMat || o.material.map || !(o.material.isMeshStandardMaterial) || o.userData.mark) return;
    const top = o.material === this.shirtMat || (o.parent === this.torso || this.arms.includes(o.parent));
    const leg = this.legs.includes(o.parent) || this.knees.includes(o.parent) || o.parent === this.rig;
    if (!top && !leg) return;
    let m = done.get(o.material);
    if (!m) { m = o.material.clone(); m.bumpMap = fabricTex(leg ? 'denim' : 'cotton'); m.bumpScale = leg ? 0.004 : 0.0025; done.set(o.material, m); if (o.material === this.shirtMat) this.shirtMat = m; }
    o.material = m;
  });
};


// ============================================================
// v14 VOCES DE BANDAS - contextuales, con cooldown para no saturar
// ============================================================
const BAND_VOICE14={
 cumbieros:{pre:['¿Qué onda, guacho?','Dale, mano a mano.','Dale perri, largate.','¿Qué onda, gato?'],hit:['¡De jetaaa, perro!','¡Sos pollo!','¡Dale, perri!','¡Tomá, gato!'],hurt:['¡Eh, gato!','¡Ahora vas a ver!','¡Dale!'],down:['¡Sos pollo!','¿Y ahora, gato?']},
 rugbier:{pre:['¿Qué hacés, amigo?','Jajaja, te como, amigo.','Papá, ¿sabés quién soy?'],hit:['¡Vamos, papá!','¡Te avisé!','¡Dale, amigo!'],hurt:['¡MAMÁÁÁ!','¡SACÁ LA MANO DE AHÍ!','¡Pará, amigo!'],down:['Jajaja, te como, amigo.','¡Vamos, papá!']},
 floggers:{pre:['¿Qué pasó, amigo?','Ayyy, reeee...','Naaa, qué verrr.'],hit:['¡¿Qué pasó, amigo?!','¡Reeee!','¡Naaa!'],hurt:['¡Uuyyy, qué piñaaa!','¡Naaa, amigo!','¡Ayyy, reeee!'],down:['¡¿Qué pasó, amigo?!','¡Reeee!'],prep:['¿Vamos a UNI?','Amigo, ¿qué agarramos?','Naaa, eso no.','Ese sí, amigo.']}
};
function bandVoice14(f,kind,chance){ const d=teamDefs[f?.team], bank=d&&BAND_VOICE14[d.id]?.[kind]; if(!bank||!f.alive||f.barkT>0||Math.random()>(chance??.25))return; f.say(pick(bank),2.05); f.barkT=rand(8,15); }
// ============================================================
