(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const API = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h';
  const COLORS = { lower: [34, 255, 136], watch: [255, 176, 32], risk: [255, 45, 85], high: [255, 31, 61], safe: [76, 255, 196] };
  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 });
  const price = v => v == null ? '–' : v >= 1 ? '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '$' + v.toPrecision(4);
  const pct = v => v == null ? '–' : (v >= 0 ? '+' : '') + v.toFixed(2) + '%';

  /* ---------- hyperspace starfield (original canvas code) ---------- */
  const sc = $('space'), sx = sc.getContext('2d');
  const bc = $('bubbles'), bx = bc.getContext('2d');
  let W = 0, H = 0, DPR = 1, stars = [], warp = 0;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const oW = W, oH = H;
    W = innerWidth; H = innerHeight;
    if (oW && oH) bubbles.forEach(b => { b.x *= W / oW; b.y *= H / oH; });
    for (const c of [sc, bc]) { c.width = W * DPR; c.height = H * DPR; }
    sx.setTransform(DPR, 0, 0, DPR, 0, 0); bx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = W < 700 ? 380 : 700;
    stars = Array.from({ length: n }, () => newStar(Math.random()));
    if (bubbles.length) sizeBubbles();
  }
  function newStar(z) {
    const a = Math.random() * Math.PI * 2, d = 0.05 + Math.random() * 1.2;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, z: z || 1, hue: Math.random() < 0.15 ? 200 + Math.random() * 60 : 220 };
  }
  function drawSpace(dt) {
    const cx = W / 2, cy = H / 2, f = Math.max(W, H) * 0.5;
    sx.fillStyle = 'rgba(3,4,12,' + (0.55 - warp * 0.35) + ')';
    sx.fillRect(0, 0, W, H);
    const g = sx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
    g.addColorStop(0, 'rgba(70,90,200,' + (0.05 + warp * 0.12) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    sx.fillStyle = g; sx.fillRect(0, 0, W, H);
    const v = (0.12 + warp * 1.6) * dt;
    sx.lineCap = 'round';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i], z0 = s.z;
      s.z -= v;
      if (s.z <= 0.02) { stars[i] = newStar(1); continue; }
      const x1 = cx + s.x / s.z * f, y1 = cy + s.y / s.z * f;
      if (x1 < -50 || x1 > W + 50 || y1 < -50 || y1 > H + 50) { stars[i] = newStar(1); continue; }
      const zt = Math.min(1, z0 + v * (2 + warp * 10));
      const x0 = cx + s.x / zt * f, y0 = cy + s.y / zt * f;
      const b = Math.min(1, (1 - s.z) * 1.3);
      sx.strokeStyle = 'hsla(' + s.hue + ',90%,' + (75 + b * 20) + '%,' + b * 0.7 + ')';
      sx.lineWidth = Math.max(0.5, (1 - s.z) * 2);
      sx.beginPath(); sx.moveTo(x0, y0); sx.lineTo(x1, y1); sx.stroke();
    }
  }

  /* ---------- bubbles ---------- */
  let bubbles = [], shards = [], mode = 'explore', game = null, dataInfo = null;
  function sizeBubbles() {
    const area = W * H * (W < 700 ? 0.26 : 0.34);
    const w = bubbles.map(b => Math.pow(Math.max(b.coin.mcap || 1, 1), 0.62));
    const k = Math.sqrt(area / (Math.PI * w.reduce((a, c) => a + c * c, 0) / 1));
    const maxR = Math.min(W, H) * (W < 700 ? 0.17 : 0.15), minR = W < 700 ? 12 : 12;
    bubbles.forEach((b, i) => { b.r = Math.max(minR, Math.min(maxR, w[i] * k)); });
  }
  function homeY(b) { return b.tier === 'lower' || b.safe ? H - b.r - 70 : b.tier === 'watch' ? H * 0.62 : null; }
  function makeBubbles(coins) {
    bubbles = coins.filter(c => c.mcap > 0).slice(0, 100).map(c => {
      const r = window.QHM_RISK(c);
      return { coin: c, risk: r, tier: r.tier, x: Math.random() * W, y: r.tier === 'lower' ? H - 90 - Math.random() * 40 : H * (0.3 + Math.random() * 0.55), vx: 0, vy: 0, r: 10, safe: false, gone: 0, phase: Math.random() * 6.28, fade: 1 };
    });
    sizeBubbles();
  }
  function lift(b) {
    if (b.safe) return 0;
    const base = b.tier === 'high' ? 0.030 : b.tier === 'risk' ? 0.018 : 0;
    const m = mode === 'game' ? 1 + (game.t / game.len) * 1.8 : 0.55;
    return base * m * (0.8 + 0.4 * Math.sin(b.phase));
  }
  function respawn(b) {
    b.gone = 0; b.fade = 0; b.safe = false;
    b.x = b.r + Math.random() * (W - 2 * b.r); b.y = H + b.r; b.vy = -0.5; b.vx = 0;
  }
  function pop(b) {
    const c = COLORS[b.tier];
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * 6.28, s = 1 + Math.random() * 4;
      shards.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c, ring: false });
    }
    shards.push({ x: b.x, y: b.y, r: b.r, life: 1, c, ring: true });
    b.gone = mode === 'game' ? 2.2 : 2.5 + Math.random() * 3;
    if (mode === 'game') {
      game.popped++; game.streak = 0; game.lost += b.coin.mcap; game.grid.push('🟥');
      flash('POP ' + b.coin.symbol.toUpperCase(), COLORS.risk); hud();
    }
  }
  function step(dt) {
    const top = W < 640 ? 118 : 70;
    for (const b of bubbles) {
      if (b.gone > 0) { b.gone -= dt / 60; if (b.gone <= 0) respawn(b); continue; }
      b.phase += 0.01 * dt; b.fade = Math.min(1, b.fade + 0.03 * dt);
      const hy = homeY(b);
      if (hy == null) b.vy -= lift(b) * dt;
      else b.vy += (hy - b.y) * 0.0009 * dt + (b.safe || b.tier === 'lower' ? 0.02 * dt : 0);
      b.vx += Math.sin(b.phase * 1.3) * 0.004 * dt;
      b.vx *= Math.pow(0.97, dt); b.vy *= Math.pow(0.975, dt);
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx *= -0.5; } if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -0.5; }
      if (b.y > H - b.r - 56) { b.y = H - b.r - 56; b.vy *= -0.3; }
      if (b.y - b.r < top) {
        if (hy == null && !b.safe) pop(b); else { b.y = top + b.r; b.vy = Math.abs(b.vy) * 0.3; }
      }
    }
    for (let i = 0; i < bubbles.length; i++) {
      const a = bubbles[i]; if (a.gone > 0) continue;
      for (let j = i + 1; j < bubbles.length; j++) {
        const b = bubbles[j]; if (b.gone > 0) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, rr = a.r + b.r + 2;
        if (d2 < rr * rr && d2 > 0.01) {
          const d = Math.sqrt(d2), o = (rr - d) / d * 0.5, ma = b.r / (a.r + b.r), mb = 1 - ma;
          a.x -= dx * o * ma; a.y -= dy * o * ma; b.x += dx * o * mb; b.y += dy * o * mb;
          const rv = ((b.vx - a.vx) * dx + (b.vy - a.vy) * dy) / d;
          if (rv < 0) { const imp = rv * 0.4 / d; a.vx += dx * imp * ma; a.vy += dy * imp * ma; b.vx -= dx * imp * mb; b.vy -= dy * imp * mb; }
        }
      }
    }
    for (const s of shards) { s.life -= 0.025 * dt; if (!s.ring) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 0.05 * dt; } }
    shards = shards.filter(s => s.life > 0);
  }
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  function drawBubbles(now) {
    bx.clearRect(0, 0, W, H);
    // auras, additive for vibrant glow
    bx.globalCompositeOperation = 'lighter';
    for (const b of bubbles) {
      if (b.gone > 0) continue;
      const c = b.safe ? COLORS.safe : COLORS[b.tier];
      const hot = !b.safe && (b.tier === 'risk' || b.tier === 'high');
      const p = hot ? 0.75 + 0.25 * Math.sin(now / (b.tier === 'high' ? 160 : 260) + b.phase) : 0.7;
      const R = b.r * (hot ? 1.85 : 1.6);
      const g = bx.createRadialGradient(b.x, b.y, b.r * 0.7, b.x, b.y, R);
      g.addColorStop(0, rgba(c, (hot ? 0.75 : 0.5) * p * b.fade)); g.addColorStop(1, rgba(c, 0));
      bx.fillStyle = g; bx.beginPath(); bx.arc(b.x, b.y, R, 0, 6.283); bx.fill();
    }
    bx.globalCompositeOperation = 'source-over';
    for (const b of bubbles) {
      if (b.gone > 0) continue;
      const c = b.safe ? COLORS.safe : COLORS[b.tier];
      bx.globalAlpha = b.fade;
      const g = bx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
      g.addColorStop(0, rgba(c, 0.10)); g.addColorStop(0.75, rgba(c, 0.28)); g.addColorStop(1, rgba(c, 0.62));
      bx.fillStyle = g; bx.beginPath(); bx.arc(b.x, b.y, b.r, 0, 6.283); bx.fill();
      bx.lineWidth = b.safe ? 3 : 1.6; bx.strokeStyle = rgba(c, 0.95); bx.stroke();
      if (b.safe) { bx.setLineDash([4, 4]); bx.beginPath(); bx.arc(b.x, b.y, b.r + 5, 0, 6.283); bx.stroke(); bx.setLineDash([]); }
      bx.fillStyle = 'rgba(255,255,255,.16)';
      bx.beginPath(); bx.ellipse(b.x - b.r * 0.35, b.y - b.r * 0.45, b.r * 0.32, b.r * 0.16, -0.6, 0, 6.283); bx.fill();
      const sym = b.coin.symbol.toUpperCase();
      const fs = Math.max(8, Math.min(b.r * 0.5, b.r * 1.5 / Math.max(2.5, sym.length * 0.62)));
      bx.fillStyle = '#fff'; bx.textAlign = 'center'; bx.textBaseline = 'middle';
      bx.font = '700 ' + fs + 'px Sora, Inter, sans-serif';
      if (b.r > 24) {
        bx.fillText(sym, b.x, b.y - fs * 0.32);
        bx.font = '500 ' + Math.max(8, fs * 0.5) + 'px Inter, sans-serif';
        bx.fillStyle = 'rgba(255,255,255,.85)';
        bx.fillText(b.safe ? 'PQ SAFE' : pct(b.coin.chg24), b.x, b.y + fs * 0.55);
      } else if (b.r > 11) bx.fillText(sym.slice(0, 5), b.x, b.y);
      bx.globalAlpha = 1;
    }
    for (const s of shards) {
      bx.globalAlpha = Math.max(0, s.life);
      if (s.ring) { bx.strokeStyle = rgba(s.c, 0.9); bx.lineWidth = 3 * s.life; bx.beginPath(); bx.arc(s.x, s.y, s.r * (1 + (1 - s.life) * 1.2), 0, 6.283); bx.stroke(); }
      else { bx.fillStyle = rgba(s.c, 1); bx.beginPath(); bx.arc(s.x, s.y, 2.4, 0, 6.283); bx.fill(); }
    }
    bx.globalAlpha = 1;
  }

  /* ---------- loop ---------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(3, (now - last) / 16.67); last = now;
    warp = Math.max(0, warp - 0.008 * dt);
    if (mode === 'game') tick(dt);
    drawSpace(dt); step(dt); drawBubbles(now);
    requestAnimationFrame(frame);
  }

  /* ---------- input ---------- */
  function pick(x, y) {
    let best = null;
    for (const b of bubbles) {
      if (b.gone > 0) continue;
      const d = Math.hypot(b.x - x, b.y - y);
      if (d <= b.r + 6 && (!best || b.r < best.r)) best = b;
    }
    return best;
  }
  bc.addEventListener('pointerdown', e => {
    const b = pick(e.clientX, e.clientY);
    if (!b) { if (mode === 'explore') closePanels(); return; }
    if (mode === 'game') migrate(b); else openCoin(b);
  });

  /* ---------- game ---------- */
  function hud() {
    if (!game) return;
    const left = Math.max(0, Math.ceil(game.len - game.t));
    $('clock').textContent = left; $('clock').classList.toggle('low', left <= 10);
    $('score').textContent = game.score; $('streak').textContent = game.streak; $('popped').textContent = game.popped;
  }
  function start() {
    closePanels(); $('result').hidden = true;
    bubbles.forEach(b => { b.safe = false; });
    game = { t: 0, len: 60, score: 0, streak: 0, best: 0, popped: 0, migrated: 0, shielded: 0, lost: 0, grid: [] };
    mode = 'game'; warp = 1; $('hud').hidden = false; $('legend').hidden = true;
    $('play').textContent = 'End round'; hud(); flash('Q-DAY INCOMING', COLORS.risk);
  }
  function tick(dt) {
    const before = Math.ceil(game.len - game.t);
    game.t += dt / 60;
    if (Math.ceil(game.len - game.t) !== before) hud();
    if (game.t >= game.len) end();
  }
  function migrate(b) {
    if (b.safe) return;
    if (b.tier === 'risk' || b.tier === 'high') {
      b.safe = true; b.vy = 1.5;
      game.streak++; game.best = Math.max(game.best, game.streak); game.migrated++;
      game.score += 100 + game.streak * 15 + (b.tier === 'high' ? 50 : 0);
      game.shielded += b.coin.mcap; game.grid.push('🟩');
      flash('MIGRATED ' + b.coin.symbol.toUpperCase() + (game.streak > 2 ? '  x' + game.streak : ''), COLORS.lower);
    } else {
      game.streak = 0; game.score = Math.max(0, game.score - 25);
      flash(b.tier === 'lower' ? 'Lower exposure, leave it' : 'Watch tier, not urgent', COLORS.watch);
    }
    hud();
  }
  function end() {
    mode = 'explore'; warp = 1; $('hud').hidden = true; $('legend').hidden = false; $('play').textContent = 'Start Q-Day';
    drawCard(); $('result').hidden = false;
  }
  function shareText() {
    const g = game, grid = g.grid.slice(-30).join('');
    return 'Quantum Helium Maps\nScore ' + g.score + ' · migrated ' + g.migrated + ' · popped ' + g.popped + ' · best streak ' + g.best +
      '\nShielded ' + usd.format(g.shielded) + ' of market cap before Q-Day\n' + grid;
  }
  function drawCard() {
    const c = $('cardCanvas'), x = c.getContext('2d'), S = 1080, g = game;
    const bg = x.createLinearGradient(0, 0, S, S); bg.addColorStop(0, '#060a24'); bg.addColorStop(1, '#14051c');
    x.fillStyle = bg; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 160; i++) { x.fillStyle = 'rgba(200,215,255,' + Math.random() * 0.8 + ')'; x.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
    const orb = (cx, cy, r, col) => { const gr = x.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.8); gr.addColorStop(0, rgba(col, 0.7)); gr.addColorStop(1, rgba(col, 0)); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r * 1.8, 0, 6.283); x.fill(); x.strokeStyle = rgba(col, 1); x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, r, 0, 6.283); x.stroke(); };
    orb(880, 190, 90, COLORS.risk); orb(170, 900, 70, COLORS.lower); orb(960, 820, 40, COLORS.high);
    x.textAlign = 'left'; x.fillStyle = '#fff';
    x.font = '700 64px Sora, sans-serif'; x.fillText('Quantum Helium Maps', 80, 150);
    x.font = '400 30px Inter, sans-serif'; x.fillStyle = '#9aa3c7'; x.fillText('StarSwarm Agentic Security', 80, 200);
    x.font = '800 200px Sora, sans-serif'; x.fillStyle = '#fff'; x.fillText(String(g.score), 80, 460);
    x.font = '500 34px Inter, sans-serif'; x.fillStyle = '#cdd3f0'; x.fillText('Q-Day defense score', 86, 515);
    const rows = [['Migrated to post-quantum', g.migrated, COLORS.lower], ['Popped by Q-Day', g.popped, COLORS.risk], ['Best streak', g.best, [160, 190, 255]], ['Market cap shielded', usd.format(g.shielded), COLORS.safe]];
    rows.forEach((r, i) => { const y = 610 + i * 70; x.fillStyle = rgba(r[2], 1); x.beginPath(); x.arc(100, y - 12, 12, 0, 6.283); x.fill(); x.fillStyle = '#e9edff'; x.font = '500 36px Inter, sans-serif'; x.fillText(r[0], 130, y); x.font = '700 40px Sora, sans-serif'; x.textAlign = 'right'; x.fillText(String(r[1]), 1000, y); x.textAlign = 'left'; });
    const dots = g.grid.slice(-30);
    dots.forEach((d, i) => { x.fillStyle = d === '🟩' ? rgba(COLORS.lower, 1) : rgba(COLORS.risk, 1); x.beginPath(); x.arc(300 + (i % 15) * 46, 930 + Math.floor(i / 15) * 46, 16, 0, 6.283); x.fill(); });
    x.font = '400 24px Inter, sans-serif'; x.fillStyle = '#7d86ad'; x.fillText('A game. Risk colors are an estimate, not advice.', 80, 1040);
  }
  function flash(t, c) {
    const el = $('toast'); el.textContent = t; el.style.color = rgba(c, 1); el.classList.add('on');
    clearTimeout(flash.t); flash.t = setTimeout(() => el.classList.remove('on'), 700);
  }

  /* ---------- panels ---------- */
  function closePanels() { $('panel').hidden = true; $('explain').hidden = true; }
  function openCoin(b) {
    const c = b.coin, r = b.risk;
    $('explain').hidden = true;
    $('pName').textContent = c.name; $('pSym').textContent = c.symbol; $('pRank').textContent = '#' + (c.rank || '–');
    $('pPrice').textContent = price(c.price); $('pCap').textContent = usd.format(c.mcap);
    const ch = $('pChg'); ch.textContent = pct(c.chg24); ch.className = c.chg24 >= 0 ? 'up' : 'down';
    const col = COLORS[r.tier], label = { lower: 'Lower exposure', watch: 'Watch', risk: 'At risk', high: 'Key always visible' }[r.tier];
    const box = $('pRisk'); box.style.borderColor = rgba(col, 0.6); box.style.background = rgba(col, 0.07);
    box.innerHTML = '';
    const h = document.createElement('b'); h.style.color = rgba(col, 1); h.textContent = 'Quantum exposure estimate: ' + label + ' (' + r.score + '/100)'; box.appendChild(h);
    const m = document.createElement('div'); m.className = 'meter'; const i = document.createElement('i'); i.style.left = 'calc(' + r.score + '% - 2px)'; m.appendChild(i); box.appendChild(m);
    const p1 = document.createElement('div'); p1.textContent = r.host + '. ' + r.why; box.appendChild(p1);
    const s = document.createElement('small'); s.textContent = (r.classified ? '' : 'Chain not classified yet. ') + 'Heuristic from signature scheme and key-exposure model, not a measurement or advice.'; box.appendChild(s);
    $('panel').hidden = false;
    drawSpark(c.spark || [], c.chg24 >= 0);
  }
  function drawSpark(pts, up) {
    const cv = $('spark'), w = cv.clientWidth || 340, h = 140, x = cv.getContext('2d');
    cv.width = w * DPR; cv.height = h * DPR; x.setTransform(DPR, 0, 0, DPR, 0, 0); x.clearRect(0, 0, w, h);
    if (pts.length < 2) { x.fillStyle = '#9aa3c7'; x.font = '13px Inter'; x.fillText('No 7 day data', 10, 70); return; }
    const first = pts[0], lastP = pts[pts.length - 1], wk = lastP >= first;
    const col = wk ? COLORS.lower : COLORS.risk;
    const lo = Math.min(...pts), hi = Math.max(...pts), pad = 14, sp = hi - lo || 1;
    const X = i => pad + (i / (pts.length - 1)) * (w - pad * 2), Y = v => pad + (1 - (v - lo) / sp) * (h - pad * 2);
    x.strokeStyle = 'rgba(140,160,255,.12)'; x.lineWidth = 1;
    for (let k = 0; k < 4; k++) { const y = pad + k * (h - pad * 2) / 3; x.beginPath(); x.moveTo(pad, y); x.lineTo(w - pad, y); x.stroke(); }
    x.beginPath(); pts.forEach((v, i) => i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v)));
    const path = new Path2D(); pts.forEach((v, i) => i ? path.lineTo(X(i), Y(v)) : path.moveTo(X(i), Y(v)));
    const fill = new Path2D(path); fill.lineTo(X(pts.length - 1), h - pad); fill.lineTo(X(0), h - pad); fill.closePath();
    const g = x.createLinearGradient(0, pad, 0, h); g.addColorStop(0, rgba(col, 0.35)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fill(fill);
    x.shadowColor = rgba(col, 0.9); x.shadowBlur = 10; x.strokeStyle = rgba(col, 1); x.lineWidth = 2; x.stroke(path); x.shadowBlur = 0;
    x.fillStyle = '#9aa3c7'; x.font = '11px Inter, sans-serif'; x.textAlign = 'right';
    x.fillText(price(hi), w - pad, pad - 2); x.fillText(price(lo), w - pad, h - 2);
  }

  /* ---------- data ---------- */
  async function load() {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(API, { signal: ctrl.signal });
      if (!res.ok) throw new Error('http ' + res.status);
      const d = await res.json();
      if (!Array.isArray(d) || d.length < 20) throw new Error('bad data');
      const coins = d.map(c => ({ id: c.id, symbol: c.symbol, name: c.name, price: c.current_price, mcap: c.market_cap, rank: c.market_cap_rank, chg24: c.price_change_percentage_24h, spark: (c.sparkline_in_7d || {}).price || [] }));
      dataInfo = { live: true, text: 'Live · CoinGecko top ' + coins.length + ' · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };
      return coins;
    } catch (e) {
      const d = await (await fetch('data/sample.json')).json();
      dataInfo = { live: false, text: 'Offline sample · ' + d.label.replace('Offline sample: ', '') + ', ' + d.taken };
      return d.coins;
    } finally { clearTimeout(t); }
  }

  /* ---------- wire up ---------- */
  document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { closePanels(); $('result').hidden = true; }));
  $('how').onclick = () => { $('panel').hidden = true; $('explain').hidden = !$('explain').hidden; };
  $('play').onclick = () => mode === 'game' ? end() : start();
  $('again').onclick = start;
  $('copy').onclick = async () => { try { await navigator.clipboard.writeText(shareText()); flash('Copied', COLORS.lower); } catch (e) { flash('Copy blocked', COLORS.watch); } };
  $('save').onclick = () => { const a = document.createElement('a'); a.download = 'quantum-helium-maps-score.png'; a.href = $('cardCanvas').toDataURL('image/png'); a.click(); };
  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
  load().then(coins => {
    makeBubbles(coins);
    const b = $('badge'); b.textContent = dataInfo.text; b.className = 'badge ' + (dataInfo.live ? 'live' : 'sample');
    if (/[?&]demo=panel/.test(location.search)) { const s = bubbles.find(x => x.coin.id === 'solana') || bubbles[0]; openCoin(s); }
    if (/[?&]demo=game/.test(location.search)) start();
  });
})();
