// v13 MAPA 1 - BARRIO VIVO (Copilot + Mauricio)
// pizzeria, carrito con caballo, props de NPC, cumbia de casa y patrullero fugaz
// ============================================================
const BARRIO13 = { root:null, police:null, horse:null, cart:null, beatT:0, policeCooldown:22, policeActive:0, policeDir:1 };
function barrioLabel(text, x,y,z, color){
  const c=document.createElement('canvas'); c.width=512; c.height=128; const ct=c.getContext('2d');
  ct.fillStyle='rgba(18,10,8,.88)'; ct.fillRect(0,0,512,128); ct.strokeStyle='#efe0bd'; ct.lineWidth=6; ct.strokeRect(6,6,500,116);
  ct.fillStyle=color||'#f5d36b'; ct.font='bold 52px Arial'; ct.textAlign='center'; ct.textBaseline='middle'; ct.fillText(text,256,64);
  const tx=new THREE.CanvasTexture(c); const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true})); sp.scale.set(7.2,1.8,1); sp.position.set(x,y,z); return sp;
}
function buildBarrio13(){
  const prev=scene; setScene(plazaScene); const root=new THREE.Group(); root.name='BARRIO_V13'; scene.add(root); BARRIO13.root=root;
  // Pizzeria de barrio sobre el borde NE de la plaza
  const pg=new THREE.Group(); pg.position.set(24.7,0,-14); pg.rotation.y=-Math.PI/2; root.add(pg);
  box(8.2,5.4,5.5,0x7d3c2a,0,2.7,0,pg); box(7.3,0.35,1.4,0xc7482f,0,4.65,-2.85,pg);
  box(2.2,2.8,0.12,0x5d271e,-2.3,1.5,-2.78,pg); box(3.5,2.2,0.12,0xffc56b,1.5,1.7,-2.78,pg);
  pg.add(barrioLabel('PIZZA EL BARRIO',0,4.7,-3.05,'#ffd56a'));
  for(let i=0;i<3;i++){ const t=new THREE.Group(); t.position.set(-2.6+i*2.5,0,-4.2); pg.add(t); cyl(.7,.7,.07,0xb58a58,0,.72,0,t,16); cyl(.05,.05,.7,0x39322d,0,.35,0,t,8); }
  // Casa de la que sale la cumbia: parlante visible en balcon
  const hg=new THREE.Group(); hg.position.set(-24.5,0,14); root.add(hg); box(7,5.5,6,0x884443,0,2.75,0,hg); box(2.5,1.1,.18,0x262329,0,3.6,-3.08,hg);
  const speaker=box(.95,1.35,.45,0x111116,0,3.6,-3.38,hg); speaker.material=uniqueMat(0x111116,{roughness:.35});
  for(const yy of [3.3,3.8]){ const cone=cyl(.22,.22,.04,0x44444d,0,yy,-3.64,hg,20); cone.rotation.x=Math.PI/2; }
  // Cartonero + caballo y carrito en una esquina, fuera del centro de combate
  const cg=new THREE.Group(); cg.position.set(22,0,18); cg.rotation.y=-2.45; root.add(cg); BARRIO13.cart=cg;
  box(2.7,.65,1.55,0x5a3d27,-1.65,.65,0,cg); for(const sx of [-2.5,-.8]){const w=cyl(.58,.58,.18,0x222226,sx,.45,.82,cg,18); w.rotation.x=Math.PI/2; const w2=w.clone(); w2.position.z=-.82; cg.add(w2);} 
  for(let i=0;i<7;i++) box(.65,.38,.48,0x8a704d,-1.7+(i%3)*.62,1.15+Math.floor(i/3)*.38,(i%2)*.25-.12,cg);
  const horse=new THREE.Group(); horse.position.set(1.25,0,0,cg); cg.add(horse); BARRIO13.horse=horse;
  box(1.75,1.05,.72,0x70452b,0,1.22,0,horse); box(.58,1.02,.52,0x765036,.92,1.72,0,horse);
  box(.62,.62,.45,0x765036,1.18,2.25,0,horse); for(const x of [-.55,.55]) for(const z of [-.25,.25]) box(.18,1.18,.18,0x5d3824,x,.57,z,horse);
  const tail=box(.12,1,.12,0x37251d,-.95,1.15,0,horse); tail.rotation.z=.55;
  // silueta del cartonero al costado del carro
  const person=new THREE.Group(); person.position.set(-1.5,0,1.7); cg.add(person); cyl(.22,.27,1.25,0x33465b,0,1.05,0,person,12); const head=new THREE.Mesh(new THREE.SphereGeometry(.23,12,8),mat(0xb88968)); head.position.y=1.82; person.add(head); box(.16,.85,.16,0x33343a,-.16,.42,0,person); box(.16,.85,.16,0x33343a,.16,.42,0,person);
  // Pickup policial ficticia: inicialmente escondida; pasa y se va
  const pv=new THREE.Group(); pv.visible=false; root.add(pv); BARRIO13.police=pv;
  box(3.55,.85,1.75,0xf0f2f3,0,.75,0,pv); box(1.55,.8,1.55,0xf0f2f3,-.55,1.45,0,pv); box(1.25,.58,1.57,0x2f67a8,1.15,1.1,0,pv);
  box(.45,.16,1.35,0x2f67a8,-1.2,.45,0,pv); box(.18,.15,.45,0xe33b35,-.55,1.92,-.24,pv); box(.18,.15,.45,0x2f70df,-.55,1.92,.24,pv);
  for(const x of [-1.15,1.15]) for(const z of [-.88,.88]){const w=cyl(.38,.38,.24,0x161719,x,.55,z,pv,16); w.rotation.x=Math.PI/2;}
  // Mejoras rápidas de utilería a NPC existentes: escoba de la chusma + mochila/celular del filmador
  setScene(prev);
}
function enhanceNPCProps13(){
  const ch=npcs[0]&&npcs[0].body; if(ch&&!ch.root.getObjectByName('broom13')){ const g=new THREE.Group(); g.name='broom13'; g.position.set(.52,1.15,.12); g.rotation.z=-.3; ch.root.add(g); cyl(.035,.035,1.55,0x8a5a30,0,0,0,g,8); box(.55,.12,.16,0xb99b5e,0,-.78,0,g); }
  const fi=npcs.find(n=>n.body&&n.body.cfg&&n.body.cfg.name==='El Pibe del Celu')?.body || npcs[1]?.body;
  if(fi&&!fi.root.getObjectByName('phone13')){ const bag=box(.62,.85,.22,0x242a32,0,1.3,.28,fi.root); bag.name='bag13'; const ph=box(.17,.32,.055,0x111218,.48,1.72,-.22,fi.root); ph.name='phone13'; const led=new THREE.PointLight(0xd8eeff,.9,4); led.position.set(.48,1.82,-.32); fi.root.add(led); fi.root.userData.phoneFlash=led; }
}
function barrioCumbia13(dt){
  if(!AC||!master||scene!==plazaScene||gameState==='menu') return; BARRIO13.beatT-=dt; if(BARRIO13.beatT>0)return; BARRIO13.beatT=.48;
  const p=fighters[0]?.pos||new THREE.Vector3(); const d=Math.hypot(p.x+24.5,p.z-14); const v=Math.max(.006,.042*(1-d/55));
  tone('sine',82,78,.18,v); tone('triangle',220,180,.08,v*.55,.12); noise(.035,4200,v*.7,'highpass',.5,.24);
}
function triggerPolicePass13(){ if(!BARRIO13.police||BARRIO13.policeActive>0)return; BARRIO13.policeActive=7.5; BARRIO13.policeDir=Math.random()<.5?1:-1; const p=BARRIO13.police; p.visible=true; p.position.set(-42*BARRIO13.policeDir,.02,27); p.rotation.y=BARRIO13.policeDir>0?Math.PI/2:-Math.PI/2; }
function updateBarrio13(dt){
  barrioCumbia13(dt); if(BARRIO13.horse){ BARRIO13.horse.rotation.y=Math.sin(worldT*.8)*.025; BARRIO13.horse.position.y=Math.sin(worldT*1.5)*.012; }
  const fi=npcs[1]?.body; if(fi?.root?.userData.phoneFlash) fi.root.userData.phoneFlash.intensity=(Math.random()<dt*.7)?2.8:.18;
  BARRIO13.policeCooldown-=dt; const chaos=(lastEvent.level||0)>=2 || fighters.some(f=>f.alive&&f.hp<f.maxHp*.55);
  if(BARRIO13.policeCooldown<=0 && chaos && Math.random()<dt*.14){ triggerPolicePass13(); BARRIO13.policeCooldown=rand(45,80); }
  if(BARRIO13.policeActive>0){ const p=BARRIO13.police; BARRIO13.policeActive-=dt; p.position.x+=BARRIO13.policeDir*11*dt; if(BARRIO13.policeActive<=0){p.visible=false;} }
}

function buildNPCs() {
  setScene(plazaScene);
  npcs.push(new Chusma(), new Filmador(), new Abuelo(), new Linyera());
  dog = new Dog();
  enhanceNPCProps13();
}
function updateNPCs(dt) {
  for (const n of npcs) n.update(dt);
  if (dog) dog.update(dt);
}
// ============================================================
// INPUT
// ============================================================
const keys = {}, pressed = {};
window.addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
renderer.domElement.addEventListener('mousedown', e => { initAudio(); if (e.button === 0) pressed.MouseL = true; if (e.button === 2) pressed.MouseR = true; });
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
const K = c => !!keys[c], PR = c => !!pressed[c];
let curDt = 0;
// ---------- joysticks ----------
const padPrev = {};
// se apaga si el navegador o el visor bloquean la API de joystick (se consulta antes de usarla: así Chrome no avisa nada)
let PADS_OK = (() => { try { const fp = document.permissionsPolicy || document.featurePolicy; return !fp || !fp.allowsFeature || fp.allowsFeature('gamepad'); } catch (e) { return true; } })();
let padsNow = [];
function readPads() {
  padsNow = [];
  let list = [];
  if (PADS_OK && navigator.getGamepads) {
    try { list = navigator.getGamepads() || []; }
    catch (e) { PADS_OK = false; }   // silencioso: en visores con permisos restringidos se juega con teclado
  }
  for (let i = 0; i < list.length; i++) {
    const p = list[i]; if (!p || !p.connected) continue;
    const b = p.buttons.map(x => x.pressed || x.value > 0.5), prev = padPrev[p.index] || [];
    padPrev[p.index] = b;
    const dz = v => Math.abs(v) < 0.25 ? 0 : v;
    let mx = dz(p.axes[0] || 0), mz = dz(p.axes[1] || 0);
    if (b[14]) mx = -1; if (b[15]) mx = 1; if (b[12]) mz = -1; if (b[13]) mz = 1;
    padsNow.push({ mx, mz, b, pr: k => !!b[k] && !prev[k] });
  }
}
// En 1 jugador: cualquier joystick maneja a J1. En 2 jugadores: con 2 joysticks, uno cada uno; con 1 joystick, lo usa J2.
function padFor(pid) {
  if (!TWO_P) return pid === 1 ? padsNow[0] : null;
  if (padsNow.length >= 2) return padsNow[pid - 1];
  return pid === 2 ? padsNow[0] : null;
}
const KB = {
  1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], run: ['ShiftLeft'], block: ['Space'], light: ['KeyJ'], heavy: ['KeyK'], clinch: ['KeyL'], pick: ['KeyE'], thr: ['KeyF'], rage: ['KeyR'], cmd: ['KeyQ'] },
  2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], run: ['ShiftRight', 'NumpadAdd'], block: ['Numpad0', 'ControlRight'], light: ['Numpad1', 'Comma'], heavy: ['Numpad2', 'Period'], clinch: ['Numpad3', 'Slash'], pick: ['Numpad4', 'Semicolon'], thr: ['Numpad5', 'Quote'], rage: ['Numpad6', 'BracketRight'], cmd: [] },
};
function readControls(pid) {
  const k = KB[pid], any = arr => arr.some(K), anyP = arr => arr.some(PR);
  const c = {
    mx: (any(k.right) ? 1 : 0) - (any(k.left) ? 1 : 0), mz: (any(k.down) ? 1 : 0) - (any(k.up) ? 1 : 0),
    run: any(k.run), block: any(k.block), light: anyP(k.light), heavy: anyP(k.heavy), clinch: anyP(k.clinch),
    pick: anyP(k.pick), thr: anyP(k.thr), rage: anyP(k.rage), cmd: anyP(k.cmd),
  };
  if (pid === 1 && !TWO_P) {
    c.mx += (K('ArrowRight') ? 1 : 0) - (K('ArrowLeft') ? 1 : 0); c.mz += (K('ArrowDown') ? 1 : 0) - (K('ArrowUp') ? 1 : 0);
    c.run = c.run || K('ShiftRight'); c.light = c.light || PR('MouseL'); c.heavy = c.heavy || PR('MouseR');
  }
  const g = padFor(pid);
  if (g) {
    if (g.mx || g.mz) { c.mx = g.mx; c.mz = g.mz; }
    c.run = c.run || g.b[7] || g.b[6]; c.block = c.block || g.b[5];
    c.light = c.light || g.pr(2); c.heavy = c.heavy || g.pr(3); c.clinch = c.clinch || g.pr(1);
    c.rage = c.rage || g.pr(4); c.cmd = c.cmd || g.pr(8) || g.pr(10);
    if (g.pr(0)) { const f = pid === 1 ? player : player2; if (f && f.weapon && f.weapon.def.throwable) c.thr = true; else c.pick = true; }
  }
  c.mx = clamp(c.mx, -1, 1); c.mz = clamp(c.mz, -1, 1);
  return c;
}
function humanControl(p, c) {
  if (!p || !p.alive) return;
  p.moveX = c.mx; p.moveZ = c.mz; p.running = c.run; p.blockHeld = c.block;
  if (gameState !== 'fight') return;
  if (p.state === 'held') { if (c.light || c.heavy || c.clinch || c.pick || c.thr) p.escape += 0.2; return; }
  if (c.light) p.doLight();
  if (c.heavy) p.doHeavy();
  if (c.clinch) p.doClinch();
  if (c.pick) p.doGrab();
  if (c.thr) p.doThrow();
  if (c.rage) p.doRage();
  if (c.cmd && p.pid === 1 && !TWO_P) {
    teamCommand = teamCommand === 'attack' ? 'follow' : 'attack';
    p.say(teamCommand === 'attack' ? '¡Vamos muchachos, a ellos!' : '¡Todos conmigo!', 1.6);
    sfx('whistle');
    for (const f of fighters) if (f.team === p.team && f !== p) f.ai.target = null;
  }
}
function playerControl() {
  if (AUTO) { for (const p of [player, player2]) if (p && p.alive) p.aiUpdate(curDt); return; }
  humanControl(player, readControls(1));
  if (TWO_P) humanControl(player2, readControls(2));
}

// ============================================================
// FLUJO: menú → casa (elegir fierro) → salen de las casas → plaza (rounds)
// ============================================================
let gameState = 'menu';
let prevState = null;
let teamSize = 4, round = 1, score = [0, 0], stateTimer = 0, respawnTimer = 0;
// v6: 3 minutos por round. Si no termina, cae la policía. Con 1-1 se define mano a mano entre capitanes.
const ROUND_TIME = 180;
let roundClock = ROUND_TIME, duel = false, policeT = 0, policeRounds = 0, policeLights = null;
let loadout = [[], []], houseT = 0, prepBarkT = 3, prepChoice = null, walkT = 0, walkEvents = [];
const RADIO = [
  'FM LA BARRIADA: "Se cortó la luz en todo el barrio... menos en la plaza. Y ahí ya están los de enfrente."',
  'FM LA BARRIADA: "La Impar dice que fue la Par. La Par dice que fue la Impar. La plaza decide."',
  'FM LA BARRIADA: "Último round, vecinos. El que pierde, no pisa más las mesitas."',
];
const bannerEl = document.getElementById('banner');
const cineEl = document.getElementById('cine'), capEl = document.getElementById('caption');
function banner(text, sub, cls) {
  bannerEl.className = 'show ' + (cls || '');
  bannerEl.innerHTML = `<div class="panel"><div class="b1">${text}</div>${sub ? `<div class="b2">${sub}</div>` : ''}</div>`;
}
function hideBanner() { bannerEl.className = ''; }
function caption(t) { if (capEl.dataset.t !== t) { capEl.dataset.t = t; capEl.innerHTML = t; capEl.classList.remove('in'); void capEl.offsetWidth; capEl.classList.add('in'); } }

function clearRound() {
  player2 = null; slowMo = 0; lastKO = null;
  for (const k of sparks) if (k.s.parent) k.s.parent.remove(k.s); sparks.length = 0;
  for (const f of fighters) f.destroy();
  fighters = [];
  for (const p of pickups.slice()) { removePickup(p); if (p.mesh.parent) p.mesh.parent.remove(p.mesh); }
  for (const pr of projectiles) if (pr.mesh.parent) pr.mesh.parent.remove(pr.mesh);
  projectiles.length = 0;
  for (const p of pops) p.el.remove(); pops.length = 0;
  clearBlood5(); if (typeof resetBreakables === 'function') resetBreakables();
}

// ---------- la casa ----------
const prepEl = document.getElementById('prep'), cardsEl = document.getElementById('cards'), goBtn = document.getElementById('goBtn');
const STAT_LBL = ['DAÑO', 'ALCANCE', 'VELOCIDAD', 'AGUANTE'];
const ICONS = {};
function renderIcons() {
  try {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setSize(200, 110); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping;
    for (const k of LOADOUT_KEYS) {
      const sc2 = new THREE.Scene();
      sc2.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.1));
      const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(2, 3, 4); sc2.add(dl);
      const w = makeWeaponMesh(k); w.rotation.set(0.35, 0, Math.PI / 2 + 0.35); sc2.add(w);
      const bb = new THREE.Box3().setFromObject(w), ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      w.position.sub(ctr);
      const cam = new THREE.PerspectiveCamera(30, 200 / 110, 0.01, 50);
      cam.position.set(0, 0, Math.max(sz.x / 1.6, sz.y) / (2 * Math.tan(15 * Math.PI / 180)) * 1.25); cam.lookAt(0, 0, 0);
      r.render(sc2, cam); ICONS[k] = r.domElement.toDataURL();
    }
    r.dispose(); if (r.forceContextLoss) r.forceContextLoss();
  } catch (e) { }
}
function buildCards() {
  cardsEl.innerHTML = '';
  for (const k of LOADOUT_KEYS) {
    const d = WEAPONS[k];
    const el = document.createElement('div'); el.className = 'card'; el.dataset.key = k;
    el.innerHTML = `<div class="cimg">${ICONS[k] ? `<img src="${ICONS[k]}">` : ''}</div><div class="cname">${d.name}</div><div class="cdesc">${d.desc}</div>` +
      d.stats.map((v, i) => `<div class="stat"><span>${STAT_LBL[i]}</span><i>${'<b></b>'.repeat(v)}${'<b class="off"></b>'.repeat(5 - v)}</i></div>`).join('') + `<div class="cwho"></div>`;
    el.addEventListener('click', () => { initAudio(); choosePrep(k); });
    cardsEl.appendChild(el);
  }
}
function choosePrep(k) {
  if(player) bandVoice14(player,'prep',.34);
  if (gameState !== 'house') return;
  prepChoice = k;
  const rest = LOADOUT_KEYS.filter(x => x !== k).sort(() => Math.random() - 0.5);
  loadout[0] = [k].concat(rest).slice(0, teamSize);
  loadout[1] = []; for (let i = 0; i < teamSize; i++) loadout[1].push(pick(arsenalFor(1)));
  fighters.forEach((f, i) => {
    if (f.weapon) { f.hand.remove(f.weapon.mesh); f.weapon = null; }
    f.equip(loadout[0][i], makeWeaponMesh(loadout[0][i]), WEAPONS[loadout[0][i]].dur);
  });
  for (const kk of LOADOUT_KEYS) tableWeapons[kk].visible = loadout[0].indexOf(kk) < 0;
  cardsEl.querySelectorAll('.card').forEach(el => {
    const idx = loadout[0].indexOf(el.dataset.key);
    el.classList.toggle('sel', el.dataset.key === k);
    el.classList.toggle('taken', idx > 0);
    el.querySelector('.cwho').textContent = idx === 0 ? '★ LO LLEVÁS VOS' : idx > 0 ? '→ ' + ROSTER[0][idx].name : 'queda en la mesa';
  });
  goBtn.disabled = false;
  sfx('pickup');
  player.say(pick(PICK_LINES[k]), 2.4);
  const mate = fighters[1 + Math.floor(Math.random() * (fighters.length - 1))];
  if (mate) setTimeout(() => { if (gameState === 'house' && fighters.indexOf(mate) >= 0) mate.say('Yo me llevo ' + WEAPONS[loadout[0][mate.idx]].name.toLowerCase() + '.', 2); }, 900);
}
function enterHouse() {
  clearRound();
  setScene(houseScene);
  gameState = 'house'; houseT = 0; prepChoice = null; prepBarkT = 1.2;
  ['menu', 'endScreen', 'hud'].forEach(id => document.getElementById(id).classList.add('hidden'));
  prepEl.classList.remove('hidden');
  goBtn.disabled = true;
  buildCards();
  for (const kk of LOADOUT_KEYS) tableWeapons[kk].visible = true;
  const spots = [[0, 3.7], [-1.9, 2.9], [1.9, 2.9], [3.7, 2.2]];
  for (let i = 0; i < teamSize; i++) {
    const f = new Fighter(0, i, ROSTER[0][i], i === 0 ? 1 : false);
    f.pos.set(spots[i][0], 0, spots[i][1]); f.facing = -spots[i][0] * 0.06;
    fighters.push(f); if (i === 0) player = f;
    f.ring.visible = false;
  }
  startIntro();
}
function updateHouse(dt) {
  houseT += dt; prepBarkT -= dt; introUpdate(dt);
  if (prepBarkT <= 0) { prepBarkT = rand(4, 7); const f = pick(fighters); if (f && f.barkT <= 0) f.say(f === player && !prepChoice ? PREP_BARKS[0] : pick(PREP_BARKS), 2.6); }
  for (const f of fighters) {
    if (f.barkT > 0) { f.barkT -= dt; if (f.barkT <= 0) f.barkEl.style.opacity = 0; }
    f.curSpeed = 0; f.root.position.copy(f.pos); f.animate(dt);
  }
}
function goPlaza() {
  if (!prepChoice) return;
  if (INTRO.on) endIntro();
  initAudio();
  prepEl.classList.add('hidden');
  score = [0, 0]; round = 1;
  startWalkin();
}
function startMatch(size) { applyTeams(); teamSize = size; roundClock = ROUND_TIME; duel = false; policeT = 0; policeRounds = 0; if (policeLights) policeLights.visible = false; for (const f of fighters) f.arrested = false; enterHouse(); }

// ---------- salida de las casas (cinemática) ----------
const XS = [0, -2.6, 2.6, -5.2];
function finalSpot(t, i) { return new THREE.Vector3(XS[i] + (t === 1 ? 0.4 : 0), 0, t === 0 ? 9 - Math.abs(XS[i]) * 0.3 : -9 + Math.abs(XS[i]) * 0.3); }
function spawnTeams() {
  for (let t = 0; t < 2; t++) for (let i = 0; i < teamSize; i++) {
    const isP = i === 0 && (t === 0 || TWO_P) ? (t === 0 ? 1 : 2) : false;
    const f = new Fighter(t, i, ROSTER[t][i], isP);
    const k = loadout[t][i]; if (k) f.equip(k, makeWeaponMesh(k), WEAPONS[k].dur);
    fighters.push(f); if (isP === 1) player = f; if (isP === 2) player2 = f;
  }
}
function startWalkin() {
  clearRound(); setScene(plazaScene); teamCommand = 'attack'; lastWinner = -1;
  spawnTeams(); showVS();
  const H = [SPOTS.par, SPOTS.impar];
  for (const f of fighters) {
    const h = H[f.team], inside = h.door.clone().add(h.door.clone().sub(h.out).normalize().multiplyScalar(0.9));
    f.pos.copy(inside); f.noClamp = true; f.swagger = true;
    const fin = finalSpot(f.team, f.idx);
    const pts = f.team === 0 ? [h.out.clone(), new THREE.Vector3(h.out.x, 0, 21), fin] : [h.out.clone(), new THREE.Vector3(14, 0, -19.5), fin];
    f.walk = { pts, i: 0, delay: (f.team === 0 ? 0.3 : 3.1) + f.idx * 0.5, done: false };
    f.facing = Math.atan2(h.out.x - h.door.x, h.out.z - h.door.z);
  }
  walkT = 0; gameState = 'walkin';
  walkEvents = [
    { t: 0.25, fn: () => sfx('door', 0.8) },
    { t: 1.4, fn: () => player.say('¡Vamos, muchachos! ¡A la plaza!', 2.2) },
    { t: 3.0, fn: () => sfx('door', 0.8) },
    { t: 4.2, fn: () => fighters[teamSize].say('¡Ahí vienen esos giles de la Par!', 2.2) },
    { t: 8.0, fn: () => { fighters.forEach(f => { if (teamDefs[f.team] && BAND_VOICE14[teamDefs[f.team].id]) bandVoice14(f,'pre',.48); else if (Math.random() < 0.5) f.say(pick(BARKS[f.team]), 2.2); }); } },
  ];
  cineEl.classList.add('on'); document.getElementById('skip').classList.remove('hidden');
  caption('<b>21:47</b> — La <span class="b">PAR</span> sale de lo de Rubén...');
}
function updateWalkin(dt) {
  walkT += dt;
  for (const e of walkEvents) if (!e.done && walkT >= e.t) { e.done = true; e.fn(); }
  let allDone = true;
  for (const f of fighters) {
    const w = f.walk;
    if (walkT < w.delay) { f.moveX = f.moveZ = 0; allDone = false; }
    else if (!w.done) {
      const tg = w.pts[w.i], dx = tg.x - f.pos.x, dz = tg.z - f.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.45) { w.i++; if (w.i >= w.pts.length) w.done = true; }
      f.moveX = dx / (d || 1); f.moveZ = dz / (d || 1);
      allDone = false;
    } else { f.moveX = f.moveZ = 0; f.facing += angDiff(f.facing, f.team === 0 ? Math.PI : 0) * Math.min(1, dt * 4); }
    f.update(dt);
  }
  if (walkT > 3.3 && walkT < 6.7) caption('...y la <span class="r">IMPAR</span> sale de lo del Tano.');
  else if (walkT >= 6.7) caption('Se encuentran en la plaza. Esta noche se arregla todo.');
  if ((allDone && walkT > 8.5) || walkT > 14) endWalkin();
}
function skipWalkin() {
  for (const f of fighters) { const fin = finalSpot(f.team, f.idx); f.pos.copy(fin); f.facing = f.team === 0 ? Math.PI : 0; f.walk.done = true; }
  endWalkin();
}
function endWalkin() {
  cineEl.classList.remove('on'); document.getElementById('skip').classList.add('hidden'); capEl.classList.remove('in'); capEl.dataset.t = '';
  for (const f of fighters) { f.swagger = false; f.noClamp = false; f.moveX = f.moveZ = 0; }
  camPos.copy(camera.position);
  document.getElementById('hud').classList.remove('hidden');
  beginRoundIntro();
}

// ---------- la plaza ----------
function beginRoundIntro() {
  const n = teamSize === 4 ? 8 : 6;
  for (let i = 0; i < n; i++) { const s = randomFreeSpot(); spawnPickup(PLAZA_KEYS[i % PLAZA_KEYS.length], s.x, s.z); }
  respawnTimer = 10;
  gameState = 'intro'; stateTimer = 3.2;
  banner('ROUND ' + round, RADIO[Math.min(round - 1, 2)], 'round');
  sfx('bell');
  updateHUD();
}
function startRound() {
  clearRound(); setScene(plazaScene); teamCommand = 'attack'; lastWinner = -1;
  roundClock = ROUND_TIME; policeT = 0; if (policeLights) policeLights.visible = false;
  duel = (score[0] === 1 && score[1] === 1) || (round >= 3 && policeRounds > 0 && score[0] === score[1]);
  spawnTeams();
  for (const f of fighters) { f.pos.copy(finalSpot(f.team, f.idx)); f.facing = f.team === 0 ? Math.PI : 0; }
  if (duel) setupDuel();
  for (const f of fighters) if (Math.random() < 0.45) setTimeout(() => { if (fighters.indexOf(f) >= 0) f.say(pick(BARKS[f.team]), 2.4); }, rand(300, 2400));
  beginRoundIntro();
}
function aliveCount(t) { let n = 0; for (const f of fighters) if (f.team === t && f.alive && !f.spectator) n++; return n; }

function updateFlow(dt) {
  if (gameState === 'intro') {
    stateTimer -= dt;
    if (stateTimer < 0.9 && !bannerEl.classList.contains('go')) banner('¡A PELEAR!', '', 'go');
    if (stateTimer <= 0) { gameState = 'fight'; hideBanner(); }
  } else if (gameState === 'police') {
    updatePolice(dt);
  } else if (gameState === 'fight') {
    roundClock -= dt;
    if (roundClock <= 0) { roundClock = 0; startPolice(); return; }
    const a0 = aliveCount(0), a1 = aliveCount(1);
    if (a0 === 0 || a1 === 0) {
      const w = a0 > 0 ? 0 : 1; score[w]++; lastWinner = w;
      gameState = 'roundEnd'; stateTimer = 3.8;
      banner(teamDefs[w] ? `¡GANAN ${TEAM_NAMES[w]}!` : `¡GANA LA ${TEAM_NAMES[w]}!`, `Round ${round} · ${score[0]} - ${score[1]}`, w === 0 ? 'win' : 'lose');
      sfx('bell');
      for (const f of fighters) if (f.team === w && f.alive && Math.random() < 0.6) f.say(pick(TAUNTS), 2.5);
    }
    respawnTimer -= dt;
    if (respawnTimer <= 0) {
      respawnTimer = 9;
      if (pickups.length < (teamSize === 4 ? 8 : 6)) {
        const s = randomFreeSpot(); const p = spawnPickup(pick(PLAZA_KEYS), s.x, s.z);
        spawnParticles(new THREE.Vector3(p.x, 0.3, p.z), 0xffd23a, 8, 2, 0.5, 0.07);
      }
    }
  } else if (gameState === 'roundEnd') {
    stateTimer -= dt;
    if (stateTimer <= 0) {
      hideBanner();
      if (score[0] >= 2 || score[1] >= 2) endMatch();
      else { round++; startRound(); }
    }
  }
}
function setupDuel() {
  // los capitanes (índice 0 de cada banda) pelean en el medio; el resto hace ronda y alienta
  const cap = fighters.filter(f => f.idx === 0), rest = fighters.filter(f => f.idx !== 0);
  cap[0].pos.set(0, 0, 2.2); cap[0].facing = Math.PI; cap[1].pos.set(0, 0, -2.2); cap[1].facing = 0;
  rest.forEach((f, i) => {
    const a = (f.team === 0 ? 0.35 : Math.PI + 0.35) + (i % 3) * 0.55 * (f.team === 0 ? 1 : 1), r = 6.2;
    f.spectator = true; f.invuln = 9999; f.pos.set(Math.sin(a) * r, 0, Math.cos(a) * r);
    f.facing = Math.atan2(-f.pos.x, -f.pos.z);
    f.cheerT = rand(0, 3);
    f.poseFn = (P) => {   // alientan: puño arriba de a ratos, el resto del tiempo brazos cruzados mirando
      f.cheerT -= curDt || 0;
      if (f.cheerT < 0) f.cheerT = rand(2, 5);
      if (f.cheerT < 0.9) { const pump = Math.abs(Math.sin(f.idleT * 8)); P.aR = -2.7 + pump * 0.3; P.eR = -0.4 - pump * 0.4; P.aRz = 0.2; P.aL = -0.4; P.eL = -1.6; }
      else { P.aL = -0.55; P.eL = -2.2; P.aR = -0.6; P.eR = -2.0; P.aLz = 0.55; P.aRz = -0.55; }
      P.lL = -0.1; P.lR = 0.1; P.kL = P.kR = 0.1; P.tX = 0.02; P.tY = 0; P.hY = 0;
    };
  });
  setTimeout(() => { for (const f of rest) if (Math.random() < 0.6 && fighters.indexOf(f) >= 0) f.say(pick(['¡Dale, capitán!', '¡Rompelo!', '¡Uno contra uno, como los hombres!', '¡Que nadie se meta!']), 2.4); }, 900);
}
function startPolice() {
  gameState = 'police'; policeT = 0; policeRounds++;
  sfx('siren'); setTimeout(() => sfx('siren'), 600); setTimeout(() => sfx('siren'), 1200);
  if (!policeLights) {
    policeLights = new THREE.Group();
    const red = new THREE.PointLight(0xff2a2a, 0, 40, 1.2), blue = new THREE.PointLight(0x2a5aff, 0, 40, 1.2);
    red.position.set(-6, 5, 14); blue.position.set(6, 5, 14); policeLights.add(red, blue); policeLights.userData = { red, blue };
  }
  if (policeLights.parent !== scene) scene.add(policeLights);
  policeLights.visible = true;
  let winner = -1;
  if (duel) {   // mano a mano cortado por la policía: gana por puntos el que tiene más vida
    const c = fighters.filter(f => f.idx === 0 && !f.spectator);
    if (c.length === 2) winner = c[0].hp / c[0].maxHp >= c[1].hp / c[1].maxHp ? c[0].team : c[1].team;
  }
  policeT = 0; police.winner = winner;
  banner('¡CAYÓ LA POLICÍA!', winner >= 0 ? `Se cortó el mano a mano · por puntos gana ${teamLabel(winner)}` : '3 minutos y nadie ganó · se los llevan a todos', 'lose');
  for (const f of fighters) {
    if (!f.alive) continue;
    if (f.held) f.releaseGrab(true);
    f.arrested = true; f.moveX = f.moveZ = 0; f.running = false; f.blockHeld = false; f.attack = null;
    if (f.state !== 'down') f.setState('normal');
    if (Math.random() < 0.35) f.say(pick(['¡Es la yuta!', '¡Rajemos!', '¡Yo no hice nada, oficial!', '¡Fue él!', 'Uh, la policía...']), 2.2);
  }
}
const police = { winner: -1 };
function updatePolice(dt) {
  policeT += dt;
  if (policeLights) { const on = Math.floor(policeT * 6) % 2 === 0; policeLights.userData.red.intensity = on ? 3.5 : 0; policeLights.userData.blue.intensity = on ? 0 : 3.5; }
  // se los van llevando de a uno (desaparecen de a poco)
  const list = fighters.filter(f => f.alive && f.root.visible);
  if (policeT > 2.2 && list.length && Math.random() < dt * 4) { const f = pick(list); f.root.visible = false; f.stars.visible = false; f.label.style.display = 'none'; }
  if (policeT > 5.5) {
    if (policeLights) policeLights.visible = false;
    for (const f of fighters) f.arrested = false;
    hideBanner();
    if (police.winner >= 0) { score[police.winner]++; lastWinner = police.winner; }
    gameState = 'roundEnd'; stateTimer = 0.01;
  }
}
function endMatch() {
  gameState = 'matchEnd';
  const w = score[0] >= 2 ? 0 : 1;
  document.getElementById('endScreen').classList.remove('hidden');
  const t = document.getElementById('endTitle');
  t.textContent = teamDefs[w] ? `¡LA PLAZA ES DE ${teamLabel(w)}!` : (w === 0 ? '¡LA PLAZA ES DE LA PAR!' : 'LA IMPAR SE QUEDÓ CON LA PLAZA');
  t.className = w === 0 ? 'blueTxt' : 'redTxt';
  document.getElementById('endSub').textContent = `Resultado final: ${score[0]} - ${score[1]}` + (w === 0 ? ' · Esta noche las mesitas son nuestras.' : ' · Volvé a lo de Rubén y elegí mejor el fierro...');
}

// ============================================================
// HUD
// ============================================================
const hud = {
  php: document.getElementById('php'), prage: document.getElementById('prage'), pweapon: document.getElementById('pweapon'),
  score: document.getElementById('score'), round: document.getElementById('roundLbl'),
  pipsB: document.getElementById('bluePips'), pipsR: document.getElementById('redPips'), cmd: document.getElementById('cmdState'),
  p2card: document.getElementById('p2card'), p2hp: document.getElementById('p2hp'), p2rage: document.getElementById('p2rage'), p2weapon: document.getElementById('p2weapon'), p2name: document.getElementById('p2name'), cmdBox: document.getElementById('cmdBox'), pname: document.getElementById('pname'),
  ko: document.getElementById('koMsg'), rageHint: document.getElementById('rageHint'), grabHint: document.getElementById('grabHint'),
};
function updateHUD() {
  if (!player) return;
  hud.pname.innerHTML = `${player.name.toUpperCase()} <span>${TWO_P ? 'J1 · ' : ''}${player.st.tag || 'VEREDA PAR'}</span>`;
  hud.p2card.classList.toggle('hidden', !player2); hud.cmdBox.classList.toggle('hidden', !!player2);
  if (player2) {
    hud.p2name.innerHTML = `${player2.name.toUpperCase()} <span>J2 · ${player2.st.tag}</span>`;
    hud.p2hp.style.width = (player2.hp / player2.maxHp * 100) + '%';
    hud.p2rage.style.width = (player2.rageTime > 0 ? player2.rageTime / 9 * 100 : player2.rage) + '%';
    hud.p2rage.parentElement.classList.toggle('full', player2.rage >= 100 || player2.rageTime > 0);
    hud.p2weapon.innerHTML = player2.weapon ? `ARMA: <b>${player2.weapon.def.name}</b>` : 'ARMA: <b>A las piñas</b>';
  }
  hud.php.style.width = (player.hp / player.maxHp * 100) + '%';
  hud.prage.style.width = (player.rageTime > 0 ? player.rageTime / 9 * 100 : player.rage) + '%';
  hud.prage.parentElement.classList.toggle('full', player.rage >= 100 || player.rageTime > 0);
  hud.rageHint.style.display = player.rage >= 100 && player.rageTime <= 0 && player.alive ? 'block' : 'none';
  hud.pweapon.innerHTML = player.weapon ? `ARMA: <b>${player.weapon.def.name}</b> <span>${'▮'.repeat(Math.max(0, player.weapon.dur))}</span>` : 'ARMA: <b>A las piñas</b>';
  hud.score.textContent = `${score[0]} - ${score[1]}`;
  { const m = Math.floor(roundClock / 60), sx = String(Math.floor(roundClock % 60)).padStart(2, '0');
    hud.round.textContent = (duel ? 'MANO A MANO DE CAPITANES' : 'ROUND ' + round + ' · al mejor de 3') + ' · ' + m + ':' + sx;
    hud.round.style.color = roundClock < 30 && gameState === 'fight' ? '#ff5a4a' : ''; }
  let b = '', r = '';
  for (const f of fighters) { const s = `<i class="${f.alive ? '' : 'out'}"></i>`; if (f.team === 0) b += s; else r += s; }
  hud.pipsB.innerHTML = b; hud.pipsR.innerHTML = r;
  hud.cmd.textContent = teamCommand === 'attack' ? '¡A ELLOS!' : 'SEGUIME';
  hud.ko.style.display = !player.alive && gameState === 'fight' ? 'block' : 'none';
  hud.ko.textContent = TWO_P ? (player.alive ? '' : 'J1 K.O. — SU BANDA SIGUE') : 'ESTÁS K.O. — TU BANDA SIGUE PELEANDO';
  let near = false;
  if (player.alive && !player.weapon) for (const p of pickups) if (Math.hypot(p.x - player.pos.x, p.z - player.pos.z) < 1.7) { near = p; break; }
  hud.grabHint.style.display = near ? 'block' : 'none';
  if (near) hud.grabHint.textContent = `[E] Levantar ${near.def.name}`;
  if (player.state === 'held' && player.alive) { hud.grabHint.style.display = 'block'; hud.grabHint.textContent = '¡TE AGARRARON! MACHACÁ J / K PARA SOLTARTE'; }
  else if (player.state === 'grab') { hud.grabHint.style.display = 'block'; hud.grabHint.textContent = 'J rodillazo · K revoleo'; }
}
function placeLabel(f, y) {
  tmpV.set(f.pos.x, y, f.pos.z).project(camera);
  if (tmpV.z > 1 || !f.root.visible || Math.abs(tmpV.x) > 1.2 || Math.abs(tmpV.y) > 1.2) { f.label.style.display = 'none'; return false; }
  f.label.style.display = 'block';
  f.label.style.transform = `translate(-50%,-100%) translate(${(tmpV.x * 0.5 + 0.5) * window.innerWidth}px,${(-tmpV.y * 0.5 + 0.5) * window.innerHeight}px)`;
  return true;
}
function updateLabels() {
  for (const f of fighters) {
    if (!placeLabel(f, f.pos.y + (f.state === 'down' || f.state === 'ko' ? 1.0 : 2.65))) continue;
    f.labelBar.style.width = (f.hp / f.maxHp * 100) + '%';
    f.label.classList.toggle('dead', !f.alive);
    f.label.classList.toggle('rage', f.rageTime > 0);
    f.label.classList.toggle('lineup', gameState === 'house' || gameState === 'walkin');
  }
  const showNpc = scene === plazaScene && gameState !== 'menu';
  for (const n of npcs) { if (!showNpc || n.hidden) { n.body.label.style.display = 'none'; continue; } placeLabel(n.body, n.body.pos.y + 2.5); }
}

// ============================================================
// CÁMARA
// ============================================================
const camTarget = new THREE.Vector3(0, 1, 10), camPos = new THREE.Vector3(0, 10, 30);
const camLook = new THREE.Vector3();
let menuT = 0;
function updateCamera(dt) {
  if (window.__camLock) return;   // gancho de pruebas: cámara fija
  if (gameState === 'menu') {
    menuT += dt;
    const a = menuT * 0.06 + 0.6;
    camera.position.set(Math.sin(a) * 14, 6.0 + Math.sin(menuT * 0.3) * 0.6, Math.cos(a) * 14);
    camera.lookAt(0, 1.5, 0); return;
  }
  if (gameState === 'house') {
    if (introCam()) return;
    const t = houseT, k = Math.min(1, t / 2.5), e = 1 - Math.pow(1 - k, 3);
    camera.position.set(3.4 + Math.sin(t * 0.22) * 0.4, 1.75 + (1 - e) * 1.2, 11.2 - e * 1.6);
    camera.lookAt(3.4, 1.85 - (1 - e) * 0.3, 0); return;
  }
  if (gameState === 'walkin') {
    const L = 1 - Math.exp(-dt * 3);
    let pos, look;
    if (walkT < 3.3) { const f = fighters[0]; pos = new THREE.Vector3(f.pos.x + 2.4, 1.5, f.pos.z - 6.0); look = new THREE.Vector3(f.pos.x, 1.45, f.pos.z); }
    else if (walkT < 6.7) { const f = fighters[teamSize]; pos = new THREE.Vector3(f.pos.x - 2.6, 1.5, f.pos.z + 6.0); look = new THREE.Vector3(f.pos.x, 1.45, f.pos.z); }
    else { const k = clamp((walkT - 6.7) / 3.5, 0, 1), e = k * k * (3 - 2 * k); pos = new THREE.Vector3(lerp(12, 0, e), lerp(3, 12, e), lerp(6, 21, e)); look = new THREE.Vector3(0, 1, 0); }
    const cut = (walkT < 3.3 ? 0 : walkT < 6.7 ? 1 : 2);
    if (cut !== camLook.cut) { camera.position.copy(pos); camLook.copy(look); camLook.cut = cut; }
    camera.position.lerp(pos, L); camLook.lerp(look, L); camera.lookAt(camLook); return;
  }
  const focus = player && player.alive ? player : fighters.find(f => f.team === 0 && f.alive) || player;
  if (!focus) return;
  let tx = focus.pos.x, tz = focus.pos.z, spread = 0;
  const p2 = player2 && player2.alive ? player2 : (TWO_P ? fighters.find(f => f.team === 1 && f.alive) : null);
  if (TWO_P && p2) { tx = (focus.pos.x + p2.pos.x) / 2; tz = (focus.pos.z + p2.pos.z) / 2; spread = Math.max(0, Math.hypot(focus.pos.x - p2.pos.x, focus.pos.z - p2.pos.z) - 6); }
  else if (gameState === 'fight') { const c = fightCenter(); tx = lerp(tx, c.x, 0.25); tz = lerp(tz, c.z, 0.25); }
  let hgt = 7.3 + spread * 0.42, back = 9.0 + spread * 0.5;
  if (slowMo > 0 && lastKO) { tx = lastKO.pos.x; tz = lastKO.pos.z + 1.2; hgt = 3.6; back = 5.2; }
  camTarget.lerp(new THREE.Vector3(tx, 1, tz - 1.2), 1 - Math.exp(-dt * (slowMo > 0 ? 3 : 5)));
  const desired = new THREE.Vector3(camTarget.x * 0.85, hgt, camTarget.z + back);
  camPos.lerp(desired, 1 - Math.exp(-dt * 4));
  camera.position.copy(camPos);
  if (shakeAmt > 0.001) {
    camera.position.x += rand(-1, 1) * shakeAmt; camera.position.y += rand(-1, 1) * shakeAmt * 0.6;
    shakeAmt *= Math.exp(-dt * 10);
  }
  camera.lookAt(camTarget);
}

// ============================================================
// MENÚ / BOTONES
// ============================================================
let chosenSize = 4;
document.querySelectorAll('.modeBtn').forEach(b => b.addEventListener('click', () => {
  initAudio();
  document.querySelectorAll('.modeBtn').forEach(x => x.classList.remove('sel'));
  b.classList.add('sel'); TWO_P = b.dataset.mode === '2';
  document.getElementById('ctl1p').classList.toggle('hidden', TWO_P); document.getElementById('ctl2p').classList.toggle('hidden', !TWO_P);
  document.getElementById('hint').innerHTML = TWO_P ? HINT2 : HINT1;
}));
const HINT1 = document.getElementById('hint').innerHTML;
const HINT2 = '<b>J1:</b> WASD · Shift · J piña · K patada · L agarrar · Espacio cubrirse · E levantar · F tirar · R furia &nbsp;|&nbsp; <b>J2:</b> Flechas · Num1 piña · Num2 patada · Num3 agarrar · Num0 cubrirse · Num4 levantar · Num5 tirar · Num6 furia';
document.querySelectorAll('.sizeBtn').forEach(b => b.addEventListener('click', () => {
  initAudio();
  document.querySelectorAll('.sizeBtn').forEach(x => x.classList.remove('sel'));
  b.classList.add('sel'); chosenSize = parseInt(b.dataset.size, 10);
}));
document.getElementById('startBtn').addEventListener('click', () => { initAudio(); startMatch(chosenSize); });
goBtn.addEventListener('click', goPlaza);
document.getElementById('skip').addEventListener('click', () => { if (gameState === 'walkin') skipWalkin(); });
document.getElementById('againBtn').addEventListener('click', () => { initAudio(); enterHouse(); });
document.getElementById('menuBtn').addEventListener('click', () => {
  clearRound(); setScene(plazaScene); gameState = 'menu';
  ['endScreen', 'hud', 'prep'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('menu').classList.remove('hidden');
});
const pauseEl = document.getElementById('pause');
function togglePause() {
  if (gameState === 'paused') { gameState = prevState; pauseEl.classList.add('hidden'); }
  else if (gameState === 'fight' || gameState === 'intro' || gameState === 'roundEnd') { prevState = gameState; gameState = 'paused'; pauseEl.classList.remove('hidden'); }
}
document.getElementById('resumeBtn').addEventListener('click', togglePause);

// ============================================================
// ARRANQUE + LOOP
// ============================================================
const tableGroup = buildHouse();
LOADOUT_KEYS.forEach((k, i) => {
  const w = makeWeaponMesh(k); w.rotation.order = 'YXZ'; w.rotation.set(Math.PI / 2, rand(-0.15, 0.15), 0);
  w.position.set(-0.6 + i * 0.4, 0.76 + WEAPONS[k].gy, 0.45); tableGroup.add(w); tableWeapons[k] = w;
});
buildPlaza(); buildSuburbio(); findBoards();
buildBarrio13();
buildNPCs();
setScene(plazaScene);
renderIcons();
for (let i = 0; i < 7; i++) { const s = randomFreeSpot(); spawnPickup(PLAZA_KEYS[i], s.x, s.z); }

const clock = new THREE.Clock();
let hudT = 0;
function frame() {
  requestAnimationFrame(frame);
  step(Math.min(clock.getDelta(), 0.05) * SPEED, true);
}
function step(rdt, render) {
  if (render) readPads();
  if (PR('KeyP') || PR('Escape') || padsNow.some(g => g.pr(9))) togglePause();
  if (gameState === 'walkin' && (PR('Enter') || PR('Space'))) skipWalkin();
  let dt = rdt;
  if (hitStop > 0) { hitStop -= rdt; dt = rdt * 0.06; }
  if (slowMo > 0 && gameState !== 'paused') { slowMo -= rdt; dt *= 0.3; }
  curDt = dt;
  if (gameState !== 'paused') {
    if (gameState === 'house') updateHouse(dt);
    else if (gameState === 'walkin') updateWalkin(dt);
    else if (gameState !== 'menu' && player) {
      playerControl();
      for (const f of fighters) if (!f.isPlayer && !f.spectator && !f.arrested && f.alive && gameState === 'fight') f.aiUpdate(dt);
      if (AUTO) curDt = dt;
      for (const f of fighters) f.update(dt);
      for (let i = 0; i < fighters.length; i++) for (let j = i + 1; j < fighters.length; j++) {
        const a = fighters[i], b = fighters[j];
        if (!a.alive || !b.alive || a.state === 'down' || b.state === 'down' || a.held === b || b.held === a) continue;
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.75 && d > 0.0001) { const push = (0.75 - d) / 2; a.pos.x -= dx / d * push; a.pos.z -= dz / d * push; b.pos.x += dx / d * push; b.pos.z += dz / d * push; }
      }
      updateProjectiles(dt);
      updateFlow(dt);
    }
    for (const p of pickups) {
      p.t += dt; p.ring.material.opacity = 0.35 + Math.sin(p.t * 4) * 0.25;
      const s = 1 + Math.sin(p.t * 4) * 0.08; p.ring.scale.set(s, s, s);
    }
    updateParticles(dt); updateSparks(dt); updateBlood5(dt); updateRageVig(); updateMusic();
    if (scene === plazaScene) { updateNPCs(dt); updateBarrio13(dt); map24Update(dt); }
    updateWorld(dt);
  }
  updateCamera(rdt);
  chTestUpdate(rdt);
  chpUpdate(rdt);
  if (!render) { for (const k in pressed) delete pressed[k]; return; }
  renderFrame(rdt);
  updatePops(rdt);
  if (gameState !== 'menu') { updateLabels(); hudT -= rdt; if (hudT <= 0) { hudT = 0.05; updateHUD(); } }
  for (const k in pressed) delete pressed[k];
}


// ============================================================
