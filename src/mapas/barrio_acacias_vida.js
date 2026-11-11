// ============================================================
// BARRIO LAS ACACIAS (2): manzanas SO y SE, la vida del barrio, el armado y el enganche con el modo historia
// ============================================================
// ---------- manzana SO: casas, escuelita, potrero, los fisuras ----------
function baCasas(sc) {
  // sobre la calle (fachadas mirando a -z en z = +6.5)
  baFacade(sc, -11, BA_F, Math.PI, 7, 4.4, { num: 1150, candle: true, jardin: false });                   // casa de Tito
  BA.tito = { x: -11, z: 5.2 };
  baFacade(sc, -18.5, BA_F, Math.PI, 8, 6.2, { num: 1158 });
  // la escuelita: dos pisos, guardapolvos dibujados, mástil con bandera
  const esc = baFacade(sc, -32, BA_F, Math.PI, 18, 7.2, { chapa: false, color: 0xf0ece0, tanque: false, shop: { sign: 'ESCUELA Nº 12 "LAS ACACIAS"', bg: '#f0ece0', fg: '#1a3a7a', font: 44 } });
  const mural = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.6), new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(720, 128, (c, w, h) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { const x = 40 + i * 78; c.fillStyle = '#fff'; c.fillRect(x - 16, 50, 32, 50); c.strokeStyle = '#999'; c.strokeRect(x - 16, 50, 32, 50); c.fillStyle = pick(['#e8b080', '#c68b62', '#8a5a3a']); c.beginPath(); c.arc(x, 36, 14, 0, 7); c.fill(); c.fillStyle = '#222'; c.fillRect(x - 14, 22, 28, 8); } c.fillStyle = '#d83a2a'; c.font = "bold 22px Arial"; c.fillText('¡BIENVENIDOS CHICOS!', 250, 120); }) }));
  mural.position.set(0, 4.6, 0.08); esc.add(mural);
  cyl(0.06, 0.08, 7, trofiMat(0xd8d8d8, { metalness: 0.7 }), 8, 3.5, 1.0, esc, 8);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0, 6, 3), new THREE.MeshStandardMaterial({ map: baTex('flag', baFlagTex), side: THREE.DoubleSide })); fl.position.set(8.8, 6.3, 1.0); esc.add(fl); BA.flag2 = fl;
  baFacade(sc, -44, BA_F, Math.PI, 5, 4.0, {});
  // sobre el pasaje (fachadas mirando a +x en x = -6.5)
  baFacade(sc, -BA_F, 12, Math.PI / 2, 7, 4.2, {});
  baFacade(sc, -BA_F, 20, Math.PI / 2, 8, 6.0, {});
  const rub = baFacade(sc, -BA_F, 28.5, Math.PI / 2, 8, 4.6, { num: 742, color: 0x3a6ab8, chapa: true, candle: true, doorX: -2, jardin: false });   // LO DE RUBÉN, Pasaje 14 Nº 742
  const lr = trofiLabel('LO DE RUBÉN', 2.2, 0.36, '#f4efe0', '#c0300f'); lr.position.set(-2, 3.2, 0.09); rub.add(lr);
  BA.ruben = { x: -4.6, z: 26.5 };
  // el potrero: tierra, arcos, alambrado
  const px = -26, pz = 36;
  const dirt = new THREE.Mesh(new THREE.PlaneGeometry(38, 19), texMat(concreteTex, 8, 4, { color: 0x7a6440, roughness: 1 })); dirt.rotation.x = -Math.PI / 2; dirt.position.set(px, 0.01, pz); sc.add(dirt);
  for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(px + s * 16, 0, pz); sc.add(g); const w = trofiMat(0xe8e8e8, { metalness: 0.4 }); cyl(0.06, 0.06, 2, w, 0, 1, -2, g, 6); cyl(0.06, 0.06, 2, w, 0, 1, 2, g, 6); box(0.08, 0.08, 4, w, 0, 2, 0, g); }
  const fence = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#9aa0a6'; c.lineWidth = 2; for (let i = -64; i < 128; i += 10) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 64, 64); c.stroke(); c.beginPath(); c.moveTo(i + 64, 0); c.lineTo(i, 64); c.stroke(); } });
  const fm = new THREE.MeshBasicMaterial({ map: fence, transparent: true, side: THREE.DoubleSide }); fence.wrapS = fence.wrapT = THREE.RepeatWrapping; fence.repeat.set(16, 1.2);
  const fz = new THREE.Mesh(new THREE.PlaneGeometry(38, 2.4), fm); fz.position.set(px, 1.2, 26.4); sc.add(fz);
  const fx = new THREE.Mesh(new THREE.PlaneGeometry(19, 2.4), fm.clone()); fx.material.map = fence.clone(); fx.material.map.repeat.set(8, 1.2); fx.material.map.needsUpdate = true; fx.position.set(-7.0, 1.2, pz); fx.rotation.y = Math.PI / 2; sc.add(fx);
  const ball = sph(0.12, 0.12, 0.12, trofiMat(0xf4f4f4), px + 3, 0.12, pz - 2, sc); BA.ball = ball;
  // los fisuras con el tacho de 200 litros prendido fuego, en la vereda del potrero
  BA.fireSpot = { x: -5.4, z: 38.5 };
}
function baFire(sc, x, z) {
  const tacho = cyl(0.3, 0.3, 0.88, texMat(CHAPA_TEX, 2, 1, { color: 0x4a3a2a, roughness: 0.7, metalness: 0.4 }), x, 0.44, z, sc, 16);
  const flames = [];
  for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.16 + Math.random() * 0.08, 0.55 + Math.random() * 0.3, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff8a20 : 0xffc040, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); f.position.set(x + rand(-0.12, 0.12), 1.05, z + rand(-0.12, 0.12)); sc.add(f); flames.push(f); }
  const glow = trofiHalo(sc, x, 1.2, z, 0xff8020, 3.5, 0.6);
  const l = new THREE.PointLight(0xff7a20, 2.2, 13, 1.7); l.position.set(x, 1.6, z); l.castShadow = false; sc.add(l);
  const embers = []; for (let i = 0; i < 14; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffa040 })); e.userData.ph = Math.random(); sc.add(e); embers.push(e); }
  addObstacle(x, z, 0.7, 0.7);
  BA.fire = { x, z, flames, glow, l, embers };
}
// ---------- manzana SE: estación de servicio, gomería, remisería, garaje, mural ----------
function baServicios(sc) {
  // estación de servicio en la esquina (playa abierta entre x 6,5..22 y z 6,5..22)
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), texMat(concreteTex, 6, 6, { color: 0x8a8a86 })); pad.rotation.x = -Math.PI / 2; pad.position.set(14.5, 0.012, 14.5); pad.receiveShadow = true; sc.add(pad);
  const blue = trofiMat(0x1a4aa8, { roughness: 0.5 }), white = trofiMat(0xf2f2ee, { roughness: 0.5 });
  box(11, 0.6, 8, white, 13, 5.2, 12.5, sc); box(11.1, 0.25, 8.1, blue, 13, 4.9, 12.5, sc);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), new THREE.MeshBasicMaterial({ color: 0xfff6e0 })); under.rotation.x = Math.PI / 2; under.position.set(13, 4.75, 12.5); sc.add(under);
  for (const [x, z] of [[8.5, 9.5], [17.5, 9.5], [8.5, 15.5], [17.5, 15.5]]) { box(0.35, 4.8, 0.35, white, x, 2.4, z, sc); addObstacle(x, z, 0.4, 0.4); }
  for (const x of [10.5, 15.5]) { const p = new THREE.Group(); p.position.set(x, 0, 12.5); sc.add(p); box(0.9, 1.6, 0.5, white, 0, 0.8, 0, p); box(0.92, 0.35, 0.52, blue, 0, 1.55, 0, p); box(0.5, 0.25, 0.02, new THREE.MeshBasicMaterial({ color: 0x9aff8a }), 0, 1.2, 0.26, p, false); for (const s of [-1, 1]) cyl(0.04, 0.04, 0.5, trofiMat(0x111111), s * 0.5, 1.0, 0.1, p, 6); addObstacle(x, 12.5, 1.0, 0.6); }
  for (let i = 0; i < 2; i++) { const l = new THREE.PointLight(0xfff4e0, 1.6, 14, 1.6); l.position.set(10 + i * 6, 4.4, 12.5); sc.add(l); BA.lights.push(l); }
  const shop = baFacade(sc, 14.5, 22, Math.PI, 14, 4.2, { chapa: false, color: 0xf2f2ee, tanque: false, shop: { sign: 'PETRO-SUR · FULL 24 HS', bg: '#1a4aa8', fg: '#ffffff', lit: true, light: 0xfff4e0, glow: 0x8a9aaa, sub: 'TENEMOS GENERADOR' } });
  const totem = new THREE.Group(); totem.position.set(21, 0, 7.5); sc.add(totem); box(0.5, 5.5, 0.5, white, 0, 2.75, 0, totem); const pr = trofiLabel('NAFTA SÚPER · GNC · CAFÉ', 1.8, 1.1, '#1a4aa8', '#ffffff'); pr.position.set(0, 5.0, 0.26); totem.add(pr); addObstacle(21, 7.5, 0.6, 0.6);
  const gen = box(1.4, 1.0, 0.8, trofiMat(0xc8a020, { roughness: 0.5 }), 20.5, 0.5, 20.5, sc); addObstacle(20.5, 20.5, 1.5, 0.9); BA.gen = gen;   // el generador (hace ruido)
  // sobre la calle (fachadas mirando a -z en z = +6.5), después de la estación
  baFacade(sc, 26.5, BA_F, Math.PI, 9, 4.4, { shop: { sign: 'GOMERÍA 24 HS', bg: '#e8c020', fg: '#1a1a1a', lit: true, light: 0xfff0d0, sub: 'SE ARREGLAN CUBIERTAS · GOMAS USADAS', wall: 0x3a3a3a } });
  for (let k = 0; k < 4; k++) for (let i = 0; i < 5 - k % 2; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.13, 8, 18), trofiMat(0x141414, { roughness: 0.95 })); t.rotation.x = Math.PI / 2; t.position.set(23 + k * 1.1 + (k > 1 ? 4 : 0), 0.13 + i * 0.26, 4.9); sc.add(t); }
  addObstacle(24.5, 4.9, 3.2, 0.9); addObstacle(29.5, 4.9, 3.2, 0.9);
  baFacade(sc, 37, BA_F, Math.PI, 10, 4.6, { shop: { sign: 'REMISES LAS ACACIAS', bg: '#18372b', fg: '#ffffff', lit: true, light: 0xfff0d0, sub: 'TEL 4-555-1234 · VAMOS A CUALQUIER LADO', wall: 0xd8d8d0 } });
  baFacade(sc, 44.5, BA_F, Math.PI, 5, 4.0, {});
  // la parada del remís (cartel en la vereda)
  cyl(0.05, 0.05, 2.6, trofiMat(0x6a6c70, { metalness: 0.6 }), 34, 1.3, 4.5, sc, 8); const ps = trofiLabel('PARADA REMÍS', 1.1, 0.5, '#18372b', '#fff'); ps.position.set(34, 2.5, 4.53); ps.rotation.y = Math.PI; sc.add(ps);
  const ps2 = ps.clone(); ps2.rotation.y = 0; ps2.position.z = 4.47; sc.add(ps2); addObstacle(34, 4.5, 0.3, 0.3);
  BA.parada = { x: 34, z: 3.0 };
  // sobre el pasaje (fachadas mirando a -x en x = +6.5), al sur de la estación
  // el garaje de Cacho: abierto (paredes, techo y portón levantado), con la camioneta adentro
  { const g = new THREE.Group(); g.position.set(BA_F, 0, 28); g.rotation.y = -Math.PI / 2; sc.add(g);
    const wall = texMat(CHAPA_TEX, 4, 2, { color: 0x6a3a8a, roughness: 0.6, metalness: 0.25 }), inside = trofiMat(0x2a2628, { roughness: 0.9 });
    box(9, 0.3, 9, wall, 0, 4.45, -4.5, g); box(0.3, 4.6, 9, wall, -4.35, 2.3, -4.5, g); box(0.3, 4.6, 9, wall, 4.35, 2.3, -4.5, g); box(9, 4.6, 0.3, inside, 0, 2.3, -8.85, g);
    box(9, 1.1, 0.35, wall, 0, 4.05, 0, g); for (let i = 0; i < 8; i++) box(6.2, 0.03, 0.06, trofiMat(0x4a4e52), 0, 3.6 - i * 0.07, -0.25, g, false);   // portón levantado
    const sg = trofiLabel('GARAJE · NO ESTACIONAR', 4.2, 0.4, '#f2f0e8', '#c0300f'); sg.position.set(0, 4.15, 0.2); g.add(sg);
    const lamp = new THREE.PointLight(0xffe0a0, 0.8, 9, 1.8); lamp.position.set(0, 3.8, -3); g.add(lamp); BA.lights.push(lamp);   // lámpara a batería
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.6), trofiMat(0x3a3a3c, { roughness: 0.9 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.015, -4.4); g.add(fl);
    for (let i = 0; i < 3; i++) box(0.5, 0.4, 0.35, trofiMat(pick([0xc0302a, 0x2a6ad0, 0x3a3a3a])), 3.4, 0.2 + i * 0.4, -7.6, g); }   // cajones de herramientas
  const cam = hdAmaroki(0x2a3a5a); cam.position.set(BA_F + 4.4, 0, 28); cam.rotation.y = Math.PI; cam.scale.setScalar(0.92); sc.add(cam);   // la camioneta de Cacho, adentro del garaje abierto
  for (let i = 0; i < 4; i++) { const c = cyl(0.02, 0.012, 3.4, trofiMat(0x3a2a1a), BA_F + 5.4 + i * 0.1, 1.45, 28 + rand(-0.3, 0.3), sc, 5); c.rotation.z = Math.PI / 2 - 0.08; }   // las cañas
  BA.cacho = { x: 4.8, z: 26 };
  const mur = baFacade(sc, BA_F, 38, -Math.PI / 2, 12, 5.0, { chapa: false, color: 0xe8e0d0, tanque: false, shop: { sign: '¿VISTE A ESTE PANCHO?', bg: '#f4f0e0', fg: '#c0300f' } });
  for (let i = 0; i < 4; i++) { const af = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshStandardMaterial({ roughness: 0.85, map: baTex('pancho', () => canvasTex(128, 180, (c, w, h) => { c.fillStyle = '#f4f0e0'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = "bold 18px Arial"; c.textAlign = 'center'; c.fillText('¿LO VISTE?', w / 2, 24); c.fillStyle = '#d8a050'; c.beginPath(); c.ellipse(w / 2, 90, 46, 18, 0, 0, 7); c.fill(); c.fillStyle = '#b8442a'; c.beginPath(); c.ellipse(w / 2, 88, 52, 9, 0, 0, 7); c.fill(); c.fillStyle = '#e8c020'; c.fillRect(30, 84, 68, 3); c.fillStyle = '#111'; c.font = "14px Arial"; c.fillText('MANDA MENSAJES', w / 2, 140); c.fillText('DESDE UN NÚMERO', w / 2, 158); c.fillText('DESCONOCIDO', w / 2, 174); })) }));
    af.position.set(-4 + i * 2.2, 1.6, 0.08); af.rotation.z = rand(-0.08, 0.08); mur.add(af); }
  baFacade(sc, BA_F, 44.5, -Math.PI / 2, 3, 4.0, {});
}
// ---------- vías, barrera y el tren ----------
function baVias(sc) {
  const z = -49.5;
  for (const dz of [-0.7, 0.7]) box(140, 0.12, 0.1, trofiMat(0x8a8a86, { metalness: 0.8 }), 0, 0.1, z + dz, sc);
  for (let x = -70; x < 70; x += 0.9) box(0.25, 0.08, 2.2, trofiMat(0x3a2a1a), x, 0.04, z, sc, false);
  const bar = new THREE.Group(); bar.position.set(4.6, 0, -47.2); sc.add(bar); box(0.3, 1.2, 0.3, trofiMat(0xe8e8e8), 0, 0.6, 0, bar);
  const arm = new THREE.Group(); arm.position.set(0, 1.1, 0); bar.add(arm);
  const stripes = canvasTex(128, 16, (c, w, h) => { for (let x = 0; x < w; x += 16) { c.fillStyle = (x / 16) % 2 ? '#ffffff' : '#d82a1a'; c.fillRect(x, 0, 16, h); } });
  const a = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.12, 0.08), new THREE.MeshStandardMaterial({ map: stripes })); a.position.x = -4.25; arm.add(a); arm.rotation.z = -1.35;
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0x441010 })); bell.position.set(0, 1.5, 0.2); bar.add(bell);
  BA.barrier = { arm, bell, down: 0 };
  const train = new THREE.Group(); sc.add(train); const winT = canvasTex(128, 32, (c, w, h) => { c.fillStyle = '#c8ccd0'; c.fillRect(0, 0, w, h); for (let x = 6; x < w; x += 20) { c.fillStyle = '#fff2c8'; c.fillRect(x, 8, 12, 12); } });
  for (let i = 0; i < 4; i++) { const car = new THREE.Mesh(new THREE.BoxGeometry(18, 3.2, 2.9), new THREE.MeshStandardMaterial({ map: winT, roughness: 0.5, emissive: 0x2a2a20, emissiveIntensity: 0.6 })); car.position.set(i * 18.6, 2.0, 0); train.add(car); box(18, 0.3, 2.95, trofiMat(0x1a4a8a), i * 18.6, 1.0, 0, train); }
  const head = trofiHalo(train, -9.2, 1.8, 0, 0xfff4d0, 4, 0.8);
  train.position.set(-200, 0, z); BA.train = { g: train, x: -200, v: 0 };
}
// ---------- autos estacionados (la Amaroki, el 128...) ----------
function baAutos(sc) {
  const put = (car, x, z, r) => { car.position.set(x, 0, z); car.rotation.y = r; sc.add(car); const L = car.userData.L || 4.4, W = car.userData.W || 1.8; const along = Math.abs(Math.sin(r)) < 0.5; addObstacle(x, z, along ? L : W, along ? W : L); };
  put(hdAmaroki(), -22, -3.0, 0); put(hd128(), -40, 3.0, Math.PI); put(hd128(0xe8e0c8), 30, -3.0, 0);
  put(trofiCar(0x8a1a1a, ''), -14, 3.0, Math.PI); put(trofiCar(0x2a2a30, 'suv'), 40, 3.0, Math.PI);
  put(trofiCar(0xd8d0b8, ''), -3.0, -20, -Math.PI / 2); put(trofiCar(0x2a4a8a, ''), 3.0, 35, Math.PI / 2);
  const rem = trofiCar(0xe8e8e6, ''); service36(rem, 'remis'); put(rem, 40, -3.0, 0);
}
// ---------- vida: los fisuras, los pibes en moto y bici haciendo willy, perros, el bar ----------
function baGente(sc) {
  const f = BA.fireSpot; baFire(sc, f.x, f.z);
  const ropa = [{ top: 'remera', topColor: 0x3a3a34, pants: 0x2a2a30, skin: 0xb07e5a, hair: 'short', hairColor: 0x111111, cap: 0x1a1a1a }, { top: 'remera', topColor: 0x5a2a2a, pants: 0x1e1e24, skin: 0x8a5a3a, hair: 'rulos', hairColor: 0x111111 }, { top: 'remera', topColor: 0x2a3a5a, pants: 0x3a3428, skin: 0xd9a27a, hair: 'short', hairColor: 0x3a2414, beard: true }];
  ropa.forEach((cfg, i) => {
    const a = i / 3 * Math.PI * 2 + 0.4, b = vmxBody(cfg, 10 + i, 'Fisura'); b.pos.set(f.x + Math.cos(a) * 0.95, 0, f.z + Math.sin(a) * 0.95); b.facing = Math.atan2(f.x - b.pos.x, f.z - b.pos.z);
    b.poseFn = (P) => { P.aL = P.aR = -1.0 + Math.sin(BA.t * 1.3 + i) * 0.08; P.eL = P.eR = -0.8; P.aLz = -0.25; P.aRz = 0.25; P.tX = 0.12; P.hX = 0.1; if (i === 2 && Math.sin(BA.t * 0.5) > 0.7) { P.aR = -1.3; P.eR = -2.3; } };   // se calientan las manos
    BA.fisuras.push(b);
  });
  // pibes haciendo willy: uno en moto (Calle Las Acacias) y uno en bici (Pasaje 14)
  const moto = new THREE.Group(), pv = new THREE.Group(); sc.add(moto); moto.add(pv); const en = hdEnduro(); en.position.set(0.7, -0.36, 0); pv.add(en); pv.position.y = 0.36;
  const r1 = vmxBody({ top: 'remera', topColor: 0xe8e8e0, pants: 0x1a1e28, skin: 0xc68b62, hair: 'short', hairColor: 0x111111, cap: 0xd83a2a, capBack: true }, 14, 'Pibe de la moto'); r1.poseFn = vmxRidePose(false);
  BA.kids.push({ type: 'moto', g: moto, pv, rider: r1, x: -30, z: 1.8, dir: 1, v: 8, wheelie: 0, axis: 'x', min: -40, max: 40, lane: 1.8 });
  const bici = new THREE.Group(), pb = new THREE.Group(); sc.add(bici); bici.add(pb); const bk = baBike(); bk.position.set(0.5, -0.35, 0); pb.add(bk); pb.position.y = 0.35;
  const r2 = vmxBody({ top: 'remera', topColor: 0x2a9a5a, pants: 0x2a2e38, skin: 0xe0ac86, hair: 'rulos', hairColor: 0x3a2414 }, 15, 'Pibe de la bici'); r2.poseFn = vmxRidePose(false);
  BA.kids.push({ type: 'bici', g: bici, pv: pb, rider: r2, x: 1.6, z: -30, dir: 1, v: 4.5, wheelie: 0, axis: 'z', min: -40, max: 40, lane: 1.6 });
  // perros (el perro de la plaza, paseando por las veredas)
  const pts = []; for (let a = -40; a <= 40; a += 8) pts.push([a, 5.0], [a, -5.0], [5.0, a], [-5.0, a]);
  for (const [c, x, z] of [[0x2a1a10, -16, 5], [0xe8d8b8, 12, -5], [0x8a6a4a, 5, 18], [0x3a3a3a, -5, -30]]) { const d = new CalleDog(c, x, z); d.randGoal = () => { const p = pick(pts); return new THREE.Vector3(p[0], 0, p[1]); }; BA.dogs.push(d); }
  // la gente del bar: sentada en mesas en la vereda, con velas
  const bs = BA.barSpot.position;
  for (let k = 0; k < 2; k++) {
    const tx = bs.x - 2 + k * 3.6, tz = -4.9;
    cyl(0.4, 0.4, 0.04, trofiMat(0xe8e4d8, { roughness: 0.5 }), tx, 0.74, tz, sc, 16); cyl(0.03, 0.03, 0.72, trofiMat(0x2a2a2a, { metalness: 0.6 }), tx, 0.37, tz, sc, 6);
    const v = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffc060 })); v.position.set(tx, 0.82, tz); sc.add(v); trofiHalo(sc, tx, 0.85, tz, 0xff9a30, 1.0, 0.6);   // vela en la mesa
    for (let i = 0; i < 2; i++) { const a = i * Math.PI + 0.3, px = tx + Math.cos(a) * 0.72, pz = tz + Math.sin(a) * 0.5;
      box(0.42, 0.04, 0.42, trofiMat(0x8a5a2a), px, 0.45, pz, sc);
      const cfg = VMX_ROPA[(k * 2 + i) % VMX_ROPA.length], b = vmxBody(cfg, 20 + k * 2 + i, cfg.female ? 'La Vecina' : 'Vecino del bar'); b.pos.set(px, 0, pz); b.facing = Math.atan2(tx - px, tz - pz);
      const q = { b, ph: rand(0, 6) }; b.poseFn = vmxSeatPose(q); BA.bar.push(q); }
    addObstacle(tx, tz, 1.9, 1.3);
  }
}
// ---------- armar el barrio (reemplaza a la calle del modo historia) ----------
function buildBarrio() {
  const sc = CALLE.scene = new THREE.Scene(), prev = scene; scene = sc; const o0 = obstacles.length;
  sc.background = new THREE.Color(0x0a0e1e); sc.fog = new THREE.Fog(0x0a0e1e, 30, 160);
  sc.add(new THREE.HemisphereLight(0x4a5a90, 0x1a1610, 0.42));                                 // sin luz: sólo la luna
  const moon = new THREE.DirectionalLight(0x9fb2e8, 0.38); moon.position.set(-25, 40, -15); sc.add(moon, moon.target);
  baStreets(sc); baStreetFurniture(sc); baComercios(sc); baPlaza(sc); baCasas(sc); baServicios(sc); baVias(sc); baAutos(sc);
  vidaObelisco(sc); vidaGarita(sc, -9, -4.9); vidaTelefono(sc, -14.5, -5.1, 0);
  // manzanas: no se camina por adentro (la plaza sí, y la playa de la estación)
  addObstacle(-26.25, -26.25, 39.5, 39.5); addObstacle(-26.25, 26.25, 39.5, 39.5);
  addObstacle(34, 26.25, 24, 39.5); addObstacle(14.25, 34, 15.5, 24);
  addObstacle(0, -BA_R - 1, BA_R * 2, 2); addObstacle(0, BA_R + 1, BA_R * 2, 2);   // bordes del mapa (vías y fondo)
  baGente(sc);
  const key = new THREE.DirectionalLight(0xc8d4ff, 0.35); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, far: 60 }); sc.add(key, key.target); CALLE.key = key;
  CALLE.obst = obstacles.splice(o0); CALLE.bounds = { x: BA_R - 0.5, z: BA_R - 0.5 };
  scene = prev; BA.built = true;
}
{ buildCalle = function () { if (CALLE.built) return; CALLE.built = true; buildBarrio(); }; }
// ---------- cada cuadro en el barrio ----------
{
  const baseWorld = updateWorld;
  updateWorld = function (dt) {
    baseWorld(dt); if (scene !== CALLE.scene || !BA.built) return;
    BA.t += dt; const P = player;
    // fuego
    const F = BA.fire; if (F) { F.l.intensity = 1.9 + Math.sin(BA.t * 13) * 0.25 + Math.sin(BA.t * 7.3) * 0.2 + (Math.random() - 0.5) * 0.25; F.flames.forEach((f, i) => { f.scale.set(1, 0.8 + Math.abs(Math.sin(BA.t * (6 + i) + i)) * 0.5, 1); f.rotation.y = BA.t * (1 + i * 0.3); });
      F.embers.forEach(e => { const u = (BA.t * 0.45 + e.userData.ph) % 1; e.position.set(F.x + Math.sin(e.userData.ph * 40 + u * 3) * 0.3, 1.1 + u * 2.4, F.z + Math.cos(e.userData.ph * 30 + u * 2) * 0.3); e.material.color.setHex(u > 0.7 ? 0x8a3010 : 0xffa040); }); }
    for (const b of BA.fisuras) { b.curSpeed = 0; b.root.position.copy(b.pos); b.root.rotation.y = b.facing; b.animate(dt); }
    if (P && BA.fisuras.length && Math.hypot(P.pos.x - BA.fireSpot.x, P.pos.z - BA.fireSpot.z) < 3.5 && BA.t - (BA.fisT || -99) > 9) { BA.fisT = BA.t; popText(new THREE.Vector3(BA.fireSpot.x, 2.3, BA.fireSpot.z), pick(['¿Tenés un cigarrillo, Rubén?', 'Hace un frío que pela, eh.', 'Dicen que el del pancho anda por el Trofi...', '¿Volvió la luz en el centro?']), 'warn', 2.4); }
    // pibes haciendo willy: van y vienen, levantan la rueda de adelante
    for (const k of BA.kids) {
      let pos = k.axis === 'x' ? k.x : k.z; pos += k.dir * k.v * dt; if (pos > k.max || pos < k.min) { k.dir *= -1; pos = clamp(pos, k.min, k.max); }
      if (k.axis === 'x') k.x = pos; else k.z = pos;
      const lane = k.dir > 0 ? k.lane : -k.lane; if (k.axis === 'x') k.z = lane; else k.x = lane;
      const wantW = (Math.sin(BA.t * (k.type === 'moto' ? 0.7 : 0.9) + (k.type === 'moto' ? 0 : 2)) > -0.2) ? (k.type === 'moto' ? 0.55 : 0.45) : 0;   // willy un rato largo, baja, vuelve a subir
      k.wheelie += (wantW - k.wheelie) * Math.min(1, dt * 3);
      const yaw = k.axis === 'x' ? (k.dir > 0 ? 0 : Math.PI) : (k.dir > 0 ? -Math.PI / 2 : Math.PI / 2);
      k.g.position.set(k.x, 0, k.z); k.g.rotation.y = yaw; k.pv.rotation.z = k.wheelie;
      const b = k.rider, fwdX = Math.cos(yaw), fwdZ = -Math.sin(yaw), back = k.type === 'moto' ? 0.15 : 0.1;
      b.pos.set(k.x - fwdX * back, 0, k.z - fwdZ * back); b.facing = Math.atan2(fwdX, fwdZ); b.curSpeed = 0;
      b.root.position.copy(b.pos); b.animate(dt);
      b.root.quaternion.setFromEuler(new THREE.Euler(-k.wheelie * 0.9, b.facing, 0, 'YXZ')); b.root.position.y = Math.sin(k.wheelie) * 0.35;
    }
    for (const d of BA.dogs) d.update(dt);
    for (const q of BA.bar) { const b = q.b; b.curSpeed = 0; b.root.position.copy(b.pos); b.root.rotation.y = b.facing; b.animate(dt); }
    // banderas
    for (const fl of [BA.flag, BA.flag2]) if (fl) { const p = fl.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 3 + BA.t * 4) * 0.12 * (x + 0.9)); } p.needsUpdate = true; }
    // el tren: cada tanto pasa, baja la barrera y suena la campana
    const T = BA.train, B = BA.barrier;
    if (T) { BA.trainT -= dt; if (BA.trainT <= 0 && T.v === 0) { T.v = 16 * pick([1, -1]); T.x = T.v > 0 ? -140 : 140; }
      if (T.v) { T.x += T.v * dt; T.g.position.x = T.x; T.g.rotation.y = T.v > 0 ? 0 : Math.PI; if (Math.abs(T.x) > 150) { T.v = 0; BA.trainT = rand(35, 55); } }
      const near = T.v && Math.abs(T.x) < 95; B.down += ((near ? 1 : 0) - B.down) * Math.min(1, dt * 1.5); B.arm.rotation.z = -1.35 * (1 - B.down);
      B.bell.material.color.setHex(near && Math.floor(BA.t * 3) % 2 ? 0xff2a1a : 0x441010);
      if (near && typeof AC !== 'undefined' && AC && P) { BA.bellT = (BA.bellT || 0) - dt; if (BA.bellT <= 0) { BA.bellT = 0.5; const v = Math.max(0, 1 - Math.hypot(P.pos.x - 4.6, P.pos.z + 47) / 45) * 0.12; if (v > 0.01) tone('square', 1400, 1400, 0.08, v); } } }
    const kl = CALLE.key; if (kl && P) { kl.position.set(P.pos.x - 6, 16, P.pos.z + 6); kl.target.position.set(P.pos.x, 0, P.pos.z); }
  };
}
