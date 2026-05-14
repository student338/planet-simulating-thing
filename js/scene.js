// ─────────────────────────────────────────────────────────────────────────────
// scene.js – Three.js scene, camera, renderers, lighting, star-field
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { OrbitControls }   from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer }   from 'three/addons/renderers/CSS2DRenderer.js';

export class SceneManager {
  constructor(canvasEl) {
    // ── Renderer ────────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas:    canvasEl,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    // ── CSS2D overlay renderer (for labels) ──────────────────────────────────
    this.css2dRenderer = new CSS2DRenderer();
    this.css2dRenderer.setSize(window.innerWidth, window.innerHeight);
    Object.assign(this.css2dRenderer.domElement.style, {
      position:      'absolute',
      top:           '0',
      left:          '0',
      pointerEvents: 'none',
      zIndex:        '5',
    });
    document.body.appendChild(this.css2dRenderer.domElement);

    // ── Scene ────────────────────────────────────────────────────────────────
    this.scene = new THREE.Scene();

    // ── Camera ───────────────────────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.5,
      4000
    );
    this.camera.position.set(0, 220, 400);
    this.camera.lookAt(0, 0, 0);

    // ── OrbitControls ────────────────────────────────────────────────────────
    this.controls = new OrbitControls(this.camera, this.css2dRenderer.domElement);
    this.controls.enableDamping  = true;
    this.controls.dampingFactor  = 0.07;
    this.controls.minDistance    = 15;
    this.controls.maxDistance    = 1800;
    this.controls.enablePan      = true;

    // ── Lighting ─────────────────────────────────────────────────────────────
    this.ambientLight = new THREE.AmbientLight(0x222244, 0.55);
    this.scene.add(this.ambientLight);

    // ── Raycaster ────────────────────────────────────────────────────────────
    this.raycaster = new THREE.Raycaster();
    this.pointer   = new THREE.Vector2();

    // ── Star-field ───────────────────────────────────────────────────────────
    this._buildStarfield();

    // ── Resize handler ───────────────────────────────────────────────────────
    window.addEventListener('resize', () => this._onResize());

    // ── Target body for camera follow ────────────────────────────────────────
    this._followTarget = null;
  }

  _buildStarfield() {
    const count = 3500;
    const pos   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 1200 + Math.random() * 600;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.9 });
    this.scene.add(new THREE.Points(geo, mat));
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.css2dRenderer.setSize(w, h);
  }

  follow(body) {
    this._followTarget = body;
  }

  stopFollowing() {
    this._followTarget = null;
  }

  /** Smoothly fly camera to look at a world-space point. */
  flyTo(targetPos, distance = 80, duration = 1500) {
    const startPos    = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const tPos        = targetPos.clone();

    // Destination: above and to the side of the target
    const endPos = tPos.clone().add(new THREE.Vector3(0, distance * 0.6, distance));
    const endLookAt = tPos.clone();

    const startTime = performance.now();
    const animate   = (now) => {
      const t   = Math.min((now - startTime) / duration, 1);
      const ease = easeInOutQuad(t);

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startLookAt, endLookAt, ease);

      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  /** Fly to a side view to show alignment (eclipse). */
  flyToSideView(centerPos, span = 200) {
    this.flyTo(
      centerPos,
      span,
      1200
    );
    // Also adjust controls target
    setTimeout(() => {
      this.controls.target.copy(centerPos);
    }, 1200);
  }

  /** Render one frame. */
  render() {
    // Camera follow
    if (this._followTarget) {
      const tp = this._followTarget.position;
      this.controls.target.lerp(tp, 0.08);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.css2dRenderer.render(this.scene, this.camera);
  }

  /** Pick the first mesh hit at screen coords (px, py). Returns mesh or null. */
  pick(px, py, meshes) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.pointer.x =  (px / w) * 2 - 1;
    this.pointer.y = -(py / h) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(meshes, false);
    return hits.length > 0 ? hits[0].object : null;
  }
}

// ── Easing helper ─────────────────────────────────────────────────────────────
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
