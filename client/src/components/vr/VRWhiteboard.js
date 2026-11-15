import * as THREE from 'three';
import { DEFAULT_SLIDES, THEME_COLORS } from './VRRoomConstants.js';

/**
 * Creates an interactive 3D Whiteboard & Presentation Screen.
 * Renders 1920x1080 high-contrast dynamic slides onto a Three.js canvas texture
 * with crisp typography, multi-line text wrapping, self-illuminating display material,
 * polygonOffset to permanently prevent coplanar Z-fighting/diagonal stripes,
 * and raycast-interactive 3D controls.
 */
export function buildWhiteboard(scene, customSlides = null) {
  const whiteboardGroup = new THREE.Group();
  whiteboardGroup.name = 'WhiteboardGroup';

  const slides = (customSlides && customSlides.length > 0) ? customSlides : DEFAULT_SLIDES;
  let currentSlideIndex = 0;

  // 1. Full HD 1920x1080 Presentation Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  // Text wrapping helper to prevent clipped headings and bullet lines
  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    if (!text) return y;
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        context.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line.trim(), x, currentY);
    return currentY;
  }

  function renderSlide() {
    if (!ctx) return;
    const slide = slides[currentSlideIndex];

    // Background: Clean high-contrast studio white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1920, 1080);

    // Subtle 1px perimeter edge
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 1916, 1076);

    // Top Header Banner (Dark Navy to Teal)
    const headerGrad = ctx.createLinearGradient(0, 0, 1920, 0);
    headerGrad.addColorStop(0, '#0f172a');
    headerGrad.addColorStop(0.7, '#1e293b');
    headerGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, 1920, 150);

    // Category / Badge Pill (dynamic width with padding)
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const badgeText = (slide.badge || 'MENTORSHIP').toUpperCase();
    const badgeMetrics = ctx.measureText(badgeText);
    const badgeWidth = Math.max(220, Math.min(badgeMetrics.width + 56, 600));
    ctx.fillStyle = '#0d9488';
    ctx.beginPath();
    ctx.roundRect(48, 38, badgeWidth, 68, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, 48 + badgeWidth / 2, 82);

    // Slide Counter Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(1620, 42, 248, 62, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Slide ${currentSlideIndex + 1} of ${slides.length}`, 1744, 84);

    // Main Slide Title (with multi-line wrapping if needed)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const titleEndY = wrapText(ctx, slide.title, 56, 240, 1780, 60);

    // Subtitle
    let dividerY = titleEndY + 28;
    if (slide.subtitle) {
      ctx.fillStyle = '#475569';
      ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const subEndY = wrapText(ctx, slide.subtitle, 56, titleEndY + 42, 1780, 36);
      dividerY = subEndY + 24;
    }

    // Teal Divider Line
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(56, dividerY);
    ctx.lineTo(1864, dividerY);
    ctx.stroke();

    // Bullet Points Container Cards
    let startY = dividerY + 54;
    const availableHeight = 940 - startY;
    const cardHeight = Math.min(84, Math.floor(availableHeight / slide.bullets.length) - 16);
    const stepY = cardHeight + 16;

    slide.bullets.forEach((bullet, idx) => {
      // Card row background
      ctx.fillStyle = idx % 2 === 0 ? '#f8fafc' : '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(56, startY - 32, 1808, cardHeight, 10);
      ctx.fill();

      // Card border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Teal bullet dot
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.arc(92, startY + (cardHeight / 2) - 34, 11, 0, Math.PI * 2);
      ctx.fill();

      // Bullet text with wrapping if it exceeds card width
      ctx.fillStyle = '#1e293b';
      ctx.font = '500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      wrapText(ctx, bullet, 126, startY + (cardHeight / 2) - 24, 1700, 36);

      startY += stepY;
    });

    // High-contrast Footer Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 980, 1920, 100);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(slide.footer || 'Mentor Connect — Autonomous WebXR Mentorship Platform', 56, 1042);
  }

  // Initial render
  renderSlide();

  // 2. High-Quality Texture Setup with proper ColorSpace & Mipmapping
  const whiteboardTexture = new THREE.CanvasTexture(canvas);
  whiteboardTexture.colorSpace = THREE.SRGBColorSpace;
  whiteboardTexture.minFilter = THREE.LinearMipmapLinearFilter;
  whiteboardTexture.magFilter = THREE.LinearFilter;
  whiteboardTexture.generateMipmaps = true;

  // 3. Presentation Screen Mesh (3.2m wide x 1.8m tall, exact 16:9 ratio)
  // Configured with polygonOffset and physical Z-offset to eliminate Z-fighting
  const screenMat = new THREE.MeshStandardMaterial({
    map: whiteboardTexture,
    emissive: 0xffffff,
    emissiveMap: whiteboardTexture,
    emissiveIntensity: 0.22,
    roughness: 0.16,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -4.0,
    depthTest: true,
    depthWrite: true,
  });

  const screenGeo = new THREE.PlaneGeometry(3.2, 1.8);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.name = 'WhiteboardScreenMesh';
  screenMesh.position.set(0, 0, 0.035); // 35mm in front of frame
  screenMesh.receiveShadow = false;    // Prevents shadow acne stripes
  screenMesh.castShadow = false;
  whiteboardGroup.add(screenMesh);

  // 4. Architectural Bezel Frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.screenFrame,
    roughness: 0.35,
    metalness: 0.8,
  });

  // Solid back panel separated by 50mm from the screen
  const backPanelGeo = new THREE.BoxGeometry(3.32, 1.92, 0.03);
  const backPanel = new THREE.Mesh(backPanelGeo, frameMat);
  backPanel.position.set(0, 0, -0.015);
  backPanel.castShadow = true;
  whiteboardGroup.add(backPanel);

  // Outer border bars surrounding (not behind) the screen
  const topBorder = new THREE.Mesh(new THREE.BoxGeometry(3.34, 0.06, 0.05), frameMat);
  topBorder.position.set(0, 0.93, 0.02);
  whiteboardGroup.add(topBorder);

  const bottomBorder = new THREE.Mesh(new THREE.BoxGeometry(3.34, 0.06, 0.05), frameMat);
  bottomBorder.position.set(0, -0.93, 0.02);
  whiteboardGroup.add(bottomBorder);

  const leftBorder = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.80, 0.05), frameMat);
  leftBorder.position.set(-1.63, 0, 0.02);
  whiteboardGroup.add(leftBorder);

  const rightBorder = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.80, 0.05), frameMat);
  rightBorder.position.set(1.63, 0, 0.02);
  whiteboardGroup.add(rightBorder);

  // Ambient LED Back-Glow Halo behind the screen (at z = -0.040)
  const haloGeo = new THREE.PlaneGeometry(3.48, 2.08);
  const haloMat = new THREE.MeshBasicMaterial({
    color: THEME_COLORS.tealAccent,
    transparent: true,
    opacity: 0.32,
  });
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.position.set(0, 0, -0.04);
  whiteboardGroup.add(haloMesh);

  // Bottom marker and control shelf
  const shelfGeo = new THREE.BoxGeometry(3.34, 0.06, 0.16);
  const shelfMesh = new THREE.Mesh(shelfGeo, frameMat);
  shelfMesh.position.set(0, -0.98, 0.07);
  whiteboardGroup.add(shelfMesh);

  // 5. Interactive 3D Buttons mounted on shelf
  const buttonMatTeal = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.tealAccent,
    roughness: 0.22,
    metalness: 0.4,
    emissive: 0x0d9488,
    emissiveIntensity: 0.3,
  });
  const buttonMatDark = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.navyMedium,
    roughness: 0.3,
    metalness: 0.3,
  });

  // Prev Button Mesh
  const prevBtnGeo = new THREE.BoxGeometry(0.34, 0.08, 0.05);
  const prevBtnMesh = new THREE.Mesh(prevBtnGeo, buttonMatDark);
  prevBtnMesh.name = 'WhiteboardPrevBtn';
  prevBtnMesh.position.set(0.85, -0.95, 0.09);
  whiteboardGroup.add(prevBtnMesh);

  // Next Button Mesh
  const nextBtnGeo = new THREE.BoxGeometry(0.34, 0.08, 0.05);
  const nextBtnMesh = new THREE.Mesh(nextBtnGeo, buttonMatTeal);
  nextBtnMesh.name = 'WhiteboardNextBtn';
  nextBtnMesh.position.set(1.25, -0.95, 0.09);
  whiteboardGroup.add(nextBtnMesh);

  // Position: Placed prominently at x = -1.55, y = 1.95, z = -2.4
  // Angled gently (12°) toward student seat
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
      // ONLY the explicit 3D buttons trigger slide changes
      if (intersectedObject === nextBtnMesh) {
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
      backPanelGeo.dispose();
      topBorder.geometry.dispose();
      bottomBorder.geometry.dispose();
      leftBorder.geometry.dispose();
      rightBorder.geometry.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      shelfGeo.dispose();
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
