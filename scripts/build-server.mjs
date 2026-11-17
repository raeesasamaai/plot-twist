import { build } from "esbuild";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const assets = {};
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};
async function collect(dir) {
  for (const file of await readdir(dir, { withFileTypes: true })) {
    if (file.name === "server" || file.name.startsWith(".")) continue;
    const absolute = path.join(dir, file.name);
    if (file.isDirectory()) await collect(absolute);
    else
      assets["/" + path.relative("dist", absolute).split(path.sep).join("/")] =
        {
          body: (await readFile(absolute)).toString("base64"),
          type: mime[path.extname(file.name)] || "application/octet-stream",
        };
  }
}
await collect("dist");
await build({
  entryPoints: ["server/worker.ts"],
  outfile: "dist/server/index.js",
  bundle: true,
  minify: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  plugins: [
    {
      name: "inline-static-assets",
      setup(b) {
        b.onResolve({ filter: /^virtual:assets$/ }, () => ({
          path: "assets",
          namespace: "inline",
        }));
        b.onLoad({ filter: /.*/, namespace: "inline" }, () => ({
          contents: `export default ${JSON.stringify(assets)}`,
          loader: "js",
        }));
      },
    },
  ],
});
