// ─────────────────────────────────────────────────────────────────────────────
// flycontrols.js – First-person fly camera (WASD + mouse look via pointer lock)
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

/**
 * Provides a fly-around camera mode using pointer lock for mouse look
 * and WASD/Arrow keys for movement.
 * 
 * Touch Support:
 * - Left side of screen: Virtual joystick for movement (Forward/Backward/Left/Right).
 * - Right side of screen: Drag to rotate camera (Yaw/Pitch).
 * - Top-Right Button: Dedicated Up/Down buttons.
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
    this.moveSpeed      = 300; // Increased from 120 for better feel
    this.lookSensitivity = 0.002;

    // Touch la-sensitivity (higher for touch devices)
    this.touchLookSensitivity = 0.01; 

    // Touch state
    this._touchIdMove = null;
    this._touchStartPos = new THREE.Vector2();
    this._touchMoveDir = new THREE.Vector2();
    this._touchIdLook = null;
    this._touchLookStart = new THREE.Vector2();

    // Bind handlers (keep references for removal)
    this._onKeyDown       = this._handleKeyDown.bind(this);
    this._onKeyUp         = this._handleKeyUp.bind(this);
    this._onMouseMove     = this._handleMouseMove.bind(this);
    this._onPointerLockChange = this._handlePointerLockChange.bind(this);
    this._onTouchStart    = this._handleTouchStart.bind(this);
    this._onTouchMove    = this._handleTouchMove.bind(this);
    this._onTouchEnd      = this._handleTouchEnd.bind(this);
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
    
    // Touch listeners
    document.addEventListener('touchstart', this._onTouchStart, { passive: false });
    document.addEventListener('touchmove', this._onTouchMove, { passive: false });
    document.addEventListener('touchend', this._onTouchEnd);

    if (!('ontouchstart' in window)) {
      this.domElement.requestPointerLock();
    }
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
    
    // Remove touch listeners
    document.removeEventListener('touchstart', this._onTouchStart);
    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('touchend', this._onTouchEnd);

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

    // Desktop Inputs
    if (this._moveForward)  direction.add(forward);
    if (this._moveBackward) direction.sub(forward);
    if (this._moveRight)    direction.add(right);
    if (this._moveLeft)     direction.sub(right);
    if (this._moveUp)       direction.y += 1;
    if (this._moveDown)     direction.y -= 1;

    // Touch Virtual Joystick Logic
    if (this._touchIdMove !== null) {
      const dx = this._touchMoveDir.x;
      const dy = this._touchMoveDir.y;
      // X is side-to-side (right), Y is forward-backward (negative Y is forward)
      if (dy < -0.1) direction.add(forward);
      if (dy > 0.1)  direction.sub(forward);
      if (dx > 0.1)  direction.add(right);
      if (dx < -0.1) direction.sub(right);
    }

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
    if (this.enabled && document.pointerLockElement !== this.domElement) {
      this.deactivate();
      this.domElement.dispatchEvent(new CustomEvent('flymode-exit'));
    }
  }

  // ── Touch Handlers ────────────────────────────────────────────────────────

  _handleTouchStart(e) {
    if (!this.enabled) return;
    e.preventDefault();

    for (const touch of e.changedTouches) {
      // Split screen: Left half for movement, Right half for looking
      if (touch.clientX < window.innerWidth / 2) {
        this._touchIdMove = touch.identifier;
        this._touchStartPos.set(touch.clientX, touch.clientY);
      } else {
        this._touchIdLook = touch.identifier;
        this._touchLookStart.set(touch.clientX, touch.clientY);
      }
    }
  }

  _handleTouchMove(e) {
    if (!this.enabled) return;
    e.preventDefault();

    for (const touch of e.changedTouches) {
      if (touch.identifier === this._touchIdMove) {
        // Calculate movement vector relative to start position
        const dx = touch.clientX - this._touchStartPos.x;
        const dy = touch.clientY - this._touchStartPos.y;
        // Normalize relative to a generic joystick radius (e.g. 50px)
        this._touchMoveDir.set(dx / 50, dy / 50);
      } else if (touch.identifier === this._touchIdLook) {
        // Update camera rotation based on touch delta
        // Note: We use a simpler delta calculation here for touch
        const moveX = touch.clientX - this._touchLookStart.x;
        const moveY = touch.clientY - this._touchLookStart.y;
        
        this._euler.setFromQuaternion(this.camera.quaternion);
        this._euler.y -= moveX * this.touchLookSensitivity;
        this._euler.x -= moveY * this.touchLookSensitivity;
        this._euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this._euler.x));
        this.camera.quaternion.setFromEuler(this._euler);
        
        this._touchLookStart.set(touch.clientX, touch.clientY);
      }
    }
  }

  _handleTouchEnd(e) {
    if (!this.enabled) return;

    for (const touch of e.changedTouches) {
      if (touch.identifier === this._touchIdMove) {
        this._touchIdMove = null;
        this._touchMoveDir.set(0, 0);
      } else if (touch.identifier === this._touchIdLook) {
        this._touchIdLook = null;
      }
    }
  }
}
