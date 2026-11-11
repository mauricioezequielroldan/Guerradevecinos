// ============================================================
// ARMAS / OBJETOS
// ============================================================
const CHROME = () => mat(0xc8ccd2, { metalness: 0.9, roughness: 0.22 });
const WEAPONS = {
  escape: { name: 'Caño de escape', dmg: 18, range: 2.3, dur: 6, spd: 1.15, kd: 0.45, snd: 'metal', word: ['¡CLONG!', '¡BONG!'], gy: 0.12, chips: 0xc8ccd2, stats: [5, 4, 2, 2], desc: 'Pesado y ruidoso. Tira al piso.', build(g) {
    cyl(0.04, 0.04, 0.75, CHROME(), 0, -0.38, 0, g, 10);
    cyl(0.11, 0.11, 0.5, CHROME(), 0, -0.98, 0.02, g, 16);
    cyl(0.06, 0.06, 0.08, mat(0x2a2a2a, { metalness: 0.6 }), 0, -1.26, 0.02, g, 10);
    box(0.14, 0.08, 0.04, mat(0x6a6e72, { metalness: 0.8 }), 0, -0.04, 0, g); } },
  cuchillo: { name: 'Cuchillo', dmg: 12, range: 1.75, dur: 9, spd: 0.68, kd: 0.05, snd: 'slash', word: ['¡ZAS!', '¡FIUU!'], gy: 0.04, chips: 0xdddddd, stats: [3, 1, 5, 4], desc: 'Corto, pero rapidísimo.', build(g) {
    box(0.07, 0.22, 0.05, mat(0x1a120c, { roughness: 0.6 }), 0, -0.1, 0, g);
    box(0.11, 0.03, 0.06, mat(0x8a8e92, { metalness: 0.8 }), 0, -0.22, 0, g);
    box(0.065, 0.42, 0.012, CHROME(), 0.01, -0.45, 0, g); } },
  palo: { name: 'Palo de amasar', dmg: 13, range: 2.0, dur: 7, spd: 0.85, kd: 0.15, snd: 'wood', word: ['¡TOC!', '¡POC!'], gy: 0.08, chips: 0xd8b080, stats: [3, 3, 4, 3], desc: 'El de la abuela. Nunca falla.', build(g) {
    cyl(0.03, 0.03, 0.18, mat(0xb8885a), 0, -0.09, 0, g, 8);
    cyl(0.075, 0.075, 0.6, mat(0xd8b080, { roughness: 0.7 }), 0, -0.48, 0, g, 16);
    cyl(0.03, 0.03, 0.18, mat(0xb8885a), 0, -0.87, 0, g, 8); } },
  llave: { name: 'Llave francesa', dmg: 16, range: 1.95, dur: 8, spd: 1.0, kd: 0.3, snd: 'metal', word: ['¡CLANK!', '¡TONK!'], gy: 0.05, chips: 0xaab0b8, stats: [4, 3, 3, 4], desc: 'Del taller. Ajusta cuentas.', build(g) {
    box(0.07, 0.6, 0.035, CHROME(), 0, -0.3, 0, g);
    box(0.22, 0.1, 0.05, CHROME(), 0.03, -0.66, 0, g);
    box(0.06, 0.17, 0.05, CHROME(), 0.11, -0.77, 0, g);
    box(0.06, 0.12, 0.05, CHROME(), -0.05, -0.75, 0, g); } },
  rama: { name: 'Rama', dmg: 11, range: 2.4, dur: 3, spd: 1.0, kd: 0.2, snd: 'wood', word: ['¡CRAC!'], gy: 0.08, chips: 0x5a3e24, build(g) {
    cyl(0.035, 0.055, 1.2, mat(0x5a3e24, { roughness: 1 }), 0, -0.6, 0, g, 6);
    const b = cyl(0.02, 0.03, 0.35, mat(0x5a3e24), 0.1, -0.75, 0, g, 5); b.rotation.z = 0.6;
    const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), mat(0x4a7a2a, { flatShading: true })); lf.position.set(0.2, -0.9, 0); g.add(lf); } },
  ladrillo: { name: 'Ladrillo', throwable: true, throwDmg: 15, dur: 3, gy: 0.17, up: true, chips: 0xb85a2a, build(g) { box(0.26, 0.13, 0.12, mat(0xb85a2a, { roughness: 1 }), 0, -0.12, 0, g); } },
  botella: { name: 'Botella', throwable: true, throwDmg: 13, dur: 1, gy: 0.08, chips: 0x5aaa5a, build(g) { const gl = mat(0x2a6a2a, { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.85 }); cyl(0.07, 0.07, 0.24, gl, 0, -0.32, 0, g, 12); cyl(0.025, 0.06, 0.14, gl, 0, -0.13, 0, g, 10); } },
  piedra: { name: 'Cascote', throwable: true, throwDmg: 12, dur: 2, gy: 0.1, up: true, chips: 0x8a8478, build(g) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), mat(0x8a8478, { flatShading: true })); m.position.y = -0.1; m.castShadow = true; g.add(m); } },
};
const WEAPON_KEYS = Object.keys(WEAPONS);
let LOADOUT_KEYS = ['escape', 'cuchillo', 'palo', 'llave'];   // v9: cambia según la banda
const PLAZA_KEYS = ['ladrillo', 'botella', 'rama', 'piedra', 'ladrillo', 'rama', 'botella', 'piedra'];
function makeWeaponMesh(key) { const g = new THREE.Group(); WEAPONS[key].build(g); g.scale.setScalar(typeof WEAPON_SCALE !== 'undefined' ? WEAPON_SCALE : 1); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }

const pickups = [];
const ringGeo = new THREE.RingGeometry(0.45, 0.6, 24);
function placeOnGround(mesh, def, x, z) {
  mesh.rotation.set(0, Math.random() * Math.PI * 2, 0);
  if (!def.up) { mesh.rotation.order = 'YXZ'; mesh.rotation.z = Math.PI / 2; }
  mesh.position.set(x, def.gy + 0.05, z);
}
function spawnPickupFromMesh(key, mesh, x, z, dur) {
  if (dur <= 0) { if (mesh.parent) mesh.parent.remove(mesh); return null; }
  const def = WEAPONS[key];
  placeOnGround(mesh, def, x, z);
  if (mesh.parent !== scene) scene.add(mesh);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.07, z); scene.add(ring);
  const p = { key, def, mesh, ring, x, z, dur, t: Math.random() * 6 };
  pickups.push(p); return p;
}
function spawnPickup(key, x, z) { return spawnPickupFromMesh(key, makeWeaponMesh(key), x, z, WEAPONS[key].dur); }
function removePickup(p) {
  const i = pickups.indexOf(p); if (i >= 0) pickups.splice(i, 1);
  if (p.ring.parent) p.ring.parent.remove(p.ring); p.ring.material.dispose();
  return p;
}
function randomFreeSpot(maxX, maxZ) {
  maxX = maxX || 14.5; maxZ = maxZ || 18.5;
  for (let tries = 0; tries < 40; tries++) {
    const x = rand(-maxX, maxX), z = rand(-maxZ, maxZ);
    let ok = true;
    for (const o of obstacles) if (x > o.minX - 1 && x < o.maxX + 1 && z > o.minZ - 1 && z < o.maxZ + 1) { ok = false; break; }
    if (ok) return { x, z };
  }
  return { x: 0, z: 0 };
}

// ============================================================
// PARTÍCULAS / FX
// ============================================================
const particles = [];
function spawnParticles(pos, color, n, speed, life, size, gravity) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color, transparent: true }));
    const s = size * rand(0.6, 1.2); m.scale.set(s, s, s);
    m.position.copy(pos);
    scene.add(m);
    particles.push({ m, vx: rand(-1, 1) * speed, vy: rand(0.2, 1.2) * speed, vz: rand(-1, 1) * speed, life, max: life, g: gravity == null ? -14 : gravity });
  }
}
const dustGeo = new THREE.IcosahedronGeometry(0.22, 1);
function spawnDust(x, z, n, big) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(dustGeo, new THREE.MeshBasicMaterial({ color: 0x8a7a62, transparent: true, opacity: 0.4, depthWrite: false }));
    m.position.set(x + rand(-0.4, 0.4), 0.15, z + rand(-0.4, 0.4)); m.scale.setScalar(big ? 1.3 : 0.8); scene.add(m);
    const a = rand(0, 6.28), sp = rand(0.8, big ? 2.6 : 1.6);
    particles.push({ m, vx: Math.cos(a) * sp, vy: rand(0.2, 0.7), vz: Math.sin(a) * sp, life: 0.9, max: 0.9, g: 0, smoke: true, op: 0.4 });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life -= dt;
    if (p.life <= 0) { if (p.m.parent) p.m.parent.remove(p.m); p.m.material.dispose(); particles.splice(i, 1); continue; }
    p.vy += p.g * dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
    const k = p.life / p.max;
    if (p.smoke) { p.vx *= 0.94; p.vz *= 0.94; p.m.material.opacity = p.op * k; p.m.scale.multiplyScalar(1 + dt * 1.4); continue; }
    if (p.m.position.y < 0.05) { p.m.position.y = 0.05; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; }
    p.m.material.opacity = Math.min(1, k * 2); p.m.rotation.x += dt * 8; p.m.rotation.y += dt * 6;
  }
}

// Textos flotantes estilo cómic
const popsEl = document.getElementById('pops');
const pops = [];
const tmpV = new THREE.Vector3();
function popText(pos, text, cls, life) {
  if (cls !== 'ko') for (const q of pops) if (q.max - q.life < 0.3 && q.pos.distanceTo(pos) < 1.6) return;
  while (pops.length >= 3) { const o = pops.shift(); o.el.remove(); }
  const el = document.createElement('div'); el.className = 'pop ' + (cls || ''); el.textContent = text;
  popsEl.appendChild(el);
  pops.push({ el, pos: pos.clone(), life: life || 0.9, max: life || 0.9, rot: rand(-12, 12) });
}
function updatePops(dt) {
  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i]; p.life -= dt;
    if (p.life <= 0) { p.el.remove(); pops.splice(i, 1); continue; }
    p.pos.y += dt * 1.2;
    tmpV.copy(p.pos).project(camera);
    const x = (tmpV.x * 0.5 + 0.5) * window.innerWidth, y = (-tmpV.y * 0.5 + 0.5) * window.innerHeight;
    const k = p.life / p.max;
    const s = k > 0.8 ? 1 + (k - 0.8) * 3 : 1;
    p.el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${p.rot}deg) scale(${s})`;
    p.el.style.opacity = Math.min(1, k * 2.5);
    p.el.style.display = tmpV.z > 1 ? 'none' : 'block';
  }
}

// ============================================================
// AUDIO (sintetizado)
// ============================================================
let AC = null, master = null, noiseBuf = null;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.45; master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 200;
    const g = AC.createGain(); g.gain.value = 0.1;
    s.connect(f); f.connect(g); g.connect(master); s.start();
    startMusic();
  } catch (e) { AC = null; }
}
function tone(type, f0, f1, dur, vol, delay) {
  const t = AC.currentTime + (delay || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, freq, vol, type, q, delay) {
  const t = AC.currentTime + (delay || 0);
  const s = AC.createBufferSource(); s.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1;
  const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
}
function sfx(kind, vol) {
  if (!AC) return;
  const v = vol == null ? 1 : vol;
  switch (kind) {
    case 'hit': tone('sine', 140, 50, 0.12, 0.7 * v); noise(0.07, 2000, 0.4 * v); break;
    case 'heavy': tone('sine', 110, 35, 0.25, 0.9 * v); noise(0.15, 1300, 0.6 * v); break;
    case 'thud': tone('sine', 80, 30, 0.22, 0.8 * v); noise(0.18, 500, 0.5 * v); break;
    case 'siren': tone('square', 620, 960, 0.28, 0.18 * v); setTimeout(() => tone('square', 960, 620, 0.28, 0.18 * v), 290); break;
    case 'metal': tone('triangle', 900, 500, 0.35, 0.25 * v); tone('square', 1400, 900, 0.2, 0.08 * v); noise(0.08, 3000, 0.4 * v); break;
    case 'wood': tone('square', 520, 260, 0.07, 0.15 * v); tone('sine', 180, 90, 0.12, 0.6 * v); noise(0.05, 1500, 0.3 * v); break;
    case 'slash': noise(0.12, 6000, 0.35 * v, 'highpass'); tone('sine', 130, 50, 0.1, 0.5 * v); break;
    case 'glass': noise(0.35, 5000, 0.5 * v, 'highpass'); tone('triangle', 2400, 1800, 0.25, 0.12 * v); break;
    case 'grab': noise(0.12, 900, 0.35 * (v == null ? 1 : v), 'bandpass', 1.2); tone('sine', 160, 90, 0.12, 0.4 * (v == null ? 1 : v)); break;
    case 'block': noise(0.05, 4500, 0.25 * v, 'highpass'); tone('square', 500, 350, 0.06, 0.08 * v); break;
    case 'swing': noise(0.16, 900, 0.18 * v, 'bandpass', 2); break;
    case 'break': noise(0.3, 2500, 0.55 * v, 'highpass'); tone('sawtooth', 300, 80, 0.2, 0.15 * v); break;
    case 'ko': tone('sawtooth', 320, 60, 0.7, 0.18 * v); tone('sine', 80, 30, 0.4, 0.6 * v); break;
    case 'pickup': tone('triangle', 600, 1100, 0.1, 0.2 * v); break;
    case 'throw': noise(0.22, 700, 0.25 * v, 'bandpass', 1.5); break;
    case 'jump': noise(0.12, 500, 0.2 * v, 'bandpass', 2); tone('sine', 200, 320, 0.12, 0.15 * v); break;
    case 'bell': tone('sawtooth', 110, 105, 0.9, 0.12 * v); tone('square', 220, 215, 0.5, 0.06 * v); noise(0.4, 400, 0.3 * v); break;
    case 'rage': tone('sawtooth', 90, 180, 0.6, 0.25 * v); noise(0.5, 600, 0.3 * v); break;
    case 'whistle': tone('sine', 1500, 1700, 0.25, 0.2 * v); tone('sine', 1700, 1400, 0.3, 0.2 * v, 0.28); break;
    case 'bark': tone('square', 520, 260, 0.09, 0.12 * v); noise(0.08, 900, 0.25 * v, 'bandpass', 3); tone('square', 480, 240, 0.09, 0.12 * v, 0.16); noise(0.08, 900, 0.25 * v, 'bandpass', 3, 0.16); break;
    case 'shutter': noise(0.04, 4000, 0.2 * v, 'highpass'); noise(0.05, 3000, 0.15 * v, 'highpass', 1, 0.07); break;
    case 'door': tone('sawtooth', 220, 140, 0.35, 0.05 * v); noise(0.2, 400, 0.2 * v, 'lowpass', 1, 0.3); tone('sine', 70, 40, 0.15, 0.5 * v, 0.32); break;
  }
}
function distVol(x, z) { const d = Math.hypot(x - camera.position.x, z - camera.position.z); return clamp(1.4 - d / 30, 0.15, 1); }

// chispa de impacto: destello aditivo que se expande y apaga en ~0.12 s
const sparks = [];
function spawnSpark(pos, big, color) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: color || 0xfff0c0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  s.position.copy(pos); scene.add(s);
  sparks.push({ s, t: 0, max: big ? 0.16 : 0.1, size: big ? 2.6 : 1.4 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  ring.position.copy(pos); ring.lookAt(camera.position); scene.add(ring);
  sparks.push({ s: ring, t: 0, max: big ? 0.2 : 0.13, size: big ? 3.2 : 1.8, ring: true });
}
function updateSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const k = sparks[i]; k.t += dt; const u = k.t / k.max;
    if (u >= 1) { if (k.s.parent) k.s.parent.remove(k.s); k.s.material.dispose(); if (k.ring) k.s.geometry.dispose(); sparks.splice(i, 1); continue; }
    const sc = k.size * (k.ring ? 0.4 + u : 0.6 + 0.6 * u); k.s.scale.set(sc, sc, sc);
    k.s.material.opacity = 1 - u * u;
  }
}
