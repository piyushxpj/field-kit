/* Glyph Field: deterministic, entirely local procedural typography. Renderer ported unchanged from the standalone studio. */
(() => {
  'use strict';
  const { util, register, ratioOptions, resolutionOptions } = FieldKit;
  const { hash, random, sizeFor, escapeXML, shade } = util;
  const { names: shapeNames, geometry: shapeGeometry, arrangements, circlePattern, spiralPoints } = GlyphShapes;
  const names = { mycelium: 'Mycelium', islands: 'Archipelago', ribbons: 'Currents', contours: 'Contours', cells: 'Cellular', circles: 'Circles', spiral: 'Spiral' };
  const descriptions = { mycelium: 'Branching networks', islands: 'Scattered landforms', ribbons: 'Winding channels', contours: 'Nested elevations', cells: 'Organic membranes', circles: 'Repeating circular motifs', spiral: 'Scattered dotted spirals' };
  const compositionName = s => s.form === 'spiral' ? 'Spiral' : s.form === 'circles' ? `Circles · ${arrangements[s.circleLayout || 'grid']}` : s.shape && s.shape !== 'freeform' ? `${shapeNames[s.shape]} · ${names[s.form]}` : names[s.form];
  const defaults = { form: 'mycelium', spiralTurns: 3.5, spiralArms: 2, spiralScatter: 55, spiralDotSize: 8, spiralDensity: 75, spiralAccent: 35, spiralDirection: 'clockwise', circleLayout: 'grid', circleStyle: 'rings', circleSize: 60, circleSpacing: 28, shape: 'freeform', shapeFill: 'pattern', seed: '781204', scale: 50, density: 48, detail: 9, accent: 35, color: '#eeeeee', background: '#181818', glyph: '#dbdbdb', transparent: false, ratio: '4:5', resolution: 2048 };

  function render(canvas, s, longest = 1500, vector = false) {
    const start = performance.now();
    const [lw, lh] = sizeFor(s.ratio, 1500), [w, h] = sizeFor(s.ratio, longest);
    const parts = [], number = n => Number(n.toFixed(3));
    let ctx;
    if (!vector) { canvas.width = w; canvas.height = h; ctx = canvas.getContext('2d'); ctx.scale(w / lw, h / lh); }
    function rect(x, y, width, height, color) {
      if (vector) parts.push(`<rect x="${number(x)}" y="${number(y)}" width="${number(width)}" height="${number(height)}" fill="${color}"/>`);
      else { ctx.fillStyle = color; ctx.fillRect(x, y, width, height); }
    }
    if (!s.transparent) rect(0, 0, lw, lh, s.background);
    const seed = hash(s.seed), rnd = random(seed), noise = noiseFactory(seed), short = Math.min(lw, lh);
    if (s.form === 'spiral') {
      const points = spiralPoints(s, lw, lh, rnd);
      for (const p of points) {
        const color = p.accent ? s.color : s.glyph;
        if (vector) parts.push(`<circle cx="${number(p.x)}" cy="${number(p.y)}" r="${number(p.r)}" fill="${color}"/>`);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
      }
      if (vector) return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${lw} ${lh}" overflow="hidden"><title>Spiral — ${escapeXML(s.seed)}</title><desc>Seeded dotted spiral trails. Editable vector circles.</desc><metadata>${escapeXML(JSON.stringify(s))}</metadata>${parts.join('')}</svg>`;
      return Math.round(performance.now() - start);
    }
    const shape = s.form === 'circles' ? null : shapeGeometry(s.shape || 'freeform', lw, lh);
    const circular = s.form === 'circles' ? circlePattern(s, lw, lh, random(seed ^ 0x517cc1b7)) : null;
    if (shape && !vector) { ctx.save(); ctx.clip(new Path2D(shape.path), 'evenodd'); }
    const freq = 2.2 + (90 - s.scale) * .051, step = s.detail * .72, cols = Math.ceil(lw / step) + 2, rows = Math.ceil(lh / step) + 2;
    const mask = new Uint8Array(cols * rows), edges = [];
    const ox = rnd() * 90, oy = rnd() * 90, coverage = (s.density - 48) / 100;
    function organicField(x, y) {
      if (circular) return circular.field(x, y);
      const nx = x / short * freq + ox, ny = y / short * freq + oy;
      const wx = nx + noise(nx * .7 + 12, ny * .7) * .7, wy = ny + noise(nx * .7, ny * .7 + 39) * .7;
      const n = noise(wx, wy) * .78 + noise(wx * 2.07 + 5, wy * 2.07) * .19 + noise(wx * 5.1, wy * 5.1) * .047 + noise(wx * 18.7, wy * 18.7) * .017;
      if (s.form === 'islands') return n - (.065 - coverage * .85);
      if (s.form === 'ribbons') return .19 + coverage * .4 - Math.abs(n + .16 * Math.sin(wy * 2.2));
      if (s.form === 'contours') return .23 + coverage * .55 - Math.abs(Math.sin(n * 13));
      if (s.form === 'cells') {
        const px = wx * 1.4, py = wy * 1.4, ix = Math.floor(px), iy = Math.floor(py); let d1 = 9, d2 = 9;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          const gx = ix + i, gy = iy + j, dx = gx + .5 + noise(gx + 120, gy + 30) * .46 - px, dy = gy + .5 + noise(gx + 54, gy + 73) * .46 - py, d = dx * dx + dy * dy;
          if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
        }
        return .15 + coverage * .35 - (Math.sqrt(d2) - Math.sqrt(d1));
      }
      return .175 + coverage * .38 - Math.abs(n + .055);
    }
    function field(x, y) {
      if (!shape) return organicField(x, y);
      const distance = shape.distance(x, y);
      if (distance <= 0) return distance / short;
      // A glyph rim keeps every silhouette recognizable, even with sparse patterns.
      return s.shapeFill === 'solid' || distance < step * 1.5 ? Math.max(.01, distance / short) : organicField(x, y);
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const i = y * cols + x; mask[i] = field((x - 1) * step, (y - 1) * step) > 0 ? 1 : 0; }
    // Atlas stamps keep thousands of small characters inexpensive to draw.
    const atlas = new Map();
    function stamp(ch, size, color) {
      const key = ch + '|' + size + '|' + color; if (atlas.has(key)) return atlas.get(key);
      const tile = document.createElement('canvas'), dpr = longest / 1500;
      const box = Math.ceil(size * 1.8); tile.width = tile.height = Math.ceil(box * dpr);
      const t = tile.getContext('2d'); t.scale(dpr, dpr); t.font = `${size > step * 1.3 ? 600 : 500} ${size}px monospace`; t.textAlign = 'center'; t.textBaseline = 'middle'; t.fillStyle = color; t.fillText(ch, box / 2, box / 2 + .25);
      const item = { tile, box }; atlas.set(key, item); return item;
    }
    function glyph(ch, x, y, size, color) {
      if (vector) { parts.push(`<text x="${number(x)}" y="${number(y + .25)}" font-size="${number(size)}" font-weight="${size > step * 1.3 ? 600 : 500}" fill="${color}">${escapeXML(ch)}</text>`); return; }
      const { tile, box } = stamp(ch, size, color); ctx.drawImage(tile, x - box / 2, y - box / 2, box, box);
    }
    const shades = [shade(s.glyph, 194 / 219), shade(s.glyph, 208 / 219), s.glyph], edgeColor = shade(s.glyph, 215 / 219), markColor = shade(s.glyph, 168 / 219);
    for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) {
      const i = y * cols + x; if (!mask[i]) continue;
      const px = (x - 1) * step, py = (y - 1) * step;
      const edge = !mask[i - 1] || !mask[i + 1] || !mask[i - cols] || !mask[i + cols] || !mask[i - cols - 1] || !mask[i + cols + 1];
      const texture = noise(px / short * (circular ? freq : 4) + 15, py / short * (circular ? freq : 4) + 27) + (shape && s.shapeFill === 'solid' ? organicField(px, py) * .7 : 0);
      if (edge) {
        edges.push([px, py]);
        const ex = px + (rnd() - .5) * step * (circular ? 0 : .5), ey = py + (rnd() - .5) * step * (circular ? 0 : .5);
        glyph('⊗', ex, ey, step * 1.95, edgeColor);
        glyph('@', ex, ey, step * 1.5, edgeColor);
      } else {
        const ch = texture > .27 ? '×' : texture > .02 ? '+' : texture > -.2 ? '⁙' : '✣';
        if (rnd() > .025) glyph(ch, px, py, step * (ch === '×' ? 1.48 : ch === '✣' ? 1.04 : 1.22), shades[Math.min(2, Math.max(0, Math.floor((texture + 1) * 1.5)))]);
      }
    }
    // Sparse registration marks sit in the negative space.
    for (let n = 0; n < (circular ? 0 : 40); n++) {
      const x = 20 + rnd() * (lw - 40), y = 20 + rnd() * (lh - 40);
      if (field(x, y) > -.055) continue;
      if (n % 3 === 0) {
        if (vector) parts.push(`<path d="M${number(x - 7)} ${number(y)}h14 M${number(x)} ${number(y - 7)}v14" fill="none" stroke="${markColor}" stroke-width="1.2"/>`);
        else { ctx.strokeStyle = markColor; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 7); ctx.stroke(); }
      } else if (n % 3 === 1) { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { if (field(x + i * 17, y + j * 17) < -.05 && rnd() > .12) rect(x + i * 17, y + j * 17, 2, 2, shade(s.glyph, 173 / 219)); } }
    }
    // Oversized, repeated letter fragments make the occasional typographic glitch.
    const letters = 'ssttrreewwxxllkkaaoohh', cutouts = [], accentGlyphs = [];
    let transparentDefs = '';
    for (let n = 0; n < Math.round(s.accent * .68); n++) {
      if (!edges.length) break;
      const [x, y] = edges[Math.floor(rnd() * edges.length)], size = step * (1.8 + rnd() * .6), ch = letters[Math.floor(rnd() * letters.length)];
      const vertical = rnd() > .55, length = 2 + Math.floor(rnd() * 4);
      for (let j = 0; j < length; j++) for (let k = 0; k < (vertical ? 2 : 1); k++) {
        const gx = x + (vertical ? k : j) * size * .67, gy = y + (vertical ? j : k) * size * .95;
        if (gx > lw - 10 || gy > lh - 10) continue;
        if (s.transparent) { cutouts.push([gx - size * .33, gy - size * .5, size * .68, size]); accentGlyphs.push([ch, gx, gy, size]); }
        else { rect(gx - size * .33, gy - size * .5, size * .68, size, s.background); glyph(ch, gx, gy, size, s.color); }
      }
    }
    if (s.transparent) {
      // Knock out the glyph field before drawing accents. No colored backplates.
      if (vector && cutouts.length) {
        const holes = cutouts.map(([x, y, w, h]) => `<rect x="${number(x)}" y="${number(y)}" width="${number(w)}" height="${number(h)}" fill="#000"/>`).join('');
        transparentDefs = `<defs><mask id="accent-cutouts" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="${lw}" height="${lh}" style="mask-type:luminance"><rect width="${lw}" height="${lh}" fill="#fff"/>${holes}</mask></defs>`;
        const content = parts.join(''); parts.length = 0; parts.push(`<g mask="url(#accent-cutouts)">${content}</g>`);
      } else if (!vector) { for (const [x, y, w, h] of cutouts) ctx.clearRect(x, y, w, h); }
      for (const [ch, x, y, size] of accentGlyphs) glyph(ch, x, y, size, s.color);
    }
    if (shape) {
      if (vector) { const background = s.transparent ? '' : parts.shift(); const content = parts.join(''); parts.length = 0; if (background) parts.push(background); parts.push(`<g clip-path="url(#artwork-shape)">${content}</g>`); }
      else ctx.restore();
    }
    const shapeDefs = shape ? `<defs><clipPath id="artwork-shape"><path d="${shape.path}" clip-rule="evenodd"/></clipPath></defs>` : '';
    const svgDocument = defs => `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${lw} ${lh}" overflow="hidden"><title>${escapeXML(compositionName(s) + ' — ' + s.seed)}</title><desc>Glyph Field artwork. Editable text and vector shapes; glyph appearance depends on the installed monospace font.</desc><metadata>${escapeXML(JSON.stringify(s))}</metadata>${shapeDefs}${defs}<g font-family="monospace" text-anchor="middle" dominant-baseline="central">${parts.join('')}</g></svg>`;
    // Full-surface grain/vignette would tint empty pixels, so omit them in alpha mode.
    if (s.transparent) return vector ? svgDocument(transparentDefs) : Math.round(performance.now() - start);
    if (vector) {
      const grainPaths = Array.from({ length: 20 }, () => []);
      for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) {
        const light = rnd() > .5, alpha = Math.floor(rnd() * 10);
        if (alpha) grainPaths[(light ? 10 : 0) + alpha].push(`M${x} ${y}h1v1h-1z`);
      }
      const grain = grainPaths.map((paths, i) => paths.length ? `<path fill="${i >= 10 ? '#fff' : '#000'}" fill-opacity="${number((i % 10) / 255)}" d="${paths.join('')}"/>` : '').join('');
      const defs = `<defs><pattern id="grain" width="160" height="160" patternUnits="userSpaceOnUse">${grain}</pattern><radialGradient id="vignette" gradientUnits="userSpaceOnUse" cx="${lw * .5}" cy="${lh * .5}" r="${Math.max(lw, lh) * .72}" fx="${lw * .5}" fy="${lh * .45}" fr="${short * .1}"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${37 / 255}"/></radialGradient></defs>`;
      parts.push(`<rect width="${lw}" height="${lh}" fill="url(#grain)"/><rect width="${lw}" height="${lh}" fill="url(#vignette)"/>`);
      return svgDocument(defs);
    }
    const grain = document.createElement('canvas'); grain.width = grain.height = 160;
    const gc = grain.getContext('2d'), pixels = gc.createImageData(160, 160);
    for (let i = 0; i < pixels.data.length; i += 4) { const v = rnd() > .5 ? 255 : 0; pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v; pixels.data[i + 3] = Math.floor(rnd() * 10); }
    gc.putImageData(pixels, 0, 0); ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, lw, lh);
    const vignette = ctx.createRadialGradient(lw * .5, lh * .45, short * .1, lw * .5, lh * .5, Math.max(lw, lh) * .72);
    vignette.addColorStop(0, '#00000000'); vignette.addColorStop(1, '#00000025'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, lw, lh);
    return Math.round(performance.now() - start);
  }
  function noiseFactory(seed) {
    function lattice(x, y) { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967295 * 2 - 1; }
    return (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let u = x - ix, v = y - iy; u = u * u * u * (u * (u * 6 - 15) + 10); v = v * v * v * (v * (v * 6 - 15) + 10); const a = lattice(ix, iy), b = lattice(ix + 1, iy), c = lattice(ix, iy + 1), d = lattice(ix + 1, iy + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  }

  const textureKeys = ['scale', 'density', 'detail', 'accent'];
  const colorKeys = ['background', 'glyph', 'color', 'transparent'];
  const organic = s => !['circles', 'spiral'].includes(s.form);

  register({
    id: 'glyph', name: 'Glyph Field', icon: 'type', tagline: 'Organic forms, drawn in type.',
    intro: { title: 'Composition', text: 'Shape the field. Make it yours.' },
    defaults,
    primary: { label: 'New composition', short: 'New', icon: 'shuffle', kbd: 'Space', run: () => ({ seed: util.newSeed() }) },
    formats: [{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' }],
    title: compositionName,
    sub: s => 'Seed ' + s.seed,
    dims: s => sizeFor(s.ratio, s.resolution).join(' × '),
    ratio: s => s.ratio,
    transparent: s => s.transparent,
    describe: s => `${compositionName(s)}: ${s.form === 'spiral' ? 'dotted spiral' : 'ASCII'} artwork, seed ${s.seed}, with ${s.glyph} ${s.form === 'spiral' ? 'dots' : 'glyphs'}, ${s.color} accents, and a ${s.transparent ? 'transparent' : s.background} background.`,
    render: (canvas, s) => render(canvas, s),
    snapshot: (s, longest) => { const c = document.createElement('canvas'); render(c, s, longest); return c; },
    async export(s, format) {
      if (format === 'svg') return new Blob([render(null, s, s.resolution, true)], { type: 'image/svg+xml;charset=utf-8' });
      const c = document.createElement('canvas'); render(c, s, s.resolution); return util.toBlob(c);
    },
    filename: (s, format) => `glyph-field-${s.form}${s.form === 'spiral' ? '' : s.form === 'circles' ? '-' + s.circleLayout + '-' + s.circleStyle : s.shape === 'freeform' ? '' : '-' + s.shape}-${util.slug(s.seed)}-${s.resolution}${s.transparent ? '-transparent' : ''}.${format}`,
    panels: (k, app) => [
      { id: 'pattern', label: 'Pattern', content: [
        k.section({ title: 'Structure', aside: '7 forms' }, k.forms('form', [
          { value: 'mycelium', label: 'Mycelium', icon: 'branch', desc: descriptions.mycelium },
          { value: 'islands', label: 'Archipelago', icon: 'circleDot', desc: descriptions.islands },
          { value: 'ribbons', label: 'Currents', icon: 'waves', desc: descriptions.ribbons },
          { value: 'contours', label: 'Contours', icon: 'layers', desc: descriptions.contours },
          { value: 'cells', label: 'Cellular', icon: 'hexagon', desc: descriptions.cells },
          { value: 'circles', label: 'Circles', icon: 'circles', desc: descriptions.circles },
          { value: 'spiral', label: 'Spiral', icon: 'orbit', desc: descriptions.spiral, wide: true },
        ], { describe: true, label: 'Structure' })),
        k.section({ title: 'Circle pattern', aside: 'Repeated motifs', when: s => s.form === 'circles' },
          k.select('circleLayout', 'Arrangement', Object.entries(arrangements).map(([value, label]) => ({ value, label }))),
          k.select('circleStyle', 'Motif', [{ value: 'rings', label: 'Rings' }, { value: 'discs', label: 'Filled circles' }, { value: 'concentric', label: 'Concentric rings' }]),
          k.range('circleSize', 'Circle size', 20, 100),
          k.range('circleSpacing', 'Spacing', 0, 80),
          k.note('New composition varies the texture. Scatter also varies circle positions and sizes.')),
        k.section({ title: 'Spiral pattern', aside: 'Dotted trails', when: s => s.form === 'spiral' },
          k.select('spiralDirection', 'Direction', [{ value: 'clockwise', label: 'Clockwise' }, { value: 'counterclockwise', label: 'Counterclockwise' }]),
          k.range('spiralTurns', 'Turns', 1, 7, .5),
          k.range('spiralArms', 'Arms', 1, 5),
          k.range('spiralScatter', 'Scatter', 0, 100),
          k.range('spiralDotSize', 'Dot size', 2, 14),
          k.range('spiralDensity', 'Dot density', 20, 100),
          k.range('spiralAccent', 'Accent mix', 0, 100),
          k.button('Use reference palette', 'palette', () => app.set({ background: '#c8c8cb', glyph: '#7771ca', color: '#df77da' }), { variant: 'outline' }),
          k.note('Lavender and pink, or choose your own in Colors.')),
        k.section({ title: 'Frame', aside: 'Optional crop', when: organic },
          k.select('shape', 'Shape', Object.entries(shapeNames).map(([value, label]) => ({ value, label }))),
          k.select('shapeFill', 'Fill', [{ value: 'pattern', label: 'Organic pattern' }, { value: 'solid', label: 'Full glyph fill' }], { inline: true, when: s => s.shape !== 'freeform' }),
          k.note(s => s.shape === 'freeform' ? 'Let the pattern extend to the canvas edges.' : 'A centered ' + shapeNames[s.shape].toLowerCase() + ', filled with glyphs.')),
        k.section({ title: 'Texture', when: s => s.form !== 'spiral' },
          k.range('scale', 'Form scale', 10, 90),
          k.range('density', 'Coverage', 20, 80),
          k.range('detail', 'Glyph size', 6, 16),
          k.range('accent', 'Letter marks', 0, 100),
          k.button('Reset texture', 'reset', () => app.set(Object.fromEntries(textureKeys.map(key => [key, defaults[key]]))))),
      ] },
      { id: 'colors', label: 'Colors', content: [
        k.section({ title: 'Colors', aside: 'Artwork only' },
          k.toggle('transparent', 'Transparent background', 'PNG & SVG exports'),
          k.color('background', 'Background color', { disabled: s => s.transparent }),
          k.color('glyph', s => s.form === 'spiral' ? 'Dot color' : 'Glyph color'),
          k.swatches('color', 'Accent color'),
          k.button('Reset colors', 'reset', () => app.set(Object.fromEntries(colorKeys.map(key => [key, defaults[key]]))))),
      ] },
      { id: 'canvas', label: 'Canvas', content: [
        k.section({ title: 'Canvas' },
          k.select('ratio', 'Ratio', ratioOptions, { inline: true }),
          k.select('resolution', 'Export size', resolutionOptions, { inline: true, number: true }),
          k.seed('seed')),
      ] },
    ],
  });
})();
