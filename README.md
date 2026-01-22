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

## Customize

- Edit the JSON in the `<script id="app-config" type="application/json">` block in `src/worker.js`.
- Palette updates in `config.palette` automatically sync to CSS variables.
- Use `config.texts.bgName` for the background name, `config.texts.title` for the tab title, and `config.texts.badge` for the badge label.
- Use `config.rabbitUrl` to control the rabbit click destination.
- Adjust spawn rate and behavior in `config.sentinels`.
- Tune matrix density, fonts, and fade in `config.matrix`, `config.trail`, and `config.bursts`.

### Query param overrides

You can override common settings via URL query params for quick demos:

```
?title=My%20Site&bgName=neo&badge=hello&green=%2300ff7a&bg=%23070b08
```

Supported params:

- `title`, `bgName`, `badge`
- `rabbitUrl`
- `bg`, `green`, `greenDim`, `bgGradient`
- `overlayOpacity`, `glitchOpacity`
- `chars`, `columnWidth`, `matrixFont`, `fade`, `resetChance`
- `sentinels`, `spawnMs`
- `rabbitSpeed`, `rabbitScale`, `hop`
- `statsFont`, `statsColor`
- `interactions` (`1` or `0`)

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
