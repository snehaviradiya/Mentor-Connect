import * as THREE from 'three';
import { BOUNDARY_LIMITS, CAMERA_PRESETS } from './VRRoomConstants.js';

/**
 * First-person navigation and orientation controls for desktop and mobile 3D viewing.
 * Features WASD/arrow walking, mouse/touch rotation, room boundary clamping,
 * and smooth camera preset transitions.
 */
export class VRNavigationControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document.body;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.walkSpeed = 2.8; // meters per second

    // Orientation state
    this.isDragging = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.yaw = 0; // horizontal angle
    this.pitch = 0; // vertical angle
    this.sensitivity = 0.0028;

    // Camera preset transition state
    this.isTransitioning = false;
    this.transitionProgress = 1;
    this.transitionStartPos = new THREE.Vector3();
    this.transitionEndPos = new THREE.Vector3();
    this.transitionStartTarget = new THREE.Vector3();
    this.transitionEndTarget = new THREE.Vector3();
    this.currentTarget = new THREE.Vector3(0, 1.45, -2.5);

    // Temp vectors for math without memory allocation
    this._moveDir = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();

    // Bind event handlers
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    this.attachEventListeners();
    this.applyPreset(CAMERA_PRESETS.DEFAULT, false);
  }

  attachEventListeners() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.domElement.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);

    this.domElement.addEventListener('touchstart', this._onTouchStart, { passive: false });
    window.addEventListener('touchmove', this._onTouchMove, { passive: false });
    window.addEventListener('touchend', this._onTouchEnd);
  }

  detachEventListeners() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.domElement.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);

    this.domElement.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchmove', this._onTouchMove);
    window.removeEventListener('touchend', this._onTouchEnd);
  }

  _onKeyDown(e) {
    // Ignore input if user is typing into an input or textarea
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      default:
        break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      default:
        break;
    }
  }

  _onMouseDown(e) {
    if (e.button === 0) { // Left click
      this.isDragging = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    }
  }

  _onMouseMove(e) {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.prevMouseX;
    const deltaY = e.clientY - this.prevMouseY;

    this.prevMouseX = e.clientX;
    this.prevMouseY = e.clientY;

    this.yaw -= deltaX * this.sensitivity;
    this.pitch -= deltaY * this.sensitivity;

    // Clamp vertical pitch to prevent gimbal flipping
    const maxPitch = Math.PI / 2.3;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this._updateCameraRotation();
  }

  _onMouseUp() {
    this.isDragging = false;
  }

  _onTouchStart(e) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.prevMouseX = e.touches[0].clientX;
      this.prevMouseY = e.touches[0].clientY;
    }
  }

  _onTouchMove(e) {
    if (!this.isDragging || e.touches.length !== 1) return;
    e.preventDefault();

    const deltaX = e.touches[0].clientX - this.prevMouseX;
    const deltaY = e.touches[0].clientY - this.prevMouseY;

    this.prevMouseX = e.touches[0].clientX;
    this.prevMouseY = e.touches[0].clientY;

    this.yaw -= deltaX * this.sensitivity * 1.3;
    this.pitch -= deltaY * this.sensitivity * 1.3;

    const maxPitch = Math.PI / 2.3;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this._updateCameraRotation();
  }

  _onTouchEnd() {
    this.isDragging = false;
  }

  _updateCameraRotation() {
    if (this.isTransitioning) return;

    // Spherical coordinates calculation
    const cosPitch = Math.cos(this.pitch);
    const dirX = Math.sin(this.yaw) * cosPitch;
    const dirY = Math.sin(this.pitch);
    const dirZ = -Math.cos(this.yaw) * cosPitch;

    this.currentTarget.set(
      this.camera.position.x + dirX,
      this.camera.position.y + dirY,
      this.camera.position.z + dirZ
    );

    this.camera.lookAt(this.currentTarget);
  }

  /**
   * Apply a predefined camera preset smoothly or instantaneously.
   */
  applyPreset(preset, smooth = true) {
    if (!preset) return;

    const targetPos = new THREE.Vector3(...preset.position);
    const lookAtTarget = new THREE.Vector3(...preset.lookAt);

    if (!smooth) {
      this.camera.position.copy(targetPos);
      this.camera.lookAt(lookAtTarget);
      this.currentTarget.copy(lookAtTarget);

      // Derive yaw and pitch from orientation
      const dir = new THREE.Vector3().subVectors(lookAtTarget, targetPos).normalize();
      this.pitch = Math.asin(dir.y);
      this.yaw = Math.atan2(dir.x, -dir.z);
      this.isTransitioning = false;
      return;
    }

    this.transitionStartPos.copy(this.camera.position);
    this.transitionEndPos.copy(targetPos);
    this.transitionStartTarget.copy(this.currentTarget);
    this.transitionEndTarget.copy(lookAtTarget);
    this.transitionProgress = 0;
    this.isTransitioning = true;
  }

  resetView() {
    this.applyPreset(CAMERA_PRESETS.DEFAULT, true);
  }

  /**
   * Update position and orientation per frame based on delta time.
   */
  update(deltaTime = 0.016) {
    // 1. Handle Preset Transition animation
    if (this.isTransitioning) {
      this.transitionProgress += deltaTime * 2.5;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.isTransitioning = false;
        this.camera.position.copy(this.transitionEndPos);
        this.currentTarget.copy(this.transitionEndTarget);
        this.camera.lookAt(this.currentTarget);

        const dir = new THREE.Vector3().subVectors(this.currentTarget, this.camera.position).normalize();
        this.pitch = Math.asin(dir.y);
        this.yaw = Math.atan2(dir.x, -dir.z);
      } else {
        // Ease out quad
        const t = 1 - Math.pow(1 - this.transitionProgress, 2);
        this.camera.position.lerpVectors(this.transitionStartPos, this.transitionEndPos, t);
        const interpolatedTarget = new THREE.Vector3().lerpVectors(
          this.transitionStartTarget,
          this.transitionEndTarget,
          t
        );
        this.currentTarget.copy(interpolatedTarget);
        this.camera.lookAt(this.currentTarget);
      }
      return;
    }

    // 2. Handle WASD / Arrow Movement
    const hasMovement = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
    if (!hasMovement) return;

    // Compute forward vector projected on horizontal XZ plane
    this.camera.getWorldDirection(this._forward);
    this._forward.y = 0;
    this._forward.normalize();

    // Compute right vector
    this._right.crossVectors(this._forward, this.camera.up).normalize();

    this._moveDir.set(0, 0, 0);
    if (this.moveForward) this._moveDir.add(this._forward);
    if (this.moveBackward) this._moveDir.sub(this._forward);
    if (this.moveRight) this._moveDir.add(this._right);
    if (this.moveLeft) this._moveDir.sub(this._right);

    if (this._moveDir.lengthSq() > 0) {
      this._moveDir.normalize();
      const distance = this.walkSpeed * deltaTime;
      this.camera.position.addScaledVector(this._moveDir, distance);

      // 3. Enforce room boundary collision limits
      this.camera.position.x = Math.max(
        BOUNDARY_LIMITS.minX,
        Math.min(BOUNDARY_LIMITS.maxX, this.camera.position.x)
      );
      this.camera.position.z = Math.max(
        BOUNDARY_LIMITS.minZ,
        Math.min(BOUNDARY_LIMITS.maxZ, this.camera.position.z)
      );
      this.camera.position.y = Math.max(
        BOUNDARY_LIMITS.minY,
        Math.min(BOUNDARY_LIMITS.maxY, this.camera.position.y)
      );

      this._updateCameraRotation();
    }
  }

  dispose() {
    this.detachEventListeners();
  }
}
