// ─────────────────────────────────────────────────────────────────────────────
// eclipse.js – Solar and lunar eclipse demonstration modes
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { ECLIPSE_SCRIPTS } from './config.js';

export class EclipseMode {
  /**
   * @param {SceneManager}  sceneMgr
   * @param {BodyManager}   bodyMgr
   * @param {SimulationState} simState  – { paused, useNBody }
   */
  constructor(sceneMgr, bodyMgr, simState) {
    this.sceneMgr  = sceneMgr;
    this.bodyMgr   = bodyMgr;
    this.simState  = simState;

    this.active    = false;
    this.type      = null;   // 'solar' | 'lunar'
    this.stepIndex = 0;

    // Saved positions so we can restore after the demo
    this._savedPositions = new Map();

    // Shadow geometry shown during eclipse
    this._shadowMesh = null;

    // DOM elements (assigned in init)
    this.overlay    = document.getElementById('eclipse-overlay');
    this.titleEl    = document.getElementById('eclipse-title');
    this.typeEl     = document.getElementById('eclipse-type-badge');
    this.stepEl     = document.getElementById('eclipse-step-indicator');
    this.textEl     = document.getElementById('eclipse-explanation');
    this.factEl     = document.getElementById('eclipse-fact');
    this.factBox    = document.getElementById('eclipse-fact-box');
    this.prevBtn    = document.getElementById('eclipse-prev-btn');
    this.nextBtn    = document.getElementById('eclipse-next-btn');
    this.closeBtn   = document.getElementById('eclipse-close');
  }

  // ── Public API ────────────────────────────────────────────────────────────

  start(type) {
    if (!this.bodyMgr.bodies.has('sun') ||
        !this.bodyMgr.bodies.has('earth') ||
        !this.bodyMgr.bodies.has('moon')) {
      alert('Eclipse mode needs the Sun, Earth, and Moon! 🌍');
      return;
    }

    this.type      = type;
    this.stepIndex = 0;
    this.active    = true;

    // Pause the simulation
    this.simState.paused = true;

    // Save current positions
    this._savePositions();

    // Arrange bodies for eclipse
    this._arrangeForEclipse();

    // Show overlay
    this.overlay.classList.remove('hidden');
    this._renderStep();
  }

  next() {
    const steps = ECLIPSE_SCRIPTS[this.type];
    if (this.stepIndex < steps.length - 1) {
      this.stepIndex++;
      this._renderStep();
    } else {
      // Last step pressed → exit
      this.exit();
    }
  }

  prev() {
    if (this.stepIndex > 0) {
      this.stepIndex--;
      this._renderStep();
    }
  }

  exit() {
    this.active    = false;
    this.overlay.classList.add('hidden');
    this._restorePositions();
    this._removeShadow();
    this.simState.paused = false;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  _savePositions() {
    for (const body of this.bodyMgr.bodies.values()) {
      this._savedPositions.set(body.id, body.position.clone());
    }
  }

  _restorePositions() {
    for (const [id, pos] of this._savedPositions) {
      const body = this.bodyMgr.bodies.get(id);
      if (body) body.snapTo(pos);
    }
    this._savedPositions.clear();
  }

  /**
   * Place Sun, Earth, Moon in a simplified line for the eclipse demo.
   * We use a fixed horizontal layout so the explanation is clear.
   */
  _arrangeForEclipse() {
    const sun   = this.bodyMgr.bodies.get('sun');
    const earth = this.bodyMgr.bodies.get('earth');
    const moon  = this.bodyMgr.bodies.get('moon');

    // Reset any incidental y offsets
    sun.snapTo(new THREE.Vector3(0, 0, 0));

    const earthDist = earth.orbitRadius;   // ~80
    const moonDist  = moon.orbitRadius;    // ~12

    if (this.type === 'solar') {
      // Sun --- Moon --- Earth  (Moon between Sun and Earth)
      earth.snapTo(new THREE.Vector3(earthDist, 0, 0));
      moon.snapTo(new THREE.Vector3(earthDist - moonDist, 0, 0));
    } else {
      // Sun --- Earth --- Moon  (Earth between Sun and Moon)
      earth.snapTo(new THREE.Vector3(earthDist, 0, 0));
      moon.snapTo(new THREE.Vector3(earthDist + moonDist, 0, 0));
    }

    // Orbit lines follow
    if (earth.orbitLine) earth.orbitLine.visible = false;
    if (moon.orbitLine)  moon.orbitLine.visible  = false;

    // Fly camera to a good side-view
    const mid = new THREE.Vector3(earthDist / 2, 0, 0);
    this.sceneMgr.flyTo(mid, 110, 1000);
    setTimeout(() => { this.sceneMgr.controls.target.copy(mid); }, 1000);
  }

  _buildShadow() {
    this._removeShadow();
    const earth = this.bodyMgr.bodies.get('earth');
    const moon  = this.bodyMgr.bodies.get('moon');
    const sun   = this.bodyMgr.bodies.get('sun');

    let casterPos, casterRadius, targetPos;
    if (this.type === 'solar') {
      // Moon casts shadow on Earth
      casterPos    = moon.position.clone();
      casterRadius = moon.radius;
      targetPos    = earth.position.clone();
    } else {
      // Earth casts shadow on Moon
      casterPos    = earth.position.clone();
      casterRadius = earth.radius;
      targetPos    = moon.position.clone();
    }

    const shadowLen = casterPos.distanceTo(targetPos) * 2.2;
    // Shadow cylinder approximating an umbra cone:
    // slightly wider at the caster end, narrower at the target end.
    // Open-ended (last arg = true) so the caps don't obscure body meshes.
    const geo = new THREE.CylinderGeometry(casterRadius * 0.8, casterRadius * 1.4, shadowLen, 32, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color:       0x000015,
      transparent: true,
      opacity:     0.5,
      side:        THREE.DoubleSide,
    });
    this._shadowMesh = new THREE.Mesh(geo, mat);

    // Orient from caster toward target
    const dir = new THREE.Vector3().subVectors(targetPos, casterPos).normalize();
    // CylinderGeometry default axis is Y; rotate Y → dir
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), dir
    );
    this._shadowMesh.quaternion.copy(quat);

    // Place at midpoint
    const mid = new THREE.Vector3()
      .addVectors(casterPos, targetPos)
      .multiplyScalar(0.5);
    this._shadowMesh.position.copy(mid);

    this.sceneMgr.scene.add(this._shadowMesh);
  }

  _removeShadow() {
    if (this._shadowMesh) {
      this._shadowMesh.geometry.dispose();
      this.sceneMgr.scene.remove(this._shadowMesh);
      this._shadowMesh = null;
    }
    // Restore Moon colour
    const moon = this.bodyMgr.bodies.get('moon');
    if (moon?.mesh) moon.mesh.material.color.setHex(moon.color);
  }

  _renderStep() {
    const scripts = ECLIPSE_SCRIPTS[this.type];
    const step    = scripts[this.stepIndex];
    const total   = scripts.length;

    // Badge
    this.typeEl.textContent = this.type === 'solar' ? '☀️ Solar Eclipse' : '🌙 Lunar Eclipse';
    this.typeEl.className   = `eclipse-badge eclipse-${this.type}`;

    // Title & text
    this.titleEl.textContent = step.title;
    this.textEl.textContent  = step.text;

    // Step counter
    this.stepEl.textContent  = `Step ${this.stepIndex + 1} of ${total}`;

    // Fact box
    if (step.fact) {
      this.factEl.textContent = step.fact;
      this.factBox.classList.remove('hidden');
    } else {
      this.factBox.classList.add('hidden');
    }

    // Buttons
    this.prevBtn.disabled    = this.stepIndex === 0;
    this.nextBtn.textContent = this.stepIndex === total - 1
      ? 'Finish 🎉' : 'Next ▶';

    // Shadow – show from step 1 onwards
    if (this.stepIndex >= 1) {
      this._buildShadow();

      // Lunar eclipse step 2: turn Moon red (blood moon)
      if (this.type === 'lunar' && this.stepIndex === 2) {
        const moon = this.bodyMgr.bodies.get('moon');
        if (moon?.mesh) moon.mesh.material.color.setHex(0xcc3300);
      } else {
        const moon = this.bodyMgr.bodies.get('moon');
        if (moon?.mesh) moon.mesh.material.color.setHex(moon.color);
      }
    } else {
      this._removeShadow();
    }

    // Camera hints
    if (step.cameraHint === 'earth') {
      const earth = this.bodyMgr.bodies.get('earth');
      if (earth) this.sceneMgr.flyTo(earth.position, 40, 800);
    } else if (step.cameraHint === 'moon') {
      const moon = this.bodyMgr.bodies.get('moon');
      if (moon) this.sceneMgr.flyTo(moon.position, 25, 800);
    } else if (step.cameraHint === 'side') {
      const earth     = this.bodyMgr.bodies.get('earth');
      const earthDist = earth?.orbitRadius ?? 80;
      const mid       = new THREE.Vector3(earthDist / 2, 0, 0);
      this.sceneMgr.flyTo(mid, 110, 800);
    }
  }
}
