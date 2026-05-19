// build.mjs – bundles all JS (including three.js), inlines CSS, and produces
// a single self-contained index.html that works via file://.
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const ROOT = new URL('.', import.meta.url).pathname;

// ── 1. Bundle JS with esbuild ─────────────────────────────────────────────────
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, 'js/main.js')],
  bundle:      true,
  format:      'iife',
  minify:      true,
  write:       false,
  // Resolve three.js from the locally installed package
  nodePaths:   [path.join(ROOT, 'node_modules')],
});

const jsBundle = result.outputFiles[0].text;

// ── 2. Read CSS ───────────────────────────────────────────────────────────────
const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');

// ── 3. Read HTML template ─────────────────────────────────────────────────────
let html = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');

// ── 4. Remove the importmap block ─────────────────────────────────────────────
html = html.replace(
  /[ \t]*<!-- Three\.js import map[\s\S]*?<\/script>\n?/,
  '',
);

// ── 5. Replace <link rel="stylesheet"> with an inline <style> block ───────────
// Use a replacer function to avoid special $& / $' / $` patterns in the CSS
// being interpreted by String.prototype.replace.
html = html.replace(
  /[ \t]*<link rel="stylesheet" href="css\/style\.css" \/>\n?/,
  () => `  <style>\n${css}\n  </style>\n`,
);

// ── 6. Replace the <script type="module"> entry with the bundled inline script ─
// Use a replacer function so that any '$&', '$'' etc. inside jsBundle are not
// treated as special replacement patterns by String.prototype.replace.
html = html.replace(
  /[ \t]*<script type="module" src="js\/main\.js"><\/script>\n?/,
  () => `  <script>\n${jsBundle}\n  </script>\n`,
);

// ── 7. Write output ───────────────────────────────────────────────────────────
const outPath = path.join(ROOT, 'index.html');
fs.writeFileSync(outPath, html, 'utf8');

const size = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`✅  Build complete → index.html  (${size} KB)`);
