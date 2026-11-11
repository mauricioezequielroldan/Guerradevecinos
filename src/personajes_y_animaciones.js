// v16 PRUEBA DE PERSONAJES NUEVOS: CH01 y CH02 (malla con piel + texturas, de Claude)
// Se montan en la plaza con sus 5 movimientos Mixamo retargeteados. No toca el combate.
// ============================================================
const CHT = { loop: false, on: false, built: false, chars: [], lights: [], yaw: 0.25, dist: 5.4, h: 1.5, drag: false, auto: false, autoT: 0, ui: null };
const chDec = (b, A) => { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new A(u.buffer); };
const chM4 = a => new THREE.Matrix4().set(...a);
let CH_SRC = null;
function chSource() {
  if (CH_SRC) return CH_SRC;
  const SRC = window.GV_CUERPO;
  const names = SRC.bones.map(b => b.name.replace('mixamorig_', ''));
  const bindW = [], restW = [];
  SRC.bones.forEach((b, i) => {
    let W;
    if (SRC.inv[i]) W = chM4(SRC.inv[i]).invert();
    else W = (b.parent >= 0 ? bindW[b.parent].clone() : new THREE.Matrix4()).multiply(chM4(b.m));
    bindW[i] = W; restW[i] = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(W));
  });
  const hips0 = new THREE.Vector3().setFromMatrixPosition(bindW[names.indexOf('Hips')]);
  const clips = {}; for (const k in SRC.clips) clips[k] = { n: SRC.clips[k].n, f: chDec(SRC.clips[k].f, Float32Array) };
  return (CH_SRC = { SRC, names, restW, restWInv: restW.map(q => q.clone().invert()), hips0, clips });
}
const CH_CLIP_NAMES = { Flying_Kick: 'Patada voladora', Head_Hit: 'Golpe en la cabeza', Knee_Jabs_To_Uppercut: 'Rodilla + jabs + uppercut', Standing_Melee_Combo_Attack_Ver__2: 'Combo con herramienta', Strike_Foward_Jog: 'Golpe avanzando' };
function chTex(s, srgb) {
  if (!s) return null;
  const img = new Image(), t = new THREE.Texture(img);
  img.onload = () => { t.needsUpdate = true; };
  img.src = 'data:image/' + (s.startsWith('png:') ? 'png' : 'jpeg') + ';base64,' + s.slice(4);
  if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
function chBuild(CH, label) {
  const S = chSource();
  const bones = CH.bones.map(b => { const o = new THREE.Bone(); o.name = b.name; chM4(b.m).decompose(o.position, o.quaternion, o.scale); return o; });
  CH.bones.forEach((b, i) => { if (b.parent >= 0) bones[b.parent].add(bones[i]); });
  const root = new THREE.Group(); root.name = 'CH_' + label;
  CH.bones.forEach((b, i) => { if (b.parent < 0) root.add(bones[i]); });
  const skel = new THREE.Skeleton(bones, CH.bones.map(b => chM4(b.w).invert()));
  for (const m of CH.meshes) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(chDec(m.pos, Float32Array), 3));
    if (m.nrm) g.setAttribute('normal', new THREE.BufferAttribute(chDec(m.nrm, Float32Array), 3));
    if (m.uv) g.setAttribute('uv', new THREE.BufferAttribute(chDec(m.uv, Float32Array), 2));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(chDec(m.si, Uint8Array)), 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(chDec(m.sw, Float32Array), 4));
    g.setIndex(new THREE.BufferAttribute(chDec(m.idx, Uint32Array), 1));
    if (!m.nrm) g.computeVertexNormals();
    const mt = new THREE.MeshStandardMaterial({ map: chTex(m.map, true), normalMap: chTex(m.nmap, false), roughness: /Hair/.test(m.name) ? 0.55 : 0.78, metalness: 0 });
    if (m.alpha) { mt.alphaTest = 0.45; mt.side = THREE.DoubleSide; }
    const sm = new THREE.SkinnedMesh(g, mt); sm.castShadow = true; sm.receiveShadow = true; sm.frustumCulled = false; sm.bind(skel, new THREE.Matrix4()); root.add(sm);
  }
  const tgtRestW = CH.bones.map(b => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(chM4(b.w))));
  const hipsI = CH.bones.findIndex(b => b.name === 'Hips'), hips0 = new THREE.Vector3().setFromMatrixPosition(chM4(CH.bones[hipsI].w));
  const hScale = hips0.y / S.hips0.y, map = CH.bones.map(b => S.names.indexOf(b.name));
  // misma altura de cadera que los luchadores del juego
  root.scale.setScalar((HIP * BODY_S) / hips0.y);
  const tmp = new THREE.Matrix4(), sW = [], qW = [], tW = [], qi = new THREE.Quaternion(), pv = new THREE.Vector3();
  const o = {
    label, root, bones, clip: null, t: 0,
    rest() { CH.bones.forEach((b, i) => chM4(b.m).decompose(bones[i].position, bones[i].quaternion, bones[i].scale)); this.clip = null; },
    play(k) { this.clip = k; this.t = 0; },
    stand() { this.clip = null; this.pose('Head_Hit', 0); },
    dur(k) { const c = S.clips[k || this.clip]; return c ? c.n / 30 : 0; },
    pose(k, tt) {
      const c = S.clips[k], NB = S.SRC.bones.length, fi = Math.floor(tt * 30) % c.n;
      for (let i = 0; i < NB; i++) {
        const off = (fi * NB + i) * 16; tmp.set(...c.f.subarray(off, off + 16));
        const p = S.SRC.bones[i].parent;
        sW[i] = (sW[i] || new THREE.Matrix4()).copy(p >= 0 ? sW[p] : tmp); if (p >= 0) sW[i].multiply(tmp);
        qW[i] = (qW[i] || new THREE.Quaternion()).setFromRotationMatrix(new THREE.Matrix4().extractRotation(sW[i]));
      }
      CH.bones.forEach((b, j) => {
        const si = map[j]; let qw;
        if (si >= 0) qw = qW[si].clone().multiply(S.restWInv[si]).multiply(tgtRestW[j]);
        else qw = (b.parent >= 0 ? tW[b.parent] : qi.identity()).clone().multiply(new THREE.Quaternion().setFromRotationMatrix(chM4(b.m)));
        tW[j] = qw;
        const pq = b.parent >= 0 ? tW[b.parent] : new THREE.Quaternion();
        bones[j].quaternion.copy(pq.clone().invert().multiply(qw));
        if (j === hipsI && si >= 0) {
          pv.setFromMatrixPosition(sW[si]).sub(S.hips0).multiplyScalar(hScale).add(hips0);
          if (b.parent >= 0) pv.applyMatrix4(bones[b.parent].matrixWorld.clone().invert());
          bones[j].position.copy(pv);
        }
      });
    },
    update(dt) { if (!this.clip) return; this.t += dt; if (!CHT.loop && this.t >= this.dur()) { this.stand(); return; } this.pose(this.clip, this.t); }
  };
  o.stand();
  return o;
}
function chBuildAll() {
  if (CHT.built) return true;
  if (!window.GV_CH01 || !window.GV_CH02 || !window.GV_CUERPO) return false;
  const a = chBuild(window.GV_CH01, 'ch01'), b = chBuild(window.GV_CH02, 'ch02');
  a.root.position.set(-1.15, 0, 0.4); a.root.rotation.y = Math.PI / 2;
  b.root.position.set(1.15, 0, 0.4); b.root.rotation.y = -Math.PI / 2;
  CHT.chars = [a, b];
  // luz de prueba: farol cálido + relleno frío (la plaza es de noche)
  const key = new THREE.SpotLight(0xffd9a8, 2.6, 22, 0.75, 0.55, 1.2); key.position.set(2.5, 6.5, 5); key.target.position.set(0, 1, 0.4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0006;
  const fill = new THREE.PointLight(0x8fb0ff, 0.9, 12); fill.position.set(-3, 2.6, -2.5);
  CHT.lights = [key, key.target, fill];
  CHT.built = true; return true;
}
function chUI() {
  if (CHT.ui) return CHT.ui;
  const d = document.createElement('div'); d.id = 'chTestUI';
  d.style.cssText = 'position:fixed;right:14px;top:14px;z-index:40;display:none;flex-direction:column;gap:6px;background:rgba(10,10,16,.82);padding:12px 14px;border:2px solid #ff5a1a;border-radius:8px;font:13px Arial,sans-serif;color:#eee;max-width:260px;max-height:92vh;overflow:auto';
  const btn = (txt, act, k) => `<button data-a="${act}" data-k="${k || ''}" style="font:13px Arial;padding:5px 8px;margin:2px 0;background:#2a2a34;color:#fff;border:1px solid #555;border-radius:4px;cursor:pointer;text-align:left">${txt}</button>`;
  let h = '<div style="font:20px Impact,Arial Black;color:#ff5a1a;letter-spacing:1px">PRUEBA DE PERSONAJES</div><div style="opacity:.75;margin-bottom:4px">Arrastrá con el mouse para girar · rueda para acercar</div>';
  for (const [i, n] of [[0, 'CH01'], [1, 'CH02']]) {
    h += `<div style="margin-top:6px;font-weight:bold;color:${i ? '#ff7a5a' : '#7aa8ff'}">${n}</div>` + btn('Parado (guardia)', 'stand', i) + btn('Pose en T', 'rest', i);
    for (const k in CH_CLIP_NAMES) h += btn(CH_CLIP_NAMES[k], 'clip' + i, k);
  }
  h += '<div style="margin-top:8px"></div>' + btn('🔁 Repetir movimiento: NO', 'loop') + btn('▶ Intercambio automático (los dos)', 'auto') + btn('✖ Volver al menú', 'exit');
  d.innerHTML = h; document.body.appendChild(d);
  d.addEventListener('click', e => {
    const a = e.target.dataset && e.target.dataset.a; if (!a) return;
    const k = e.target.dataset.k;
    if (a === 'exit') return chTestStop();
    if (a === 'loop') { CHT.loop = !CHT.loop; e.target.textContent = '🔁 Repetir movimiento: ' + (CHT.loop ? 'SÍ' : 'NO'); return; }
    if (a === 'auto') { CHT.auto = !CHT.auto; CHT.autoT = 0; e.target.textContent = CHT.auto ? '⏸ Parar intercambio' : '▶ Intercambio automático (los dos)'; return; }
    CHT.auto = false;
    if (a === 'rest') CHT.chars[+k].rest();
    else if (a === 'stand') CHT.chars[+k].stand();
    else if (a.startsWith('clip')) CHT.chars[+a.slice(4)].play(k);
  });
  return (CHT.ui = d);
}
function chAutoNext() {
  const [a, b] = CHT.chars, atk = Math.random() < 0.5 ? a : b, def = atk === a ? b : a;
  const k = pick(['Flying_Kick', 'Knee_Jabs_To_Uppercut', 'Standing_Melee_Combo_Attack_Ver__2', 'Strike_Foward_Jog']);
  atk.play(k); def.stand();
  CHT.pendingHit = { who: def, at: Math.min(0.55, atk.dur(k) * 0.35) };
  CHT.autoT = atk.dur(k) + 0.6;
}
function chTestStart() {
  if (!chBuildAll()) { alert('No se encontraron los datos de CH01/CH02 en este archivo.'); return; }
  if (CHT.on) return;
  CHT.on = true; setScene(plazaScene);
  for (const c of CHT.chars) plazaScene.add(c.root);
  for (const l of CHT.lights) plazaScene.add(l);
  CHT.chars[0].play('Knee_Jabs_To_Uppercut'); CHT.chars[1].play('Head_Hit');
  document.getElementById('menu').style.display = 'none';
  chUI().style.display = 'flex';
  window.__camLock = true;
}
function chTestStop() {
  if (!CHT.on) return;
  CHT.on = false; CHT.auto = false;
  for (const c of CHT.chars) plazaScene.remove(c.root);
  for (const l of CHT.lights) plazaScene.remove(l);
  if (CHT.ui) CHT.ui.style.display = 'none';
  document.getElementById('menu').style.display = '';
  window.__camLock = false;
}
function chTestUpdate(dt) {
  if (!CHT.on) return;
  if (CHT.auto) {
    CHT.autoT -= dt; if (CHT.autoT <= 0) chAutoNext();
    const ph = CHT.pendingHit; if (ph) { ph.at -= dt; if (ph.at <= 0) { ph.who.play('Head_Hit'); CHT.pendingHit = null; } }
  }
  for (const c of CHT.chars) { c.root.updateMatrixWorld(true); c.update(dt); }
  const cx = 0, cy = 1.05, cz = 0.4;
  camera.position.set(cx + Math.sin(CHT.yaw) * CHT.dist, cy + CHT.h - 0.6, cz + Math.cos(CHT.yaw) * CHT.dist);
  camera.lookAt(cx, cy, cz);
}
renderer.domElement.addEventListener('pointerdown', () => { if (CHT.on) CHT.drag = true; });
window.addEventListener('pointerup', () => { CHT.drag = false; });
window.addEventListener('pointermove', e => { if (CHT.on && CHT.drag) { CHT.yaw -= e.movementX * 0.008; CHT.h = Math.max(0.4, Math.min(4, CHT.h + e.movementY * 0.01)); } });
renderer.domElement.addEventListener('wheel', e => { if (CHT.on) { CHT.dist = Math.max(2.2, Math.min(14, CHT.dist + Math.sign(e.deltaY) * 0.5)); e.preventDefault(); } }, { passive: false });
{
  const sb = document.getElementById('startBtn');
  if (sb) {
    const b = document.createElement('button'); b.id = 'chTestBtn'; b.textContent = '🧍 PROBAR PERSONAJES NUEVOS (CH01 · CH02)';
    b.style.cssText = 'margin-top:10px;background:#1d3766;color:#fff;font:18px Impact,Arial Black,sans-serif;letter-spacing:1px;padding:9px 22px;border:2px solid #6a9aff;border-radius:6px;cursor:pointer';
    sb.insertAdjacentElement('afterend', b);
    b.addEventListener('click', chTestStart);
  }
  if (params.has('ch')) setTimeout(chTestStart, 300);
}


// ============================================================
// v18 TODOS LOS LUCHADORES CON CUERPO NUEVO (CH01 hombres / CH02 mujeres)
// Ropa teñida según cada banda + accesorios (gorra, vincha, anteojos, cara tapada, cadena, pelo).
// El cuerpo viejo queda invisible y sigue mandando: combate, IK, golpes y colisiones no cambian.
// ============================================================
const CHP = { on: !params.has('sinch'), list: [] };

const CHCACHE = {};
const _m4 = new THREE.Matrix4();
function chpTagFor(f) {
  if (f.civil) return f.cfg.name === 'Doña Chola' ? 'ch02' : null;          // de los vecinos, por ahora solo la chusma
  if (/^La\s/i.test(f.name || '') || f.cfg.female) return 'ch02';
  return window.GV_CH12 && f.idx % 2 === 1 ? 'ch12' : 'ch01';               // variedad de cuerpos en cada banda
}
// ---------- datos compartidos por modelo (geometría y texturas se decodifican una sola vez) ----------
function chpCache(tag) {
  if (CHCACHE[tag]) return CHCACHE[tag];
  const CH = window['GV_' + String(tag).toUpperCase()] || (tag === 'ch02' ? window.GV_CH02 : tag === 'ch12' ? window.GV_CH12 : window.GV_CH01);   // v46: cualquier cuerpo cargado (GV_CH21, GV_CH08...)
  const texCache = {};
  const tex = (s, srgb) => { if (!s) return null; const key = s.length + ':' + s.slice(4, 60) + srgb; if (texCache[key]) return texCache[key]; const t = chTex(s, srgb); t.flipY = true; return (texCache[key] = t); };
  const meshes = CH.meshes.map(m => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(chDec(m.pos, Float32Array), 3));
    if (m.nrm) g.setAttribute('normal', new THREE.BufferAttribute(chDec(m.nrm, Float32Array), 3));
    if (m.uv) g.setAttribute('uv', new THREE.BufferAttribute(chDec(m.uv, Float32Array), 2));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(chDec(m.si, Uint8Array)), 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(chDec(m.sw, Float32Array), 4));
    g.setIndex(new THREE.BufferAttribute(chDec(m.idx, Uint32Array), 1));
    if (!m.nrm) g.computeVertexNormals();
    if (m.part) g.setAttribute('gvPart', new THREE.BufferAttribute(new Float32Array(chDec(m.part, Uint8Array)), 1));
    const o = { name: m.name, g, map: tex(m.map, true), nmap: tex(m.nmap, false), alpha: m.alpha, gain: { value: 2.0 }, pg: m.pg ? m.pg.slice() : null };
    if (o.pg) o.pg[5] = o.pg[0];   // cara (barba, cejas) en tono piel, conservando su sombra
    // brillo medio de la parte de la textura que usa esta malla (para teñir sin perder pliegues ni sombras)
    if (o.map && m.uv) {
      const img = o.map.image, uv = g.attributes.uv.array;
      const calc = () => {
        try {
          const cv = document.createElement('canvas'), W = cv.width = Math.min(512, img.width), H = cv.height = Math.min(512, img.height);
          const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, W, H); const px = cx.getImageData(0, 0, W, H).data;
          const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
          let sum = 0, n = 0; const step = Math.max(1, Math.floor(uv.length / 2 / 1500));
          for (let i = 0; i < uv.length / 2; i += step) {
            const x = Math.min(W - 1, Math.max(0, Math.floor((uv[i * 2] % 1 + 1) % 1 * W))), y = Math.min(H - 1, Math.max(0, Math.floor((1 - (uv[i * 2 + 1] % 1 + 1) % 1) * H)));
            const k = (y * W + x) * 4; sum += 0.299 * lin(px[k]) + 0.587 * lin(px[k + 1]) + 0.114 * lin(px[k + 2]); n++;
          }
          if (n) o.gain.value = Math.max(0.8, Math.min(8, 0.9 / Math.max(0.02, sum / n)));
        } catch (e) { }
      };
      if (img.complete && img.width) calc(); else img.addEventListener('load', calc);
    }
    return o;
  });
  const names = CH.bones.map(b => b.name);
  return (CHCACHE[tag] = { CH, meshes, names });
}
// ---------- material con "re-teñido": conserva la textura (pliegues, costuras) y cambia el color ----------
const linCol = h => new THREE.Color(h).convertSRGBToLinear();
function chpMatParts(cm, opts) {
  const mt = new THREE.MeshStandardMaterial({ map: cm.map, normalMap: cm.nmap, roughness: 0.8, metalness: 0 });
  const cols = opts.parts.map(c => linCol(c == null ? 0xffffff : c));
  while (cols.length < 6) cols.push(linCol(0xffffff));
  const U = { uPC: { value: cols }, uPA: { value: opts.amts.concat([0, 0, 0, 0, 0, 0]).slice(0, 6) }, uPG: { value: (cm.pg || [1, 1, 1, 1, 1, 1]).slice(0, 6) } };
  mt.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute float gvPart; flat varying float vPart;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vPart = gvPart;');
    sh.fragmentShader = 'flat varying float vPart; uniform vec3 uPC[6]; uniform float uPA[6]; uniform float uPG[6];\n' +
      sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        int gp = int(vPart + 0.5); vec3 pc = uPC[0]; float pa = uPA[0]; float pgn = uPG[0];
        for (int i = 1; i < 6; i++) if (i == gp) { pc = uPC[i]; pa = uPA[i]; pgn = uPG[i]; }
        float gl = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        diffuseColor.rgb = mix(diffuseColor.rgb, pc * min(gl * pgn, 1.35), pa);`);
  };
  mt.customProgramCacheKey = () => 'gvParts';
  return mt;
}
function chpMat(cm, opts) {
  if (opts.parts) return chpMatParts(cm, opts);
  const mt = new THREE.MeshStandardMaterial({ map: cm.map, normalMap: cm.nmap, roughness: opts.rough != null ? opts.rough : 0.8, metalness: 0 });
  if (cm.alpha) { mt.alphaTest = 0.45; mt.side = THREE.DoubleSide; }
  if (!opts.col) return mt;
  const U = {
    uRecol: { value: linCol(opts.col) }, uAmt: { value: opts.amt != null ? opts.amt : 0.92 }, uGain: cm.gain,
    uRecol2: { value: linCol(opts.col2 != null ? opts.col2 : opts.col) }, uSplitY: { value: opts.splitY != null ? opts.splitY : -99 },
    uStripe: { value: linCol(opts.stripe != null ? opts.stripe : opts.col) }, uStripeOn: { value: opts.stripe != null ? 1 : 0 }, uStripeTop: { value: opts.stripeTop || 1.5 }, uClipY: { value: opts.clipY != null ? opts.clipY : -99 }
  };
  mt.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying float vBindY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vBindY = position.y;');
    sh.fragmentShader = 'varying float vBindY;\nuniform vec3 uRecol; uniform vec3 uRecol2; uniform vec3 uStripe; uniform float uAmt; uniform float uGain; uniform float uSplitY; uniform float uStripeOn; uniform float uStripeTop; uniform float uClipY;\n' +
      sh.fragmentShader.replace('#include <map_fragment>', `if (vBindY < uClipY) discard;
        #include <map_fragment>
        float gvLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 gvCol = vBindY < uSplitY ? uRecol2 : uRecol;
        if (uStripeOn > 0.5 && vBindY > uSplitY && vBindY < uStripeTop && fract(vBindY * 9.0) < 0.5) gvCol = uStripe;
        diffuseColor.rgb = mix(diffuseColor.rgb, gvCol * min(gvLum * uGain, 1.35), uAmt);`);
  };
  mt.customProgramCacheKey = () => 'gvRecolor2';
  return mt;
}
// ---------- qué color va en cada parte, según la ropa del luchador ----------
function chpOutfit(f, tag) {
  const c = f.cfg, num = v => (typeof v === 'number' ? v : null), hexs = s => parseInt(String(s).replace('#', ''), 16);
  let top = c.jacket ? c.jacket.color : c.stripes ? hexs(c.stripes[0]) : num(c.topColor);
  if (c.top === 'bare') top = { Cacho: 0x1f3a6a, Pocho: 0x8a1f1f }[f.name] || 0x2a2a2a;
  if (top != null) {   // si la ropa queda casi igual a la piel, se oscurece para que se note
    const a = new THREE.Color(top), b = new THREE.Color(c.skin != null ? c.skin : 0xd9a27a);
    if (Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 0.35) top = a.multiplyScalar(0.45).getHex();
  }
  const pants = c.pants === 'jogging' ? 0x1c1c22 : num(c.pants) != null ? c.pants : 0x2e4058;
  return {
    bare: false, top: top != null ? top : 0xd8d0c0, pants,
    stripe: c.stripes ? hexs(c.stripes[1]) : null, stripeA: c.stripes ? hexs(c.stripes[0]) : null,
    shoe: c.boots != null ? c.boots : c.shoe != null ? c.shoe : 0xeeeeea, skin: c.skin != null ? c.skin : 0xd9a27a,
    hair: c.hairColor != null ? c.hairColor : 0x2a1a10, socks: c.socks ? c.socks[0] : null
  };
}
function chpMeshOpts(name, o, tag, f) {
  const c = f ? f.cfg : {};
  if (tag === 'ch12') {
    if (/hair/i.test(name)) return c.cap != null || c.hat != null || c.hair === 'bald' || c.hair === 'afro' ? { hide: true } : { col: o.hair, amt: 0.88, rough: 0.6 };
    return { parts: [o.skin, o.stripe != null ? o.stripeA : o.top, o.pants, o.shoe, null, o.skin], amts: [0.6, 0.92, 0.92, 0.75, 0, 0.6] };
  }
  const n = name.replace(/^Ch\d+_/, '');
  switch (n) {
    case 'Body': return { col: o.skin, amt: 0.55, rough: 0.6 };
    case 'Shirt': return o.bare ? { hide: true } : { col: o.stripe != null ? o.stripeA : o.top, stripe: o.stripe, splitY: -99 };
    case 'Pants': return { col: o.pants };
    case 'Sneakers': return { col: o.shoe, amt: 0.75, rough: 0.6 };
    case 'Socks': return o.socks != null ? { col: o.socks } : {};
    case 'Hair': return c.rollers ? { col: o.hair, amt: 0.9, rough: 0.6, clipY: 1.5 } : c.hat != null ? { col: o.hair, amt: 0.85, rough: 0.55, clipY: 1.5 } : { col: o.hair, amt: 0.85, rough: 0.55 };
    case 'Cloth': return o.bare ? { col: o.skin, amt: 0.55, col2: o.pants, splitY: 0.97 } : { col: o.stripe != null ? o.stripeA : o.top, col2: o.pants, splitY: 0.97, stripe: o.stripe, stripeTop: 1.45 };
    default: return {};
  }
}
// ---------- accesorios pegados a los huesos de la cabeza y el cuello ----------
function chpAccessories(f, v, tag) {
  const c = f.cfg, B = n => v.bones[v.names.indexOf(n)], head = B('Head'), neck = B('Neck');
  if (!head) return;
  const zf = tag === 'ch02' ? 0.04 : 0;          // la cabeza de CH02 está un poco más atrás respecto del hueso
  const add = (m, parent) => { m.castShadow = true; (parent || head).add(m); return m; };
  const ell = (rx, ry, rz, col, x, y, z, half, opts) => {
    const g = half ? new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2) : new THREE.SphereGeometry(1, 18, 12);
    const m = new THREE.Mesh(g, typeof col === 'number' ? mat(col, opts || { roughness: 0.8 }) : col); m.scale.set(rx, ry, rz); m.position.set(x, y, z + zf); return m;
  };
  const hairCol = c.hairColor != null ? c.hairColor : 0x2a1a10;
  // pelo extra con formas solo para rulos/afro (el resto usa el pelo real, ver chpHair)
  if (tag !== 'ch02' && c.cap == null && c.hat == null && !c.bandana && (c.hair === 'afro' || c.hair === 'rulos')) {
    switch (c.hair) {
      case 'rulos': add(ell(0.103, 0.075, 0.118, hairCol, 0, 0.118, -0.012, true)).rotation.x = -0.22; add(ell(0.097, 0.085, 0.06, hairCol, 0, 0.08, -0.075)); break;
      case 'long': add(ell(0.104, 0.076, 0.119, hairCol, 0, 0.118, -0.012, true)).rotation.x = -0.22; add(ell(0.1, 0.17, 0.06, hairCol, 0, 0.02, -0.085)); break;
      case 'afro': add(ell(0.165, 0.15, 0.16, hairCol, 0, 0.155, -0.045)); break;
    }
    if (c.hair === 'rulos') for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; add(ell(0.03, 0.03, 0.03, hairCol, Math.cos(a) * 0.07, 0.19, Math.sin(a) * 0.07 - 0.02)); }
  }
  if (c.cap != null) {
    add(ell(0.108, 0.08, 0.122, c.cap, 0, 0.122, -0.008, true, { roughness: 0.7 })).rotation.x = -0.18;
    const vis = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.012, 16, 1, false, 0, Math.PI), mat(c.cap, { roughness: 0.7 }));
    vis.rotation.y = c.capBack ? Math.PI / 2 : -Math.PI / 2; vis.position.set(0, 0.13, (c.capBack ? -0.1 : 0.1) + zf); vis.scale.z = 1.25; add(vis);
  }
  // ---- sombrero de gaucho / boina ----
  if (c.hat != null) {
    const hm = mat(c.hat, { roughness: 0.85 });
    if (c.hatStyle === 'boina') {
      const b = add(ell(0.118, 0.042, 0.128, hm, 0.012, 0.16, -0.006)); b.rotation.z = -0.18; b.rotation.x = -0.12;
      add(ell(0.01, 0.014, 0.01, hm, 0.012, 0.205, -0.006));
    } else {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 28), hm); brim.position.set(0, 0.152, -0.006 + zf); brim.rotation.x = -0.08; add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.106, 0.095, 24), hm); crown.position.set(0, 0.2, -0.01 + zf); crown.rotation.x = -0.08; add(crown);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.107, 0.107, 0.022, 24, 1, true), mat(c.hatBand != null ? c.hatBand : 0x1a1a1a, { roughness: 0.6 })); band.position.set(0, 0.168, -0.008 + zf); band.rotation.x = -0.08; add(band);
    }
  }
  // ---- ruleros (idea robada de la abuela de Mixamo) ----
  if (c.rollers) {
    const cs = [0xff6fae, 0xffffff, 0x6fd0ff, 0xff6fae, 0xffffff, 0x6fd0ff, 0xff6fae, 0xffffff, 0x6fd0ff];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 1.6 - 0.8 * Math.PI, r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.075, 12), mat(cs[i], { roughness: 0.5 }));
      const top = i >= 6, ang = top ? (i - 6) * 0.7 - 0.7 : a;
      r.position.set(Math.sin(ang) * (top ? 0.03 : 0.1), top ? 0.205 : 0.15, Math.cos(ang) * (top ? 0.03 : 0.1) - 0.02 + zf);
      r.rotation.z = Math.PI / 2; r.rotation.y = ang; add(r);
    }
  }
  // ---- pañuelo al cuello ----
  if (c.scarf != null && neck) { const sc = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 20), mat(c.scarf, { roughness: 0.9 })); sc.rotation.x = Math.PI / 2 - 0.25; sc.position.set(0, 0.0, 0.015 + zf); add(sc, neck);
    const kn = ell(0.035, 0.05, 0.02, c.scarf, 0, -0.04, 0.085, false, { roughness: 0.9 }); add(kn, neck); }
  // ---- poncho ----
  if (c.poncho) chpPoncho(f, v, c, zf);
  if (c.bandana != null) add(ell(0.106, 0.078, 0.12, c.bandana, 0, 0.12, -0.01, true)).rotation.x = -0.2;
  if (c.headband != null) { const hb = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 8, 24), mat(c.headband, { roughness: 0.6 })); hb.rotation.x = Math.PI / 2 - 0.2; hb.position.set(0, 0.13, -0.005 + zf); hb.scale.set(1, 1.12, 1); add(hb); }
  if (c.glasses) {
    const fr = mat(c.glassesColor != null ? c.glassesColor : 0x111111, { roughness: 0.25, metalness: 0.3 });
    for (const s of [-1, 1]) {
      const g = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.0045, 6, 16), fr); g.position.set(s * 0.034, 0.093, 0.098 + zf); add(g);
      if (c.glassesColor != null) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.021, 14), mat(c.glassesColor, { transparent: true, opacity: 0.5, roughness: 0.1 })); l.position.set(s * 0.034, 0.093, 0.097 + zf); add(l); }
    }
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.004, 0.004), fr); br.position.set(0, 0.095, 0.1 + zf); add(br);
  }
  if (c.faceCover) add(ell(0.088, 0.052, 0.088, 0x151515, 0, 0.03, 0.03, false, { roughness: 0.9 }));
  if (c.mustache) add(ell(0.03, 0.008, 0.012, hairCol, 0, 0.045, 0.098));
  if (c.beard) add(ell(0.082, 0.055, 0.082, hairCol, 0, 0.022, 0.035));
  if (c.chain && neck) { const ch = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.006, 6, 22), mat(0xe8c040, { metalness: 0.95, roughness: 0.2 })); ch.rotation.x = 1.35; ch.position.set(0, -0.01, 0.02 + zf); add(ch, neck); }
  if (c.neonBracelets) for (const n of ['LeftHand', 'RightHand']) { const h = B(n); if (h) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 16), mat(c.glassesColor || 0xff44aa, { emissive: c.glassesColor || 0xff44aa, emissiveIntensity: 0.4 })); b.rotation.x = Math.PI / 2; b.position.y = -0.01; add(b, h); } }
}
// ---------- pelo de verdad para los hombres: se toma el de CH02 y se monta en el esqueleto de CH01 ----------
function chpHair(f, v, skel) {
  const c = f.cfg, style = c.hair || 'short';
  if (style === 'bald' || style === 'afro') return;
  const C2 = chpCache('ch02'), hm = C2.meshes.find(m => /Hair/.test(m.name)); if (!hm) return;
  // mismas huesos de CH01, pero con la pose de "atado" de CH02: el pelo queda exactamente sobre la cabeza nueva
  const sk2 = new THREE.Skeleton(v.bones, C2.CH.bones.map(b => chM4(b.w).invert()));
  const clip = c.cap != null || c.bandana != null ? 1.66 : style === 'long' ? 1.36 : style === 'rulos' ? 1.6 : 1.585;
  const col = c.hairColor != null ? c.hairColor : 0x2a1a10;
  const sm = new THREE.SkinnedMesh(hm.g, chpMat(hm, { col, amt: 0.9, rough: 0.55, clipY: clip }));
  sm.castShadow = true; sm.frustumCulled = false; sm.bind(sk2, new THREE.Matrix4()); v.root.add(sm);
  {   // casco de pelo debajo: tapa los huecos entre mechones
    const head = v.bones[v.names.indexOf('Head')];
    const g = new THREE.SphereGeometry(1, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), m = new THREE.Mesh(g, mat(col, { roughness: 0.9 }));
    m.scale.set(0.094, 0.1, 0.108); m.position.set(0, 0.075, -0.012); m.rotation.x = -0.15; m.castShadow = true; head.add(m);
  }
}
// ---------- poncho: entero (salteño / pampa) o doblado al hombro ----------
const PONCHO_TEX = {};
function ponchoTex(kind) {
  if (PONCHO_TEX[kind]) return PONCHO_TEX[kind];
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const g = cv.getContext('2d');
  const P = {
    salteno: { base: '#9e1b1b', band: '#141414', thin: '#141414' },
    pampa: { base: '#6e5a44', band: '#2b2219', thin: '#d8ccb4' },
    gris: { base: '#5f6166', band: '#1d1e22', thin: '#c9c3b5' },
    vicuna: { base: '#b08a5a', band: '#4a3420', thin: '#efe3cc' }
  }[kind] || { base: '#9e1b1b', band: '#141414', thin: '#141414' };
  g.fillStyle = P.base; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) { g.fillStyle = `rgba(0,0,0,${0.05 + 0.05 * Math.random()})`; g.fillRect(0, y, 256, 1); }   // trama del tejido
  g.fillStyle = P.band; g.fillRect(0, 196, 256, 26); g.fillRect(0, 18, 256, 12);
  g.fillStyle = P.thin; g.fillRect(0, 188, 256, 4); g.fillRect(0, 226, 256, 4);
  if (kind === 'pampa' || kind === 'vicuna') { g.fillStyle = P.thin; for (let x = 0; x < 256; x += 16) { g.beginPath(); g.moveTo(x, 222); g.lineTo(x + 8, 200); g.lineTo(x + 16, 222); g.fill(); } }
  g.fillStyle = P.band; for (let x = 0; x < 256; x += 6) g.fillRect(x, 240, 3, 16);   // flecos
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  return (PONCHO_TEX[kind] = t);
}
function chpPoncho(f, v, c, zf) {
  const B = n => v.bones[v.names.indexOf(n)], sp = B('Spine2'); if (!sp) return;
  const m = new THREE.MeshStandardMaterial({ map: ponchoTex(c.poncho), roughness: 0.95, side: THREE.DoubleSide });
  if (c.ponchoStyle === 'hombro') {
    // doblado sobre el hombro izquierdo: una tira fina que cae por adelante y por atrás, pegada al cuerpo
    const g = new THREE.Group(); g.position.set(0.1, 0.0, zf * 0.5); sp.add(g);
    const piece = (w, h, d, x, y, z, rx, rz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.set(rx, 0, rz); b.castShadow = true; g.add(b); return b; };
    piece(0.11, 0.46, 0.014, -0.02, -0.07, 0.118, -0.1, 0.16);    // adelante, sobre el pecho
    piece(0.11, 0.5, 0.014, -0.02, -0.08, -0.135, 0.08, 0.16);    // atrás, sobre la espalda
    piece(0.11, 0.014, 0.26, 0.02, 0.15, -0.008, 0, -0.32);       // por encima del hombro
    return;
  }
  // entero: una campana que cae desde el cuello hasta la cadera, con agujero para la cabeza
  const prof = [[0.075, 0.2], [0.14, 0.16], [0.22, 0.09], [0.265, -0.02], [0.285, -0.22], [0.3, -0.42]].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(prof, 28);
  const mesh = new THREE.Mesh(geo, m); mesh.scale.set(1, 1, 0.62); mesh.position.set(0, 0.0, 0.0 + zf * 0.5); mesh.castShadow = true; sp.add(mesh);
}
// ---------- variedad para los gauchos (antes eran todos iguales) ----------
const GAUCHO_VAR = [
  { topColor: 0xe9e2d2, pants: 0x232323, hat: 0x1b1b1b, hatStyle: 'sombrero', hatBand: 0x8a1a1a, poncho: 'salteno', ponchoStyle: 'entero', scarf: 0xc93232, hair: 'long', hairColor: 0x1a120c, mustache: true, beard: false, boots: 0x2a1a10 },
  { topColor: 0x4f6378, pants: 0x4a3d30, hat: 0x1d2a44, hatStyle: 'boina', poncho: 'pampa', ponchoStyle: 'hombro', scarf: 0xe8c040, hair: 'short', hairColor: 0x3a2a1a, mustache: true, beard: true, boots: 0x3a2414 },
  { topColor: 0x7a5a3c, pants: 0x3a3a34, hat: 0x5a3e24, hatStyle: 'sombrero', hatBand: 0x2a1a10, poncho: 'gris', ponchoStyle: 'entero', scarf: 0x2a4a8a, hair: 'short', hairColor: 0x6a6a66, mustache: true, beard: false, boots: 0x1a1a1a },
  { topColor: 0x1e1e1e, pants: 0x6a6658, hat: 0x6a1a1a, hatStyle: 'boina', poncho: 'vicuna', ponchoStyle: 'hombro', scarf: 0xe8e2d0, hair: 'rulos', hairColor: 0x120a06, mustache: false, beard: true, boots: 0x4a2a14 }
];
{
  const _of = outfitFor;
  outfitFor = function (def, i) {
    const c = _of(def, i);
    if (def.look === 'gaucho') Object.assign(c, GAUCHO_VAR[i % 4], { skin: [0xd9a27a, 0x8a5a3a, 0xe0b090, 0xb98a63][i % 4] });
    return c;
  };
}
// ---------- Doña Chola: ideas de la abuela de Mixamo (ruleros, anteojos rosas, jogging celeste) ----------
if (false) Object.assign(NPC_CFG.chusma, { topColor: 0x38a6dc, pants: 0x38a6dc, hairColor: 0xbdbdbd, glasses: true, glassesColor: 0xe0508a, rollers: true, shoe: 0xf2f2f2, female: true, skin: 0xf0c4a0 });
// la chusma se crea antes que este módulo: se le pone el cuerpo nuevo apenas están los datos
function chpCholaCheck() {
  if (CHP.cholaDone || !CHP.on || !window.GV_CH02 || !window.GV_CUERPO || typeof npcs === 'undefined' || !npcs[0]) return;
  const b = npcs[0].body; CHP.cholaDone = true;
  if (!b || b.chv || b.cfg.name !== 'Doña Chola') return;
  try {
    chpAttach(b);
    const br = b.root.getObjectByName('broom13');   // la escoba, ahora en la mano
    if (br && b.hand) { b.hand.add(br); br.position.set(0, 0, 0.04); br.rotation.set(-Math.PI / 2, 0, 0); br.scale.setScalar(0.82); }
  } catch (e) { console.warn('no se pudo montar a Doña Chola', e); }
}
// ---------- armado del cuerpo nuevo de un luchador ----------
function chpBuildFor(f, tag) {
  const C = chpCache(tag), CH = C.CH, o = chpOutfit(f, tag);
  const bones = CH.bones.map(b => { const bn = new THREE.Bone(); bn.name = b.name; chM4(b.m).decompose(bn.position, bn.quaternion, bn.scale); return bn; });
  CH.bones.forEach((b, i) => { if (b.parent >= 0) bones[b.parent].add(bones[i]); });
  const root = new THREE.Group(); root.name = 'CHP_' + tag;
  CH.bones.forEach((b, i) => { if (b.parent < 0) root.add(bones[i]); });
  const skel = new THREE.Skeleton(bones, CH.bones.map(b => chM4(b.w).invert()));
  for (const cm of C.meshes) {
    const op = chpMeshOpts(cm.name, o, tag, f); if (op.hide) continue;
    const sm = new THREE.SkinnedMesh(cm.g, chpMat(cm, op)); sm.castShadow = true; sm.receiveShadow = true; sm.frustumCulled = false; sm.bind(skel, new THREE.Matrix4()); root.add(sm);
  }
  const v = { root, bones, names: C.names };
  if (tag === 'ch01') chpHair(f, v, skel);
  chpAccessories(f, v, tag);
  return v;
}
function chpAttach(f) {
  if (!window.GV_CH01 || !window.GV_CUERPO || f.chv) return;
  const tag = chpTagFor(f), C = chpCache(tag), CH = C.CH;
  const v = chpBuildFor(f, tag);
  const idx = n => C.names.indexOf(n), hipsI = idx('Hips');
  const hips0 = new THREE.Vector3().setFromMatrixPosition(chM4(CH.bones[hipsI].w));
  f.rig.traverse(o => { if (o.isMesh) o.visible = false; });
  v.root.scale.setScalar(HIP / hips0.y); v.root.position.set(0, -HIP, 0); const baseScale = HIP / hips0.y;
  f.rig.add(v.root);
  const restQ = CH.bones.map(b => { const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); chM4(b.m).decompose(p, q, s); return q; });
  const restP = CH.bones.map(b => new THREE.Vector3().setFromMatrixPosition(chM4(b.m)));
  const tgtRestW = CH.bones.map(b => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(chM4(b.w))));
  const leftX = Math.sign(new THREE.Vector3().setFromMatrixPosition(chM4(CH.bones[idx('LeftUpLeg')].w)).x) || 1;
  const L = Math.sign(f.legs[1].position.x) === leftX ? 1 : 0, R = 1 - L;
  const spec = {};
  for (const [side, i] of [['Left', L], ['Right', R]]) {
    spec[side + 'UpLeg'] = { a: () => f.legs[i], b: () => f.knees[i], child: idx(side + 'Leg') };
    spec[side + 'Leg'] = { a: () => f.knees[i], b: () => f.feet[i], child: idx(side + 'Foot') };
    spec[side + 'Foot'] = { orient: 'foot' + i };
    spec[side + 'Arm'] = { a: () => f.arms[i], b: () => f.elbows[i], child: idx(side + 'ForeArm') };
    spec[side + 'ForeArm'] = { a: () => f.elbows[i], b: 'wrist' + i, child: idx(side + 'Hand') };
  }
  spec.Hips = { orient: 'id' }; spec.Spine = { orient: 'sp1' }; spec.Spine1 = { orient: 'sp2' }; spec.Spine2 = { orient: 'torso' };
  spec.Neck = { orient: 'neck' }; spec.Head = { orient: 'head' };
  const srcIdx = CH.bones.map(b => chSource().names.indexOf(b.name));
  // ---- geometría real de la mano (en pose de reposo) para cerrar el puño y agarrar el arma ----
  const PW = n => new THREE.Vector3().setFromMatrixPosition(chM4(CH.bones[idx(n)].w));
  const handFrame = side => {
    const H = PW(side + 'Hand'), Yw = PW(side + 'HandMiddle1').sub(H).normalize();
    const Tw = PW(side + 'HandThumb2').sub(H); Tw.sub(Yw.clone().multiplyScalar(Tw.dot(Yw))).normalize();
    const Nw = side === 'Right' ? Tw.clone().cross(Yw) : Yw.clone().cross(Tw);   // hacia la palma
    return { H, Yw, Tw, Nw, Q: tgtRestW[idx(side + 'Hand')] };
  };
  for (const side of ['Left', 'Right']) {
    const hf = handFrame(side);
    for (const fn of ['Index', 'Middle', 'Ring', 'Pinky', 'Thumb']) for (const k of [1, 2, 3]) {
      const j = idx(side + 'Hand' + fn + k), jc = idx(side + 'Hand' + fn + (k + 1)); if (j < 0 || jc < 0) continue;
      const Dw = PW(side + 'Hand' + fn + (k + 1)).sub(PW(side + 'Hand' + fn + k)).normalize();
      const ax = Dw.clone().cross(hf.Nw).normalize().applyQuaternion(tgtRestW[j].clone().invert());
      const amt = fn === 'Thumb' ? (k === 1 ? 0.25 : 0.55) : (k === 1 ? 1.4 : k === 2 ? 1.55 : 1.0);
      spec[CH.bones[j].name] = { curl: new THREE.Quaternion().setFromAxisAngle(ax, amt) };
    }
  }
  // ---- el arma va a la mano que mueve el juego (el brazo 1 del cuerpo viejo), saliendo del puño ----
  const wSide = L === 1 ? 'Left' : 'Right';
  const rh = v.bones[idx(wSide + 'Hand')];
  const oldHandQ = f.hand ? f.hand.quaternion.clone() : new THREE.Quaternion();
  if (rh && f.hand) {
    const hf = handFrame(wSide), qi = hf.Q.clone().invert();
    const Y = hf.Yw.clone().applyQuaternion(qi), T = hf.Tw.clone().applyQuaternion(qi), N = hf.Nw.clone().applyQuaternion(qi);
    const gy = T.clone().negate(), gz = Y.clone(), gx = gy.clone().cross(gz).normalize();   // el arma está hecha hacia -Y
    gz.copy(gx.clone().cross(gy)).normalize();
    f.hand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(gx, gy, gz));
    const mid = PW(wSide + 'HandMiddle1').sub(hf.H).applyQuaternion(qi);
    f.hand.position.copy(mid.multiplyScalar(0.55)).add(N.clone().multiplyScalar(0.03)).add(T.clone().multiplyScalar(0.045));
    f.hand.scale.setScalar(1.12 / v.root.scale.x);
    rh.add(f.hand);
    spec[wSide + 'Hand'] = { weapon: true };
  }
  f.chv = { v, CH, tag, hipsI, hips0, restQ, restP, tgtRestW, spec, srcIdx, W: [], leftX, baseScale, wSide, oldHandQ, gripQi: f.hand ? f.hand.quaternion.clone().invert() : null };
  CHP.list.push(f);
}
// ---------- postura tranquila mientras eligen el fierro: brazos caídos, el arma agarrada al costado ----------
function chpRelax(f, c) {
  const t = worldT + (f.idx || 0) * 1.7, br = Math.sin(t * 1.6) * 0.03, L = c.leftX || 1, out = {};
  for (const side of ['Left', 'Right']) {
    const s = side === 'Left' ? L : -L, armed = side === c.wSide && !!f.weapon;
    out[side + 'UpLeg'] = null;
    if (f.introPose && !f.weapon) {   // se presenta: brazos cruzados, bien de barrio
      out[side + 'Arm'] = new THREE.Vector3(s * 0.16, -0.6, 0.5).normalize();
      out[side + 'ForeArm'] = new THREE.Vector3(-s * 0.95, side === 'Left' ? 0.12 : 0.04, 0.2).normalize();
      continue;
    }
    out[side + 'Arm'] = new THREE.Vector3(s * (armed ? 0.2 : 0.14), -1, armed ? 0.12 : 0.04 + br).normalize();
    out[side + 'ForeArm'] = armed ? new THREE.Vector3(s * 0.12, -0.55, 1).normalize() : new THREE.Vector3(s * 0.04, -1, 0.18 + br).normalize();
  }
  return out;
}
// ---------- cada cuadro: el cuerpo nuevo copia la pose del viejo (o usa el Mixamo real) ----------
const _cq2 = new THREE.Quaternion(), _cq3 = new THREE.Quaternion(), _ax = new THREE.Vector3(1, 0, 0);
const _cv = new THREE.Vector3(), _cv2 = new THREE.Vector3(), _cq = new THREE.Quaternion(), _rigInv = new THREE.Matrix4(), _rigQi = new THREE.Quaternion(), _I = new THREE.Quaternion();
function chpLocalPos(o, out, off) { if (off) out.set(0, off, 0).applyMatrix4(o.matrixWorld); else out.setFromMatrixPosition(o.matrixWorld); return out.applyMatrix4(_rigInv); }
function chpRelQ(o) { return o.getWorldQuaternion(new THREE.Quaternion()).premultiply(_rigQi); }
// herramientas grandes a dos manos (revoleo tipo bate) / el resto, mazazo de arriba a una mano
const SWING_2H = { escape: 1, cano: 1, tabla: 1, skate: 1, paraguas: 1 };
const SWING_NONE = { cuchillo: 1, facon: 1 };
function segT(u, hitAt, dur, f0, fi, f1) {      // mapea el tiempo del ataque a cuadros: prepara → impacto → vuelve
  const fr = u < hitAt ? f0 + (fi - f0) * (u / hitAt) : fi + (f1 - fi) * Math.min(1, (u - hitAt) / Math.max(0.05, dur - hitAt));
  return fr / 30;
}
function chpClipFor(f, dt) {
  const a = f.attack, c = f.chv, CL = chSource().clips;
  // ---- caída de verdad (Sweep Fall) y levantada (final del Scissor Kick) ----
  if ((f.state === 'down' || f.state === 'ko') && CL.Sweep_Fall) {
    const t = f.stateTime, ft = 6 + t * 30 * 1.45;              // trastabilla y cae en ~0,7 s
    let fr = Math.min(61, ft);
    return { k: 'Sweep_Fall', t: fr / 30, world: true, back: f.fallSign < 0, lying: ft > 44, breathe: f.state === 'down' && ft > 50, xz: 0.45, anchor: 6 };
  }
  if (f.state === 'getup' && CL.Scissor_Kick) {
    const g = Math.min(1, f.stateTime / 0.85);
    return { k: 'Scissor_Kick', t: (52 + g * 31) / 30, world: true, back: f.fallSign < 0, xz: 0.45 * (1 - g), anchor: 52, slow: f.stateTime < 0.25 };
  }
  // ---- furia: la patada tijera completa ----
  if (f.state === 'attack' && a && a.type === 'flyknee' && CL.Scissor_Kick) {
    const d = (a.def && a.def.dur) || 2.1;
    return { k: 'Scissor_Kick', t: Math.min(0.999, a.t / d) * 83 / 30, world: true, xz: 0.3, anchor: 0 };
  }
  // ---- golpes con herramienta (el arma va en la mano izquierda del Mixamo: se espeja el movimiento) ----
  if (f.state === 'attack' && a && a.type === 'swing' && f.weapon && !SWING_NONE[f.weapon.key] && CL.Melee_Down) {
    const two = SWING_2H[f.weapon.key] && CL.Melee_Swing2H, hit = a.def.hitAt, dur = a.def.dur;
    const mir = c.wSide === 'Left';
    // el golpe del juego es cortito: se usa casi todo para levantar y bajar; la vuelta se termina después (cola)
    const r = two ? { k: 'Melee_Swing2H', t: segT(a.t, hit, dur, 10, 28, 31), mirror: mir, snap: true } : { k: 'Melee_Down', t: segT(a.t, hit, dur, 12, 26, 29), mirror: mir, snap: true };
    c.tail = { k: r.k, mirror: mir, from: r.t * 30, to: two ? 39 : 44, t: 0 };
    return r;
  }
  if (c.tail && f.state === 'normal' && f.curSpeed < 3) {
    const T = c.tail; T.t += dt; const u = T.t / 0.32;
    if (u < 1) return { k: T.k, t: (T.from + (T.to - T.from) * u) / 30, mirror: T.mirror };
    c.tail = null;
  } else if (c.tail && f.state !== 'attack') c.tail = null;
  if (f.state === 'normal' && f.running && f.curSpeed > 5 && !f.held && !f.holder && gameState !== 'house' && chSource().clips.Run) {
    const rate = Math.max(0.85, Math.min(1.35, f.curSpeed / 4.4));
    c.runT = ((c.runT || 0) + dt * rate) % 0.7;
    return { k: 'Run', t: c.runT };
  }
  if (f.state === 'attack' && a && (a.type === 'flyknee' || a.type === 'flyingkick15' || a.type === 'dropkick')) {
    const d = (a.def && a.def.dur) || 1.2; return { k: 'Flying_Kick', t: Math.min(1, a.t / d) * (46 / 30) * 0.98 };
  }
  if (f.state === 'hit' && f.stateTime < 0.9) return { k: 'Head_Hit', t: 0.15 + f.stateTime * 1.1 };
  return null;
}
function chpDrive(f, dt) {
  const c = f.chv, S = chSource(), CH = c.CH, bones = c.v.bones, NB = CH.bones.length, W = c.W;
  f.rig.updateMatrixWorld(true);
  _rigInv.copy(f.rig.matrixWorld).invert(); f.rig.getWorldQuaternion(_rigQi); _rigQi.invert();
  const cl = chpClipFor(f, dt);
  if (cl) {
    const clip = S.clips[cl.k], NS = S.SRC.bones.length, fi = Math.min(clip.n - 1, Math.floor(cl.t * 30));
    const sW = c.sW || (c.sW = []), qW = c.qW || (c.qW = []), tmp = c.tmp || (c.tmp = new THREE.Matrix4());
    for (let i = 0; i < NS; i++) {
      const o = (fi * NS + i) * 16; tmp.set(...clip.f.subarray(o, o + 16));
      const p = S.SRC.bones[i].parent; sW[i] = (sW[i] || new THREE.Matrix4()).copy(p >= 0 ? sW[p] : tmp); if (p >= 0) sW[i].multiply(tmp);
      qW[i] = (qW[i] || new THREE.Quaternion()).setFromRotationMatrix(_m4.extractRotation(sW[i]));
    }
    if (cl.mirror && !c.srcIdxM) c.srcIdxM = CH.bones.map(b => S.names.indexOf(b.name.replace(/Left|Right/, m => m === 'Left' ? 'Right' : 'Left')));
    const SI = cl.mirror ? c.srcIdxM : c.srcIdx, dq = _cq2;
    for (let j = 0; j < NB; j++) {
      const si = SI[j], par = CH.bones[j].parent;
      W[j] = (W[j] || new THREE.Quaternion());
      if (si >= 0) {
        dq.copy(qW[si]).multiply(S.restWInv[si]);
        if (cl.mirror) { dq.y = -dq.y; dq.z = -dq.z; }
        W[j].copy(dq).multiply(c.tgtRestW[j]);
        if (cl.breathe && (CH.bones[j].name === 'Spine1' || CH.bones[j].name === 'Head')) W[j].premultiply(_cq3.setFromAxisAngle(_ax, Math.sin(worldT * 3.2 + f.idx) * 0.05));
      }
      else W[j].copy(par >= 0 ? W[par] : _I).multiply(c.restQ[j]);
    }
    const sc = c.hips0.y / S.hips0.y, hipsS = S.names.indexOf('Hips');
    const hp = new THREE.Vector3().setFromMatrixPosition(sW[hipsS]);
    c.hipY = (hp.y - S.hips0.y) * sc;
    if (cl.world) {
      if (c.anchorK !== cl.k + cl.anchor) {   // posición de la cadera al empezar el tramo (para no "teletransportar")
        c.anchorK = cl.k + cl.anchor;
        const o = (cl.anchor * NS + hipsS) * 16; c.anc = new THREE.Vector3(clip.f[o + 3], 0, clip.f[o + 11]);
        if (cl.k === 'Scissor_Kick' && c.lastXZ) c.ancOff = c.lastXZ.clone(); else c.ancOff = new THREE.Vector3();
      }
      const lx = clip.f[(fi * NS + hipsS) * 16 + 3], lz = clip.f[(fi * NS + hipsS) * 16 + 11];
      c.hipXZ = new THREE.Vector3((lx - c.anc.x) * sc * cl.xz, 0, (lz - c.anc.z) * sc * cl.xz).add(c.ancOff.clone().multiplyScalar(cl.k === 'Scissor_Kick' ? Math.max(0, 1 - (cl.t * 30 - cl.anchor) / 20) : 0));
      if (cl.mirror) c.hipXZ.x = -c.hipXZ.x;
      if (cl.k === 'Sweep_Fall') c.lastXZ = c.hipXZ.clone();
    } else c.hipXZ = null;
  } else {
    const torsoQ = chpRelQ(f.torso), headQ = chpRelQ(f.head);
    const O = { id: _I, torso: torsoQ, head: headQ, sp1: _I.clone().slerp(torsoQ, 0.35), sp2: _I.clone().slerp(torsoQ, 0.7), neck: torsoQ.clone().slerp(headQ, 0.5) };
    for (let i = 0; i < 2; i++) O['foot' + i] = chpRelQ(f.feet[i]);
    const P = {}; for (let i = 0; i < 2; i++) P['wrist' + i] = chpLocalPos(f.elbows[i], new THREE.Vector3(), -0.28);
    const relax = gameState === 'house' && f.state === 'normal' ? chpRelax(f, c) : null;
    for (let j = 0; j < NB; j++) {
      const b = CH.bones[j], par = b.parent, sp = c.spec[b.name];
      W[j] = (W[j] || new THREE.Quaternion());
      const base = _cq.copy(par >= 0 ? W[par] : _I).multiply(c.restQ[j]);
      if (sp && sp.curl) W[j].copy(base).multiply(sp.curl);
      else if (sp && sp.weapon && f.weapon && !relax && c.gripQi) W[j].copy(chpRelQ(f.elbows[1])).multiply(c.oldHandQ).multiply(c.gripQi);
      else if (sp && sp.orient) W[j].copy(O[sp.orient]).multiply(c.tgtRestW[j]);
      else if (sp && sp.child >= 0) {
        const A = chpLocalPos(sp.a(), _cv), Bp = typeof sp.b === 'string' ? P[sp.b] : chpLocalPos(sp.b(), _cv2);
        const want = relax && relax[b.name] ? relax[b.name] : Bp.clone().sub(A).normalize(), pred = c.restP[sp.child].clone().applyQuaternion(base).normalize();
        W[j].setFromUnitVectors(pred, want).multiply(base);
      } else W[j].copy(base);
    }
    c.hipY = 0;
  }
  // ---- dónde cuelga el cuerpo: del esqueleto guía (parado) o directo del luchador (en el piso) ----
  chpSetWorld(f, c, cl && cl.world, cl && cl.back);
  const k = Math.min(1, dt * (cl ? (cl.snap ? 70 : cl.slow ? 9 : 30) : (c.wasWorld > 0 ? 9 : 22)));
  if (c.wasWorld > 0) c.wasWorld -= dt;
  for (let j = 0; j < NB; j++) {
    const par = CH.bones[j].parent, loc = _cq.copy(par >= 0 ? W[par] : _I).invert().multiply(W[j]);
    if (!c.ready) bones[j].quaternion.copy(loc); else bones[j].quaternion.slerp(loc, k);
  }
  const hb = bones[c.hipsI], want = c.restP[c.hipsI].clone(); want.y += c.hipY || 0; if (c.hipXZ) want.add(c.hipXZ);
  if (!c.ready || !c.hipSm) hb.position.copy(want); else hb.position.lerp(want, Math.min(1, dt * 18));
  c.hipSm = true;
  c.ready = true;
}
function chpSetWorld(f, c, on, back) {
  const r = c.v.root;
  if (on) {
    if (r.parent !== f.root) { f.root.add(r); c.worldOn = true; }
    r.position.set(0, 0, 0); r.scale.setScalar(c.baseScale * f.rig.scale.x);
    const ry = back ? Math.PI : 0; r.rotation.set(0, r.rotation.y + angDiff(r.rotation.y, ry) * 0.5, 0);
  } else if (r.parent !== f.rig) {
    f.rig.add(r); r.position.set(0, -HIP, 0); r.rotation.set(0, 0, 0); r.scale.setScalar(c.baseScale); c.worldOn = false; c.wasWorld = 0.35;
  }
}
function chpUpdate(dt) {
  if (!CHP.list.length) return;
  CHP.list = CHP.list.filter(f => f.root && f.root.parent);
  for (const f of CHP.list) if (f.root.visible !== false) chpDrive(f, dt);
}
{
  const _bm = Fighter.prototype.buildMesh;
  Fighter.prototype.buildMesh = function () {
    _bm.call(this);
    if (!CHP.on || !chpTagFor(this)) return;
    try { chpAttach(this); } catch (e) { console.warn('CH no se pudo montar en ' + this.name, e); }
  };
  // frase del menú
  { const tg = document.querySelector('#menu .tagline'); if (tg) tg.innerHTML = 'Elegí tu pelotón, agarrá lo que tengas a mano y salí a la calle.<br><b style="color:#ffd84a">La plaza es del que se la gana.</b>'; }
  // controles: escondidos detrás de un botón
  { const st = document.createElement('style'); st.textContent = '#menu:not(.showCtl) .controls{display:none!important}#ctlBtn{margin-top:10px;font:18px Impact,Arial Black,sans-serif;letter-spacing:2px;padding:8px 22px;background:#2a2a34;color:#fff;border:2px solid #888;border-radius:6px;cursor:pointer}#pauseMenuBtn{display:block;margin:12px auto 0}'; document.head.appendChild(st);
    const sb3 = document.getElementById('startBtn');
    if (sb3) { const cb = document.createElement('button'); cb.id = 'ctlBtn'; cb.textContent = '🎮 VER CONTROLES'; sb3.insertAdjacentElement('afterend', cb);
      cb.addEventListener('click', () => { const m = document.getElementById('menu'); m.classList.toggle('showCtl'); cb.textContent = m.classList.contains('showCtl') ? '✖ OCULTAR CONTROLES' : '🎮 VER CONTROLES'; }); } }
  // pausa: volver al menú principal
  { const rb = document.getElementById('resumeBtn');
    if (rb) { const mb = document.createElement('button'); mb.id = 'pauseMenuBtn'; mb.textContent = 'MENÚ PRINCIPAL'; rb.insertAdjacentElement('afterend', mb);
      mb.addEventListener('click', () => { document.getElementById('pause').classList.add('hidden'); if (typeof INTRO !== 'undefined' && INTRO.card) INTRO.card.style.opacity = 0; document.getElementById('menuBtn').click(); }); } }
  // el botón de arranque: "¡LISTO!"
  { const sb2 = document.getElementById('startBtn'); if (sb2) sb2.textContent = '¡LISTO!'; }
  // los botones de prueba del menú ya no hacen falta
  for (const id of ['chTestBtn', 'chPlayBtn']) { const el = document.getElementById(id); if (el) el.remove(); }
  // botón para volver al menú y cambiar de banda desde "Elegí tu fierro"
  const go = document.getElementById('goBtn');
  if (go) {
    const back = document.createElement('button'); back.id = 'backBtn'; back.textContent = '← CAMBIAR DE EQUIPO';
    back.style.cssText = 'font:20px Impact,Arial Black,sans-serif;letter-spacing:2px;padding:10px 26px;margin-right:14px;background:#2a2a34;color:#fff;border:2px solid #888;border-radius:6px;cursor:pointer';
    go.insertAdjacentElement('beforebegin', back);
    back.addEventListener('click', () => {
      if (typeof INTRO !== 'undefined' && INTRO.on) endIntro();
      if (INTRO && INTRO.card) INTRO.card.style.opacity = 0;
      document.getElementById('menuBtn').click();
    });
  }
}


// ============================================================
