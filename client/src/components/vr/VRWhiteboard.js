import * as THREE from 'three';
import { DEFAULT_SLIDES, THEME_COLORS } from './VRRoomConstants.js';

/**
 * Creates an interactive 3D Whiteboard & Presentation Screen.
 * Renders high-resolution dynamic presentation slides onto a Three.js canvas texture
 * with crisp typography, self-illuminating display material, ambient LED back-glow halo,
 * and interactive 3D buttons for Next / Previous slide navigation.
 */
export function buildWhiteboard(scene, customSlides = null) {
  const whiteboardGroup = new THREE.Group();
  whiteboardGroup.name = 'WhiteboardGroup';

  const slides = (customSlides && customSlides.length > 0) ? customSlides : DEFAULT_SLIDES;
  let currentSlideIndex = 0;

  // 1. Ultra-sharp 2K Presentation Canvas (2048x1152 for crisp retina text & code)
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d');

  function renderSlide() {
    if (!ctx) return;
    const slide = slides[currentSlideIndex];

    // Background: High-contrast luxury executive dark/cream palette
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1152);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2048, 1152);

    // Outer subtle border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 2042, 1146);

    // Top Header Banner
    const headerGrad = ctx.createLinearGradient(0, 0, 2048, 0);
    headerGrad.addColorStop(0, '#0f172a');
    headerGrad.addColorStop(0.7, '#1e293b');
    headerGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, 2048, 168);

    // Category / Badge Pill
    ctx.fillStyle = '#0d9488';
    ctx.beginPath();
    ctx.roundRect(56, 44, 340, 76, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(slide.badge || 'MENTORSHIP', 226, 94);

    // Slide Counter Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(1720, 48, 260, 68, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Slide ${currentSlideIndex + 1} of ${slides.length}`, 1850, 94);

    // Main Slide Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
    ctx.fillText(slide.title, 64, 280);

    // Subtitle
    if (slide.subtitle) {
      ctx.fillStyle = '#475569';
      ctx.font = '36px system-ui, -apple-system, sans-serif';
      ctx.fillText(slide.subtitle, 68, 346);
    }

    // Teal Divider Line
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(64, 384);
    ctx.lineTo(1984, 384);
    ctx.stroke();

    // Bullet Points Cards Container
    let startY = 460;
    slide.bullets.forEach((bullet, idx) => {
      // Card row background for readability
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(241, 245, 249, 0.9)' : 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.roundRect(64, startY - 42, 1920, 84, 12);
      ctx.fill();

      // Card border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Teal bullet pill indicator
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.arc(104, startY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Bullet text
      ctx.fillStyle = '#1e293b';
      ctx.font = '500 38px system-ui, -apple-system, sans-serif';
      ctx.fillText(bullet, 144, startY + 12);

      startY += 114;
    });

    // High-contrast Footer Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 1032, 2048, 120);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '30px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(slide.footer || 'Mentor Connect — Autonomous WebXR Mentorship Platform', 64, 1100);

    // Interactive Navigation Indicator
    ctx.fillStyle = '#14b8a6';
    ctx.textAlign = 'right';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('Interactive 3D Controls Below Screen ▼', 1984, 1100);
  }

  // Initial draw
  renderSlide();

  // 2. High-Quality Texture Setup with proper ColorSpace & Mipmapping
  const whiteboardTexture = new THREE.CanvasTexture(canvas);
  whiteboardTexture.colorSpace = THREE.SRGBColorSpace;
  whiteboardTexture.minFilter = THREE.LinearMipmapLinearFilter;
  whiteboardTexture.magFilter = THREE.LinearFilter;
  whiteboardTexture.generateMipmaps = true;

  // 3. Presentation Screen Mesh (3.3m wide x 1.88m tall, 16:9 ratio)
  // With self-illumination (emissive) so it never appears shadowed or dim!
  const screenMat = new THREE.MeshStandardMaterial({
    map: whiteboardTexture,
    emissive: 0xffffff,
    emissiveMap: whiteboardTexture,
    emissiveIntensity: 0.18,
    roughness: 0.2,
    metalness: 0.05,
  });
  const screenGeo = new THREE.PlaneGeometry(3.3, 1.88);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.name = 'WhiteboardScreenMesh';
  screenMesh.position.set(0, 0, 0.02);
  whiteboardGroup.add(screenMesh);

  // 4. Slim Architectural Bezel & Frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.screenFrame,
    roughness: 0.35,
    metalness: 0.8,
  });
  const frameGeo = new THREE.BoxGeometry(3.38, 1.96, 0.05);
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.set(0, 0, -0.01);
  frameMesh.castShadow = true;
  whiteboardGroup.add(frameMesh);

  // Ambient LED Back-Glow Halo behind the screen
  const haloGeo = new THREE.PlaneGeometry(3.55, 2.12);
  const haloMat = new THREE.MeshBasicMaterial({
    color: THEME_COLORS.tealAccent,
    transparent: true,
    opacity: 0.35,
  });
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.position.set(0, 0, -0.04);
  whiteboardGroup.add(haloMesh);

  // Bottom marker and control tray
  const trayGeo = new THREE.BoxGeometry(3.38, 0.07, 0.14);
  const trayMesh = new THREE.Mesh(trayGeo, frameMat);
  trayMesh.position.set(0, -0.99, 0.05);
  whiteboardGroup.add(trayMesh);

  // 5. Interactive 3D Buttons mounted on tray
  const buttonMatTeal = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.tealAccent,
    roughness: 0.25,
    metalness: 0.4,
    emissive: 0x0d9488,
    emissiveIntensity: 0.25,
  });
  const buttonMatDark = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.navyMedium,
    roughness: 0.3,
    metalness: 0.3,
  });

  // Prev Button Mesh
  const prevBtnGeo = new THREE.BoxGeometry(0.38, 0.09, 0.06);
  const prevBtnMesh = new THREE.Mesh(prevBtnGeo, buttonMatDark);
  prevBtnMesh.name = 'WhiteboardPrevBtn';
  prevBtnMesh.position.set(0.7, -0.94, 0.08);
  whiteboardGroup.add(prevBtnMesh);

  // Next Button Mesh
  const nextBtnGeo = new THREE.BoxGeometry(0.38, 0.09, 0.06);
  const nextBtnMesh = new THREE.Mesh(nextBtnGeo, buttonMatTeal);
  nextBtnMesh.name = 'WhiteboardNextBtn';
  nextBtnMesh.position.set(1.22, -0.94, 0.08);
  whiteboardGroup.add(nextBtnMesh);

  // Position: Placed prominently at x = -1.55, y = 1.95, z = -2.4
  // Angled gently (12°) toward the center table so both board and mentor are in view!
  whiteboardGroup.position.set(-1.55, 1.95, -2.4);
  whiteboardGroup.rotation.y = 0.20;

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
      haloGeo.dispose();
      haloMat.dispose();
      trayGeo.dispose();
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
