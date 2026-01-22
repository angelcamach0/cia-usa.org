/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env, ctx) {
    try {
      const method = request.method.toUpperCase();
      if (method !== "GET" && method !== "HEAD") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { allow: "GET, HEAD" }
        });
      }
      // Minimal Matrix-rain page, no external assets.
      const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Matrix Rain</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #050a08;
        --green: #00ff7a;
        --green-dim: #0b3d2a;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        height: 100%;
        background: radial-gradient(1200px 800px at 70% 20%, #092015 0%, var(--bg) 60%);
        overflow: hidden;
      }
      canvas {
        display: block;
        width: 100vw;
        height: 100vh;
        filter: blur(0.2px);
      }
      /* Sentinel canvas layer for enemy sprites. */
      #sentinels {
        position: fixed;
        inset: 0;
        pointer-events: none;
      }
      /* Rabbit canvas layer for the roaming link sprite. */
      #rabbit {
        position: fixed;
        inset: 0;
        pointer-events: none;
      }
      .overlay {
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(transparent 0%, rgba(0,0,0,0.35) 100%),
          repeating-linear-gradient(
            to bottom,
            rgba(0,0,0,0.0) 0px,
            rgba(0,0,0,0.0) 2px,
            rgba(0,0,0,0.08) 3px
          );
        mix-blend-mode: screen;
      }
      .glitch-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: 0;
        background:
          repeating-linear-gradient(
            to bottom,
            rgba(255, 0, 0, 0.12) 0px,
            rgba(255, 0, 0, 0.12) 2px,
            transparent 3px,
            transparent 6px
          ),
          linear-gradient(120deg, rgba(255, 0, 0, 0.18), transparent 60%);
        mix-blend-mode: screen;
      }
      .bg-text {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        font-family: "Impact", "Haettenschweiler", "Arial Black", sans-serif;
        font-size: var(--bg-font-size, 200px);
        letter-spacing: clamp(0.04em, 0.5vw, 0.1em);
        white-space: nowrap;
        color: rgba(0, 255, 122, 0.08);
        text-transform: lowercase;
        text-shadow: 0 0 30px rgba(0, 255, 122, 0.12);
        pointer-events: none;
        z-index: 0;
      }
      .bg-text-inner {
        display: inline-flex;
        align-items: center;
      }
      .bg-cursor {
        margin-left: 0.2em;
        color: rgba(0, 255, 122, 0.12);
        animation: cursor-blink 1.2s steps(1, end) infinite;
      }
      @keyframes cursor-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      canvas { z-index: 1; }
      #sentinels { z-index: 2; }
      #rabbit { z-index: 3; }
      .overlay { z-index: 4; }
      .glitch-layer { z-index: 5; }
      .badge { z-index: 6; }
      body.glitch canvas {
        filter: sepia(1) saturate(5) hue-rotate(-35deg);
      }
      body.glitch .glitch-layer {
        opacity: 0.4;
        animation: glitch-flicker 0.4s steps(2, end) infinite;
      }
      body.shake {
        animation: screen-shake 0.4s linear;
      }
      @keyframes screen-shake {
        0% { transform: translate(0, 0); }
        10% { transform: translate(-3px, 2px); }
        20% { transform: translate(4px, -3px); }
        30% { transform: translate(-4px, 3px); }
        40% { transform: translate(3px, -2px); }
        50% { transform: translate(-2px, 1px); }
        60% { transform: translate(3px, 2px); }
        70% { transform: translate(-3px, -2px); }
        80% { transform: translate(2px, 3px); }
        90% { transform: translate(-2px, -3px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes glitch-flicker {
        0% { opacity: 0.45; }
        50% { opacity: 0.2; }
        100% { opacity: 0.5; }
      }
      .badge {
        position: fixed;
        right: 16px;
        bottom: 16px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 12px;
        color: var(--green);
        text-shadow: 0 0 8px rgba(0,255,122,0.5);
        opacity: 0.7;
      }
    </style>
  </head>
    <body>
    <canvas id="matrix"></canvas>
    <canvas id="sentinels"></canvas>
    <canvas id="rabbit"></canvas>
    <div class="bg-text">
      <span class="bg-text-inner">
        <span class="bg-name"></span>
        <span class="bg-cursor">█</span>
      </span>
    </div>
    <div class="overlay"></div>
    <div class="glitch-layer"></div>
    <div class="badge">cloudflare worker</div>
    <script>
      (() => {
        "use strict";

        const config = {
          bgName: "angelcamach0",
          rabbitUrl: "https://github.com/angelcamach0",
          palette: {
            bg: "#050a08",
            green: "#00ff7a",
            greenDim: "#0b3d2a"
          },
          matrix: {
            chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*",
            columnWidth: 14,
            fontSize: 14,
            fadeAlpha: 0.08
          },
          trail: {
            fontSize: 16,
            max: 80
          },
          bursts: {
            fontSize: 14,
            count: 24,
            max: 240
          },
          sentinels: {
            max: 8,
            spawnIntervalMs: 900,
            speedThresholds: { fast: 0.6, mid: 0.85 },
            speedRanges: {
              fast: { min: 2.4, extra: 2.2 },
              mid: { min: 0.7, extra: 0.9 },
              slow: { min: 0.2, extra: 0.4 }
            },
            toughHp: 5
          },
          rabbit: {
            speed: 1.2,
            scale: 2.2,
            hopAmplitude: 10,
            phaseStep: 0.12,
            yOffset: 40,
            wrapRight: 40,
            wrapLeft: -60
          },
          stats: {
            fontSize: 12,
            color: "rgba(0, 255, 122, 0.7)"
          }
        };

        const canvas = document.getElementById("matrix");
        const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
        const bgText = document.querySelector(".bg-text");
        const bgTextInner = document.querySelector(".bg-text-inner");
        const bgName = document.querySelector(".bg-name");
        const sentinelsCanvas = document.getElementById("sentinels");
        const sentinelsCtx = sentinelsCanvas && sentinelsCanvas.getContext ? sentinelsCanvas.getContext("2d") : null;
        const rabbitCanvas = document.getElementById("rabbit");
        const rabbitCtx = rabbitCanvas && rabbitCanvas.getContext ? rabbitCanvas.getContext("2d") : null;

        if (!canvas || !ctx || !sentinelsCanvas || !sentinelsCtx || !rabbitCanvas || !rabbitCtx) {
          console.error("Canvas contexts are unavailable; aborting animation setup.");
          return;
        }

        const chars = config.matrix.chars;
        let width, height, columns, drops;
        const trail = [];
        const bursts = [];
        // Active sentinel entities (spawned and animated each frame).
        const sentinels = [];
        // Rabbit sprite that hops across the screen and acts as a link target.
        const rabbit = {
          x: -40,
          y: window.innerHeight - config.rabbit.yOffset,
          vx: config.rabbit.speed,
          phase: 0,
          scale: config.rabbit.scale
        };
        let lastSpawn = 0;
        let kills = 0;
        let escaped = 0;
        let shakeTimer = 0;
        let glitchTimer = 0;
        const mouse = { x: 0, y: 0, active: false };

        const toNumber = (value, fallback) => (Number.isFinite(value) ? value : fallback);
        const hitTest = (x, y, rect) =>
          x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

        document.documentElement.style.setProperty("--bg", config.palette.bg);
        document.documentElement.style.setProperty("--green", config.palette.green);
        document.documentElement.style.setProperty("--green-dim", config.palette.greenDim);
        if (bgName) {
          bgName.setAttribute("data-text", config.bgName);
        }

        // Flash/glitch feedback when a sentinel escapes off-screen.
        function triggerEscapeEffect() {
          document.body.classList.add("shake", "glitch");
          clearTimeout(shakeTimer);
          clearTimeout(glitchTimer);
          shakeTimer = setTimeout(() => document.body.classList.remove("shake"), 420);
          glitchTimer = setTimeout(() => document.body.classList.remove("glitch"), 520);
        }

        // Sync all canvases with the viewport size and device pixel ratio.
        function resize() {
          const dpr = Math.max(1, window.devicePixelRatio || 1);
          width = canvas.width = window.innerWidth * dpr;
          height = canvas.height = window.innerHeight * dpr;
          sentinelsCanvas.width = window.innerWidth * dpr;
          sentinelsCanvas.height = window.innerHeight * dpr;
          rabbitCanvas.width = window.innerWidth * dpr;
          rabbitCanvas.height = window.innerHeight * dpr;
          ctx.scale(dpr, dpr);
          sentinelsCtx.scale(dpr, dpr);
          rabbitCtx.scale(dpr, dpr);
          columns = Math.floor(window.innerWidth / config.matrix.columnWidth);
          drops = Array.from({ length: columns }, () => Math.random() * window.innerHeight);
          rabbit.y = window.innerHeight - config.rabbit.yOffset;
          fitBgText();
        }

        // Keep the background name text sized to fit within the viewport.
        function fitBgText() {
          if (!bgText || !bgTextInner) return;
          const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
          const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
          const maxW = Math.max(0, vw - 32);
          const maxH = vh * 0.22;
          const baseSize = 200;
          bgText.style.setProperty("--bg-font-size", baseSize + "px");
          const rect = bgTextInner.getBoundingClientRect();
          const scale = Math.min(maxW / rect.width, maxH / rect.height, 1);
          const nextSize = Math.max(28, baseSize * scale);
          bgText.style.setProperty("--bg-font-size", nextSize.toFixed(2) + "px");
        }

        // Type-and-delete loop for the background name.
        function typeBgText() {
          if (!bgName) return;
          const target = bgName.getAttribute("data-text") || "";
          bgName.textContent = "";
          let index = 0;
          const typeNext = () => {
            if (index < target.length) {
              bgName.textContent += target[index];
              index += 1;
              fitBgText();
              setTimeout(typeNext, 110);
              return;
            }
            fitBgText();
            setTimeout(jitterDelete, 3000 + Math.random() * 2000);
          };
          const jitterDelete = () => {
            const deleteCount = Math.max(1, Math.floor(Math.random() * target.length * 0.6));
            let remaining = deleteCount;
            const deleteNext = () => {
              if (remaining > 0) {
                bgName.textContent = bgName.textContent.slice(0, -1);
                remaining -= 1;
                fitBgText();
                setTimeout(deleteNext, 70);
                return;
              }
              setTimeout(retypeNext, 200);
            };
            deleteNext();
          };
          const retypeNext = () => {
            if (bgName.textContent.length < target.length) {
              const nextChar = target[bgName.textContent.length];
              bgName.textContent += nextChar;
              fitBgText();
              setTimeout(retypeNext, 110);
              return;
            }
            setTimeout(jitterDelete, 2500 + Math.random() * 2500);
          };
          setTimeout(typeNext, 400);
        }

        // Cursor trail letters that fade out over time.
        function drawTrail() {
          for (let i = trail.length - 1; i >= 0; i--) {
            const p = trail[i];
            p.life -= 0.03;
            if (p.life <= 0) {
              trail.splice(i, 1);
              continue;
            }
          ctx.fillStyle = "rgba(0, 255, 122, " + p.life.toFixed(3) + ")";
          ctx.font = config.trail.fontSize + "px monospace";
          ctx.fillText(p.char, p.x, p.y);
        }
      }

        // Burst particles emitted on click.
        function drawBursts() {
          for (let i = bursts.length - 1; i >= 0; i--) {
            const p = bursts[i];
            p.life -= 0.02;
            if (p.life <= 0) {
              bursts.splice(i, 1);
              continue;
            }
            p.vy += 0.06;
            p.x += p.vx;
            p.y += p.vy;
          ctx.fillStyle = "rgba(0, 255, 122, " + p.life.toFixed(3) + ")";
          ctx.font = config.bursts.fontSize + "px monospace";
          ctx.fillText(p.char, p.x, p.y);
        }
      }

        // Spawn and render sentinel enemies, with HP bars on tougher ones.
        function drawSentinels(now) {
          sentinelsCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          const maxSentinels = config.sentinels.max;
          if (now - lastSpawn > config.sentinels.spawnIntervalMs && sentinels.length < maxSentinels) {
            lastSpawn = now;
            const dir = Math.random() > 0.5 ? 1 : -1;
            const scale = 2 + Math.random() * 2;
            const speedRoll = Math.random();
            const speedThresholds = config.sentinels.speedThresholds;
            const speedRanges = config.sentinels.speedRanges;
            const baseSpeed =
              speedRoll < speedThresholds.fast ? speedRanges.fast.min + Math.random() * speedRanges.fast.extra :
              speedRoll < speedThresholds.mid ? speedRanges.mid.min + Math.random() * speedRanges.mid.extra :
              speedRanges.slow.min + Math.random() * speedRanges.slow.extra;
            const hp = speedRoll < speedThresholds.mid ? 1 : config.sentinels.toughHp;
            sentinels.push({
              x: dir > 0 ? -40 : window.innerWidth + 40,
              y: Math.random() * window.innerHeight * 0.9 + 20,
              vx: dir * baseSpeed,
              vy: (Math.random() - 0.5) * 0.2,
              wobble: Math.random() * Math.PI * 2,
              scale,
              life: 1,
              w: 8 * scale,
              h: 8 * scale,
              hp,
              maxHp: hp
            });
          }

          for (let i = sentinels.length - 1; i >= 0; i--) {
            const s = sentinels[i];
            s.wobble += 0.02;
            s.y += s.vy + Math.sin(s.wobble) * 0.2;
            s.x += s.vx;
            if (s.x < -80 || s.x > window.innerWidth + 80) {
              sentinels.splice(i, 1);
              escaped++;
              triggerEscapeEffect();
              continue;
            }
            const px = s.x;
            const py = s.y;
            const unit = s.scale;

            // Pixelated "sentinel" silhouette.
            const pattern = [
              "00111100",
              "01111110",
              "11100111",
              "11011011",
              "11111111",
              "01111110",
              "00111100",
              "00011000"
            ];
            sentinelsCtx.fillStyle = "rgba(0, 255, 122, 0.18)";
            sentinelsCtx.shadowColor = "rgba(0, 255, 122, 0.5)";
            sentinelsCtx.shadowBlur = 10;
            for (let y = 0; y < pattern.length; y++) {
              for (let x = 0; x < pattern[y].length; x++) {
                if (pattern[y][x] === "1") {
                  sentinelsCtx.fillRect(px + x * unit, py + y * unit, unit, unit);
                }
              }
            }
            // Tentacles trailing behind the sentinel.
            sentinelsCtx.shadowBlur = 6;
            sentinelsCtx.strokeStyle = "rgba(0, 255, 122, 0.22)";
            sentinelsCtx.lineWidth = Math.max(1, unit / 2);
            const tailDir = s.vx > 0 ? -1 : 1;
            for (let t = 0; t < 5; t++) {
              const startX = px + (pattern[0].length * unit) / 2 + t * unit * 0.6;
              const startY = py + pattern.length * unit - unit;
              sentinelsCtx.beginPath();
              sentinelsCtx.moveTo(startX, startY);
              let cx = startX;
              let cy = startY;
              for (let seg = 0; seg < 6; seg++) {
                cx += tailDir * (2 + seg) * unit * 0.7;
                cy += (Math.sin(s.wobble + seg * 0.7 + t) * unit) + unit * 0.6;
                sentinelsCtx.lineTo(cx, cy);
              }
              sentinelsCtx.stroke();
            }
            if (s.maxHp > 1) {
              const barW = s.w;
              const barH = Math.max(2, unit / 2);
              const barX = px;
              const barY = py - barH - 3;
              sentinelsCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
              sentinelsCtx.fillRect(barX, barY, barW, barH);
              sentinelsCtx.fillStyle = "rgba(0, 255, 122, 0.7)";
              sentinelsCtx.fillRect(barX, barY, barW * (s.hp / s.maxHp), barH);
            }
            sentinelsCtx.shadowBlur = 0;
          }
        }

        // Animate and draw the rabbit sprite, plus update its hitbox.
        function drawRabbit() {
          rabbitCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          rabbit.phase += config.rabbit.phaseStep;
          rabbit.x += rabbit.vx;
          if (rabbit.x > window.innerWidth + config.rabbit.wrapRight) {
            rabbit.x = config.rabbit.wrapLeft;
          }
          const hop = Math.abs(Math.sin(rabbit.phase)) * config.rabbit.hopAmplitude;
          const px = rabbit.x;
          const py = rabbit.y - hop;
          const unit = rabbit.scale;
          const pattern = [
            "00100100",
            "00100100",
            "00111100",
            "01111110",
            "11111111",
            "11111111",
            "11111111",
            "11111111",
            "01111110",
            "01111110",
            "00100100"
          ];
          rabbitCtx.fillStyle = "rgba(230, 255, 255, 0.9)";
          for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
              if (pattern[y][x] === "1") {
                rabbitCtx.fillRect(px + x * unit, py + y * unit, unit, unit);
              }
            }
          }
          // Eyes and tail.
          rabbitCtx.fillStyle = "rgba(20, 25, 20, 0.9)";
          rabbitCtx.fillRect(px + unit * 3, py + unit * 4, unit, unit);
          rabbitCtx.fillRect(px + unit * 5, py + unit * 4, unit, unit);
          rabbitCtx.fillStyle = "rgba(230, 255, 255, 0.9)";
          rabbitCtx.fillRect(px + unit * 7, py + unit * 7, unit, unit);

          rabbit.hit = {
            x: px,
            y: py,
            w: pattern[0].length * unit,
            h: pattern.length * unit
          };
        }

        // Main animation loop: matrix rain, sentinels, rabbit, and effects.
        function draw() {
          const now = performance.now();
          ctx.fillStyle = "rgba(5, 10, 8, " + config.matrix.fadeAlpha + ")";
          ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
          ctx.fillStyle = config.palette.green;
          ctx.font = config.matrix.fontSize + "px monospace";
          for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * config.matrix.columnWidth;
            const y = drops[i] * config.matrix.columnWidth;
            ctx.fillText(char, x, y);
            if (y > window.innerHeight && Math.random() > 0.975) {
              drops[i] = 0;
            }
            drops[i]++;
          }
          drawSentinels(now);
          drawRabbit();
          drawTrail();
          drawBursts();
          ctx.fillStyle = config.stats.color;
          ctx.font = config.stats.fontSize + "px monospace";
          ctx.fillText("Sentinels killed: " + kills, 16, window.innerHeight - 16);
          ctx.fillText("Sentinels escaped: " + escaped, 16, window.innerHeight - 32);
          requestAnimationFrame(draw);
        }

        // Track pointer movement to leave a character trail.
        window.addEventListener("pointermove", (event) => {
          mouse.active = true;
          mouse.x = toNumber(event.clientX, 0);
          mouse.y = toNumber(event.clientY, 0);
          trail.push({
            x: mouse.x,
            y: mouse.y,
            life: 0.9,
            char: chars[Math.floor(Math.random() * chars.length)]
          });
          if (trail.length > config.trail.max) {
            trail.splice(0, trail.length - config.trail.max);
          }
        });

        // Click handler for rabbit link and sentinel hits.
        window.addEventListener("pointerdown", (event) => {
          const clickX = toNumber(event.clientX, 0);
          const clickY = toNumber(event.clientY, 0);
          if (rabbit.hit && hitTest(clickX, clickY, rabbit.hit)) {
            window.location.href = config.rabbitUrl;
            return;
          }
          // Click to destroy sentinels.
          for (let i = sentinels.length - 1; i >= 0; i--) {
            const s = sentinels[i];
            if (hitTest(clickX, clickY, s)) {
              s.hp -= 1;
              if (s.hp <= 0) {
                sentinels.splice(i, 1);
                kills++;
              }
              break;
            }
          }
          const count = config.bursts.count;
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2.2;
            bursts.push({
              x: clickX,
              y: clickY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 1.2,
              life: 0.9,
              char: chars[Math.floor(Math.random() * chars.length)]
            });
          }
          if (bursts.length > config.bursts.max) {
            bursts.splice(0, bursts.length - config.bursts.max);
          }
        });

        // Reset transforms then recompute sizes on resize.
        window.addEventListener("resize", () => {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          sentinelsCtx.setTransform(1, 0, 0, 1, 0, 0);
          rabbitCtx.setTransform(1, 0, 0, 1, 0, 0);
          resize();
        });
        if (window.visualViewport) {
          window.visualViewport.addEventListener("resize", fitBgText);
          window.visualViewport.addEventListener("scroll", fitBgText);
        }

        try {
          resize();
          typeBgText();
          draw();
        } catch (err) {
          console.error("Animation loop failed to start.", err);
        }
      })();
    </script>
  </body>
</html>`;
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    } catch (err) {
      console.error("Worker fetch failed.", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
};
