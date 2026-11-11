// ============================================================
// POSTURA DE DESCANSO: fuera de la pelea (o con el rival lejos) no están en guardia.
// Cuatro maneras de pararse según el personaje, con respiración, peso que cambia de pierna y mirada que recorre.
// La guardia vuelve sola cuando hay un rival a menos de 5 m (ver nucleo/03_personajes_cuerpo.js, v42).
// ============================================================
Fighter.prototype.foeNear5 = function () {
  if (this.team < 0 || !this.alive) return false;
  for (const e of fighters) if (e.team !== this.team && e.team >= 0 && e.alive && Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) < 5) return true;
  return false;
};
Fighter.prototype.idleVariant = function (P) {
  // variantes: 0 manos en la cintura, 2 brazos sueltos, 3 manos en los bolsillos. (La de brazos cruzados se sacó:
  // en el cuerpo de Mixamo las manos quedaban a la altura del pecho y parecía guardia.) El jugador, siempre sueltos.
  const t = this.idleT, k = this.isPlayer ? 2 : [0, 2, 3][(this.idx + (this.team > 0 ? 2 : 0) + (this.name ? this.name.length : 0)) % 3];
  const br = Math.sin(t * 1.9), shift = Math.sin(t * 0.35 + this.idx * 1.7);   // respiración y cambio de peso (lento)
  P.tX = 0.03 + br * 0.018; P.tZ = shift * 0.035; P.hY = Math.sin(t * 0.42 + this.idx) * 0.45; P.hX = -0.04 + Math.sin(t * 0.3) * 0.04;
  if (shift > 0.3) { P.kL = 0.22; P.kR = 0.04; } else if (shift < -0.3) { P.kR = 0.22; P.kL = 0.04; } else { P.kL = P.kR = 0.08; }
  if (k === 0) { P.aL = P.aR = 0.15; P.eL = P.eR = -1.55; P.aLz = -0.62; P.aRz = 0.62; }            // manos en la cintura
  else if (k === 1) { P.aL = -0.55; P.eL = -2.2; P.aR = -0.6; P.eR = -2.0; P.aLz = 0.55; P.aRz = -0.55; }   // brazos cruzados
  else if (k === 2) { P.aL = 0.06 + br * 0.02; P.aR = 0.1; P.eL = -0.2; P.eR = -0.3; P.aLz = -0.1; P.aRz = 0.14; }   // brazos sueltos
  else { P.aL = P.aR = 0.32; P.eL = P.eR = -0.45; P.aLz = -0.08; P.aRz = 0.08; P.tX -= 0.03; }    // manos en los bolsillos (atrás)
  if (this.weapon) { P.aR = -0.25; P.eR = -1.1; P.aRz = 0.05; }                                 // con un fierro en la mano, lo sostiene
  // de vez en cuando se rasca la cabeza o mira el celular
  const c = (t + this.idx * 3.1) % 11;
  if (c > 9.6 && !this.isPlayer) { const u = Math.sin((c - 9.6) / 1.4 * Math.PI); P.aR = -2.4 * u; P.eR = -2.0 * u; P.aRz = 0.1; }
};
