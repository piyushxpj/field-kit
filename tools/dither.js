/* Dither: the Dither Matrix algorithms, ported to plain JS. Ink and paper are blended so effect greys survive custom colors. */
(() => {
  'use strict';
  const { util, register } = FieldKit;
  const BAYER = {
    2: [[0, 2], [3, 1]],
    4: [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]],
    8: [[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22], [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]],
  };
  const algorithms = [
    { group: 'Ordered', options: [{ value: 'threshold', label: 'Threshold' }, { value: 'bayer2x2', label: 'Bayer 2×2' }, { value: 'bayer4x4', label: 'Bayer 4×4' }, { value: 'bayer8x8', label: 'Bayer 8×8' }] },
    { group: 'Error diffusion', options: [{ value: 'floydSteinberg', label: 'Floyd–Steinberg' }, { value: 'atkinson', label: 'Atkinson' }] },
    { group: 'Pattern', options: [{ value: 'noise', label: 'Random noise' }, { value: 'texture', label: 'Texture pattern' }] },
    { group: 'Halftone', options: [{ value: 'halftoneCircular', label: 'Halftone circular' }, { value: 'halftoneLine', label: 'Halftone line' }, { value: 'dotMatrix', label: 'Dot matrix' }, { value: 'moneyHalftone', label: 'Money halftone' }] },
  ];
  const flat = algorithms.flatMap(g => g.options);
  const label = id => flat.find(a => a.value === id)?.label || id;
  const blurbs = {
    threshold: 'One cut-off. Everything brighter becomes paper.', bayer2x2: 'The coarsest ordered matrix.', bayer4x4: 'Classic dot-matrix crosshatch.', bayer8x8: 'Fine ordered pattern with smooth ramps.',
    floydSteinberg: 'Spreads each pixel’s error to its neighbours.', atkinson: 'The early Mac look: lighter, with crisp highlights.',
    noise: 'Random grain decides each pixel.', texture: 'A sine weave modulates the threshold.',
    halftoneCircular: 'Print-style dots on a rotated screen.', halftoneLine: 'Parallel lines that thicken in shadow.', dotMatrix: 'One dot per cell, sized by its average tone.', moneyHalftone: 'Engraved lines, like a banknote portrait.',
  };
  const halftone = s => ['halftoneCircular', 'halftoneLine', 'dotMatrix'].includes(s.algorithm);
  const palettes = [
    { name: 'Mono', values: { ink: '#000000', paper: '#ffffff' } },
    { name: 'Matrix', values: { ink: '#3e3025', paper: '#cedfe8' } },
    { name: 'Newsprint', values: { ink: '#1f1d1a', paper: '#e9e3d4' } },
    { name: 'Night', values: { ink: '#e6e6e6', paper: '#161616' } },
    { name: 'Riso', values: { ink: '#ff4f9a', paper: '#f5efe4' } },
    { name: 'Blueprint', values: { ink: '#eef3ff', paper: '#24509f' } },
  ];
  const defaults = { algorithm: 'bayer4x4', threshold: 50, noiseAmount: 50, textureScale: 8, dotSize: 'medium', angle: 45, contrastBoost: 50,
    moneyLineStyle: 'wavy', moneyDensity: 6, moneyThickness: 70, moneyWaveAmplitude: 8, moneyAngle: 0, moneyContrast: 60, moneyInvert: false,
    brightness: 0, contrast: 0, gamma: 100, invertImage: false, sketch: false, fade: false, shadow: false, grain: false, ink: '#000000', paper: '#ffffff', transparent: false, workSize: 1200, scale: 2 };
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

  function dither(L, w, h, s) {
    const out = new Uint8ClampedArray(w * h), t = s.threshold / 100, rnd = util.random(util.hash('dither'));
    const a = s.algorithm;
    if (a === 'threshold') { for (let i = 0; i < L.length; i++) out[i] = L[i] >= t * 255 ? 255 : 0; }
    else if (a.startsWith('bayer')) {
      const m = BAYER[a[5]], n = m.length, nn = n * n;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; out[i] = L[i] / 255 > m[y % n][x % n] / nn + (t - .5) ? 255 : 0; }
    } else if (a === 'floydSteinberg' || a === 'atkinson') {
      const p = new Float32Array(L.length); for (let i = 0; i < L.length; i++) p[i] = L[i] / 255;
      const atk = a === 'atkinson';
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, old = p[i], nv = old > t ? 1 : 0; p[i] = nv;
        if (atk) {
          const e = (old - nv) / 8;
          if (x + 1 < w) p[i + 1] += e; if (x + 2 < w) p[i + 2] += e;
          if (y + 1 < h) { if (x > 0) p[i + w - 1] += e; p[i + w] += e; if (x + 1 < w) p[i + w + 1] += e; }
          if (y + 2 < h) p[i + 2 * w] += e;
        } else {
          const e = old - nv;
          if (x + 1 < w) p[i + 1] += e * 7 / 16;
          if (y + 1 < h) { if (x > 0) p[i + w - 1] += e * 3 / 16; p[i + w] += e * 5 / 16; if (x + 1 < w) p[i + w + 1] += e / 16; }
        }
      }
      for (let i = 0; i < p.length; i++) out[i] = p[i] >= .5 ? 255 : 0;
    } else if (a === 'noise') {
      const amt = s.noiseAmount / 100;
      for (let i = 0; i < L.length; i++) out[i] = L[i] / 255 + (rnd() * amt * 2 - amt) > t ? 255 : 0;
    } else if (a === 'texture') {
      const sc = s.textureScale;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; out[i] = L[i] / 255 + ((Math.sin(x / sc) * Math.cos(y / sc) + 1) / 2 - .5) * t > .5 ? 255 : 0; }
    } else if (a === 'halftoneCircular' || a === 'halftoneLine') {
      const size = { small: 4, medium: 8, large: 12 }[s.dotSize] * (a === 'halftoneLine' ? .75 : 1), ang = s.angle * Math.PI / 180, c = s.contrastBoost / 100, shift = (t - .5) * 2;
      const cos = Math.cos(ang), sin = Math.sin(ang);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, dark = clamp01(1 - Math.pow(L[i] / 255, 1 - c) + shift);
        const rx = x * cos - y * sin;
        if (a === 'halftoneLine') { const pos = rx - Math.floor(rx / size) * size; out[i] = Math.abs(pos - size / 2) <= dark * size * .8 / 2 ? 0 : 255; }
        else {
          const ry = x * sin + y * cos, cx = rx - Math.floor(rx / size) * size - size / 2, cy = ry - Math.floor(ry / size) * size - size / 2;
          out[i] = Math.sqrt(cx * cx + cy * cy) <= dark * size / 2 ? 0 : 255;
        }
      }
    } else if (a === 'dotMatrix') {
      const cell = { small: 6, medium: 10, large: 14 }[s.dotSize], c = s.contrastBoost / 100, shift = (t - .5) * 2;
      for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
        let sum = 0, n = 0; const ye = Math.min(y + cell, h), xe = Math.min(x + cell, w);
        for (let cy = y; cy < ye; cy++) for (let cx = x; cx < xe; cx++) { sum += L[cy * w + cx]; n++; }
        const r = clamp01(1 - Math.pow(sum / n / 255, 1 - c) + shift) * cell / 2, mx = x + cell / 2, my = y + cell / 2;
        for (let cy = y; cy < ye; cy++) for (let cx = x; cx < xe; cx++) out[cy * w + cx] = Math.hypot(cx - mx, cy - my) <= r ? 0 : 255;
      }
    } else if (a === 'moneyHalftone') {
      const spacing = Math.max(2, s.moneyDensity), maxT = spacing * .9 * s.moneyThickness / 100, amp = s.moneyWaveAmplitude, ang = s.moneyAngle * Math.PI / 180;
      const c = s.moneyContrast / 100, shift = (t - .5) * 2, cos = Math.cos(ang), sin = Math.sin(ang), wave = spacing * 6, contour = spacing * 4;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, dark = clamp01(1 - Math.pow(L[i] / 255, 1 - c) + shift);
        const u = x * cos + y * sin, v = -x * sin + y * cos;
        const line = s.moneyLineStyle === 'straight' ? v : s.moneyLineStyle === 'wavy' ? v + amp * Math.sin(u / wave * Math.PI * 2) : v + dark * contour;
        const mod = ((line % spacing) + spacing) % spacing, ink = Math.abs(mod - spacing / 2) <= dark * maxT / 2;
        out[i] = ink !== s.moneyInvert ? 0 : 255;
      }
    }
    return effects(out, w, h, s, rnd);
  }

  function effects(v, w, h, s, rnd) {
    if (s.sketch) {
      const src = v.slice();
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x, ex = src[i + 1] - src[i - 1], ey = src[i + w] - src[i - w];
        v[i] = src[i] === 0 || Math.sqrt(ex * ex + ey * ey) > 50 ? 0 : 255;
      }
    }
    if (s.fade) {
      const cx = w / 2, cy = h / 2, max = Math.hypot(cx, cy);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (v[i] === 255) v[i] = 255 * (1 - Math.min(Math.hypot(x - cx, y - cy) / max, 1) * .3); }
    }
    if (s.shadow) {
      const src = v.slice();
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (src[i] === 0 && (src[i - 1] === 255 || src[i + 1] === 255 || src[i - w] === 255 || src[i + w] === 255)) v[i] = 20; }
    }
    if (s.grain) for (let i = 0; i < v.length; i++) if (v[i] === 255) v[i] = Math.max(235, Math.min(255, 245 + (rnd() - .5) * 20));
    return v;
  }

  /* The resampled luminance is cached per source and working size; only the dither reruns while tuning. */
  let cache = { key: '' };
  function luminance(source, workSize) {
    const key = source.id + '|' + workSize;
    if (cache.key === key) return cache;
    const k = Math.min(1, workSize / Math.max(source.width, source.height));
    const w = Math.max(1, Math.round(source.width * k)), h = Math.max(1, Math.round(source.height * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(source.image, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data, L = new Float32Array(w * h), A = new Uint8ClampedArray(w * h);
    for (let i = 0, j = 0; j < L.length; i += 4, j++) { L[j] = .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]; A[j] = d[i + 3]; }
    cache = { key, w, h, L, A };
    return cache;
  }

  /* Tone the image before it is reduced: a dark photo otherwise dithers to mostly ink. */
  function adjust(L, s) {
    if (!s.brightness && !s.contrast && s.gamma === 100 && !s.invertImage) return L;
    const out = new Float32Array(L.length), b = s.brightness * 2.55, c = (100 + s.contrast) / 100, g = 100 / s.gamma;
    for (let i = 0; i < L.length; i++) {
      let v = (L[i] - 128) * c + 128 + b;
      v = v < 0 ? 0 : v > 255 ? 255 : v;
      v = 255 * Math.pow(v / 255, g);
      out[i] = s.invertImage ? 255 - v : v;
    }
    return out;
  }

  function paint(canvas, s, source) {
    const start = performance.now();
    const { w, h, L: raw, A } = luminance(source, s.workSize), L = adjust(raw, s);
    const v = dither(L, w, h, s), ink = util.hexToRgb(s.ink), paper = util.hexToRgb(s.paper);
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    for (let j = 0, i = 0; j < v.length; j++, i += 4) {
      const k = v[j] / 255;
      if (s.transparent) { d[i] = ink[0]; d[i + 1] = ink[1]; d[i + 2] = ink[2]; d[i + 3] = (1 - k) * A[j]; }
      else { d[i] = ink[0] + (paper[0] - ink[0]) * k; d[i + 1] = ink[1] + (paper[1] - ink[1]) * k; d[i + 2] = ink[2] + (paper[2] - ink[2]) * k; d[i + 3] = A[j]; }
    }
    ctx.putImageData(img, 0, 0);
    return { ms: Math.round(performance.now() - start), v, w, h };
  }

  function scaled(canvas, scale) {
    if (scale === 1) return canvas;
    const c = document.createElement('canvas'); c.width = canvas.width * scale; c.height = canvas.height * scale;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(canvas, 0, 0, c.width, c.height); return c;
  }

  function svg(s, source) {
    const c = document.createElement('canvas'), { v, w, h } = paint(c, s, source), runs = [];
    // One path of horizontal ink runs keeps the file editable and far smaller than a rect per pixel.
    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < w) { if (v[y * w + x] < 128) { const x0 = x; while (x < w && v[y * w + x] < 128) x++; runs.push(`M${x0} ${y}h${x - x0}v1h${x0 - x}z`); } else x++; }
    }
    const paperRect = s.transparent ? '' : `<rect width="${w}" height="${h}" fill="${s.paper}"/>`;
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w * s.scale}" height="${h * s.scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges"><title>${util.escapeXML(label(s.algorithm))}</title>${paperRect}<path fill="${s.ink}" d="${runs.join('')}"/></svg>`;
  }

  const keyMap = { 1: 'threshold', 2: 'bayer2x2', 3: 'bayer4x4', 4: 'bayer8x8', 5: 'floydSteinberg', 6: 'atkinson', 7: 'noise', 8: 'texture', 9: 'halftoneCircular', 0: 'halftoneLine', '-': 'dotMatrix', '=': 'moneyHalftone' };

  register({
    id: 'dither', name: 'Dither', icon: 'dither', tagline: 'Any image, reduced to two inks.',
    intro: { title: 'Dither', text: 'Drop, paste or upload an image. Pick a pattern.' },
    defaults, needsSource: true, pixelated: true,
    primary: { label: 'Open image', short: 'Open', icon: 'upload', run: app => { app.openFile(); } },
    formats: [{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' }],
    title: s => label(s.algorithm),
    sub: (s, app) => app.source.name,
    dims: (s, app) => { const { w, h } = luminance(app.source, s.workSize); return `${w * s.scale} × ${h * s.scale}`; },
    transparent: s => s.transparent,
    describe: (s, app) => `${app.source.name}, dithered with ${label(s.algorithm)} in ${s.ink} on ${s.transparent ? 'transparent' : s.paper}.`,
    render: (canvas, s, app) => paint(canvas, s, app.source).ms,
    snapshot: (s, longest, app) => { const c = document.createElement('canvas'); paint(c, s, app.source); return c; },
    async export(s, format, app) {
      if (format === 'svg') return new Blob([svg(s, app.source)], { type: 'image/svg+xml;charset=utf-8' });
      const c = document.createElement('canvas'); paint(c, s, app.source); return util.toBlob(scaled(c, s.scale));
    },
    filename: (s, format, app) => `dither-${util.slug(app.source.name)}-${util.slug(s.algorithm)}${s.transparent ? '-transparent' : ''}.${format}`,
    shortcuts: [['1 – =', 'Pick an algorithm']],
    keydown(e, app) { if (keyMap[e.key] && !e.metaKey && !e.ctrlKey && !e.altKey) { app.set({ algorithm: keyMap[e.key] }); return true; } return false; },
    panels: (k, app) => [
      { id: 'dither', label: 'Dither', content: [
        app.sourceSection(k),
        k.section({ title: 'Algorithm', aside: '12 patterns · keys 1–=' },
          k.select('algorithm', 'Pattern', algorithms),
          k.note(s => blurbs[s.algorithm]),
          k.range('threshold', 'Threshold', 0, 100, 1, { format: v => v + '%' }),
          k.range('noiseAmount', 'Noise amount', 0, 100, 1, { when: s => s.algorithm === 'noise' }),
          k.range('textureScale', 'Weave scale', 2, 32, 1, { when: s => s.algorithm === 'texture' })),
        k.section({ title: 'Screen', aside: 'Halftone', when: halftone },
          k.segmented('dotSize', 'Dot size', [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]),
          k.range('angle', 'Angle', 0, 180, 1, { format: v => v + '°', when: s => s.algorithm !== 'dotMatrix' }),
          k.range('contrastBoost', 'Contrast', 0, 100)),
        k.section({ title: 'Engraving', aside: 'Money halftone', when: s => s.algorithm === 'moneyHalftone' },
          k.segmented('moneyLineStyle', 'Line style', [{ value: 'straight', label: 'Straight' }, { value: 'wavy', label: 'Wavy' }, { value: 'contour', label: 'Contour' }]),
          k.range('moneyDensity', 'Line spacing', 2, 16, 1, { format: v => v + ' px' }),
          k.range('moneyThickness', 'Thickness', 0, 100, 1, { format: v => v + '%' }),
          k.range('moneyWaveAmplitude', 'Wave amplitude', 0, 30, 1, { format: v => v + ' px', when: s => s.moneyLineStyle === 'wavy' }),
          k.range('moneyAngle', 'Angle', 0, 360, 1, { format: v => v + '°' }),
          k.range('moneyContrast', 'Contrast', 0, 100),
          k.toggle('moneyInvert', 'Invert', 'Swap ink and paper lines')),
        k.section({ title: 'Adjust', aside: 'Before dithering' },
          k.range('brightness', 'Brightness', -100, 100, 1, { format: v => (v > 0 ? '+' : '') + v }),
          k.range('contrast', 'Contrast', -100, 100, 1, { format: v => (v > 0 ? '+' : '') + v }),
          k.range('gamma', 'Midtones', 25, 300, 5, { format: v => (v / 100).toFixed(2) }),
          k.toggle('invertImage', 'Invert image', 'Dark becomes light'),
          k.button('Reset adjustments', 'reset', () => app.set({ brightness: 0, contrast: 0, gamma: 100, invertImage: false }))),
        k.section({ title: 'Effects', aside: 'Finishing' },
          k.toggle('sketch', 'Sketch lines', 'Trace edges in ink'),
          k.toggle('fade', 'Fade edges', 'Soft radial vignette'),
          k.toggle('shadow', 'Shadow pop', 'Lift ink beside paper'),
          k.toggle('grain', 'Paper grain', 'Subtle fibre texture')),
      ] },
      { id: 'colors', label: 'Colors', content: [
        k.section({ title: 'Colors', aside: 'Two inks' },
          k.palettes('Palette', palettes),
          k.color('ink', 'Ink'),
          k.color('paper', 'Paper', { disabled: s => s.transparent }),
          k.toggle('transparent', 'Transparent paper', 'PNG & SVG exports'),
          k.button('Swap ink and paper', 'reset', () => { const s = app.state; app.set({ ink: s.paper, paper: s.ink }); })),
      ] },
      { id: 'output', label: 'Output', content: [
        k.section({ title: 'Output' },
          k.select('workSize', 'Detail', [{ value: 600, label: 'Coarse · 600 px' }, { value: 900, label: 'Medium · 900 px' }, { value: 1200, label: 'Fine · 1200 px' }, { value: 1800, label: 'Finest · 1800 px' }], { inline: true, number: true }),
          k.select('scale', 'Export scale', [{ value: 1, label: '1× · exact pixels' }, { value: 2, label: '2× · crisp' }, { value: 4, label: '4× · poster' }], { inline: true, number: true }),
          k.note('Dithering happens at the detail size. Export scale enlarges each pixel without blurring it.')),
      ] },
    ],
  });
})();
