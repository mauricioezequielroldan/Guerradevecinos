(function trofiMenu() {
  const start = document.getElementById('startBtn'); if (!start) return;
  const row = document.createElement('div'); row.className = 'row mapRow';
  row.innerHTML = '<label class="tsel">MAPA <select id="mapSel"><option value="plaza">LA PLAZA (el barrio)</option><option value="trofi">TROFI CAMBIO (Panamericana)</option></select></label>';
  const teamRow = document.querySelector('.teamRow'); (teamRow || start).insertAdjacentElement(teamRow ? 'afterend' : 'beforebegin', row);
  const sel = row.querySelector('#mapSel'); sel.onchange = () => { CUR_MAP = sel.value; };
  if (params.get('mapa') === 'trofi') { sel.value = 'trofi'; CUR_MAP = 'trofi'; }
})();
// en el Trofi no hay salida desde las casas: "saltear la salida" sólo actúa si la hay
if (window.__G && __G.skipWalkin) { const _sw = __G.skipWalkin; __G.skipWalkin = function () { if (gameState !== 'walkin') return; return _sw.apply(this, arguments); }; }

// ============================================================
// MENÚ MÁS LIMPIO: a la vista sólo lo importante (jugadores, equipos, bandas, mapa, ¡LISTO!);
// modo, duración, casillas, cámara y ayudas van adentro de "MÁS OPCIONES" (cerrado de entrada).
// ============================================================
(function menuLimpio() {
  const menu = document.getElementById('menu'), start = document.getElementById('startBtn');
  if (!menu || !start) return;
  const st = document.createElement('style');
  st.textContent = `
    #menu{gap:0}
    #menu .pre{font-size:13px;opacity:.75;margin-bottom:2px}
    #menu h1{margin:0 0 2px}
    #menu h2{margin:0 0 6px;font-size:clamp(16px,2.2vw,26px)}
    #menu .tagline{font-size:clamp(12px,1.25vw,16px);margin:0 0 10px;opacity:.9}
    #menu .row{margin:5px 0}
    #menu .modeRow button,#menu .row button{font-size:clamp(14px,1.7vw,22px)!important;padding:8px 22px!important}
    #menu .teamRow,#menu .mapRow{display:inline-flex;gap:10px;margin:4px 8px}
    #menu .tsel{font-size:clamp(13px,1.3vw,17px)!important}
    #menu .tsel select{font-size:clamp(13px,1.2vw,16px)!important;padding:5px 8px!important}
    #masOpc{margin:10px auto 0;font:16px Impact,'Arial Black',sans-serif;letter-spacing:2px;background:#1c1a22;color:#e8e2d0;border:3px solid #000;box-shadow:3px 3px 0 #000;padding:6px 14px;cursor:pointer}
    #opcPanel{display:none;max-width:900px;margin:8px auto 0;padding:10px 14px;background:rgba(10,10,16,.82);border:2px solid #000;box-shadow:4px 4px 0 #000}
    #menu.opcOpen #opcPanel{display:block}
    #opcPanel #gv26help{font-size:12px;opacity:.8;margin-top:6px}
    #startBtn{margin-top:12px!important}
  `;
  document.head.appendChild(st);
  // bandas y mapa en una misma línea (si entra)
  const team = menu.querySelector('.teamRow'), map = menu.querySelector('.mapRow');
  if (team && map) { const line = document.createElement('div'); line.className = 'row'; line.style.display = 'flex'; line.style.flexWrap = 'wrap'; line.style.justifyContent = 'center'; line.style.alignItems = 'center';
    team.parentNode.insertBefore(line, team); line.appendChild(team); line.appendChild(map); }
  // panel de opciones
  const btn = document.createElement('button'); btn.id = 'masOpc'; btn.textContent = '⚙ MÁS OPCIONES';
  const panel = document.createElement('div'); panel.id = 'opcPanel';
  for (const id of ['gv26setup', 'controls30', 'gv26help']) { const el = document.getElementById(id); if (el) panel.appendChild(el); }
  start.parentNode.insertBefore(btn, start); start.parentNode.insertBefore(panel, start);
  btn.onclick = () => { menu.classList.toggle('opcOpen'); btn.textContent = menu.classList.contains('opcOpen') ? '✖ CERRAR OPCIONES' : '⚙ MÁS OPCIONES'; };
})();

})();


