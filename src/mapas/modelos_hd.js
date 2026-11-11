// ============================================================
// MODELOS MEJORADOS (a partir de fotos de referencia): camioneta AMAROKI, el 128, moto enduro,
// teléfono público con capucha y el BAR EL GOMERO con gente. Formas curvas (extrusiones con bisel),
// pintura con barniz, llantas con rayos, cubiertas con dibujo. Sin logos de marcas reales.
// La Amaroki nueva reemplaza a la vieja en todos lados (calle y Trofi).
// ============================================================
function hdPaint(color, o) { return new THREE.MeshPhysicalMaterial(Object.assign({ color: new THREE.Color(color).convertSRGBToLinear(), metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 }, o || {})); }
const HD = {
  chrome: () => trofiMat(0xd8dde2, { metalness: 0.95, roughness: 0.12 }),
  black: () => trofiMat(0x121315, { roughness: 0.55 }),
  plastic: () => trofiMat(0x1c1d20, { roughness: 0.85 }),
  glass: () => new THREE.MeshPhysicalMaterial({ color: 0x0e1820, metalness: 0.2, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.88 }),
  tread: null,
};
HD.tread = canvasTex(256, 32, (g, w, h) => { g.fillStyle = '#141414'; g.fillRect(0, 0, w, h); g.fillStyle = '#262626'; for (let x = 0; x < w; x += 8) { g.fillRect(x, 2, 4, 12); g.fillRect(x + 4, 18, 4, 12); } });
// perfil lateral extruido (puntos x,y) con bisel: da formas redondeadas
function hdExtrude(points, depth, m, bevel) {
  const sh = new THREE.Shape(); points.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])); sh.closePath();
  const b = bevel === undefined ? 0.06 : bevel;
  const geo = new THREE.ExtrudeGeometry(sh, { depth: depth - b * 2, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 8 });
  geo.translate(0, 0, -(depth - b * 2) / 2);
  const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; return o;
}
// rueda: cubierta con dibujo, llanta de N rayos, tapa central
function hdWheel(r, w, spokes, rimCol, style) {
  const g = new THREE.Group();
  const tm = new THREE.MeshStandardMaterial({ map: HD.tread, roughness: 0.95 });
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 28, 1, true), tm); tire.rotation.x = Math.PI / 2; g.add(tire);
  const side = new THREE.Mesh(new THREE.RingGeometry(r * 0.66, r, 28), trofiMat(0x161616, { roughness: 0.9 }));
  for (const s of [-1, 1]) { const sd = side.clone(); sd.position.z = s * w / 2; sd.rotation.y = s > 0 ? 0 : Math.PI; g.add(sd); }
  const rim = trofiMat(rimCol || 0xb8c0c8, { metalness: 0.9, roughness: 0.22 });
  for (const s of [-1, 1]) {
    const face = new THREE.Group(); face.position.z = s * (w / 2 - 0.01); face.rotation.y = s > 0 ? 0 : Math.PI; g.add(face);
    if (style === 'taza') { const cap = new THREE.Mesh(new THREE.CircleGeometry(r * 0.64, 24), trofiMat(0xd8dde2, { metalness: 0.95, roughness: 0.15 })); cap.position.z = 0.005; face.add(cap); const c2 = new THREE.Mesh(new THREE.CircleGeometry(r * 0.2, 16), trofiMat(0x2a2c30)); c2.position.z = 0.01; face.add(c2); continue; }
    const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.56, r * 0.66, 28), rim); face.add(ring);
    for (let i = 0; i < spokes; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r * 0.5, 0.03), rim); const a = i / spokes * Math.PI * 2; sp.position.set(Math.sin(a) * r * 0.33, Math.cos(a) * r * 0.33, 0.01); sp.rotation.z = -a; face.add(sp); }
    const hub = new THREE.Mesh(new THREE.CircleGeometry(r * 0.13, 16), trofiMat(0x2a2c30, { metalness: 0.6 })); hub.position.z = 0.02; face.add(hub);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// ---------- AMAROKI (camioneta doble cabina) ----------
function hdAmaroki(color) {
  const g = new THREE.Group(); g.name = 'AmarokiHD';
  const paint = hdPaint(color === undefined ? 0xc4c7c6 : color, { roughness: 0.45, metalness: 0.25, clearcoatRoughness: 0.32 }), black = HD.plastic(), chrome = HD.chrome(), glass = HD.glass();
  const W = 1.95;
  // carrocería: capó largo, parabrisas inclinado, techo, caja
  // perfil con curvas (trompa redondeada, capó que sube, techo abovedado) y bisel grande para que no quede "cuadrada"
  const nose = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; nose.push([2.5 + Math.cos(a) * 0.14, 0.98 + Math.sin(a) * 0.2]); }
  g.add(hdExtrude([[-2.62, 0.55], [2.58, 0.55], [2.64, 0.8], ...nose, [2.2, 1.21], [1.6, 1.25], [1.05, 1.28], [-0.98, 1.25], [-2.62, 1.25]], W, paint, 0.12));
  const roof = []; for (let i = 0; i <= 8; i++) { const u = i / 8; roof.push([0.28 - u * 1.2, 1.84 + Math.sin(u * Math.PI) * 0.05]); }
  const cab = hdExtrude([[-1.0, 1.2], [1.05, 1.24], [0.5, 1.68], ...roof, [-0.94, 1.8]], W * 0.9, paint, 0.1); g.add(cab);
  const gl = hdExtrude([[-0.9, 1.3], [0.98, 1.3], [0.27, 1.8], [-0.86, 1.82]], W * 0.935, glass, 0.01); g.add(gl);
  for (const z of [-1, 1]) { const p = box(0.07, 0.56, 0.04, paint, 0.05, 1.56, z * W * 0.468, g); p.rotation.z = 0.05; }   // parante B
  // caja abierta: piso, laterales, compuerta
  box(1.55, 0.05, W * 0.86, black, -1.82, 1.2, 0, g, false);
  for (const z of [-1, 1]) box(1.62, 0.36, 0.06, paint, -1.82, 1.42, z * W * 0.46, g);
  box(0.06, 0.36, W * 0.92, paint, -2.6, 1.42, 0, g);
  // guardabarros ensanchados de plástico negro
  for (const x of [-1.73, 1.62]) for (const z of [-1, 1]) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.075, 8, 22, Math.PI), black); a.position.set(x, 0.55, z * (W / 2 + 0.03)); g.add(a); }
  // frente (por fuera del bisel de la carrocería, que llega a x = 2.73): parrilla con barras cromadas y emblema redondo,
  // faros angulosos con tira LED, paragolpes con antinieblas
  const F = 2.84;   // por fuera del bisel (más grande ahora)
  box(0.05, 0.36, 1.02, trofiMat(0x08090a, { roughness: 0.35 }), F, 0.96, 0, g, false);
  for (const y of [0.87, 0.96, 1.05]) box(0.04, 0.035, 1.0, chrome, F + 0.03, y, 0, g, false);
  const em = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 24), chrome); em.position.set(F + 0.06, 0.96, 0); em.rotation.y = Math.PI / 2; g.add(em);
  const emIn = new THREE.Mesh(new THREE.CircleGeometry(0.095, 20), trofiMat(0x1a3a7a, { metalness: 0.6, roughness: 0.3 })); emIn.position.set(F + 0.055, 0.96, 0); emIn.rotation.y = Math.PI / 2; g.add(emIn);
  const tails = [];
  for (const z of [-1, 1]) {
    const hl = box(0.06, 0.18, 0.4, trofiMat(0x0a0b0e, { roughness: 0.12, metalness: 0.5 }), F - 0.02, 1.02, z * 0.74, g, false); hl.rotation.x = z * 0.1;
    box(0.02, 0.025, 0.34, new THREE.MeshBasicMaterial({ color: 0xdfe8ff }), F + 0.02, 1.08, z * 0.74, g, false);          // tira LED
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), new THREE.MeshBasicMaterial({ color: 0xc8d0dc })); lens.position.set(F + 0.025, 1.0, z * 0.8); lens.rotation.y = Math.PI / 2; g.add(lens);
    const fog = new THREE.Mesh(new THREE.CircleGeometry(0.05, 14), new THREE.MeshBasicMaterial({ color: 0xbfc4cc })); fog.position.set(F + 0.06, 0.66, z * 0.66); fog.rotation.y = Math.PI / 2; g.add(fog);
    box(0.05, 0.4, 0.13, new THREE.MeshBasicMaterial({ color: 0xc81a10 }), -2.72, 1.2, z * 0.78, g, false);             // faros traseros
    const blink = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), new THREE.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    blink.rotation.y = -Math.PI / 2; blink.position.set(-2.75, 1.33, z * 0.78); g.add(blink); tails.push(blink);
    box(0.18, 0.13, 0.08, black, 0.92, 1.36, z * (W / 2 + 0.08), g);
    for (const x of [0.55, -0.35]) box(0.16, 0.035, 0.03, black, x, 1.18, z * (W / 2 + 0.07), g, false);
    box(1.9, 0.05, 0.16, black, -0.05, 0.42, z * (W / 2 + 0.06), g);
  }
  box(0.2, 0.26, 1.85, black, 2.78, 0.62, 0, g);    // paragolpes inferior
  box(0.12, 0.2, 1.9, black, -2.7, 0.62, 0, g);
  const lbl = trofiLabel('AMAROKI', 0.9, 0.14, 'rgba(0,0,0,0)', '#1a1a1a'); lbl.position.set(-2.75, 1.38, 0); lbl.rotation.y = -Math.PI / 2; g.add(lbl);
  for (const x of [-1.73, 1.62]) for (const z of [-1, 1]) { const w = hdWheel(0.44, 0.28, 6, 0xb8c0c8); w.position.set(x, 0.44, z * (W / 2 - 0.06)); g.add(w); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData = { L: 5.3, W: 2.0, tails };
  return g;
}
// ---------- EL 128 (sedán clásico, celeste) ----------
function hd128(color) {
  const g = new THREE.Group(); g.name = 'Sedan128';
  const paint = hdPaint(color === undefined ? 0x8ccac4 : color, { metalness: 0.15, roughness: 0.35, clearcoat: 0.6 }), chrome = HD.chrome(), glass = HD.glass(), W = 1.6;
  g.add(hdExtrude([[-1.92, 0.36], [1.92, 0.36], [1.95, 0.62], [1.88, 0.78], [0.78, 0.82], [-1.05, 0.82], [-1.9, 0.8], [-1.95, 0.6]], W, paint, 0.05));
  g.add(hdExtrude([[-1.0, 0.8], [0.78, 0.8], [0.4, 1.32], [-0.75, 1.34]], W * 0.9, paint, 0.03));
  g.add(hdExtrude([[-0.95, 0.84], [0.72, 0.84], [0.38, 1.28], [-0.72, 1.3]], W * 0.915, glass, 0.005));
  for (const z of [-1, 1]) { box(0.05, 0.46, 0.03, paint, -0.18, 1.06, z * W * 0.457, g); box(1.75, 0.02, 0.02, chrome, -0.12, 0.84, z * W * 0.462, g, false); }
  // frente: dos ópticas redondas por lado, parrilla de barras, paragolpes cromados con tacos
  box(0.04, 0.2, 0.9, trofiMat(0x0c0d0e), 1.94, 0.62, 0, g, false);
  for (const y of [0.56, 0.62, 0.68]) box(0.03, 0.015, 0.88, chrome, 1.965, y, 0, g, false);
  for (const z of [-1, 1]) for (const zz of [0.52, 0.68]) {
    const rimL = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.015, 8, 20), chrome); rimL.position.set(1.95, 0.63, z * zz); rimL.rotation.y = Math.PI / 2; g.add(rimL);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.07, 18), new THREE.MeshBasicMaterial({ color: 0xfff0c8 })); lens.position.set(1.955, 0.63, z * zz); lens.rotation.y = Math.PI / 2; g.add(lens);
  }
  for (const x of [1.98, -1.98]) { box(0.08, 0.09, W * 1.02, chrome, x, 0.42, 0, g); for (const z of [-0.45, 0.45]) box(0.1, 0.18, 0.06, chrome, x, 0.47, z, g, false); }
  for (const z of [-1, 1]) box(0.04, 0.12, 0.22, new THREE.MeshBasicMaterial({ color: 0xc81a10 }), -1.96, 0.64, z * 0.6, g, false);
  for (const x of [-1.22, 1.2]) for (const z of [-1, 1]) { const w = hdWheel(0.3, 0.17, 0, null, 'taza'); w.position.set(x, 0.3, z * (W / 2 - 0.05)); g.add(w); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData = { L: 4.0, W: 1.65, tails: [] };
  return g;
}
// ---------- MOTO ENDURO (blanca y roja) ----------
function hdEnduro() {
  const g = new THREE.Group(); g.name = 'Enduro';
  const white = hdPaint(0xf4f4f2, { metalness: 0.05, roughness: 0.3 }), red = hdPaint(0xc8201a, { metalness: 0.05, roughness: 0.3 }), black = HD.black(), alu = trofiMat(0xc8ccd0, { metalness: 0.9, roughness: 0.25 });
  const wheel = (r, x) => {
    const w = new THREE.Group(); w.position.set(x, r, 0); g.add(w);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(r - 0.05, 0.055, 10, 28), trofiMat(0x141414, { roughness: 0.95 })); w.add(tire);
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, k = box(0.04, 0.03, 0.12, trofiMat(0x181818), Math.cos(a) * (r + 0.005), Math.sin(a) * (r + 0.005), 0, w, false); k.rotation.z = a; }   // tacos
    const rimR = new THREE.Mesh(new THREE.TorusGeometry(r - 0.11, 0.012, 6, 28), alu); w.add(rimR);
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, sp = cyl(0.004, 0.004, r - 0.13, alu, Math.cos(a) * (r - 0.11) / 2, Math.sin(a) * (r - 0.11) / 2, (i % 2 ? 0.02 : -0.02), w, 4); sp.rotation.z = a - Math.PI / 2; }
    cyl(0.045, 0.045, 0.12, alu, 0, 0, 0, w, 10).rotation.x = Math.PI / 2;
    return w;
  };
  wheel(0.38, 0.72); wheel(0.36, -0.7);
  // horquilla, chasis, tanque y cachas, asiento largo, guardabarros alto, escape
  for (const z of [-0.07, 0.07]) { const f = cyl(0.025, 0.025, 0.85, trofiMat(0xc8a040, { metalness: 0.8, roughness: 0.3 }), 0.6, 0.78, z, g, 8); f.rotation.z = 0.42; }
  const fr = cyl(0.03, 0.03, 1.1, black, 0.05, 0.72, 0, g, 8); fr.rotation.z = 1.25;
  const sw = cyl(0.025, 0.025, 0.75, alu, -0.35, 0.48, 0.06, g, 8); sw.rotation.z = 1.4;     // basculante
  g.add(Object.assign(hdExtrude([[-0.15, 0.85], [0.42, 0.88], [0.5, 1.08], [0.1, 1.12], [-0.15, 1.0]], 0.3, white, 0.04), {}));   // tanque
  const sh = hdExtrude([[0.0, 0.8], [0.42, 0.86], [0.46, 1.0], [0.2, 1.02]], 0.36, red, 0.02); g.add(sh);                         // cachas rojas
  g.add(hdExtrude([[-0.85, 1.0], [0.15, 1.05], [0.1, 1.12], [-0.85, 1.1]], 0.24, trofiMat(0x111111, { roughness: 0.7 }), 0.03));  // asiento
  g.add(hdExtrude([[-1.15, 1.02], [-0.6, 0.95], [-0.6, 1.0], [-1.18, 1.1]], 0.2, red, 0.02));                                     // cola
  const ff = hdExtrude([[0.55, 1.05], [1.05, 0.98], [1.08, 1.02], [0.55, 1.12]], 0.16, white, 0.02); g.add(ff);                  // guardabarros delantero alto
  box(0.12, 0.2, 0.2, white, 0.78, 1.14, 0, g); const hl = new THREE.Mesh(new THREE.CircleGeometry(0.05, 14), new THREE.MeshBasicMaterial({ color: 0xfff4d0 })); hl.position.set(0.85, 1.14, 0); hl.rotation.y = Math.PI / 2; g.add(hl);
  box(0.06, 0.04, 0.72, black, 0.72, 1.32, 0, g); for (const z of [-0.36, 0.36]) box(0.12, 0.06, 0.05, trofiMat(0xc8201a), 0.78, 1.32, z, g, false);   // manubrio y cubremanos
  const ex = cyl(0.045, 0.05, 0.6, alu, -0.65, 0.82, -0.17, g, 12); ex.rotation.z = 1.35;                                          // escape
  box(0.34, 0.28, 0.22, trofiMat(0x3a3c40, { metalness: 0.7, roughness: 0.35 }), 0.12, 0.55, 0, g);                                // motor
  const decal = trofiLabel('250 · XR', 0.32, 0.08, 'rgba(0,0,0,0)', '#c8201a'); decal.position.set(-0.55, 1.05, 0.105); g.add(decal);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// ---------- TELÉFONO PÚBLICO con capucha azul ----------
function hdTelefono(sc, x, z, face) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face; sc.add(g);
  const blue = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0x1e4ab8).convertSRGBToLinear(), roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide });
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.25, 24, 1, true, Math.PI / 2, Math.PI), blue); hood.position.set(0, 1.55, 0); g.add(hood);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 8, Math.PI, Math.PI, 0, Math.PI / 2), blue); top.position.set(0, 2.17, 0); top.scale.y = 0.35; g.add(top);
  box(0.04, 1.25, 0.04, blue, -0.45, 1.55, 0.0, g); box(0.04, 1.25, 0.04, blue, 0.45, 1.55, 0.0, g);   // bordes de la capucha
  cyl(0.05, 0.06, 0.95, trofiMat(0x6a6e72, { metalness: 0.7 }), 0, 0.47, -0.05, g, 10);
  // aparato de acero
  const steel = trofiMat(0xb8bcc0, { metalness: 0.85, roughness: 0.3 });
  box(0.34, 0.5, 0.1, steel, 0.02, 1.58, 0.06, g);
  box(0.16, 0.06, 0.012, new THREE.MeshBasicMaterial({ color: 0x8adc7a }), 0.08, 1.76, 0.115, g, false);    // pantallita verde
  for (let i = 0; i < 12; i++) box(0.035, 0.03, 0.015, trofiMat(0x2a2c30, { metalness: 0.5 }), 0.03 + (i % 3) * 0.045, 1.67 - Math.floor(i / 3) * 0.04, 0.115, g, false);
  box(0.11, 0.012, 0.012, trofiMat(0x111111), 0.08, 1.46, 0.115, g, false);                                // ranura de tarjeta
  for (const y of [1.42, 1.36]) box(0.24, 0.04, 0.008, trofiMat(0xe8e8e0), 0.03, y, 0.112, g, false);      // instrucciones
  const hs = box(0.06, 0.28, 0.07, trofiMat(0x0e0e0e, { roughness: 0.4 }), -0.12, 1.58, 0.13, g); hs.rotation.z = 0.08;   // tubo
  const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push(new THREE.Vector3(-0.12 - Math.sin(t * Math.PI) * 0.06 + Math.cos(t * 40) * 0.012, 1.44 - t * 0.42 + Math.sin(t * Math.PI) * -0.05, 0.14 + Math.sin(t * 40) * 0.012)); }
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.006, 5), trofiMat(0x9aa0a6, { metalness: 0.8, roughness: 0.3 })); g.add(cord);   // cable blindado
  const lbl = trofiLabel('TELÉFONO', 0.5, 0.1, '#1e4ab8', '#ffffff'); lbl.position.set(0, 2.08, 0.43); g.add(lbl);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  addObstacle(x, z, 0.9, 0.8);
  return g;
}
// ---------- BAR EL GOMERO: vidriera, tele con fútbol, toldo, lamparitas, mesas con gente, mozo ----------
const BAR = { people: [], mozo: null, tv: null, t: 0 };
function hdFiletTex(text) {   // cartel con letras "fileteadas": colores, sombra y volutas
  return canvasTex(1024, 220, (c, w, h) => {
    c.fillStyle = '#121212'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#e8b830'; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20);
    const scroll = (x, s) => { c.save(); c.translate(x, h / 2); c.scale(s, 1); c.strokeStyle = '#d83a2a'; c.lineWidth = 7; c.beginPath(); for (let a = 0; a < 9.5; a += 0.15) { const r = 8 + a * 6; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8); } c.stroke(); c.strokeStyle = '#2a9a5a'; c.lineWidth = 4; c.beginPath(); c.moveTo(-60, 50); c.quadraticCurveTo(0, -70, 60, 40); c.stroke(); c.restore(); };
    scroll(95, 1); scroll(w - 95, -1);
    c.font = "italic bold 112px Georgia, serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#5a1a0a'; c.fillText(text, w / 2 + 6, h / 2 + 8);
    const gr = c.createLinearGradient(0, 40, 0, 180); gr.addColorStop(0, '#fff2a8'); gr.addColorStop(1, '#e8a020'); c.fillStyle = gr; c.fillText(text, w / 2, h / 2);
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeText(text, w / 2, h / 2);
  });
}
function hdSeated(color) {   // persona sentada (pierna doblada) con botella
  const p = person37(color); p.legs.forEach(l => { l.rotation.x = -1.45; }); p.g.position.y = -0.36;
  const bottle = cyl(0.03, 0.035, 0.24, trofiMat(0x3a2410, { roughness: 0.15 }), 0.0, -0.5, 0.06, p.arms[1], 8);
  p.arms[1].rotation.x = -0.9; return p;
}
function hdBar(sc, x0) {
  const z = -5.85, face = 1;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.1), new THREE.MeshBasicMaterial({ map: hdFiletTex('Bar El Gomero') })); sign.position.set(x0, 3.25, z + 0.06); sc.add(sign);
  trofiHalo(sc, x0, 3.25, z + 0.6, 0xffd090, 5, 0.12);
  // vidriera iluminada con la tele pasando fútbol
  box(4.4, 1.9, 0.06, new THREE.MeshStandardMaterial({ color: 0x1a1410, emissive: 0x4a3018, emissiveIntensity: 0.9, roughness: 0.6 }), x0 - 0.3, 1.45, z + 0.04, sc, false);   // vidriera: interior cálido y oscuro
  for (const y of [1.1, 1.55]) { box(2.2, 0.03, 0.05, trofiMat(0x6a4a2a), x0 - 1.2, y, z + 0.06, sc, false); for (let i = 0; i < 9; i++) cyl(0.035, 0.035, 0.24, trofiMat(pick([0x2a5a2a, 0x6a2a1a, 0xc8a040, 0x3a2410]), { roughness: 0.15 }), x0 - 2.1 + i * 0.22, y + 0.13, z + 0.07, sc, 6); }
  const tvTex = canvasTex(256, 144, (c, w, h) => { c.fillStyle = '#2a8a3a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f4f4f4'; c.lineWidth = 3; c.strokeRect(10, 10, w - 20, h - 20); c.beginPath(); c.moveTo(w / 2, 10); c.lineTo(w / 2, h - 10); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, 22, 0, 7); c.stroke(); for (let i = 0; i < 10; i++) { c.fillStyle = i < 5 ? '#6ab8e8' : '#d83a2a'; c.fillRect(30 + Math.random() * (w - 60), 20 + Math.random() * (h - 40), 5, 8); } c.fillStyle = '#111'; c.fillRect(0, 0, 70, 18); c.fillStyle = '#fff'; c.font = '12px Arial'; c.fillText('1 - 1  78\'', 6, 13); });
  const tv = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.56), new THREE.MeshBasicMaterial({ map: tvTex })); tv.position.set(x0 + 0.9, 2.0, z + 0.08); sc.add(tv); BAR.tv = tv;
  const rj = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.0), new THREE.MeshBasicMaterial({ map: barsTex, transparent: true, color: 0x1a1a1a, opacity: 0.5 })); rj.position.set(x0 - 0.3, 1.45, z + 0.1); sc.add(rj);
  box(0.95, 2.3, 0.08, trofiMat(0x5a3a22), x0 + 2.25, 1.15, z + 0.05, sc);
  const l = new THREE.PointLight(0xffd8a0, 0.45, 7, 1.8); l.position.set(x0, 2.0, z + 1.9); sc.add(l);
  // toldo a rayas
  const awn = canvasTex(256, 64, (c, w, h) => { for (let x = 0; x < w; x += 32) { c.fillStyle = (x / 32) % 2 ? '#f4f0e0' : '#2a6a3a'; c.fillRect(x, 0, 32, h); } });
  const t = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.6), new THREE.MeshStandardMaterial({ map: awn, side: THREE.DoubleSide, roughness: 0.8 })); t.position.set(x0, 2.75, z + 0.75); t.rotation.x = -Math.PI / 2 + 0.45; sc.add(t);
  // guirnalda de lamparitas
  for (let i = 0; i <= 14; i++) { const u = i / 14, bx = x0 - 2.8 + u * 5.6, by = 2.45 - Math.sin(u * Math.PI) * 0.25; const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe8a0 })); b.position.set(bx, by, z + 1.5); sc.add(b); if (i % 3 === 0) trofiHalo(sc, bx, by, z + 1.5, 0xffd080, 0.5, 0.3); }
  // mesas en la vereda con gente
  const tops = [0xd83a2a, 0x2a4a8a, 0xf0f0e8, 0x3a3a3a, 0x6a2a8a, 0x2a8a6a, 0xe8c030];
  for (const [tx, n] of [[x0 - 1.7, 3], [x0 + 0.4, 2], [x0 + 2.4, 3]]) {
    const tz = -4.55;
    cyl(0.4, 0.4, 0.04, trofiMat(0xe8e4d8, { roughness: 0.5 }), tx, 0.74, tz, sc, 16); cyl(0.03, 0.03, 0.72, trofiMat(0x2a2a2a, { metalness: 0.6 }), tx, 0.37, tz, sc, 6);
    for (let k = 0; k < 2; k++) cyl(0.035, 0.04, 0.24, trofiMat(0x3a2410, { roughness: 0.12 }), tx - 0.12 + k * 0.2, 0.88, tz + 0.05, sc, 8);   // cervezas
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + 0.6, px = tx + Math.cos(a) * 0.72, pz = tz + Math.sin(a) * 0.5;
      box(0.42, 0.04, 0.42, trofiMat(0x8a5a2a), px, 0.45, pz, sc); box(0.42, 0.45, 0.04, trofiMat(0x8a5a2a), px - Math.cos(a) * 0.2, 0.7, pz - Math.sin(a) * 0.2, sc);
      const p = hdSeated(pick(tops)); p.g.position.set(px, -0.36 + 0.05, pz); p.g.rotation.y = Math.atan2(tx - px, tz - pz); sc.add(p.g);
      BAR.people.push({ p, ph: rand(0, 6), y0: p.g.rotation.y });
    }
    addObstacle(tx, tz, 1.9, 1.3);
  }
  // el mozo con la bandeja
  const mozo = person37(0xf4f4f4); sc.add(mozo.g); box(0.4, 0.02, 0.3, trofiMat(0xb8bcc0, { metalness: 0.8 }), 0, -0.12, 0.22, mozo.arms[1]); mozo.arms[1].rotation.x = -1.4;
  BAR.mozo = { p: mozo, x0, t: 0 };
}
// ---------- reemplazos: la Amaroki nueva en todos lados; moto y teléfonos nuevos en la calle ----------
pickup36 = function (color) { return hdAmaroki(color === 0xbac1c5 ? 0xc4c7c6 : color); };
vidaTelefono = function (sc, x, z, face) { return hdTelefono(sc, x, z, face); };
{
  const baseMoto = vidaMoto;
  vidaMoto = function (sc) {
    baseMoto(sc); const m = VIDA.moto; if (!m) return;
    const keep = m.g.children.filter(o => o.isGroup && o.children.some(c => c.geometry && c.geometry.type === 'SphereGeometry' && c.position.y > 1.5));   // los dos con casco
    m.g.children.slice().forEach(o => { if (!keep.includes(o)) m.g.remove(o); });
    const bike = hdEnduro(); m.g.add(bike); keep.forEach((r, i) => { r.position.set(i === 0 ? 0.05 : -0.42, 0.33, 0); });
  };
  const baseBuild = buildCalle;
  buildCalle = function () {
    const fresh = !CALLE.built; baseBuild(); if (!fresh) return;
    const sc = CALLE.scene, prev = scene; scene = sc; const o0 = obstacles.length; obstacles.push(...CALLE.obst);
    const c128 = hd128(); c128.position.set(4.5, 0, -2.5); sc.add(c128); addObstacle(4.5, -2.5, 4.2, 1.9);
    const c128b = hd128(0xe8e0c8); c128b.position.set(-31, 0, 2.5); c128b.rotation.y = Math.PI; sc.add(c128b);
    hdBar(sc, 1.5);
    CALLE.obst = obstacles.splice(o0); scene = prev;
  };
  const baseWorld = updateWorld;
  updateWorld = function (dt) {
    baseWorld(dt); if (scene !== CALLE.scene) return;
    BAR.t += dt;
    for (const q of BAR.people) { const s = Math.sin(BAR.t * 0.8 + q.ph); q.p.arms[1].rotation.x = -0.9 + Math.max(0, s - 0.6) * -1.8; q.p.g.rotation.y = q.y0 + Math.sin(BAR.t * 0.35 + q.ph) * 0.25; q.p.arms[0].rotation.x = Math.sin(BAR.t * 2 + q.ph) * 0.15; }
    const mz = BAR.mozo; if (mz) { mz.t += dt; const u = (Math.sin(mz.t * 0.35) + 1) / 2, x = mz.x0 - 2.6 + u * 5.2; const px = mz.p.g.position.x; mz.p.g.position.set(x, 0, -3.75); mz.p.g.rotation.y = x > px ? Math.PI / 2 : -Math.PI / 2; mz.p.legs.forEach((l, i) => { l.rotation.x = Math.sin(mz.t * 7 + i * Math.PI) * 0.4 * Math.abs(Math.cos(mz.t * 0.35)); }); }
    if (BAR.tv && Math.random() < 0.05) BAR.tv.material.color.setScalar(0.85 + Math.random() * 0.15);
  };
}
window.GV_HD = { hdAmaroki, hd128, hdEnduro, BAR };
