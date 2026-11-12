// ============================================================
// BARRIO LAS ACACIAS (4): CIERRES DE CALLE, LA CIUDAD QUE SIGUE, COMENTARIOS DE LOS VECINOS
// - Oeste: auto atravesado y vallas "CALLE CERRADA". Sur: obra (vallas, conos, cinta, tierra, caño).
//   Este: vallas bajas (se sigue viendo el Obelisco). Norte: alambrado a lo largo de las vías.
// - Detrás de los cierres y alrededor de las manzanas: filas de edificios con algunas ventanas con velas
//   (así nunca se ve el vacío negro).
// - Los vecinos le dicen cosas a Rubén cuando pasa al lado.
// ============================================================
const BC = { said: new Map(), lastSay: -99, t: 0 };
const BC_FACHADAS = [];
function bcFachadaTex(base, seed) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    for (let y = 30; y < h - 20; y += 64) for (let x = 22; x < w - 30; x += 58) {
      const lit = Math.random() < 0.14; g.fillStyle = lit ? '#ffb860' : '#121620'; g.fillRect(x, y, 30, 36);   // pocas ventanas con vela
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3; g.strokeRect(x, y, 30, 36);
      if (!lit && Math.random() < 0.5) { g.fillStyle = 'rgba(90,80,70,0.8)'; g.fillRect(x, y, 30, 12 + Math.random() * 20); }   // persiana
    }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, h - 26, w, 26);
  });
}
function bcTexs() { if (!BC_FACHADAS.length) for (const c of ['#c8b8a0', '#a8c0c8', '#d8a890', '#b0b0a8', '#c8c0a0', '#9aa8b8', '#d0b8c8']) BC_FACHADAS.push(bcFachadaTex(c)); return BC_FACHADAS; }
// fila de edificios simples a lo largo de un tramo (eje 'x' o 'z'), con el frente mirando hacia la calle
function bcFila(sc, axis, a0, a1, fixed, face) {
  const T = bcTexs(); let a = a0;
  while (a < a1) {
    const w = rand(6, 11), h = rand(4.5, 14), d = 10, c = a + w / 2;
    const tx = T[Math.floor(Math.random() * T.length)].clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(w / 7, h / 7);
    const m = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.9, color: 0x6a6c74, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.06 });   // un poco de brillo propio: si no, de noche quedaban del color del cielo (y sólo se veían los tanques)
    const b = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? w : d, h, axis === 'x' ? d : w), m);
    b.position.set(axis === 'x' ? c : fixed + face * d / 2, h / 2, axis === 'x' ? fixed + face * d / 2 : c); /* face = hacia afuera */ b.receiveShadow = true; sc.add(b);
    if (Math.random() < 0.5) cyl(0.6, 0.6, 1.1, trofiMat(pick([0x3a3a3a, 0x8a8a86, 0x2a5a9a]), { emissive: 0x1a1e28, emissiveIntensity: 1 }), b.position.x + rand(-2, 2), h + 0.55, b.position.z, sc, 10);   // tanque de agua
    a += w;
  }
}
function bcValla(sc, x, z, rotY, txt) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; sc.add(g);
  const st = baTex('rayas', () => canvasTex(128, 32, (c, w, h) => { for (let i = -2; i < 10; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#d8241c'; c.beginPath(); c.moveTo(i * 16, 0); c.lineTo(i * 16 + 16, 0); c.lineTo(i * 16, h); c.lineTo(i * 16 - 16, h); c.fill(); } }));
  for (const y of [0.55, 0.95]) { const p = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 0.05), new THREE.MeshStandardMaterial({ map: st, roughness: 0.6 })); p.position.y = y; g.add(p); }
  for (const s of [-1, 1]) { box(0.06, 1.1, 0.06, trofiMat(0x3a3a3a, { metalness: 0.5 }), s * 1.0, 0.55, 0, g); box(0.06, 0.06, 0.6, trofiMat(0x3a3a3a), s * 1.0, 0.03, 0, g); }
  if (txt) { const l = trofiLabel(txt, 1.6, 0.3, '#f2f0e8', '#c0300f'); l.position.set(0, 1.35, 0.03); g.add(l); const l2 = l.clone(); l2.rotation.y = Math.PI; l2.position.z = -0.03; g.add(l2); box(0.04, 0.5, 0.04, trofiMat(0x3a3a3a), 0, 1.15, 0, g, false); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffa020 })); lamp.position.set(0.9, 1.15, 0); g.add(lamp); BC.blinks = (BC.blinks || []).concat(lamp);   // balizas de obra
  return g;
}
function bcCono(sc, x, z) { const c = new THREE.Group(); c.position.set(x, 0, z); sc.add(c); const m = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.65, 14), trofiMat(0xff6a10, { roughness: 0.5 })); m.position.y = 0.33; c.add(m); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 14), trofiMat(0xf4f4f4)); b.position.y = 0.38; c.add(b); box(0.42, 0.04, 0.42, trofiMat(0x1a1a1a), 0, 0.02, 0, c); }
function bcCierres(sc) {
  // OESTE: auto atravesado + vallas "CALLE CERRADA"
  const car = hdCarRound(0x8a1a1a, 'sedan'); car.position.set(-47.5, 0, 0.6); car.rotation.y = Math.PI / 2 + 0.25; sc.add(car);
  for (const z of [-3, 3]) bcValla(sc, -45.2, z, Math.PI / 2, z < 0 ? 'CALLE CERRADA' : '');
  // SUR: la obra (vallas, conos, cinta, montículo de tierra, caño)
  for (const x of [-2.4, 2.4]) bcValla(sc, x, 45.2, 0, x < 0 ? 'OBRA · CALLE CERRADA' : 'DESVÍO');
  for (const x of [-3.5, -1.2, 1.2, 3.5]) bcCono(sc, x, 43.8);
  const tierra = sph(3.2, 1.2, 2.2, texMat(concreteTex, 2, 1, { color: 0x6a5434, roughness: 1 }), 0.5, 0, 48.5, sc);
  const cano = cyl(0.45, 0.45, 4, trofiMat(0x6a6c70, { metalness: 0.5, roughness: 0.6 }), -2, 0.45, 47.5, sc, 16); cano.rotation.z = Math.PI / 2; cano.rotation.y = 0.3;
  const cinta = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.1), new THREE.MeshBasicMaterial({ color: 0xffd020, side: THREE.DoubleSide })); cinta.position.set(0, 0.85, 44.4); sc.add(cinta);
  // ESTE: vallas bajas (se ve el Obelisco por encima)
  for (const z of [-2.4, 2.4]) bcValla(sc, 45.2, z, Math.PI / 2, z < 0 ? 'NO PASAR' : '');
  // NORTE: alambrado a lo largo de las vías (con la barrera en el pasaje)
  const fence = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#8a9096'; c.lineWidth = 2; for (let i = -64; i < 128; i += 10) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 64, 64); c.stroke(); c.beginPath(); c.moveTo(i + 64, 0); c.lineTo(i, 64); c.stroke(); } });
  fence.wrapS = fence.wrapT = THREE.RepeatWrapping;
  for (const [x0, x1] of [[-48, -4.5], [5.5, 48]]) { const f = fence.clone(); f.needsUpdate = true; f.repeat.set((x1 - x0) / 2.4, 1); const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 2.0), new THREE.MeshBasicMaterial({ map: f, transparent: true, side: THREE.DoubleSide })); m.position.set((x0 + x1) / 2, 1.0, -47.4); sc.add(m); for (let x = x0; x <= x1; x += 3) cyl(0.04, 0.04, 2.1, trofiMat(0x6a6c70, { metalness: 0.6 }), x, 1.05, -47.4, sc, 6); }
  // LA CIUDAD QUE SIGUE: filas de edificios detrás de cada cierre y alrededor de las manzanas
  bcFila(sc, 'x', -110, -48, -6.5, -1); bcFila(sc, 'x', -110, -48, 6.5, 1);              // continuación de la Calle hacia el oeste
  bcFila(sc, 'z', 48, 110, -6.5, -1); bcFila(sc, 'z', 48, 110, 6.5, 1);                  // continuación del Pasaje hacia el sur
  bcFila(sc, 'z', -115, -53, -6.5, -1); bcFila(sc, 'z', -115, -53, 6.5, 1);              // del otro lado de las vías
  bcFila(sc, 'x', 48, 92, -6.5, -1); bcFila(sc, 'x', 48, 92, 6.5, 1);                    // hacia la 9 de Julio
  { const T = bcTexs(), end = (x, z, w, h, rot) => { const tx = T[2].clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(w / 7, h / 7); const m = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.9, color: 0x6a6c74, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.06 }); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 10), m); b.position.set(x, h / 2, z); b.rotation.y = rot; sc.add(b); };
    end(-115, 0, 24, 12, Math.PI / 2); end(0, 115, 24, 14, 0); end(0, -120, 24, 16, 0); }   // las calles terminan en un edificio, no en el vacío
  // contorno de las manzanas (la parte de atrás de las casas, que se ve en diagonal)
  for (const s of [-1, 1]) { bcFila(sc, 'x', -46, -6.5, s * 52, s); bcFila(sc, 'x', 6.5, 46, s * 52, s); bcFila(sc, 'z', -46, -6.5, s * 52, s); bcFila(sc, 'z', 6.5, 46, s * 52, s); }
}
{
  const baseB = buildBarrio;
  buildBarrio = function () {
    baseB();
    const sc = CALLE.scene, prev = scene; scene = sc; const o0 = obstacles.length; obstacles.push(...CALLE.obst);
    const n0 = sc.children.length;
    bcCierres(sc);
    // lo que no se mueve se marca estático: el motor no recalcula su posición en cada cuadro
    const freeze = o => { o.traverse(c => { c.matrixAutoUpdate = false; c.updateMatrix(); }); };
    for (let i = n0; i < sc.children.length; i++) { const c = sc.children[i]; if (!(c.isLight)) freeze(c); }
    for (const c of sc.children) if (c.userData && c.userData.estatico) freeze(c);
    sc.updateMatrixWorld(true);
    CALLE.obst = obstacles.splice(o0); scene = prev;
  };
}
// ---------- lo que dicen los vecinos cuando pasás ----------
const BC_FRASES = {
  'Vecino': ['¡Rubén! ¿Vos sabés cuándo vuelve la luz?', 'Se me descongeló todo el freezer...', 'Che, ¿es verdad que se arma en la plaza?', 'Mi vieja dice que fue el del pancho.', 'Andá con cuidado que hay motochorros.', '¿Tenés señal? Yo nada.', 'Rubén, saludos a tu vieja.', '¿Viste la nota que le dejaron al Tano?'],
  'Vecina': ['Ay, Rubén, ¡qué oscuro está todo!', '¿Viste los afiches del pancho? Me da cosa.', 'Mi hija está en el Trofi, ¿vos vas?', 'Cuidate, nene.', 'Me quedé sin cargar el celu, justo hoy.'],
  'Vecino del bar': ['¡Rubén! ¿Una birra? Está caliente, pero es birra.', 'Sin tele no hay partido... ¡qué noche!'],
  'La Vecina': ['Ponete un abrigo, Rubén.'],
  'El abuelo': ['En mis tiempos se cortaba la luz y nos íbamos a bailar.', 'Pibe, ¿no tenés una pila AA?'],
  'Pibe del potrero': ['¡Rubén, vení a patear!', '¡Gol! ¿Lo viste, Rubén?', '¡Ese es mío, ese es mío!'],
  'El playero': ['Nafta queda poca, pero café te hago.', 'Tengo el único generador del barrio, ¿viste?'],
  'El cuidacoches': ['¡Te lo cuido, jefe!', 'Dejámelo acá nomás, que yo lo miro.'],
  'Esperando el bondi': ['Hace cuarenta minutos que no pasa el 87.', 'Sin luz no anda ni la SUBE.'],
  'El de la garrapiñada': ['¡Garrapiñada calentita! ¡Maní con chocolate!'],
  'El novio': ['Shh, Rubén, que estamos en una cita...'], 'La novia': ['¡Hola, Rubén! Andá, andá...'],
  'La señora del perrito': ['¡Toby, no! Perdón, Rubén, es bueno.', 'Ni el perro duerme con este calor.'],
  'Pibe de la moto': ['¡Mirá cómo la levanto, Rubén!'], 'Pibe de la bici': ['¡Rubén! ¡Mirá, sin manos!'],
};
{
  const baseWorld = updateWorld;
  updateWorld = function (dt) {
    baseWorld(dt); if (scene !== CALLE.scene || !BA.built) return;
    BC.t += dt; const P = player; if (!P) return;
    if (P.label) P.label.style.display = 'none';   // el cartel "Rubén (vos)" no va en el barrio (quedaba flotando)
    if (BC.blinks) { const on = Math.floor(BC.t * 2) % 2 === 0; BC.blinks.forEach(l => l.material.color.setHex(on ? 0xffa020 : 0x3a2008)); }
    BC.chk = (BC.chk || 0) - dt; if (BC.chk > 0) return; BC.chk = 0.25;   // 4 veces por segundo alcanza
    if (BC.t - BC.lastSay < 3.5 || HIST.talk || HIST.cine) return;   // en la cinemática no habla nadie
    const gente = [...MV.walkers.map(w => w.b), ...MV.still, ...MV.kids.map(k => k.b), ...BA.bar.map(q => q.b), ...BA.kids.map(k => k.rider)];
    for (const b of gente) {
      if (!b.root.visible) continue;
      const d = Math.hypot(b.pos.x - P.pos.x, b.pos.z - P.pos.z); if (d > 2.6) continue;
      const last = BC.said.get(b) || -99; if (BC.t - last < 25) continue;
      const pool = BC_FRASES[b.name] || BC_FRASES[b.cfg && b.cfg.female ? 'Vecina' : 'Vecino']; if (!pool) continue;
      BC.said.set(b, BC.t); BC.lastSay = BC.t;
      popText(new THREE.Vector3(b.pos.x, 2.25, b.pos.z), pick(pool), 'warn', 2.6);
      break;
    }
  };
}
