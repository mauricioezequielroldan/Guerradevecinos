// ============================================================
// MÚSICA POR ESTILO (todo generado por el juego: sin grabaciones de nadie)
// En la pelea suena el estilo de la banda rival y cada round cambia la progresión y la melodía:
//   Cumbieros: cumbia villera · Rugbier: electro · Floggers: electro flogger · Motoqueros: rock
//   Gauchos: chamamé · La Par/Impar: cumbia-rock (la de siempre) · Trofi: la cumbia del boliche
// En el barrio del modo historia: tranquila y bajita (se cortó la luz).
// ============================================================
const MUSX = { estilo: 'cumbia', var: 0, last: '' };
// progresiones (notas MIDI de cada acorde); cada round usa otra
const MUSX_PROG = {
  villera: [[[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]], [[50, 53, 57], [55, 59, 62], [48, 52, 55], [52, 56, 59]], [[57, 60, 64], [55, 59, 62], [53, 57, 60], [55, 59, 62]]],
  electro: [[[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 43, 47]], [[45, 48, 52], [43, 47, 50], [41, 45, 48], [43, 47, 50]], [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 48, 52]]],
  rock: [[[52, 59], [52, 59], [55, 62], [57, 64]], [[52, 59], [60, 67], [55, 62], [57, 64]], [[57, 64], [55, 62], [53, 60], [52, 59]]],
  chamame: [[[55, 59, 62], [55, 59, 62], [50, 54, 57], [55, 59, 62]], [[60, 64, 67], [55, 59, 62], [57, 60, 64], [50, 54, 57]], [[55, 59, 62], [60, 64, 67], [50, 54, 57], [55, 59, 62]]],
};
const MUSX_BPM = { villera: 98, electro: 128, flogger: 132, rock: 140, chamame: 112, cumbia: 98, barrio: 84 };
function musxEstilo() {
  if (typeof HIST !== 'undefined' && HIST.on && gameState === 'historia') return 'barrio';
  const rival = (typeof teamSel !== 'undefined' && teamSel[1]) || 'original';
  return { cumbieros: 'villera', rugbier: 'electro', floggers: 'flogger', motoqueros: 'rock', gauchos: 'chamame' }[rival] || 'cumbia';
}
// --- cada estilo: una semicorchea ---
// --- voz de teclado villero: dos osciladores apenas desafinados, vibrato y "deslizada" desde abajo ---
function mlead(f, t, dur, vol, slide) {
  const o1 = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter(), lfo = AC.createOscillator(), lg = AC.createGain();
  o1.type = 'square'; o2.type = 'sawtooth'; fl.type = 'lowpass'; fl.frequency.value = 3400; fl.Q.value = 2;
  const f0 = slide ? f * 0.84 : f;                                                           // la deslizada: arranca un tono abajo
  for (const [o, k] of [[o1, 1], [o2, 1.006]]) { o.frequency.setValueAtTime(f0 * k, t); o.frequency.exponentialRampToValueAtTime(f * k, t + (slide ? 0.06 : 0.001)); lg.connect(o.frequency); o.connect(fl); }
  lfo.frequency.value = 6.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.12, dur * 0.6)); lfo.connect(lg);   // vibrato que entra de a poco
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol * 0.85, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  fl.connect(g); g.connect(MUS.gain); for (const o of [o1, o2, lfo]) { o.start(t); o.stop(t + dur + 0.05); }
}
function mcampana(t, vol) {   // cencerro: dos tonos metálicos cortos
  for (const f of [800, 540]) { const o = AC.createOscillator(), g = AC.createGain(), bp = AC.createBiquadFilter(); o.type = 'square'; o.frequency.value = f; bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 3; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); o.connect(bp); bp.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + 0.1); }
}
function mtimbal(t, f, vol) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.12); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + 0.2); mnoise(t, 0.05, vol * 0.5, 2200, 'bandpass'); }
function msirena(t) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(400, t); o.frequency.exponentialRampToValueAtTime(1600, t + 0.9); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.025, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1); o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + 1.2); }
// melodías del teclado (semitonos sobre la fundamental; null = silencio; 'r' = repite la nota anterior). Pregunta y respuesta.
const VILLERA_RIFFS = [
  [[7, null, 7, 8, 7, null, 5, null, 3, null, 2, 3, 5, null, null, null], [3, null, 3, 5, 3, null, 2, null, 0, null, -2, 0, 2, null, null, null]],
  [[12, null, 10, null, 8, 7, null, 8, 7, null, 5, null, 7, null, null, null], [8, null, 7, null, 5, 3, null, 5, 3, null, 2, null, 0, null, null, null]],
  [[0, 3, 7, null, 10, null, 8, 7, null, 5, 7, null, 3, null, null, null], [2, 5, 8, null, 7, null, 5, 3, null, 2, 3, null, 0, null, null, null]],
];
function musxVillera(s, t, ch, L, bar) {
  // güira: el patrón largo-corto-corto de la cumbia (siempre)
  const gu = [0.09, 0.03, 0.05, 0.03][s % 4]; mnoise(t, gu, (s % 4 === 0 ? 0.075 : 0.045) + 0.015 * L, 6500);
  // bombo en 1 y 3, cencerro a contratiempo, "tumba" en el 4
  if (s === 0 || s === 8) mkick(t, 0.5);
  if (s % 4 === 2) mcampana(t, 0.035 + 0.015 * L);
  if (s === 12) mnoise(t, 0.1, 0.12, 1300, 'bandpass');
  // repique de timbales al final de cada 4 compases
  if (bar % 4 === 3 && s >= 12) mtimbal(t, [330, 290, 250, 210][s - 12], 0.16);
  if (bar % 8 === 7 && s === 0 && L >= 1) msirena(t);                                                     // el "sirenazo"
  // bajo tumbado: fundamental, quinta, octava de pasada
  const root = ch[0] - 24, bp = { 0: root, 6: root + 7, 8: root, 10: root + 12, 14: root + 7 };
  if (bp[s] !== undefined) mnote('triangle', mtof(bp[s]), t, 0.2, 0.22, 650);
  // acordes picados a contratiempo (el "órgano" de fondo)
  if (s % 4 === 2) for (const n of ch) mnote('square', mtof(n + 12), t, 0.07, 0.012 + 0.006 * L, 1800);
  // el teclado: pregunta (compás par) y respuesta (impar), con deslizadas
  const R = VILLERA_RIFFS[MUSX.var % VILLERA_RIFFS.length][bar % 2], r = R[s];
  if (r !== null && r !== undefined && (L >= 1 || bar % 4 < 2)) {
    let len = 1; while (s + len < 16 && R[s + len] === null && len < 3) len++;
    mlead(mtof(ch[0] + 12 + r), t, 0.11 * len + 0.04, 0.045, (s === 0 || Math.random() < 0.35));
  }
}
function musxElectro(s, t, ch, L, bar, flogger) {
  if (s % 4 === 0) mkick(t, 0.6);                                                                             // cuatro en el piso
  if (s % 4 === 2) mnoise(t, 0.05, 0.06 + 0.03 * L, 9000);                                                   // hi-hat abierto a contratiempo
  if (s % 2 === 1 && L >= 1) mnoise(t, 0.02, 0.03, 10000);
  if (s === 4 || s === 12) mnoise(t, 0.16, 0.16, 2200, 'bandpass');                                          // clap
  const root = ch[0] - 12;
  if (s % 4 === 2 || (flogger && s % 4 === 3)) mnote('sawtooth', mtof(root), t, 0.12, 0.16, 900 + L * 500);   // bajo a contratiempo
  if (s === 0 || s === 8) for (const n of ch) mnote('sawtooth', mtof(n + 12), t, 0.4, 0.02, 1800 + L * 800); // acordes
  if (flogger || L >= 1) { const arp = [0, 1, 2, 1], n = ch[arp[s % 4]] + 24 + (MUSX.var % 2 ? 12 : 0); if (s % (flogger ? 1 : 2) === 0) mnote('square', mtof(n), t, 0.07, 0.022, 4000); }   // arpegio
}
function musxRock(s, t, ch, L, bar) {
  if (s === 0 || s === 6 || s === 8 || (L >= 1 && s === 10)) mkick(t, 0.55);
  if (s === 4 || s === 12) mnoise(t, 0.18, 0.22, 1400, 'bandpass');                                          // redoblante
  if (s % 2 === 0) mnoise(t, 0.04, 0.035, 7000);                                                             // platillo
  if (s % 2 === 0) for (const n of ch) { mnote('sawtooth', mtof(n - 12), t, 0.16, 0.05, 1100); mnote('square', mtof(n - 12) * 1.005, t, 0.16, 0.03, 900); }   // power chords "distorsionados"
  if (s % 4 === 0) mnote('triangle', mtof(ch[0] - 24), t, 0.2, 0.2, 500);
  if (L >= 2 && s % 4 === 2) mnote('sawtooth', mtof(ch[0] + 12 + [0, 3, 5, 7][(bar + s) % 4]), t, 0.12, 0.03, 3000);
}
function musxChamame(s, t, ch, L, bar) {
  // ritmo de a tres sobre la semicorchea (12 de 16): 1 y 4 el bajo, el "acordeón" con trémolo en el resto
  const k = Math.floor(s * 12 / 16), first = s === Math.round(k * 16 / 12) || s === 0;
  if (k % 6 === 0 && first) mnote('triangle', mtof(ch[0] - 24), t, 0.25, 0.22, 600);
  if (k % 6 === 3 && first) mnote('triangle', mtof(ch[0] - 17), t, 0.22, 0.18, 600);
  if (k % 3 !== 0 && first) for (const n of ch) { mnote('sawtooth', mtof(n), t, 0.13, 0.022, 1600); mnote('sawtooth', mtof(n) * 1.008, t, 0.13, 0.016, 1600); }   // acordeón (dos voces apenas desafinadas)
  if (k % 3 === 0 && first) mnoise(t, 0.05, 0.05, 3000, 'bandpass');
  if (L >= 1 && first) { const mel = [7, 5, 4, 2, 4, 5, 7, 9, 7, 5, 4, 2], r = mel[(k + bar * 3 + MUSX.var * 2) % 12]; mnote('square', mtof(ch[0] + 12 + r), t, 0.14, 0.026, 2600); }
}
function musxBarrio(s, t, ch, L, bar) {
  // noche sin luz: pad suave y una güira lejana, muy bajito
  if (s === 0) for (const n of ch) mnote('triangle', mtof(n), t, 1.4, 0.018, 900);
  if (s % 4 === 2) mnoise(t, 0.05, 0.015, 5000);
  if (s === 0 || s === 8) mnote('sine', mtof(ch[0] - 24), t, 0.5, 0.06, 400);
}
{
  const basePlay = playStep;
  playStep = function (st, t) {
    const e = MUSX.estilo;
    if (e === 'cumbia') return basePlay(st, t);                       // la de siempre (y la del Trofi, que tiene la suya)
    const bar = Math.floor(st / 16), s = st % 16, L = MUS.level;
    const progs = MUSX_PROG[e === 'flogger' ? 'electro' : e === 'barrio' ? 'villera' : e] || MUSX_PROG.villera;
    const ch = progs[MUSX.var % progs.length][bar % 4];
    if (e === 'villera') musxVillera(s, t, ch, L, bar);
    else if (e === 'electro' || e === 'flogger') musxElectro(s, t, ch, L, bar, e === 'flogger');
    else if (e === 'rock') musxRock(s, t, ch, L, bar);
    else if (e === 'chamame') musxChamame(s, t, ch, L, bar);
    else musxBarrio(s, t, ch, L, bar);
  };
  const baseUpd = updateMusic;
  updateMusic = function () {
    baseUpd();
    if (!MUS.gain) return;
    const e = MUSX.force || musxEstilo();   // force: para escuchar un estilo a mano (pruebas)
    // cada round, otra variante (progresión y melodía); al cambiar de estilo arranca de nuevo
    const ronda = (typeof score !== 'undefined') ? score[0] + score[1] : 0, key = e + ':' + ronda;
    if (key !== MUSX.last) { MUSX.last = key; MUSX.estilo = e; MUSX.var = (ronda + Math.floor(Math.random() * 3)) % 3; }
    if (e !== 'cumbia') MUS.bpm = MUSX_BPM[e] + (MUS.level >= 2 ? 6 : 0);
    if (e === 'barrio') MUS.gain.gain.setTargetAtTime(MUS.on ? 0.22 : 0, AC.currentTime, 0.8);
  };
}

window.__MUSX = MUSX;
