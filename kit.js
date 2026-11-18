/* Field Kit: shared icons, helpers and inspector controls. Every tool builds its panels from these. */
(() => {
  'use strict';
  const icons = {
    shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-7.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/>',
    download: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
    upload: '<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    enter: '<path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    play: '<path d="M6 3 20 12 6 21Z"/>',
    scatter: '<path d="m7 7-3-3m13 3 3-3M7 17l-3 3m13-3 3 3"/><path d="M10 12h4m-2-2v4"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    branch: '<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    circleDot: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>',
    waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    hexagon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
    circles: '<circle cx="7" cy="7" r="4"/><circle cx="17" cy="7" r="4"/><circle cx="7" cy="17" r="4"/><circle cx="17" cy="17" r="4"/>',
    orbit: '<circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><path d="M10.4 21.9a10 10 0 0 0 9.941-15.416"/><path d="M13.5 2.1a10 10 0 0 0-9.841 15.416"/>',
    type: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
    dither: '<path d="M4 4h2v2H4zM10 4h2v2h-2zM16 4h2v2h-2zM7 10h2v2H7zM13 10h2v2h-2zM19 10h1v2h-1zM4 16h2v2H4zM10 16h2v2h-2zM16 16h2v2h-2z"/>',
    grid: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    square: '<rect width="16" height="16" x="4" y="4" rx="1"/>',
    circle: '<circle cx="12" cy="12" r="8"/>',
    dot: '<circle cx="12" cy="12" r="3.5"/>',
    diamond: '<path d="M12 3 21 12 12 21 3 12Z"/>',
    zoomIn: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/>',
    zoomOut: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    compare: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/><path d="M3 15l5-5 4 4"/>',
    keyboard: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 13h6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
  };
  const icon = (name, size) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"${size ? ` style="width:${size}px;height:${size}px"` : ''}>${icons[name] || name}</svg>`;

  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return el;
  }

  const util = {
    hash(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; },
    random(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; },
    sizeFor(ratio, longest) { const [w, h] = ratio.split(':').map(Number); return w >= h ? [longest, Math.round(longest * h / w)] : [Math.round(longest * w / h), longest]; },
    escapeXML(value) { return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch])); },
    shade(color, factor) { return '#' + [1, 3, 5].map(i => Math.round(parseInt(color.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0')).join(''); },
    hexToRgb(hex) { return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); },
    isHex: v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v),
    newSeed() { const a = new Uint32Array(1); crypto.getRandomValues(a); return String(a[0] % 1000000).padStart(6, '0'); },
    toBlob(canvas, type = 'image/png') { return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Image encoding failed')), type)); },
    download(blob, name) { const url = URL.createObjectURL(blob), a = h('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000); },
    slug: v => String(v).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase(),
  };

  const ratioOptions = [{ value: '4:5', label: 'Portrait · 4:5' }, { value: '1:1', label: 'Square · 1:1' }, { value: '16:9', label: 'Landscape · 16:9' }, { value: '9:16', label: 'Story · 9:16' }];
  const resolutionOptions = [{ value: 2048, label: '2K · 2048 px' }, { value: 4096, label: '4K · 4096 px' }];
  const accentPresets = [['Monochrome', '#eeeeee'], ['Violet', '#b980e8'], ['Sage', '#b9d89c'], ['Ember', '#f49a77'], ['Ice', '#9bcddd']];

  let uid = 0;
  /* api: { get(): state, set(patch, {draft}) } */
  function createKit(api) {
    const updaters = [], schema = {};
    const watch = (el, fn) => { updaters.push(() => fn(api.get())); return el; };
    const showWhen = (el, when) => when ? watch(el, s => { el.hidden = !when(s); }) : el;
    const text = (v, s) => typeof v === 'function' ? v(s) : v;

    function section({ title, aside, when, label }, ...children) {
      const asideEl = aside !== undefined ? h('span') : null;
      if (asideEl) watch(asideEl, s => { asideEl.textContent = text(aside, s); });
      const el = h('section', { 'aria-label': label || title }, h('div', { class: 'section-heading' }, h('h2', {}, title), asideEl), children);
      return showWhen(el, when);
    }

    function forms(key, options, { cols = 2, stacked = false, describe = false, label } = {}) {
      schema[key] = { values: options.map(o => o.value) };
      const group = h('div', { class: `forms cols-${cols}${stacked ? ' stacked' : ''}`, role: 'group', 'aria-label': label || key });
      const highlight = h('span', { class: 'structure-selection', 'aria-hidden': 'true' });
      group.append(highlight);
      const buttons = options.map(o => {
        const b = h('button', { type: 'button', class: `form${o.wide ? ' wide' : ''}`, 'aria-pressed': 'false', title: o.desc || o.label, onclick: () => api.set({ [key]: o.value }) },
          o.icon ? h('span', { html: icon(o.icon), style: 'display:contents' }) : null, h('span', { class: 'form-name' }, o.label));
        b.dataset.value = o.value; group.append(b); return b;
      });
      let ready = false;
      const place = () => {
        const b = buttons.find(x => x.classList.contains('selected'));
        if (!b || !b.offsetWidth) { highlight.style.opacity = '0'; return; }
        const instant = !ready || document.documentElement.dataset.input === 'keyboard';
        if (instant) highlight.style.transition = 'none';
        Object.assign(highlight.style, { opacity: '1', width: b.offsetWidth + 'px', height: b.offsetHeight + 'px', transform: `translate(${b.offsetLeft}px,${b.offsetTop}px)` });
        if (instant) { highlight.offsetWidth; highlight.style.transition = ''; }
        ready = true;
      };
      new ResizeObserver(() => { ready = false; place(); }).observe(group);
      const desc = describe ? h('p', { class: 'structure-description' }) : null;
      watch(group, s => {
        for (const b of buttons) { const on = String(s[key]) === b.dataset.value; b.classList.toggle('selected', on); b.setAttribute('aria-pressed', String(on)); }
        place();
        if (desc) desc.textContent = options.find(o => o.value === s[key])?.desc || '';
      });
      return desc ? [group, desc] : group;
    }

    function select(key, label, options, { inline = false, when, number = false } = {}) {
      const id = 'fk-' + (++uid);
      const flat = options.flatMap(o => o.options || [o]);
      schema[key] = { values: flat.map(o => o.value) };
      const el = h('select', { id, class: 'studio-select', onchange: () => api.set({ [key]: number ? Number(el.value) : el.value }) },
        options.map(o => o.options ? h('optgroup', { label: o.group }, o.options.map(x => h('option', { value: x.value }, x.label))) : h('option', { value: o.value }, o.label)));
      watch(el, s => { el.value = String(s[key]); });
      const wrap = h('div', { class: `field${inline ? ' inline' : ''}` }, h('label', { class: 'field-label', for: id }, label), el);
      return showWhen(wrap, when);
    }

    function range(key, label, min, max, step = 1, { format = v => v, when, disabled } = {}) {
      const id = 'fk-' + (++uid);
      schema[key] = { min, max };
      const input = h('input', { id, class: 'range', type: 'range', min, max, step,
        oninput: () => api.set({ [key]: Number(input.value) }, { draft: true }),
        onchange: () => api.set({ [key]: Number(input.value) }) });
      const out = h('output', { for: id });
      watch(input, s => {
        input.value = s[key]; out.textContent = format(s[key]);
        input.style.setProperty('--fill', ((s[key] - min) / (max - min) * 100) + '%');
        if (disabled) input.disabled = disabled(s);
      });
      return showWhen(h('div', { class: 'range-field' }, h('label', { class: 'range-label', for: id }, label, out), input), when);
    }

    function toggle(key, label, hint, { when } = {}) {
      schema[key] = { type: 'boolean' };
      const id = 'fk-' + (++uid);
      const sw = h('button', { type: 'button', class: 'switch', role: 'switch', 'aria-labelledby': id, onclick: () => api.set({ [key]: !api.get()[key] }) }, h('span'));
      watch(sw, s => sw.setAttribute('aria-checked', String(!!s[key])));
      return showWhen(h('div', { class: 'switch-row' }, h('div', {}, h('span', { id }, label), hint ? h('p', {}, hint) : null), sw), when);
    }

    function colorTrigger(key, labelText, onPick) {
      const input = h('input', { type: 'color', 'aria-label': labelText, oninput: () => onPick(input.value, true), onchange: () => onPick(input.value, false) });
      const chip = h('span', { class: 'trigger-color' }), hex = h('span', { class: 'trigger-hex' });
      const el = h('span', { class: 'color-value-trigger' }, chip, hex, h('span', { html: icon('chevron'), style: 'display:contents' }), input);
      return { el, input, show(v) { input.value = v; chip.style.background = v; hex.textContent = v; } };
    }

    function color(key, label, { disabled, when } = {}) {
      schema[key] = { type: 'color' };
      const name = h('span', { class: 'field-label' });
      const t = colorTrigger(key, typeof label === 'string' ? label : 'Color', (v, draft) => api.set({ [key]: v }, { draft }));
      const row = h('div', { class: 'color-row' }, name, t.el);
      watch(row, s => { name.textContent = text(label, s); t.input.setAttribute('aria-label', text(label, s)); t.show(s[key]); row.classList.toggle('color-disabled', !!(disabled && disabled(s))); t.input.disabled = !!(disabled && disabled(s)); });
      return showWhen(row, when);
    }

    function swatches(key, label, presets = accentPresets, { when } = {}) {
      schema[key] = { type: 'color' };
      const code = h('span', { class: 'color-code' });
      const buttons = presets.map(([name, value]) => {
        const b = h('button', { type: 'button', class: 'color-swatch', 'aria-label': name, title: name, onclick: () => api.set({ [key]: value }) }, h('span', { style: `background:${value}` }));
        b.dataset.value = value; return b;
      });
      const customInput = h('input', { type: 'color', 'aria-label': 'Custom ' + label.toLowerCase(), oninput: () => api.set({ [key]: customInput.value }, { draft: true }), onchange: () => api.set({ [key]: customInput.value }) });
      const custom = h('span', { class: 'color-swatch custom', title: 'Custom color', html: icon('plus') }); custom.append(customInput);
      const el = h('div', { class: 'accent-control' }, h('div', { class: 'accent-heading' }, h('span', {}, label), code), h('div', { class: 'color-presets', role: 'group', 'aria-label': label }, buttons, custom));
      watch(el, s => {
        const v = s[key]; code.textContent = v; customInput.value = v;
        let match = false;
        for (const b of buttons) { const on = b.dataset.value.toLowerCase() === v.toLowerCase(); match ||= on; b.setAttribute('aria-pressed', String(on)); }
        custom.setAttribute('aria-pressed', String(!match));
      });
      return showWhen(el, when);
    }

    /* presets: [{name, values: {key: color}}] — two-tone swatches that set several keys at once. */
    function palettes(label, presets, { when } = {}) {
      const keys = Object.keys(presets[0].values);
      const name = h('span', { class: 'palette-name' });
      const buttons = presets.map(p => {
        const [a, b] = keys.map(k => p.values[k]);
        const btn = h('button', { type: 'button', class: 'color-swatch duo', 'aria-label': p.name + ' palette', title: p.name, onclick: () => api.set({ ...p.values }) }, h('span', { style: `--a:${a};--b:${b || a}` }));
        btn._p = p; return btn;
      });
      const el = h('div', { class: 'palette-control' }, h('div', { class: 'accent-heading' }, h('span', {}, label), name), h('div', { class: 'color-presets', role: 'group', 'aria-label': label }, buttons));
      watch(el, s => {
        let current = 'Custom';
        for (const b of buttons) { const on = keys.every(k => s[k]?.toLowerCase() === b._p.values[k].toLowerCase()); if (on) current = b._p.name; b.setAttribute('aria-pressed', String(on)); }
        name.textContent = current;
      });
      return showWhen(el, when);
    }

    function segmented(key, label, options, { when } = {}) {
      schema[key] = { values: options.map(o => o.value) };
      const buttons = options.map(o => { const b = h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => api.set({ [key]: o.value }) }, o.label); b.dataset.value = o.value; return b; });
      const el = h('div', { class: 'field' }, label ? h('span', { class: 'field-label' }, label) : null, h('div', { class: 'segmented', role: 'group', 'aria-label': label || key }, buttons));
      watch(el, s => { for (const b of buttons) b.setAttribute('aria-pressed', String(String(s[key]) === b.dataset.value)); });
      return showWhen(el, when);
    }

    function button(label, iconName, onclick, { variant = 'text', when } = {}) {
      const el = h('button', { type: 'button', class: variant === 'outline' ? 'outline-button' : 'text-button', onclick }, iconName ? h('span', { html: icon(iconName), style: 'display:contents' }) : null, h('span', {}, label));
      return showWhen(el, when);
    }

    function note(content, { when } = {}) {
      const el = h('p', { class: 'structure-description' });
      watch(el, s => { el.textContent = text(content, s); });
      return showWhen(el, when);
    }

    function textField(key, label, { maxlength = 40, placeholder = '', when } = {}) {
      schema[key] = { type: 'string' };
      const id = 'fk-' + (++uid);
      const input = h('input', { id, class: 'text-input', maxlength, placeholder, spellcheck: 'false', autocomplete: 'off', oninput: () => api.set({ [key]: input.value }, { draft: true }), onchange: () => api.set({ [key]: input.value }) });
      watch(input, s => { if (document.activeElement !== input) input.value = s[key]; });
      return showWhen(h('div', { class: 'field' }, h('label', { class: 'field-label', for: id }, label), input), when);
    }

    function seed(key = 'seed') {
      schema[key] = { type: 'string' };
      const input = h('input', { id: 'fk-seed', maxlength: 24, spellcheck: 'false', 'aria-label': 'Seed', onkeydown: e => { if (e.key === 'Enter') apply(); } });
      const apply = () => api.set({ [key]: input.value.trim() || api.get()[key] });
      watch(input, s => { if (document.activeElement !== input) input.value = s[key]; });
      return [h('label', { class: 'seed-label', for: 'fk-seed' }, 'Seed', h('span', {}, 'Repeat a composition')),
        h('div', { class: 'seed-wrap' }, input, h('button', { type: 'button', 'aria-label': 'Apply seed', html: icon('enter'), onclick: apply }))];
    }

    const custom = (el, fn, { when } = {}) => showWhen(fn ? watch(el, fn) : el, when);

    return { schema, update() { for (const u of updaters) u(); }, section, forms, select, range, toggle, color, swatches, palettes, segmented, button, note, seed, textField, custom, h, icon };
  }

  const tools = [];
  window.FieldKit = { tools, icons, icon, h, util, createKit, ratioOptions, resolutionOptions, accentPresets, register: tool => { tools.push(tool); } };
})();
