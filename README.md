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

- Update the name in `src/worker.js` at `.bg-name[data-text="..."]`.
- Tweak palette variables under `:root` in the embedded `<style>`.
- Adjust sentinel spawn rate, speed, and HP in `drawSentinels()`.
- Change the rabbit link URL in the pointer handler.

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
