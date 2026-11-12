// ============================================================
// AUTOS REDONDEADOS Y AMIGABLES (reemplazan a los autos "caja" en el barrio y en el Trofi)
// Perfil con curvas (Bézier), bisel grande, cabina abombada, faros redondeados, llantas de aleación.
// Tipos: '' (hatchback), 'suv', 'sedan'. La Amaroki, el camión de reparto y el 128 siguen como estaban.
// ============================================================
function hdCarRound(color, kind) {
  const g = new THREE.Group(); g.name = 'AutoRedondo';
  const paint = hdPaint(color, { roughness: 0.32, metalness: 0.4, clearcoatRoughness: 0.12 }), black = HD.plastic(), chrome = HD.chrome(), glass = HD.glass();
  const suv = kind === 'suv', sedan = kind === 'sedan';
  const L = suv ? 4.35 : sedan ? 4.45 : 4.05, W = suv ? 1.86 : 1.76, H = suv ? 1.7 : 1.48, cl = suv ? 0.5 : 0.36;   // largo, ancho, alto, despeje
  const hx = L / 2, belt = cl + (suv ? 0.62 : 0.52);
  // carrocería baja: trompa redondeada, paragolpes integrados, cola curva
  const sb = new THREE.Shape();
  sb.moveTo(-hx + 0.15, cl);
  sb.lineTo(hx - 0.25, cl);
  sb.quadraticCurveTo(hx + 0.05, cl, hx, cl + 0.28);                 // trompa
  sb.quadraticCurveTo(hx - 0.05, belt - 0.02, hx - 0.55, belt + 0.04); // capó que sube suave
  sb.lineTo(-hx + (sedan ? 0.5 : 0.25), belt + 0.06);
  sb.quadraticCurveTo(-hx - 0.02, belt, -hx, cl + 0.3);             // cola
  sb.quadraticCurveTo(-hx, cl, -hx + 0.15, cl);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sb, { depth: W - 0.28, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.14, bevelSegments: 5, curveSegments: 12 }), paint);
  body.geometry.translate(0, 0, -(W - 0.28) / 2); body.castShadow = true; body.receiveShadow = true; g.add(body);
  // cabina abombada (pintura) y vidrios (un poco más anchos, para que se vean en los costados)
  const front = suv ? 0.95 : 0.85, back = suv ? -hx + 0.35 : sedan ? -1.05 : -hx + 0.42, top = cl + H - 0.1;
  const cabShape = (inset) => { const s = new THREE.Shape(); s.moveTo(back + inset, belt); s.lineTo(front - inset, belt); s.quadraticCurveTo(front - 0.55, top - 0.02 - inset, front - 1.0, top - inset); s.quadraticCurveTo((back + front) / 2 - 0.4, top + 0.06 - inset, back + 0.35 + inset, top - 0.04 - inset); s.quadraticCurveTo(back + inset, top - 0.25, back + inset, belt); return s; };
  const cab = new THREE.Mesh(new THREE.ExtrudeGeometry(cabShape(0), { depth: W - 0.5, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 4, curveSegments: 10 }), paint);
  cab.geometry.translate(0, 0, -(W - 0.5) / 2); cab.castShadow = true; g.add(cab);
  const gl = new THREE.Mesh(new THREE.ExtrudeGeometry(cabShape(0.07), { depth: W - 0.42, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.06, bevelSegments: 2, curveSegments: 10 }), glass);
  gl.geometry.translate(0, 0.02, -(W - 0.42) / 2); g.add(gl);
  const pillarX = (back + front) / 2 - 0.15; for (const z of [-1, 1]) box(0.09, top - belt - 0.12, 0.05, paint, pillarX, (belt + top) / 2, z * (W / 2 - 0.08), g);   // parante del medio
  // faros redondeados, traseros, espejos, manijas, zócalo negro, patente
  const tails = [];
  for (const z of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0xe8eef4, roughness: 0.05, clearcoat: 1, emissive: 0x7a7a6a, emissiveIntensity: 0.6 }));
    hl.scale.set(0.45, 0.55, 1.05); hl.position.set(hx - 0.12, cl + 0.38, z * (W / 2 - 0.28)); g.add(hl);
    const hs = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff0c8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 })); hs.position.set(hx + 0.12, cl + 0.38, z * (W / 2 - 0.28)); hs.scale.set(0.9, 0.6, 1); g.add(hs);
    const tl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshBasicMaterial({ color: 0xd81a10 })); tl.scale.set(0.35, 0.6, 1.2); tl.position.set(-hx + 0.08, cl + 0.48, z * (W / 2 - 0.25)); g.add(tl);
    const ts = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff3020, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.45 })); ts.position.set(-hx - 0.1, cl + 0.48, z * (W / 2 - 0.25)); ts.scale.set(0.5, 0.4, 1); g.add(ts); tails.push(ts);
    const mir = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), paint); mir.scale.set(0.9, 0.7, 0.6); mir.position.set(front - 0.25, belt + 0.12, z * (W / 2 + 0.06)); g.add(mir);
    box(0.14, 0.03, 0.03, black, 0.2, belt - 0.08, z * (W / 2 + 0.005), g, false);
    box(L - 1.6, 0.12, 0.04, black, 0, cl + 0.08, z * (W / 2 + 0.01), g, false);
  }
  box(0.04, 0.1, 0.5, black, hx + 0.1, cl + 0.12, 0, g, false); box(0.04, 0.14, 0.42, trofiMat(0xf2f2ee), -hx - 0.1, cl + 0.3, 0, g, false);   // toma de aire, patente
  for (const x of [hx - (suv ? 0.95 : 0.85), -hx + (suv ? 0.95 : 0.85)]) for (const z of [-1, 1]) { const w = hdWheel(suv ? 0.37 : 0.32, 0.22, 5, 0xc8ccd0); w.position.set(x, suv ? 0.37 : 0.32, z * (W / 2 - 0.1)); g.add(w); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData = { L: L + 0.2, W, tails };
  return g;
}
{
  const before = trofiCar;
  trofiCar = function (color, kind) {
    if (kind === 'amarok' || kind === 'van') return before(color, kind);
    return hdCarRound(color, kind === 'sedan' ? 'sedan' : kind === 'suv' ? 'suv' : (Math.random() < 0.3 ? 'sedan' : ''));
  };
}
