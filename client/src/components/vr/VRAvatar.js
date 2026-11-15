import * as THREE from 'three';
import { THEME_COLORS } from './VRRoomConstants.js';

/**
 * Creates a stylized, luxury architectural 3D mentor avatar representation.
 * Transparently identified as a local 3D representation without faking
 * live audio or pretending real-time synchronization.
 */
export function buildMentorAvatar(scene, mentorData = null) {
  const avatarGroup = new THREE.Group();
  avatarGroup.name = 'MentorAvatar';

  const mentorName = mentorData?.name || 'Prof. Rajesh Sharma';
  const mentorTitle = mentorData?.title || 'Lead Capstone Advisor';
  const mentorCategory = mentorData?.category || 'Software Architecture';
  const mentorRating = mentorData?.rating || 4.9;
  const mentorExp = mentorData?.experience || '12+ Years Exp';

  // 1. Physically Based Materials
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9a574,
    roughness: 0.62,
    metalness: 0.04,
  });

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1712,
    roughness: 0.85,
    metalness: 0.02,
  });

  const blazerMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.navyDark,
    roughness: 0.72,
    metalness: 0.12,
  });

  const blazerLapelMaterial = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.65,
    metalness: 0.16,
  });

  const shirtMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.45,
    metalness: 0.02,
  });

  const tieMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.tealAccent,
    roughness: 0.32,
    metalness: 0.24,
  });

  const slacksMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.75,
    metalness: 0.08,
  });

  const shoesMaterial = new THREE.MeshStandardMaterial({
    color: 0x110d0a,
    roughness: 0.35,
    metalness: 0.3,
  });

  const glassesFrameMat = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.metalTitanium,
    roughness: 0.22,
    metalness: 0.85,
  });

  const glassesLensMat = new THREE.MeshStandardMaterial({
    color: 0xa5f3fc,
    transparent: true,
    opacity: 0.28,
    roughness: 0.05,
    metalness: 0.1,
  });

  const goldPinMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.2,
    metalness: 0.9,
  });

  const titaniumWatchMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.25,
    metalness: 0.85,
  });

  // 2. Seated Lower Body (Matches chair cushion at y = 0.50m)
  const lowerBodyGroup = new THREE.Group();
  lowerBodyGroup.name = 'LowerBodyGroup';

  // Hips
  const hips = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.18, 0.42),
    slacksMaterial
  );
  hips.position.set(0, 0.52, 0);
  lowerBodyGroup.add(hips);

  // Left & Right Thighs (extending forward to table edge)
  const leftThigh = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.16, 0.46),
    slacksMaterial
  );
  leftThigh.position.set(-0.14, 0.51, 0.23);
  lowerBodyGroup.add(leftThigh);

  const rightThigh = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.16, 0.46),
    slacksMaterial
  );
  rightThigh.position.set(0.14, 0.51, 0.23);
  lowerBodyGroup.add(rightThigh);

  // Calves dropping vertically to floor
  const leftCalf = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.44, 0.16),
    slacksMaterial
  );
  leftCalf.position.set(-0.14, 0.24, 0.42);
  lowerBodyGroup.add(leftCalf);

  const rightCalf = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.44, 0.16),
    slacksMaterial
  );
  rightCalf.position.set(0.14, 0.24, 0.42);
  lowerBodyGroup.add(rightCalf);

  // Dress Oxford Shoes
  const leftShoe = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.08, 0.26),
    shoesMaterial
  );
  leftShoe.position.set(-0.14, 0.04, 0.47);
  lowerBodyGroup.add(leftShoe);

  const rightShoe = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.08, 0.26),
    shoesMaterial
  );
  rightShoe.position.set(0.14, 0.04, 0.47);
  lowerBodyGroup.add(rightShoe);

  avatarGroup.add(lowerBodyGroup);

  // 3. Avatar Upper Body (Torso, Tailored Blazer, Arms resting forward on marble desk)
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'TorsoGroup';

  // Main Blazer Torso (Sculpted with V-shape taper)
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.62, 0.3),
    blazerMaterial
  );
  torso.position.y = 0.88;
  torso.castShadow = true;
  torsoGroup.add(torso);

  // Blazer Lapels (Left and Right angled dark fabric trims)
  const leftLapel = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.42, 0.03),
    blazerLapelMaterial
  );
  leftLapel.position.set(-0.11, 0.94, 0.155);
  leftLapel.rotation.z = -0.15;
  torsoGroup.add(leftLapel);

  const rightLapel = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.42, 0.03),
    blazerLapelMaterial
  );
  rightLapel.position.set(0.11, 0.94, 0.155);
  rightLapel.rotation.z = 0.15;
  torsoGroup.add(rightLapel);

  // Pocket Square & Lapel Pin
  const pocketSquare = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.025, 0.02),
    shirtMaterial
  );
  pocketSquare.position.set(-0.17, 0.98, 0.155);
  pocketSquare.rotation.z = 0.1;
  torsoGroup.add(pocketSquare);

  const lapelPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.008, 12),
    goldPinMat
  );
  lapelPin.rotation.x = Math.PI / 2;
  lapelPin.position.set(-0.15, 1.05, 0.165);
  torsoGroup.add(lapelPin);

  // Crisp Shirt Center Insert
  const shirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.40, 0.03),
    shirtMaterial
  );
  shirt.position.set(0, 0.98, 0.145);
  torsoGroup.add(shirt);

  // Shirt Collar Wings
  const leftCollarWing = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.05, 0.04),
    shirtMaterial
  );
  leftCollarWing.position.set(-0.06, 1.15, 0.15);
  leftCollarWing.rotation.z = -0.25;
  torsoGroup.add(leftCollarWing);

  const rightCollarWing = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.05, 0.04),
    shirtMaterial
  );
  rightCollarWing.position.set(0.06, 1.15, 0.15);
  rightCollarWing.rotation.z = 0.25;
  torsoGroup.add(rightCollarWing);

  // Silk Teal Tie Knot & Body
  const tieKnot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.02, 0.05, 8),
    tieMaterial
  );
  tieKnot.position.set(0, 1.14, 0.16);
  torsoGroup.add(tieKnot);

  const tie = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.32, 0.02),
    tieMaterial
  );
  tie.position.set(0, 0.96, 0.165);
  torsoGroup.add(tie);

  // Brushed Titanium Tie Clip
  const tieClip = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.008, 0.01),
    glassesFrameMat
  );
  tieClip.position.set(0, 0.99, 0.178);
  torsoGroup.add(tieClip);

  // Natural Arms resting forward onto the table surface (tabletop y = 0.76)
  // Left Arm (With Luxury Titanium Wristwatch)
  const leftShoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.07, 0.36, 16),
    blazerMaterial
  );
  leftShoulder.position.set(-0.33, 0.88, 0.06);
  leftShoulder.rotation.set(0.35, 0, 0.18);
  torsoGroup.add(leftShoulder);

  const leftForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.055, 0.38, 16),
    blazerMaterial
  );
  leftForearm.position.set(-0.29, 0.77, 0.32);
  leftForearm.rotation.set(1.15, -0.15, 0);
  torsoGroup.add(leftForearm);

  // Left Shirt Cuff
  const leftCuff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.058, 0.04, 16),
    shirtMaterial
  );
  leftCuff.position.set(-0.27, 0.77, 0.47);
  leftCuff.rotation.set(1.15, -0.15, 0);
  torsoGroup.add(leftCuff);

  // Luxury Wristwatch on Left Wrist
  const watchBezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.014, 16),
    titaniumWatchMat
  );
  watchBezel.position.set(-0.265, 0.785, 0.465);
  watchBezel.rotation.x = Math.PI / 2;
  torsoGroup.add(watchBezel);

  // Left Hand (Sculpted with fingers relaxed on marble table)
  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.038, 0.12),
    skinMaterial
  );
  leftHand.position.set(-0.26, 0.77, 0.54);
  torsoGroup.add(leftHand);

  // Right Arm
  const rightShoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.07, 0.36, 16),
    blazerMaterial
  );
  rightShoulder.position.set(0.33, 0.88, 0.06);
  rightShoulder.rotation.set(0.35, 0, -0.18);
  torsoGroup.add(rightShoulder);

  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.055, 0.38, 16),
    blazerMaterial
  );
  rightForearm.position.set(0.29, 0.77, 0.32);
  rightForearm.rotation.set(1.15, 0.15, 0);
  torsoGroup.add(rightForearm);

  // Right Shirt Cuff
  const rightCuff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.058, 0.04, 16),
    shirtMaterial
  );
  rightCuff.position.set(0.27, 0.77, 0.47);
  rightCuff.rotation.set(1.15, 0.15, 0);
  torsoGroup.add(rightCuff);

  // Right Hand (Sculpted resting on table)
  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.038, 0.12),
    skinMaterial
  );
  rightHand.position.set(0.26, 0.77, 0.54);
  torsoGroup.add(rightHand);

  avatarGroup.add(torsoGroup);

  // 4. Anatomically Proportioned Head, Face, Hair & Glasses
  const headGroup = new THREE.Group();
  headGroup.name = 'HeadGroup';
  headGroup.position.set(0, 1.34, 0.05);

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.082, 0.092, 0.16, 16),
    skinMaterial
  );
  neck.position.y = -0.06;
  headGroup.add(neck);

  // Main Head (Rounded, contoured jaw)
  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.10, 0.28, 18),
    skinMaterial
  );
  head.castShadow = true;
  headGroup.add(head);

  // Chin & Jaw definition
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.10, 0.18),
    skinMaterial
  );
  jaw.position.set(0, -0.09, 0.04);
  headGroup.add(jaw);

  // Nose Bridge & Tip
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.034, 0.07, 0.04),
    skinMaterial
  );
  nose.position.set(0, 0.01, 0.135);
  headGroup.add(nose);

  // Left & Right Ears
  const leftEar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.016, 12),
    skinMaterial
  );
  leftEar.position.set(-0.128, 0.02, 0);
  leftEar.rotation.z = Math.PI / 2;
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.016, 12),
    skinMaterial
  );
  rightEar.position.set(0.128, 0.02, 0);
  rightEar.rotation.z = Math.PI / 2;
  headGroup.add(rightEar);

  // Eyes with White Sclera, Dark Iris, and Specular Dots
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeIrisMat = new THREE.MeshBasicMaterial({ color: 0x1e1510 });

  const leftEyeWhite = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.024, 0.01),
    eyeWhiteMat
  );
  leftEyeWhite.position.set(-0.055, 0.04, 0.118);
  headGroup.add(leftEyeWhite);

  const leftIris = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.02, 0.012),
    eyeIrisMat
  );
  leftIris.position.set(-0.055, 0.04, 0.12);
  headGroup.add(leftIris);

  const rightEyeWhite = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.024, 0.01),
    eyeWhiteMat
  );
  rightEyeWhite.position.set(0.055, 0.04, 0.118);
  headGroup.add(rightEyeWhite);

  const rightIris = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.02, 0.012),
    eyeIrisMat
  );
  rightIris.position.set(0.055, 0.04, 0.12);
  headGroup.add(rightIris);

  // Expressive Brows
  const leftBrow = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.012, 0.012),
    hairMaterial
  );
  leftBrow.position.set(-0.055, 0.07, 0.124);
  leftBrow.rotation.z = 0.06;
  headGroup.add(leftBrow);

  const rightBrow = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.012, 0.012),
    hairMaterial
  );
  rightBrow.position.set(0.055, 0.07, 0.124);
  rightBrow.rotation.z = -0.06;
  headGroup.add(rightBrow);

  // Friendly Composed Mouth Line
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.01, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xa86e57, roughness: 0.8 })
  );
  mouth.position.set(0, -0.06, 0.124);
  headGroup.add(mouth);

  // Sculpted Modern Executive Hairstyle
  const hairCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.135, 0.12, 16),
    hairMaterial
  );
  hairCrown.position.set(0, 0.13, -0.01);
  headGroup.add(hairCrown);

  const hairTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.132, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    hairMaterial
  );
  hairTop.position.set(0, 0.15, -0.01);
  headGroup.add(hairTop);

  const hairSwoop = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.06, 0.06),
    hairMaterial
  );
  hairSwoop.position.set(-0.03, 0.13, 0.10);
  hairSwoop.rotation.z = -0.15;
  headGroup.add(hairSwoop);

  // Modern Titanium Spectacles with Glass Lenses
  const glassesGroup = new THREE.Group();
  glassesGroup.position.set(0, 0.038, 0.126);

  // Left Rim & Lens
  const leftRim = new THREE.Mesh(
    new THREE.RingGeometry(0.026, 0.033, 24),
    glassesFrameMat
  );
  leftRim.position.set(-0.056, 0, 0);
  glassesGroup.add(leftRim);

  const leftLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.026, 24),
    glassesLensMat
  );
  leftLens.position.set(-0.056, 0, 0.001);
  glassesGroup.add(leftLens);

  // Right Rim & Lens
  const rightRim = new THREE.Mesh(
    new THREE.RingGeometry(0.026, 0.033, 24),
    glassesFrameMat
  );
  rightRim.position.set(0.056, 0, 0);
  glassesGroup.add(rightRim);

  const rightLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.026, 24),
    glassesLensMat
  );
  rightLens.position.set(0.056, 0, 0.001);
  glassesGroup.add(rightLens);

  // Frame Bridge
  const frameBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.007, 0.006),
    glassesFrameMat
  );
  frameBridge.position.set(0, 0.008, 0);
  glassesGroup.add(frameBridge);

  // Temple Arms extending to ears
  const leftTemple = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.006, 0.13),
    glassesFrameMat
  );
  leftTemple.position.set(-0.088, 0, -0.065);
  glassesGroup.add(leftTemple);

  const rightTemple = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.006, 0.13),
    glassesFrameMat
  );
  rightTemple.position.set(0.088, 0, -0.065);
  glassesGroup.add(rightTemple);

  headGroup.add(glassesGroup);
  avatarGroup.add(headGroup);

  // 5. Floating Glassmorphic Holographic Info Badge (1024x360 high-DPI)
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 1024;
  badgeCanvas.height = 360;
  const ctx = badgeCanvas.getContext('2d');

  function drawBadge(name, title, category, rating, exp) {
    if (!ctx) return;
    ctx.clearRect(0, 0, 1024, 360);

    // Glassmorphic dark card with rounded corners
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 992, 328, 28);
    ctx.fill();

    // Subtle Restrained Cyan-Teal Border
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Top Status Pill (Verified Mentor)
    ctx.fillStyle = 'rgba(13, 148, 136, 0.25)';
    ctx.beginPath();
    ctx.roundRect(48, 38, 220, 40, 20);
    ctx.fill();
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#2dd4bf';
    ctx.textAlign = 'center';
    ctx.fillText('✦ VERIFIED MENTOR', 158, 65);

    // Rating & Experience Pill on Right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(740, 38, 236, 40, 20);
    ctx.fill();

    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText(`★ ${rating}  •  ${exp}`, 858, 65);

    // Mentor Full Name
    ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(name, 48, 148);

    // Mentor Title & Category Subtitle
    ctx.font = '500 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${title}  •  ${category}`, 48, 198);

    // Separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 232);
    ctx.lineTo(976, 232);
    ctx.stroke();

    // Transparent honest representation disclosure
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Autonomous 3D Mentor Representation (Local)', 48, 282);

    ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Interactive 3D mentorship session view — no fabricated audio or sync', 48, 314);
  }

  drawBadge(mentorName, mentorTitle, mentorCategory, mentorRating, mentorExp);

  const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
  badgeTexture.colorSpace = THREE.SRGBColorSpace;
  badgeTexture.minFilter = THREE.LinearMipmapLinearFilter;
  badgeTexture.magFilter = THREE.LinearFilter;
  badgeTexture.generateMipmaps = true;

  const badgeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.68, 0.59),
    new THREE.MeshBasicMaterial({
      map: badgeTexture,
      transparent: true,
      side: THREE.DoubleSide,
    })
  );
  badgeMesh.position.set(0, 2.05, 0.12);
  avatarGroup.add(badgeMesh);

  // Position avatar exactly at the mentor chair (x = 0.95, z = -2.1)
  // facing toward student view camera
  avatarGroup.position.set(0.95, 0, -2.1);
  avatarGroup.rotation.y = -0.18;

  scene.add(avatarGroup);

  // Animation controller
  return {
    group: avatarGroup,
    badgeTexture,
    update: (elapsedTime) => {
      // Subtle rhythmic breathing sine wave
      const breathe = Math.sin(elapsedTime * 1.8) * 0.012;
      torsoGroup.scale.set(1 + breathe * 0.4, 1 + breathe, 1 + breathe * 0.4);

      // Subtle natural micro head motion (gazing between student and board)
      const headTilt = Math.sin(elapsedTime * 0.8) * 0.03 - 0.04;
      const headNod = Math.cos(elapsedTime * 1.2) * 0.015;
      headGroup.rotation.y = headTilt;
      headGroup.rotation.x = headNod;

      // Gentle badge hover
      badgeMesh.position.y = 2.05 + Math.sin(elapsedTime * 2.0) * 0.02;
    },
    updateMentorData: (newMentor) => {
      if (!newMentor) return;
      drawBadge(
        newMentor.name || mentorName,
        newMentor.title || mentorTitle,
        newMentor.category || mentorCategory,
        newMentor.rating || mentorRating,
        newMentor.experience || mentorExp
      );
      badgeTexture.needsUpdate = true;
    },
  };
}
