/**
 * WebXR Session and Device Capabilities Manager
 * 
 * Provides robust WebXR lifecycle management, hardware capability detection,
 * session negotiation with 'immersive-vr', reference space initialization,
 * and clean fallback when VR hardware is unavailable.
 */

export class WebXRManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.xrSession = null;
    this.referenceSpace = null;
    this.isSupported = false;
    this.controllers = [];
    this.controllerGrips = [];
    this.onSessionChangeCallbacks = new Set();
  }

  /**
   * Check if WebXR Device API is exposed in the browser environment.
   */
  static isWebXRAvailable() {
    return typeof navigator !== 'undefined' && 'xr' in navigator && Boolean(navigator.xr);
  }

  /**
   * Check whether an 'immersive-vr' session can be launched on this device.
   */
  async checkSupport() {
    if (!WebXRManager.isWebXRAvailable()) {
      this.isSupported = false;
      return false;
    }

    try {
      this.isSupported = await navigator.xr.isSessionSupported('immersive-vr');
      return this.isSupported;
    } catch (err) {
      console.warn('[WebXRManager] Error checking immersive-vr support:', err);
      this.isSupported = false;
      return false;
    }
  }

  /**
   * Register a listener for session state changes (start / end / error).
   */
  onSessionChange(callback) {
    this.onSessionChangeCallbacks.add(callback);
    return () => this.onSessionChangeCallbacks.delete(callback);
  }

  _notifySessionChange(state, payload = {}) {
    this.onSessionChangeCallbacks.forEach((cb) => {
      try {
        cb(state, payload);
      } catch (err) {
        console.error('[WebXRManager] Callback error:', err);
      }
    });
  }

  /**
   * Request and initialize an immersive VR session.
   */
  async startVRSession(onSelectCallback = null) {
    if (!this.renderer) {
      throw new Error('Renderer not initialized in WebXRManager.');
    }

    if (!WebXRManager.isWebXRAvailable()) {
      throw new Error('WebXR is not supported by this browser environment.');
    }

    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      });

      this.xrSession = session;
      this.renderer.xr.enabled = true;
      await this.renderer.xr.setSession(session);

      // Handle session end
      const handleSessionEnd = () => {
        this.xrSession = null;
        this.referenceSpace = null;
        this.renderer.xr.enabled = false;
        this._notifySessionChange('ended');
      };
      session.addEventListener('end', handleSessionEnd, { once: true });

      // Setup controllers if not already configured
      this.setupControllers(onSelectCallback);

      this._notifySessionChange('started', { session });
      return session;
    } catch (err) {
      console.warn('[WebXRManager] Failed to launch immersive-vr session:', err);
      this._notifySessionChange('error', { error: err });
      throw err;
    }
  }

  /**
   * Exit the active VR session cleanly.
   */
  async exitVRSession() {
    if (this.xrSession) {
      try {
        await this.xrSession.end();
      } catch (err) {
        console.warn('[WebXRManager] Error ending VR session:', err);
      } finally {
        this.xrSession = null;
        this.referenceSpace = null;
      }
    }
  }

  /**
   * Configure VR controller rays and interaction grips.
   */
  setupControllers(onSelectCallback) {
    if (!this.renderer || !this.scene) return;

    // Disconnect old controllers if any
    this.controllers.forEach((c) => {
      if (c.parent) c.parent.remove(c);
    });
    this.controllers = [];

    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);

      if (onSelectCallback) {
        controller.addEventListener('select', (e) => {
          onSelectCallback(e, controller);
        });
      }

      this.scene.add(controller);
      this.controllers.push(controller);
    }
  }

  /**
   * Clean up all listeners and resources.
   */
  dispose() {
    this.exitVRSession();
    this.onSessionChangeCallbacks.clear();
    this.controllers.forEach((c) => {
      if (c.parent) c.parent.remove(c);
    });
    this.controllers = [];
  }
}
