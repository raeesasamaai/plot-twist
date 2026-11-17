import assert from "node:assert/strict";
import worker from "../dist/server/index.js";

const origin = "https://plot-twist.test";
const request = (path, init) =>
  worker.fetch(new Request(origin + path, init), {});
const page = await request("/");
assert.equal(page.status, 200);
assert.ok(page.headers.get("content-security-policy"));
const html = await page.text();
assert.match(html, /Plot Twist/);
for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) {
  const asset = await request(match[1]);
  assert.equal(asset.status, 200);
  assert.ok((await asset.arrayBuffer()).byteLength > 0);
}
const story = await request("/api/narrate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Explorer", difficulty: "medium" }),
});
assert.equal((await story.json()).mode, "original");
assert.equal((await request("/api/health")).status, 200);
assert.equal((await request("/missing.js")).status, 404);
assert.equal((await request("/api/missing")).status, 404);
console.log(
  "Production smoke checks passed: document, assets, headers, health, narrator, and 404s.",
);
