// ─────────────────────────────────────────────────────────────────────────────
// flycontrols.js – First-person fly camera (WASD + mouse look via pointer lock)
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

/**
 * Provides a fly-around camera mode using pointer lock for mouse look
 * and WASD/Arrow keys for movement.
 */
export class FlyControls {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {HTMLElement} domElement – element to request pointer lock on
   */
  constructor(camera, domElement) {
    this.camera     = camera;
    this.domElement = domElement;
    this.enabled    = false;

    // Movement state
    this._moveForward  = false;
    this._moveBackward = false;
    this._moveLeft     = false;
    this._moveRight    = false;
    this._moveUp       = false;
    this._moveDown     = false;

    // Euler angles for mouse look (yaw/pitch)
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');

    // Speed (scene units per second)
    this.moveSpeed      = 120;
    this.lookSensitivity = 0.002;

    // Bind handlers (keep references for removal)
    this._onKeyDown       = this._handleKeyDown.bind(this);
    this._onKeyUp         = this._handleKeyUp.bind(this);
    this._onMouseMove     = this._handleMouseMove.bind(this);
    this._onPointerLockChange = this._handlePointerLockChange.bind(this);
  }

  /** Activate fly mode – attach listeners and request pointer lock. */
  activate() {
    if (this.enabled) return;
    this.enabled = true;

    // Capture current camera orientation as starting euler
    this._euler.setFromQuaternion(this.camera.quaternion);

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);

    this.domElement.requestPointerLock();
  }

  /** Deactivate fly mode – remove listeners and release pointer lock. */
  deactivate() {
    if (!this.enabled) return;
    this.enabled = false;

    this._moveForward = this._moveBackward = false;
    this._moveLeft = this._moveRight = false;
    this._moveUp = this._moveDown = false;

    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);

    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
  }

  /**
   * Call once per frame with the elapsed seconds.
   * Moves the camera based on current key state.
   */
  update(deltaSeconds) {
    if (!this.enabled) return;

    const speed = this.moveSpeed * deltaSeconds;
    const direction = new THREE.Vector3();

    // Forward/backward along camera's look direction (projected on xz for stability)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    const right = new THREE.Vector3();
    right.crossVectors(forward, this.camera.up).normalize();

    if (this._moveForward)  direction.add(forward);
    if (this._moveBackward) direction.sub(forward);
    if (this._moveRight)    direction.add(right);
    if (this._moveLeft)     direction.sub(right);
    if (this._moveUp)       direction.y += 1;
    if (this._moveDown)     direction.y -= 1;

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed);
      this.camera.position.add(direction);
    }
  }

  // ── Private handlers ──────────────────────────────────────────────────────

  _handleKeyDown(e) {
    if (!this.enabled) return;
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this._moveForward  = true; break;
      case 'KeyS': case 'ArrowDown':  this._moveBackward = true; break;
      case 'KeyA': case 'ArrowLeft':  this._moveLeft     = true; break;
      case 'KeyD': case 'ArrowRight': this._moveRight    = true; break;
      case 'Space':                   this._moveUp       = true; e.preventDefault(); break;
      case 'ShiftLeft': case 'ShiftRight': this._moveDown = true; break;
    }
  }

  _handleKeyUp(e) {
    if (!this.enabled) return;
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this._moveForward  = false; break;
      case 'KeyS': case 'ArrowDown':  this._moveBackward = false; break;
      case 'KeyA': case 'ArrowLeft':  this._moveLeft     = false; break;
      case 'KeyD': case 'ArrowRight': this._moveRight    = false; break;
      case 'Space':                   this._moveUp       = false; break;
      case 'ShiftLeft': case 'ShiftRight': this._moveDown = false; break;
    }
  }

  _handleMouseMove(e) {
    if (!this.enabled) return;
    if (document.pointerLockElement !== this.domElement) return;

    this._euler.setFromQuaternion(this.camera.quaternion);

    this._euler.y -= e.movementX * this.lookSensitivity;
    this._euler.x -= e.movementY * this.lookSensitivity;

    // Clamp pitch to avoid flipping
    this._euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this._euler.x));

    this.camera.quaternion.setFromEuler(this._euler);
  }

  _handlePointerLockChange() {
    // If pointer lock was released externally (e.g. pressing Escape), deactivate
    if (this.enabled && document.pointerLockElement !== this.domElement) {
      this.deactivate();
      // Dispatch a custom event so the UI can sync its toggle state
      this.domElement.dispatchEvent(new CustomEvent('flymode-exit'));
    }
  }
}
