// ─────────────────────────────────────────────────────────────────────────────
// textures.js – Procedural texture generation for celestial bodies
// Generates canvas-based textures so no external image files are needed.
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate a procedural planet texture as a THREE.CanvasTexture.
 * @param {object} opts
 * @param {number} opts.baseColor - hex colour (e.g. 0x2E8BC0)
 * @param {string} opts.style - 'rocky', 'gas', 'ice', 'earth', 'barren'
 * @param {number} [opts.seed] - seed for reproducibility
 * @param {number} [opts.size] - texture resolution (default 256)
 */
export function generatePlanetTexture({ baseColor, style = 'rocky', seed = 42, size = 256 }) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(seed);

  // Convert hex to RGB
  const r = (baseColor >> 16) & 0xFF;
  const g = (baseColor >> 8) & 0xFF;
  const b = baseColor & 0xFF;

  // Fill base colour
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, size, size);

  if (style === 'gas') {
    // Gas giant: horizontal bands with colour variation
    const bands = 8 + Math.floor(rng() * 8);
    for (let i = 0; i < bands; i++) {
      const y = (i / bands) * size;
      const h = size / bands + rng() * 6 - 3;
      const shift = Math.floor(rng() * 40 - 20);
      const br = Math.max(0, Math.min(255, r + shift));
      const bg = Math.max(0, Math.min(255, g + shift));
      const bb = Math.max(0, Math.min(255, b + shift));
      ctx.fillStyle = `rgba(${br},${bg},${bb},0.6)`;
      ctx.fillRect(0, y, size, h);
    }
    // Add swirl spots
    for (let i = 0; i < 3; i++) {
      const sx = rng() * size;
      const sy = rng() * size;
      const sr = 8 + rng() * 20;
      ctx.beginPath();
      ctx.ellipse(sx, sy, sr * 1.5, sr, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${255 - r},${255 - g},${255 - b},0.15)`;
      ctx.fill();
    }
  } else if (style === 'ice') {
    // Ice world: cracks and light patches
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.moveTo(rng() * size, rng() * size);
      ctx.lineTo(rng() * size, rng() * size);
      ctx.strokeStyle = `rgba(200,220,255,${0.1 + rng() * 0.2})`;
      ctx.lineWidth = 0.5 + rng() * 1.5;
      ctx.stroke();
    }
    for (let i = 0; i < 15; i++) {
      const px = rng() * size;
      const py = rng() * size;
      const pr = 5 + rng() * 20;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,240,255,${0.05 + rng() * 0.1})`;
      ctx.fill();
    }
  } else if (style === 'earth') {
    // Earth-like: continents (irregular patches of green/brown)
    for (let i = 0; i < 12; i++) {
      const cx = rng() * size;
      const cy = rng() * size;
      ctx.beginPath();
      const pts = 5 + Math.floor(rng() * 6);
      for (let p = 0; p < pts; p++) {
        const angle = (p / pts) * Math.PI * 2;
        const dist = 10 + rng() * 35;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        if (p === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const gr = 30 + Math.floor(rng() * 60);
      const gg = 100 + Math.floor(rng() * 80);
      const gb = 20 + Math.floor(rng() * 40);
      ctx.fillStyle = `rgba(${gr},${gg},${gb},0.5)`;
      ctx.fill();
    }
    // Cloud wisps
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(rng() * size, rng() * size, 15 + rng() * 30, 5 + rng() * 10, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.1 + rng() * 0.15})`;
      ctx.fill();
    }
  } else if (style === 'barren') {
    // Barren / moon-like: craters
    for (let i = 0; i < 30; i++) {
      const cx = rng() * size;
      const cy = rng() * size;
      const cr = 3 + rng() * 15;
      // Shadow rim
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${0.1 + rng() * 0.15})`;
      ctx.fill();
      // Lighter center
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 1, cr * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.05 + rng() * 0.08})`;
      ctx.fill();
    }
  } else {
    // Rocky: surface noise patches
    for (let i = 0; i < 60; i++) {
      const px = rng() * size;
      const py = rng() * size;
      const pr = 2 + rng() * 12;
      const shift = Math.floor(rng() * 50 - 25);
      const pr2 = Math.max(0, Math.min(255, r + shift));
      const pg = Math.max(0, Math.min(255, g + shift));
      const pb = Math.max(0, Math.min(255, b + shift));
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pr2},${pg},${pb},0.4)`;
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Generate a procedural star texture with a fiery / plasma look.
 * @param {number} baseColor - hex colour
 * @param {number} [seed]
 * @param {number} [size]
 */
export function generateStarTexture(baseColor, seed = 7, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(seed);

  const r = (baseColor >> 16) & 0xFF;
  const g = (baseColor >> 8) & 0xFF;
  const b = baseColor & 0xFF;

  // Radial gradient base
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 30)})`);
  gradient.addColorStop(0.6, `rgb(${r},${g},${b})`);
  gradient.addColorStop(1, `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 20)})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Granulation spots
  for (let i = 0; i < 80; i++) {
    const sx = rng() * size;
    const sy = rng() * size;
    const sr = 2 + rng() * 8;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    const bright = rng() > 0.5;
    ctx.fillStyle = bright
      ? `rgba(255,255,200,${0.1 + rng() * 0.15})`
      : `rgba(${Math.max(0, r - 60)},${Math.max(0, g - 60)},0,${0.1 + rng() * 0.15})`;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
