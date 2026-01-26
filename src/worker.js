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
      // Default configuration for visuals and behaviors.
      // Override with the APP_CONFIG environment variable (JSON string).
      const defaultConfig = {
        rabbitUrl: "https://github.com/angelcamach0",
        palette: {
          bg: "#050a08",
          green: "#00ff7a",
          greenDim: "#0b3d2a",
          bgGradient: "radial-gradient(1200px 800px at 70% 20%, #092015 0%, var(--bg) 60%)"
        },
        overlays: {
          overlayOpacity: 1,
          glitchOpacity: 0.4
        },
        features: {
          matrix: true,
          sentinels: true,
          rabbit: true,
          trail: true,
          bursts: true,
          bgText: true,
          badge: true,
          stats: true,
          overlays: true,
          glitch: true
        },
        matrix: {
          chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*",
          columnWidth: 14,
          fontSize: 14,
          fadeAlpha: 0.08,
          resetChance: 0.025
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
          scaleRange: { min: 2, extra: 2 },
          wobbleAmplitude: 0.2,
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
        },
        interactions: {
          enabled: true
        }
      };
      // Default text labels for the UI.
      // Override with the APP_STRINGS environment variable (JSON string).
      // Default labels used for the tab title, background name, and UI text.
      const defaultStrings = {
        title: "angelcamach0",
        bgName: "angelcamach0",
        badge: "cloudflare worker",
        statsKilledLabel: "Sentinels killed",
        statsEscapedLabel: "Sentinels escaped"
      };
      // Allow non-developers to customize the site without editing code.
      const appConfig = mergeDeep({}, defaultConfig, parseJson(env.APP_CONFIG));
      const appStrings = mergeDeep({}, defaultStrings, parseJson(env.APP_STRINGS));
      const themeCss = typeof env.THEME_CSS === "string" && env.THEME_CSS.trim()
        ? env.THEME_CSS
        : buildThemeCss(appConfig);

      const url = new URL(request.url);
      if (url.pathname === "/config.json") {
        return new Response(JSON.stringify(appConfig, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8" }
        });
      }
      if (url.pathname === "/strings.json") {
        return new Response(JSON.stringify(appStrings, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8" }
        });
      }
      if (url.pathname === "/theme.css") {
        return new Response(themeCss, {
          headers: { "content-type": "text/css; charset=utf-8" }
        });
      }
      // Minimal Matrix-rain page, no external assets.
      const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Matrix Rain</title>
    <link rel="stylesheet" href="/theme.css" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #050a08;
        --green: #00ff7a;
        --green-dim: #0b3d2a;
        --bg-gradient: radial-gradient(1200px 800px at 70% 20%, #092015 0%, var(--bg) 60%);
        --overlay-opacity: 1;
        --glitch-opacity: 0.4;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        height: 100%;
        background: var(--bg-gradient);
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
        opacity: var(--overlay-opacity);
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
        opacity: var(--glitch-opacity);
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
      /* Side handle to open the sliding customization panel. */
      .side-toggle {
        position: fixed;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 7;
        border: 1px solid rgba(0, 255, 122, 0.35);
        border-left: none;
        background: rgba(5, 10, 8, 0.65);
        color: var(--green);
        font-family: "Courier New", monospace;
        font-size: 12px;
        letter-spacing: 0.08em;
        padding: 10px 12px;
        text-transform: uppercase;
        cursor: pointer;
        backdrop-filter: blur(6px);
      }
      /* Left-side sliding panel container (content comes later). */
      .side-panel {
        position: fixed;
        left: 0;
        top: 50%;
        transform: translate(-100%, -50%);
        width: min(320px, 80vw);
        height: min(360px, 70vh);
        background: rgba(2, 8, 6, 0.88);
        border: 1px solid rgba(0, 255, 122, 0.2);
        border-left: none;
        transition: transform 0.3s ease;
        z-index: 8;
        display: grid;
        grid-template-rows: auto 1fr;
      }
      /* Shift the panel into view when toggled. */
      body.menu-open .side-panel {
        transform: translate(0, -50%);
      }
      /* Header row inside the panel for the close control. */
      .side-panel-header {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(0, 255, 122, 0.1);
      }
      /* Placeholder layout for future customization controls. */
      .side-panel-body {
        padding: 14px 16px;
        display: grid;
        gap: 12px;
        color: rgba(230, 255, 240, 0.9);
        font-family: "Courier New", monospace;
        font-size: 12px;
      }
      /* Expandable section for grouping color controls. */
      .side-panel-section {
        border: 1px solid rgba(0, 255, 122, 0.15);
        background: rgba(2, 8, 6, 0.6);
      }
      .side-panel-section-toggle {
        width: 100%;
        text-align: left;
        padding: 8px 10px;
        border: none;
        background: transparent;
        color: var(--green);
        font-family: inherit;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
      }
      .side-panel-section-body {
        padding: 10px;
        display: none;
        gap: 8px;
        color: rgba(230, 255, 240, 0.75);
      }
      .side-panel-section.is-open .side-panel-section-body {
        display: grid;
      }
      /* Inline theme color wheel (no native popup). */
      .theme-picker {
        display: grid;
        gap: 10px;
      }
      .theme-wheel {
        position: relative;
        width: 160px;
        height: 160px;
        border-radius: 50%;
        margin: 0 auto;
        background:
          conic-gradient(
            #ff004c,
            #ff8a00,
            #ffe600,
            #7bff00,
            #00ffb3,
            #00b6ff,
            #5b5bff,
            #c100ff,
            #ff004c
          );
        cursor: crosshair;
      }
      .theme-wheel::after {
        content: "";
        position: absolute;
        inset: 20%;
        border-radius: 50%;
        background: rgba(2, 8, 6, 0.92);
        box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6);
      }
      .theme-wheel-indicator {
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      .theme-picker-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .theme-picker-label {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(230, 255, 240, 0.7);
      }
      .theme-swatch {
        width: 36px;
        height: 18px;
        border: 1px solid rgba(0, 255, 122, 0.25);
        background: #00ff7a;
      }
      /* Field block for text-based settings. */
      .side-panel-field {
        display: grid;
        gap: 6px;
      }
      .side-panel-field input[type="text"] {
        width: 100%;
        padding: 8px 10px;
        background: rgba(5, 10, 8, 0.85);
        border: 1px solid rgba(0, 255, 122, 0.25);
        color: rgba(230, 255, 240, 0.95);
        font-family: inherit;
        font-size: 12px;
      }
      /* Toggle rows for future feature flags. */
      .side-panel-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .toggle-button {
        border: 1px solid rgba(0, 255, 122, 0.35);
        background: rgba(0, 255, 122, 0.08);
        color: var(--green);
        font-family: inherit;
        font-size: 11px;
        letter-spacing: 0.08em;
        padding: 4px 10px;
        text-transform: uppercase;
        cursor: pointer;
      }
      .toggle-button[aria-pressed="false"] {
        opacity: 0.55;
      }
      /* Close button that slides the panel back out. */
      .side-panel-close {
        border: 1px solid rgba(0, 255, 122, 0.35);
        background: rgba(0, 255, 122, 0.08);
        color: var(--green);
        font-family: "Courier New", monospace;
        font-size: 12px;
        letter-spacing: 0.08em;
        padding: 6px 10px;
        cursor: pointer;
      }
      .side-panel-apply {
        border: 1px solid rgba(0, 255, 122, 0.35);
        background: rgba(0, 255, 122, 0.18);
        color: var(--green);
        font-family: "Courier New", monospace;
        font-size: 12px;
        letter-spacing: 0.08em;
        padding: 6px 10px;
        cursor: pointer;
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
    <!-- Side sliding menu for live scene controls. -->
    <button class="side-toggle" type="button">Menu</button>
    <aside class="side-panel" aria-hidden="true">
      <div class="side-panel-header">
        <!-- Applies the current menu inputs to the live scene. -->
        <button class="side-panel-apply" type="button">Implement</button>
        <button class="side-panel-close" type="button">&lt;</button>
      </div>
      <div class="side-panel-body">
        <label class="side-panel-field">
          <input type="text" name="title" placeholder="Username" />
        </label>
        <div class="side-panel-section" data-section="colors">
          <button class="side-panel-section-toggle" type="button">Theme</button>
          <div class="side-panel-section-body">
            <div class="theme-picker" data-theme-picker>
              <div class="theme-wheel" role="button" aria-label="Pick a theme color">
                <div class="theme-wheel-indicator"></div>
              </div>
              <div class="theme-picker-row">
                <span class="theme-picker-label">Selected</span>
                <div class="theme-swatch" aria-hidden="true"></div>
              </div>
            </div>
          </div>
        </div>
        <label class="side-panel-toggle">
          <span>Matrix rain</span>
          <button class="toggle-button" type="button" data-toggle="features.matrix" aria-pressed="true">On</button>
        </label>
        <label class="side-panel-toggle">
          <span>Sentinels</span>
          <button class="toggle-button" type="button" data-toggle="features.sentinels" aria-pressed="true">On</button>
        </label>
        <label class="side-panel-toggle">
          <span>Mouse trail</span>
          <button class="toggle-button" type="button" data-toggle="features.trail" aria-pressed="true">On</button>
        </label>
        <label class="side-panel-toggle">
          <span>Click bursts</span>
          <button class="toggle-button" type="button" data-toggle="features.bursts" aria-pressed="true">On</button>
        </label>
      </div>
    </aside>
    <div class="badge">cloudflare worker</div>
    <script>
      (async () => {
        "use strict";

        const defaultConfig = {
          rabbitUrl: "https://github.com/angelcamach0",
          palette: {
            bg: "#050a08",
            green: "#00ff7a",
            greenDim: "#0b3d2a",
            bgGradient: "radial-gradient(1200px 800px at 70% 20%, #092015 0%, var(--bg) 60%)"
          },
          overlays: {
            overlayOpacity: 1,
            glitchOpacity: 0.4
          },
          features: {
            matrix: true,
            sentinels: true,
            rabbit: true,
            trail: true,
            bursts: true,
            bgText: true,
            badge: true,
            stats: true,
            overlays: true,
            glitch: true
          },
          matrix: {
            chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*",
            columnWidth: 14,
            fontSize: 14,
            fadeAlpha: 0.08,
            resetChance: 0.025
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
            scaleRange: { min: 2, extra: 2 },
            wobbleAmplitude: 0.2,
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
          },
          interactions: {
            enabled: true
          }
        };
        const defaultStrings = {
          title: "angelcamach0",
          bgName: "angelcamach0",
          badge: "cloudflare worker",
          statsKilledLabel: "Sentinels killed",
          statsEscapedLabel: "Sentinels escaped"
        };

        const [remoteConfig, remoteStrings] = await Promise.all([
          fetchJson("/config.json"),
          fetchJson("/strings.json")
        ]);
        const queryOverrides = readQueryOverrides();
        const config = mergeDeep({}, defaultConfig, remoteConfig, queryOverrides.config);
        const strings = mergeDeep({}, defaultStrings, remoteStrings, queryOverrides.strings);

        const canvas = document.getElementById("matrix");
        const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
        const bgText = document.querySelector(".bg-text");
        const bgTextInner = document.querySelector(".bg-text-inner");
        const bgName = document.querySelector(".bg-name");
        const badge = document.querySelector(".badge");
        const sideToggle = document.querySelector(".side-toggle");
        const sidePanel = document.querySelector(".side-panel");
        const sidePanelClose = document.querySelector(".side-panel-close");
        const sidePanelApply = document.querySelector(".side-panel-apply");
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
        let titleCursorTimer = 0;
        let titleCursorVisible = true;
        let bgTypeToken = 0;
        let themePicker = null;
        let themeWheel = null;
        let themeIndicator = null;
        let themeSwatch = null;
        let themeColor = "#00ff7a";
        const mouse = { x: 0, y: 0, active: false };

        const toNumber = (value, fallback) => (Number.isFinite(value) ? value : fallback);
        const hitTest = (x, y, rect) =>
          x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

        // Keep the tab title in sync with strings and add a blinking cursor.
        updateDocumentTitle(true);
        document.documentElement.style.setProperty("--bg", config.palette.bg);
        document.documentElement.style.setProperty("--green", config.palette.green);
        document.documentElement.style.setProperty("--green-dim", config.palette.greenDim);
        if (config.palette.bgGradient) {
          document.documentElement.style.setProperty("--bg-gradient", config.palette.bgGradient);
        }
        const overlayOpacity = config.features.overlays ? config.overlays.overlayOpacity : 0;
        const glitchOpacity = config.features.glitch ? config.overlays.glitchOpacity : 0;
        document.documentElement.style.setProperty("--overlay-opacity", overlayOpacity);
        document.documentElement.style.setProperty("--glitch-opacity", glitchOpacity);
        if (bgName) {
          bgName.setAttribute("data-text", strings.bgName);
        }
        if (badge) {
          badge.textContent = strings.badge;
        }
        if (bgText && !config.features.bgText) {
          bgText.style.display = "none";
        }
        if (badge && !config.features.badge) {
          badge.style.display = "none";
        }

        // Toggle the slide-out menu without changing any scene behavior yet.
        try {
          if (sideToggle && sidePanel) {
            const syncPanelState = () => {
              sidePanel.setAttribute(
                "aria-hidden",
                document.body.classList.contains("menu-open") ? "false" : "true"
              );
            };
            // "Menu" handle opens/closes the panel.
            sideToggle.addEventListener("click", () => {
              document.body.classList.toggle("menu-open");
              syncPanelState();
            });
            if (sidePanelClose) {
              // Close arrow hides the panel.
              sidePanelClose.addEventListener("click", () => {
                document.body.classList.remove("menu-open");
                syncPanelState();
              });
            }
            syncPanelState();
          }

          // Live configuration controls (applied via the Implement button).
          if (sidePanel) {
            const titleInput = sidePanel.querySelector('input[name="title"]');
            const toggleButtons = Array.from(sidePanel.querySelectorAll("[data-toggle]"));
            const sectionToggles = Array.from(
              sidePanel.querySelectorAll(".side-panel-section-toggle")
            );
            themePicker = sidePanel.querySelector("[data-theme-picker]");
            themeWheel = sidePanel.querySelector(".theme-wheel");
            themeIndicator = sidePanel.querySelector(".theme-wheel-indicator");
            themeSwatch = sidePanel.querySelector(".theme-swatch");
            themeColor = config.palette.green || themeColor;

            const setToggleState = (button, isOn) => {
              button.setAttribute("aria-pressed", isOn ? "true" : "false");
              button.textContent = isOn ? "On" : "Off";
            };

            const syncToggleStates = () => {
              toggleButtons.forEach((button) => {
                const key = button.getAttribute("data-toggle");
                if (!key) return;
                const value = key.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), config);
                setToggleState(button, Boolean(value));
              });
              // Keep the input aligned with current strings.
              if (titleInput) {
                titleInput.value = strings.title || "";
              }
              // Reflect the current palette in the theme picker.
              themeColor = config.palette.green || themeColor;
              updateThemeSwatch(themeColor);
              updateThemeIndicator(themeColor);
            };

            toggleButtons.forEach((button) => {
              button.addEventListener("click", () => {
                const isOn = button.getAttribute("aria-pressed") === "true";
                setToggleState(button, !isOn);
              });
            });
            sectionToggles.forEach((button) => {
              // Expand/collapse menu sections without affecting live settings.
              button.addEventListener("click", () => {
                const section = button.closest(".side-panel-section");
                if (!section) return;
                section.classList.toggle("is-open");
              });
            });

            if (themePicker && themeWheel) {
              // Select a color by clicking the wheel (hue from angle, saturation from radius).
              themeWheel.addEventListener("click", (event) => {
                const rect = themeWheel.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = event.clientX - cx;
                const dy = event.clientY - cy;
                const radius = rect.width / 2;
                const distance = Math.min(Math.hypot(dx, dy), radius);
                const saturation = radius > 0 ? distance / radius : 0;
                const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
                themeColor = hsvToHex(hue, saturation, 1);
                updateThemeSwatch(themeColor);
                updateThemeIndicator(themeColor);
              });
            }

            if (sidePanelApply) {
              // Apply the menu values to the running scene.
              sidePanelApply.addEventListener("click", () => {
                if (titleInput) {
                  const nextTitle = titleInput.value.trim() || strings.title;
                  strings.title = nextTitle;
                  strings.bgName = nextTitle;
                  if (bgName) {
                    bgName.setAttribute("data-text", strings.bgName);
                    typeBgText();
                  }
                }
                toggleButtons.forEach((button) => {
                  const key = button.getAttribute("data-toggle");
                  if (!key) return;
                  const isOn = button.getAttribute("aria-pressed") === "true";
                  const parts = key.split(".");
                  let cursor = config;
                  for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    if (!cursor[part] || typeof cursor[part] !== "object") {
                      cursor[part] = {};
                    }
                    cursor = cursor[part];
                  }
                  cursor[parts[parts.length - 1]] = isOn;
                });

                updateDocumentTitle(true);
                // Clear any existing visuals when related features are disabled.
                if (!config.features.trail) {
                  trail.length = 0;
                }
                if (!config.features.bursts) {
                  bursts.length = 0;
                }
                if (!config.features.sentinels && sentinelsCtx) {
                  sentinelsCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
                }
              });
            }

          syncToggleStates();
        }
      } catch (err) {
        console.error("Menu setup failed; continuing without panel.", err);
      }

        function updateThemeSwatch(color) {
          if (themeSwatch) {
            themeSwatch.style.background = color;
          }
        }

        function updateThemeIndicator(color) {
          if (!themeWheel || !themeIndicator) return;
          const { h, s } = hexToHsv(color);
          const rect = themeWheel.getBoundingClientRect();
          const radius = rect.width / 2;
          const angle = (h * Math.PI) / 180;
          const dist = radius * s;
          const x = radius + Math.cos(angle) * dist;
          const y = radius + Math.sin(angle) * dist;
          themeIndicator.style.left = x.toFixed(2) + "px";
          themeIndicator.style.top = y.toFixed(2) + "px";
        }

        // Flash/glitch feedback when a sentinel escapes off-screen.
        function triggerEscapeEffect() {
          if (!config.features.glitch) return;
          document.body.classList.add("shake", "glitch");
          clearTimeout(shakeTimer);
          clearTimeout(glitchTimer);
          shakeTimer = setTimeout(() => document.body.classList.remove("shake"), 420);
          glitchTimer = setTimeout(() => document.body.classList.remove("glitch"), 520);
        }

        function updateDocumentTitle(reset) {
          const baseTitle = strings.title || document.title;
          if (reset) {
            titleCursorVisible = true;
          }
          document.title = baseTitle + (titleCursorVisible ? " █" : "");
        }

        function startTitleCursor() {
          clearInterval(titleCursorTimer);
          titleCursorTimer = setInterval(() => {
            titleCursorVisible = !titleCursorVisible;
            updateDocumentTitle(false);
          }, 750);
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
          const token = ++bgTypeToken;
          const target = bgName.getAttribute("data-text") || "";
          bgName.textContent = "";
          let index = 0;
          const typeNext = () => {
            if (token !== bgTypeToken) return;
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
            if (token !== bgTypeToken) return;
            // Randomly delete between 0 and the full length of the current text.
            const deleteCount = Math.floor(Math.random() * (target.length + 1));
            let remaining = deleteCount;
            const deleteNext = () => {
              if (token !== bgTypeToken) return;
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
            if (token !== bgTypeToken) return;
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

        // Convert HSV values from the wheel into a hex color string.
        function hsvToHex(h, s, v) {
          const c = v * s;
          const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
          const m = v - c;
          let r = 0;
          let g = 0;
          let b = 0;

          if (h < 60) {
            r = c; g = x; b = 0;
          } else if (h < 120) {
            r = x; g = c; b = 0;
          } else if (h < 180) {
            r = 0; g = c; b = x;
          } else if (h < 240) {
            r = 0; g = x; b = c;
          } else if (h < 300) {
            r = x; g = 0; b = c;
          } else {
            r = c; g = 0; b = x;
          }

          return rgbToHex(
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
          );
        }

        // Convert a hex color into HSV for positioning the wheel indicator.
        function hexToHsv(hex) {
          const rgb = hexToRgb(hex);
          if (!rgb) return { h: 0, s: 0, v: 1 };
          const r = rgb.r / 255;
          const g = rgb.g / 255;
          const b = rgb.b / 255;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          let h = 0;
          if (delta !== 0) {
            if (max === r) {
              h = ((g - b) / delta) % 6;
            } else if (max === g) {
              h = (b - r) / delta + 2;
            } else {
              h = (r - g) / delta + 4;
            }
            h *= 60;
            if (h < 0) h += 360;
          }
          const s = max === 0 ? 0 : delta / max;
          return { h, s, v: max };
        }

        // Parse a #rrggbb string into RGB channels.
        function hexToRgb(hex) {
          const cleaned = hex.replace("#", "");
          if (cleaned.length !== 6) return null;
          const num = Number.parseInt(cleaned, 16);
          if (!Number.isFinite(num)) return null;
          return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
          };
        }

        // Format RGB channels into a #rrggbb string.
        function rgbToHex(r, g, b) {
          const toHex = (value) => value.toString(16).padStart(2, "0");
          return "#" + toHex(r) + toHex(g) + toHex(b);
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
          const scale = config.sentinels.scaleRange.min + Math.random() * config.sentinels.scaleRange.extra;
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
            s.y += s.vy + Math.sin(s.wobble) * config.sentinels.wobbleAmplitude;
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
          if (config.features.matrix) {
            ctx.fillStyle = config.palette.green;
            ctx.font = config.matrix.fontSize + "px monospace";
            for (let i = 0; i < drops.length; i++) {
              const char = chars[Math.floor(Math.random() * chars.length)];
              const x = i * config.matrix.columnWidth;
              const y = drops[i] * config.matrix.columnWidth;
              ctx.fillText(char, x, y);
              if (y > window.innerHeight && Math.random() < config.matrix.resetChance) {
                drops[i] = 0;
              }
              drops[i]++;
            }
          }
          if (config.features.sentinels) {
            drawSentinels(now);
          }
          if (config.features.rabbit) {
            drawRabbit();
          }
          if (config.features.trail) {
            drawTrail();
          }
          if (config.features.bursts) {
            drawBursts();
          }
          if (config.features.stats) {
            ctx.fillStyle = config.stats.color;
            ctx.font = config.stats.fontSize + "px monospace";
            ctx.fillText(strings.statsKilledLabel + ": " + kills, 16, window.innerHeight - 16);
            ctx.fillText(strings.statsEscapedLabel + ": " + escaped, 16, window.innerHeight - 32);
          }
          requestAnimationFrame(draw);
        }

        // Track pointer movement to leave a character trail.
        window.addEventListener("pointermove", (event) => {
          if (!config.interactions.enabled || !config.features.trail) return;
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
          if (!config.interactions.enabled) return;
          const clickX = toNumber(event.clientX, 0);
          const clickY = toNumber(event.clientY, 0);
          if (config.features.rabbit && rabbit.hit && hitTest(clickX, clickY, rabbit.hit)) {
            window.location.href = config.rabbitUrl;
            return;
          }
          // Click to destroy sentinels.
          if (config.features.sentinels) {
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
          }
          if (config.features.bursts) {
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
          startTitleCursor();
          draw();
        } catch (err) {
          console.error("Animation loop failed to start.", err);
        }

        async function fetchJson(path) {
          try {
            const response = await fetch(path, { cache: "no-cache" });
            if (!response.ok) return {};
            const data = await response.json();
            return data && typeof data === "object" ? data : {};
          } catch (err) {
            console.error("Failed to load " + path + "; using defaults.", err);
            return {};
          }
        }

        function mergeDeep(target, ...sources) {
          for (const source of sources) {
            if (!source || typeof source !== "object") continue;
            for (const key of Object.keys(source)) {
              const value = source[key];
              if (value && typeof value === "object" && !Array.isArray(value)) {
                if (!target[key] || typeof target[key] !== "object") {
                  target[key] = {};
                }
                mergeDeep(target[key], value);
              } else {
                target[key] = value;
              }
            }
          }
          return target;
        }

        function readQueryOverrides() {
          const params = new URLSearchParams(window.location.search);
          const configOverrides = {};
          const stringOverrides = {};
          const setIf = (path, value) => {
            if (value === null || value === undefined || value === "") return;
            const keys = path.split(".");
            let cursor = configOverrides;
            for (let i = 0; i < keys.length - 1; i++) {
              const key = keys[i];
              if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
              cursor = cursor[key];
            }
            cursor[keys[keys.length - 1]] = value;
          };
          const setString = (key, value) => {
            if (value === null || value === undefined || value === "") return;
            stringOverrides[key] = value;
          };
          const toFloat = (value, fallback) => {
            const parsed = Number.parseFloat(value);
            return Number.isFinite(parsed) ? parsed : fallback;
          };
          const toInt = (value, fallback) => {
            const parsed = Number.parseInt(value, 10);
            return Number.isFinite(parsed) ? parsed : fallback;
          };

          setString("title", params.get("title"));
          setString("bgName", params.get("bgName"));
          setString("badge", params.get("badge"));
          setString("statsKilledLabel", params.get("statsKilledLabel"));
          setString("statsEscapedLabel", params.get("statsEscapedLabel"));
          setIf("rabbitUrl", params.get("rabbitUrl"));
          setIf("palette.bg", params.get("bg"));
          setIf("palette.green", params.get("green"));
          setIf("palette.greenDim", params.get("greenDim"));
          setIf("palette.bgGradient", params.get("bgGradient"));
          setIf("overlays.overlayOpacity", toFloat(params.get("overlayOpacity"), undefined));
          setIf("overlays.glitchOpacity", toFloat(params.get("glitchOpacity"), undefined));
          setIf("matrix.chars", params.get("chars"));
          setIf("matrix.columnWidth", toInt(params.get("columnWidth"), undefined));
          setIf("matrix.fontSize", toInt(params.get("matrixFont"), undefined));
          setIf("matrix.fadeAlpha", toFloat(params.get("fade"), undefined));
          setIf("matrix.resetChance", toFloat(params.get("resetChance"), undefined));
          setIf("sentinels.max", toInt(params.get("sentinels"), undefined));
          setIf("sentinels.spawnIntervalMs", toInt(params.get("spawnMs"), undefined));
          setIf("rabbit.speed", toFloat(params.get("rabbitSpeed"), undefined));
          setIf("rabbit.scale", toFloat(params.get("rabbitScale"), undefined));
          setIf("rabbit.hopAmplitude", toFloat(params.get("hop"), undefined));
          setIf("stats.fontSize", toInt(params.get("statsFont"), undefined));
          setIf("stats.color", params.get("statsColor"));
          const interactions = params.get("interactions");
          if (interactions === "0" || interactions === "1") {
            setIf("interactions.enabled", interactions === "1");
          }
          const featureKeys = [
            "matrix",
            "sentinels",
            "rabbit",
            "trail",
            "bursts",
            "bgText",
            "badge",
            "stats",
            "overlays",
            "glitch"
          ];
          for (const key of featureKeys) {
            const value = params.get(key);
            if (value === "0" || value === "1") {
              setIf("features." + key, value === "1");
            }
          }

          return { config: configOverrides, strings: stringOverrides };
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

// Parse JSON from env vars, falling back to an empty object on error.
function parseJson(value) {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.error("Failed to parse JSON configuration.", err);
    return {};
  }
}

// Deep-merge simple objects so overrides can be partial.
function mergeDeep(target, ...sources) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        if (!target[key] || typeof target[key] !== "object") {
          target[key] = {};
        }
        mergeDeep(target[key], value);
      } else {
        target[key] = value;
      }
    }
  }
  return target;
}

// Build the CSS variable theme from config when THEME_CSS is not provided.
function buildThemeCss(config) {
  const palette = config && config.palette ? config.palette : {};
  const overlays = config && config.overlays ? config.overlays : {};
  return `:root {
  color-scheme: dark;
  --bg: ${palette.bg || "#050a08"};
  --green: ${palette.green || "#00ff7a"};
  --green-dim: ${palette.greenDim || "#0b3d2a"};
  --bg-gradient: ${palette.bgGradient || "radial-gradient(1200px 800px at 70% 20%, #092015 0%, var(--bg) 60%)"};
  --overlay-opacity: ${Number.isFinite(overlays.overlayOpacity) ? overlays.overlayOpacity : 1};
  --glitch-opacity: ${Number.isFinite(overlays.glitchOpacity) ? overlays.glitchOpacity : 0.4};
}`;
}
