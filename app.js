(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const API = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h';
  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 });
  const price = v => v == null ? '–' : v >= 1 ? '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '$' + v.toPrecision(4);
  const pct = v => v == null ? '–' : (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  const RED = [228, 35, 63], AMBER = [232, 168, 74], GREEN = [30, 214, 122], GREY = [176, 170, 158], LIQ = [64, 222, 140];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  function tone(s) { // 0..~55 -> red..amber..green
    if (s == null) return GREY;
    const t = Math.max(0, Math.min(1, s / 50));
    return t < 0.6 ? mix(RED, AMBER, t / 0.6) : mix(AMBER, GREEN, (t - 0.6) / 0.4);
  }

  /* ---------- canvas ---------- */
  const cv = $('bubbles'), cx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, bubbles = [], sizeMode = 'cap', drag = null;
  const pad = () => ({ top: W < 640 ? 150 : 96, bottom: W < 640 ? 120 : 76 });
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const oW = W, oH = H; W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (oW && oH) bubbles.forEach(b => { b.x *= W / oW; b.y *= H / oH; });
    if (bubbles.length) sizeBubbles();
  }
  function sizeBubbles() {
    const area = W * H * (W < 640 ? 0.27 : 0.33);
    const w = bubbles.map(b => sizeMode === 'cap' ? Math.pow(Math.max(b.coin.mcap || 1, 1), 0.62) : 4 + (b.p.score || 0));
    const k = Math.sqrt(area / (Math.PI * w.reduce((a, c) => a + c * c, 0)));
    const maxR = Math.min(W, H) * (W < 640 ? 0.17 : 0.14), minR = 12;
    bubbles.forEach((b, i) => { b.tr = Math.max(minR, Math.min(maxR, w[i] * k)); if (!b.r) b.r = b.tr; });
  }
  // helium: low progress floats high, high progress settles low
  function homeY(b) {
    const { top, bottom } = pad(), s = b.p.score == null ? 20 : b.p.score;
    const t = Math.max(0, Math.min(1, s / 55));
    return top + b.r + t * (H - top - bottom - 2 * b.r);
  }
  function makeBubbles(coins) {
    bubbles = coins.filter(c => c.mcap > 0).slice(0, 100).map(c => ({ coin: c, p: window.QHM_PROGRESS(c), x: 0, y: 0, vx: 0, vy: 0, r: 0, tr: 0, ph: Math.random() * 6.28, lvl: 0 }));
    sizeBubbles();
    bubbles.forEach(b => { b.x = b.r + Math.random() * (W - 2 * b.r); b.y = homeY(b) + (Math.random() - 0.5) * 80; });
  }
  function step(dt) {
    const { top, bottom } = pad();
    for (const b of bubbles) {
      b.r += (b.tr - b.r) * 0.08 * dt;
      b.ph += 0.012 * dt;
      b.lvl += ((b.p.score || 0) / 100 - b.lvl) * 0.03 * dt;
      if (b === drag?.b) continue;
      b.vy += (homeY(b) - b.y) * 0.0012 * dt;
      b.vx += Math.sin(b.ph) * 0.006 * dt;
      b.vx *= Math.pow(0.975, dt); b.vy *= Math.pow(0.975, dt);
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.6; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.6; }
      if (b.y < top * 0.6 + b.r) { b.y = top * 0.6 + b.r; b.vy = Math.abs(b.vy) * 0.6; }
      if (b.y > H - bottom * 0.7 - b.r) { b.y = H - bottom * 0.7 - b.r; b.vy = -Math.abs(b.vy) * 0.6; }
    }
    for (let i = 0; i < bubbles.length; i++) {
      const a = bubbles[i];
      for (let j = i + 1; j < bubbles.length; j++) {
        const b = bubbles[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, rr = a.r + b.r + 2;
        if (d2 < rr * rr && d2 > 0.01) {
          const d = Math.sqrt(d2), o = (rr - d) / d * 0.5;
          let ma = b.r / (a.r + b.r), mb = 1 - ma;
          if (drag?.b === a) { ma = 0; mb = 1; } else if (drag?.b === b) { ma = 1; mb = 0; }
          a.x -= dx * o * ma; a.y -= dy * o * ma; b.x += dx * o * mb; b.y += dy * o * mb;
          const rv = ((b.vx - a.vx) * dx + (b.vy - a.vy) * dy) / d;
          if (rv < 0) { const imp = rv * 0.5 / d; a.vx += dx * imp * ma; a.vy += dy * imp * ma; b.vx -= dx * imp * mb; b.vy -= dy * imp * mb; }
        }
      }
    }
  }
  function draw(now) {
    cx.clearRect(0, 0, W, H);
    for (const b of bubbles) {
      const c = tone(b.p.score), low = b.p.score != null && b.p.score < 25;
      const pulse = low ? 0.72 + 0.28 * Math.sin(now / 340 + b.ph) : 1;
      const R = b.r * (low ? 2.25 : 1.9);
      const g = cx.createRadialGradient(b.x, b.y, b.r * 0.15, b.x, b.y, R);
      g.addColorStop(0, rgba(c, (b.p.known ? 0.38 : 0.12) * pulse));
      g.addColorStop(0.5, rgba(c, (b.p.known ? 0.12 : 0.04) * pulse));
      g.addColorStop(1, rgba(c, 0));
      cx.fillStyle = g; cx.beginPath(); cx.arc(b.x, b.y, R, 0, 6.283); cx.fill();
    }
    for (const b of bubbles) {
      const c = tone(b.p.score), r = b.r;
      const shell = cx.createRadialGradient(b.x - r * 0.32, b.y - r * 0.38, r * 0.05, b.x, b.y, r);
      shell.addColorStop(0, 'rgba(255,255,255,.42)');
      shell.addColorStop(0.16, 'rgba(255,255,255,.08)');
      shell.addColorStop(0.42, 'rgba(8,10,16,.42)');
      shell.addColorStop(0.78, rgba(c, 0.16));
      shell.addColorStop(1, rgba(c, 0.82));
      cx.fillStyle = shell; cx.beginPath(); cx.arc(b.x, b.y, r, 0, 6.283); cx.fill();
      if (b.p.known) {
        const gas = cx.createRadialGradient(b.x, b.y + r * 0.2, r * 0.05, b.x, b.y, r * 0.92);
        gas.addColorStop(0, rgba(c, 0.05 + b.lvl * 0.22));
        gas.addColorStop(1, rgba(c, 0));
        cx.fillStyle = gas; cx.beginPath(); cx.arc(b.x, b.y, r - 2, 0, 6.283); cx.fill();
      }
      if (b.p.known && b.lvl > 0.005) {
        cx.save(); cx.beginPath(); cx.arc(b.x, b.y, r - 1.6, 0, 6.283); cx.clip();
        const ly = b.y + r - b.lvl * 2 * r, amp = Math.max(1.2, r * 0.055);
        cx.beginPath(); cx.moveTo(b.x - r, b.y + r);
        for (let x = -r; x <= r; x += Math.max(2, r / 10)) cx.lineTo(b.x + x, ly + Math.sin(x / r * 4 + now / 420 + b.ph) * amp);
        cx.lineTo(b.x + r, b.y + r); cx.closePath();
        const lg = cx.createLinearGradient(0, ly, 0, b.y + r);
        lg.addColorStop(0, rgba([186, 255, 214], 0.95));
        lg.addColorStop(0.18, rgba(LIQ, 0.82));
        lg.addColorStop(1, rgba([10, 92, 54], 0.9));
        cx.shadowColor = rgba(LIQ, 0.9); cx.shadowBlur = Math.min(16, r * 0.45);
        cx.fillStyle = lg; cx.fill(); cx.shadowBlur = 0;
        cx.restore();
      }
      cx.lineWidth = drag?.b === b ? 2.6 : 1.35; cx.strokeStyle = rgba(c, b.p.known ? 0.92 : 0.55);
      if (!b.p.known) cx.setLineDash([3.5, 3.5]);
      cx.beginPath(); cx.arc(b.x, b.y, r - 0.6, 0, 6.283); cx.stroke(); cx.setLineDash([]);
      cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.lineWidth = Math.max(1.1, r * 0.055); cx.lineCap = 'round';
      cx.beginPath(); cx.arc(b.x, b.y, r * 0.78, -2.45, -0.85); cx.stroke(); cx.lineCap = 'butt';
      cx.fillStyle = 'rgba(255,255,255,.72)';
      cx.beginPath(); cx.ellipse(b.x - r * 0.3, b.y - r * 0.36, r * 0.2, r * 0.09, -0.7, 0, 6.283); cx.fill();
      const sym = b.coin.symbol.toUpperCase(), fs = Math.max(8, Math.min(r * 0.46, r * 1.5 / Math.max(2.5, sym.length * 0.62)));
      cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#f7f4ee';
      cx.shadowColor = 'rgba(0,0,0,.85)'; cx.shadowBlur = 5;
      cx.font = '700 ' + fs + 'px "Space Grotesk", sans-serif';
      const lab = b.p.known ? b.p.score + '%' : '?';
      if (r > 22) {
        cx.fillText(sym, b.x, b.y - fs * 0.3);
        cx.font = '600 ' + Math.max(8, fs * 0.55) + 'px Manrope, sans-serif';
        cx.fillText(lab, b.x, b.y + fs * 0.58);
      } else if (r > 11) cx.fillText(sym.slice(0, 5), b.x, b.y);
      cx.shadowBlur = 0;
    }
  }
  let last = performance.now();
  function frame(now) { const dt = Math.min(3, (now - last) / 16.67); last = now; step(dt); draw(now); requestAnimationFrame(frame); }

  /* ---------- drag, fling, click ---------- */
  function pick(x, y) { let best = null; for (const b of bubbles) { if (Math.hypot(b.x - x, b.y - y) <= b.r + 4 && (!best || b.r < best.r)) best = b; } return best; }
  cv.addEventListener('pointerdown', e => {
    const b = pick(e.clientX, e.clientY);
    if (!b) { closePanels(); return; }
    cv.setPointerCapture(e.pointerId);
    drag = { b, id: e.pointerId, ox: b.x - e.clientX, oy: b.y - e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), hist: [[e.clientX, e.clientY, performance.now()]], moved: false };
  });
  cv.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) { cv.style.cursor = pick(e.clientX, e.clientY) ? 'grab' : 'default'; return; }
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
    drag.b.x = e.clientX + drag.ox; drag.b.y = e.clientY + drag.oy; drag.b.vx = drag.b.vy = 0;
    drag.hist.push([e.clientX, e.clientY, performance.now()]); if (drag.hist.length > 6) drag.hist.shift();
    cv.style.cursor = 'grabbing';
  });
  function release(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const b = drag.b;
    if (!drag.moved && performance.now() - drag.t < 450) openCoin(b);
    else { const h = drag.hist, a = h[0], z = h[h.length - 1], dt = Math.max(16, z[2] - a[2]) / 16.67; b.vx = Math.max(-40, Math.min(40, (z[0] - a[0]) / dt)); b.vy = Math.max(-40, Math.min(40, (z[1] - a[1]) / dt)); }
    drag = null; cv.style.cursor = 'grab';
  }
  cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);

  /* ---------- panels ---------- */
  function closePanels() { $('panel').hidden = true; $('explain').hidden = true; }
  function openCoin(b) {
    const c = b.coin, p = b.p; $('explain').hidden = true;
    $('pName').textContent = c.name; $('pSym').textContent = c.symbol; $('pRank').textContent = '#' + (c.rank || '–');
    $('pPrice').textContent = price(c.price); $('pCap').textContent = usd.format(c.mcap);
    const ch = $('pChg'); ch.textContent = pct(c.chg24); ch.className = c.chg24 >= 0 ? 'up' : 'down';
    const col = tone(p.score);
    $('pScore').textContent = p.known ? p.score + '%' : 'Unknown'; $('pScore').style.color = rgba(p.known ? col : GREY, 1);
    $('pFill').style.width = (p.score || 0) + '%';
    $('pChain').textContent = !p.known ? 'Not classified yet, so it is not scored.' : p.native ? 'Scored on ' + p.chain + '.' : 'Token, scored on its host chain: ' + p.chain + '.';
    const list = $('pFactors'); list.innerHTML = '';
    for (const f of p.factors) {
      const li = document.createElement('li');
      const top = document.createElement('div'); top.className = 'fx';
      const n = document.createElement('span'); n.textContent = f.name;
      const v = document.createElement('b'); v.textContent = f.pts == null ? 'unknown' : f.pts + ' / ' + f.max;
      top.append(n, v);
      const bar = document.createElement('div'); bar.className = 'fbar'; const i = document.createElement('i'); i.style.width = (f.pts ? f.pts / f.max * 100 : 0) + '%'; bar.appendChild(i);
      const s = document.createElement('p'); s.textContent = f.status + (f.note ? '. ' + f.note : '');
      li.append(top, bar, s); list.appendChild(li);
    }
    $('panel').hidden = false;
    drawSpark(c.spark || []);
  }
  function drawSpark(pts) {
    const el = $('spark'), w = el.clientWidth || 340, h = 130, x = el.getContext('2d');
    el.width = w * DPR; el.height = h * DPR; x.setTransform(DPR, 0, 0, DPR, 0, 0); x.clearRect(0, 0, w, h);
    if (pts.length < 2) { x.fillStyle = '#c4bbaa'; x.font = '13px Manrope'; x.fillText('No 7 day data', 10, 65); return; }
    const col = pts[pts.length - 1] >= pts[0] ? GREEN : RED, lo = Math.min(...pts), hi = Math.max(...pts), p = 12, sp = hi - lo || 1;
    const X = i => p + i / (pts.length - 1) * (w - 2 * p), Y = v => p + (1 - (v - lo) / sp) * (h - 2 * p);
    x.strokeStyle = 'rgba(232,214,180,.14)'; for (let k = 0; k < 4; k++) { const y = p + k * (h - 2 * p) / 3; x.beginPath(); x.moveTo(p, y); x.lineTo(w - p, y); x.stroke(); }
    const path = new Path2D(); pts.forEach((v, i) => i ? path.lineTo(X(i), Y(v)) : path.moveTo(X(i), Y(v)));
    const fill = new Path2D(path); fill.lineTo(X(pts.length - 1), h - p); fill.lineTo(X(0), h - p); fill.closePath();
    const g = x.createLinearGradient(0, p, 0, h); g.addColorStop(0, rgba(col, 0.35)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fill(fill);
    x.shadowColor = rgba(col, 1); x.shadowBlur = 10; x.strokeStyle = rgba(col, 1); x.lineWidth = 2; x.stroke(path); x.shadowBlur = 0;
    x.fillStyle = '#d9cbb6'; x.font = '11px Manrope, sans-serif'; x.textAlign = 'right'; x.fillText(price(hi), w - p, p - 1); x.fillText(price(lo), w - p, h - 1);
  }

  /* ---------- data ---------- */
  async function load() {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(API, { signal: ctrl.signal }); if (!res.ok) throw 0;
      const d = await res.json(); if (!Array.isArray(d) || d.length < 20) throw 0;
      return { live: true, text: 'Live · CoinGecko top ' + d.length + ' · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        coins: d.map(c => ({ id: c.id, symbol: c.symbol, name: c.name, price: c.current_price, mcap: c.market_cap, rank: c.market_cap_rank, chg24: c.price_change_percentage_24h, spark: (c.sparkline_in_7d || {}).price || [] })) };
    } catch (e) {
      const d = await (await fetch('data/sample.json')).json();
      return { live: false, text: 'Offline sample · CoinGecko snapshot ' + d.taken, coins: d.coins };
    } finally { clearTimeout(t); }
  }

  document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closePanels));
  $('how').onclick = () => { $('panel').hidden = true; $('explain').hidden = !$('explain').hidden; };
  document.querySelectorAll('.tabs button').forEach(bt => bt.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === bt)); sizeMode = bt.dataset.size; sizeBubbles();
  }));
  $('shake').onclick = () => bubbles.forEach(b => { b.vx += (Math.random() - 0.5) * 30; b.vy += (Math.random() - 0.5) * 30; });
  addEventListener('resize', resize); resize(); requestAnimationFrame(frame);
  load().then(d => {
    makeBubbles(d.coins);
    const bd = $('badge'); bd.textContent = d.text; bd.classList.add(d.live ? 'live' : 'sample');
    if (/[?&]demo=panel/.test(location.search)) openCoin(bubbles.find(x => x.coin.id === 'bitcoin') || bubbles[0]);
  });
})();
