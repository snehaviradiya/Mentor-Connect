import * as THREE from 'three';
import { DEFAULT_SLIDES, THEME_COLORS } from './VRRoomConstants.js';

/**
 * Creates an interactive 3D Whiteboard & Presentation Screen.
 * Renders high-resolution dynamic presentation slides onto a Three.js canvas texture
 * with interactive 3D buttons for Next / Previous slide navigation.
 */
export function buildWhiteboard(scene, customSlides = null) {
  const whiteboardGroup = new THREE.Group();
  whiteboardGroup.name = 'WhiteboardGroup';

  const slides = (customSlides && customSlides.length > 0) ? customSlides : DEFAULT_SLIDES;
  let currentSlideIndex = 0;

  // 1. Whiteboard Canvas Texture (1024x576 for crisp performance)
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext('2d');

  function renderSlide() {
    if (!ctx) return;
    const slide = slides[currentSlideIndex];

    // Clear background - Crisp modern off-white with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 576);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 576);

    // Outer subtle border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 1020, 572);

    // Top Header Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 88);

    // Category / Badge
    ctx.fillStyle = '#0d9488';
    ctx.beginPath();
    ctx.roundRect(32, 24, 180, 40, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(slide.badge || 'MENTORSHIP', 122, 50);

    // Slide Counter
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Slide ${currentSlideIndex + 1} of ${slides.length}`, 984, 52);

    // Main Slide Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(slide.title, 48, 154);

    // Subtitle
    if (slide.subtitle) {
      ctx.fillStyle = '#475569';
      ctx.font = '20px sans-serif';
      ctx.fillText(slide.subtitle, 48, 192);
    }

    // Divider line
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(48, 214);
    ctx.lineTo(976, 214);
    ctx.stroke();

    // Bullet Points
    ctx.font = '22px sans-serif';
    let startY = 264;
    slide.bullets.forEach((bullet) => {
      // Bullet dot
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.arc(60, startY - 7, 6, 0, Math.PI * 2);
      ctx.fill();

      // Bullet text
      ctx.fillStyle = '#1e293b';
      ctx.fillText(bullet, 82, startY);
      startY += 52;
    });

    // Footer bar
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 516, 1024, 60);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(slide.footer || 'Mentor Connect — Autonomous WebXR Mentorship Platform', 48, 552);

    // On-canvas interactive nav pill reminders
    ctx.fillStyle = '#0d9488';
    ctx.textAlign = 'right';
    ctx.font = '600 16px sans-serif';
    ctx.fillText('Interactive 3D Controls Below Screen ▼', 976, 552);
  }

  // Initial draw
  renderSlide();

  const whiteboardTexture = new THREE.CanvasTexture(canvas);
  whiteboardTexture.minFilter = THREE.LinearFilter;
  whiteboardTexture.magFilter = THREE.LinearFilter;

  // 2. Whiteboard Screen Mesh (3.2m wide x 1.8m tall)
  const screenMat = new THREE.MeshStandardMaterial({
    map: whiteboardTexture,
    roughness: 0.25,
    metalness: 0.05,
  });
  const screenGeo = new THREE.PlaneGeometry(3.2, 1.8);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.name = 'WhiteboardScreenMesh';
  screenMesh.position.set(0, 0, 0.02);
  whiteboardGroup.add(screenMesh);

  // 3. Sleek Dark Frame & Mount
  const frameMat = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.whiteboardFrame,
    roughness: 0.4,
    metalness: 0.6,
  });
  const frameGeo = new THREE.BoxGeometry(3.32, 1.92, 0.06);
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.set(0, 0, -0.01);
  frameMesh.castShadow = true;
  whiteboardGroup.add(frameMesh);

  // Bottom marker & control tray
  const trayGeo = new THREE.BoxGeometry(3.32, 0.08, 0.16);
  const trayMesh = new THREE.Mesh(trayGeo, frameMat);
  trayMesh.position.set(0, -0.96, 0.06);
  whiteboardGroup.add(trayMesh);

  // Markers on tray
  const markerColors = [THEME_COLORS.tealAccent, THEME_COLORS.amberAccent, THEME_COLORS.navyDark];
  markerColors.forEach((color, idx) => {
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.14, 12),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
    );
    marker.rotation.z = Math.PI / 2;
    marker.position.set(-1.0 + idx * 0.18, -0.92, 0.06);
    whiteboardGroup.add(marker);
  });

  // 4. Interactive 3D Clickable Buttons mounted on tray
  const buttonMatTeal = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.tealAccent,
    roughness: 0.3,
    metalness: 0.4,
  });
  const buttonMatDark = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.navyMedium,
    roughness: 0.4,
    metalness: 0.3,
  });

  // Prev Button Mesh
  const prevBtnGeo = new THREE.BoxGeometry(0.32, 0.08, 0.06);
  const prevBtnMesh = new THREE.Mesh(prevBtnGeo, buttonMatDark);
  prevBtnMesh.name = 'WhiteboardPrevBtn';
  prevBtnMesh.position.set(0.65, -0.92, 0.08);
  whiteboardGroup.add(prevBtnMesh);

  // Next Button Mesh
  const nextBtnGeo = new THREE.BoxGeometry(0.32, 0.08, 0.06);
  const nextBtnMesh = new THREE.Mesh(nextBtnGeo, buttonMatTeal);
  nextBtnMesh.name = 'WhiteboardNextBtn';
  nextBtnMesh.position.set(1.15, -0.92, 0.08);
  whiteboardGroup.add(nextBtnMesh);

  // Position the Whiteboard group in the room
  // Angled along the left wall toward the student and mentor table
  whiteboardGroup.position.set(-4.5, 2.0, -1.2);
  whiteboardGroup.rotation.y = Math.PI / 6; // 30 degrees angle toward center table

  scene.add(whiteboardGroup);

  // Controller API
  const controller = {
    group: whiteboardGroup,
    screenMesh,
    prevBtnMesh,
    nextBtnMesh,
    getSlideIndex: () => currentSlideIndex,
    getTotalSlides: () => slides.length,
    nextSlide: () => {
      currentSlideIndex = (currentSlideIndex + 1) % slides.length;
      renderSlide();
      whiteboardTexture.needsUpdate = true;
      return currentSlideIndex;
    },
    prevSlide: () => {
      currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
      renderSlide();
      whiteboardTexture.needsUpdate = true;
      return currentSlideIndex;
    },
    goToSlide: (index) => {
      if (index >= 0 && index < slides.length) {
        currentSlideIndex = index;
        renderSlide();
        whiteboardTexture.needsUpdate = true;
      }
      return currentSlideIndex;
    },
    handleRaycastIntersection: (intersectedObject) => {
      if (!intersectedObject) return null;
      if (intersectedObject === nextBtnMesh || intersectedObject === screenMesh) {
        return controller.nextSlide();
      }
      if (intersectedObject === prevBtnMesh) {
        return controller.prevSlide();
      }
      return null;
    },
    dispose: () => {
      whiteboardTexture.dispose();
      screenMat.dispose();
      screenGeo.dispose();
      frameMat.dispose();
      frameGeo.dispose();
      prevBtnGeo.dispose();
      nextBtnGeo.dispose();
      buttonMatTeal.dispose();
      buttonMatDark.dispose();
      if (whiteboardGroup.parent) {
        whiteboardGroup.parent.remove(whiteboardGroup);
      }
    },
  };

  return controller;
}
