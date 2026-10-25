import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, "..");

async function generateHtml() {
  const serverPath = path.resolve(frontendDir, "dist/server/server.js");
  if (!fs.existsSync(serverPath)) {
    console.warn("No server.js found at", serverPath);
    return;
  }

  try {
    const serverUrl = pathToFileURL(serverPath).href;
    const { default: server } = await import(serverUrl);
    const res = await server.fetch(new Request("http://localhost/"));
    const html = await res.text();

    const targets = [
      path.resolve(frontendDir, "dist/index.html"),
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

    // Also mirror dist/assets to frontend/assets in case Publish Directory is root
    const distAssets = path.resolve(frontendDir, "dist/assets");
    const rootAssets = path.resolve(frontendDir, "assets");
    if (fs.existsSync(distAssets) && !fs.existsSync(rootAssets)) {
      fs.cpSync(distAssets, rootAssets, { recursive: true });
      console.log("Mirrored dist/assets to frontend/assets");
    }
  } catch (err) {
    console.error("Prerender failed:", err);
  }
}

generateHtml();
