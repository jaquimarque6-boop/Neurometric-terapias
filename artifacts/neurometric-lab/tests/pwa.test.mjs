import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { createUpdateGate } from "../src/pwa/update-gate.ts";

const dist = resolve(import.meta.dirname, "../dist");
const manifest = JSON.parse(readFileSync(resolve(dist, "manifest.webmanifest"), "utf8"));
const sw = readFileSync(resolve(dist, "sw.js"), "utf8");
const source = readFileSync(resolve(import.meta.dirname, "../src/sw.ts"), "utf8");
const html = readFileSync(resolve(dist, "index.html"), "utf8");
const precache = sw.match(/const \w+=(\[\{"revision":null,"url":"assets\/[^\n]+?\}\])\.filter\(/);

test("manifest has installable identity, launch scope and brand icon sizes", () => {
  assert.equal(manifest.name, "Neurometric Terapias");
  assert.equal(manifest.short_name, "Neurometric");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.orientation, "any");
  assert.equal(manifest.theme_color, "#E07A5F");
  assert.deepEqual(manifest.icons.map(({ sizes }) => sizes), ["192x192", "512x512", "512x512"]);
  assert.equal(manifest.icons[2].purpose, "maskable");
  for (const icon of [...manifest.icons.map(({ src }) => src), "icons/apple-touch-icon.png"]) {
    assert.ok(statSync(resolve(dist, icon)).size > 1000, icon);
  }
  assert.match(html, /rel="manifest"/);
  assert.match(html, /rel="apple-touch-icon"/);
});

test("generated service worker precaches ONLY public shell, generated JS/CSS and designated icons", () => {
  assert.ok(precache, "injected Workbox manifest must be present");
  const entries = JSON.parse(precache[1]);
  assert.ok(entries.length > 5);
  assert.ok(entries.some(({ url }) => url === "index.html"));
  assert.ok(entries.some(({ url }) => url.endsWith(".css")));
  assert.ok(entries.some(({ url }) => url.endsWith(".js")));
  for (const { url } of entries) {
    assert.match(url, /^(?:index\.html|manifest\.webmanifest|assets\/[^/]+\.(?:js|css)|icons\/[^/]+\.png)$/);
    assert.doesNotMatch(url, /(?:^|\/)api(?:\/|$)|^https?:|^images\/|^uploads\/|^files\//i);
  }
  // vite-plugin-pwa may inject its own manifest.webmanifest; our service worker
  // filters even that out, and only the following asset types reach Workbox.
  assert.match(source, /const safeEntries = self\.__WB_MANIFEST\.filter/);
  assert.match(source, /precacheAndRoute\(safeEntries\)/);
  assert.match(source, /path\.pathname === `\$\{base\}index\.html`/);
  assert.match(source, /path\.pathname\.startsWith\(`\$\{base\}icons\/`\)/);
  assert.match(source, /!isApi\(path\.pathname\)/);
  assert.match(source, /credentials: "omit"/);
  assert.match(source, /request\.headers\.has\("Authorization"\)/);
  assert.match(source, /request\.mode === "navigate"/);
  assert.match(source, /return await fetch\(request\)/);
  assert.match(source, /matchPrecache\(`\$\{base\}index\.html`\)/);
  assert.ok(entries.some(({ url }) => url === "manifest.webmanifest"));
  assert.match(sw, /SKIP_WAITING/);
  assert.doesNotMatch(sw, /NetworkFirst|CacheFirst|StaleWhileRevalidate|clientsClaim/);
});

test("only the consenting tab reloads when an update takes control", () => {
  let acceptingTabReloads = 0;
  let otherTabReloads = 0;
  let skipWaitingRequests = 0;
  const acceptingTab = createUpdateGate(() => acceptingTabReloads++);
  const otherTab = createUpdateGate(() => otherTabReloads++);
  assert.equal(acceptingTab.onControlling(), false);
  assert.equal(otherTab.onControlling(), false);
  assert.equal(acceptingTabReloads + otherTabReloads, 0);
  acceptingTab.accept(() => skipWaitingRequests++);
  assert.equal(acceptingTab.onControlling(), true);
  assert.equal(otherTab.onControlling(), false);
  assert.equal(skipWaitingRequests, 1);
  assert.equal(acceptingTabReloads, 1);
  assert.equal(otherTabReloads, 0);
});

test("offline retry cannot reload the page or unmount unsaved forms", () => {
  const experience = readFileSync(resolve(import.meta.dirname, "../src/pwa/experience.tsx"), "utf8");
  assert.doesNotMatch(experience, /navigator\.onLine\).*window\.location\.reload/);
  assert.match(experience, /setRetryStatus\("Todavía no hay conexión/);
  assert.match(experience, /useLayoutEffect\(\(\) => \{\s*document\.body\.classList\.toggle\("nm-offline"/);
  assert.match(experience, /inert=\{!online\}/);
  const css = readFileSync(resolve(import.meta.dirname, "../src/index.css"), "utf8");
  assert.match(css, /body\.nm-offline > :not\(#root\) \{ visibility: hidden !important/);
  assert.match(css, /@media print \{\s*body\.nm-offline #root \{ display: none !important/);
  assert.doesNotMatch(experience, /registerSW|virtual:pwa-register/);
});