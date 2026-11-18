# Field Kit

One studio for four image tools: **Glyph Field**, **Dither**, **Pixel Pop** and **Characters**. Its look is the [Solid Glass](https://github.com/deeplethe/solid-glass) design system by DeepLethe (MIT). Field Kit has no React or Tailwind, so the theme's tokens and edge recipes are ported straight into `style.css` instead of being installed with `shadcn add`. It's plain JavaScript and Canvas 2D, with no build step or dependencies. Its only network request is the Geist font, and the system font stands in when you're offline.

## Run

```
python3 -m http.server 4199 --bind 127.0.0.1
```

Then open http://127.0.0.1:4199. Opening `index.html` directly also works.

## What each tool does

- **Glyph Field**: the original renderer, unchanged. Seven structures, frames, circle and spiral patterns, texture, colours, transparency, PNG and editable SVG. Space makes a new composition.
- **Dither**: all twelve Dither Matrix algorithms: threshold, Bayer 2/4/8, Floyd–Steinberg, Atkinson, noise, texture, three halftones and money halftone. It has ink and paper palettes, transparent paper, finishing effects, a detail size, and an export scale that keeps pixels crisp. It exports PNG or SVG. Keys 1–9, 0, - and = pick an algorithm. **Adjust** sets brightness, contrast, midtones and invert before the image is dithered.
- **Pixel Pop**: grid resolution 8–128, spacing, and square, circle or dot pixels. Smooth sampling averages each cell instead of picking one pixel. You can also limit the palette (6, 4, 3 or 2 levels per channel) and add cell outlines. The background can be transparent or a colour. It exports PNG at 2K or 4K, or SVG with every pixel as an editable shape.
- **Characters**: the Character Playground engine. Eight forms, palettes, character sets (plus Custom, where you type your own), density, motion and scatter on hover. It exports PNG, SVG or a single interactive HTML file.

## Shared across the studio

- The same topbar, tabbed inspector, live preview and Recent strip in every tool.
- One image source shared by Dither and Pixel Pop. You can drop, paste or upload an image from any tool, or send the current Glyph Field artwork in as the source.
- Recent work (up to 8 per tool), settings, export format and the open inspector tab are all saved in local storage.
- A copy-image button and the Export button with busy and done states.
- Undo and redo (⌘Z, ⇧⌘Z) for every tool. A whole slider drag counts as one step.
- **Actual size** (F, or double-click the artwork) shows the result pixel for pixel and lets you scroll around it. The fitted view shrinks dithers and makes moiré.
- **Hold to compare** (or hold \\) shows the untouched source in Dither and Pixel Pop.
- A shortcuts sheet (?) for whichever tool is open, and **Reset all settings** at the bottom of each tool's panel.

## Differences from the standalone tools

- DialKit's Preview Motion tuner and the custom colour wheel are gone. Glass-styled sliders and the system colour picker replace them.
- Dither's noise and paper grain are seeded, so a setting always gives the same result. Its effects (sketch, fade, shadow, grain) can now be used with every algorithm, and greys survive custom colours.
- Uploaded images aren't stored. After a reload, the sample image comes back.

## Files

- `index.html`: the page shell
- `style.css`: Solid Glass tokens and materials, mapped onto Field Kit's controls
- `kit.js`: icons, helpers and the inspector controls every tool uses
- `app.js`: tool switching, the shared source, rendering, history, export, keyboard, paste and drop
- `tools/*.js`: one file per tool, plus `glyph-shapes.js` (the geometry copied from Glyph Field)

## Adding a tool

Call `FieldKit.register({...})` from a new file in `tools/` and add a script tag for it. A tool provides:

- `id`, `name`, `icon`, `intro`, `defaults`, `primary`, `formats`
- `panels(kit, app)`: the inspector tabs
- `title`, `sub`, `dims` and `describe`
- either `render(canvas, state, app)` or, for live tools, `mount`, `update` and `unmount`
- `export(state, format, app)` and `filename`
