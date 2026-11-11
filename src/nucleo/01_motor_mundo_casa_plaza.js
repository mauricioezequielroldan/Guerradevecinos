

(function () {
'use strict';
const THREE = (window.MeshCat && window.MeshCat.THREE) || window.THREE;
const loadingEl = document.getElementById('loading');
if (!THREE) { loadingEl.textContent = 'Error: no se pudo cargar el motor 3D.'; return; }

const params = new URLSearchParams(location.search);
const AUTO = params.has('auto');
const SPEED = parseFloat(params.get('speed') || '1');
const USE_POST = !params.has('nopost');

// ============================================================
// RENDERER
// ============================================================
const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: !USE_POST, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

let scene = null;
const houseScene = new THREE.Scene(), plazaScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 320);
camera.position.set(0, 10, 30);

// ============================================================
// POST-PRODUCCIÓN "película de pandillas": bloom + gradación + grano
// ============================================================
let post = null;
const QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
function initPost() {
  if (!USE_POST) return;
  try {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const o = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
    const ms = renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget;
    const rtScene = ms ? new THREE.WebGLMultisampleRenderTarget(size.x, size.y, o) : new THREE.WebGLRenderTarget(size.x, size.y, o);
    if (ms) rtScene.samples = 4;
    rtScene.texture.encoding = THREE.sRGBEncoding;
    const q = (w, h) => new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), o);
    const rtA = q(size.x >> 2, size.y >> 2), rtB = q(size.x >> 2, size.y >> 2);
    const mk = (fs, uniforms) => new THREE.ShaderMaterial({ uniforms, vertexShader: QUAD_VS, fragmentShader: fs, depthTest: false, depthWrite: false });
    const bright = mk(`uniform sampler2D tDiffuse; uniform float thr; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.299,0.587,0.114));
      gl_FragColor = vec4(c * smoothstep(thr, thr + 0.22, l), 1.0); }`, { tDiffuse: { value: null }, thr: { value: 0.72 } });
    const blur = mk(`uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;
      void main(){ vec3 s = texture2D(tDiffuse, vUv).rgb * 0.227;
      s += texture2D(tDiffuse, vUv + dir * 1.385).rgb * 0.316; s += texture2D(tDiffuse, vUv - dir * 1.385).rgb * 0.316;
      s += texture2D(tDiffuse, vUv + dir * 3.231).rgb * 0.070; s += texture2D(tDiffuse, vUv - dir * 3.231).rgb * 0.070;
      gl_FragColor = vec4(s, 1.0); }`, { tDiffuse: { value: null }, dir: { value: new THREE.Vector2() } });
    const final = mk(`uniform sampler2D tScene; uniform sampler2D tBloom; uniform float time; uniform float bloom; uniform float grade; uniform float warm; varying vec2 vUv;
      float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 d = vUv - 0.5; float r2 = dot(d, d);
        vec2 off = d * 0.0035 * (0.3 + r2 * 3.0);
        vec3 c = vec3(texture2D(tScene, vUv + off).r, texture2D(tScene, vUv).g, texture2D(tScene, vUv - off).b);
        c += texture2D(tBloom, vUv).rgb * bloom;
        float l = dot(c, vec3(0.299,0.587,0.114));
        vec3 shadowTint = vec3(0.86, 0.98, 1.08), highTint = vec3(1.10, 1.0, 0.86) * warm + vec3(1.0) * (1.0 - warm);
        c *= mix(shadowTint, highTint, smoothstep(0.0, 0.75, l)) * grade + vec3(1.0 - grade);
        c = (c - 0.5) * 1.10 + 0.5;
        c = mix(vec3(l), c, 1.12);
        c *= 1.0 - r2 * 1.15;
        c += (rnd(vUv * 731.0 + time) - 0.5) * 0.055;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`, { tScene: { value: rtScene.texture }, tBloom: { value: rtA.texture }, time: { value: 0 }, bloom: { value: 1.0 }, grade: { value: 1.0 }, warm: { value: 1.0 } });
    const qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), final); quad.frustumCulled = false; qs.add(quad);
    post = { rtScene, rtA, rtB, bright, blur, final, qs, qc, quad };
  } catch (e) { post = null; }
}
function resizePost() {
  if (!post) return;
  const s = renderer.getDrawingBufferSize(new THREE.Vector2());
  post.rtScene.setSize(s.x, s.y); post.rtA.setSize(Math.max(1, s.x >> 2), Math.max(1, s.y >> 2)); post.rtB.setSize(Math.max(1, s.x >> 2), Math.max(1, s.y >> 2));
}
let postTime = 0;
function renderFrame(dt) {
  if (!post) { renderer.render(scene, camera); return; }
  const p = post; postTime += dt || 0.016;
  renderer.setRenderTarget(p.rtScene); renderer.render(scene, camera);
  const pass = (m, target) => { p.quad.material = m; renderer.setRenderTarget(target); renderer.render(p.qs, p.qc); };
  p.bright.uniforms.tDiffuse.value = p.rtScene.texture; pass(p.bright, p.rtA);
  const w = p.rtA.width, h = p.rtA.height;
  for (const k of [1, 2.2]) {
    p.blur.uniforms.tDiffuse.value = p.rtA.texture; p.blur.uniforms.dir.value.set(k / w, 0); pass(p.blur, p.rtB);
    p.blur.uniforms.tDiffuse.value = p.rtB.texture; p.blur.uniforms.dir.value.set(0, k / h); pass(p.blur, p.rtA);
  }
  p.final.uniforms.time.value = postTime % 100;
  p.final.uniforms.warm.value = scene === houseScene ? 1.0 : 0.55;
  p.final.uniforms.bloom.value = scene === houseScene ? 0.25 : 1.1;
  pass(p.final, null);
}
initPost();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizePost();
});

// ============================================================
// HELPERS
// ============================================================
const matCache = {};
// v4: los colores se escriben en sRGB (como en cualquier editor) y se pasan a lineal.
// three r132 tomaba el hex como lineal y eso lavaba la imagen. Se puede comparar con ?srgbviejo.
const LINEAR = !params.has('srgbviejo');
function linMat(m) { if (LINEAR) { m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); } return m; }
function mat(color, opts) {
  const key = color + JSON.stringify(opts || {});
  if (matCache[key]) return matCache[key];
  return (matCache[key] = linMat(new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.85, metalness: 0 }, opts || {}))));
}
function uniqueMat(color, opts) { return linMat(new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.8, metalness: 0 }, opts || {}))); }
const BOX = new THREE.BoxGeometry(1, 1, 1);
let ROUND = false, RBOX = null;
function roundedBoxGeo(r, seg) {
  const g = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg);
  const p = g.attributes.position, v = new THREE.Vector3(), cc = new THREE.Vector3(), inner = 0.5 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    cc.set(Math.max(-inner, Math.min(inner, v.x)), Math.max(-inner, Math.min(inner, v.y)), Math.max(-inner, Math.min(inner, v.z)));
    const d = v.clone().sub(cc); if (d.lengthSq() > 1e-9) { d.normalize().multiplyScalar(r); v.copy(cc).add(d); }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
function box(w, h, d, material, x, y, z, parent, shadow) {
  if (ROUND && !RBOX) RBOX = roundedBoxGeo(0.24, 5);
  const m = new THREE.Mesh(ROUND ? RBOX : BOX, typeof material === 'number' ? mat(material) : material);
  m.scale.set(w, h, d); m.position.set(x, y, z);
  if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
  if (parent) parent.add(m);
  return m;
}
const geoCache = {};
function cylGeo(rt, rb, h, seg) { const k = [rt, rb, h, seg].join('|'); return geoCache[k] || (geoCache[k] = new THREE.CylinderGeometry(rt, rb, h, seg || 12)); }
function cyl(rt, rb, h, material, x, y, z, parent, seg) {
  const m = new THREE.Mesh(cylGeo(rt, rb, h, seg), typeof material === 'number' ? mat(material) : material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const SPH = new THREE.SphereGeometry(1, 26, 20);
function sph(sx, sy, sz, material, x, y, z, parent, shadow) {
  const m = new THREE.Mesh(SPH, typeof material === 'number' ? mat(material) : material);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
  if (parent) parent.add(m);
  return m;
}
// Hornea una escala X/Z de un grupo en sus descendientes (necesario para IK: un padre con
// escala no uniforme deforma a los hijos cuando rotan).
function bakeXZ(g, sx, sz) {
  g.traverse(o => { if (o === g) return; o.position.x *= sx; o.position.z *= sz; if (o.isMesh) { o.scale.x *= sx; o.scale.z *= sz; } });
}
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
function shadeHex(hex, v) { const r = clamp(((hex >> 16) & 255) + v, 0, 255), g = clamp(((hex >> 8) & 255) + v, 0, 255), b = clamp((hex & 255) + v, 0, 255); return (r << 16) | (g << 8) | b; }

// ============================================================
// MUNDO: EL BARRIO (casa de la banda + plaza grande)
// ============================================================
const obstacles = [];
function addObstacle(cx, cz, w, d) { obstacles.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 }); }
const BOUNDS = { x: 25, z: 27.4 };
const flickers = [], moths = [], spinners = [], flags = [];
const tableWeapons = {};
const SPOTS = {}; // puntos importantes (puertas, etc.)
function setScene(s) { scene = s; renderer.toneMappingExposure = (s === houseScene ? 0.85 : 1.05) * (LINEAR ? (s === houseScene ? 1.1 : 1.3) : 1); }

// ---------- texturas procedurales ----------
function canvasTex(w, h, draw, rx, ry) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
function cloneTex(t, rx, ry) { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return c; }
function texMat(t, rx, ry, opts) { return new THREE.MeshStandardMaterial(Object.assign({ map: cloneTex(t, rx, ry), roughness: 0.92 }, opts || {})); }
function shade(hex, v) {
  const r = clamp(((hex >> 16) & 255) + v, 0, 255) | 0, g = clamp(((hex >> 8) & 255) + v, 0, 255) | 0, b = clamp((hex & 255) + v, 0, 255) | 0;
  return `rgb(${r},${g},${b})`;
}
function speckle(g, w, h, n, dark, light) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${rand(0.04, dark)})` : `rgba(255,255,255,${rand(0.02, light)})`;
    const s = rand(1, 3); g.fillRect(rand(0, w), rand(0, h), s, s);
  }
}
function blobs(g, w, h, n, color, r0, r1) { for (let i = 0; i < n; i++) { g.fillStyle = color; g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(r0, r1), 0, 7); g.fill(); } }
function makeSky(stops, stars) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 512;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
  if (stars) for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${rand(0.3, 0.9)})`; g.fillRect(rand(0, 64), rand(0, 200), 1, 1); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
const grassTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#3e6a2a'; g.fillRect(0, 0, w, h);
  blobs(g, w, h, 16, 'rgba(90,120,40,0.22)', 15, 50);
  blobs(g, w, h, 10, 'rgba(30,60,20,0.25)', 10, 40);
  const cols = ['#4f8034', '#2f5520', '#5a8a3a', '#37612a', '#6a9a40', '#456f2c'];
  for (let i = 0; i < 6000; i++) { g.fillStyle = pick(cols); g.fillRect(rand(0, w), rand(0, h), 1.2, rand(2, 6)); }
  blobs(g, w, h, 6, 'rgba(150,130,80,0.25)', 6, 16);
});
const dirtTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#86704f'; g.fillRect(0, 0, w, h);
  blobs(g, w, h, 18, 'rgba(60,45,30,0.18)', 10, 40);
  blobs(g, w, h, 12, 'rgba(170,150,110,0.18)', 8, 30);
  speckle(g, w, h, 4000, 0.3, 0.12);
  for (let i = 0; i < 90; i++) { g.fillStyle = pick(['#a8a090', '#6a5a48', '#c8bca8']); g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(1, 3), 0, 7); g.fill(); }
});
const revoqueTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, w, h);
  blobs(g, w, h, 25, 'rgba(80,75,65,0.08)', 10, 45);
  speckle(g, w, h, 3500, 0.15, 0.08);
  const gr = g.createLinearGradient(0, h * 0.7, 0, h); gr.addColorStop(0, 'rgba(60,70,40,0)'); gr.addColorStop(1, 'rgba(60,70,40,0.35)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(40,35,30,0.35)'; g.lineWidth = 1;
  for (let i = 0; i < 4; i++) { let x = rand(0, w), y = rand(0, h); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += rand(-8, 8); y += rand(4, 12); g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(40,35,30,0.12)'; g.fillRect(rand(0, w), 0, rand(2, 6), rand(h * 0.3, h)); }
});
function brickTex(base, mortar, bw, bh) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = mortar; g.fillRect(0, 0, w, h);
    for (let r = 0; r < h / bh; r++) {
      const off = (r % 2) * bw / 2;
      for (let c = -1; c <= w / bw; c++) { g.fillStyle = shade(base, rand(-24, 14)); g.fillRect(c * bw + off + 2, r * bh + 2, bw - 4, bh - 4); }
    }
    speckle(g, w, h, 2000, 0.2, 0.06);
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(160,150,140,0.35)'; g.fillRect(rand(0, w), rand(0, h), rand(6, 30), rand(2, 6)); }
  });
}
const huecoTex = brickTex(0xc0602e, '#8a7a6a', 64, 32);
const brickTexC = brickTex(0x9a4a2a, '#6a5a4a', 32, 14);
const concreteTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#8c8a84'; g.fillRect(0, 0, w, h);
  blobs(g, w, h, 12, 'rgba(40,38,35,0.12)', 8, 35);
  speckle(g, w, h, 4000, 0.22, 0.08);
  g.strokeStyle = 'rgba(30,30,30,0.5)'; g.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) { let x = rand(0, w), y = rand(0, h); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 10; k++) { x += rand(-12, 12); y += rand(-12, 12); g.lineTo(x, y); } g.stroke(); }
});
const asphaltTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#2c2c30'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 5000, 0.3, 0.08);
  blobs(g, w, h, 6, 'rgba(70,70,70,0.25)', 10, 40);
});
const checkerTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#5a5a58'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#2a2a2a' : '#9a9890'; g.fillRect(16 + i * 12, 16 + j * 12, 12, 12); }
  speckle(g, w, h, 600, 0.2, 0.08);
});
const barsTex = canvasTex(32, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(12, 0, 7, h); });
const glowTex = canvasTex(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
function glow(x, y, z, color, size, parent) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  s.position.set(x, y, z); s.scale.set(size, size, 1); (parent || scene).add(s); return s;
}
function plane(w, d, material, x, y, z, rotZ, parent) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  p.rotation.x = -Math.PI / 2; if (rotZ) p.rotation.z = rotZ;
  p.position.set(x, y, z); p.receiveShadow = true; (parent || scene).add(p); return p;
}
function wire(a, b, sag, parent) {
  const N = 8, m = mat(0x111111, { roughness: 0.6 });
  let prev = a.clone();
  for (let i = 1; i <= N; i++) {
    const t = i / N, p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= sag * 4 * t * (1 - t);
    const len = prev.distanceTo(p), s = new THREE.Mesh(BOX, m);
    s.scale.set(0.025, 0.025, len); s.position.copy(prev).add(p).multiplyScalar(0.5); s.lookAt(p);
    (parent || scene).add(s); prev = p;
  }
}
function reja(x0, x1, z, h, y0, parent, color) {
  const w = Math.abs(x1 - x0), cx = (x0 + x1) / 2, m = mat(color || 0x141414, { metalness: 0.6, roughness: 0.5 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: cloneTex(barsTex, w / 0.13, 1), alphaTest: 0.5, side: THREE.DoubleSide, color: color || 0x141414, metalness: 0.6, roughness: 0.5 }));
  p.position.set(cx, y0 + h / 2, z); p.castShadow = true; (parent || scene).add(p);
  box(w, 0.05, 0.05, m, cx, y0 + h, z, parent || scene); box(w, 0.05, 0.05, m, cx, y0 + 0.08, z, parent || scene);
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1) + 0.01; x += 2) box(0.07, h + 0.1, 0.07, m, x, y0 + h / 2, z, parent || scene);
}
function tree(x, z, s, opts) {
  opts = opts || {};
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s || 1); scene.add(g);
  const bark = mat(0x4a3a2a, { roughness: 1 });
  cyl(0.22, 0.34, 3.6, bark, 0, 1.8, 0, g, 8);
  for (let i = 0; i < 3; i++) { const b = cyl(0.08, 0.14, 2.2, bark, 0, 3.4, 0, g, 6); b.rotation.set(rand(-0.7, 0.7), 0, rand(-0.8, 0.8)); b.position.x += Math.sin(b.rotation.z) * -0.9; b.position.z += Math.sin(b.rotation.x) * 0.9; }
  const greens = opts.cols || [0x3f7a26, 0x4f8a2e, 0x34661f, 0x5a9a34];
  const crown = new THREE.Group(); g.add(crown);
  for (let i = 0; i < (opts.n || 9); i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.0, 1.7), 1), mat(pick(greens), { flatShading: true, roughness: 0.8 }));
    f.position.set(rand(-1.6, 1.6), rand(4.0, 5.8), rand(-1.6, 1.6)); f.scale.y = 0.8; f.castShadow = true; f.receiveShadow = true; crown.add(f);
  }
  flags.push({ obj: crown, amp: 0.012, sp: rand(0.8, 1.4), ph: rand(0, 6), axis: 'z' });
  return g;
}
function bush(x, z, s, parent) {
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.35, 0.6) * (s || 1), 1), mat(pick([0x3a6a24, 0x2e5a1e, 0x4a7a2a]), { flatShading: true }));
    b.position.set(x + rand(-0.4, 0.4), 0.35 * (s || 1), z + rand(-0.3, 0.3)); b.castShadow = true; (parent || scene).add(b);
  }
}
function oldCar(x, z, rot, color) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  const paint = mat(color, { metalness: 0.35, roughness: 0.55 });
  box(1.95, 0.62, 4.9, paint, 0, 0.66, 0, g);
  box(1.8, 0.58, 2.3, paint, 0, 1.25, -0.25, g);
  box(1.82, 0.42, 2.2, mat(0x10141a, { metalness: 0.6, roughness: 0.15 }), 0, 1.27, -0.25, g, false);
  for (const sz of [2.47, -2.47]) box(2.0, 0.14, 0.14, mat(0xbfbfbf, { metalness: 0.9, roughness: 0.25 }), 0, 0.46, sz, g);
  for (const sx of [-0.68, 0.68]) { box(0.32, 0.22, 0.05, mat(0xd8d0b0), sx, 0.72, 2.46, g, false); box(0.34, 0.16, 0.05, mat(0x5a0a0a), sx, 0.72, -2.46, g, false); }
  for (const wx of [-0.95, 0.95]) for (const wz of [-1.55, 1.55]) { const w = cyl(0.34, 0.34, 0.26, mat(0x111111), wx, 0.34, wz, g, 14); w.rotation.z = Math.PI / 2; }
  box(0.6, 0.02, 0.5, mat(0x5a3a1a, { roughness: 1 }), 0.4, 0.98, 1.6, g, false);
  const along = Math.abs(Math.sin(rot)) > 0.5;
  addObstacle(x, z, along ? 4.9 : 2.0, along ? 2.0 : 4.9);
  return g;
}
function tanqueNegro(x, y, z, parent) {
  cyl(0.62, 0.55, 1.15, mat(0x161616, { roughness: 0.5 }), x, y + 0.6, z, parent, 16);
  cyl(0.4, 0.62, 0.22, mat(0x161616, { roughness: 0.5 }), x, y + 1.27, z, parent, 16);
  box(1.4, 0.3, 1.4, texMat(brickTexC, 1, 0.3), x, y - 0.1, z, parent);
}
function varillas(x, y, z, parent) {
  const m = mat(0x5a3a22, { metalness: 0.6, roughness: 0.8 });
  for (const [dx, dz] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) { const v = box(0.025, rand(0.6, 1.0), 0.025, m, x + dx, y + 0.4, z + dz, parent); v.rotation.z = rand(-0.12, 0.12); }
}
function teamFlag(parent, x, y, z, color, text) {
  const t = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8d27a'; g.font = "bold 58px Impact, 'Arial Black', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4, 230);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85, 8, 1), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.9 }));
  m.position.set(x, y, z); parent.add(m);
  flags.push({ obj: m, amp: 0.08, sp: 2.2, ph: rand(0, 6), axis: 'y' });
}

// casa genérica del conurbano (frente hacia +z local). Devuelve la puerta en coordenadas de mundo.
const PAINTS = [0xe8dcc0, 0xd8e4d0, 0xf0c8b0, 0xc8d8e8, 0xd0ccc4, 0xe8e0a8, 0xbfd8c8];
function conurbanoHouse(x, z, rot, w, floors, o) {
  o = o || {};
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  const d = 8, H = floors * 2.9, fz = d / 2;
  const wall = o.brick ? texMat(huecoTex, w / 2.2, H / 2.2) : texMat(revoqueTex, w / 3, H / 3, { color: o.paint || pick(PAINTS) });
  box(w, H, d, wall, 0, H / 2, 0, g);
  box(w + 0.15, 0.32, d + 0.15, mat(0x7a766e), 0, H + 0.12, 0, g);
  box(w + 0.02, 0.4, 0.05, mat(0x5a5650), 0, 0.2, fz + 0.01, g, false);
  const warm = mat(0xffc477, { emissive: 0xffa040, emissiveIntensity: 1.1 }), cold = mat(0xbcd8ff, { emissive: 0x6a9aff, emissiveIntensity: 0.9 }), dark = mat(0x12161e, { roughness: 0.2, metalness: 0.5 });
  const dx = -w / 2 + 1.3;
  box(0.95, 2.05, 0.08, mat(o.door || pick([0x3a2a1a, 0x2a4a6a, 0x8a2a1a, 0x1a1a1a, 0x5a6a3a]), { metalness: 0.4 }), dx, 1.03, fz + 0.03, g, false);
  box(0.12, 0.12, 0.08, mat(0xfff0c0, { emissive: 0xffc070, emissiveIntensity: 2 }), dx + 0.75, 2.3, fz + 0.06, g, false);
  for (let f = 0; f < floors; f++) {
    for (let wx = (f === 0 ? dx + 2 : -w / 2 + 1.5); wx < w / 2 - 0.9; wx += 2.6) {
      const r = Math.random(), wm = o.lit ? warm : r < 0.45 ? warm : r < 0.55 ? cold : dark;
      box(1.3, 1.0, 0.06, wm, wx, f * 2.9 + 1.55, fz + 0.02, g, false);
      reja(wx - 0.7, wx + 0.7, fz + 0.12, 1.1, f * 2.9 + 1.0, g, o.rejaColor);
    }
  }
  if (o.front !== false) {
    box(w, 0.55, 0.22, o.brick ? texMat(brickTexC, w / 1.5, 0.3) : mat(0x9a968e), 0, 0.28, fz + 2.2, g);
    reja(-w / 2, w / 2, fz + 2.2, 1.2, 0.55, g, o.rejaColor);
  } else {
    // pilares de portón abierto
    for (const px of [-w / 2 + 0.2, w / 2 - 0.2]) box(0.4, 1.6, 0.4, texMat(brickTexC, 0.5, 1.2), px, 0.8, fz + 2.2, g);
  }
  if (o.flag) teamFlag(g, dx + 2.2, 2.35, fz + 0.15, o.flag[0], o.flag[1]);
  if (o.lit) { const L = new THREE.PointLight(0xffb878, 2.2, 13, 1.6); L.position.set(dx + 0.8, 3.0, fz + 3.6); g.add(L); glow(dx + 0.75, 2.3, fz + 0.2, 0xffb060, 1.2, g);
    for (const px of [-w / 2 + 0.2, w / 2 - 0.2]) { box(0.22, 0.22, 0.22, mat(0xfff0d0, { emissive: 0xffc070, emissiveIntensity: 2 }), px, 1.75, fz + 2.2, g, false); } }
  if (o.tank !== false && Math.random() < 0.7) tanqueNegro(rand(-w / 4, w / 4), H + 0.3, rand(-2, 1), g);
  if (o.unfinished) {
    const cm = mat(0x8a8780);
    for (const cx of [-w / 2 + 0.2, 0, w / 2 - 0.2]) { box(0.3, 1.4, 0.3, cm, cx, H + 0.7, fz - 0.2, g); varillas(cx, H + 1.4, fz - 0.2, g); }
    box(w * 0.5, 1.0, 0.25, texMat(huecoTex, w / 4, 0.5), -w / 4, H + 0.5, fz - 0.2, g);
  }
  g.updateMatrixWorld(true);
  return { group: g, door: new THREE.Vector3(dx, 0, fz + 0.4).applyMatrix4(g.matrixWorld), out: new THREE.Vector3(dx, 0, fz + 3.2).applyMatrix4(g.matrixWorld) };
}

// ============================================================
// ESCENA 1: LA CASA (lo de Rubén) — atardecer
// ============================================================
function buildHouse() {
  setScene(houseScene);
  scene.background = makeSky([[0, '#2a4a8a'], [0.45, '#6a8ac0'], [0.72, '#e8a070'], [1, '#ffcf8a']]);
  scene.fog = new THREE.Fog(0xd8a080, 35, 95);
  scene.add(new THREE.HemisphereLight(0xa8c0e8, 0x5a4a30, 0.7));
  const s = new THREE.DirectionalLight(0xffb070, 1.8);
  s.position.set(-16, 9, 14); s.castShadow = true; s.shadow.mapSize.set(2048, 2048);
  const c = s.shadow.camera; c.left = -22; c.right = 22; c.top = 18; c.bottom = -18; c.near = 1; c.far = 80; s.shadow.bias = -0.0005;
  scene.add(s); scene.add(s.target);

  plane(160, 160, texMat(grassTex, 40, 40), 0, 0, 0);
  plane(160, 7, texMat(dirtTex, 30, 1.4), 0, 0.012, 13.5);
  for (let i = 0; i < 6; i++) plane(rand(1.5, 4), rand(1, 3), texMat(asphaltTex, 1, 1), rand(-14, 14), 0.016, rand(11, 16), rand(0, 1));
  box(160, 0.06, 1.3, mat(0x3a3a24, { roughness: 0.4, metalness: 0.2 }), 0, -0.02, 9.2, scene, false).receiveShadow = true;
  plane(9, 2.4, texMat(dirtTex, 2, 0.6, { color: 0xb8a888 }), -5, 0.014, 5, 0.02);
  for (let x = -9.5; x < -1.5; x += 1.05) if (Math.random() < 0.8) box(0.98, 0.05, 0.98, texMat(concreteTex, 0.4, 0.4), x, 0.025, 1.3 + rand(-0.05, 0.05), scene).rotation.y = rand(-0.05, 0.05);
  box(3.4, 0.12, 10.4, texMat(concreteTex, 1.2, 3.5), 5.3, 0.06, 4.6, scene);

  // casita gris (izquierda)
  const rev = texMat(revoqueTex, 2.2, 1, { color: 0xb4b2aa });
  box(7.2, 3.0, 7, rev, -5.4, 1.5, -5.5, scene);
  box(7.4, 0.38, 7.2, mat(0x8a8780), -5.4, 3.18, -5.5, scene);
  box(7.22, 0.45, 0.05, mat(0x6a6860), -5.4, 0.22, -1.99, scene, false);
  box(1.0, 2.1, 0.1, mat(0xb02a1a, { metalness: 0.35, roughness: 0.5 }), -6.8, 1.05, -1.96, scene);
  for (let i = 0; i < 4; i++) box(0.9, 0.03, 0.02, mat(0x7a1a10), -6.8, 0.4 + i * 0.5, -1.9, scene, false);
  box(0.08, 0.08, 0.1, mat(0xd4b04a, { metalness: 0.8 }), -6.42, 1.05, -1.88, scene, false);
  box(1.4, 1.0, 0.06, mat(0xd8a0a0, { emissive: 0x5a2a20, emissiveIntensity: 0.4 }), -3.6, 1.6, -1.98, scene, false);
  box(1.55, 0.08, 0.2, mat(0x8a8780), -3.6, 1.06, -1.9, scene);
  reja(-4.35, -2.85, -1.88, 1.1, 1.05, scene, 0xe8e8e8);
  box(0.12, 0.12, 0.1, mat(0xfff0c0, { emissive: 0xffc070, emissiveIntensity: 2.5 }), -6.0, 2.45, -1.92, scene, false);
  const bulb = new THREE.PointLight(0xffb060, 0.9, 6, 2); bulb.position.set(-6.0, 2.3, -1.4); scene.add(bulb);
  cyl(0.18, 0.18, 0.55, mat(0xe8701a, { roughness: 0.5 }), -7.6, 0.28, -1.6, scene, 12);
  cyl(0.08, 0.08, 0.1, mat(0x888888, { metalness: 0.8 }), -7.6, 0.6, -1.6, scene, 8);
  const am = mat(0x9a9a9a, { metalness: 0.8, roughness: 0.4 });
  box(0.04, 2.2, 0.04, am, -7.8, 4.4, -6, scene);
  for (let i = 0; i < 4; i++) box(1.0 - i * 0.18, 0.03, 0.03, am, -7.8, 4.6 + i * 0.4, -6, scene);
  for (let x = -10; x <= -1.8; x += 2.05) cyl(0.05, 0.06, 1.3, mat(0x6a5038), x, 0.65, 0, scene, 6);
  const chain = new THREE.MeshStandardMaterial({ map: cloneTex(canvasTex(32, 32, (g) => { g.strokeStyle = '#b8bcc0'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(32, 32); g.moveTo(32, 0); g.lineTo(0, 32); g.stroke(); }), 30, 4), alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 });
  const cp = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 1.2), chain); cp.position.set(-5.9, 0.62, 0); scene.add(cp);
  for (let x = -9.5; x < -2; x += 1.3) bush(x + rand(-0.3, 0.3), -0.8 + rand(-0.4, 0.3), rand(0.9, 1.4));
  bush(-1.2, -1.2, 1.6);

  // casa de dos plantas de ladrillo hueco (derecha)
  const H2 = 6.0;
  box(7.8, H2, 8, texMat(huecoTex, 3.6, 2.8), 5.1, H2 / 2, -6.1, scene);
  const hor = mat(0x9a978e, { roughness: 0.95 });
  for (const cx of [1.2, 5.1, 9.0]) { box(0.32, H2 + 0.3, 0.34, hor, cx, (H2 + 0.3) / 2, -2.05, scene); varillas(cx, H2 + 0.3, -2.05, scene); }
  box(8.1, 0.32, 0.36, hor, 5.1, 3.0, -2.05, scene); box(8.1, 0.32, 0.36, hor, 5.1, H2 + 0.05, -2.05, scene);
  box(1.7, 1.25, 0.1, mat(0xf2f2f0), 6.6, 4.5, -2.06, scene);
  for (const [px, py] of [[-0.4, 0.27], [0.4, 0.27], [-0.4, -0.27], [0.4, -0.27]]) box(0.72, 0.48, 0.04, mat(0x2a3a4a, { metalness: 0.6, roughness: 0.1 }), 6.6 + px, 4.5 + py, -2.0, scene, false);
  box(1.9, 0.1, 0.25, hor, 6.6, 3.85, -1.95, scene);
  box(1.3, 1.0, 0.06, mat(0x1a2028, { roughness: 0.2, metalness: 0.5 }), 2.6, 1.6, -2.1, scene, false);
  reja(1.95, 3.25, -1.98, 1.1, 1.05, scene);
  box(1.0, 2.1, 0.08, mat(0x2a3a4a, { metalness: 0.5, roughness: 0.5 }), 8.0, 1.05, -2.08, scene);
  tanqueNegro(7.4, H2 + 0.35, -4.5, scene);
  teamFlag(scene, 4.0, 2.2, -1.95, '#1f3360', 'LA PAR');
  box(0.5, 1.7, 0.45, texMat(brickTexC, 0.6, 1.4), 0.6, 0.85, 0, scene);
  box(0.36, 0.5, 0.1, mat(0xb8b8b0, { metalness: 0.3 }), 0.6, 1.2, 0.27, scene);
  reja(0.9, 3.5, 0, 1.75, 0.05, scene); reja(3.6, 7.05, 0, 1.75, 0.05, scene); reja(7.15, 9.5, 0, 1.75, 0.05, scene);
  // moto desarmada (le falta el escape...)
  const mg = new THREE.Group(); mg.position.set(9.3, 0, 3.4); mg.rotation.y = 0.4; scene.add(mg);
  buildMoto(mg, 0xc0201a, false);
  // perro echado
  const dg = new THREE.Group(); dg.position.set(7.6, 0, 6.4); dg.rotation.y = -0.6; scene.add(dg);
  const fur = mat(0x8a6a3a, { roughness: 1 });
  sph(0.24, 0.17, 0.45, fur, 0, 0.18, 0, dg); sph(0.16, 0.15, 0.17, fur, 0.05, 0.3, 0.5, dg); sph(0.08, 0.07, 0.1, mat(0x6a4a2a), 0.05, 0.26, 0.66, dg);
  // canasto de basura
  cyl(0.04, 0.04, 1.3, mat(0x333333, { metalness: 0.6 }), -0.6, 0.65, 7.6, scene, 6);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), new THREE.MeshStandardMaterial({ map: cloneTex(barsTex, 6, 1), alphaTest: 0.5, side: THREE.DoubleSide, color: 0x333333, metalness: 0.6 }));
  bk.position.set(-0.6, 1.5, 7.6); scene.add(bk);
  // poste de madera con cables
  const wood = mat(0x5a4632, { roughness: 1 });
  cyl(0.13, 0.17, 8.5, wood, -11.5, 4.25, 7.8, scene, 8);
  box(1.8, 0.12, 0.12, wood, -11.5, 8.0, 7.8, scene);
  const pt = new THREE.Vector3(-11.5, 8.0, 7.8);
  wire(pt.clone().setX(-12.3), new THREE.Vector3(-8.5, 3.3, -3.5), 0.6);
  wire(pt.clone().setX(-10.7), new THREE.Vector3(0.6, 1.8, 0.2), 1.2);
  wire(pt.clone().setX(-12.3), new THREE.Vector3(30, 8, 7.8), 1.0);
  wire(pt.clone().setX(-10.7), new THREE.Vector3(30, 7.8, 8.0), 1.1);
  tree(-13.5, -7, 1.3); tree(12.5, -11, 1.2); tree(-0.4, -13, 1.1); tree(16, 2, 1.1); tree(-17, 4, 1.0);
  conurbanoHouse(-17.5, -6, 0, 7, 1, { front: false }); conurbanoHouse(15.5, -6.5, 0, 8, 1, { brick: true, unfinished: true, front: false });
  // mesa de plástico con los fierros
  const tg = new THREE.Group(); tg.position.set(-6.4, 0, 4.0); tg.rotation.y = 0.15; scene.add(tg);
  const plast = mat(0xf2f0ea, { roughness: 0.5 });
  box(1.6, 0.06, 0.95, plast, 0, 0.72, 0, tg);
  for (const [lx, lz] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) box(0.06, 0.72, 0.06, plast, lx, 0.36, lz, tg);
  return tg;
}
function buildMoto(g, color, withExhaust) {
  const tire = mat(0x111111, { roughness: 0.8 }), chrome = mat(0xc8ccd2, { metalness: 0.9, roughness: 0.22 });
  const wheels = [];
  for (const z of [-0.65, 0.65]) {
    const wg = new THREE.Group(); wg.position.set(0, 0.32, z); g.add(wg);
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.075, 10, 22), tire); w.rotation.y = Math.PI / 2; w.castShadow = true; wg.add(w);
    for (let i = 0; i < 4; i++) { const sp = box(0.02, 0.5, 0.02, chrome, 0, 0, 0, wg, false); sp.rotation.x = i * Math.PI / 4; }
    wheels.push(wg);
  }
  box(0.1, 0.1, 1.2, mat(0x2a2a2a, { metalness: 0.6 }), 0, 0.55, 0, g);
  sph(0.17, 0.13, 0.27, mat(color, { metalness: 0.4, roughness: 0.35 }), 0, 0.82, 0.2, g);
  sph(0.14, 0.06, 0.3, mat(0x111111, { roughness: 0.6 }), 0, 0.84, -0.28, g);
  box(0.62, 0.035, 0.035, chrome, 0, 1.06, 0.55, g);
  const fork = box(0.05, 0.6, 0.05, chrome, 0, 0.72, 0.6, g); fork.rotation.x = -0.3;
  sph(0.07, 0.07, 0.05, mat(0xfff4c8, { emissive: 0xffe9a0, emissiveIntensity: 0.6 }), 0, 0.9, 0.7, g);
  if (withExhaust) { const e = cyl(0.06, 0.07, 0.75, chrome, 0.16, 0.42, -0.35, g, 10); e.rotation.x = Math.PI / 2 - 0.15; }
  return wheels;
}

// ============================================================
// ESCENA 2: LA PLAZA — de noche (más grande, con calles jugables)
// ============================================================
function buildPlaza() {
  setScene(plazaScene);
  scene.background = makeSky([[0, '#050a26'], [0.42, '#10206a'], [0.7, '#28389a'], [0.86, '#7a4a7a'], [1, '#f07a3a']], true);
  scene.fog = new THREE.Fog(0x0e1634, 40, 125);
  scene.add(new THREE.HemisphereLight(0x3a4a90, 0x0a1206, 0.22));
  const s = new THREE.DirectionalLight(0x9ab0ff, 0.24);
  s.position.set(8, 30, 10); s.castShadow = true; s.shadow.mapSize.set(2048, 2048);
  const c = s.shadow.camera; c.left = -34; c.right = 34; c.top = 34; c.bottom = -34; c.near = 1; c.far = 100; s.shadow.bias = -0.0005;
  scene.add(s); scene.add(s.target);

  plane(240, 240, texMat(grassTex, 60, 60), 0, 0, 0);
  const dm = texMat(dirtTex, 3, 3);
  const circ = new THREE.Mesh(new THREE.CircleGeometry(6.8, 40), dm); circ.rotation.x = -Math.PI / 2; circ.position.y = 0.012; circ.receiveShadow = true; scene.add(circ);
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const L = Math.hypot(15.5, 19.5), dx = sx * 15.5 / L, dz = sz * 19.5 / L, len = L - 6.0, mid = 6.0 + len / 2;
    const p = plane(2.0, len, texMat(dirtTex, 0.8, len / 2.5), dx * mid, 0.01, dz * mid);
    p.rotation.order = 'YXZ'; p.rotation.set(-Math.PI / 2, Math.atan2(dx, dz), 0);
  }
  plane(2.0, 12, texMat(dirtTex, 0.8, 5), 0, 0.011, 13.5);
  for (const [x, z, r] of [[-10, 6.2, 2.2], [10, -8, 2.6], [-10, -9, 2.3], [9.5, 7, 2]]) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), dm); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.013, z); m.receiveShadow = true; scene.add(m); }
  // calles alrededor (ahora se puede pelear en ellas)
  const asp = (w, d, x, z) => plane(w, d, texMat(asphaltTex, w / 6, d / 6), x, 0.015, z);
  asp(8, 90, -21.5, 0); asp(8, 90, 21.5, 0); asp(51, 8, 0, -25.5); asp(51, 8, 0, 25.5);
  for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(rand(0.4, 1.0), 10), mat(0x1a1a1e, { roughness: 0.3, metalness: 0.4 })); p.rotation.x = -Math.PI / 2; p.position.set(pick([-1, 1]) * rand(18.5, 24.5), 0.02, rand(-28, 28)); scene.add(p); }
  const curb = mat(0xb8b4aa);
  box(34.4, 0.18, 0.25, curb, 0, 0.09, 21.4, scene); box(34.4, 0.18, 0.25, curb, 0, 0.09, -21.4, scene);
  box(0.25, 0.18, 42.8, curb, 17.3, 0.09, 0, scene); box(0.25, 0.18, 42.8, curb, -17.3, 0.09, 0, scene);
  for (let i = 0; i < 8; i++) box(0.12, 0.01, 2.4, mat(0xd8d0a8), (i % 2 ? 1 : -1) * 21.5, 0.02, -21 + i * 6, scene, false);

  // mesas de ajedrez con banquitos
  const BQ = [0xd8402a, 0xe8902a, 0x2a9a8a, 0x2a6ad0, 0x4aa040, 0xd8c02a];
  for (const [x, z] of [[-2.6, -1.4], [2.8, 0.6], [-0.2, 3.6]]) {
    cyl(0.22, 0.3, 0.72, texMat(concreteTex, 1, 1), x, 0.36, z, scene, 10);
    box(1.15, 0.12, 1.15, new THREE.MeshStandardMaterial({ map: checkerTex, roughness: 0.7 }), x, 0.78, z, scene);
    [[0.95, 0], [-0.95, 0], [0, 0.95], [0, -0.95]].forEach((o) => cyl(0.2, 0.22, 0.46, mat(pick(BQ), { roughness: 0.55 }), x + o[0], 0.23, z + o[1], scene, 12));
    addObstacle(x, z, 1.25, 1.25);
  }
  // caballitos de resorte (se mecen)
  for (const [x, z, col] of [[-10.6, 5.6, 0xf0c020], [-9.2, 7.4, 0xd8302a]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = 0.5; scene.add(g);
    for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 6, 14), mat(0x2a6ad0, { metalness: 0.6 })); t.rotation.x = Math.PI / 2; t.position.y = 0.1 + i * 0.09; g.add(t); }
    const top = new THREE.Group(); top.position.y = 0.5; g.add(top);
    sph(0.18, 0.16, 0.5, mat(col, { roughness: 0.45 }), 0, 0.18, 0, top); sph(0.14, 0.2, 0.15, mat(col, { roughness: 0.45 }), 0, 0.45, 0.4, top);
    box(0.5, 0.05, 0.05, mat(0x2a2a2a), 0, 0.55, 0.25, top); box(0.25, 0.08, 0.25, mat(0x2a2a2a), 0, 0.36, -0.15, top);
    flags.push({ obj: top, amp: 0.12, sp: 1.6, ph: rand(0, 6), axis: 'x' });
    addObstacle(x, z, 0.6, 0.6);
  }
  // hamacas (se balancean solas)
  { const g = new THREE.Group(); g.position.set(10, 0, -8); scene.add(g);
    const fm = mat(0x2a5ab0, { metalness: 0.5, roughness: 0.5 });
    for (const sx of [-2, 2]) for (const sz of [-0.8, 0.8]) { const l = cyl(0.06, 0.06, 2.75, fm, sx, 1.3, sz * 0.5, g, 8); l.rotation.x = -sz * 0.32; }
    const top = cyl(0.07, 0.07, 4.1, fm, 0, 2.6, 0, g, 8); top.rotation.z = Math.PI / 2;
    for (const sx of [-0.9, 0.9]) {
      const sw = new THREE.Group(); sw.position.set(sx, 2.6, 0); g.add(sw);
      for (const cz of [-0.18, 0.18]) box(0.02, 2.0, 0.02, mat(0x888888, { metalness: 0.8 }), 0, -1.0, cz, sw);
      box(0.5, 0.05, 0.42, mat(0x1a1a1a), 0, -2.0, 0, sw);
      flags.push({ obj: sw, amp: sx > 0 ? 0.32 : 0.12, sp: 1.9, ph: rand(0, 6), axis: 'x' });
    }
    addObstacle(8, -8, 0.4, 1.4); addObstacle(12, -8, 0.4, 1.4); }
  // tobogán
  { const g = new THREE.Group(); g.position.set(-10, 0, -9); scene.add(g);
    const r = mat(0xd8302a, { roughness: 0.5 }), y = mat(0xf0c020, { roughness: 0.5 }), mm = mat(0x6a6a6a, { metalness: 0.6 });
    for (const sx of [-0.4, 0.4]) for (const sz of [-1.6, -1.0]) box(0.08, 1.9, 0.08, mm, sx, 0.95, sz, g);
    box(0.95, 0.1, 0.8, y, 0, 1.9, -1.3, g);
    for (let i = 0; i < 6; i++) box(0.8, 0.05, 0.08, mm, 0, 0.3 + i * 0.3, -1.75, g);
    const sl = box(0.7, 0.06, 2.6, r, 0, 1.0, 0.1, g); sl.rotation.x = 0.68;
    for (const sx of [-0.37, 0.37]) { const b = box(0.05, 0.18, 2.6, r, sx, 1.08, 0.1, g); b.rotation.x = 0.68; }
    addObstacle(-10, -10.3, 1.0, 1.0); }
  // sube y baja
  { const g = new THREE.Group(); g.position.set(9.5, 0, 7.2); g.rotation.y = 0.3; scene.add(g);
    box(0.3, 0.45, 0.3, mat(0x2a5ab0, { metalness: 0.4 }), 0, 0.22, 0, g);
    const p = box(3.2, 0.08, 0.32, mat(0xe8902a), 0, 0.48, 0, g); p.rotation.z = 0.22;
    flags.push({ obj: p, amp: 0.2, sp: 0.9, ph: 0, axis: 'z', base: 0 });
    addObstacle(9.5, 7.2, 0.5, 0.5); }
  function banco(x, z, rot) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
    const cm = texMat(concreteTex, 0.4, 0.4), wm = mat(0x3a6a3a, { roughness: 0.8 });
    for (const sx of [-0.8, 0.8]) box(0.15, 0.45, 0.5, cm, sx, 0.22, 0, g);
    for (let i = 0; i < 3; i++) box(1.9, 0.06, 0.14, wm, 0, 0.48, -0.18 + i * 0.17, g);
    for (let i = 0; i < 2; i++) box(1.9, 0.12, 0.05, wm, 0, 0.7 + i * 0.18, -0.27, g);
    const side = Math.abs(Math.sin(rot)) > 0.5;
    addObstacle(x, z, side ? 0.6 : 2.0, side ? 2.0 : 0.6);
  }
  banco(13.6, 1.5, -Math.PI / 2); banco(-13.6, -2, Math.PI / 2); banco(5, -16.8, 0); banco(-6, -16.8, 0);
  [[-13, -5.5, 1.1], [13.5, -13.5, 1.2], [-12.8, 14, 1.15], [13, 9.5, 1.0], [-5.5, -17.6, 1.2], [9, -17.4, 1.0], [-27.5, -12, 1.3], [28, 14, 1.2], [-28, 20, 1.1], [27.5, -20, 1.1]].forEach(([x, z, s]) => { tree(x, z, s); addObstacle(x, z, 0.8, 0.8); });
  [[-6.5, -6], [7, -2.5], [-7.5, 9.8], [7.5, 12.5], [0, -13.5]].forEach(([x, z], i) => ledPole(x, z, i === 3));
  // borde de cubiertas pintadas
  {
    const pts = [];
    for (let x = -15.5; x <= 15.5; x += 0.95) { if (Math.abs(Math.abs(x) - 15.5) > 1.6 && Math.abs(x) > 1.4) pts.push([x, 19.5, 0]); if (Math.abs(Math.abs(x) - 15.5) > 1.6 && Math.abs(x - 14) > 1.4) pts.push([x, -19.5, 0]); }
    for (let z = -19.5; z <= 19.5; z += 0.95) { if (Math.abs(Math.abs(z) - 19.5) > 1.6 && Math.abs(z) > 1.3) { pts.push([15.5, z, 1]); pts.push([-15.5, z, 1]); } }
    const im = new THREE.InstancedMesh(new THREE.TorusGeometry(0.38, 0.15, 8, 16), new THREE.MeshStandardMaterial({ roughness: 0.7 }), pts.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), TC = [0xf2f2ee, 0xf0c020, 0x2a6ad0, 0xd8302a, 0xf2f2ee, 0x3aa04a];
    pts.forEach((p, i) => {
      q.setFromEuler(new THREE.Euler(0, p[2] ? Math.PI / 2 : 0, 0));
      m4.compose(new THREE.Vector3(p[0], 0.16, p[1]), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4);
      im.setColorAt(i, LINEAR ? col.setHex(TC[i % TC.length]).convertSRGBToLinear() : col.setHex(TC[i % TC.length]));
    });
    im.castShadow = true; im.receiveShadow = true; scene.add(im);
  }
  // arco de fútbol oxidado + paredón con mural
  { const rm = mat(0x6a4a32, { metalness: 0.5, roughness: 0.8 });
    box(0.1, 2.2, 0.1, rm, -2.6, 1.1, -20.4, scene); box(0.1, 2.2, 0.1, rm, 2.6, 1.1, -20.4, scene); box(5.3, 0.1, 0.1, rm, 0, 2.2, -20.4, scene);
    addObstacle(-2.6, -20.4, 0.2, 0.2); addObstacle(2.6, -20.4, 0.2, 0.2);
    plane(6, 2, texMat(dirtTex, 2, 1), 0, 0.014, -19.2); }
  const muralTex = canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#d8d0c0'; g.fillRect(0, 0, w, h);
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#2a7ad0'); sky.addColorStop(1, '#8ad0f0'); g.fillStyle = sky; g.fillRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#f0c020'; g.beginPath(); g.arc(860, 70, 44, 0, 7); g.fill();
    g.fillStyle = '#3aa04a'; g.beginPath(); g.moveTo(10, h - 10); for (let x = 10; x <= w - 10; x += 40) g.lineTo(x, h - 60 - Math.sin(x * 0.02) * 20); g.lineTo(w - 10, h - 10); g.fill();
    for (let i = 0; i < 9; i++) { const x = 60 + i * 110; g.fillStyle = pick(['#d8302a', '#f0902a', '#7a3ab0', '#2a3a9a', '#f2f2ee']); g.fillRect(x, h - 120, 24, 60); g.beginPath(); g.arc(x + 12, h - 132, 14, 0, 7); g.fill(); }
    g.font = "64px Impact, 'Arial Black', sans-serif"; g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = '#111'; g.strokeText('LA PLAZA ES DEL BARRIO', w / 2, 92);
    g.fillStyle = '#ffffff'; g.fillText('LA PLAZA ES DEL BARRIO', w / 2, 92);
    g.font = "40px Impact, sans-serif"; g.save(); g.translate(150, 190); g.rotate(-0.15); g.lineWidth = 8; g.strokeText('IMPAR GIL', 0, 0); g.fillStyle = '#ff3a6a'; g.fillText('IMPAR GIL', 0, 0); g.restore();
    g.save(); g.translate(880, 200); g.rotate(0.1); g.strokeText('LA PAR MANDA', 0, 0); g.fillStyle = '#5ad1ff'; g.fillText('LA PAR MANDA', 0, 0); g.restore();
    speckle(g, w, h, 3000, 0.15, 0.06);
  });
  box(24, 2.6, 0.3, texMat(revoqueTex, 6, 1, { color: 0xc8c0b0 }), 0, 1.3, -22.2, scene);
  const mp = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.3), new THREE.MeshStandardMaterial({ map: muralTex, roughness: 0.85 })); mp.position.set(0, 1.3, -22.04); scene.add(mp);
  addObstacle(0, -22.2, 24, 0.4);

  // casas del barrio (con las casas de cada banda y de los vecinos)
  for (let x = -30; x <= 30; x += 9.5) {
    if (x === 17.5) { const h = conurbanoHouse(x, -33.5, 0, 8, 2, { brick: true, flag: ['#3a0a06', 'IMPAR'], front: false, door: 0x1a1a1a, lit: true }); SPOTS.impar = h; continue; }
    if (x === -11) { const h = conurbanoHouse(x, -33.5, 0, 8, 1, { paint: 0xf0c8d8, front: false, door: 0x6a8a3a }); SPOTS.chusma = h; continue; }
    conurbanoHouse(x + rand(-0.5, 0.5), -33.5, 0, rand(7.5, 9), Math.random() < 0.35 ? 2 : 1, { brick: Math.random() < 0.4, unfinished: Math.random() < 0.3 });
  }
  for (let x = -30; x <= 30; x += 9.5) {
    if (x === -1.5) { const h = conurbanoHouse(x, 34.5, Math.PI, 8, 2, { brick: true, flag: ['#1f3360', 'LA PAR'], front: false, door: 0x2a3a4a, lit: true, unfinished: true }); SPOTS.par = h; continue; }
    conurbanoHouse(x, 34.5, Math.PI, rand(7.5, 9), Math.random() < 0.3 ? 2 : 1, { brick: Math.random() < 0.4 });
  }
  for (let z = -22; z <= 22; z += 9.5) {
    if (z === 6.5) SPOTS.cumbia = conurbanoHouse(-34, z, Math.PI / 2, 8.5, 2, { paint: 0xf2d24a, lit: true, front: false, door: 0x2a6ad0 });
    else conurbanoHouse(-34, z, Math.PI / 2, rand(7.5, 9), Math.random() < 0.3 ? 2 : 1, { brick: Math.random() < 0.4, unfinished: Math.random() < 0.3 });
    if (z === -3) SPOTS.pizzaSlot = new THREE.Vector3(34, 0, z);
    else conurbanoHouse(34, z, -Math.PI / 2, rand(7.5, 9), Math.random() < 0.3 ? 2 : 1, { brick: Math.random() < 0.4 });
  }
  oldCar(-23.2, -6, 0, 0x8a2a1a); oldCar(23.2, 4, Math.PI, 0xd8c8a0); oldCar(-8, -27.0, Math.PI / 2, 0x2a4a6a); oldCar(12, 27.2, -Math.PI / 2, 0x4a5a3a);
  // moto tirada en la calle (la rueda sigue girando)
  { const g = new THREE.Group(); g.position.set(21.0, 0.3, -12.5); g.rotation.set(0, 0.7, Math.PI / 2 - 0.18); scene.add(g);
    const wheels = buildMoto(g, 0x1a5ad0, true);
    spinners.push({ obj: wheels[0], sp: 6, decay: false });
    sph(0.18, 0.2, 0.18, mat(0xd8d8d8, { roughness: 0.3, metalness: 0.2 }), 22.2, 0.18, -13.6, scene); // casco tirado
    addObstacle(21.0, -12.5, 1.6, 1.6); SPOTS.moto = new THREE.Vector3(21.0, 0, -12.5); }
  // luces de sodio en las esquinas
  for (const [x, z, L] of [[-18.5, -22.5, true], [18.5, -22.5, true], [-18.5, 22.5, true], [18.5, 22.5, false]]) {
    cyl(0.1, 0.14, 7, mat(0x3a3a3a, { metalness: 0.5 }), x, 3.5, z, scene, 8);
    box(1.2, 0.1, 0.1, mat(0x3a3a3a), x - Math.sign(x) * 0.6, 7, z, scene);
    box(0.5, 0.14, 0.3, mat(0xffc080, { emissive: 0xff9030, emissiveIntensity: 2.5 }), x - Math.sign(x) * 1.1, 6.92, z, scene, false);
    glow(x - Math.sign(x) * 1.1, 6.8, z, 0xff9a40, 3.2);
    if (L) { const p = new THREE.PointLight(0xff9a40, 1.8, 18, 1.7); p.position.set(x - Math.sign(x) * 1.1, 6.5, z); scene.add(p); }
    addObstacle(x, z, 0.35, 0.35);
  }
  // sillita del abuelo con el mate
  { const g = new THREE.Group(); g.position.set(-26.6, 0, 3.5); g.rotation.y = Math.PI / 2; scene.add(g);
    const pl = mat(0xf2f0ea, { roughness: 0.5 });
    box(0.5, 0.05, 0.5, pl, 0, 0.45, 0, g); box(0.5, 0.55, 0.05, pl, 0, 0.75, -0.24, g);
    for (const [lx, lz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) box(0.05, 0.45, 0.05, pl, lx, 0.22, lz, g);
    cyl(0.09, 0.08, 0.3, mat(0xc8c8c0, { metalness: 0.7, roughness: 0.3 }), 0.35, 0.15, 0.1, g, 10); // termo
    addObstacle(-26.6, 3.5, 0.7, 0.7); SPOTS.abuelo = new THREE.Vector3(-26.6, 0, 3.5); }
  for (let i = 0; i < 34; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.15, 0.35), rand(0.2, 0.4)), mat(pick([0xe8e4d8, 0xd8402a, 0x2a6ad0, 0xf0f0f0]), { side: THREE.DoubleSide }));
    p.rotation.x = -Math.PI / 2; p.rotation.z = rand(0, 6); p.position.set(rand(-24, 24), 0.03, rand(-26, 26)); scene.add(p);
  }
}
function ledPole(x, z, flicker) {
  const m = mat(0x8a8e94, { metalness: 0.6, roughness: 0.45 });
  cyl(0.09, 0.15, 8, m, x, 4, z, scene, 8);
  box(0.9, 0.08, 0.08, m, x + 0.4, 7.95, z, scene);
  const head = box(0.75, 0.12, 0.38, mat(0xffffff, { emissive: 0xe8f0ff, emissiveIntensity: 3 }), x + 0.8, 7.9, z, scene, false);
  if (flicker) head.material = head.material.clone();
  const gl = glow(x + 0.8, 7.75, z, 0xdde8ff, 4.2);
  const L = new THREE.PointLight(0xe6eeff, 2.6, 17, 2); L.position.set(x + 0.8, 7.5, z); scene.add(L);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshBasicMaterial({ map: glowTex, color: 0x6a7aa0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(x + 0.8, 0.05, z); scene.add(pool);
  if (flicker) flickers.push({ light: L, base: 2.6, mat: head.material, glow: gl, pool, t: 0 });
  for (let i = 0; i < 6; i++) {
    const mo = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    mo.scale.setScalar(0.035); scene.add(mo);
    moths.push({ m: mo, c: new THREE.Vector3(x + 0.8, 7.4, z), r: rand(0.3, 0.9), sp: rand(3, 7) * (Math.random() < 0.5 ? -1 : 1), ph: rand(0, 6), h: rand(-0.4, 0.3) });
  }
  addObstacle(x, z, 0.35, 0.35);
}
let worldT = 0;
function updateWorld(dt) {
  worldT += dt;
  for (const f of flickers) {
    f.t += dt;
    const on = (f.t % 6) < 4.8 || Math.random() < 0.4;
    f.light.intensity = on ? f.base : 0.2; f.mat.emissiveIntensity = on ? 3 : 0.2; f.glow.visible = on; f.pool.visible = on;
  }
  for (const m of moths) {
    const a = worldT * m.sp + m.ph;
    m.m.position.set(m.c.x + Math.cos(a) * m.r, m.c.y + m.h + Math.sin(a * 1.7) * 0.2, m.c.z + Math.sin(a) * m.r);
  }
  for (const f of flags) {
    const v = Math.sin(worldT * f.sp + f.ph) * f.amp + (f.base || 0);
    if (f.axis === 'x') f.obj.rotation.x = v; else if (f.axis === 'z') f.obj.rotation.z = v; else f.obj.rotation.y = v;
  }
  for (const s of spinners) s.obj.rotation.x += s.sp * dt;
  updateSuburbio(dt);
}
