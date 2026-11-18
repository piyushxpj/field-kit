/* Field Kit shell: one studio, four tools. Tools describe their controls and renderer; the shell owns everything else. */
(() => {
  'use strict';
  const { tools, util, icon, h, createKit } = FieldKit;
  const $ = id => document.getElementById(id);
  const STORAGE = 'field-kit-v1';
  const stage = $('stage');
  const byId = Object.fromEntries(tools.map(t => [t.id, t]));

  document.documentElement.dataset.input = 'pointer';
  document.addEventListener('pointerdown', () => { document.documentElement.dataset.input = 'pointer'; }, true);
  document.addEventListener('keydown', () => { document.documentElement.dataset.input = 'keyboard'; }, true);
  for (const el of document.querySelectorAll('[data-icon]')) el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
  $('copy').innerHTML = icon('copy');

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE)) || {}; } catch { /* Fresh state is always usable. */ }
  const states = {}, histories = {}, formats = { ...(saved.formats || {}) }, tabs = { ...(saved.tabs || {}) };
  let tool, state, kit, art, timer, frame = 0, revision = 0, imageTool = byId[saved.imageTool]?.needsSource ? saved.imageTool : 'dither';

  /* Saved data is checked against each tool's defaults and control schema before use. */
  function sanitize(t, raw, schema = t.schema || {}) {
    const s = { ...t.defaults };
    if (!raw || typeof raw !== 'object') return s;
    for (const [key, fallback] of Object.entries(t.defaults)) {
      const v = raw[key], rule = schema[key];
      if (typeof v !== typeof fallback || (typeof v === 'number' && !Number.isFinite(v))) continue;
      if (rule?.values && !rule.values.map(String).includes(String(v))) continue;
      if (rule?.min !== undefined && (v < rule.min || v > rule.max)) continue;
      if ((rule?.type === 'color' || /^#[0-9a-f]{6}$/i.test(fallback)) && !util.isHex(v)) continue;
      if (key === 'seed' && typeof v === 'string' && v.length > 24) continue;
      s[key] = v;
    }
    return s;
  }

  /* ---------- Shared image source for Dither and Pixel Pop ---------- */
  function sampleImage() {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 1200;
    const x = c.getContext('2d');
    const sky = x.createLinearGradient(0, 0, 0, 1200); sky.addColorStop(0, '#f7d9c4'); sky.addColorStop(.62, '#c7b6e2'); sky.addColorStop(1, '#5f6fa8');
    x.fillStyle = sky; x.fillRect(0, 0, 1200, 1200);
    x.fillStyle = '#fff3e3'; x.globalAlpha = .55; x.beginPath(); x.arc(930, 250, 120, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
    const floor = x.createLinearGradient(0, 820, 0, 1200); floor.addColorStop(0, '#3f4a7d'); floor.addColorStop(1, '#1b2040');
    x.fillStyle = floor; x.fillRect(0, 820, 1200, 380);
    const sphere = (cx, cy, r, light, mid, dark) => {
      x.fillStyle = '#0f12264d'; x.beginPath(); x.ellipse(cx + r * .25, cy + r * .95, r * 1.05, r * .22, 0, 0, Math.PI * 2); x.fill();
      const g = x.createRadialGradient(cx - r * .38, cy - r * .42, r * .08, cx, cy, r * 1.05); g.addColorStop(0, light); g.addColorStop(.45, mid); g.addColorStop(1, dark);
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    };
    sphere(470, 640, 300, '#ffe0b8', '#f0703f', '#5b1630');
    sphere(910, 790, 150, '#d7fff4', '#3fb6a8', '#0f3b4d');
    sphere(170, 900, 80, '#fff8c9', '#f2c527', '#6b4a10');
    return { id: 'sample', image: c, width: 1200, height: 1200, name: 'Sample · Spheres' };
  }
  let source = sampleImage(), sourceCount = 0;

  function setSource(image, name) {
    source = { id: 'img-' + (++sourceCount), image, width: image.naturalWidth || image.width, height: image.naturalHeight || image.height, name: name || 'Image' };
    if (!tool.needsSource) selectTool(imageTool); else draw(false);
    toast(`${source.name} is ready in Dither and Pixel Pop`);
  }
  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) { toast('That file is not an image'); return; }
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { setSource(img, file.name.replace(/\.[^.]+$/, '') || 'Pasted image'); };
    img.onerror = () => { URL.revokeObjectURL(url); toast('That image could not be opened'); };
    img.src = url;
  }
  $('file').addEventListener('change', e => { loadFile(e.target.files[0]); e.target.value = ''; });

  function sourceSection(k) {
    const thumb = h('canvas', { width: 96, height: 96, 'aria-hidden': 'true' }), name = h('strong'), meta = h('small');
    let shown = '';
    const card = k.custom(h('div', { class: 'source-card' }, thumb, h('div', {}, name, meta)), () => {
      if (shown === source.id) return; shown = source.id;
      const x = thumb.getContext('2d'), side = Math.min(source.width, source.height);
      x.clearRect(0, 0, 96, 96); x.drawImage(source.image, (source.width - side) / 2, (source.height - side) / 2, side, side, 0, 0, 96, 96);
      name.textContent = source.name; meta.textContent = `${source.width} × ${source.height}`;
    });
    return k.section({ title: 'Source', aside: 'Shared by both image tools' }, card,
      h('div', { class: 'button-row' },
        k.button('Upload', 'upload', () => $('file').click(), { variant: 'outline' }),
        k.button('Sample', 'image', () => { source = sampleImage(); draw(false); }, { variant: 'outline' })),
      k.button('Use Glyph Field artwork', 'type', () => {
        const glyph = byId.glyph, gs = states.glyph || sanitize(glyph, saved.states?.glyph);
        setSource(glyph.snapshot(gs, 1500), `Glyph Field · ${gs.seed}`);
      }, { variant: 'outline' }),
      k.note('Or drop or paste an image anywhere.'));
  }

  /* ---------- Tool API ---------- */
  const app = {
    get state() { return state; },
    get source() { return source; },
    set,
    openFile: () => $('file').click(),
    sourceSection,
    toast,
    status: text => { $('render-status').textContent = text; },
  };

  /* Undo keeps whole states per tool. A slider drag is one step: its first draft remembers where it started. */
  const undos = {}, redos = {};
  let draftBase = null, zoom = 'fit';
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function step(direction) {
    const from = direction < 0 ? undos : redos, to = direction < 0 ? redos : undos, list = from[tool.id] || [];
    if (!list.length) { toast(direction < 0 ? 'Nothing to undo' : 'Nothing to redo'); return; }
    (to[tool.id] ||= []).push(state);
    state = states[tool.id] = list.pop(); draftBase = null;
    draw(false); app.status(direction < 0 ? 'Undone' : 'Redone');
  }

  function set(patch, { draft = false } = {}) {
    if (!patch) return;
    const prev = state;
    state = { ...state, ...patch }; states[tool.id] = state;
    if (draft) draftBase ||= prev;
    else {
      const base = draftBase || prev; draftBase = null;
      if (!same(base, state)) { const u = (undos[tool.id] ||= []); u.push(base); if (u.length > 100) u.shift(); redos[tool.id] = []; }
    }
    clearTimeout(timer);
    if (draft) {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(false); });
      timer = setTimeout(remember, 350);
    } else draw(true);
  }

  /* ---------- Tool switching ---------- */
  const nav = $('tool-nav');
  for (const t of tools) {
    nav.append(h('button', { type: 'button', role: 'tab', class: 'tool-tab', id: 'tool-' + t.id, 'aria-selected': 'false', 'aria-controls': 'inspector', html: icon(t.icon) + `<span>${t.name}</span>`, onclick: () => selectTool(t.id) }));
  }
  nav.addEventListener('keydown', e => arrowTabs(e, nav, b => b.click()));
  function arrowTabs(e, list, activate) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const items = [...list.querySelectorAll('[role=tab]')], i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = items[e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length];
    next.focus(); activate(next);
  }

  function selectTool(id) {
    const next = byId[id] || tools[0];
    if (tool?.live) tool.unmount();
    if (tool) states[tool.id] = state;
    tool = next;
    if (tool.needsSource) imageTool = tool.id;
    clearTimeout(timer); cancelAnimationFrame(frame); frame = 0;
    for (const b of nav.children) b.setAttribute('aria-selected', String(b.id === 'tool-' + tool.id));
    history.replaceState(null, '', '#' + tool.id);
    document.title = `${tool.name} — Field Kit`;
    $('tool-title').textContent = tool.intro.title; $('tool-intro').textContent = tool.intro.text;

    const p = tool.primary;
    $('primary').innerHTML = icon(p.icon) + `<span class="label-long">${p.label}</span><span class="label-short">${p.short}</span>` + (p.kbd ? `<kbd>${p.kbd}</kbd>` : '');
    $('primary').setAttribute('aria-label', p.label);
    $('primary').setAttribute('aria-keyshortcuts', p.kbd ? p.kbd : '');
    const format = $('export-format'); format.replaceChildren(...tool.formats.map(f => h('option', { value: f.value }, f.label)));
    format.value = tool.formats.some(f => f.value === formats[tool.id]) ? formats[tool.id] : tool.formats[0].value;

    kit = createKit({ get: () => state, set });
    const panels = tool.panels(kit, app);
    tool.schema = kit.schema;
    state = states[tool.id] = sanitize(tool, states[tool.id] || saved.states?.[tool.id]);
    if (!histories[tool.id]) histories[tool.id] = (saved.history?.[tool.id] || []).filter(e => e && typeof e.image === 'string' && e.image.startsWith('data:image/')).map(e => ({ state: sanitize(tool, e.state), image: e.image })).slice(0, 8);
    buildInspector(panels);
    draftBase = null;

    art?.remove();
    art = h('canvas', { id: 'art', role: 'img' });
    stage.append(art);
    const actions = tool.live ? tool.mount(art, state, app) : [zoomButton];
    if (tool.needsSource) actions.push(compareButton);
    $('stage-actions').replaceChildren(...actions);
    art.addEventListener('dblclick', () => { if (!tool.live) toggleZoom(); });
    historyButtons.clear(); $('history').replaceChildren();
    draw(false);
  }

  function buildInspector(panels) {
    const list = h('div', { class: 'inspector-nav', role: 'tablist', 'aria-label': `${tool.name} controls` });
    const active = panels.some(p => p.id === tabs[tool.id]) ? tabs[tool.id] : panels[0].id;
    const views = panels.map(p => {
      const tab = h('button', { type: 'button', role: 'tab', class: 'inspector-tab', id: `tab-${tool.id}-${p.id}`, 'aria-controls': `panel-${tool.id}-${p.id}`, 'aria-selected': String(p.id === active), tabindex: p.id === active ? '0' : '-1' }, p.label);
      const panel = h('div', { role: 'tabpanel', class: 'inspector-panel', id: `panel-${tool.id}-${p.id}`, 'aria-labelledby': tab.id, tabindex: '0', hidden: p.id !== active }, p.content);
      tab.addEventListener('click', () => {
        for (const v of views) { const on = v.tab === tab; v.tab.setAttribute('aria-selected', String(on)); v.tab.tabIndex = on ? 0 : -1; v.panel.hidden = !on; }
        tabs[tool.id] = p.id; persist();
      });
      list.append(tab); return { tab, panel };
    });
    list.addEventListener('keydown', e => arrowTabs(e, list, b => b.click()));
    if (panels.length < 2) list.hidden = true;
    const reset = h('button', { type: 'button', class: 'text-button reset-all', onclick: () => { set({ ...tool.defaults }); toast(`${tool.name} reset · ⌘Z to undo`); } }, h('span', { html: icon('reset'), style: 'display:contents' }), h('span', {}, `Reset all ${tool.name} settings`));
    $('inspector').replaceChildren(list, ...views.map(v => v.panel), reset);
  }

  /* ---------- Rendering ---------- */
  function fit() {
    const cs = getComputedStyle(stage);
    const W = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const H = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const ratio = tool.ratio ? (([a, b]) => a / b)(tool.ratio(state).split(':').map(Number)) : art.width / art.height;
    stage.style.setProperty('--art-ratio', String(ratio));
    if (W <= 0 || H <= 0 || !Number.isFinite(ratio)) return;
    const actual = zoom === 'actual' && !tool.live;
    stage.classList.toggle('actual', actual);
    let w = W, hh = W / ratio; if (hh > H) { hh = H; w = H * ratio; }
    if (actual) { w = art.width / devicePixelRatio; hh = art.height / devicePixelRatio; }
    art.style.width = Math.floor(w) + 'px'; art.style.height = Math.floor(hh) + 'px';
    // Nearest-neighbour only when enlarging; shrinking a 1-bit image that way produces moiré.
    art.classList.toggle('pixelated', !!tool.pixelated && w * devicePixelRatio >= art.width);
  }
  new ResizeObserver(() => { if (art) fit(); }).observe(stage);

  function draw(save = true) {
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    revision++;
    kit.update();
    $('art-title').textContent = tool.title(state, app);
    $('art-sub').textContent = tool.sub(state, app);
    $('dimensions').textContent = tool.dims(state, app);
    art.classList.toggle('checker', !!tool.transparent?.(state));
    art.setAttribute('aria-label', tool.describe(state, app));
    if (tool.live) { fit(); tool.update(state, app); }
    else {
      try { const ms = tool.render(art, state, app); fit(); app.status(`Rendered in ${ms} ms`); }
      catch (error) { console.error(error); app.status('Could not render. Try another setting.'); }
    }
    if (save) remember(); else { showHistory(); persist(); }
  }

  /* ---------- History ---------- */
  const historyKey = s => { const { resolution, scale, paused, ...visual } = s; return JSON.stringify(visual); };
  function thumbnail() {
    const src = tool.live ? tool.snapshot(state, 288) : art, transparent = !!tool.transparent?.(state);
    const c = document.createElement('canvas'); c.width = 144; c.height = Math.max(1, Math.round(144 * src.height / src.width));
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return transparent ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', .72);
  }
  function remember() {
    const list = histories[tool.id], k = historyKey(state);
    if (!list.some(e => historyKey(e.state) === k)) list.unshift({ state: { ...state }, image: thumbnail() });
    histories[tool.id] = list.slice(0, 8);
    showHistory(); persist();
  }
  const historyButtons = new Map();
  function showHistory() {
    const list = histories[tool.id], container = $('history'), visible = new Set(list.map(e => historyKey(e.state)));
    for (const [id, button] of historyButtons) if (!visible.has(id)) { button.remove(); historyButtons.delete(id); }
    $('history-count').textContent = String(list.length).padStart(2, '0');
    container.querySelector('.history-empty')?.remove();
    if (!list.length) container.append(h('span', { class: 'history-empty' }, 'Your recent work will appear here.'));
    const current = historyKey(state);
    list.forEach((entry, index) => {
      const id = historyKey(entry.state);
      let button = historyButtons.get(id);
      if (!button) {
        const title = tool.title(entry.state, app), sub = tool.sub(entry.state, app);
        button = h('button', { type: 'button', class: 'history-item', 'data-transparent': String(!!tool.transparent?.(entry.state)), title: `${title} · ${sub}`, 'aria-label': `Restore ${title}, ${sub}`,
          onclick: () => { set({ ...entry.state, ...(state.resolution ? { resolution: state.resolution } : {}) }); } },
        h('img', { src: entry.image, alt: '' }), h('span', { class: 'history-caption' }, h('strong', {}, title), h('small', {}, sub)));
        historyButtons.set(id, button);
      }
      button.classList.toggle('current', id === current); button.setAttribute('aria-pressed', String(id === current));
      // Keep existing nodes in place so keyboard focus survives every render.
      if (container.children[index] !== button) container.insertBefore(button, container.children[index] || null);
    });
  }

  let persistTimer;
  function persist() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE, JSON.stringify({ tool: tool.id, imageTool, states: { ...saved.states, ...states }, history: { ...saved.history, ...histories }, formats, tabs })); }
      catch { /* Private browsing can disable storage. */ }
    }, 120);
  }

  /* ---------- Preview tools: zoom and compare ---------- */
  const zoomButton = h('button', { type: 'button', class: 'stage-button', 'aria-keyshortcuts': 'F', onclick: () => toggleZoom() });
  function toggleZoom() {
    zoom = zoom === 'fit' ? 'actual' : 'fit';
    zoomButton.innerHTML = icon(zoom === 'fit' ? 'zoomIn' : 'zoomOut') + `<span>${zoom === 'fit' ? 'Actual size' : 'Fit'}</span>`;
    zoomButton.setAttribute('aria-pressed', String(zoom === 'actual'));
    if (art) fit();
  }
  zoom = 'actual'; toggleZoom();
  /* Hold to see the untouched source in place of the result. */
  const compareButton = h('button', { type: 'button', class: 'stage-button', 'aria-keyshortcuts': '\\', html: icon('compare') + '<span>Hold to compare</span>' });
  let comparing = false;
  function compare(on) {
    if (on === comparing || !tool.needsSource) return;
    comparing = on;
    if (on) { const x = art.getContext('2d'); x.clearRect(0, 0, art.width, art.height); x.drawImage(source.image, 0, 0, art.width, art.height); app.status('Showing the original'); }
    else draw(false);
  }
  compareButton.addEventListener('pointerdown', e => { compareButton.setPointerCapture(e.pointerId); compare(true); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) compareButton.addEventListener(ev, () => compare(false));
  compareButton.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); compare(true); } });
  compareButton.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') compare(false); });

  /* ---------- Shortcuts sheet ---------- */
  const sheet = $('shortcuts');
  const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
  function openShortcuts() {
    const rows = [
      ...(tool.primary.kbd ? [[tool.primary.kbd, tool.primary.label]] : []),
      [`${mod} Z`, 'Undo'], [`${mod} ⇧ Z`, 'Redo'],
      ...(tool.live ? [] : [['F', 'Fit or actual size (or double-click the artwork)']]),
      ...(tool.needsSource ? [['\\', 'Hold to compare with the original'], [`${mod} V`, 'Paste an image']] : []),
      ...(tool.shortcuts || []),
      ['← →', 'Move between tabs'], ['?', 'This sheet'],
    ];
    $('shortcuts-title').textContent = `${tool.name} shortcuts`;
    $('shortcuts-list').replaceChildren(...rows.map(([k, label]) => h('div', { class: 'shortcut' }, h('span', {}, label), h('span', { class: 'keys' }, k.split(' ').map(part => h('kbd', { class: 'key' }, part))))));
    sheet.showModal();
  }
  $('open-shortcuts').addEventListener('click', openShortcuts);
  sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-close]')) sheet.close(); });

  /* ---------- Toolbar ---------- */
  function primary() { set(tool.primary.run(app)); }
  $('primary').addEventListener('click', primary);
  $('export-format').addEventListener('change', e => { formats[tool.id] = e.target.value; persist(); });

  let exportFeedback;
  $('download').addEventListener('click', async () => {
    const button = $('download'), format = $('export-format').value, exportState = { ...state }, exportRevision = revision, exportTool = tool;
    clearTimeout(exportFeedback); button.dataset.state = 'busy'; button.disabled = true; button.setAttribute('aria-busy', 'true');
    try {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const blob = await exportTool.export(exportState, format, app);
      util.download(blob, exportTool.filename(exportState, format, app));
      button.dataset.state = 'done';
      if (revision === exportRevision && tool === exportTool) app.status(`${format.toUpperCase()} exported · ${format === 'png' ? exportTool.dims(exportState, app) : format === 'svg' ? 'Scalable vector' : 'Interactive file'}`);
    } catch (error) { console.error(error); button.dataset.state = 'idle'; app.status('Export failed. Please try again.'); }
    finally { button.disabled = false; button.removeAttribute('aria-busy'); exportFeedback = setTimeout(() => { button.dataset.state = 'idle'; }, 1600); }
  });

  $('copy').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Clipboard unavailable');
      const blob = tool.export({ ...state }, 'png', app);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('Image copied');
    } catch (error) { console.error(error); toast('Copy is not available here. Use Export instead.'); }
  });

  let toastTimer;
  function toast(message) { const t = $('toast'); t.textContent = message; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400); }

  /* ---------- Keyboard, paste and drop ---------- */
  const typing = () => { const a = document.activeElement; return a && (['INPUT', 'SELECT', 'TEXTAREA'].includes(a.tagName) || a.isContentEditable); };
  document.addEventListener('keyup', e => { if (e.key === '\\') compare(false); });
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || typing() || sheet.open) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); step(e.shiftKey ? 1 : -1); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); step(1); return; }
    if (e.repeat) return;
    if (e.key === '\\' && tool.needsSource) { e.preventDefault(); compare(true); return; }
    if (e.key === '?' ) { e.preventDefault(); openShortcuts(); return; }
    if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey && !tool.live) { e.preventDefault(); toggleZoom(); return; }
    if (e.code === 'Space' && tool.primary.kbd === 'Space' && !e.metaKey && !e.ctrlKey && !e.altKey && !['BUTTON', 'A'].includes(document.activeElement?.tagName) && !document.activeElement?.closest('[role=tablist]')) { e.preventDefault(); primary(); return; }
    if (tool.keydown?.(e, app)) e.preventDefault();
  });
  document.addEventListener('paste', e => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (item) { e.preventDefault(); const f = item.getAsFile(); loadFile(new File([f], 'Pasted image', { type: f.type })); }
  });
  let dragDepth = 0;
  const hasFiles = e => [...(e.dataTransfer?.types || [])].includes('Files');
  document.addEventListener('dragenter', e => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; stage.classList.add('dragging'); });
  document.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
  document.addEventListener('dragleave', e => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) stage.classList.remove('dragging'); });
  document.addEventListener('drop', e => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth = 0; stage.classList.remove('dragging'); loadFile(e.dataTransfer.files[0]); });
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (byId[id] && id !== tool.id) selectTool(id); });

  selectTool(byId[location.hash.slice(1)] ? location.hash.slice(1) : saved.tool);
})();
