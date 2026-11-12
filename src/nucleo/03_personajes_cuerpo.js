// ============================================================
// PERSONAJES — cuerpo humano articulado (codos, rodillas, cuello)
// ============================================================
const TEAM_NAMES = ['VEREDA PAR', 'VEREDA IMPAR'];
const VEST = [0x4a6a9a, 0x5a1810];
const VEST_OPTS = [{ roughness: 0.95 }, { roughness: 0.36, metalness: 0.12 }];
const ROSTER = [
  [
    { name: 'Rubén', top: 'musculosa', topColor: 0xe8e4da, pants: 0x2e4470, skin: 0xd9a27a, hair: 'long', hairColor: 0x2a1a10, sideburns: true, chain: true },
    { name: 'Cacho', top: 'bare', pants: 0x2a3a5a, skin: 0x8a5a3a, hair: 'afro', hairColor: 0x120a06, mustache: true, wrist: 0xd8d8d8, big: true },
    { name: 'Tito', top: 'musculosa', topColor: 0x7a7a72, pants: 'jogging', skin: 0xc68b62, hair: 'rulos', hairColor: 0x3a2412, headband: 0xd8302a },
    { name: 'La Colo', top: 'remera', topColor: 0x1a1a1a, pants: 0x2a3a60, skin: 0xf0c8a8, hair: 'long', hairColor: 0xb8501a, slim: true, chain: true },
  ],
  [
    { name: 'El Tano', top: 'musculosa', topColor: 0x161616, pants: 0x24304a, skin: 0xe0ac86, hair: 'short', hairColor: 0x111111, cap: 0x111111, mustache: true },
    { name: 'Kevin', top: 'remera', stripes: ['#c8201a', '#f2f2ee'], pants: 'jogging', skin: 0xb98a63, hair: 'short', hairColor: 0x2b1a0e, cap: 0xe8e8e8, capBack: true, chain: true },
    { name: 'Pocho', top: 'bare', pants: 0x2e3a52, skin: 0xd59a72, hair: 'bald', hairColor: 0x2a1a10, beard: true, belly: true },
    { name: 'La Turca', top: 'remera', topColor: 0x5a2a6a, pants: 0x1a1a1e, skin: 0xd8a882, hair: 'long', hairColor: 0x0e0a08, bandana: 0xd8c030, slim: true },
  ]
];
function patchTexture(team) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#e8d27a'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
    g.fillStyle = team === 0 ? '#1f3360' : '#3a0a06'; g.beginPath(); g.arc(128, 128, 104, 0, 7); g.fill();
    g.fillStyle = '#e8d27a'; g.font = "bold 70px Impact, 'Arial Black', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(team === 0 ? 'LA PAR' : 'IMPAR', 128, 112, 190);
    g.font = "bold 22px Impact, 'Arial Black', sans-serif"; g.fillText('BARRIO LAS ACACIAS', 128, 170, 180);
  });
}
const PATCH_TEX = [patchTexture(0), patchTexture(1)];
// sombra de contacto (oclusión barata bajo los pies): asienta a los personajes en el piso
const BLOB_TEX = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
function stripeTex(c) { return canvasTex(64, 64, (g, w, h) => { for (let i = 0; i < 4; i++) { g.fillStyle = c[i % 2]; g.fillRect(0, i * 16, w, 16); } }); }
const BARKS = [
  ['¡Devolvé la garrafa que te presté!', '¡Bajá la cumbia que son las 3!', '¡Me colgaste del wifi!', '¡La plaza es nuestra!', '¡Tu perro me rompe las bolsas!'],
  ['¡Quién me afanó la bici!', '¡Estacionaste en mi vereda otra vez!', '¡Cruzá si te animás!', '¡Tu gato se come mis canarios!', '¡La pelota que cayó es MÍA!']
];
const PREP_BARKS = ['Muchachos, agarren algo. Nos esperan en la plaza.', '¿Quién se llevó la llave del taller?', 'Si mi vieja ve que falta el palo de amasar, me mata.', 'Dicen que los de la Impar ya están en las mesitas.', 'Cacho, dejá de mirarte en el vidrio.'];
const PICK_LINES = { escape: ['Se lo saqué a la moto. Total no anda.'], cuchillo: ['Del asado del domingo. Lo devuelvo limpito.'], palo: ['Perdón, abuela. Es por una buena causa.'], llave: ['Vamos a ajustar algunas cuentas.'] };
const TAUNTS = ['¡Tomá!', '¡Volvé a tu vereda!', '¡Esto es por la garrafa!', '¡Chau, vecino!', '¡La plaza tiene dueño!', '¡Y no vuelvas!', '¡Andá a llorarle a tu vieja!'];
const KO_LINES = ['Me rindo, me rindo...', 'Llamen a mi cuñado...', 'Mañana te denuncio...', 'Veo estrellitas...', 'Avisale a mi vieja...'];
const BREAK_LINES = ['¡Se rompió! ¡A las piñas!', '¡Bueno, a mano limpia!', '¡Mi fierro! Ahora sí te cobro...', '¡Chau herramienta, hola patadas!'];
const SHOW_WORDS = params.has('carteles');   // v8: las onomatopeyas (¡PUM!, ¡PAF!...) sólo con ?carteles
const HIT_WORDS = ['¡PAF!', '¡PUM!', '¡ZAS!', '¡CRACK!', '¡PLAF!', '¡BAM!'];

// Cada vecino pelea distinto: pow = pega, spd = velocidad, hp = aguante
const STATS = {
  'Rubén': { pow: 1.0, spd: 1.0, hp: 1.0, tag: 'Equilibrado' },
  'Cacho': { pow: 1.22, spd: 0.9, hp: 1.12, tag: 'Pegada pesada' },
  'Tito': { pow: 0.95, spd: 1.1, hp: 0.95, tag: 'Ágil' },
  'La Colo': { pow: 0.85, spd: 1.2, hp: 0.85, tag: 'La más rápida' },
  'El Tano': { pow: 1.05, spd: 1.0, hp: 1.0, tag: 'Equilibrado' },
  'Kevin': { pow: 0.9, spd: 1.16, hp: 0.9, tag: 'Rápido' },
  'Pocho': { pow: 1.15, spd: 0.84, hp: 1.32, tag: 'Tanque' },
  'La Turca': { pow: 0.92, spd: 1.12, hp: 0.9, tag: 'Ágil' },
};
let TWO_P = false;
let player2 = null;
let lastSayT = -9, slowMo = 0, lastKO = null;
// v8: aguante. Con 1 los rounds de 4vs4 duraban ~22 s y la policía nunca llegaba.
const HP_SCALE = +(params.get('aguante') || 3.2);   // v56: antes 5.5 (las peleas se hacían eternas)
const ATK = {
  jab: { dur: 0.3, hitAt: 0.11, range: 1.55, arc: 1.05, dmg: 6, kb: 2.5, stun: 0.3 },
  cross: { dur: 0.34, hitAt: 0.13, range: 1.6, arc: 1.05, dmg: 7, kb: 3, stun: 0.33 },
  hook: { dur: 0.5, hitAt: 0.24, range: 1.7, arc: 1.15, dmg: 11, kb: 9, knockdown: true },
  kick: { dur: 0.56, hitAt: 0.27, range: 1.95, arc: 0.9, dmg: 12, kb: 9, knockdown: true },
  dropkick: { dur: 0.95, hitAt: 0.14, hitEnd: 0.5, multi: true, range: 1.7, arc: 1.2, dmg: 15, kb: 12, knockdown: true, flip: true },
  stomp: { dur: 0.5, hitAt: 0.27, range: 1.9, arc: 1.4, dmg: 8, kb: 0, onDowned: true },
  groundkick: { dur: 0.58, hitAt: 0.3, range: 1.95, arc: 1.4, dmg: 10, kb: 1.5, onDowned: true },   // v6: puntín con el empeine
  swing: { dur: 0.56, hitAt: 0.3, arc: 1.2, kb: 7, stun: 0.45 },
  throw: { dur: 0.42, hitAt: 0.2 },
  pickup: { dur: 0.32, hitAt: 0.16 },
  grabmiss: { dur: 0.42, hitAt: 0.2 },
};

const labelsEl = document.getElementById('labels');
let fighters = [];
let player = null;
let teamCommand = 'attack';
let lastWinner = -1;
const HIP = 1.02, BODY_S = 1.06;

class Fighter {
  constructor(team, idx, cfg, isPlayer) {
    this.team = team; this.idx = idx; this.cfg = cfg; this.isPlayer = !!isPlayer; this.pid = isPlayer ? (isPlayer === 2 ? 2 : 1) : 0;
    this.st = STATS[cfg.name] || { pow: 1, spd: 1, hp: 1 };
    this.name = cfg.name; this.civil = !!cfg.civil;
    this.maxHp = Math.round(100 * HP_SCALE * this.st.hp * (isPlayer && !TWO_P ? 1.3 : 1)); this.hp = this.maxHp;
    this.held = null; this.holder = null; this.grabT = 0; this.grabHits = 0; this.grabAct = null; this.escape = 0;
    this.invuln = 0; this.downHits = 0; this.chain = 0; this.hitShakeT = 0;
    this.pos = new THREE.Vector3(); this.facing = 0; this.vy = 0; this.flip = false; this.fallSign = 1;
    this.moveX = 0; this.moveZ = 0; this.running = false; this.blockHeld = false; this.swagger = false; this.noClamp = false;
    this.knock = new THREE.Vector2();
    this.state = 'normal'; this.stateTime = 0; this.stun = 0; this.hitVar = 1;
    this.attack = null; this.comboStep = 0; this.comboTimer = 0; this.buffer = null;
    this.weapon = null; this.rage = 0; this.rageTime = 0; this.flash = 0;
    this.curSpeed = 0; this.walkPhase = Math.random() * 6; this.idleT = Math.random() * 6;
    this.dmgMult = this.st.pow * (isPlayer ? 1 : TWO_P ? 0.9 : (team === 0 ? 0.9 : 0.82));
    this.ai = { think: rand(0.2, 0.8), target: null, goal: null, atkCd: rand(0.4, 1.2), strafe: Math.random() < 0.5 ? -1 : 1, comboLeft: 0, blockT: 0, barkCd: rand(3, 8), charge: false, handsOnly: false };
    this.P = null; this.poseFn = null;
    this.buildMesh();
    this.buildLabel();
    this.initIK();
  }
  buildMesh() { ROUND = true; try { this._buildMesh(); } finally { ROUND = false; } }
  _buildMesh() {
    const c = this.cfg;
    this.root = new THREE.Group(); scene.add(this.root);
    this.rig = new THREE.Group(); this.rig.scale.setScalar(BODY_S * (c.big ? 1.05 : 1)); this.root.add(this.rig);
    this.skinMat = uniqueMat(c.skin, { roughness: 0.55 });
    this.shirtMat = c.top === 'bare' ? this.skinMat : c.stripes ? new THREE.MeshStandardMaterial({ map: cloneTex(stripeTex(c.stripes), 1, 3), roughness: 0.8 }) : uniqueMat(c.topColor, { roughness: 0.85 });
    this.vestMat = this.civil || c.noVest ? null : uniqueMat(c.vestColor !== undefined ? c.vestColor : VEST[this.team], c.vestOpts || VEST_OPTS[this.team]);
    const jog = c.pants === 'jogging';
    const pants = jog ? mat(0x17171c, { roughness: 0.7 }) : mat(c.pants, { roughness: 0.95 });
    const hair = mat(c.hairColor, { roughness: 0.85 }), shoe = mat(c.shoe || 0xeeeeea, { roughness: 0.6 }), sole = mat(0x2a2a2a);
    const W = (c.belly ? 1.18 : c.slim ? 0.88 : c.big ? 1.12 : 1.02) * 1.06;   // ancho del torso
    // ---- piernas (cadera → rodilla → pie) ----
    this.legs = []; this.knees = []; this.feet = [];
    for (const s of [-1, 1]) {
      const thigh = new THREE.Group(); thigh.position.set(s * 0.115 * W, -0.02, 0); this.rig.add(thigh);
      cyl(0.105 * W, 0.082, 0.46, pants, 0, -0.23, 0, thigh, 12);
      const knee = new THREE.Group(); knee.position.y = -0.46; thigh.add(knee);
      sph(0.084, 0.084, 0.088, pants, 0, 0, 0, knee);
      cyl(0.08, 0.062, 0.44, c.shorts ? this.skinMat : pants, 0, -0.22, 0, knee, 12);
      if (jog) { const st = cyl(0.083, 0.065, 0.42, mat(0xf2f2f2), 0, -0.22, 0, knee, 12); st.scale.set(0.25, 1, 1.02); st.position.x = s * 0.06; }
      const foot = new THREE.Group(); foot.position.y = -0.44; knee.add(foot);   // tobillo (v4)
      sph(0.08, 0.07, 0.16, shoe, 0, -0.03, 0.055, foot);
      box(0.15, 0.035, 0.3, sole, 0, -0.085, 0.05, foot);
      bakeXZ(thigh, 1.2, 1.2);
      this.legs.push(thigh); this.knees.push(knee); this.feet.push(foot);
    }
    // ---- pelvis y torso ----
    const pelvis = cyl(0.19 * W, 0.17 * W, 0.22, pants, 0, -0.02, 0, this.rig, 14); pelvis.scale.z = 0.72;
    this.torso = new THREE.Group(); this.torso.position.y = 0.06; this.rig.add(this.torso);
    const belt = cyl(0.188 * W, 0.188 * W, 0.06, mat(0x1e140c, { roughness: 0.6 }), 0, 0.0, 0, this.torso, 14); belt.scale.z = 0.74;
    sph(0.035, 0.028, 0.012, mat(0xd8d8d0, { metalness: 0.9, roughness: 0.25 }), 0, 0.0, 0.142 * W, this.torso, false);
    const abd = cyl(0.172 * W, 0.185 * W, 0.3, this.shirtMat, 0, 0.17, 0, this.torso, 16); abd.scale.z = 0.72;
    if (c.belly) sph(0.2, 0.19, 0.17, this.shirtMat, 0, 0.17, 0.07, this.torso);
    const chest = cyl(0.24 * W, 0.18 * W, 0.36, this.shirtMat, 0, 0.42, 0, this.torso, 18); chest.scale.z = 0.66;
    if (c.top === 'bare') for (const s of [-1, 1]) sph(0.095 * W, 0.065, 0.04, this.skinMat, s * 0.09 * W, 0.47, 0.12, this.torso, false);
    if (c.top === 'musculosa') { const tm = mat(shadeHex(c.topColor, -20)); for (const s of [-1, 1]) box(0.05, 0.02, 0.04, tm, s * 0.11, 0.6, 0.1, this.torso, false); }
    for (const s of [-1, 1]) sph(0.095, 0.085, 0.09, c.top === 'remera' ? this.shirtMat : this.skinMat, s * 0.245 * W, 0.56, 0, this.torso);
    cyl(0.062, 0.07, 0.14, this.skinMat, 0, 0.65, 0.0, this.torso, 10);
    if (c.chain) { const ch = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.009, 6, 20), mat(0xe8c040, { metalness: 0.95, roughness: 0.2 })); ch.rotation.x = 1.25; ch.position.set(0, 0.6, 0.05); this.torso.add(ch); }
    if (c.dress) { const d = cyl(0.21 * W, 0.3 * W, 0.78, mat(c.dress, { roughness: 0.9 }), 0, -0.28, 0, this.rig, 16); d.scale.z = 0.8; const d2 = cyl(0.185 * W, 0.2 * W, 0.62, mat(c.dress, { roughness: 0.9 }), 0, 0.33, 0, this.torso, 16); d2.scale.z = 0.72; }
    // ---- chaleco de la banda (abierto adelante, con parche en la espalda) ----
    if (!this.civil && !c.noVest) {
      const vg = new THREE.CylinderGeometry(0.262 * W, 0.208 * W, 0.62, 18, 1, true, 0.62, Math.PI * 2 - 1.24);
      const vest = new THREE.Mesh(vg, this.vestMat); vest.material.side = THREE.DoubleSide;
      vest.position.y = 0.31; vest.scale.z = 0.71; vest.castShadow = true; this.torso.add(vest);
      for (const s of [-1, 1]) { const lap = box(0.07, 0.4, 0.02, this.vestMat, s * 0.085 * W, 0.43, 0.165 * W, this.torso, false); lap.rotation.z = s * 0.25; }
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshStandardMaterial({ map: c.teamDef ? (c.teamDef._patch || (c.teamDef._patch = patchTextureFor(c.teamDef))) : PATCH_TEX[this.team], roughness: 0.7 }));
      patch.position.set(0, 0.36, -0.185 * W); patch.rotation.y = Math.PI; this.torso.add(patch);
    }
    // ---- cabeza ----
    this.head = new THREE.Group(); this.head.position.y = 0.7; this.torso.add(this.head);
    sph(0.145, 0.165, 0.158, this.skinMat, 0, 0.15, 0, this.head);
    sph(0.118, 0.092, 0.118, this.skinMat, 0, 0.065, 0.028, this.head);
    sph(0.028, 0.045, 0.036, this.skinMat, 0, 0.12, 0.152, this.head, false);
    sph(0.07, 0.016, 0.01, mat(0x6a3028), 0, 0.068, 0.142, this.head, false);
    const eyeW = mat(0xf2f0ea, { roughness: 0.3 }), eyeD = mat(0x1a120c, { roughness: 0.2 });
    for (const s of [-1, 1]) {
      sph(0.026, 0.018, 0.012, eyeW, s * 0.055, 0.165, 0.135, this.head, false);
      sph(0.013, 0.015, 0.01, eyeD, s * 0.055, 0.165, 0.145, this.head, false);
      const br = sph(0.034, 0.01, 0.012, hair, s * 0.056, 0.195, 0.142, this.head, false); br.rotation.z = -s * 0.2;
      sph(0.024, 0.042, 0.03, this.skinMat, s * 0.147, 0.14, -0.005, this.head, false);
    }
    if (c.mustache) sph(0.058, 0.017, 0.022, hair, 0, 0.093, 0.148, this.head, false);
    if (c.beard) { sph(0.125, 0.09, 0.115, hair, 0, 0.055, 0.035, this.head); sph(0.06, 0.017, 0.022, hair, 0, 0.093, 0.15, this.head, false); }
    if (c.sideburns) for (const s of [-1, 1]) sph(0.02, 0.055, 0.035, hair, s * 0.138, 0.13, 0.04, this.head, false);
    switch (c.hair) {
      case 'long': sph(0.158, 0.11, 0.172, hair, 0, 0.225, -0.008, this.head); sph(0.158, 0.25, 0.1, hair, 0, 0.06, -0.1, this.head); for (const s of [-1, 1]) sph(0.045, 0.15, 0.11, hair, s * 0.135, 0.11, -0.03, this.head); break;
      case 'afro': sph(0.235, 0.215, 0.23, hair, 0, 0.24, -0.035, this.head); break;
      case 'rulos': sph(0.155, 0.1, 0.168, hair, 0, 0.23, -0.01, this.head); for (let i = 0; i < 12; i++) { const a = rand(0, 6.28), r = rand(0.06, 0.13); sph(0.045, 0.045, 0.045, hair, Math.cos(a) * r, 0.29 + rand(-0.02, 0.03), Math.sin(a) * r - 0.02, this.head); } sph(0.15, 0.12, 0.09, hair, 0, 0.13, -0.09, this.head); break;
      case 'short': sph(0.153, 0.1, 0.165, hair, 0, 0.225, -0.01, this.head); sph(0.148, 0.12, 0.1, hair, 0, 0.15, -0.075, this.head); break;
      case 'bald': sph(0.148, 0.06, 0.1, hair, 0, 0.11, -0.08, this.head); break;
      case 'bun': sph(0.153, 0.1, 0.165, hair, 0, 0.225, -0.01, this.head); sph(0.07, 0.07, 0.07, hair, 0, 0.3, -0.1, this.head); break;
    }
    if (c.cap) { sph(0.158, 0.1, 0.17, mat(c.cap), 0, 0.24, 0, this.head); const v = cyl(0.11, 0.11, 0.02, mat(c.cap), 0, 0.235, c.capBack ? -0.19 : 0.19, this.head, 14); v.scale.z = 0.8; }
    if (c.headband) { const hb = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.022, 8, 22), mat(c.headband)); hb.rotation.x = Math.PI / 2; hb.position.y = 0.23; hb.scale.y = 1.06; this.head.add(hb); }
    if (c.bandana) { sph(0.16, 0.11, 0.172, mat(c.bandana), 0, 0.24, 0, this.head); sph(0.04, 0.04, 0.04, mat(c.bandana), 0, 0.2, -0.17, this.head); }
    if (c.rollers) for (let i = 0; i < 5; i++) { const r = cyl(0.025, 0.025, 0.09, mat(pick([0xff7ab0, 0x7ad0ff, 0xf0e070])), -0.08 + i * 0.04, 0.31, rand(-0.05, 0.05), this.head, 8); r.rotation.z = Math.PI / 2; }
    if (c.glasses) for (const s of [-1, 1]) { const gl = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 6, 14), mat(0x111111)); gl.position.set(s * 0.056, 0.165, 0.152); this.head.add(gl); }
    // ---- brazos (hombro → codo → puño) ----
    this.arms = []; this.elbows = [];
    const sleeve = c.top === 'remera';
    for (const s of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(s * 0.27 * W, 0.55, 0); this.torso.add(arm);
      cyl(0.068 * (c.big ? 1.15 : 1), 0.056, 0.3, this.skinMat, 0, -0.15, 0, arm, 12);
      if (sleeve) cyl(0.08, 0.072, 0.17, this.shirtMat, 0, -0.08, 0, arm, 12);
      const el = new THREE.Group(); el.position.y = -0.3; arm.add(el);
      sph(0.056, 0.056, 0.056, this.skinMat, 0, 0, 0, el, false);
      cyl(0.055, 0.043, 0.27, this.skinMat, 0, -0.135, 0, el, 12);
      if (c.wrist) cyl(0.052, 0.052, 0.05, mat(c.wrist), 0, -0.24, 0, el, 10);
      sph(0.054, 0.062, 0.052, this.skinMat, 0, -0.3, 0.005, el);
      bakeXZ(arm, 1.25, 1.25);
      this.arms.push(arm); this.elbows.push(el);
    }
    this.hand = new THREE.Group(); this.hand.position.set(0, -0.3, 0.025); this.hand.rotation.x = -1.25; this.hand.scale.setScalar(1.12); this.elbows[1].add(this.hand);
    this.dressExtras(); this.refineFace(); this.refineHands(); this.refineBody(); this.sculptBody();
    // ---- anillo y estrellitas ----
    const ringMat = new THREE.MeshBasicMaterial({ color: this.pid === 2 ? 0xff4a00 : this.isPlayer ? 0xffd23a : (this.team === 0 ? 0x3b82f6 : 0xef4444), transparent: true, opacity: this.isPlayer ? 0.95 : 0.55, depthWrite: false, side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(this.isPlayer ? 0.55 : 0.48, this.isPlayer ? 0.72 : 0.58, 28), ringMat);
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.07; this.root.add(this.ring);
    if (this.civil) this.ring.visible = false;
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), new THREE.MeshBasicMaterial({ map: BLOB_TEX, transparent: true, depthWrite: false, opacity: 0.85 }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.position.y = 0.03; this.blob.renderOrder = 1; this.root.add(this.blob);
    this.stars = new THREE.Group(); this.stars.visible = false; scene.add(this.stars);
    for (let i = 0; i < 4; i++) {
      const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), new THREE.MeshBasicMaterial({ color: 0xffe14a }));
      const a = i / 4 * Math.PI * 2; st.position.set(Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38); this.stars.add(st);
    }
    this.root.traverse(o => { if (o.isMesh && o !== this.ring) o.castShadow = true; });
    this.flashMats = [this.shirtMat, this.skinMat].concat(this.vestMat ? [this.vestMat] : []);
  }
  buildLabel() {
    const el = document.createElement('div'); el.className = 'flabel ' + (this.civil ? 'npc' : (this.team === 0 ? 'blue' : 'red')) + (this.isPlayer ? ' me' : '') + (this.pid === 2 ? ' p2' : '');
    el.innerHTML = `<div class="fname">${this.isPlayer ? '★ ' + this.name + (TWO_P ? ' (J' + this.pid + ')' : ' (vos)') : this.name}</div><div class="fbar"><div></div></div><div class="bark"></div>`;
    labelsEl.appendChild(el);
    this.label = el; this.labelBar = el.querySelector('.fbar div'); this.barkEl = el.querySelector('.bark'); this.barkT = 0;
  }
  destroy() { if (this.root.parent) this.root.parent.remove(this.root); if (this.stars.parent) this.stars.parent.remove(this.stars); this.label.remove(); this.weapon = null; }
  get alive() { return this.state !== 'ko'; }
  get airborne() { return this.pos.y > 0.001; }
  get forward() { return { x: Math.sin(this.facing), z: Math.cos(this.facing) }; }
  canAct() { return (this.state === 'normal' || this.state === 'block') && gameState === 'fight' && !this.airborne && !(this.hypeT > 0); }
  say(text, time, force) {
    if (!force && !this.isPlayer && (gameState === 'fight' || gameState === 'roundEnd')) { if (worldT - lastSayT < 0.9) return; lastSayT = worldT; }
    this.barkEl.textContent = text; this.barkEl.style.opacity = 1; this.barkT = time || 2.2; }
  setState(s) { this.state = s; this.stateTime = 0; }

  // ---------- acciones ----------
  doLight() {
    if (this.state === 'grab') return this.grabInput('knee');
    if (this.state === 'held') { this.escape += 0.2; return; }
    if (this.state === 'attack') { if (this.attack.t > this.attack.def.hitAt) this.buffer = 'light'; return; }
    if (!this.canAct()) return;
    const downed = this.findDowned();
    if (downed) return this.startAttack('stomp', downed);
    if (this.weapon) { if (this.weapon.def.throwable) return this.doThrow(); return this.startAttack('swing'); }
    // v12: rival a media distancia y adelante: paso largo y jab (movimiento capturado)
    if (!(this.comboTimer > 0) && !this.running && this.nearFoe) {
      const e = this.nearFoe(3.3);
      if (e) { const d = Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z), ang = Math.abs(angDiff(this.facing, Math.atan2(e.pos.x - this.pos.x, e.pos.z - this.pos.z)));
        if (d > 1.9 && ang < 0.7) return this.startAttack('stepjab', e); }
    }
    this.comboStep = this.comboTimer > 0 ? (this.comboStep + 1) % 3 : 0;
    this.startAttack(['jab', 'cross', 'hook'][this.comboStep]);
  }
  doHeavy() {
    if (this.state === 'grab') return this.grabInput('toss');
    if (this.state === 'held') { this.escape += 0.2; return; }
    if (this.state === 'attack') { if (this.attack.t > this.attack.def.hitAt) this.buffer = 'heavy'; return; }
    if (!this.canAct()) return;
    if (this.rageTime > 0 && !this.findDowned()) return this.startAttack('flyknee');   // v12: en furia, rodilla voladora + piñas
    const downed = this.findDowned();
    if (downed) return this.startAttack('groundkick', downed);
    if (this.running && this.curSpeed > 5) return this.startAttack('dropkick');
    this.startAttack('kick');
  }
  doThrow() { if (!this.canAct() || !this.weapon) return; this.startAttack('throw'); }
  doGrab() {
    if (!this.canAct()) return;
    let best = null, bd = 1.7;
    for (const p of pickups) { const d = Math.hypot(p.x - this.pos.x, p.z - this.pos.z); if (d < bd) { bd = d; best = p; } }
    if (this.weapon) { this.dropWeapon(); if (!best) return; }
    if (best) { removePickup(best); this.equip(best.key, best.mesh, best.dur); this.startAttack('pickup'); sfx('pickup'); }
  }
  // ---------- agarre (estilo Warriors) ----------
  doClinch() {
    if (this.state === 'held') { this.escape += 0.2; return; }
    if (!this.canAct()) return;
    if (this.weapon && !this.weapon.def.throwable) { this.dropWeapon(); }
    let best = null, bd = 1.55;
    for (const e of fighters) {
      if (e.team === this.team || e.spectator || e.team < 0 || !e.alive || e.airborne || e.invuln > 0) continue;
      if (!(e.state === 'normal' || e.state === 'hit' || e.state === 'block' || e.state === 'attack')) continue;
      if (e.attack && e.attack.type === 'dropkick') continue;
      const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > bd || Math.abs(angDiff(this.facing, Math.atan2(dx, dz))) > 1.15) continue;
      bd = d; best = e;
    }
    if (!best) { this.startAttack('grabmiss'); return; }
    if (best.state === 'grab') best.releaseGrab();
    this.facing = Math.atan2(best.pos.x - this.pos.x, best.pos.z - this.pos.z);
    this.setState('grab'); this.held = best; this.grabT = 0; this.grabHits = 0; this.grabAct = null; this.attack = null; this.buffer = null;
    best.setState('held'); best.holder = this; best.attack = null; best.buffer = null; best.escape = 0; best.knock.set(0, 0);
    if (best.weapon && !best.weapon.def.throwable && Math.random() < 0.5) best.dropWeapon();
    sfx('grab', distVol(this.pos.x, this.pos.z));
    if (Math.random() < 0.6) this.say(pick(['¡Te tengo!', '¡Lo tengo! ¡Pegale!', '¡Vení para acá!']), 1.4, true);
    npcNotify(this.pos, 1);
  }
  grabInput(type) {
    if (this.grabAct || !this.held) return;
    this.grabAct = type === 'toss' ? { type, t: 0, hitAt: 0.24, dur: 0.55, done: false } : { type, t: 0, hitAt: 0.13, dur: 0.33, done: false };
    if (type === 'toss') sfx('swing');
  }
  grabStrike(type) {
    const h = this.held; if (!h) return;
    const mult = this.dmgMult * (this.rageTime > 0 ? 1.5 : 1);
    if (type === 'knee') {
      this.grabHits++;
      if (this.grabHits >= 3) { this.releaseGrab(true); hitFighter(this, h, 11 * mult, 8, true, 0, null, { unblock: true }); }
      else hitFighter(this, h, 6 * mult, 0, false, 0, null, { held: true });
    } else {
      this.releaseGrab(true);
      hitFighter(this, h, 14 * mult, 12, true, 0, null, { unblock: true, flip: Math.random() < 0.5 });
    }
  }
  releaseGrab(quiet) {
    const h = this.held; this.held = null; this.grabAct = null;
    if (this.state === 'grab') this.setState('normal');
    if (h && h.state === 'held' && h.holder === this) { h.holder = null; h.setState('hit'); h.stun = 0.2; if (!quiet) h.invuln = 0.35; }
    else if (h && h.holder === this) h.holder = null;
  }
  breakFree() {
    const h = this.held; if (!h) return;
    this.releaseGrab();
    const dx = h.pos.x - this.pos.x, dz = h.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    h.knock.x = dx / d * 5; h.knock.y = dz / d * 5; this.knock.x = -dx / d * 3; this.knock.y = -dz / d * 3;
    this.setState('hit'); this.stun = 0.35;
    sfx('block', distVol(h.pos.x, h.pos.z));
    h.say(pick(['¡Soltame!', '¡Salí de acá!', '¡Ni en pedo!']), 1.2, true);
  }
  doRage() {
    if (this.rage >= 100 && this.rageTime <= 0 && this.alive && this.state !== 'down') {
      // v8: primero se calienta (cachetada propia, golpes en el pecho, grito); recién después entra en furia.
      // Durante esos 0,9 s es vulnerable: hay que elegir el momento.
      this.rage = 0; this.hypeT = 0.9; this.hypeFx = 0; this.moveX = this.moveZ = 0;
      this.say(pick(['¡Ahora sí me calenté!', '¡Vengan de a uno!', '¡ESTOY RE SACADO!', '¡Ahora van a ver!']), 2);
    }
  }
  equip(key, mesh, dur) {
    const def = WEAPONS[key];
    mesh.rotation.set(0, 0, 0); mesh.position.set(0, def.up ? -0.05 : 0.02, 0);
    this.hand.add(mesh);
    this.weapon = { key, def, mesh, dur };
  }
  dropWeapon() {
    if (!this.weapon) return;
    const w = this.weapon; this.weapon = null;
    this.hand.remove(w.mesh);
    const f = this.forward;
    return spawnPickupFromMesh(w.key, w.mesh, clamp(this.pos.x + f.x * 0.8, -BOUNDS.x, BOUNDS.x), clamp(this.pos.z + f.z * 0.8, -BOUNDS.z, BOUNDS.z), w.dur);
  }
  breakWeapon() {
    const w = this.weapon; if (!w) return;
    this.weapon = null; this.hand.remove(w.mesh);
    const hp = this.handPos();
    spawnParticles(hp, w.def.chips || 0xc49a5a, 16, 4.5, 0.9, 0.09);
    spawnParticles(hp, 0xffffff, 6, 3, 0.25, 0.05);
    sfx('break', distVol(this.pos.x, this.pos.z));
    popText(hp, '¡SE ROMPIÓ!', 'warn', 1.1);
    this.say(pick(BREAK_LINES), 1.8);
    this.ai.handsOnly = true;
  }
  findDowned() {
    for (const e of fighters) {
      if (e.team === this.team || e.spectator || e.state !== 'down' || e.airborne) continue;
      if (Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) < 2.0) return e;
    }
    return null;
  }
  startAttack(type, target) {
    let def = ATK[type];
    if (type === 'swing' && this.weapon && this.weapon.def.spd) def = Object.assign({}, def, { dur: def.dur * this.weapon.def.spd, hitAt: def.hitAt * this.weapon.def.spd });
    this.setState('attack');
    this.attack = { type, def, t: 0, hit: false, stab: type === 'swing' && this.weapon && this.weapon.key === 'cuchillo' };
    this.buffer = null;
    let tgt = target || null;
    if (!tgt && type !== 'pickup') {
      let bd = type === 'throw' ? 16 : type === 'dropkick' ? 6 : 4.2;
      for (const e of fighters) {
        if (e.team === this.team || e.spectator || !e.alive || e.state === 'down') continue;
        const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.hypot(dx, dz);
        const a = Math.abs(angDiff(this.facing, Math.atan2(dx, dz)));
        if (d < bd && a < (type === 'throw' ? 0.9 : 1.9)) { bd = d; tgt = e; }
      }
    }
    if (tgt) this.facing = Math.atan2(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z);
    this.attack.tgt = tgt;
    const f = this.forward;
    if (type === 'jab' || type === 'cross' || type === 'hook' || type === 'swing') { this.knock.x += f.x * 3; this.knock.y += f.z * 3; }
    if (type === 'dropkick') { this.vy = 5.6; this.knock.x = f.x * 10; this.knock.y = f.z * 10; sfx('jump'); this.say(pick(['¡AAAAH!', '¡TOMÁ ESTA!', '¡VOLADORA!']), 1); }
    if (type === 'swing' || type === 'kick') sfx('swing');
  }
  performHit() {
    const a = this.attack, t = a.type;
    if (t === 'throw') { this.releaseThrow(); return true; }
    if (t === 'pickup') return true;
    let range = a.def.range, dmg = a.def.dmg, kb = a.def.kb, knockdown = !!a.def.knockdown, stun = a.def.stun || 0.35, flip = !!a.def.flip;
    if (t === 'swing' && this.weapon) {
      const w = this.weapon.def; range = w.range; dmg = w.dmg;
      knockdown = !!w.heavy || Math.random() < (w.kd || 0) || (this.comboTimer > 0 && Math.random() < 0.25);
      if (knockdown) { kb = this.weapon.key === 'escape' ? 11 : 8.5; flip = this.weapon.key === 'escape' && Math.random() < 0.5; }
    }
    if (t === 'grabmiss') return true;
    const cands = [];
    for (const e of fighters) {
      if (e.team === this.team || e.spectator || e.team < 0 || !e.alive || e.invuln > 0) continue;
      if (a.def.onDowned ? (e.state !== 'down' || e.airborne || e.downHits >= 2) : (e.state === 'down' || e.state === 'getup')) continue;
      const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > range + 0.3) continue;
      const ang = Math.abs(angDiff(this.facing, Math.atan2(dx, dz)));
      if (ang > a.def.arc && d > 0.7) continue;
      cands.push({ e, d: d + ang * 0.6 });
    }
    cands.sort((p, q) => p.d - q.d);
    const maxT = t === 'swing' ? (this.weapon && this.weapon.def.heavy ? 3 : 2) : t === 'dropkick' ? 2 : 1;
    const landed = cands.length > 0;
    const mult = this.dmgMult * (this.rageTime > 0 ? 1.5 : 1);
    for (const cnd of cands.slice(0, maxT)) hitFighter(this, cnd.e, dmg * mult, kb, knockdown, stun, t === 'swing' ? this.weapon : null, { flip });
    if (landed && t === 'swing' && this.weapon) {
      this.weapon.dur--;
      if (this.weapon.dur <= 0) this.breakWeapon();
    }
    if (landed && t === 'dropkick') { this.knock.x *= -0.25; this.knock.y *= -0.25; }
    if (!landed && (t === 'jab' || t === 'cross' || t === 'hook')) sfx('swing', 0.6);
    return landed;
  }
  releaseThrow() {
    if (!this.weapon) return;
    const w = this.weapon; this.weapon = null;
    this.hand.remove(w.mesh);
    const start = this.handPos(); start.y = Math.max(start.y, 1.6);
    w.mesh.position.copy(start); scene.add(w.mesh);
    const f = this.forward, sp = 17;
    projectiles.push({ key: w.key, def: w.def, mesh: w.mesh, dur: w.dur - 1, owner: this, team: this.team, vx: f.x * sp, vy: 3.2, vz: f.z * sp, spin: rand(8, 14) });
    sfx('throw');
  }
  chest() { return new THREE.Vector3(this.pos.x, this.pos.y + (this.state === 'down' || this.state === 'ko' ? 0.35 : 1.4), this.pos.z); }
  handPos() { const v = new THREE.Vector3(); this.hand.getWorldPosition(v); return v; }

  // ---------- recibir daño ----------
  takeHit(att, dmg, kb, knockdown, stun, opts) {
    opts = opts || {};
    const dx = this.pos.x - att.pos.x, dz = this.pos.z - att.pos.z, d = Math.hypot(dx, dz) || 1;
    const toAtt = Math.atan2(-dx, -dz);
    // si me pegan mientras tengo a alguien agarrado, lo suelto
    if (this.state === 'grab' && !opts.held) this.releaseGrab();
    // al agarrado: los compañeros del que agarra pegan +35% y no lo sueltan con golpes chicos
    if (this.state === 'held' && !opts.held) {
      const h = this.holder;
      if (h && h.team === att.team && att !== h) dmg *= 1.35;
      if (knockdown || this.hp - dmg <= 0) { if (h) h.releaseGrab(true); }
      else { this.hp -= dmg; this.flash = 0.1; this.hitShakeT = 0.16; this.rage = Math.min(100, this.rage + dmg * 0.9); return 'hit'; }
    }
    if (opts.held) {
      this.hp -= dmg; this.flash = 0.1; this.hitShakeT = 0.16; this.rage = Math.min(100, this.rage + dmg * 0.9);
      if (this.hp > 0) return 'hit';
      if (this.holder) this.holder.releaseGrab(true);
    }
    const blocking = this.state === 'block' && Math.abs(angDiff(this.facing, toAtt)) < 1.2;
    if (blocking && !opts.flip && !opts.unblock) {
      this.hp = Math.max(1, this.hp - dmg * 0.15);
      this.knock.x += dx / d * 3; this.knock.y += dz / d * 3;
      this.rage = Math.min(100, this.rage + 4);
      return 'block';
    }
    if (!opts.held) this.hp -= dmg;
    this.flash = 0.1; this.hitShakeT = 0.18;
    // anti-stunlock: el 5º golpe seguido sin recuperarse lo tira al piso (y deja de ser una trampa)
    if (!knockdown && this.state === 'hit' && this.stateTime < this.stun + 0.25) { this.chain++; if (this.chain >= 5) { knockdown = true; kb = Math.max(kb, 7); } }
    else if (this.state !== 'down') this.chain = 1;
    this.rage = Math.min(100, this.rage + dmg * 0.9);
    if (this.weapon && (knockdown || Math.random() < 0.2)) this.dropWeapon();
    this.attack = null; this.buffer = null;
    const fromBehind = Math.abs(angDiff(this.facing, toAtt)) > Math.PI / 2;
    if (this.state !== 'down') {
      this.fallSign = fromBehind ? -1 : 1;
      if (!fromBehind) this.facing = toAtt;
    }
    this.hitVar = Math.random() < 0.5 ? -1 : 1;
    const launch = (big) => { this.vy = big ? rand(6, 7.2) : rand(3.2, 4.2); this.flip = !!opts.flip || (big && Math.random() < 0.35); };
    if (this.hp <= 0) {
      this.hp = 0; if (this.held) this.releaseGrab(true); this.setState('ko');
      this.knock.x = dx / d * Math.max(kb, 9); this.knock.y = dz / d * Math.max(kb, 9);
      launch(true); if (opts.flip || Math.random() < 0.5) this.flip = true;
      if (Math.random() < 0.6) this.say(pick(KO_LINES), 2.5);
      return 'ko';
    }
    if (this.state === 'down') { this.downHits++; this.stateTime = Math.min(this.stateTime, 0.7); if (!this.airborne) this.vy = 1.8; return 'hit'; }
    if (knockdown) { this.chain = 0; this.downHits = 0; this.setState('down'); this.knock.x = dx / d * kb; this.knock.y = dz / d * kb; launch(kb >= 10); return 'down'; }
    this.setState('hit'); this.stun = stun; this.knock.x = dx / d * kb; this.knock.y = dz / d * kb;
    return 'hit';
  }

  // ---------- update ----------
  update(dt) {
    this.stateTime += dt;
    this.comboTimer -= dt; this.flash -= dt; if (this.invuln > 0) this.invuln -= dt;
    if (this.rageTime > 0) this.rageTime -= dt;
    if (this.barkT > 0) { this.barkT -= dt; if (this.barkT <= 0) this.barkEl.style.opacity = 0; }
    const spMult = this.rageTime > 0 ? 1.2 : 1;
    const canMove = gameState === 'fight' || gameState === 'walkin' || gameState === 'historia';   // v41: en el barrio del modo historia también se camina
    let vx = 0, vz = 0;
    switch (this.state) {
      case 'normal': {
        if (this.blockHeld && gameState === 'fight') { this.setState('block'); break; }
        const m = Math.hypot(this.moveX, this.moveZ);
        if (m > 0.05 && canMove && !this.airborne) {
          const sp = this.swagger ? 2.9 : (this.running ? 7.4 : 4.3) * spMult * (0.82 + 0.18 * this.st.spd);
          vx = this.moveX / Math.max(1, m) * sp; vz = this.moveZ / Math.max(1, m) * sp;
          const foe = !(this.isPlayer && V30.free) && !this.running && !this.civil && !this.swagger && gameState === 'fight' ? this.nearFoe(3.2) : null;
          if (foe) { vx *= 0.78; vz *= 0.78; this.facing += angDiff(this.facing, Math.atan2(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z)) * Math.min(1, dt * 10); }
          else this.facing += angDiff(this.facing, Math.atan2(vx, vz)) * Math.min(1, dt * 12);
        }
        break;
      }
      case 'block': {
        if (!this.blockHeld) { this.setState('normal'); break; }
        const m = Math.hypot(this.moveX, this.moveZ);
        if (m > 0.05) { vx = this.moveX / m * 1.6; vz = this.moveZ / m * 1.6; }
        break;
      }
      case 'attack': {
        const a = this.attack;
        a.t += dt * spMult * (1 + (this.st.spd - 1) * 0.6);
        if (!a.hit && a.t >= a.def.hitAt && (!a.def.hitEnd || a.t <= a.def.hitEnd)) { const ok = this.performHit(); if (!a.def.multi || ok) a.hit = true; }
        if (this.state === 'attack' && a.t >= a.def.dur && !this.airborne) {
          this.setState('normal'); this.attack = null;
          this.comboTimer = 0.45;
          const b = this.buffer; this.buffer = null;
          if (b === 'light') this.doLight(); else if (b === 'heavy') this.doHeavy();
          else if (!this.isPlayer && this.ai.comboLeft > 0) { this.ai.comboLeft--; this.doLight(); }
        }
        break;
      }
      case 'hit': if (this.stateTime > this.stun) this.setState('normal'); break;
      case 'down': if (this.stateTime > 1.45 && !this.airborne) this.setState('getup'); break;
      case 'getup': if (this.stateTime > 0.85) { this.setState('normal'); this.invuln = 0.45; this.downHits = 0; } break;
      case 'grab': {
        const h = this.held;
        if (!h || h.state !== 'held' || h.holder !== this || !this.alive) { this.releaseGrab(true); break; }
        this.grabT += dt;
        const fw = this.forward;
        { const k5 = 1 - Math.exp(-dt * (this.grabT < 0.3 ? 9 : 14));   // lo arrastra en ~0,3 s, sin saltos
          h.pos.x += (this.pos.x + fw.x * 0.8 - h.pos.x) * k5; h.pos.z += (this.pos.z + fw.z * 0.8 - h.pos.z) * k5;
          h.facing += angDiff(h.facing, this.facing + Math.PI) * k5; h.knock.set(0, 0); }
        if (this.grabAct) {
          const g = this.grabAct; g.t += dt;
          if (!g.done && g.t >= g.hitAt) { g.done = true; this.grabStrike(g.type); }
          if (this.grabAct && g.t >= g.dur) this.grabAct = null;
        } else if (h.escape >= 1 || this.grabT > 3.0) this.breakFree();
        break;
      }
      case 'held': {
        if (!this.holder || this.holder.state !== 'grab' || this.holder.held !== this) { this.holder = null; this.setState('normal'); this.invuln = 0.3; break; }
        if (!this.isPlayer || AUTO) this.escape += dt * (0.32 + Math.random() * 0.2);
        break;
      }
    }
    // física: saltos, vuelos, rebotes
    if (this.airborne || this.vy > 0) {
      this.vy -= 24 * dt; this.pos.y += this.vy * dt;
      if (this.pos.y <= 0) {
        this.pos.y = 0;
        const lying = this.state === 'down' || this.state === 'ko';
        if (lying && this.vy < -4.5) {
          this.vy = -this.vy * 0.3; this.flip = false;
          spawnDust(this.pos.x, this.pos.z, 7, true); sfx('thud', distVol(this.pos.x, this.pos.z));
          shake(this.isPlayer ? 0.3 : 0.1);
        } else {
          this.vy = 0; this.flip = false;
          if (lying) spawnDust(this.pos.x, this.pos.z, 3);
          if (this.attack && this.attack.type === 'dropkick') { spawnDust(this.pos.x, this.pos.z, 4); this.knock.x *= 0.2; this.knock.y *= 0.2; }
        }
      }
    }
    this.pos.x += (vx + this.knock.x) * dt;
    this.pos.z += (vz + this.knock.y) * dt;
    const decay = Math.exp(-dt * (this.airborne ? 1.2 : (this.state === 'down' || this.state === 'ko') ? 5 : 7)); this.knock.x *= decay; this.knock.y *= decay;
    this.curSpeed = Math.hypot(vx, vz);
    { const bx = this.pos.x, bz = this.pos.z; collideObstacles(this.pos, 0.4); if (Math.hypot(this.pos.x - bx, this.pos.z - bz) > 1e-4 && this.onObstacle) this.onObstacle(bx, bz); }
    if (!this.noClamp) { this.pos.x = clamp(this.pos.x, -BOUNDS.x, BOUNDS.x); this.pos.z = clamp(this.pos.z, -BOUNDS.z, BOUNDS.z); }
    this.animate(dt);
  }

  // ---------- animación por articulaciones ----------
  animate(dt) {
    const s = this.state, c = this.cfg;
    this.idleT += dt;
    const P = { lL: 0, lR: 0, kL: 0.08, kR: 0.08, lLz: -0.03, lRz: 0.03, aL: 0.05, aR: 0.05, aLz: -0.1, aRz: 0.1, eL: -0.2, eR: -0.2, tX: 0, tY: 0, tZ: 0, hX: 0, hY: 0, hipY: 0, rX: 0 };
    const stance = () => {
      const b = Math.sin(this.idleT * 5.5);
      P.lL = -0.34; P.kL = 0.4; P.lR = 0.2; P.kR = 0.46; P.lLz = -0.07; P.lRz = 0.07;
      P.hipY = -0.08 + b * 0.012;
      P.tX = 0.12 + Math.sin(this.idleT * 2.4) * 0.025; P.tY = 0.28; P.hY = -0.26;
      P.aL = -0.95; P.eL = -1.8; P.aLz = 0.16; P.aR = -0.75; P.eR = -2.05; P.aRz = -0.2;
      if (this.weapon) { P.aR = -0.35; P.eR = -1.0; P.aRz = 0.05; }
      const tw = this.tiredness ? this.tiredness() : 0;   // v5
      if (tw > 0) { const br = Math.sin(this.idleT * (5.5 + 3.5 * tw)); P.aL += 0.45 * tw; P.aR += 0.4 * tw; P.eL += 0.35 * tw; P.eR += 0.3 * tw;
        P.tX += 0.14 * tw + br * 0.035 * tw; P.hX += 0.1 * tw + br * 0.03 * tw; P.hipY += br * 0.02 * tw - 0.03 * tw; }
    };
    const relaxed = () => {
      const br = Math.sin(this.idleT * 2.2);
      P.tX = 0.02 + br * 0.015; P.aL = 0.08; P.aR = 0.08; P.eL = -0.25; P.eR = -0.25; P.aLz = -0.12 + br * 0.01; P.aRz = 0.12 - br * 0.01;
      P.hY = Math.sin(this.idleT * 0.6) * 0.3;
    };
    if (s === 'normal' || s === 'block') {
      const sp = this.curSpeed;
      if (sp > 0.3) {
        this.walkPhase += dt * (sp * 1.75 + 1.6);
        const run = sp > 5.5, A = run ? 0.9 : this.swagger ? 0.5 : 0.58;
        const sn = Math.sin(this.walkPhase), cs = Math.cos(this.walkPhase);
        P.lL = -sn * A; P.lR = sn * A;
        P.kL = 0.1 + Math.max(0, cs) * A * 1.7; P.kR = 0.1 + Math.max(0, -cs) * A * 1.7;
        P.aL = sn * A * 0.85; P.aR = -sn * A * 0.85; P.eL = P.eR = run ? -1.45 : -0.35;
        P.aLz = -0.1; P.aRz = 0.1;
        P.tX = run ? 0.3 : 0.06; P.tY = sn * (this.swagger ? 0.2 : 0.12); P.hY = -P.tY * 0.6;
        P.hipY = -Math.abs(sn) * 0.05 - (run ? 0.06 : 0);
        if (this.swagger) { P.aLz = -0.22; P.aRz = 0.22; P.tZ = sn * 0.05; }
        if (this.weapon && !run) { P.aR = -0.3 - sn * 0.15; P.eR = -0.8; }
      } else if (this.civil) relaxed();
      else if (gameState === 'roundEnd' && this.team === lastWinner) {
        const pump = Math.abs(Math.sin(this.idleT * 7));
        P.aL = -2.85 + pump * 0.25; P.aR = -2.85 + pump * 0.25; P.eL = P.eR = -0.25 - pump * 0.4; P.aLz = -0.25; P.aRz = 0.25;
        P.hipY = pump * 0.06; P.hX = -0.3; P.kL = P.kR = 0.15;
      } else if (gameState === 'house' || gameState === 'walkin' || gameState === 'historia' || (gameState !== 'intro' && !(this.foeNear5 && this.foeNear5()))) {   // v42: guardia sólo con un rival cerca
        relaxed(); P.aLz = -0.18; P.aRz = 0.18; P.tX = -0.04;
        if (this.idleVariant) this.idleVariant(P); else if (this.idx % 2) { P.aL = -0.55; P.eL = -2.2; P.aR = -0.6; P.eR = -2.0; P.aLz = 0.55; P.aRz = -0.55; } // brazos cruzados
        if (this.weapon) { P.aR = -0.25; P.eR = -1.1; P.aRz = 0.05; }
      } else stance();
      if (s === 'block') { stance(); P.aL = P.aR = -1.25; P.eL = P.eR = -2.35; P.aLz = 0.42; P.aRz = -0.42; P.tX = 0.32; P.hX = 0.35; P.tY = 0.05; P.hY = 0; P.hipY = -0.13; P.kL = P.kR = 0.55; }
    } else if (s === 'attack') {
      stance();
      const a = this.attack, f = a.t / a.def.dur, hf = a.def.hitAt / a.def.dur;
      const u = Math.min(1, f / hf), r = f > hf ? (f - hf) / (1 - hf) : 0;
      const k = f < hf ? Math.sin(u * Math.PI / 2) : 1 - r;
      switch (a.type) {
        case 'jab': P.aL = lerp(-0.95, -1.55, k); P.eL = lerp(-1.8, -0.06, k); P.aLz = lerp(0.16, 0.04, k); P.tY = 0.28 + 0.3 * k; P.lL = -0.5; P.kL = 0.48; P.hipY = -0.1; break;
        case 'cross': P.aR = lerp(-0.75, -1.55, k); P.eR = lerp(-2.05, -0.06, k); P.aRz = lerp(-0.2, -0.05, k); P.tY = lerp(0.28, -0.6, k); P.hY = lerp(-0.26, 0.35, k); P.lR = 0.35 * k; P.kR = 0.3; break;
        case 'hook':
          P.aR = -0.45; P.eR = -1.6; P.aRz = 0.2 + 1.15 * (f < hf ? Math.sin(u * Math.PI / 2) : 1 - r);
          P.tY = f < hf ? 0.28 + 0.5 * Math.sin(u * Math.PI) - 1.1 * u * u * u : lerp(-0.82, 0.28, r);
          P.hY = -P.tY * 0.5; P.hipY = -0.12; P.kL = 0.55; P.kR = 0.55; P.tZ = -0.1 * k; break;
        case 'kick':
          if (f < hf) { P.lR = lerp(0.2, -1.55, u); P.kR = u < 0.6 ? lerp(0.46, 2.0, u / 0.6) : lerp(2.0, 0.05, (u - 0.6) / 0.4); }
          else { P.lR = lerp(-1.55, 0.2, r); P.kR = lerp(0.05, 0.46, r); }
          P.lL = 0.08; P.kL = 0.18; P.tX = -0.38 * k; P.tY = 0.1;
          P.aL = -0.8; P.eL = -1.7; P.aLz = 0.35; P.aR = 0.35; P.eR = -0.6; P.aRz = 0.55; break;
        case 'dropkick':
          if (this.airborne || f < 0.55) { P.lL = -1.45; P.lR = -1.55; P.kL = 0.15; P.kR = 0.05; P.tX = -1.0; P.hX = 0.5; P.aL = 0.7; P.aR = 0.7; P.eL = P.eR = -0.4; P.aLz = -0.7; P.aRz = 0.7; P.tY = 0; P.hY = 0; P.rX = -0.25; }
          else { const g = (f - 0.55) / 0.45; P.hipY = -0.4 * (1 - g); P.lL = P.lR = -1.0 * (1 - g); P.kL = P.kR = 1.6 * (1 - g) + 0.3; P.tX = 0.5 * (1 - g); P.aL = P.aR = -0.6; }
          break;
        case 'groundkick': {   // v6: atrás con la rodilla doblada, barrido bajo hacia adelante, empeine estirado
          const w1 = smooth(clamp(f / (hf * 0.55), 0, 1)), w2 = smooth(clamp((f - hf * 0.55) / (hf * 0.45), 0, 1)), w3 = smooth(clamp((f - hf) / (1 - hf), 0, 1));
          P.lR = lerp(lerp(0.2, 0.75, w1), -0.95, w2) * (1 - w3) + 0.2 * w3;
          P.kR = lerp(lerp(0.46, 1.5, w1), 0.25, w2) * (1 - w3) + 0.46 * w3;
          this.footPoint = [0, (0.5 * w1 + 0.9 * w2) * (1 - w3)];
          P.lL = -0.12; P.kL = 0.32; P.tX = 0.18 - 0.22 * w2 * (1 - w3); P.hX = 0.45; P.tY = -0.25 * w2 * (1 - w3);
          P.aL = -0.6 + 0.5 * w2; P.eL = -1.2; P.aLz = 0.45; P.aR = 0.35 * w2; P.eR = -0.5; P.aRz = 0.55; P.hipY = -0.03; break;
        }
        case 'stomp':
          if (f < hf) { P.lR = lerp(0.2, -1.15, Math.sin(u * Math.PI / 2)); P.kR = lerp(0.46, 1.7, u); }
          else { P.lR = -0.25; P.kR = 0.2; }
          P.tX = 0.45; P.hX = 0.45; P.tY = 0; P.hY = 0; P.aL = -0.3; P.aR = -0.3; P.aLz = -0.55; P.aRz = 0.55; P.eL = P.eR = -0.6; break;
        case 'swing':
          if (a.stab) { P.aR = lerp(-0.4, -1.5, k); P.eR = lerp(-1.6, -0.05, k); P.aRz = -0.05; P.tY = lerp(0.3, -0.55, k); P.lL = -0.55; P.kL = 0.5; break; }
          // v6: el golpe sale de la cadera: carga girando el torso hacia atrás, baja con el peso y acompaña
          if (f < hf * 0.7) { const w = smooth(f / (hf * 0.7)); P.aR = lerp(-0.35, -2.9, w); P.eR = lerp(-1.0, -1.5, w); P.tX = lerp(0.12, -0.12, w); P.tY = lerp(0.28, 0.75, w); P.tZ = 0.1 * w; P.hY = -0.35 * w; P.aL = lerp(-0.95, -0.55, w); P.aLz = 0.5; }
          else if (f < hf) { const w = smooth((f - hf * 0.7) / (hf * 0.3)); P.aR = lerp(-2.9, -0.6, w); P.eR = lerp(-1.5, -0.1, w); P.tX = lerp(-0.12, 0.45, w); P.tY = lerp(0.75, -0.55, w); P.tZ = lerp(0.1, -0.08, w); P.hipY = -0.1 * w; P.hY = lerp(-0.35, 0.2, w); }
          else { P.aR = lerp(-0.6, -0.35, r); P.eR = lerp(-0.1, -1.0, r); P.tX = lerp(0.45, 0.12, smooth(r)); P.tY = lerp(-0.55, 0.28, smooth(r)); P.tZ = lerp(-0.08, 0, r); P.hipY = -0.1 * (1 - r); }
          P.aRz = 0.05; P.lL = -0.55; P.kL = 0.55; P.hipY = -0.12; break;
        case 'throw':
          if (f < hf) { P.aR = lerp(-0.6, -2.9, u); P.eR = lerp(-1.0, -1.7, u); P.tY = 0.65; P.tX = -0.2; }
          else { P.aR = lerp(-1.4, -0.4, r); P.eR = -0.15; P.tY = -0.45; P.tX = 0.32; }
          P.aRz = 0.1; P.lL = -0.55; P.kL = 0.45; break;
        case 'pickup': { const sw = Math.sin(f * Math.PI); P.hipY = -0.42 * sw; P.lL = P.lR = -1.15 * sw - 0.1; P.kL = P.kR = 1.95 * sw + 0.2; P.tX = 0.75 * sw; P.aR = -1.05 * sw - 0.2; P.eR = -0.3; P.hX = 0.3 * sw; P.tY = 0; P.hY = 0; break; }
      }
    } else if (s === 'grab') {
      stance(); P.aL = P.aR = -1.3; P.eL = P.eR = -0.85; P.aLz = 0.32; P.aRz = -0.32; P.tX = 0.24; P.tY = 0; P.hY = 0;
      const g = this.grabAct;
      if (g) {
        const k = Math.sin(Math.min(1, g.t / g.dur) * Math.PI);
        if (g.type === 'knee') { P.lR = -1.55 * k; P.kR = 1.7 * k; P.tX = 0.38 + 0.25 * k; P.hipY = 0.05 * k; }
        else { P.tY = -1.5 * k; P.tX = 0.1 + 0.2 * k; P.aL = P.aR = -1.0 - 0.7 * k; P.lL = -0.4 * k; P.kL = 0.5 * k; }
      }
    } else if (s === 'held') {
      stance(); const w = Math.sin(this.idleT * 13) * 0.1;
      P.tX = this.flash > 0 ? 0.6 : 0.38; P.tY = w; P.tZ = Math.sin(this.idleT * 9) * 0.08; P.aL = P.aR = -0.45; P.eL = P.eR = -1.7; P.aLz = 0.55; P.aRz = -0.55;
      P.hX = this.flash > 0 ? 0.15 : 0.32; P.kL = P.kR = 0.35; P.lL = P.lR = -0.15; P.hipY = -0.06;
    } else if (s === 'hit') {
      const e = clamp(1 - this.stateTime / Math.max(0.1, this.stun), 0, 1);
      stance();
      P.tX = lerp(P.tX, -0.5, e); P.tY = lerp(P.tY, 0.4 * this.hitVar, e); P.hX = -0.55 * e; P.hY = 0.3 * this.hitVar * e;
      P.aL = lerp(P.aL, 0.3, e); P.aR = lerp(P.aR, 0.3, e); P.aLz = lerp(P.aLz, -0.65, e); P.aRz = lerp(P.aRz, 0.65, e); P.eL = P.eR = -0.5;
      P.kL = P.kR = 0.4; P.hipY = -0.08;
    } else if (s === 'down' || s === 'ko') {
      P.rX = this.fallSign > 0 ? -Math.PI / 2 : Math.PI / 2;
      const sq = s === 'down' ? Math.sin(this.idleT * 3) * 0.12 : 0;
      P.aL = -0.4 + sq; P.aR = 0.25; P.aLz = -1.25; P.aRz = 1.15 - sq; P.eL = -0.7; P.eR = -0.35;
      P.lL = -0.3; P.kL = 0.75 + sq; P.lR = 0.05; P.kR = 0.12; P.lLz = -0.16; P.lRz = 0.16;
      P.hY = s === 'ko' ? 0.7 : 0.2; P.hX = s === 'ko' ? -0.2 : 0.15;
      if (this.airborne) { P.aL = P.aR = -2.3; P.eL = P.eR = -0.6; P.aLz = -0.9; P.aRz = 0.9; P.kL = 0.9; P.kR = 0.4; P.lL = -0.5; }
    } else if (s === 'getup') {
      const g = clamp(this.stateTime / 0.55, 0, 1), e2 = 1 - Math.pow(1 - g, 2);
      P.rX = (this.fallSign > 0 ? -Math.PI / 2 : Math.PI / 2) * (1 - e2);
      P.hipY = -0.45 * (1 - g); P.lL = P.lR = -1.2 * (1 - g); P.kL = P.kR = 1.9 * (1 - g) + 0.2;
      P.tX = 0.5 * (1 - g); P.aL = P.aR = 0.4 * (1 - g); P.eL = P.eR = -0.3;
    }
    if (this.poseFn) this.poseFn(P, dt);
    if (this.postPose) this.postPose(P, dt);
    if (this.arrested && this.state !== 'down') { P.aL = P.aR = -2.5; P.eL = P.eR = -2.5; P.aLz = 0.35; P.aRz = -0.35; P.hX = 0.25; P.tX = 0.08; P.kL = P.kR = 0.15; P.lL = P.lR = 0; P.tY = 0; P.hY = 0; }
    this.P = P;
    // --- aplicar con suavizado ---
    // v4: el suavizado guarda su estado aparte (fkS) para que la capa de IK no se realimente.
    const L = 1 - Math.exp(-dt * 22), FS = this.fkS || (this.fkS = {});
    const sl = (k) => (FS[k] = FS[k] === undefined ? P[k] : lerp(FS[k], P[k], L));
    this.legs[0].rotation.set(sl('lL'), 0, sl('lLz')); this.legs[1].rotation.set(sl('lR'), 0, sl('lRz'));
    this.knees[0].rotation.set(sl('kL'), 0, 0); this.knees[1].rotation.set(sl('kR'), 0, 0);
    this.arms[0].rotation.set(sl('aL'), 0, sl('aLz')); this.arms[1].rotation.set(sl('aR'), 0, sl('aRz'));
    this.elbows[0].rotation.set(sl('eL'), 0, 0); this.elbows[1].rotation.set(sl('eR'), 0, 0);
    this.torso.rotation.set(sl('tX'), sl('tY'), sl('tZ'));
    this.head.rotation.set(sl('hX'), sl('hY'), 0);
    // cuerpo entero: caídas, volteretas
    const rig = this.rig;
    if (this.flip && this.airborne) rig.rotation.x -= this.fallSign * dt * 13;
    else {
      if (Math.abs(rig.rotation.x - P.rX) > Math.PI) rig.rotation.x = P.rX - angDiff(rig.rotation.x, P.rX);
      rig.rotation.x = lerp(rig.rotation.x, P.rX, 1 - Math.exp(-dt * (s === 'getup' ? 40 : (s === 'down' || s === 'ko') ? 9 : 16)));
    }
    const lying = Math.min(1, Math.abs(Math.sin(rig.rotation.x)));
    this.hipYs = lerp(this.hipYs || 0, P.hipY, L);
    rig.position.y = lerp(HIP * rig.scale.y + this.hipYs, 0.22, lying);
    this.root.position.copy(this.pos);
    if (this.hitShakeT > 0) { this.hitShakeT -= dt; const a = this.hitShakeT * 0.45; this.root.position.x += rand(-a, a); this.root.position.z += rand(-a, a); }
    this.root.rotation.y = this.facing;
    this.ikLayer(dt);
    this.blob.position.y = 0.03 - this.pos.y; this.blob.visible = this.pos.y < 2.5;
    { const k = clamp(1 - this.pos.y * 0.5, 0.3, 1) * (1 + lying * 0.5); this.blob.scale.set(k, k, k); this.blob.material.opacity = 0.85 * clamp(1 - this.pos.y * 0.45, 0.2, 1); }
    for (const m of this.flashMats) {
      if (this.flash > 0) { m.emissive.setRGB(1, 1, 1); m.emissiveIntensity = 0.7; }
      // v8: sin brillo rojo en la ropa durante la furia (lo muestra el cuerpo y, al jugador, el borde de la pantalla)
      else m.emissiveIntensity = 0;
    }
    this.ring.material.opacity = s === 'ko' ? 0.12 : this.invuln > 0 ? 0.25 + 0.3 * Math.sin(this.idleT * 30) : (this.isPlayer ? 0.95 : 0.55);
    this.ring.position.y = 0.07 - this.pos.y;
    if ((s === 'ko' || s === 'down') && !this.airborne) {
      this.stars.visible = true; this.head.getWorldPosition(this.stars.position); this.stars.position.y += 0.35;
      this.stars.rotation.y += dt * 5;
    } else this.stars.visible = false;
  }

  // ---------- IA ----------
  aiUpdate(dt) {
    const ai = this.ai;
    if (this.state === 'held') { this.moveX = this.moveZ = 0; return; }
    if (this.state === 'grab') {
      this.moveX = this.moveZ = 0; ai.grabCd = (ai.grabCd || 0.3) - dt;
      if (!this.grabAct && ai.grabCd <= 0) { ai.grabCd = rand(0.3, 0.55); this.grabInput(this.grabHits >= 2 || Math.random() < 0.22 ? 'toss' : 'knee'); }
      return;
    }
    ai.atkCd -= dt; ai.think -= dt; ai.barkCd -= dt;
    if (ai.blockT > 0) { ai.blockT -= dt; this.blockHeld = ai.blockT > 0; } else this.blockHeld = false;
    if (this.rage >= 100 && Math.random() < 0.01) this.doRage();
    if (ai.think <= 0) { ai.think = rand(0.25, 0.5); this.aiThink(); }
    let mx = 0, mz = 0, run = false;
    const followMode = this.team === player.team && teamCommand === 'follow' && player.alive && !this.isPlayer;
    if (ai.goal && pickups.indexOf(ai.goal) >= 0 && !this.weapon) {
      const dx = ai.goal.x - this.pos.x, dz = ai.goal.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d < 1.2) { this.doGrab(); ai.goal = null; }
      else { mx = dx / d; mz = dz / d; run = d > 4; }
    } else if (ai.target && ai.target.alive) {
      ai.goal = null;
      const t = ai.target;
      const dx = t.pos.x - this.pos.x, dz = t.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 0.01;
      const w = this.weapon;
      const want = w && !w.def.throwable ? w.def.range * 0.72 : 1.25;
      if (ai.charge) {
        mx = dx / d; mz = dz / d; run = true;
        if (d < 3.1 && this.curSpeed > 5 && this.canAct()) { this.facing = Math.atan2(dx, dz); this.doHeavy(); ai.charge = false; ai.atkCd = rand(1, 1.6); }
        if (d < 1.4 || t.state === 'down') ai.charge = false;
      } else if (w && w.def.throwable && d > 3.5 && d < 13 && ai.atkCd <= 0 && t.state !== 'down') {
        this.facing = Math.atan2(dx, dz); this.doThrow(); ai.atkCd = rand(0.8, 1.5);
      } else if (d > want + 0.2) {
        mx = dx / d - dz / d * ai.strafe * 0.3; mz = dz / d + dx / d * ai.strafe * 0.3; run = d > 6;
      } else if (d < want * 0.55) { mx = -dx / d; mz = -dz / d; }
      else if (Math.random() < 0.02) { mx = -dz / d * ai.strafe; mz = dx / d * ai.strafe; }
      if (!ai.charge && d <= want + 0.5 && ai.atkCd <= 0 && this.canAct() && !this.blockHeld) {
        this.facing = Math.atan2(dx, dz);
        if (t.state === 'down') { if (d < 1.9) (Math.random() < 0.5 ? this.doLight() : this.doHeavy()); ai.atkCd = rand(0.5, 1.0); }
        else if (t.state === 'held') { this.doLight(); ai.atkCd = rand(0.35, 0.6); }
        else if (!w && d < 1.35 && t.state !== 'attack' && Math.random() < (t.state === 'block' ? 0.5 : 0.2)) { this.doClinch(); ai.atkCd = rand(0.6, 1.0); }
        else if (w && !w.def.throwable) { this.doLight(); ai.atkCd = rand(0.5, 1.1); }
        else if (Math.random() < 0.32) { this.doHeavy(); ai.atkCd = rand(0.7, 1.3); }
        else { ai.comboLeft = Math.floor(rand(0, 3)); this.doLight(); ai.atkCd = rand(0.7, 1.4); }
      }
      if (this.state === 'normal' && d < 3 && !ai.charge) this.facing += angDiff(this.facing, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
    } else if (followMode) {
      const dx = player.pos.x - this.pos.x, dz = player.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > 3.2) { mx = dx / d; mz = dz / d; run = d > 7; }
    }
    for (const o of fighters) {
      if (o === this || o.team !== this.team || !o.alive) continue;
      const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z, d = Math.hypot(dx, dz);
      if (d < 1.5 && d > 0.01) { mx += dx / d * 0.6; mz += dz / d * 0.6; }
    }
    this.moveX = mx; this.moveZ = mz; this.running = run;
  }
  aiThink() {
    const ai = this.ai;
    const followMode = this.team === player.team && teamCommand === 'follow' && player.alive && !this.isPlayer;
    let best = null, bs = 1e9;
    for (const e of fighters) {
      if (e.team === this.team || e.spectator || !e.alive) continue;
      const d = Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z);
      if (followMode && Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z) > 7) continue;
      let attackers = 0; for (const o of fighters) if (o !== this && o.team === this.team && o.alive && o.ai.target === e) attackers++;
      const score = d + attackers * (e.state === 'held' ? 1.2 : 3.5) + (e.state === 'down' ? 1.5 : 0) + (e.state === 'held' ? -3 : 0) + (e === ai.target ? -2 : 0) + (e.isPlayer ? -1.2 : 0);
      if (score < bs) { bs = score; best = e; }
    }
    ai.target = best;
    const td = best ? Math.hypot(best.pos.x - this.pos.x, best.pos.z - this.pos.z) : 99;
    if (!this.weapon && !ai.goal && !ai.charge && Math.random() < (ai.handsOnly ? 0.12 : 0.35)) {
      let bp = null, bd = 7;
      for (const p of pickups) { const d = Math.hypot(p.x - this.pos.x, p.z - this.pos.z); if (d < bd && d < td * 0.9 && (!ai.handsOnly || p.def.throwable)) { bd = d; bp = p; } }
      if (bp) ai.goal = bp;
    }
    if (!this.weapon && !ai.goal && best && best.state !== 'down' && td > 3.6 && td < 7.5 && Math.random() < 0.16) ai.charge = true;
    for (const e of fighters) {
      if (e.team === this.team || e.spectator || e.state !== 'attack') continue;
      const d = Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z);
      if (d < 2.6 && this.state === 'normal' && Math.random() < 0.26) { ai.blockT = rand(0.35, 0.6); this.facing = Math.atan2(e.pos.x - this.pos.x, e.pos.z - this.pos.z); break; }
    }
    if (ai.barkCd <= 0 && Math.random() < 0.15) { ai.barkCd = rand(8, 16); this.say(pick(Math.random() < 0.5 ? BARKS[this.team] : TAUNTS)); }
    if (Math.random() < 0.08) ai.strafe *= -1;
  }
}

