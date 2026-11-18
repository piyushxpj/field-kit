/* Pixel Pop: an image resampled to a grid, each cell drawn as a square, circle or dot in its own color. */
(() => {
  'use strict';
  const { util, register, resolutionOptions } = FieldKit;
  const CELL = 10;
  const defaults = { gridSize: 32, spacing: 0, shape: 'square', sampling: 'sharp', levels: 0, outline: false, transparent: true, background: '#ffffff', resolution: 2048 };
  const shapeNames = { square: 'Square', circle: 'Circle', dot: 'Dot' };

  function sample(source, cols, smooth = false) {
    const rows = Math.max(1, Math.round(cols * source.height / source.width));
    const c = document.createElement('canvas'); c.width = cols; c.height = rows;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    // Smooth averages each cell; sharp keeps the original single-pixel pick, which can look noisy on photos.
    ctx.imageSmoothingEnabled = smooth;
    ctx.imageSmoothingQuality = 'high';
    if (smooth && Math.max(source.width / cols, source.height / rows) > 2) {
      // Halve in steps so the browser averages every pixel rather than skipping most of them.
      let img = source.image, w = source.width, h = source.height;
      while (w / 2 > cols * 2 && h / 2 > rows * 2) {
        const t = document.createElement('canvas'); t.width = Math.round(w / 2); t.height = Math.round(h / 2);
        const tc = t.getContext('2d'); tc.imageSmoothingQuality = 'high'; tc.drawImage(img, 0, 0, t.width, t.height);
        img = t; w = t.width; h = t.height;
      }
      ctx.drawImage(img, 0, 0, cols, rows);
    } else ctx.drawImage(source.image, 0, 0, cols, rows);
    return { cols, rows, data: ctx.getImageData(0, 0, cols, rows).data };
  }

  function cells(s, source) {
    const { cols, rows, data } = sample(source, s.gridSize, s.sampling === 'smooth'), pitch = CELL + s.spacing, out = [];
    const n = s.levels, q = v => n ? Math.round(Math.round(v / 255 * (n - 1)) * 255 / (n - 1)) : v;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4, a = data[i + 3];
      if (a < 10) continue;
      out.push({ x: x * pitch, y: y * pitch, r: q(data[i]), g: q(data[i + 1]), b: q(data[i + 2]), a: a / 255 });
    }
    return { cols, rows, width: cols * pitch, height: rows * pitch, cells: out };
  }

  function draw(canvas, s, source, longest) {
    const start = performance.now(), grid = cells(s, source);
    const k = longest ? longest / Math.max(grid.width, grid.height) : 1;
    canvas.width = Math.round(grid.width * k); canvas.height = Math.round(grid.height * k);
    const ctx = canvas.getContext('2d');
    ctx.scale(k, k);
    if (!s.transparent) { ctx.fillStyle = s.background; ctx.fillRect(0, 0, grid.width, grid.height); }
    for (const c of grid.cells) {
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${c.a})`;
      if (s.shape === 'square') ctx.fillRect(c.x, c.y, CELL, CELL);
      else { ctx.beginPath(); ctx.arc(c.x + CELL / 2, c.y + CELL / 2, s.shape === 'circle' ? CELL / 2 : CELL / 4, 0, Math.PI * 2); ctx.fill(); }
      if (s.outline) {
        ctx.strokeStyle = `rgba(0,0,0,${.28 * c.a})`; ctx.lineWidth = .6;
        if (s.shape === 'square') ctx.strokeRect(c.x + .3, c.y + .3, CELL - .6, CELL - .6);
        else ctx.stroke();
      }
    }
    return { ms: Math.round(performance.now() - start), grid };
  }

  function svg(s, source) {
    const grid = cells(s, source), k = s.resolution / Math.max(grid.width, grid.height);
    const hex = c => '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');
    const marks = grid.cells.map(c => {
      const fill = `fill="${hex(c)}"${c.a < 1 ? ` fill-opacity="${c.a.toFixed(3)}"` : ''}`;
      const stroke = s.outline ? ` stroke="#000" stroke-opacity="${(.28 * c.a).toFixed(3)}" stroke-width=".6"` : '';
      return s.shape === 'square' ? `<rect x="${c.x}" y="${c.y}" width="${CELL}" height="${CELL}" ${fill}${stroke}/>` : `<circle cx="${c.x + CELL / 2}" cy="${c.y + CELL / 2}" r="${s.shape === 'circle' ? CELL / 2 : CELL / 4}" ${fill}${stroke}/>`;
    }).join('');
    const bg = s.transparent ? '' : `<rect width="${grid.width}" height="${grid.height}" fill="${s.background}"/>`;
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(grid.width * k)}" height="${Math.round(grid.height * k)}" viewBox="0 0 ${grid.width} ${grid.height}"><title>Pixel Pop — ${grid.cols} × ${grid.rows}</title>${bg}${marks}</svg>`;
  }

  register({
    id: 'pixel', name: 'Pixel Pop', icon: 'grid', tagline: 'Turn any image into pixel art.',
    intro: { title: 'Pixel Pop', text: 'Drop, paste or upload an image. Choose the grid.' },
    defaults, needsSource: true,
    primary: { label: 'Open image', short: 'Open', icon: 'upload', run: app => { app.openFile(); } },
    formats: [{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' }],
    title: s => `${shapeNames[s.shape]} pixels`,
    sub: (s, app) => app.source.name,
    dims: (s, app) => { const cols = s.gridSize, rows = Math.max(1, Math.round(cols * app.source.height / app.source.width)), pitch = CELL + s.spacing, k = s.resolution / Math.max(cols * pitch, rows * pitch); return `${cols} × ${rows} grid · ${Math.round(cols * pitch * k)} × ${Math.round(rows * pitch * k)}`; },
    transparent: s => s.transparent,
    describe: (s, app) => `${app.source.name} as ${s.gridSize}-column pixel art drawn with ${s.shape}s.`,
    render: (canvas, s, app) => draw(canvas, s, app.source, 1600).ms,
    snapshot: (s, longest, app) => { const c = document.createElement('canvas'); draw(c, s, app.source, longest); return c; },
    async export(s, format, app) {
      if (format === 'svg') return new Blob([svg(s, app.source)], { type: 'image/svg+xml;charset=utf-8' });
      const c = document.createElement('canvas'); draw(c, s, app.source, s.resolution); return util.toBlob(c);
    },
    filename: (s, format, app) => `pixel-pop-${util.slug(app.source.name)}-${s.gridSize}-${s.shape}${s.transparent ? '-transparent' : ''}.${format}`,
    panels: (k, app) => [
      { id: 'pixels', label: 'Pixels', content: [
        app.sourceSection(k),
        k.section({ title: 'Grid', aside: s => `${s.gridSize} columns` },
          k.range('gridSize', 'Grid resolution', 8, 128, 4),
          k.range('spacing', 'Pixel spacing', 0, 10, 1, { format: v => v + ' px' })),
        k.section({ title: 'Color', aside: s => s.levels ? `${s.levels ** 3} colors max` : 'Full color' },
          k.segmented('sampling', 'Sampling', [{ value: 'sharp', label: 'Sharp' }, { value: 'smooth', label: 'Smooth' }]),
          k.select('levels', 'Palette', [{ value: 0, label: 'Full color' }, { value: 6, label: 'Rich · 6 levels' }, { value: 4, label: 'Retro · 4 levels' }, { value: 3, label: 'Poster · 3 levels' }, { value: 2, label: 'Primary · 2 levels' }], { number: true }),
          k.toggle('outline', 'Cell outlines', 'A fine dark edge on every pixel')),
        k.section({ title: 'Pixel shape', aside: '3 shapes' },
          k.forms('shape', [{ value: 'square', label: 'Square', icon: 'square' }, { value: 'circle', label: 'Circle', icon: 'circle' }, { value: 'dot', label: 'Dot', icon: 'dot' }], { cols: 3, stacked: true, label: 'Pixel shape' }),
          k.button('Reset settings', 'reset', () => app.set({ gridSize: defaults.gridSize, spacing: defaults.spacing, shape: defaults.shape, sampling: defaults.sampling, levels: defaults.levels, outline: defaults.outline }))),
      ] },
      { id: 'canvas', label: 'Canvas', content: [
        k.section({ title: 'Background' },
          k.toggle('transparent', 'Transparent background', 'PNG & SVG exports'),
          k.color('background', 'Background color', { disabled: s => s.transparent })),
        k.section({ title: 'Export' },
          k.select('resolution', 'Export size', resolutionOptions, { inline: true, number: true }),
          k.note('PNG scales every cell to the longest edge. SVG keeps each pixel as an editable shape.')),
      ] },
    ],
  });
})();
