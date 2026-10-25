import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, "..");

async function generateHtml() {
  const distDir = path.resolve(frontendDir, "dist");
  const fallbackHtmlPath = path.resolve(frontendDir, "index.html");

  // 1. Copy all client assets from .output/public, dist/client, etc. into dist/
  const sources = [
    path.resolve(frontendDir, ".output/public"),
    path.resolve(frontendDir, "dist/client"),
    path.resolve(frontendDir, ".vercel/output/static"),
  ];
  for (const src of sources) {
    if (fs.existsSync(src)) {
      try {
        fs.cpSync(src, distDir, { recursive: true });
        console.log(`Copied assets from ${src} into dist/`);
      } catch (err) {
        console.warn(`Failed copying from ${src}:`, err.message);
      }
    }
  }

  // 2. Obtain HTML via SSR server fetch, or fallback to existing index.html
  let html = null;
  const serverPath = path.resolve(frontendDir, "dist/server/server.js");

  if (fs.existsSync(serverPath)) {
    try {
      const serverUrl = pathToFileURL(serverPath).href;
      const { default: server } = await import(serverUrl);
      const res = await server.fetch(new Request("http://localhost/"));
      html = await res.text();
      console.log(`Prerendered HTML via SSR (${html.length} bytes)`);
    } catch (ssrErr) {
      console.warn("SSR render failed, falling back to static index.html template:", ssrErr.message);
    }
  }

  if (!html && fs.existsSync(fallbackHtmlPath)) {
    html = fs.readFileSync(fallbackHtmlPath, "utf8");
    console.log(`Loaded fallback index.html (${html.length} bytes)`);
  }

  if (!html) {
    console.error("No HTML source available to write index.html!");
    return;
  }

  // Ensure visiting /index.html directly normalizes to / so TanStack Router does not show blank
  const normalizeScript = `<script>if(window.location.pathname.endsWith("/index.html")){const target=(window.location.pathname.replace(/\\/index\\.html$/,"")||"/")+window.location.search+window.location.hash;window.history.replaceState(null,"",target);}</script>`;
  if (!html.includes('pathname.endsWith("/index.html")')) {
    html = html.replace("<head>", "<head>" + normalizeScript);
  }

  // 3. Write index.html to all possible deployment targets
  const targets = [
    path.resolve(frontendDir, "dist/index.html"),
    path.resolve(frontendDir, "dist/client/index.html"),
    path.resolve(frontendDir, "index.html"),
    path.resolve(frontendDir, ".vercel/output/static/index.html"),
    path.resolve(frontendDir, ".output/public/index.html"),
  ];

  for (const target of targets) {
    const dir = path.dirname(target);
    if (fs.existsSync(dir)) {
      fs.writeFileSync(target, html, "utf8");
      console.log(`Generated ${target} (${html.length} bytes)`);
    }
  }

  // 4. Mirror assets to frontend/assets in case Publish Directory is root
  const distAssets = path.resolve(frontendDir, "dist/assets");
  const rootAssets = path.resolve(frontendDir, "assets");
  if (fs.existsSync(distAssets)) {
    try {
      fs.cpSync(distAssets, rootAssets, { recursive: true });
      console.log("Mirrored dist/assets to frontend/assets");
    } catch (err) {
      console.warn("Failed mirroring assets to root:", err.message);
    }
  }
}

generateHtml();
