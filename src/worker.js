/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import htmlTemplate from "./index.html";
import baseCss from "./styles/base.css.txt";
import effectsCss from "./styles/effects.css.txt";
import menuCss from "./styles/menu.css.txt";
import appIndex from "./app/index.js.txt";
import appUtils from "./app/utils.js.txt";
import appTheme from "./app/theme.js.txt";
import appTitle from "./app/title.js.txt";
import appMenu from "./app/menu.js.txt";
import appScene from "./app/scene.js.txt";
import defaultConfigJson from "./config/default-config.json.txt";
import defaultStringsJson from "./config/default-strings.json.txt";


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
      // Default configuration for visuals and behaviors (loaded from config assets).
      // Override with the APP_CONFIG environment variable (JSON string).
      const defaultConfig = parseJson(resolveText(defaultConfigJson));
      // Default labels used for the tab title, background name, and UI text.
      // Override with the APP_STRINGS environment variable (JSON string).
      const defaultStrings = parseJson(resolveText(defaultStringsJson));
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
      if (url.pathname === "/styles/base.css") {
        return new Response(resolveText(baseCss), {
          headers: { "content-type": "text/css; charset=utf-8" }
        });
      }
      if (url.pathname === "/styles/effects.css") {
        return new Response(resolveText(effectsCss), {
          headers: { "content-type": "text/css; charset=utf-8" }
        });
      }
      if (url.pathname === "/styles/menu.css") {
        return new Response(resolveText(menuCss), {
          headers: { "content-type": "text/css; charset=utf-8" }
        });
      }
      if (url.pathname === "/app/index.js") {
        return new Response(resolveText(appIndex), {
          headers: { "content-type": "text/javascript; charset=utf-8" }
        });
      }
      if (url.pathname === "/app/utils.js") {
        return new Response(resolveText(appUtils), {
          headers: { "content-type": "text/javascript; charset=utf-8" }
        });
      }
      if (url.pathname === "/app/theme.js") {
        return new Response(resolveText(appTheme), {
          headers: { "content-type": "text/javascript; charset=utf-8" }
        });
      }
      if (url.pathname === "/app/title.js") {
        return new Response(resolveText(appTitle), {
          headers: { "content-type": "text/javascript; charset=utf-8" }
        });
      }
      if (url.pathname === "/app/menu.js") {
        return new Response(resolveText(appMenu), {
          headers: { "content-type": "text/javascript; charset=utf-8" }
        });
      }
      if (url.pathname === "/app/scene.js") {
        return new Response(resolveText(appScene), {
          headers: { "content-type": "text/javascript; charset=utf-8" }
        });
      }
      if (url.pathname === "/theme.css") {
        return new Response(themeCss, {
          headers: { "content-type": "text/css; charset=utf-8" }
        });
      }
      // Minimal Matrix-rain page, no external assets.
      return new Response(resolveText(htmlTemplate), {
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
  const rgb = hexToRgbString(palette.green || "#00ff7a");
  return `:root {
  color-scheme: dark;
  --bg: ${palette.bg || "#050a08"};
  --green: ${palette.green || "#00ff7a"};
  --green-dim: ${palette.greenDim || "#0b3d2a"};
  --green-rgb: ${rgb};
  --green-soft: rgba(${rgb}, 0.12);
  --green-soft-strong: rgba(${rgb}, 0.2);
  --green-soft-weak: rgba(${rgb}, 0.08);
  --bg-gradient: ${palette.bgGradient || "radial-gradient(1200px 800px at 70% 20%, #092015 0%, var(--bg) 60%)"};
  --overlay-opacity: ${Number.isFinite(overlays.overlayOpacity) ? overlays.overlayOpacity : 1};
  --glitch-opacity: ${Number.isFinite(overlays.glitchOpacity) ? overlays.glitchOpacity : 0.4};
}`;
}

function resolveText(value) {
  if (typeof value === "string") return value;
  if (value && typeof value.text === "string") return value.text;
  if (value && typeof value.source === "string") return value.source;
  if (value && typeof value.default === "string") return value.default;
  if (value && value.default) return resolveText(value.default);
  if (value instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(value));
  }
  if (ArrayBuffer.isView(value)) {
    return new TextDecoder().decode(value);
  }
  return "";
}

function hexToRgbString(hex) {
  const cleaned = String(hex || "").replace("#", "");
  if (cleaned.length !== 6) return "0, 255, 122";
  const num = Number.parseInt(cleaned, 16);
  if (!Number.isFinite(num)) return "0, 255, 122";
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return r + ", " + g + ", " + b;
}
