/* Writing tools for Satyansh's Science Lab — pen, highlighter, eraser and a blank board.
   One small ✏️ button (bottom-left). Tap it to open the tools; they tuck themselves away
   after a few seconds, and drawing still works while they are tucked away.
   Include once per page:  <script src="/assets/pen.js" defer></script>  */
(function () {
  if (window.__labPen) return;
  window.__labPen = true;

  const css = `
#lp-ink{position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000;pointer-events:none;touch-action:none}
#lp-ink.on{pointer-events:auto;cursor:crosshair}
#lp-board{position:fixed;inset:0;z-index:2147482990;display:none;background-color:#0f1b2d;
  background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:40px 40px}
#lp-board.show{display:block}
#lp-bar{position:fixed;left:14px;bottom:14px;z-index:2147483100;display:flex;flex-direction:row-reverse;align-items:center;gap:6px;font:600 14px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
  -webkit-user-select:none;user-select:none}
#lp-bar button{all:unset;box-sizing:border-box;cursor:pointer;display:grid;place-items:center;-webkit-tap-highlight-color:transparent}
#lp-bar #lp-fab{width:46px;height:46px;border-radius:50%;background:#14223D;color:#fff;font-size:21px;box-shadow:0 4px 14px rgba(0,0,0,.35);
  border:3px solid rgba(255,255,255,.35);opacity:.8;transition:opacity .2s,transform .15s}
#lp-bar #lp-fab:hover{opacity:1;transform:scale(1.06)}
#lp-bar #lp-fab.on{opacity:1;border-color:var(--lp-c,#FFB703)}
#lp-tools{display:none;align-items:center;gap:4px;padding:6px;border-radius:999px;background:#14223D;border:1px solid #2C4370;box-shadow:0 6px 20px rgba(0,0,0,.4);
  flex-wrap:wrap;justify-content:flex-start;max-width:calc(100vw - 90px)}
#lp-bar.open #lp-tools{display:flex}
#lp-tools .t{width:38px;height:38px;border-radius:50%;font-size:18px;color:#F5F8FF}
#lp-tools .t:hover{background:#1C2E52}
#lp-tools .t.sel{background:#2C4370;box-shadow:inset 0 0 0 2px #FFB703}
#lp-tools .sw{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.55);margin:0 2px}
#lp-tools .sw.sel{box-shadow:0 0 0 3px #FFB703}
#lp-tools .sep{width:1px;height:26px;background:#2C4370;margin:0 3px}
@media print{#lp-ink,#lp-board,#lp-bar{display:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const COLORS = ['#111111', '#FFFFFF', '#EF476F', '#1C7ED6', '#06D6A0', '#FFB703'];
  const S = { mode: 'off', color: '#EF476F', size: 4, board: false, ink: [], boardInk: [], undo: [], open: false };
  const strokes = () => (S.board ? S.boardInk : S.ink);

  const board = document.createElement('div'); board.id = 'lp-board';
  const cv = document.createElement('canvas'); cv.id = 'lp-ink';
  const bar = document.createElement('div'); bar.id = 'lp-bar';
  bar.innerHTML = `<div id="lp-tools" role="toolbar" aria-label="Writing tools">
    <button class="t" data-m="off" title="Hand — use the page normally">👆</button>
    <button class="t" data-m="pen" title="Pen">✏️</button>
    <button class="t" data-m="hl" title="Highlighter">🖍️</button>
    <button class="t" data-m="erase" title="Eraser — rub over a line">🧽</button>
    <span class="sep"></span>
    ${COLORS.map((c) => `<button class="sw" data-c="${c}" style="background:${c}" title="Colour"></button>`).join('')}
    <span class="sep"></span>
    <button class="t" data-a="size" title="Thin / thick">◐</button>
    <button class="t" data-a="undo" title="Undo">↶</button>
    <button class="t" data-a="clear" title="Clear all writing">🗑️</button>
    <button class="t" data-a="board" title="Blank board for rough work">📋</button>
    <button class="t" data-a="min" title="Minimise tools">⤡</button>
  </div><button id="lp-fab" title="Writing tools" aria-label="Writing tools">✏️</button>`;
  document.body.append(board, cv, bar);

  const ctx = cv.getContext('2d');
  const fab = bar.querySelector('#lp-fab');
  function size() {
    const d = window.devicePixelRatio || 1;
    cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d);
    ctx.setTransform(d, 0, 0, d, 0, 0); redraw();
  }
  function drawStroke(s) {
    const p = s.pts; if (!p.length) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = s.c; ctx.lineWidth = s.w; ctx.globalAlpha = s.a;
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
    if (p.length === 1) ctx.lineTo(p[0][0] + 0.1, p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.stroke(); ctx.restore();
  }
  function redraw() { ctx.clearRect(0, 0, innerWidth, innerHeight); strokes().forEach(drawStroke); }

  function refresh() {
    cv.classList.toggle('on', S.mode !== 'off');
    cv.style.cursor = S.mode === 'erase' ? 'cell' : 'crosshair';
    board.classList.toggle('show', S.board);
    bar.classList.toggle('open', S.open);
    fab.classList.toggle('on', S.mode !== 'off');
    fab.style.setProperty('--lp-c', S.color);
    fab.textContent = { off: '✏️', pen: '✏️', hl: '🖍️', erase: '🧽' }[S.mode];
    bar.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('sel', b.dataset.m === S.mode));
    bar.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('sel', b.dataset.c === S.color));
    bar.querySelector('[data-a=board]').classList.toggle('sel', S.board);
    bar.querySelector('[data-a=size]').textContent = S.size > 4 ? '●' : '•';
    redraw();
  }

  // auto-minimise the tool strip after a few idle seconds (drawing keeps working)
  let idle;
  function poke() { clearTimeout(idle); if (S.open) idle = setTimeout(() => { S.open = false; refresh(); }, 6000); }

  fab.addEventListener('click', () => { S.open = !S.open; if (S.open && S.mode === 'off') S.mode = 'pen'; refresh(); poke(); });
  bar.addEventListener('pointerdown', poke);
  bar.querySelector('#lp-tools').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.m) S.mode = b.dataset.m;
    if (b.dataset.c) { S.color = b.dataset.c; if (S.mode === 'off' || S.mode === 'erase') S.mode = 'pen'; }
    const a = b.dataset.a;
    if (a === 'size') S.size = S.size > 4 ? 4 : 9;
    if (a === 'undo') undo();
    if (a === 'clear' && strokes().length) { S.undo.push({ t: 'clear', board: S.board, list: strokes().slice() }); strokes().length = 0; }
    if (a === 'board') { S.board = !S.board; if (S.board && (S.mode === 'off' || S.mode === 'erase')) S.mode = 'pen'; }
    if (a === 'min') S.open = false;
    refresh(); poke();
  });
  function undo() {
    const u = S.undo.pop(); if (!u) return;
    const list = u.board ? S.boardInk : S.ink;
    if (u.t === 'add') { const i = list.indexOf(u.s); if (i > -1) list.splice(i, 1); }
    else list.push(...u.list);
  }

  // drawing
  let cur = null;
  const pt = (e) => [e.clientX, e.clientY];
  function eraseAt(x, y) {
    const list = strokes(), r = 14, gone = [];
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].pts.some((p) => Math.abs(p[0] - x) < r + list[i].w / 2 && Math.abs(p[1] - y) < r + list[i].w / 2)) gone.push(...list.splice(i, 1));
    }
    if (gone.length) { S.undo.push({ t: 'erase', board: S.board, list: gone }); redraw(); }
  }
  cv.addEventListener('pointerdown', (e) => {
    if (S.mode === 'off') return;
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    if (S.open) { S.open = false; refresh(); }
    if (S.mode === 'erase') { cur = { erase: true }; eraseAt(...pt(e)); return; }
    const hl = S.mode === 'hl';
    cur = { c: S.color, w: hl ? S.size * 4 + 8 : S.size, a: hl ? 0.35 : 1, pts: [pt(e)] };
    strokes().push(cur); S.undo.push({ t: 'add', board: S.board, s: cur }); drawStroke(cur);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!cur) return;
    e.preventDefault();
    if (cur.erase) return eraseAt(...pt(e));
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    evs.forEach((ev) => cur.pts.push(pt(ev)));
    if (cur.a < 1) redraw(); else { const p = cur.pts, n = p.length;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = cur.c; ctx.lineWidth = cur.w;
      ctx.beginPath(); ctx.moveTo(p[Math.max(0, n - evs.length - 1)][0], p[Math.max(0, n - evs.length - 1)][1]);
      for (let i = Math.max(1, n - evs.length); i < n; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.stroke(); ctx.restore(); }
  });
  const end = () => { cur = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (S.mode !== 'off' || S.board)) { S.mode = 'off'; S.board = false; refresh(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && S.mode !== 'off') { e.preventDefault(); undo(); redraw(); }
  });
  addEventListener('resize', size);
  size(); refresh();
})();
