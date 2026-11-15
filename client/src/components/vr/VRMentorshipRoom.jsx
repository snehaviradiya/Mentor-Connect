import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { WebXRManager } from './webxrManager.js';
import { buildMentorshipRoom, disposeHierarchy } from './VRRoomScene.js';
import { buildMentorAvatar } from './VRAvatar.js';
import { buildWhiteboard } from './VRWhiteboard.js';
import { VRNavigationControls } from './VRNavigationControls.js';
import VRDesktopOverlay from './VRDesktopOverlay.jsx';
import { CAMERA_PRESETS, DEFAULT_SLIDES } from './VRRoomConstants.js';
import './VRRoom.css';

/**
 * VRMentorshipRoom
 * 
 * Hardware-accelerated 3D and WebXR immersive mentorship environment.
 * Provides interactive slides, stylized 3D mentor representation,
 * first-person navigation, and genuine WebXR VR headset support.
 */
export default function VRMentorshipRoom({ mentor = null, session = null, onExit }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [activePreset, setActivePreset] = useState('DEFAULT');
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isVRSessionActive, setIsVRSessionActive] = useState(false);
  const [webglError, setWebglError] = useState(false);

  // Prevent underlying website scrollbars and margins while VR room is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // References to active 3D subsystems for interaction & cleanup
  const systemsRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    whiteboard: null,
    avatar: null,
    webxrManager: null,
    clock: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
  });

  // Prepare custom slides based on the active mentor's topics and session details
  const mentorSlides = useMemo(() => {
    if (!mentor && !session) return DEFAULT_SLIDES;

    const mentorName = mentor?.name || session?.mentor?.name || 'Prof. Rajesh Sharma';
    const category = mentor?.category || session?.mentor?.category || session?.sessionTopic || 'Software Engineering';
    const title = mentor?.title || session?.mentor?.title || 'Lead Specialist';

    const firstSlideBullets = session ? [
      `• Topic: ${session.sessionTopic || session.topic || 'Capstone Architecture Review'}`,
      `• Schedule: ${session.date || 'Today'} at ${session.timeSlot || 'Scheduled Slot'}`,
      `• Status: ${session.status || 'CONFIRMED'} • Live Interactive WebXR Room`,
      `• Focus: System architecture, service boundaries & code walkthrough`,
    ] : [
      `• Focus Domain: ${category}`,
      `• Session Agenda: System Design, Architecture, & Career Direction`,
      `• Available for Capstone Guidance, Code Reviews, & Mock Interviews`,
      `• Rate: $${mentor?.hourlyRate || 50}/hr • Rating: ${mentor?.rating || 5.0}★ (${mentor?.reviewCount || 0} reviews)`,
    ];

    return [
      {
        id: 1,
        badge: category.toUpperCase().slice(0, 24),
        title: session ? `Mentorship Session: ${session.sessionTopic || 'Capstone Review'}` : `Mentorship with ${mentorName}`,
        subtitle: `${mentorName} • ${title}`,
        bullets: firstSlideBullets,
        footer: session ? `Session ID: #${session.id?.slice(0, 8) || 'LIVE'} • Mentor Connect Studio` : 'Interactive WebXR Mentorship Room',
      },
      ...DEFAULT_SLIDES.slice(1),
    ];
  }, [mentor, session]);

  // Handlers for slide navigation
  const handlePrevSlide = useCallback(() => {
    const wb = systemsRef.current.whiteboard;
    if (wb) {
      const idx = wb.prevSlide();
      setCurrentSlide(idx);
    } else {
      setCurrentSlide((prev) => (prev - 1 + mentorSlides.length) % mentorSlides.length);
    }
  }, [mentorSlides.length]);

  const handleNextSlide = useCallback(() => {
    const wb = systemsRef.current.whiteboard;
    if (wb) {
      const idx = wb.nextSlide();
      setCurrentSlide(idx);
    } else {
      setCurrentSlide((prev) => (prev + 1) % mentorSlides.length);
    }
  }, [mentorSlides.length]);

  const handleGoToSlide = useCallback((index) => {
    const wb = systemsRef.current.whiteboard;
    if (wb) {
      const idx = wb.goToSlide(index);
      setCurrentSlide(idx);
    } else {
      setCurrentSlide(index);
    }
  }, []);

  const handleSelectPreset = useCallback((presetKey) => {
    const controls = systemsRef.current.controls;
    const preset = CAMERA_PRESETS[presetKey];
    if (controls && preset) {
      controls.applyPreset(preset, true);
      setActivePreset(presetKey);
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    const controls = systemsRef.current.controls;
    if (controls) {
      controls.resetView();
      setActivePreset('DEFAULT');
    }
  }, []);

  // Screen share projection onto 3D whiteboard
  const handleScreenShareStart = useCallback((stream) => {
    const wb = systemsRef.current.whiteboard;
    if (wb) {
      wb.setScreenShareStream(stream);
    }
  }, []);

  const handleScreenShareStop = useCallback(() => {
    const wb = systemsRef.current.whiteboard;
    if (wb) {
      wb.clearScreenShare();
    }
  }, []);

  // WebXR Session Trigger
  const handleEnterVR = useCallback(async () => {
    const mgr = systemsRef.current.webxrManager;
    if (!mgr) return;

    try {
      if (isVRSessionActive) {
        await mgr.exitVRSession();
      } else {
        await mgr.startVRSession((_event, controller) => {
          // Trigger click interaction in VR
          const tempMatrix = new THREE.Matrix4();
          tempMatrix.identity().extractRotation(controller.matrixWorld);

          const raycaster = systemsRef.current.raycaster;
          raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
          raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

          const wb = systemsRef.current.whiteboard;
          if (wb) {
            const intersects = raycaster.intersectObjects([
              wb.prevBtnMesh,
              wb.nextBtnMesh,
            ]);
            if (intersects.length > 0) {
              const newIdx = wb.handleRaycastIntersection(intersects[0].object);
              if (newIdx !== null) setCurrentSlide(newIdx);
            }
          }
        });
      }
    } catch (err) {
      console.warn('[VRMentorshipRoom] WebXR session request failed:', err);
    }
  }, [isVRSessionActive]);

  // Canvas Mouse Click Raycaster for Desktop slide buttons
  const handleCanvasClick = useCallback((event) => {
    const canvas = canvasRef.current;
    const camera = systemsRef.current.camera;
    const wb = systemsRef.current.whiteboard;
    if (!canvas || !camera || !wb) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = systemsRef.current.raycaster;
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const interactiveObjects = [wb.prevBtnMesh, wb.nextBtnMesh];
    const intersects = raycaster.intersectObjects(interactiveObjects, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const newIdx = wb.handleRaycastIntersection(hit);
      if (newIdx !== null) {
        setCurrentSlide(newIdx);
      }
    }
  }, []);

  // Initialize Three.js scene and lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const width = Math.max(container.clientWidth || window.innerWidth || 1280, 320);
    const height = Math.max(container.clientHeight || window.innerHeight || 720, 480);

    // 1. Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.22;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.xr.enabled = true; // Enables WebXR pipeline
    } catch (err) {
      console.warn('[VRMentorshipRoom] WebGL hardware acceleration unavailable:', err);
      setTimeout(() => setWebglError(true), 0);
      return undefined;
    }

    // 2. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 40);
    camera.position.set(...CAMERA_PRESETS.DEFAULT.position);
    camera.lookAt(new THREE.Vector3(...CAMERA_PRESETS.DEFAULT.lookAt));

    // 3. Subsystems
    const clock = new THREE.Clock();
    buildMentorshipRoom(scene);
    const avatar = buildMentorAvatar(scene, mentor);
    const whiteboard = buildWhiteboard(scene, mentorSlides);
    const controls = new VRNavigationControls(camera, canvas);
    const webxrManager = new WebXRManager(renderer, scene, camera);

    // Save references
    systemsRef.current = {
      renderer,
      scene,
      camera,
      controls,
      whiteboard,
      avatar,
      webxrManager,
      clock,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
    };

    // 4. WebXR Capability Check & Listener
    webxrManager.checkSupport().then((supported) => {
      setIsVRSupported(supported);
    });

    const unsubscribeXR = webxrManager.onSessionChange((state) => {
      setIsVRSessionActive(state === 'started');
    });

    // 5. Add WebXR controller visual rays
    const rayMat = new THREE.LineBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.7,
    });
    const rayPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -2.5)];
    const rayGeo = new THREE.BufferGeometry().setFromPoints(rayPoints);

    for (let i = 0; i < 2; i++) {
      const controller = renderer.xr.getController(i);
      const rayLine = new THREE.Line(rayGeo, rayMat);
      rayLine.name = `ControllerRay_${i}`;
      controller.add(rayLine);
      scene.add(controller);
    }

    // 6. Animation Render Loop (works for both Desktop 3D and WebXR 60/90/120Hz frames)
    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      controls.update(delta);
      avatar.update(elapsed);

      renderer.render(scene, camera);
    });

    // 7. Window and container resize handling
    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth || window.innerWidth || 1280, 320);
      const h = Math.max(container.clientHeight || window.innerHeight || 720, 480);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }
    window.addEventListener('resize', handleResize);

    // 8. Keyboard navigation shortcuts
    const handleKeyDown = (e) => {
      if (e.code === 'KeyR') {
        controls.resetView();
        setActivePreset('DEFAULT');
      } else if (e.code === 'Space') {
        const idx = whiteboard.nextSlide();
        setCurrentSlide(idx);
      } else if (e.code === 'Escape' && onExit) {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribeXR();

      renderer.setAnimationLoop(null);
      controls.dispose();
      whiteboard.dispose();
      webxrManager.dispose();
      disposeHierarchy(scene);
      renderer.dispose();
      rayGeo.dispose();
      rayMat.dispose();
    };
  }, [mentor, mentorSlides, onExit]);

  const activeSlide = mentorSlides[currentSlide] || mentorSlides[0];

  return (
    <div
      className="vr-room-wrapper"
      ref={containerRef}
      role="region"
      aria-label="3D Immersive Mentorship Environment"
    >
      <canvas
        ref={canvasRef}
        className="vr-canvas"
        onClick={handleCanvasClick}
        tabIndex={0}
        aria-label="Interactive 3D mentorship canvas. Use WASD or arrows to navigate, left click and drag to look around."
      />

      {webglError && (
        <div className="vr-fallback-display" role="region" aria-label="3D Room Presentation Fallback">
          <div className="vr-fallback-banner">
            <span className="vr-fallback-icon" aria-hidden="true">ℹ️</span>
            <span>WebGL hardware acceleration unavailable in this browser environment. Showing accessible interactive presentation mode.</span>
          </div>
          <div className="vr-fallback-stage">
            <div className="vr-fallback-slide-card">
              <div className="vr-fallback-slide-badge">{activeSlide.badge || 'MENTORSHIP'}</div>
              <h2 className="vr-fallback-slide-title">{activeSlide.title}</h2>
              {activeSlide.subtitle && <p className="vr-fallback-slide-subtitle">{activeSlide.subtitle}</p>}
              <ul className="vr-fallback-slide-bullets">
                {activeSlide.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <div className="vr-fallback-slide-footer">{activeSlide.footer}</div>
            </div>
            <div className="vr-fallback-avatar-card">
              <div className="vr-fallback-avatar-icon">👨‍🏫</div>
              <h3 className="vr-fallback-avatar-name">{mentor?.name || 'Prof. Rajesh Sharma'}</h3>
              <p className="vr-fallback-avatar-title">{mentor?.title || 'Lead Capstone Advisor'}</p>
              <span className="vr-fallback-avatar-badge">Local 3D Simulation</span>
            </div>
          </div>
        </div>
      )}

      <VRDesktopOverlay
        currentSlide={currentSlide}
        totalSlides={mentorSlides.length}
        onPrevSlide={handlePrevSlide}
        onNextSlide={handleNextSlide}
        onGoToSlide={handleGoToSlide}
        onSelectPreset={handleSelectPreset}
        activePreset={activePreset}
        onResetCamera={handleResetCamera}
        onEnterVR={handleEnterVR}
        isVRSupported={isVRSupported}
        isVRSessionActive={isVRSessionActive}
        onExit={onExit}
        mentor={mentor}
        session={session}
        onScreenShareStart={handleScreenShareStart}
        onScreenShareStop={handleScreenShareStop}
      />
    </div>
  );
}
