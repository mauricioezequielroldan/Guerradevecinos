// ============================================================
// CUERPOS NUEVOS DE MIXAMO (Ch21, Ch08, Ch38, Ch20) Y A QUIÉN LE TOCA CADA UNO
// - Las piezas nuevas se tiñen como las que ya existían: buzo (Hoodie) = remera, short = pantalón,
//   zapatos = zapatillas, barba = color del pelo.
// - Ch20 viene en una sola pieza (no se tiñe por prenda): va para la gente de la calle.
// ============================================================
const CUERPOS_NUEVOS = ['ch21', 'ch08', 'ch38', 'ch20'].filter(t => window['GV_' + t.toUpperCase()]);
const CUERPOS_BANDA = {   // por banda y por integrante (0 = capitán)
  rugbier: ['ch38', 'ch38', 'ch38', 'ch38'],
  cumbieros: ['ch08', 'ch21', 'ch08', 'ch21'],
  motoqueros: ['ch08', 'ch12', 'ch21', 'ch08'],
  gauchos: ['ch21', 'ch01', 'ch21', 'ch12'],
  floggers: ['ch21', 'ch12', 'ch21', 'ch01'],
  original0: ['ch01', 'ch21', 'ch08', 'ch02'],   // La Par
  original1: ['ch08', 'ch12', 'ch21', 'ch02'],   // La Impar
};
{
  const baseOpts = chpMeshOpts;
  chpMeshOpts = function (name, o, tag, f) {
    const n = name.replace(/^Ch\d+_/, '');
    if (n === 'Hoodie') return baseOpts(name.replace('Hoodie', 'Shirt'), o, tag, f);
    if (n === 'Shorts') return baseOpts(name.replace('Shorts', 'Pants'), o, tag, f);
    if (n === 'Shoes') return baseOpts(name.replace('Shoes', 'Sneakers'), o, tag, f);
    if (n === 'Beard') { const c = f ? f.cfg : {}; return c.beard === false ? { hide: true } : { col: o.hair, amt: 0.85, rough: 0.6 }; }
    return baseOpts(name, o, tag, f);
  };
  const baseTag = chpTagFor;
  chpTagFor = function (f) {
    const t = baseTag(f);
    if (!CUERPOS_NUEVOS.length || t === null || t === 'ch02') return t;      // vecinos civiles y mujeres: como antes
    const ok = tg => tg === 'ch01' || tg === 'ch12' ? (tg !== 'ch12' || window.GV_CH12) : CUERPOS_NUEVOS.includes(tg);
    if (f.team === 0 || f.team === 1) {                                       // luchadores: según la banda
      const id = (typeof teamSel !== 'undefined' && teamSel[f.team]) || 'original';
      const list = CUERPOS_BANDA[id === 'original' ? 'original' + f.team : id];
      const pickT = list && list[f.idx % list.length];
      return pickT && ok(pickT) ? pickT : t;
    }
    // compañeros de La Par en la calle del modo historia: el mismo cuerpo que cuando pelean
    if (typeof ROSTER_ORIG !== 'undefined' && f.cfg) { const i = ROSTER_ORIG[0].findIndex(r => r.name === f.cfg.name); if (i >= 0) { const tg = CUERPOS_BANDA.original0[i]; return ok(tg) ? tg : t; } }
    // gente de la calle (bar, mozo, motochorro): variedad, incluido el Ch20
    const pool = ['ch20', 'ch21', 'ch08', 'ch01', 'ch12', 'ch38'].filter(ok);
    return pool[(f.idx + (f.name ? f.name.length : 0)) % pool.length];
  };
}
