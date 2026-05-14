// ─────────────────────────────────────────────────────────────────────────────
// bodies.js – CelestialBody class and BodyManager
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { keplerianOffset, advanceAngle, circularOrbitVelocity } from './physics.js';

// ── CelestialBody ─────────────────────────────────────────────────────────────
export class CelestialBody {
  /**
   * @param {object} cfg – body config (from config.js SOLAR_BODIES or user input)
   */
  constructor(cfg) {
    this.id          = cfg.id;
    this.name        = cfg.name;
    this.emoji       = cfg.emoji       ?? '🪐';
    this.type        = cfg.type        ?? 'planet';
    this.radius      = cfg.radius      ?? 3;
    this.color       = cfg.color       ?? 0xffffff;
    this.emissive    = cfg.emissive    ?? 0x000000;
    this.emissiveIntensity = cfg.emissiveIntensity ?? 0;
    this.mass        = cfg.mass        ?? 1;
    this.orbitRadius = cfg.orbitRadius ?? 80;
    this.period      = cfg.period      ?? 1;
    this.parentId    = cfg.parent      ?? null;
    this.hasRings    = cfg.rings       ?? false;
    this.description = cfg.description ?? '';
    this.funFact     = cfg.funFact     ?? '';
    this.isCustom    = cfg.isCustom    ?? false;

    // Keplerian state – random start angle for variety
    this.angle = cfg.startAngle ?? Math.random() * Math.PI * 2;

    // N-body state
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.fixed    = cfg.fixed ?? false; // Sun stays fixed unless user enables full N-body

    // Reference to parent CelestialBody (set by BodyManager after all are created)
    this.parent = null;

    // Three.js objects (built in buildMesh)
    this.mesh      = null;
    this.orbitLine = null;
    this.label     = null;
    this.trailLine = null;
    this._trailPositions = [];
    this._trailMax = 300;

    // Light (only stars)
    this.light = null;
  }

  // ── Build Three.js objects ────────────────────────────────────────────────
  buildMesh(scene) {
    // Sphere
    const geo  = new THREE.SphereGeometry(this.radius, 32, 32);
    const mat  = new THREE.MeshStandardMaterial({
      color:             this.color,
      emissive:          this.emissive,
      emissiveIntensity: this.emissiveIntensity,
      roughness:         this.type === 'star' ? 1 : 0.85,
      metalness:         0.05,
    });
    this.mesh  = new THREE.Mesh(geo, mat);
    this.mesh.castShadow    = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData.bodyId = this.id;
    scene.add(this.mesh);

    // Glow for stars
    if (this.type === 'star') {
      const glowGeo = new THREE.SphereGeometry(this.radius * 1.35, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color:       this.color,
        transparent: true,
        opacity:     0.18,
        side:        THREE.BackSide,
      });
      this.mesh.add(new THREE.Mesh(glowGeo, glowMat));

      // Point light
      this.light = new THREE.PointLight(this.color, 2.5, 1800, 1.4);
      this.mesh.add(this.light);
    }

    // Saturn-style rings
    if (this.hasRings) {
      const rInner = this.radius * 1.45;
      const rOuter = this.radius * 2.35;
      const ringGeo = new THREE.RingGeometry(rInner, rOuter, 80);
      // RingGeometry UVs need fixing so the texture reads radially
      const pos = ringGeo.attributes.position;
      const uv  = ringGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const r = Math.sqrt(x * x + y * y);
        uv.setXY(i, (r - rInner) / (rOuter - rInner), 0.5);
      }
      const ringMat = new THREE.MeshBasicMaterial({
        color:       0xc8a84b,
        side:        THREE.DoubleSide,
        transparent: true,
        opacity:     0.75,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.3;
      this.mesh.add(ring);
    }

    // Orbit path line
    this._buildOrbitLine(scene);

    // Label (CSS2D)
    this._buildLabel();

    // Trail line (hidden until enabled)
    this._buildTrail(scene);
  }

  _buildOrbitLine(scene) {
    if (this.orbitRadius <= 0) return;
    const pts = [];
    const segs = 128;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        this.orbitRadius * Math.cos(a),
        0,
        this.orbitRadius * Math.sin(a)
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color:       this.color,
      transparent: true,
      opacity:     0.25,
    });
    this.orbitLine = new THREE.LineLoop(geo, mat);
    scene.add(this.orbitLine);
  }

  _buildLabel() {
    const div = document.createElement('div');
    div.className  = 'body-label';
    div.textContent = `${this.emoji} ${this.name}`;
    this.label = new CSS2DObject(div);
    this.label.position.set(0, this.radius + 2.2, 0);
    this.mesh.add(this.label);
  }

  _buildTrail(scene) {
    const geo = new THREE.BufferGeometry();
    // Pre-allocate buffer for up to _trailMax positions
    const buf = new Float32Array(this._trailMax * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(buf, 3));
    geo.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({
      color:       this.color,
      transparent: true,
      opacity:     0.45,
    });
    this.trailLine = new THREE.Line(geo, mat);
    this.trailLine.frustumCulled = false;
    this.trailLine.visible = false;
    scene.add(this.trailLine);
  }

  // ── Update position every frame ───────────────────────────────────────────
  /**
   * @param {number}  dt        simulation time step (years)
   * @param {boolean} useNBody  if true, position is already set by physics engine
   */
  updatePosition(dt, useNBody) {
    if (useNBody) {
      // N-body: position is set externally by physics engine.
      // Orbit line trails the actual trajectory so hide the static ring.
      if (this.orbitLine) this.orbitLine.visible = false;
    } else {
      // Keplerian
      this.angle = advanceAngle(this.angle, this.period, dt);
      const offset = keplerianOffset(this.orbitRadius, this.angle);

      if (this.parent) {
        this.position.copy(this.parent.position).add(offset);
      } else {
        this.position.copy(offset);
      }
      if (this.orbitLine) {
        // Keep orbit line centred on parent
        if (this.parent) {
          this.orbitLine.position.copy(this.parent.position);
        } else {
          this.orbitLine.position.set(0, 0, 0);
        }
      }
    }

    this.mesh.position.copy(this.position);
    this._updateTrail();
  }

  _updateTrail() {
    if (!this.trailLine || !this.trailLine.visible) return;
    this._trailPositions.push(this.position.clone());
    if (this._trailPositions.length > this._trailMax) {
      this._trailPositions.shift();
    }
    const geo = this.trailLine.geometry;
    const buf = geo.attributes.position.array;
    const count = this._trailPositions.length;
    for (let i = 0; i < count; i++) {
      buf[i * 3]     = this._trailPositions[i].x;
      buf[i * 3 + 1] = this._trailPositions[i].y;
      buf[i * 3 + 2] = this._trailPositions[i].z;
    }
    geo.setDrawRange(0, count);
    geo.attributes.position.needsUpdate = true;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  setLabelVisible(v) {
    if (this.label) this.label.element.style.display = v ? '' : 'none';
  }

  setOrbitVisible(v) {
    if (this.orbitLine) this.orbitLine.visible = v;
  }

  setTrailVisible(v) {
    if (this.trailLine) this.trailLine.visible = v;
    if (!v) this._clearTrail();
  }

  _clearTrail() {
    this._trailPositions = [];
    if (this.trailLine) {
      this.trailLine.geometry.setDrawRange(0, 0);
      this.trailLine.geometry.attributes.position.needsUpdate = true;
    }
  }

  /** Snap to a given world position (used during eclipse mode). */
  snapTo(worldPos) {
    this.position.copy(worldPos);
    this.mesh.position.copy(worldPos);
  }

  dispose(scene) {
    if (this.mesh)      { this.mesh.geometry.dispose(); scene.remove(this.mesh); }
    if (this.orbitLine) { this.orbitLine.geometry.dispose(); scene.remove(this.orbitLine); }
    if (this.trailLine) { this.trailLine.geometry.dispose(); scene.remove(this.trailLine); }
    if (this.light)     scene.remove(this.light);
  }
}

// ── BodyManager ───────────────────────────────────────────────────────────────
export class BodyManager {
  constructor(scene) {
    this.scene  = scene;
    /** @type {Map<string, CelestialBody>} */
    this.bodies = new Map();
    this._idCounter = 0;
  }

  add(cfg) {
    const body = new CelestialBody(cfg);
    body.buildMesh(this.scene);

    // Link parent
    if (cfg.parent && this.bodies.has(cfg.parent)) {
      body.parent = this.bodies.get(cfg.parent);
    }

    // Compute initial Keplerian position so physics engine can read it
    if (body.parent) {
      const offset = keplerianOffset(body.orbitRadius, body.angle);
      body.position.copy(body.parent.position).add(offset);
    }

    this.bodies.set(body.id, body);
    return body;
  }

  remove(id) {
    const body = this.bodies.get(id);
    if (!body) return;
    body.dispose(this.scene);
    this.bodies.delete(id);
    // Remove any children that depended on this body
    for (const [cid, child] of this.bodies) {
      if (child.parentId === id) this.remove(cid);
    }
  }

  /** Generate a unique id for a custom body. */
  nextId(prefix = 'custom') {
    return `${prefix}_${++this._idCounter}`;
  }

  /** Return all bodies as array. */
  all() {
    return Array.from(this.bodies.values());
  }

  /** Return bodies used by the N-body engine (needs position/velocity/mass). */
  nBodyStates() {
    return this.all().map(b => ({
      id:       b.id,
      position: b.position,
      velocity: b.velocity,
      mass:     b.mass,
      fixed:    b.fixed,
    }));
  }

  /** Initialise N-body velocities from current Keplerian positions. */
  initNBodyVelocities() {
    const sun = this.bodies.get('sun');
    if (!sun) return;

    for (const body of this.bodies.values()) {
      if (body.id === 'sun') continue;
      // Determine the dominant attractor
      const attractor = body.parent ?? sun;
      body.velocity.copy(
        circularOrbitVelocity(body.position, attractor.position, attractor.mass)
      );
      // If orbiting a planet (moon), add parent's velocity
      if (body.parent && body.parent.id !== 'sun') {
        body.velocity.add(body.parent.velocity);
      }
    }
  }

  /** Bulk-set label/orbit/trail visibility. */
  setAllLabels(v)  { for (const b of this.bodies.values()) b.setLabelVisible(v); }
  setAllOrbits(v)  { for (const b of this.bodies.values()) b.setOrbitVisible(v); }
  setAllTrails(v)  { for (const b of this.bodies.values()) b.setTrailVisible(v); }

  /** Find body whose mesh was hit by a raycaster. */
  findByMesh(mesh) {
    const id = mesh?.userData?.bodyId;
    return id ? (this.bodies.get(id) ?? null) : null;
  }
}
