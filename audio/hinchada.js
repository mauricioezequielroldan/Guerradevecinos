// ============================================================
// LA GENTE ALREDEDOR DE LA PELEA (voces lejanas)
// - Coro sintetizado de ~10 voces (cada una con su tono y un filtro de "boca" para u / o / a):
//   el "uuuhhh" del K.O., el "¡ohhh!" cuando alguien cae, el "¡eeeh!" al arrancar el round.
// - Murmullo de fondo durante la pelea (más fuerte en el mano a mano).
// - Frases gritadas con la voz del navegador, bajitas y con distinta entonación (suenan algo robóticas:
//   para que suenen reales hay que grabarlas; ver LEEME).
// Todo pasa por un filtro de "distancia" (se escucha lejos).
// ============================================================
const HINCHA = { ok: false, out: null, murmullo: null, lastTTS: -99, lastCoro: -99, prev: new Map(), prevState: '', prevDuel: false, voz: null };
const HINCHA_FRASES = {
  ko: ['¡Uuuh, lo durmió!', '¡Dale, guacho, largate!', '¡Andá a dormir!', '¡Fuaaa, qué piña!', '¡Se terminó, se terminó!', '¡Levantate, gil!', '¡Uh, lo mataste!'],
  cae: ['¡Al piso!', '¡Pegale, pegale!', '¡Uy, uy, uy!', '¡No te levantés!'],
  furia: ['¡Se puso loco!', '¡Cuidado que se brotó!', '¡Agarrenló!'],
  mano: ['¡Mano a mano! ¡Mano a mano!', '¡Que se arreglen los capitanes!', '¡Dale, dale, dale!'],
  arranca: ['¡Vamos, vamos!', '¡Dale que se arma!', '¡Eh, eh, eh!'],
};
const VOCALES = { u: [320, 800], o: [500, 950], a: [780, 1250], e: [480, 1900] };
function hinchaCrear() {
  if (HINCHA.ok || !AC || typeof master === 'undefined' || !master) return;
  HINCHA.ok = true;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;                 // lejos: sin agudos
  HINCHA.out = AC.createGain(); HINCHA.out.gain.value = 0.85; HINCHA.out.connect(lp); lp.connect(master);
  // eco corto (rebota en las paredes del barrio)
  const dl = AC.createDelay(0.5), fb = AC.createGain(); dl.delayTime.value = 0.18; fb.gain.value = 0.28; lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(master);
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 0.9;
  HINCHA.murmullo = AC.createGain(); HINCHA.murmullo.gain.value = 0; s.connect(bp); bp.connect(HINCHA.murmullo); HINCHA.murmullo.connect(HINCHA.out); s.start();
}
// coro: n voces que dicen una vocal, con subida y bajada
function hinchaCoro(vocal, intens, dur) {
  if (!HINCHA.ok || !MUS.on) return; const now = AC.currentTime; if (now - HINCHA.lastCoro < 0.4) return; HINCHA.lastCoro = now;
  const [F1, F2] = VOCALES[vocal] || VOCALES.u, n = 10;
  for (let i = 0; i < n; i++) {
    const t = now + Math.random() * 0.18, d = dur * (0.8 + Math.random() * 0.4), f = (i % 3 === 0 ? 210 : 125) * (0.85 + Math.random() * 0.35);
    const o = AC.createOscillator(), g = AC.createGain(), f1 = AC.createBiquadFilter(), f2 = AC.createBiquadFilter(), mix = AC.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (vocal === 'u' ? 1.18 : 1.08), t + d * 0.35); o.frequency.linearRampToValueAtTime(f * 0.9, t + d);   // sube y cae, como un "uuuhhh"
    f1.type = f2.type = 'bandpass'; f1.frequency.value = F1; f2.frequency.value = F2; f1.Q.value = 6; f2.Q.value = 8;
    o.connect(f1); o.connect(f2); f1.connect(mix); f2.connect(mix); mix.gain.value = 1; mix.connect(g);
    const v = 0.05 * intens; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + d * 0.25); g.gain.linearRampToValueAtTime(v * 0.7, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    g.connect(HINCHA.out); o.start(t); o.stop(t + d + 0.05);
  }
  // aire (respiración de la gente)
  const s = AC.createBufferSource(); s.buffer = noiseBuf; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = F2; bp.Q.value = 1.2; const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(0.05 * intens, now + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, now + dur); s.connect(bp); bp.connect(g); g.connect(HINCHA.out); s.start(now, Math.random() * 0.5); s.stop(now + dur + 0.05);
}
// frase gritada con la voz del navegador (bajita, distinta entonación)
function hinchaGrito(tipo, prob) {
  if (!MUS.on || !('speechSynthesis' in window) || Math.random() > (prob || 1)) return;
  const now = performance.now() / 1000; if (now - HINCHA.lastTTS < 6) return; HINCHA.lastTTS = now;
  try {
    if (!HINCHA.voz) { const vs = speechSynthesis.getVoices(); HINCHA.voz = vs.find(v => /es-AR/i.test(v.lang)) || vs.find(v => /es-(419|US|MX)/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null; }
    const u = new SpeechSynthesisUtterance(pick(HINCHA_FRASES[tipo])); u.lang = HINCHA.voz ? HINCHA.voz.lang : 'es-AR'; if (HINCHA.voz) u.voice = HINCHA.voz;
    u.volume = 0.22 + Math.random() * 0.1; u.rate = 1.05 + Math.random() * 0.25; u.pitch = 0.7 + Math.random() * 0.7;
    speechSynthesis.speak(u);
  } catch (e) { }
}
{
  const baseWorld = updateWorld;
  updateWorld = function (dt) {
    baseWorld(dt);
    if (!AC) return;
    const peleando = gameState === 'fight' || gameState === 'roundEnd' || gameState === 'intro';
    if (peleando) hinchaCrear();
    if (!HINCHA.ok) return;
    const enDuelo = typeof duel !== 'undefined' && duel;
    HINCHA.murmullo.gain.setTargetAtTime(peleando && MUS.on ? (enDuelo ? 0.055 : 0.032) : 0, AC.currentTime, 0.6);
    // arranca el round
    if (gameState === 'fight' && HINCHA.prevState === 'intro') { hinchaCoro('e', 0.6, 0.9); hinchaGrito('arranca', 0.35); }
    HINCHA.prevState = gameState;
    if (enDuelo && !HINCHA.prevDuel) { hinchaCoro('a', 0.9, 1.4); setTimeout(() => hinchaGrito('mano', 1), 700); }
    HINCHA.prevDuel = enDuelo;
    if (!peleando) { HINCHA.prev.clear(); return; }
    // K.O., caídas y furia: lo que pasa con cada luchador
    for (const f of fighters) {
      const p = HINCHA.prev.get(f) || { st: f.state, rage: false };
      if (f.state === 'ko' && p.st !== 'ko') { hinchaCoro('u', 1, 1.6); setTimeout(() => hinchaGrito('ko', 0.7), 500); }
      else if (f.state === 'down' && p.st !== 'down' && p.st !== 'ko') { hinchaCoro('o', 0.55, 0.7); hinchaGrito('cae', 0.2); }
      const rage = f.rageTime > 0; if (rage && !p.rage) hinchaGrito('furia', 0.5);
      HINCHA.prev.set(f, { st: f.state, rage });
    }
  };
}
window.__HINCHA = { HINCHA, coro: hinchaCoro, grito: hinchaGrito };
