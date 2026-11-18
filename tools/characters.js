/* Characters: the Character Playground engine. Surface samples become a depth-tested character grid that scatters under the pointer. */
(() => {
  'use strict';
  const { util, register, ratioOptions, resolutionOptions, h, icon } = FieldKit;

  // Kept as one self-contained function so Interactive HTML export can embed its source verbatim.
  function characterEngine() {
    const TAU = Math.PI * 2;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function surface(shape, seed) {
      const points = [];
      const put = (x, y, z, nx, ny, nz) => points.push([x, y, z, nx, ny, nz]);
      const tube = (path, count, radius) => {
        for (let i = 0; i < count; i++) {
          const t = i / count * TAU, p = path(t), q = path(t + .001);
          let tx = q[0] - p[0], ty = q[1] - p[1], tz = q[2] - p[2];
          const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          let ax = -ty, ay = tx; const az = 0; let al = Math.hypot(ax, ay) || 1;
          if (Math.abs(tz) > .99) { ax = 1; ay = 0; al = 1; } ax /= al; ay /= al;
          const bx = ty * az - tz * ay, by = tz * ax - tx * az, bz = tx * ay - ty * ax;
          for (let j = 0; j < 32; j++) { const a = j / 32 * TAU, c = Math.cos(a), s = Math.sin(a), nx = ax * c + bx * s, ny = ay * c + by * s, nz = az * c + bz * s; put(p[0] + radius * nx, p[1] + radius * ny, p[2] + radius * nz, nx, ny, nz); }
        }
      };
      if (shape === 'ring' || shape === 'flower') {
        tube(t => { const r = shape === 'flower' ? .65 + .18 * Math.cos(t * 5) : .72; return [r * Math.cos(t), r * Math.sin(t), 0]; }, 300, shape === 'flower' ? .13 : .185);
      } else if (shape === 'knot') {
        tube(t => [(.58 + .19 * Math.cos(3 * t)) * Math.cos(2 * t), (.58 + .19 * Math.cos(3 * t)) * Math.sin(2 * t), .24 * Math.sin(3 * t)], 440, .125);
      } else if (shape === 'cube') {
        for (let axis = 0; axis < 3; axis++) for (const a of [-1, 1]) for (const b of [-1, 1]) {
          for (let i = 0; i < 110; i++) for (let j = 0; j < 28; j++) {
            const p = [0, 0, 0], n = [0, 0, 0], u = (axis + 1) % 3, v = (axis + 2) % 3, t = j / 28 * TAU;
            p[axis] = (i / 109 * 2 - 1) * .57; p[u] = a * .57 + .075 * Math.cos(t); p[v] = b * .57 + .075 * Math.sin(t); n[u] = Math.cos(t); n[v] = Math.sin(t); put(...p, ...n);
          }
        }
      } else if (shape === 'leaf') {
        for (let i = 1; i < 180; i++) for (let j = 0; j < 80; j++) {
          const t = i / 180, u = j / 79 * 2 - 1, y = t * 1.65 - .8, w = .36 * Math.pow(Math.sin(t * Math.PI), .9);
          put(w * u + .1 * Math.sin(t * Math.PI), y, .12 * (1 - u * u) * Math.sin(t * Math.PI), u * .4, 0, 1);
        }
        tube(t => { const s = t / TAU; return [-.02 - s * .12, -.78 - s * .43, 0]; }, 80, .018);
      } else if (shape === 'mushroom') {
        for (let i = 0; i < 130; i++) for (let j = 0; j < 80; j++) {
          const a = i / 130 * TAU, b = j / 79 * Math.PI / 2;
          put(.83 * Math.cos(a) * Math.sin(b), .1 + .58 * Math.cos(b), .83 * Math.sin(a) * Math.sin(b), Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b));
        }
        for (let i = 0; i < 130; i++) for (let j = 0; j < 70; j++) { const a = i / 130 * TAU, t = j / 69, r = .16 + .06 * t; put(r * Math.cos(a), .11 - t * .88, r * Math.sin(a), Math.cos(a), 0, Math.sin(a)); }
      } else {
        for (let i = 0; i < 180; i++) for (let j = 1; j < 100; j++) {
          const a = i / 180 * TAU, b = j / 100 * Math.PI, nx = Math.sin(b) * Math.cos(a), ny = Math.cos(b), nz = Math.sin(b) * Math.sin(a);
          const r = shape === 'blob' ? .73 + .13 * Math.sin(a * 3 + seed) * Math.pow(Math.sin(b), 2) + .09 * Math.cos(b * 4 + seed) : .78;
          put(r * nx, r * ny, r * nz, nx, ny, nz);
        }
      }
      return points;
    }
    class CharacterArt {
      constructor(canvas, settings, onCount = () => {}) {
        this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.settings = { ...settings }; this.onCount = onCount;
        this.pointer = { x: -9999, y: -9999, active: false }; this.particles = new Map(); this.time = 0; this.last = 0; this.drawn = []; this.visible = true;
        this.reduce = matchMedia('(prefers-reduced-motion: reduce)'); this.fine = matchMedia('(hover: hover) and (pointer: fine)');
        this.resize = () => { const r = canvas.getBoundingClientRect(); this.width = r.width || 800; this.height = r.height || 680; const d = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(this.width * d); canvas.height = Math.round(this.height * d); this.ctx.setTransform(d, 0, 0, d, 0, 0); this.last = 0; };
        this.observer = new ResizeObserver(this.resize); this.observer.observe(canvas); this.resize();
        this.visibilityObserver = new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; this.last = 0; if (!this.visible) this.pointer.active = false; }); this.visibilityObserver.observe(canvas);
        this.move = e => { if (e.pointerType === 'mouse' && !this.fine.matches) return; if (e.pointerType !== 'mouse' && !this.dragging) return; const r = canvas.getBoundingClientRect(); this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top, active: true }; };
        canvas.addEventListener('pointermove', this.move);
        canvas.addEventListener('pointerdown', e => { if (!e.isPrimary) return; this.dragging = true; canvas.setPointerCapture(e.pointerId); this.move(e); });
        const leave = () => { this.pointer.active = false; this.dragging = false; };
        canvas.addEventListener('pointerleave', () => { if (!this.dragging) leave(); }); canvas.addEventListener('pointerup', leave); canvas.addEventListener('pointercancel', leave); canvas.addEventListener('lostpointercapture', leave);
        this.update(settings); this.tick = this.tick.bind(this); this.raf = requestAnimationFrame(this.tick);
      }
      update(next) { const old = this.settings; this.settings = { ...old, ...next }; if (!this.points || old.shape !== this.settings.shape || old.seed !== this.settings.seed) { this.points = surface(this.settings.shape, this.settings.seed); this.particles.clear(); } if (old.density !== this.settings.density) this.particles.clear(); this.canvas.style.background = this.settings.background; this.last = 0; }
      tick(now) { this.raf = requestAnimationFrame(this.tick); if (document.hidden || !this.visible) { this.last = 0; return; } if (this.last && now - this.last < 32) return; const dt = this.last ? Math.min((now - this.last) / 1000, .05) : 1 / 30; this.last = now; if (!this.settings.paused && !this.reduce.matches) this.time += dt; this.render(dt); }
      destroy() { cancelAnimationFrame(this.raf); this.observer.disconnect(); this.visibilityObserver.disconnect(); }
      scatterOnce() {
        if (this.reduce.matches) return false;
        const impulse = Math.min(this.width, this.height) * 1.1;
        for (const [i, p] of this.particles) { const a = i * 2.399963; p.vx = Math.cos(a) * impulse; p.vy = Math.sin(a) * impulse; }
        return true;
      }
      render(dt) {
        const s = this.settings, w = this.width, h = this.height, ctx = this.ctx, unit = Math.min(w, h), step = unit / (36 + s.density * .47), line = step * 1.42, font = step * 1.5;
        const cols = Math.ceil(w / step), rows = Math.ceil(h / line), depth = new Float32Array(cols * rows).fill(-Infinity), shade = new Float32Array(cols * rows);
        const moving = !s.paused && !this.reduce.matches, phase = this.time * s.motion / 60;
        const tilt = s.shape === 'cube' ? [.35, .58, -.18] : s.shape === 'leaf' ? [.1, -.2, -.55] : s.shape === 'mushroom' ? [.1, .1, -.07] : [-.28, .42, -.3];
        const ax = tilt[0] + Math.sin(phase * .8) * .07, ay = tilt[1] + Math.sin(phase * .55) * .13, az = tilt[2] + Math.sin(phase * .4) * .045;
        const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
        const rotate = (x, y, z) => { const yy = y * cx - z * sx, zz = y * sx + z * cx, xx = x * cy + zz * sy, z2 = -x * sy + zz * cy; return [xx * cz - yy * sz, xx * sz + yy * cz, z2]; };
        const scale = unit * .335, offsetY = h * .51;
        for (const p of this.points) { const [x, y, z] = rotate(p[0], p[1], p[2]); const col = Math.round((w / 2 + x * scale) / step), row = Math.round((offsetY - y * scale) / line); if (col < 0 || col >= cols || row < 0 || row >= rows) continue; const index = row * cols + col; if (z > depth[index]) { depth[index] = z; const n = rotate(p[3], p[4], p[5]); shade[index] = clamp(.5 + n[0] * -.65 + n[1] * .3 + n[2] * .05, 0, 1); } }
        ctx.clearRect(0, 0, w, h); ctx.fillStyle = s.foreground; ctx.font = `${font}px 'Courier New',monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; this.drawn = [];
        const chars = s.characters === 'custom' ? (a => a.length ? a : ['@'])([...(s.customChars || '').replace(/\s+/g, '')]) : s.characters === 'binary' ? '00101101' : s.characters === 'symbols' ? '@#&§%+=/*:' : '@@lleoouiuxxx';
        const chaos = '@&%?/<+§#*'; let count = 0; const live = new Set();
        for (let i = 0; i < depth.length; i++) {
          if (depth[i] === -Infinity) continue; count++; live.add(i); const x = (i % cols) * step, y = Math.floor(i / cols) * line;
          let p = this.particles.get(i); if (!p) { p = { x: 0, y: 0, vx: 0, vy: 0 }; this.particles.set(i, p); }
          let targetX = 0, targetY = 0; const dx = x + p.x - this.pointer.x, dy = y + p.y - this.pointer.y, dist = Math.hypot(dx, dy), radius = unit * .19;
          if (s.scatter && this.pointer.active && !this.reduce.matches && dist < radius) { const force = Math.pow(1 - dist / radius, 1.4) * unit * .23; const angle = Math.atan2(dy, dx); targetX = Math.cos(angle) * force; targetY = Math.sin(angle) * force; }
          if (this.reduce.matches) { p.x = p.y = p.vx = p.vy = 0; } else { const subdt = dt / 3; for (let k = 0; k < 3; k++) { p.vx += ((targetX - p.x) * 100 - p.vx * 10) * subdt; p.vy += ((targetY - p.y) * 100 - p.vy * 10) * subdt; p.x += p.vx * subdt; p.y += p.vy * subdt; } }
          const disrupted = Math.hypot(p.x, p.y) > 4;
          let glyph = chars[Math.min(chars.length - 1, Math.floor(shade[i] * chars.length))];
          const interval = Math.floor(this.time * 3); if (disrupted) glyph = chaos[(i + interval * 7) % chaos.length]; else if (moving && s.motion > 0 && (i + interval * 13) % 59 === 0) glyph = chars[(i + interval) % chars.length];
          const xx = x + p.x, yy = y + p.y, angle = disrupted ? p.x * .006 : 0;
          ctx.save(); ctx.translate(xx, yy); if (angle) ctx.rotate(angle); ctx.globalAlpha = disrupted ? .85 : 1; ctx.fillText(glyph, 0, 0); ctx.restore(); this.drawn.push({ x: xx, y: yy, glyph, angle });
        }
        for (const key of this.particles.keys()) if (!live.has(key)) this.particles.delete(key);
        this.font = font; if (this.count !== count) { this.count = count; this.onCount(count); }
      }
      /* Redraws the current frame at any size, so exports are not capped at screen resolution. */
      snapshot(longest) {
        const k = longest / Math.max(this.width, this.height), c = document.createElement('canvas');
        c.width = Math.round(this.width * k); c.height = Math.round(this.height * k);
        const ctx = c.getContext('2d'), live = this.ctx; ctx.setTransform(k, 0, 0, k, 0, 0);
        this.ctx = ctx; this.render(0); this.ctx = live;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = this.settings.background; ctx.fillRect(0, 0, c.width, c.height);
        return c;
      }
      svg(longest) {
        const esc = t => t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'), s = this.settings, k = longest / Math.max(this.width, this.height);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(this.width * k)}" height="${Math.round(this.height * k)}" viewBox="0 0 ${this.width} ${this.height}"><title>ASCII ${s.shape}</title><rect width="100%" height="100%" fill="${s.background}"/><g fill="${s.foreground}" font-family="Courier New,monospace" font-size="${this.font}" text-anchor="middle" dominant-baseline="central">${this.drawn.map(p => `<text x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}"${p.angle ? ` transform="rotate(${(p.angle * 180 / Math.PI).toFixed(2)} ${p.x} ${p.y})"` : ''}>${esc(p.glyph)}</text>`).join('')}</g></svg>`;
      }
    }
    return CharacterArt;
  }
  const CharacterArt = characterEngine();

  const shapes = [
    ['ring', 'Ring', '<ellipse cx="12" cy="12" rx="8" ry="6" transform="rotate(-35 12 12)"/><ellipse cx="12" cy="12" rx="5" ry="3" transform="rotate(-35 12 12)"/>'],
    ['cube', 'Cube', '<path d="m5 7 9-4 6 4v10l-9 4-6-4Zm0 0 6 4 9-4M11 11v10M14 3v10l-9 4m9-4 6 4"/>'],
    ['sphere', 'Sphere', '<circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="4" ry="8"/><path d="M4 12h16M6 7q6 4 12 0M6 17q6-4 12 0"/>'],
    ['knot', 'Knot', '<path d="M12 4c-5 0-8 14-3 15 4 1 12-9 9-12S1 9 5 14c3 4 15 5 15 0S14 1 12 4Z"/>'],
    ['flower', 'Flower', '<path d="M12 8c-6-10-12 1-5 4-10 3-1 13 4 6 5 9 13 0 7-4 10-4 0-13-4-7-1-6-6-6-6-2"/><circle cx="12" cy="12" r="2"/>'],
    ['leaf', 'Leaf', '<path d="M5 20C8 13 17 6 20 3c1 12-6 16-12 13C4 11 9 4 20 3M11 12l1-5m-1 5 5 1"/>'],
    ['mushroom', 'Shroom', '<path d="M3 13a9 9 0 0 1 18 0Z M10 13l-1 7h6l-1-7M7 8l1-1m8 1 1 1m-5 1v1"/>'],
    ['blob', 'Blob', '<path d="M10 3c5-2 6 4 8 6 7 6 0 13-5 11-3-1-7 2-9-4S5 5 10 3Z"/>'],
  ];
  const palettes = [
    { name: 'Papaya', values: { background: '#ff7448', foreground: '#fff8e9' } }, { name: 'Lilac', values: { background: '#9d87f5', foreground: '#fffbed' } },
    { name: 'Sky', values: { background: '#5aaff8', foreground: '#fffdf1' } }, { name: 'Butter', values: { background: '#f2c527', foreground: '#fffdf0' } },
    { name: 'Moss', values: { background: '#758263', foreground: '#fcf9e9' } }, { name: 'Ink', values: { background: '#252522', foreground: '#dcded2' } },
    { name: 'Paper', values: { background: '#e9e8e0', foreground: '#3e4536' } },
  ];
  const samples = { classic: '@leouix', symbols: '@#&%+=/', binary: '0100110', custom: '' };
  const defaults = { shape: 'ring', background: '#ff7448', foreground: '#fff8e9', characters: 'classic', customChars: 'FIELDKIT', density: 50, motion: 30, scatter: true, paused: false, seed: 1, ratio: '8:7', resolution: 2048 };
  const shapeName = id => shapes.find(s => s[0] === id)?.[1] || id;
  const paletteName = s => palettes.find(p => p.values.background === s.background && p.values.foreground === s.foreground)?.name || 'Custom';

  let art = null, pauseButton = null, scatterButton = null, lastCount = 0;

  function interactiveHTML(s) {
    const config = JSON.stringify({ ...s, paused: s.paused });
    const fg = s.foreground;
    return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Characters — ${shapeName(s.shape)}</title><style>*{box-sizing:border-box}body{margin:0;background:${s.background}}canvas{display:block;width:100vw;height:100dvh;touch-action:none}button{position:fixed;top:max(24px,env(safe-area-inset-top));min-height:44px;background:transparent;border:1px solid ${fg};border-radius:4px;padding:8px 12px;color:${fg};cursor:pointer;font:13px system-ui,sans-serif}#pause{right:max(24px,env(safe-area-inset-right))}#scatter-once{left:max(24px,env(safe-area-inset-left))}button:focus-visible{outline:2px solid currentColor;outline-offset:4px}</style><canvas id="art" role="img" aria-label="Interactive ASCII ${util.escapeXML(shapeName(s.shape))}"></canvas><button id="scatter-once">Scatter</button><button id="pause">${s.paused ? 'Play' : 'Pause'}</button><script>const CharacterArt=(${characterEngine.toString()})();const config=${config};const art=new CharacterArt(document.getElementById('art'),config);document.getElementById('pause').onclick=function(){config.paused=!config.paused;art.update(config);this.textContent=config.paused?'Play':'Pause';};document.getElementById('scatter-once').onclick=()=>art.scatterOnce();<\/script></html>`;
  }

  register({
    id: 'characters', name: 'Characters', icon: 'at', tagline: 'Simple shapes, made of characters.',
    intro: { title: 'Characters', text: 'Choose a form. Move your cursor to scatter the type.' },
    defaults, live: true,
    primary: { label: 'Surprise me', short: 'Surprise', icon: 'shuffle', kbd: 'Space', run: app => {
      const s = app.state, others = shapes.filter(x => x[0] !== s.shape), shape = others[Math.floor(Math.random() * others.length)][0];
      const current = palettes.findIndex(p => p.values.background === s.background), next = palettes[(current + 1 + Math.floor(Math.random() * (palettes.length - 1))) % palettes.length];
      app.toast(`${shapeName(shape)} in ${next.name}`);
      return { shape, ...next.values, seed: Math.random() * Math.PI * 2 };
    } },
    formats: [{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' }, { value: 'html', label: 'HTML' }],
    title: s => `${String(shapes.findIndex(x => x[0] === s.shape) + 1).padStart(2, '0')} · ${shapeName(s.shape)}`,
    sub: s => paletteName(s),
    dims: s => util.sizeFor(s.ratio, s.resolution).join(' × '),
    ratio: s => s.ratio,
    describe: s => `ASCII ${shapeName(s.shape)} in ${paletteName(s)}. Move your pointer or drag to scatter its characters.`,
    mount(canvas, s, app) {
      canvas.style.touchAction = 'pan-y';
      art = new CharacterArt(canvas, s, count => { lastCount = count; app.status(`${count.toLocaleString()} characters`); });
      pauseButton = h('button', { type: 'button', class: 'stage-button', onclick: () => app.set({ paused: !app.state.paused }) });
      scatterButton = h('button', { type: 'button', class: 'stage-button', html: icon('scatter') + '<span>Scatter</span>', onclick: () => art.scatterOnce() });
      return [pauseButton, scatterButton];
    },
    update(s, app) {
      art.update(s);
      const reduce = art.reduce.matches;
      pauseButton.innerHTML = icon(s.paused ? 'play' : 'pause') + `<span>${s.paused ? 'Play' : 'Pause'}</span>`;
      pauseButton.setAttribute('aria-label', s.paused ? 'Play animation' : 'Pause animation');
      pauseButton.disabled = scatterButton.disabled = reduce;
      if (lastCount) app.status(`${lastCount.toLocaleString()} characters`);
    },
    unmount() { art?.destroy(); art = null; lastCount = 0; },
    snapshot: (s, longest) => art.snapshot(longest),
    async export(s, format) {
      if (format === 'svg') return new Blob([art.svg(s.resolution)], { type: 'image/svg+xml;charset=utf-8' });
      if (format === 'html') return new Blob([interactiveHTML(s)], { type: 'text/html;charset=utf-8' });
      return util.toBlob(art.snapshot(s.resolution));
    },
    filename: (s, format) => `characters-${s.shape}-${util.slug(paletteName(s))}.${format}`,
    panels: (k, app) => [
      { id: 'shape', label: 'Shape', content: [
        k.section({ title: 'Shape', aside: '01—08' }, k.forms('shape', shapes.map(([value, label, svg]) => ({ value, label, icon: svg })), { cols: 4, stacked: true, label: 'Shape' })),
        k.section({ title: 'Characters', aside: s => s.characters === 'custom' ? s.customChars.slice(0, 12) : samples[s.characters] },
          k.segmented('characters', null, [{ value: 'classic', label: 'Classic' }, { value: 'symbols', label: 'Symbols' }, { value: 'binary', label: 'Binary' }, { value: 'custom', label: 'Custom' }]),
          k.textField('customChars', 'Your characters', { maxlength: 24, placeholder: 'Type a word or symbols', when: s => s.characters === 'custom' }),
          k.note('Shadows take the first characters, lit faces the last.', { when: s => s.characters === 'custom' }),
          k.range('density', 'Density', 25, 80)),
      ] },
      { id: 'style', label: 'Style', content: [
        k.section({ title: 'Colors', aside: 'Artwork only' },
          k.palettes('Palette', palettes),
          k.color('background', 'Background color'),
          k.color('foreground', 'Character color')),
      ] },
      { id: 'motion', label: 'Motion', content: [
        k.section({ title: 'Motion', aside: s => s.paused ? 'Paused' : 'Playing' },
          k.range('motion', 'Idle motion', 0, 100, 1, { disabled: () => matchMedia('(prefers-reduced-motion: reduce)').matches }),
          k.toggle('scatter', 'Scatter on hover', 'Break apart, then spring back'),
          k.toggle('paused', 'Pause animation', 'Freeze the idle sway'),
          k.note('Reduced-motion settings stop animation and scattering.')),
      ] },
      { id: 'canvas', label: 'Canvas', content: [
        k.section({ title: 'Canvas' },
          k.select('ratio', 'Ratio', [{ value: '8:7', label: 'Classic · 8:7' }, ...ratioOptions], { inline: true }),
          k.select('resolution', 'Export size', resolutionOptions, { inline: true, number: true }),
          k.note('HTML exports a single file that keeps the motion and scattering.')),
      ] },
    ],
  });
})();
