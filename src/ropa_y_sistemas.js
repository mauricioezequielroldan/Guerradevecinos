// v25 ROPA CON TEXTURA DE VERDAD
// - tela por prenda: tactel (camperas), denim (jeans), algodón, con detalle en el shader
// - turros: tres tiras en mangas y jogging, cierre de campera, gorra con paneles/botón/logo, cuello tapado tejido
// - gauchos: el poncho se arma sobre el cuerpo (malla con piel), no más "bolsa"; tejido, guarda y flecos
// ============================================================
// ---------- ejes de brazos y piernas de cada cuerpo (en pose de atado) ----------
const CHAX = {};
function chAxes(tag) {
  if (CHAX[tag]) return CHAX[tag];
  const C = chpCache(tag), B = n => new THREE.Vector3().setFromMatrixPosition(chM4(C.CH.bones[C.names.indexOf(n)].w));
  const arm = B('LeftArm'), elb = B('LeftForeArm'), ul = B('LeftUpLeg'), kn = B('LeftLeg');
  return (CHAX[tag] = { armA: arm, armD: elb.clone().sub(arm).normalize(), legA: ul, legD: kn.clone().sub(ul).normalize(),
    neck: B('Neck'), sp2: B('Spine2'), hips: B('Hips'), sh: B('LeftShoulder') });
}
// ---------- código de shader compartido: telas y detalles ----------
const GV_FAB_GLSL = `
float gvH(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float gvN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(gvH(i), gvH(i+vec3(1,0,0)), f.x), mix(gvH(i+vec3(0,1,0)), gvH(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(gvH(i+vec3(0,0,1)), gvH(i+vec3(1,0,1)), f.x), mix(gvH(i+vec3(0,1,1)), gvH(i+vec3(1,1,1)), f.x), f.y), f.z); }
// distancia a una "tira" a lo largo de un miembro (eje a + d*t), del lado 'side' (vec3 en el plano perpendicular)
float gvLimbBands(vec3 p, vec3 a, vec3 d, vec3 side, float rOff, float w, float gap){
  float sx = p.x < 0.0 ? -1.0 : 1.0; vec3 A = vec3(a.x*sx, a.y, a.z), D = vec3(d.x*sx, d.y, d.z), S = vec3(side.x*sx, side.y, side.z);
  vec3 r = p - A; float t = dot(r, D); if (t < 0.03) return 0.0;
  vec3 pr = r - D*t; if (dot(normalize(pr), normalize(S)) < 0.35) return 0.0;
  vec3 tang = normalize(cross(D, S)); float u = dot(pr, tang);
  float k = 0.0; for (int i = -1; i <= 1; i++) { float c = float(i) * gap; k = max(k, 1.0 - smoothstep(w*0.5, w*0.5 + 0.0015, abs(u - c))); }
  return k;
}
vec3 gvFabric(vec3 col, vec3 p, float kind){
  // 1 tactel: brillito en vetas · 2 denim: sarga diagonal + desgaste · 3 algodón: trama fina · 4 lana (poncho)
  if (kind > 0.5 && kind < 1.5) { float v = gvN(p*vec3(40.0,8.0,40.0)); col *= 0.92 + 0.14*v; }
  else if (kind < 2.5) { float tw = fract((p.x + p.z)*160.0 + p.y*160.0); col *= 0.9 + 0.12*smoothstep(0.3, 0.7, tw);
    float fade = smoothstep(0.03, 0.12, p.z) * smoothstep(0.82, 0.55, p.y) * smoothstep(0.25, 0.45, p.y); col = mix(col, col*1.55 + 0.04, fade*0.45*gvN(p*12.0));
    col *= 0.9 + 0.12*gvN(p*55.0); }
  else if (kind < 3.5) { col *= 0.93 + 0.08*gvN(p*90.0); }
  else { col *= 0.85 + 0.2*gvN(p*vec3(70.0,140.0,70.0)) ; }
  return col;
}`;
// ---------- material de ropa "lisa" (CH01/CH02) con telas y tiras ----------
const _chpMatOld = chpMat;
chpMat = function (cm, opts) {
  if (opts.parts) return chpMatParts(cm, opts);
  const mt = _chpMatOld(cm, opts);
  if (!opts.col || !opts.fab) return mt;
  const ax = opts.ax, prev = mt.onBeforeCompile;
  const U = { uFab: { value: opts.fab }, uSp: { value: linCol(opts.sport != null ? opts.sport : 0xffffff) }, uSpOn: { value: opts.sport != null ? 1 : 0 },
    uLimb: { value: opts.limb || 0 }, uA: { value: ax ? (opts.limb === 2 ? ax.legA : ax.armA) : new THREE.Vector3() }, uD: { value: ax ? (opts.limb === 2 ? ax.legD : ax.armD) : new THREE.Vector3(1, 0, 0) },
    uZip: { value: opts.zip ? 1 : 0 } };
  mt.onBeforeCompile = sh => {
    prev(sh); Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vBP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vBP = position;');
    sh.fragmentShader = 'varying vec3 vBP; uniform float uFab; uniform vec3 uSp; uniform float uSpOn; uniform float uLimb; uniform vec3 uA; uniform vec3 uD; uniform float uZip;\n' + GV_FAB_GLSL + '\n' +
      sh.fragmentShader.replace('diffuseColor.rgb = mix(diffuseColor.rgb, gvCol * min(gvLum * uGain, 1.35), uAmt);', `diffuseColor.rgb = mix(diffuseColor.rgb, gvCol * min(gvLum * uGain, 1.35), uAmt);
        diffuseColor.rgb = gvFabric(diffuseColor.rgb, vBP, uFab);
        if (uSpOn > 0.5) {
          float k = uLimb > 1.5 ? gvLimbBands(vBP, uA, uD, vec3(1.0, 0.0, 0.0), 0.0, 0.007, 0.013) : gvLimbBands(vBP, uA, uD, vec3(0.0, 1.0, 0.0), 0.0, 0.0075, 0.014);
          diffuseColor.rgb = mix(diffuseColor.rgb, uSp * (0.75 + 0.3 * gvLum * uGain), k);
        }
        if (uZip > 0.5 && abs(vBP.x) < 0.006 && vBP.z > 0.04 && vBP.y > 0.95 && vBP.y < 1.47) diffuseColor.rgb = mix(vec3(0.75, 0.75, 0.78), vec3(0.15), step(0.5, fract(vBP.y * 260.0)));`);
  };
  mt.customProgramCacheKey = () => 'gvFab1';
  if (opts.fab === 1) { mt.roughness = 0.48; mt.metalness = 0.05; }
  if (opts.fab === 2) mt.roughness = 0.95;
  return mt;
};
// ---------- material con zonas (CH12): piel / remera / pantalón / zapatillas, ahora con tela ----------
const _chpMatPartsOld = chpMatParts;
chpMatParts = function (cm, opts) {
  const mt = _chpMatPartsOld(cm, opts);
  if (!opts.fabTop && !opts.fabPants) return mt;
  const ax = opts.ax, prev = mt.onBeforeCompile;
  const U = { uFT: { value: opts.fabTop || 0 }, uFP: { value: opts.fabPants || 0 }, uSpT: { value: linCol(opts.sportTop != null ? opts.sportTop : 0xffffff) }, uSpTOn: { value: opts.sportTop != null ? 1 : 0 },
    uSpP: { value: linCol(opts.sportPants != null ? opts.sportPants : 0xffffff) }, uSpPOn: { value: opts.sportPants != null ? 1 : 0 },
    uAA: { value: ax.armA }, uAD: { value: ax.armD }, uLA: { value: ax.legA }, uLD: { value: ax.legD }, uZip: { value: opts.zip ? 1 : 0 } };
  mt.onBeforeCompile = sh => {
    prev(sh); Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vBP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vBP = position;');
    sh.fragmentShader = 'varying vec3 vBP; uniform float uFT; uniform float uFP; uniform vec3 uSpT; uniform float uSpTOn; uniform vec3 uSpP; uniform float uSpPOn; uniform vec3 uAA; uniform vec3 uAD; uniform vec3 uLA; uniform vec3 uLD; uniform float uZip;\n' + GV_FAB_GLSL + '\n' +
      sh.fragmentShader.replace('diffuseColor.rgb = mix(diffuseColor.rgb, pc * min(gl * pgn, 1.35), pa);', `diffuseColor.rgb = mix(diffuseColor.rgb, pc * min(gl * pgn, 1.35), pa);
        if (gp == 1 && uFT > 0.5) {
          diffuseColor.rgb = gvFabric(diffuseColor.rgb, vBP, uFT);
          if (uSpTOn > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, uSpT * 0.95, gvLimbBands(vBP, uAA, uAD, vec3(0.0, 1.0, 0.0), 0.0, 0.0075, 0.014));
          if (uZip > 0.5 && abs(vBP.x) < 0.006 && vBP.z > 0.04 && vBP.y > 1.0 && vBP.y < 1.45) diffuseColor.rgb = mix(vec3(0.75, 0.75, 0.78), vec3(0.15), step(0.5, fract(vBP.y * 260.0)));
        }
        if (gp == 2 && uFP > 0.5) {
          diffuseColor.rgb = gvFabric(diffuseColor.rgb, vBP, uFP);
          if (uSpPOn > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, uSpP * 0.95, gvLimbBands(vBP, uLA, uLD, vec3(1.0, 0.0, 0.0), 0.0, 0.007, 0.013));
        }`);
  };
  mt.customProgramCacheKey = () => 'gvParts2';
  return mt;
};
// ---------- qué tela lleva cada uno ----------
function chpFabricOpts(f, cm, op, tag) {
  const c = f.cfg, d = teamDefs && teamDefs[f.team], look = d ? d.look : null, ax = chAxes(tag);
  const turro = look === 'campera' || c.fakeSport;
  const jogging = c.pants === 'jogging' || look === 'flogger' && false;
  const jean = !jogging && !c.shorts && look !== 'rugby' && look !== 'gaucho';
  const topFab = c.jacket || turro ? 1 : look === 'gaucho' ? 3 : 3;
  const sport = turro ? 0xf2f2ee : (c.jacket && c.jacket.trim ? c.jacket.trim[0] : null);
  if (op.parts) return Object.assign(op, { ax, fabTop: topFab, fabPants: jean ? 2 : 3, sportTop: turro || c.jacket ? (sport != null ? sport : 0xf2f2ee) : null, sportPants: jogging ? 0xf2f2ee : null, zip: !!(c.jacket || turro) });
  const n = cm.name.replace(/^Ch\d+_/, '');
  if (n === 'Shirt') return Object.assign(op, { ax, fab: topFab, limb: 1, sport: turro || c.jacket ? (sport != null ? sport : 0xf2f2ee) : null, zip: !!(c.jacket || turro) });
  if (n === 'Pants') return Object.assign(op, { ax, fab: jean ? 2 : 3, limb: 2, sport: jogging ? 0xf2f2ee : null });
  if (n === 'Cloth') return Object.assign(op, { ax, fab: 3 });
  return op;
}
// ---------- poncho que va al cuerpo: copia de la remera, un poco inflada, con piel y textura de tejido ----------
function chpPonchoSkin(f, root, skel, C, tag) {
  const c = f.cfg, src = tag === 'ch12' ? C.meshes.find(m => /body/i.test(m.name)) : C.meshes.find(m => /Shirt|Cloth/.test(m.name));
  if (!src) return;
  const ax = chAxes(tag), tex = ponchoTex(c.poncho), hombro = c.ponchoStyle === 'hombro';
  const U = { uTex: { value: tex }, uTop: { value: ax.neck.y + 0.02 }, uBot: { value: ax.hips.y - 0.12 }, uHom: { value: hombro ? 1 : 0 }, uPart: { value: tag === 'ch12' ? 1 : -1 },
    uShX: { value: Math.abs(ax.armA.x) }, uShY: { value: ax.armA.y }, uHipY: { value: ax.hips.y } };
  const mt = new THREE.MeshStandardMaterial({ roughness: 0.97, metalness: 0, side: THREE.DoubleSide });
  mt.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vBP; uniform float uTop; uniform float uBot; uniform float uPart;' + (tag === 'ch12' ? ' attribute float gvPart; flat varying float vPart;' : '') + '\n' +
      sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vBP = position;` + (tag === 'ch12' ? ' vPart = gvPart;' : '') + `
        float fl = clamp((uTop - position.y) / max(0.01, uTop - uBot), 0.0, 1.0);
        transformed += normal * (0.016 + fl * fl * 0.045);
        transformed.y -= fl * fl * 0.07;`);
    sh.fragmentShader = 'varying vec3 vBP; uniform sampler2D uTex; uniform float uTop; uniform float uBot; uniform float uHom; uniform float uPart; uniform float uShX; uniform float uShY; uniform float uHipY;' + (tag === 'ch12' ? ' flat varying float vPart;' : '') + '\n' + GV_FAB_GLSL + '\n' +
      sh.fragmentShader.replace('#include <map_fragment>', `
        ${tag === 'ch12' ? 'if (abs(vPart - 1.0) > 0.5 && vBP.y < 1.1) discard;' : ''}
        float ax = abs(vBP.x);
        if (vBP.y > uTop) discard;
        float v; vec2 uv;
        if (uHom > 0.5) {
          // doblado al hombro izquierdo: una banda en diagonal desde el hombro hasta la cadera opuesta
          vec2 A = vec2(uShX * 0.9, uShY + 0.05), B = vec2(-uShX * 0.75, uHipY + 0.02);
          vec2 d = normalize(B - A), r = vBP.xy - A; float t = dot(r, d), dist = abs(r.x * d.y - r.y * d.x);
          if (dist > 0.075 || t < -0.06 || t > length(B - A) + 0.05) discard;
          uv = vec2(t * 3.0, 0.5 + (r.x * d.y - r.y * d.x) / 0.15 * 0.85);
        } else {
          if (ax > uShX + 0.12) discard;                    // hasta el codo, no más
          v = clamp((vBP.y - uBot) / (uTop - uBot), 0.0, 1.0);
          uv = vec2(atan(vBP.x, vBP.z) / 6.2832 * 3.0 + 0.5, v * 0.92 + 0.04);
        }
        vec4 pt = texture2D(uTex, uv);
        diffuseColor.rgb = gvFabric(pt.rgb * pt.rgb, vBP, 4.0);`);
  };
  mt.customProgramCacheKey = () => 'gvPoncho' + tag + (hombro ? 'h' : 'e');
  const sm = new THREE.SkinnedMesh(src.g, mt); sm.castShadow = true; sm.receiveShadow = true; sm.frustumCulled = false; sm.bind(skel, new THREE.Matrix4()); root.add(sm);
}
chpPoncho = function () { };   // el poncho viejo (la "bolsa") ya no se usa
// ---------- gorra con paneles, costuras, botón y logo; cuello tapado tejido ----------
const CAP_TEX = {};
function capTex(col) {
  const k = col + ''; if (CAP_TEX[k]) return CAP_TEX[k];
  const c3 = new THREE.Color(col), hex = '#' + c3.getHexString(), L = c3.r * 0.3 + c3.g * 0.59 + c3.b * 0.11;
  const t = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = hex; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${rand(0.02, 0.07)})`; g.fillRect(rand(0, w), rand(0, h), 2, 2); }   // tela
    g.strokeStyle = L > 0.5 ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.28)'; g.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const x = i / 6 * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();                  // costuras de los 6 paneles
      g.setLineDash([4, 5]); g.beginPath(); g.moveTo(x + 6, 10); g.lineTo(x + 6, h); g.stroke(); g.setLineDash([]); }
    g.setLineDash([5, 5]); for (const y of [h - 14, h - 26]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.setLineDash([]);
    // logo bordado de fantasía adelante (u ≈ 0.25)
    g.save(); g.translate(w * 0.25, h * 0.6); g.fillStyle = L > 0.5 ? '#1a1a1a' : '#f2f2ee';
    for (let k = 0; k < 3; k++) { g.save(); g.rotate(-0.5); g.fillRect(-26 + k * 18, -30 + (2 - k) * 8, 11, 44 - (2 - k) * 8); g.restore(); }
    g.font = "bold 22px Impact, sans-serif"; g.textAlign = 'center'; g.fillText('ADIBAS', 0, 42); g.restore();
    g.fillStyle = hex; g.beginPath(); g.arc(w * 0.75, 4, 1, 0, 7); g.fill();
  });
  t.wrapS = THREE.RepeatWrapping; return (CAP_TEX[k] = t);
}
const GAITER_TEX = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#121214'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(230,230,230,0.55)'; g.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const x = rand(0, w), y = rand(0, h), r = rand(4, 10); g.beginPath(); g.arc(x, y, r, 0, 5); g.stroke(); g.beginPath(); g.arc(x + r * 0.6, y, r * 0.4, 0, 6.3); g.stroke(); }   // estampa tipo paisley
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(255,255,255,${rand(0.01, 0.05)})`; g.fillRect(rand(0, w), rand(0, h), 1, 2); } });
{
  const _acc = chpAccessories;
  chpAccessories = function (f, v, tag) {
    const c = f.cfg, saveCap = c.cap, saveFace = c.faceCover, saveScarf = c.scarf;
    if (saveCap != null) c.cap = null; if (saveScarf != null) c.scarf = null;
    if (saveFace) c.faceCover = false;
    _acc(f, v, tag);
    c.cap = saveCap; c.faceCover = saveFace; c.scarf = saveScarf;
    const neckB = v.bones[v.names.indexOf('Neck')];
    if (saveScarf != null && neckB) {
      const col = new THREE.Color(saveScarf), hex = '#' + col.getHexString(), L = col.r * 0.3 + col.g * 0.59 + col.b * 0.11;
      const sTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = hex; g.fillRect(0, 0, w, h);
        g.fillStyle = L > 0.6 ? 'rgba(40,30,20,0.55)' : 'rgba(255,255,255,0.75)'; for (let y = 6; y < h; y += 16) for (let x = (y / 16) % 2 ? 6 : 14; x < w; x += 16) { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); }   // lunares
        for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${rand(0.02, 0.06)})`; g.fillRect(rand(0, w), rand(0, h), 1, 2); } });
      const sm = new THREE.MeshStandardMaterial({ map: sTex, roughness: 0.9, side: THREE.DoubleSide });
      const zf2 = tag === 'ch02' ? 0.04 : 0;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.078, 0.05, 22, 1, true), sm); band.position.set(0, 0.03, 0.012 + zf2); band.rotation.x = -0.2; band.castShadow = true; neckB.add(band);
      const tri = new THREE.Shape(); tri.moveTo(-0.075, 0); tri.lineTo(0.075, 0); tri.lineTo(0, -0.12); tri.closePath();
      const pnt = new THREE.Mesh(new THREE.ShapeGeometry(tri), sm); pnt.position.set(0, 0.025, 0.085 + zf2); pnt.rotation.x = -0.35; pnt.castShadow = true; neckB.add(pnt);   // la punta cae sobre el pecho
      const knot = sph(0.022, 0.018, 0.016, sm, 0, 0.012, 0.088 + zf2, neckB);                                                     // nudo
      for (const s of [-1, 1]) { const tip = new THREE.Mesh(new THREE.ShapeGeometry(tri), sm); tip.scale.setScalar(0.35); tip.position.set(s * 0.015, 0.005, 0.092 + zf2); tip.rotation.set(-0.3, 0, s * 0.5); neckB.add(tip); }
    }
    const head = v.bones[v.names.indexOf('Head')]; if (!head) return;
    const zf = tag === 'ch02' ? 0.04 : 0;
    if (saveCap != null) {
      const cm = new THREE.MeshStandardMaterial({ map: capTex(saveCap), roughness: 0.85 });
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), cm);
      crown.scale.set(0.108, 0.088, 0.122); crown.position.set(0, 0.118, -0.006 + zf); crown.rotation.x = -0.16; crown.castShadow = true; head.add(crown);
      const btn = sph(0.012, 0.007, 0.012, mat(saveCap, { roughness: 0.6 }), 0, 0.205, -0.02 + zf, head);
      const vm = mat(new THREE.Color(saveCap).multiplyScalar(0.85).getHex(), { roughness: 0.75 });
      const vis = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 8), vm);   // visera: disco apenas curvo
      vis.scale.set(0.098, 0.011, 0.08); vis.position.set(0, 0.118, (c.capBack ? -0.112 : 0.112) + zf); vis.rotation.x = c.capBack ? 0.22 : -0.22;
      vis.castShadow = true; head.add(vis);
    }
    if (saveFace) {
      const gm = new THREE.MeshStandardMaterial({ map: GAITER_TEX, roughness: 0.92, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.104, 0.085, 24, 2, true, -Math.PI * 0.62, Math.PI * 1.24), gm);   // cuello tapado: cubre boca y nariz
      ring.position.set(0, 0.03, 0.03 + zf); ring.rotation.x = -0.12; ring.castShadow = true; head.add(ring);
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.1, 18, 1, true, Math.PI * 0.6, Math.PI * 0.8), gm); back.position.set(0, -0.0, 0.0 + zf); head.add(back);
    }
  };
}
// ---------- armado (reemplaza al de antes): ropa con tela, poncho al cuerpo ----------
chpBuildFor = function (f, tag) {
  const C = chpCache(tag), CH = C.CH, o = chpOutfit(f, tag);
  const bones = CH.bones.map(b => { const bn = new THREE.Bone(); bn.name = b.name; chM4(b.m).decompose(bn.position, bn.quaternion, bn.scale); return bn; });
  CH.bones.forEach((b, i) => { if (b.parent >= 0) bones[b.parent].add(bones[i]); });
  const root = new THREE.Group(); root.name = 'CHP_' + tag;
  CH.bones.forEach((b, i) => { if (b.parent < 0) root.add(bones[i]); });
  const skel = new THREE.Skeleton(bones, CH.bones.map(b => chM4(b.w).invert()));
  for (const cm of C.meshes) {
    let op = chpMeshOpts(cm.name, o, tag, f); if (op.hide) continue;
    if (!f.civil || f.cfg.name === 'El Pibe del Celu') op = chpFabricOpts(f, cm, op, tag);
    const sm = new THREE.SkinnedMesh(cm.g, chpMat(cm, op)); sm.castShadow = true; sm.receiveShadow = true; sm.frustumCulled = false; sm.bind(skel, new THREE.Matrix4()); root.add(sm);
  }
  if (f.cfg.poncho) chpPonchoSkin(f, root, skel, C, tag);
  const v = { root, bones, names: C.names };
  if (tag === 'ch01') chpHair(f, v, skel);
  chpAccessories(f, v, tag);
  return v;
};
// ---------- el pibe del celular: cuerpo nuevo, celular en la mano, mochila en la espalda ----------
{
  const _tag = chpTagFor;
  chpTagFor = function (f) { if (f.civil && f.cfg.name === 'El Pibe del Celu') return 'ch12'; return _tag(f); };
}
function fixFilmador() {
  if (!window.GV_CH12 || !window.GV_CUERPO || !window.GV_CH01) return;
  const n = npcs.find(k => k instanceof Filmador); if (!n || n.fixed) return; n.fixed = true;
  const b = n.body;
  // fuera lo de la v13 (mochila gigante en el pecho, teléfono flotando, luz suelta)
  for (const o of b.root.children.slice()) if (o.name === 'bag13' || o.name === 'phone13' || o.isPointLight) b.root.remove(o);
  b.root.userData.phoneFlash = null;
  try { chpAttach(b); } catch (e) { console.warn('celu: cuerpo nuevo', e); return; }
  const c = b.chv, v = c.v, B = nm => v.bones[v.names.indexOf(nm)];
  // el celular: en la mano del brazo que filma (el brazo 0 del cuerpo guía)
  const hA = B('LeftHand'), hB = B('RightHand'), headB = B('Head');
  const ph = new THREE.Group(); scene.add(ph);   // se ubica cada cuadro entre las dos manos, mirando a la pelea
  const body = box(0.075, 0.155, 0.011, mat(0x16171b, { metalness: 0.6, roughness: 0.3 }), 0, 0, 0, ph);
  const scr = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x9acfff, emissiveIntensity: 1.4 });
  box(0.066, 0.138, 0.002, scr, 0, 0, -0.0065, ph, false);
  box(0.022, 0.022, 0.004, mat(0x2a2a2e, { metalness: 0.7 }), 0.02, 0.055, 0.0075, ph, false);   // cámaras
  const flashM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e0, emissiveIntensity: 0 });
  box(0.008, 0.008, 0.003, flashM, -0.005, 0.06, 0.0078, ph, false);
  const rec = sph(0.006, 0.006, 0.004, new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff0000, emissiveIntensity: 3 }), 0.026, 0.065, -0.008, ph, false);
  const L = new THREE.PointLight(0xfff4e0, 0, 7, 1.6); L.position.set(0, 0.06, 0.06); ph.add(L);
  const spot = glow(0, 0.06, 0.05, 0xfff8e8, 0.0, ph); spot.material.opacity = 0;
  // mochila en la espalda, con correas
  const sp = B('Spine2'), bk = new THREE.Group(); sp.add(bk); bk.position.set(0, -0.06, -0.15); bk.scale.setScalar(1 / v.root.scale.x);
  const bm = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#1f2a3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(255,255,255,${rand(0.01, 0.05)})`; g.fillRect(rand(0, w), rand(0, h), 1, 1); }
    g.fillStyle = '#c8302a'; g.fillRect(0, h * 0.55, w, 6); g.fillStyle = '#c8c8c8'; g.fillRect(w * 0.15, h * 0.3, w * 0.7, 3); }), roughness: 0.8 });
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.14, 2, 2, 2), bm); pack.castShadow = true; bk.add(pack);
  const pk = sph(0.13, 0.1, 0.05, bm, 0, -0.08, -0.08, bk); pk.castShadow = true;                                // bolsillo
  for (const s of [-1, 1]) { const st = box(0.04, 0.42, 0.015, mat(0x111418, { roughness: 0.7 }), s * 0.1, 0.06, 0.12, bk); st.rotation.x = 0.12; }   // correas
  n.phone.visible = false; n.phone.parent && n.phone.parent.remove(n.phone);   // el teléfono viejo (iba en el cuerpo invisible)
  n.phone = ph; n.rec = rec; ph.visible = false;
  // flash al sacar foto / cuando pasa algo fuerte
  let fT = 0;
  const _react = n.react.bind(n);
  n.react = (p, lv) => { _react(p, lv); if (n.state === 'film' && lv >= 2) fT = 0.18; };
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), hd = new THREE.Vector3(), tgt = new THREE.Vector3();
  MAP.upd.push(dt => {
    if (ph.parent !== scene) scene.add(ph);
    ph.visible = ph.visible && b.root.visible && !n.hidden;
    if (ph.visible) {
      b.root.updateMatrixWorld(true);
      hA.getWorldPosition(pa); hB.getWorldPosition(pb); headB.getWorldPosition(hd);
      ph.position.copy(pa).add(pb).multiplyScalar(0.5); ph.position.y += 0.035;
      const fc = fighters.length ? fightCenter() : hd; tgt.set(fc.x, ph.position.y + 0.05, fc.z);
      ph.lookAt(tgt);                                   // la cámara de atrás apunta a la pelea, la pantalla a él
    }
    fT -= dt; const on = fT > 0 && ph.visible;
    L.intensity = on ? 5 : (ph.visible ? 0.35 : 0); flashM.emissiveIntensity = on ? 6 : 0;
    spot.scale.setScalar(on ? 1.6 : 0.001); spot.material.opacity = on ? 1 : 0;
    scr.emissiveIntensity = ph.visible ? 1.2 + Math.sin(worldT * 3) * 0.2 : 0;
  });
  // pose de filmar: brazo estirado hacia la pelea, el otro sosteniendo la muñeca
  b.poseFn = (P) => {
    if (n.state === 'film') {
      P.aL = -1.25; P.eL = -0.55; P.aLz = 0.3; P.aR = -1.25; P.eR = -0.55; P.aRz = -0.3; P.hX = 0.12; P.tX = 0.05;
      if (b.curSpeed < 0.3) { P.lL = -0.12; P.kL = 0.18; P.kR = 0.22; }
    }
  };
}
MAP.upd.push(() => fixFilmador());

// v26: additive systems. Original attack, collision, map and retargeting code retained.
const V26 = { mode:'brawl', wallet:[0,0], captures:[0,0], flags:[], officers:[], active:false, tick:0, winner:null, styles:true };
try { const a=JSON.parse(localStorage.getItem('gv26-wallet')||'[0,0]'); if(Array.isArray(a)) V26.wallet=[0,1].map(i=>Number.isFinite(a[i])?Math.max(0,Math.floor(a[i])):0); } catch(e) {}
function save26(){try{localStorage.setItem('gv26-wallet',JSON.stringify(V26.wallet));}catch(e){}}
const style26=document.createElement('style');style26.textContent='#gv26setup{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:8px;max-width:700px}#gv26setup label{font:14px Arial;display:flex;align-items:center;gap:6px}#gv26setup select{background:#171c25;color:#fff;border:1px solid #ad9671;padding:8px;border-radius:6px}#gv26hud{position:fixed;top:86px;left:50%;transform:translateX(-50%);z-index:12;background:#10141ddd;border:1px solid #ad9671;border-radius:8px;padding:7px 14px;text-align:center;font:13px Arial;pointer-events:none;max-width:90vw}#gv26hud strong{color:#ffdb80}#gv26help{font:12px Arial;max-width:650px;text-align:center;color:#e2dac7;margin:5px 12px}';document.head.appendChild(style26);
const setup26=document.createElement('div');setup26.id='gv26setup';setup26.innerHTML='<label>Modo <select id="gv26mode"><option value="brawl">Pelea original</option><option value="ctf">Captura la bandera</option><option value="survival">Último en ser arrestado</option></select></label><label>Duración <select id="gv26time"><option value="180">3 minutos</option><option value="120">2 minutos</option><option value="300">5 minutos</option></select></label><label><input id="gv26styles" type="checkbox" checked> Estilos de banda</label>';
document.getElementById('startBtn').insertAdjacentElement('beforebegin',setup26);
const help26=document.createElement('div');help26.id='gv26help';help26.textContent='Dinero por golpes confirmados y rachas. Especial: 10 impactos seguidos sin recibir daño, tecla T (P2: Y). Bandera: tocar la rival y volver a tu base con la propia presente. Tienda todavía no incluida.';setup26.insertAdjacentElement('afterend',help26);
const hud26=document.createElement('div');hud26.id='gv26hud';hud26.className='hidden';document.body.appendChild(hud26);
document.getElementById('gv26mode').addEventListener('change',e=>V26.mode=e.target.value);
document.getElementById('gv26styles').addEventListener('change',e=>V26.styles=e.target.checked);
function band26(f){return teamDefs[f.team]?teamDefs[f.team].id:'original';}
function initF26(f){if(f.gv26)return;f.gv26={chain:0,last:-999,ready:false,respawn:0,role:['boxeador','patadas','agarres','mixto'][f.idx%4],styleCd:0};}
// Fabric micro-roughness, seams and worn folds, without replacing existing color maps or shaders.
const cloth26=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#b9b9b9';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=3){g.strokeStyle=y%6?'#aaa':'#c7c7c7';g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}for(let x=0;x<w;x+=4){g.strokeStyle='rgba(60,60,60,.13)';g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(let i=0;i<9;i++){g.strokeStyle='rgba(45,45,45,.12)';g.lineWidth=2;g.beginPath();g.moveTo(i*31,35);g.bezierCurveTo(i*31+20,85,i*31-12,165,i*31+15,230);g.stroke();}g.setLineDash([3,3]);g.strokeStyle='#e8e8e8';g.lineWidth=2;for(const x of [7,249]){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}});cloth26.wrapS=cloth26.wrapT=THREE.RepeatWrapping;
const oldBuild26=chpBuildFor;
chpBuildFor=function(f,tag){const v=oldBuild26(f,tag);initF26(f);const cache=chpCache(tag),outfit=chpOutfit(f,tag);const names=cache.meshes.filter(cm=>!chpMeshOpts(cm.name,outfit,tag,f).hide).map(cm=>cm.name);let mi=0;for(const o of v.root.children)if(o.isSkinnedMesh)o.name=names[mi++]||o.name;const done=new Map();v.root.traverse(o=>{if(!o.isMesh||!o.material)return;const list=Array.isArray(o.material)?o.material:[o.material];const next=list.map(m=>{if(done.has(m))return done.get(m);const n=m.clone();n.onBeforeCompile=m.onBeforeCompile;n.customProgramCacheKey=m.customProgramCacheKey;const isCloth=tag!=='ch12' && /shirt|pants|cloth|socks|poncho/i.test(o.name);if(isCloth){n.roughnessMap=cloth26;n.roughness=Math.min(1,Math.max(.72,m.roughness||.8));if(!n.bumpMap){n.bumpMap=cloth26;n.bumpScale=.0015;}n.metalness=0;}n.needsUpdate=true;done.set(m,n);return n;});o.material=Array.isArray(o.material)?next:next[0];});return v;};
const oldSpawn26=spawnTeams;spawnTeams=function(){oldSpawn26();for(const f of fighters)initF26(f);V26.captures=[0,0];V26.active=false;V26.winner=null;roundClock=Number(document.getElementById('gv26time').value)||180;};
const oldRound26=startRound;startRound=function(){oldRound26();if(V26.mode!=='brawl'&&duel){duel=false;for(const f of fighters){f.spectator=false;f.invuln=0;f.poseFn=null;}}};
const oldHit26=hitFighter;hitFighter=function(att,tgt,...args){const before=tgt.hp;const out=oldHit26(att,tgt,...args);if(gameState!=='fight'||att===tgt||att.team===tgt.team||tgt.hp>=before)return out;initF26(att);initF26(tgt);tgt.gv26.chain=0;tgt.gv26.ready=false;const a=att.gv26;a.chain=worldT-a.last<3.5?a.chain+1:1;a.last=worldT;a.ready=a.chain>=10;if(att.isPlayer){const pid=att.pid===2?1:0;const cash=3+Math.min(12,Math.floor(a.chain/3)*2)+(tgt.state==='ko'?20:0);V26.wallet[pid]=Math.min(999999999,V26.wallet[pid]+cash);save26();if(a.chain%3===0)popText(att.chest(),'+'+cash+' $ · RACHA '+a.chain,'combo',.8);}return out;};
const oldLight26=Fighter.prototype.doLight;Fighter.prototype.doLight=function(){initF26(this);const a=this.gv26;if(!this.isPlayer&&V26.styles&&this.canAct()&&!this.weapon&&worldT>a.styleCd){a.styleCd=worldT+2;const b=band26(this),r=Math.random();if((a.role==='agarres'||b==='gauchos')&&r<.25){this.doGrab();return;}if((a.role==='patadas'||b==='floggers')&&r<.3){this.doHeavy();return;}}return oldLight26.call(this);};
function special26(f){if(!f||!f.canAct())return;initF26(f);if(!f.gv26.ready)return;const b=band26(f);f.gv26.ready=false;f.gv26.chain=0;const names={gauchos:'REBENCAZO DEL BARRIO',motoqueros:'EMBESTIDA',floggers:'PASO RELÁMPAGO',cumbieros:'ARREBATO',rugbier:'AVALANCHA'};f.say(names[b]||'GOLPE DE BANDA',1.8,true);if(b==='floggers'){f.invuln=Math.max(f.invuln,.8);f.rage=Math.min(100,f.rage+35);return;}const enemies=fighters.filter(t=>t.team!==f.team&&t.alive&&!t.arrested&&!t.spectator&&t.pos.distanceTo(f.pos)<(b==='gauchos'?4.5:3.5)).sort((a,c)=>a.pos.distanceToSquared(f.pos)-c.pos.distanceToSquared(f.pos)).slice(0,b==='gauchos'?3:2);for(const t of enemies){hitFighter(f,t,18,6,true,.65,null,{held:true});if(t.alive&&t.state==='down'){t.vy=3.8;t.airborne=true;}}f.gv26.chain=0;f.gv26.ready=false;spawnParticles(f.chest(),0xffce68,16,4,.4,.07);}
function clearFlags26(){for(const flag of V26.flags){flag.g.parent?.remove(flag.g);flag.baseMesh.parent?.remove(flag.baseMesh);}V26.flags=[];}
function flags26(){clearFlags26();for(let t=0;t<2;t++){const base=finalSpot(t,0);const g=new THREE.Group();g.name='GV26_FLAG_'+t;const m=new THREE.MeshStandardMaterial({color:t?0xef493e:0x3f85ef,roughness:.85,side:THREE.DoubleSide});cyl(.035,.035,2,mat(0xc2c2b9),0,1,0,g,8);box(.85,.5,.035,m,.42,1.65,0,g);g.position.copy(base);scene.add(g);const bm=new THREE.Mesh(new THREE.TorusGeometry(1.35,.045,6,32),m);bm.rotation.x=Math.PI/2;bm.position.copy(base);bm.position.y=.06;scene.add(bm);V26.flags.push({team:t,base:base.clone(),g,baseMesh:bm,carrier:null,dropped:0});}}
function dropFlag26(f){for(const flag of V26.flags)if(flag.carrier===f){flag.carrier=null;flag.g.position.copy(f.pos);flag.dropped=12;}}
function winRound26(t,text){score[t]++;lastWinner=t;gameState='roundEnd';stateTimer=3.8;banner(text,teamLabel(t)+' · '+score.join(' - '),t===0?'win':'lose');sfx('bell');}
function ctf26(dt){for(const f of fighters){initF26(f);if(!f.alive){dropFlag26(f);f.gv26.respawn+=dt;if(f.gv26.respawn>5){f.hp=f.maxHp;f.setState('normal');f.root.visible=true;f.pos.copy(finalSpot(f.team,f.idx));f.invuln=1.5;f.gv26.respawn=0;}}else f.gv26.respawn=0;}
for(const flag of V26.flags){if(flag.carrier){const f=flag.carrier;if(!f.alive||f.state==='down'||f.arrested){dropFlag26(f);continue;}flag.g.position.copy(f.pos);flag.g.position.y=1.2;const own=V26.flags[f.team];if(f.pos.distanceTo(own.base)<1.6&&!own.carrier&&!own.dropped){V26.captures[f.team]++;flag.carrier=null;flag.g.position.copy(flag.base);flag.dropped=0;if(f.isPlayer){V26.wallet[f.pid===2?1:0]+=50;save26();}f.say('¡BANDERA ADENTRO!',1.8,true);if(V26.captures[f.team]>=3){winRound26(f.team,'¡TRES CAPTURAS!');return;}}}else{if(flag.dropped){flag.dropped-=dt;if(flag.dropped<=0){flag.dropped=0;flag.g.position.copy(flag.base);}}for(const f of fighters){if(!f.alive||f.arrested||f.state==='down'||f.pos.distanceTo(flag.g.position)>1.4)continue;if(f.team===flag.team&&flag.dropped){flag.dropped=0;flag.g.position.copy(flag.base);}else if(f.team!==flag.team){flag.carrier=f;flag.dropped=0;break;}}}}
for(const f of fighters){if(f.isPlayer||!f.alive||!f.canAct())continue;const foe=f.nearFoe(2.5);if(foe)continue;const enemy=V26.flags[1-f.team],own=V26.flags[f.team];const goal=enemy.carrier===f?own.base:own.carrier?own.carrier.pos:enemy.g.position;const dx=goal.x-f.pos.x,dz=goal.z-f.pos.z,d=Math.hypot(dx,dz);if(d>.8){f.moveX=dx/d;f.moveZ=dz/d;f.running=true;}}
}
function cleanupPolice26(){for(const o of V26.officers)o.destroy();V26.officers=[];}
const oldClear26=clearRound;clearRound=function(){clearFlags26();cleanupPolice26();V26.active=false;oldClear26();};
// Police chase uses existing Fighter meshes and movement, not the attack engine.
startPolice=function(){gameState='police';policeT=0;policeRounds++;V26.winner=null;cleanupPolice26();clearFlags26();sfx('siren');if(!policeLights){policeLights=new THREE.Group();const red=new THREE.PointLight(0xff2a2a,0,40,1.2),blue=new THREE.PointLight(0x2a5aff,0,40,1.2);red.position.set(-6,5,14);blue.position.set(6,5,14);policeLights.add(red,blue);policeLights.userData={red,blue};}scene.add(policeLights);policeLights.visible=true;for(const f of fighters){if(f.held)f.releaseGrab(true);f.spectator=false;f.invuln=0;f.attack=null;f.blockHeld=false;f.arrested=!f.alive;f.running=false;f.moveX=f.moveZ=0;if(f.alive)f.setState('normal');}
for(let i=0;i<3;i++){const cfg={name:'Oficial '+(i+1),civil:false,skin:0xc59a78,top:'remera',topColor:0x182940,pants:0x182436,shoe:0x111111,cap:0x182940,hair:'short'};const o=new Fighter(0,i,cfg,false);o.pos.set((i-1)*9,0,16);o.noClamp=false;o.civil=true;o.gv26Officer=true;V26.officers.push(o);}banner('¡CAYÓ LA POLICÍA!','Movete con tus controles habituales. Gana el último en ser arrestado.','lose');};
updatePolice=function(dt){policeT+=dt;if(policeLights){const on=Math.floor(policeT*6)%2===0;policeLights.userData.red.intensity=on?3.5:0;policeLights.userData.blue.intensity=on?0:3.5;}let list=fighters.filter(f=>f.alive&&!f.arrested);if(!list.length){if(V26.winner){winRound26(V26.winner.team,'¡'+V26.winner.name.toUpperCase()+' FUE EL ÚLTIMO!');}else{gameState='roundEnd';stateTimer=2;banner('TODOS DETENIDOS','Sin punto: no quedaban combatientes activos.','lose');}cleanupPolice26();policeLights.visible=false;return;}
if(policeT>1.5)hideBanner();for(const f of list){const ctl=f.isPlayer?readControls(f.pid):null;if(ctl){/* movement already read by playerControl */}else{const o=V26.officers.reduce((a,b)=>a.pos.distanceToSquared(f.pos)<b.pos.distanceToSquared(f.pos)?a:b);const dx=f.pos.x-o.pos.x,dz=f.pos.z-o.pos.z,d=Math.hypot(dx,dz)||1;f.moveX=dx/d;f.moveZ=dz/d;f.running=true;}}
for(const o of V26.officers){list=fighters.filter(f=>f.alive&&!f.arrested);if(!list.length)break;const target=list.reduce((a,b)=>a.pos.distanceToSquared(o.pos)<b.pos.distanceToSquared(o.pos)?a:b);const dx=target.pos.x-o.pos.x,dz=target.pos.z-o.pos.z,d=Math.hypot(dx,dz)||1;o.moveX=dx/d;o.moveZ=dz/d;o.running=true;o.facing=Math.atan2(dx,dz);const sp=Math.min(9,4.5+policeT*.07);o.pos.x+=dx/d*sp*dt;o.pos.z+=dz/d*sp*dt;o.update(dt);if(policeT>2&&d<1.05){target.arrested=true;target.moveX=target.moveZ=0;target.running=false;target.say('¡Me llevaron!',1.2,true);target.root.visible=false;target.stars.visible=false;target.label.style.display='none';V26.winner=target;}}
};
const oldFlow26=updateFlow;updateFlow=function(dt){if(gameState==='fight'){if(!V26.active){V26.active=true;if(V26.mode==='ctf')flags26();}if(V26.mode!=='brawl'){roundClock=Math.max(0,roundClock-dt);if(roundClock<=0){startPolice();return;}if(V26.mode==='ctf')ctf26(dt);else if(aliveCount(0)+aliveCount(1)<=1)startPolice();return;}}return oldFlow26(dt);};
const oldUpdate26=Fighter.prototype.update;Fighter.prototype.update=function(dt){if(gameState==='police'&&!this.gv26Officer&&!this.arrested&&this.alive){const dx=this.moveX,dz=this.moveZ;const d=Math.hypot(dx,dz);if(d>.01){const sp=this.running?6:3.7;this.pos.x+=dx/d*sp*dt;this.pos.z+=dz/d*sp*dt;this.facing=Math.atan2(dx,dz);this.curSpeed=sp;}collideObstacles(this.pos,.35);this.pos.x=clamp(this.pos.x,-BOUNDS.x,BOUNDS.x);this.pos.z=clamp(this.pos.z,-BOUNDS.z,BOUNDS.z);}const result=oldUpdate26.call(this,dt);if(gameState==='police'&&!this.arrested&&this.alive){this.curSpeed=Math.hypot(this.moveX,this.moveZ)>.05?(this.running?6:3.7):0;this.animate(dt);}return result;};
const oldStep26=step;step=function(dt,render){if(gameState==='fight'){for(const f of fighters){initF26(f);if(worldT-f.gv26.last>3.5){f.gv26.chain=0;f.gv26.ready=false;}}if(PR('KeyT'))special26(player);if(PR('KeyY'))special26(player2);}oldStep26(dt,render);V26.tick+=dt;if(V26.tick>.1){V26.tick=0;const on=['fight','police','intro','roundEnd'].includes(gameState);hud26.classList.toggle('hidden',!on);if(on){const a=player&&player.gv26;const b=player2&&player2.gv26;hud26.innerHTML='<strong>$ '+V26.wallet[0]+(TWO_P?' / $ '+V26.wallet[1]:'')+'</strong> · '+(V26.mode==='ctf'?'Banderas '+V26.captures.join(' : '):V26.mode==='survival'?'Último arrestado':'Pelea original')+'<br>Racha '+(a?a.chain:0)+(a&&a.ready?' · ESPECIAL T LISTO':'')+(b?' / P2 '+b.chain+(b.ready?' · ESPECIAL Y LISTO':''):'')+(gameState==='police'?' · Libres: '+fighters.filter(f=>f.alive&&!f.arrested).length:'');}}};
// Public diagnostics for reproducible tests; no autonomous agents are claimed.
window.GV26={get state(){return V26;},special:special26,startPolice,flags:flags26,ctf:ctf26,get clock(){return roundClock;},set clock(v){roundClock=Math.max(0,Number(v)||0);}};

// v27 visual pass: accessories and optional mild impact blood only.
const GV27={blood:true};
const bloodLabel27=document.createElement('label');bloodLabel27.innerHTML='<input type="checkbox" checked> Sangre leve';document.getElementById('gv26setup').appendChild(bloodLabel27);bloodLabel27.querySelector('input').addEventListener('change',e=>{GV27.blood=e.target.checked;if(!GV27.blood)clearBlood5();});
function mesh27(geo,material,parent,name){const m=new THREE.Mesh(geo,material);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function hat27(f,v,tag,gaucho){const h=v.bones[v.names.indexOf('Head')];if(!h)return;const g=new THREE.Group();g.name=gaucho?'GV27_SOMBRERO':'GV27_GORRA';h.add(g);const zf=tag==='ch02'?.04:0;g.position.set(0,tag==='ch12'?.16:.145,.006+zf);const color=gaucho?[0x4c3526,0x6b5239,0x322820,0x514436][f.idx%4]:[0x14191f,0x263653,0x9c2429,0x161b25][f.idx%4];const mt=mat(color,{roughness:.94});if(gaucho){const brim=mesh27(new THREE.CylinderGeometry(.195,.195,.009,48),mt,g,'GV27_ALA');brim.scale.z=.83;const crown=mesh27(new THREE.CylinderGeometry(.115,.128,.105,32),mt,g,'GV27_COPA');crown.position.y=.0525;const ribbon=mesh27(new THREE.CylinderGeometry(.1285,.1285,.015,32,1,true),mat(0x221a15,{roughness:.8}),g,'GV27_CINTA');ribbon.position.y=.018;}else{const crown=mesh27(new THREE.SphereGeometry(1,32,16,0,Math.PI*2,0,Math.PI/2),mt,g,'GV27_PANEL');crown.scale.set(.128,.12,.15);const brim=mesh27(new THREE.SphereGeometry(1,32,10),mt,g,'GV27_VISERA');brim.scale.set(.115,.008,.09);brim.position.set(0,-.006,.13);brim.rotation.x=.08;g.rotation.x=0;for(let i=0;i<6;i++){const a=i*Math.PI/3;const pts=[];for(let j=0;j<=12;j++){const t=j/12*Math.PI/2;pts.push(new THREE.Vector3(Math.sin(t)*Math.cos(a)*.129,Math.cos(t)*.121,Math.sin(t)*Math.sin(a)*.151));}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x66717d,transparent:true,opacity:.4}));g.add(line);}const button=mesh27(new THREE.SphereGeometry(.009,12,8),mt,g,'GV27_BOTON');button.position.y=.12;}}
function face27(f,v,tag){const h=v.bones[v.names.indexOf('Head')];if(!h)return;const zf=tag==='ch02'?.04:0;const g=new THREE.Group();g.name='GV27_COBERTURA';h.add(g);g.position.z=zf;const mt=new THREE.MeshStandardMaterial({map:GAITER_TEX,roughness:.98,side:THREE.DoubleSide});const mask=mesh27(new THREE.CylinderGeometry(.109,.09,.115,32,4,true,-Math.PI*.54,Math.PI*1.08),mt,g,'GV27_PANUELO');mask.position.set(0,.014,.018);mask.rotation.x=-.05;if(f.idx%4===3){const hood=mesh27(new THREE.SphereGeometry(1,32,20,Math.PI*.54,Math.PI*.92),mat(0x16191d,{roughness:.98,side:THREE.DoubleSide}),g,'GV27_CAPUCHA');hood.scale.set(.112,.154,.13);hood.position.set(0,.078,-.005);const top=mesh27(new THREE.SphereGeometry(1,32,12,0,Math.PI*2,0,.95),mat(0x16191d,{roughness:.98}),g,'GV27_CAPUCHA_SUPERIOR');top.scale.set(.112,.154,.13);top.position.set(0,.078,-.005);}const knot=mesh27(new THREE.SphereGeometry(.022,12,8),mt,g,'GV27_NUDO');knot.position.set(0,-.016,-.108);}
function beard27(f,v,tag){const h=v.bones[v.names.indexOf('Head')];if(!h)return;const g=new THREE.Group();g.name='GV27_BARBA';h.add(g);const mt=mat(f.idx===1?0x43362c:0x29221c,{roughness:1});const zf=tag==='ch02'?.04:0;for(let i=0;i<15;i++){const a=-1.2+i/14*2.4;const m=mesh27(new THREE.SphereGeometry(1,10,8),mt,g,'GV27_BARBA_MECHON');m.scale.set(.017,.026+Math.cos(a)*.011,.012);m.position.set(Math.sin(a)*.076,.001-Math.cos(a)*.016,Math.cos(a)*.09+.019+zf);}for(const x of [-.019,.019]){const m=mesh27(new THREE.SphereGeometry(1,12,8),mt,g,'GV27_BIGOTE');m.scale.set(.024,.009,.009);m.position.set(x,.045,.112+zf);}}
function poncho27(f,v,tag){
  const C=chpCache(tag),skel=new THREE.Skeleton(v.bones,C.CH.bones.map(b=>chM4(b.w).invert()));
  const old=f.cfg.poncho,style=f.cfg.ponchoStyle;
  f.cfg.poncho=['salteno','pampa','gris','vicuna'][f.idx%4];f.cfg.ponchoStyle=f.idx===3?'hombro':'entero';
  const before=v.root.children.length;
  try{chpPonchoSkin(f,v.root,skel,C,tag);}finally{f.cfg.poncho=old;f.cfg.ponchoStyle=style;}
  for(let i=before;i<v.root.children.length;i++)v.root.children[i].name='GV28_PONCHO_AJUSTADO';
}
const buildBefore27=chpBuildFor;
chpBuildFor=function(f,tag){const b=band26(f),target=!f.civil&&(b==='cumbieros'||b==='gauchos');if(!target)return buildBefore27(f,tag);const c=f.cfg,saved={};const savedHair28=c.hair;c.hair='bald';for(const key of ['cap','hat','faceCover','beard','mustache','poncho','ponchoStyle']){saved[key]=c[key];c[key]=null;}if(b==='cumbieros'){c.top='remera';c.topColor=[0x171e29,0x253951,0xeeeeea,0x28262d][f.idx%4];c.pants=[0x151b25,0x202b3a,0x1b2430,0x232329][f.idx%4];c.jacket={color:c.topColor,trim:[0xe5e6e0,0xb9c1c7]};c.fakeSport=true;}else{c.top='remera';c.topColor=[0xd2c3a5,0xc4b28d,0xa99d81,0xc5b69c][f.idx%4];c.pants=[0x3e3b30,0x514735,0x343a32,0x4d4130][f.idx%4];c.bombacha=true;c.boots=0x3a281c;}
let v;try{v=buildBefore27(f,tag);}finally{Object.assign(c,saved);c.hair=savedHair28;}hat27(f,v,tag,b==='gauchos');if(b==='cumbieros'){if(f.idx===0||f.idx===3)face27(f,v,tag);const bone=v.bones[v.names.indexOf('Spine2')];if(bone){const tx=canvasTex(256,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle=c.topColor===0xeeeeea?'#202a38':'#eeeeea';g.font='italic bold 44px Arial';g.textAlign='center';g.fillText(f.idx%2?'NIKA':'ADIBA',128,72);g.fillRect(70,85,116,4);});const m=mesh27(new THREE.PlaneGeometry(.17,.085),new THREE.MeshStandardMaterial({map:tx,transparent:true,roughness:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),bone,'GV27_MARCA_FICTICIA');m.position.set(-.075,.045,.155);}}else{poncho27(f,v,tag);if(f.idx===1||f.idx===3)beard27(f,v,tag);}return v;};
const bleedBefore27=bleed5;bleed5=function(p,n,count){if(!GV27.blood)return;const before=drops5.length;bleedBefore27(p,n,Math.min(8,count));for(let i=before;i<drops5.length;i++){drops5[i].r*=1.35;drops5[i].o.scale.setScalar(drops5[i].r);}};
const hitBefore27=hitFighter;hitFighter=function(a,t,...args){const hp=t.hp;const out=hitBefore27(a,t,...args);if(GV27.blood&&t.hp<hp&&args[0]>=10&&worldT-(t.gv27BloodT||-99)>.65){t.gv27BloodT=worldT;const p=zoneOf(a,args[6])==='head'&&t.chv?t.chv.v.bones[t.chv.v.names.indexOf('Head')].getWorldPosition(new THREE.Vector3()):t.chest();bleed5(p,new THREE.Vector3(Math.sin(a.facing),0,Math.cos(a.facing)),3);}return out;};
window.GV27=GV27;

// v29: reference-inspired sportswear, Cumbieros only. Gameplay untouched.
const LOOK29=[
 {top:0x161a20,pants:0x34383b,cap:0xb62943,trim:0x333941,band:0x252b31,kind:0},
 {top:0x111f38,pants:0x1b2940,cap:0x42b8b3,trim:0x46a8cf,band:0x111f38,kind:1},
 {top:0x183c32,pants:0x343a36,cap:0xe34a9d,trim:0xe9eae5,band:0xe9eae5,kind:2},
 {top:0x15213b,pants:0x171f2d,cap:0x263d8e,trim:0xe0c755,band:0x15213b,kind:3}
];
const fabricBefore29=chpFabricOpts;
chpFabricOpts=function(f,cm,op,tag){op=fabricBefore29(f,cm,op,tag);if(f.civil||band26(f)!=='cumbieros')return op;const look=LOOK29[f.idx%4],n=cm.name.replace(/^Ch\d+_/,'');op.gv29={look,ax:chAxes(tag),parts:!!op.parts,garment:op.parts?'combined':n};
 if(op.parts){op.parts=op.parts.slice();op.parts[1]=look.top;op.parts[2]=look.pants;op.fabTop=1;op.fabPants=3;op.sportTop=null;op.sportPants=null;}else{if(n==='Shirt')op.col=look.top;if(n==='Pants')op.col=look.pants;op.sport=null;op.fab=n==='Pants'?3:1;}return op;};
function sportsMat29(mt,info){const prev=mt.onBeforeCompile,cache=mt.customProgramCacheKey.bind(mt),l=info.look,ax=info.ax;const U={u29Top:{value:linCol(l.top)},u29Pants:{value:linCol(l.pants)},u29Trim:{value:linCol(l.trim)},u29Band:{value:linCol(l.band)},u29Kind:{value:l.kind},u29Chest:{value:ax.neck.y-.22},u29Hem:{value:ax.hips.y+.035},u29ArmX:{value:Math.abs(ax.armA.x)},u29AA:{value:new THREE.Vector3(Math.abs(ax.armA.x),ax.armA.y,ax.armA.z)},u29AD:{value:new THREE.Vector3(Math.abs(ax.armD.x),ax.armD.y,ax.armD.z).normalize()}};
 mt.onBeforeCompile=sh=>{prev(sh);Object.assign(sh.uniforms,U);sh.vertexShader='varying vec3 v29P;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n v29P=position;');const top=info.parts?'int(vPart+0.5)==1':info.garment==='Shirt'||info.garment==='sleeve'?'true':'false';const pants=info.parts?'int(vPart+0.5)==2':info.garment==='Pants'?'true':'false';
 sh.fragmentShader='varying vec3 v29P;uniform vec3 u29Top,u29Pants,u29Trim,u29Band,u29AA,u29AD;uniform float u29Kind,u29Chest,u29Hem,u29ArmX;\n'+sh.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
 if(${top}){
   vec3 col=u29Top;float y=v29P.y;float ax=abs(v29P.x);
   if(u29Kind<0.5 && y>u29Chest-0.045 && y<u29Chest+0.08)col=u29Band;
   if(u29Kind>1.5 && u29Kind<2.5 && y>u29Chest-0.085 && y<u29Chest+0.09)col=u29Band;
   if((u29Kind>0.5&&u29Kind<1.5)||u29Kind>2.5){
     vec3 r29=vec3(ax,y,v29P.z)-u29AA;float t29=dot(r29,u29AD);vec3 pr29=r29-u29AD*t29;float line29=min(abs(pr29.y-0.01),abs(pr29.y+0.01));if(t29>-.035 && t29<.62 && pr29.z>.025 && line29<.0045)col=u29Trim;
     if(y>u29Chest+0.08 && ax>0.11 && v29P.z>0.04)col=mix(col,u29Trim,0.65);
   }
   if(abs(v29P.x)<0.0045 && v29P.z>0.07 && y>u29Hem && y<u29Chest+0.2)col=mix(vec3(0.65),vec3(0.12),step(0.5,fract(y*280.0)));
   if(y<u29Hem+0.025)col*=0.65;
   float grain=fract(sin(dot(v29P,vec3(923.2,471.8,813.1)))*43758.5453);diffuseColor.rgb=col*(0.95+0.055*grain);
 }
 if(${pants}){float grain=fract(sin(dot(v29P,vec3(791.2,332.1,593.7)))*43758.5453);diffuseColor.rgb=u29Pants*(0.94+0.07*grain);}
 `);};mt.customProgramCacheKey=()=>cache()+'|gv29-'+info.garment+'-'+info.parts;mt.roughness=.78;mt.metalness=0;mt.needsUpdate=true;return mt;}
const materialBefore29=chpMat;
chpMat=function(cm,op){const mt=materialBefore29(cm,op);if(op.gv29&&['combined','Shirt','Pants'].includes(op.gv29.garment))sportsMat29(mt,op.gv29);return mt;};
function sleeves29(f,v,tag){const C=chpCache(tag),ax=chAxes(tag),look=LOOK29[f.idx%4],B=n=>new THREE.Vector3().setFromMatrixPosition(chM4(C.CH.bones[v.names.indexOf(n)].w));const skel=new THREE.Skeleton(v.bones,C.CH.bones.map(b=>chM4(b.w).invert()));
 for(const side of ['Left','Right']){const names=[side+'Arm',side+'ForeArm',side+'Hand'],ids=names.map(n=>v.names.indexOf(n));if(ids.some(i=>i<0))continue;const a=B(names[0]),b=B(names[1]),c=B(names[2]);const positions=[],uv=[],indices=[],si=[],sw=[];const rings=20,radial=20;
 for(let j=0;j<=rings;j++){const t=j/rings,seg=t<.5?0:1,k=seg===0?t*2:(t-.5)*2;const A=seg===0?a:b,D=(seg===0?b:c).clone().sub(A).normalize(),center=A.clone().lerp(seg===0?b:c,k);const X=new THREE.Vector3(0,1,0).cross(D).normalize(),Y=D.clone().cross(X).normalize();let radius=t<.5?.071-(t/.5)*.009:.062-((t-.5)/.5)*.014;if(t>.92)radius=.045;for(let i=0;i<=radial;i++){const angle=i/radial*Math.PI*2;const p=center.clone().addScaledVector(X,Math.cos(angle)*radius).addScaledVector(Y,Math.sin(angle)*radius);positions.push(p.x,p.y,p.z);uv.push(i/radial,t);let w=seg===0?Math.max(0,(k-.72)/.28):0;si.push(ids[seg],ids[seg+1],0,0);sw.push(1-w,w,0,0);}}
 for(let j=0;j<rings;j++)for(let i=0;i<radial;i++){const a=j*(radial+1)+i,b=a+1,c=a+radial+1,d=c+1;indices.push(a,b,c,b,d,c);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));geo.setIndex(indices);geo.computeVertexNormals();const mt=sportsMat29(new THREE.MeshStandardMaterial({color:look.top,roughness:.78,side:THREE.DoubleSide}),{look,ax,parts:false,garment:'sleeve'});const m=new THREE.SkinnedMesh(geo,mt);m.name='GV29_MANGA_'+side;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;m.bind(skel,new THREE.Matrix4());v.root.add(m);}}
const buildBefore29=chpBuildFor;
chpBuildFor=function(f,tag){const v=buildBefore29(f,tag);if(f.civil||band26(f)!=='cumbieros')return v;const look=LOOK29[f.idx%4];const remove=[];v.root.traverse(o=>{if(o.name==='GV27_COBERTURA')remove.push(o);if(o.name==='GV27_GORRA'){o.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.color.copy(linCol(look.cap));}});}if(o.name==='GV27_MARCA_FICTICIA'){o.material.map=canvasTex(256,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#eeeeea';g.font='bold italic 38px Arial';g.textAlign='center';g.fillText(f.idx%2?'NIKA':'ADIBA',128,72);});o.material.needsUpdate=true;}
 if(o.isSkinnedMesh && (o.name==='Pants'||o.name==='Ch01_Pants'||o.geometry.attributes.gvPart)){const old=o.geometry,geo=old.clone(),p=geo.attributes.position,n=geo.attributes.normal,part=geo.attributes.gvPart;for(let i=0;i<p.count;i++){const pants=part?Math.round(part.getX(i))===2:/Pants/.test(o.name);if(!pants)continue;const y=p.getY(i);const offset=y>.18&&y<.95?.009:.003;p.setXYZ(i,p.getX(i)+n.getX(i)*offset,p.getY(i),p.getZ(i)+n.getZ(i)*offset);}p.needsUpdate=true;geo.computeVertexNormals();o.geometry=geo;}
 });for(const o of remove)o.parent?.remove(o);sleeves29(f,v,tag);return v;};
window.GV29={looks:LOOK29};

