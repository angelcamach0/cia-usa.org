# misty-meadow-70ec

Matrix-style landing page deployed on Cloudflare Workers. It renders a canvas-based scene with matrix rain, roaming sentinels, and a hopping rabbit link, all in a single Worker response (no external assets).

## Quick start

```sh
npm install
npm run dev
```

Then open `http://localhost:8787`.

## Deploy

```sh
npm run deploy
```

## How it works

- The Worker returns one HTML document with embedded CSS and JavaScript.
- Three canvas layers compose the scene: matrix rain, sentinels, and the rabbit.
- Pointer events add a trailing glyph effect and trigger click bursts.
- A slide-out menu lets users toggle features and theme colors live.

## What the site includes

- Matrix rain background with configurable density, font size, and fade.
- Sentinel sprites with spawn logic, wobble, and HP bars.
- Rabbit sprite with a clickable link target.
- Mouse trail and click-burst particle effects.
- Background name typing effect with looping delete/retype.
- Stats HUD (killed/escaped) and glitch screen feedback.
- Slide-out control menu with live toggles and a theme color wheel.

## Customize

- Update `GET /config.json` for behavior, `GET /strings.json` for all text, and `GET /theme.css` for colors and visual tokens.
- `config.json` controls animation, spawn rates, sizes, and toggles.
- `strings.json` controls every word that appears on the page (title, badge, labels).
- `theme.css` holds CSS variables such as colors and the background gradient.

### Environment overrides (recommended for easy edits)

You can override defaults without touching `src/worker.js` by setting Worker environment variables. This is the easiest way for future editors to tweak names, colors, sizes, and toggles.

Precedence order:

1. Code defaults in `src/worker.js`
2. Environment overrides (`APP_CONFIG`, `APP_STRINGS`, `THEME_CSS`)
3. URL query params (highest priority, for quick demos)

Example `wrangler.jsonc`:
```jsonc
{
  "vars": {
    "APP_CONFIG": "{\"palette\":{\"bg\":\"#0b0f1a\",\"green\":\"#7cff00\"},\"matrix\":{\"fontSize\":18}}",
    "APP_STRINGS": "{\"title\":\"My Site\",\"bgName\":\"TopDawg\",\"badge\":\"custom badge\"}"
  }
}
```

Notes:
- `APP_CONFIG` and `APP_STRINGS` must be JSON strings.
- If you set `THEME_CSS`, it completely replaces the generated theme CSS.

### Editing the endpoints

You can copy these defaults into your own files and adjust them:

`/config.json`:
```json
{
  "rabbitUrl": "https://github.com/angelcamach0",
  "features": { "matrix": true, "sentinels": true, "rabbit": true },
  "matrix": { "columnWidth": 12, "fontSize": 14, "fadeAlpha": 0.08 },
  "sentinels": { "max": 6, "spawnIntervalMs": 900 },
  "interactions": { "enabled": true }
}
```

`/strings.json`:
```json
{
  "title": "Matrix Rain",
  "bgName": "angelcamach0",
  "badge": "cloudflare worker",
  "statsKilledLabel": "Sentinels killed",
  "statsEscapedLabel": "Sentinels escaped"
}
```

`/theme.css`:
```css
:root {
  --bg: #050a08;
  --green: #00ff7a;
  --green-dim: #0b3d2a;
  --bg-gradient: radial-gradient(1200px 800px at 70% 20%, #092015 0%, var(--bg) 60%);
  --overlay-opacity: 1;
  --glitch-opacity: 0.4;
}
```

### Query param overrides

You can override common settings via URL query params for quick demos:

```
?title=My%20Site&bgName=neo&badge=hello&green=%2300ff7a&bg=%23070b08
```

Supported params:

- `title`, `bgName`, `badge`, `statsKilledLabel`, `statsEscapedLabel`
- `rabbitUrl`
- `bg`, `green`, `greenDim`, `bgGradient`
- `overlayOpacity`, `glitchOpacity`
- `chars`, `columnWidth`, `matrixFont`, `fade`, `resetChance`
- `sentinels`, `spawnMs`
- `rabbitSpeed`, `rabbitScale`, `hop`
- `statsFont`, `statsColor`
- `interactions` (`1` or `0`)
- Feature toggles (`1` or `0`): `matrix`, `sentinels`, `rabbit`, `trail`, `bursts`, `bgText`, `badge`, `stats`, `overlays`, `glitch`

## Menu controls (live)

The slide-out menu updates the live scene without a page reload. Current controls:

- Username (updates the tab title and background name)
- Feature toggles: matrix rain, sentinels, mouse trail, click bursts
- Theme section: inline color wheel + Implement button to apply the selected color

## Project structure & extension guide

This repo is intentionally a single-file Worker so it can be copied and deployed easily.

- `src/worker.js` contains:
  - Worker handler (serves `/`, `/config.json`, `/strings.json`, `/theme.css`)
  - HTML markup for the canvases and menu
  - CSS for layout/theme tokens and menu styling
  - Client JS for animation, menu behavior, and theme updates

Key locations (search within `src/worker.js`):
- Defaults: `defaultConfig` and `defaultStrings` near the top of the inline `<script>`.
- Canvas setup: look for `const canvas = document.getElementById("matrix")`.
- Main render loop: `function draw()` and `requestAnimationFrame(draw)`.
- Menu wiring: `sidePanelApply.addEventListener("click", ...)`.
- Theme helpers: `applyThemeColor`, `setThemeCssVars`, `themeRgba`.

### Adding or removing visual features

- Feature flags live in `config.features`.
- Draw calls are gated in the main loop:
  - `if (config.features.matrix) { ... }`
  - `if (config.features.sentinels) { ... }`
  - `if (config.features.trail) { ... }`
  - `if (config.features.bursts) { ... }`
- To add a new effect:
  1. Add a new `features.<name>` flag and defaults in `defaultConfig`.
  2. Add a menu toggle button with `data-toggle="features.<name>"`.
  3. Gate the draw/update logic in the `draw()` loop or event handlers.

### Updating theme behavior

- Theme colors flow from `config.palette` into CSS variables.
- `applyThemeColor()` updates:
  - CSS vars (`--green`, `--green-dim`, `--green-rgb`, soft fills)
  - Canvas colors via `themeRgba()`
  - HUD color via `config.stats.color`
- To customize additional elements, use `themeRgba()` or `var(--green-rgb)` in CSS.

### Rebranding or reusing the template

- Update `strings.json` (or `APP_STRINGS`) for text labels.
- Update `config.json` (or `APP_CONFIG`) for visuals and behavior.
- Replace `rabbitUrl` with your own link.
- Deploy with `npm run deploy` after edits.

## Reliability and safety notes

- Inputs are validated for method/coordinate sanity and canvas availability.
- Errors are caught in the Worker and in the browser init path for safer failures.
- Secrets are not hardcoded; use Worker environment variables if needed.

## Performance and scalability guidance

- Profile first. Use the browser Performance panel or `performance.mark()` around the draw loop if you need measurements.
- Focus optimization on hot paths only (render loop, spawn logic, hit tests).
- Prefer O(1) lookups (maps/sets) for new features with large collections.
- Keep the render loop lightweight to reduce CPU usage and energy consumption.
- Use async I/O and concurrency only where it reduces real latency.

## Coding practices for contributors

- DRY: extract repeated logic into helpers rather than copy/paste.
- KISS: prefer simple, readable logic over clever abstractions.
- YAGNI: only add features that are actually required.
- SOLID: keep responsibilities small and modular as the project grows.
- Style: camelCase variables/functions, lowercase filenames, semicolons, consistent 2+ spaces (no tabs), and `"use strict"` where it makes sense.

## Project files

- `src/worker.js`: Cloudflare Worker and embedded page.
- `.github/`: issue templates and pull request template.

## License

MIT. See `LICENSE`.
