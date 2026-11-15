import * as THREE from 'three';
import { THEME_COLORS } from './VRRoomConstants.js';

/**
 * Creates an anatomically proportioned, luxury styled 3D mentor avatar.
 * Rebuilt with organic head contours, seamless deltoid shoulder joints,
 * articulated arms resting naturally on the conference desk, realistic spectacles,
 * and a stereoscopic WebXR-compatible 3D nameplate directly above the head.
 *
 * Transparently disclosed as an autonomous local 3D representation.
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
    color: 0xd69a68,
    roughness: 0.58,
    metalness: 0.03,
  });

  const lipsMaterial = new THREE.MeshStandardMaterial({
    color: 0xba765a,
    roughness: 0.65,
    metalness: 0.02,
  });

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a130f,
    roughness: 0.82,
    metalness: 0.02,
  });

  const blazerMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.navyDark,
    roughness: 0.74,
    metalness: 0.10,
  });

  const blazerLapelMaterial = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.68,
    metalness: 0.14,
  });

  const shirtMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.42,
    metalness: 0.02,
  });

  const tieMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.tealAccent,
    roughness: 0.30,
    metalness: 0.22,
  });

  const slacksMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.75,
    metalness: 0.08,
  });

  const shoesMaterial = new THREE.MeshStandardMaterial({
    color: 0x110d0a,
    roughness: 0.32,
    metalness: 0.28,
  });

  const glassesFrameMat = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.metalTitanium,
    roughness: 0.20,
    metalness: 0.88,
  });

  const glassesLensMat = new THREE.MeshStandardMaterial({
    color: 0xa5f3fc,
    transparent: true,
    opacity: 0.25,
    roughness: 0.04,
    metalness: 0.08,
  });

  const goldPinMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.22,
    metalness: 0.92,
  });

  const watchMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.25,
    metalness: 0.85,
  });

  // 2. Seated Lower Body (Matches chair cushion at y = 0.50m)
  const lowerBodyGroup = new THREE.Group();
  lowerBodyGroup.name = 'LowerBodyGroup';

  // Hips
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.42), slacksMaterial);
  hips.position.set(0, 0.52, 0);
  lowerBodyGroup.add(hips);

  // Left & Right Thighs (extending forward to table edge)
  const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.48), slacksMaterial);
  leftThigh.position.set(-0.14, 0.51, 0.24);
  lowerBodyGroup.add(leftThigh);

  const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.48), slacksMaterial);
  rightThigh.position.set(0.14, 0.51, 0.24);
  lowerBodyGroup.add(rightThigh);

  // Calves dropping vertically to floor
  const leftCalf = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.15), slacksMaterial);
  leftCalf.position.set(-0.14, 0.24, 0.44);
  lowerBodyGroup.add(leftCalf);

  const rightCalf = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.15), slacksMaterial);
  rightCalf.position.set(0.14, 0.24, 0.44);
  lowerBodyGroup.add(rightCalf);

  // Dress Oxford Shoes
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.26), shoesMaterial);
  leftShoe.position.set(-0.14, 0.04, 0.48);
  lowerBodyGroup.add(leftShoe);

  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.26), shoesMaterial);
  rightShoe.position.set(0.14, 0.04, 0.48);
  lowerBodyGroup.add(rightShoe);

  avatarGroup.add(lowerBodyGroup);

  // 3. Avatar Upper Body & Seamlessly Connected Arms
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'TorsoGroup';

  // Main Blazer Torso (Curved ergonomic V-taper)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.60, 0.28), blazerMaterial);
  torso.position.y = 0.88;
  torso.castShadow = true;
  torsoGroup.add(torso);

  // Blazer Lapels (Left and Right dark trim)
  const leftLapel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.40, 0.025), blazerLapelMaterial);
  leftLapel.position.set(-0.11, 0.94, 0.145);
  leftLapel.rotation.z = -0.15;
  torsoGroup.add(leftLapel);

  const rightLapel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.40, 0.025), blazerLapelMaterial);
  rightLapel.position.set(0.11, 0.94, 0.145);
  rightLapel.rotation.z = 0.15;
  torsoGroup.add(rightLapel);

  // Pocket Square & Gold Lapel Pin
  const pocketSquare = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.015), shirtMaterial);
  pocketSquare.position.set(-0.16, 0.98, 0.145);
  pocketSquare.rotation.z = 0.1;
  torsoGroup.add(pocketSquare);

  const lapelPin = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.008, 12), goldPinMat);
  lapelPin.rotation.x = Math.PI / 2;
  lapelPin.position.set(-0.14, 1.05, 0.152);
  torsoGroup.add(lapelPin);

  // Crisp Shirt Center Insert
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.02), shirtMaterial);
  shirt.position.set(0, 0.98, 0.138);
  torsoGroup.add(shirt);

  // Shirt Collar Wings
  const leftCollarWing = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.045, 0.03), shirtMaterial);
  leftCollarWing.position.set(-0.055, 1.14, 0.14);
  leftCollarWing.rotation.z = -0.22;
  torsoGroup.add(leftCollarWing);

  const rightCollarWing = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.045, 0.03), shirtMaterial);
  rightCollarWing.position.set(0.055, 1.14, 0.14);
  rightCollarWing.rotation.z = 0.22;
  torsoGroup.add(rightCollarWing);

  // Silk Teal Tie Knot & Body
  const tieKnot = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.018, 0.045, 12), tieMaterial);
  tieKnot.position.set(0, 1.13, 0.15);
  torsoGroup.add(tieKnot);

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.30, 0.015), tieMaterial);
  tie.position.set(0, 0.96, 0.152);
  torsoGroup.add(tie);

  // Brushed Titanium Tie Clip
  const tieClip = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.007, 0.01), glassesFrameMat);
  tieClip.position.set(0, 0.99, 0.162);
  torsoGroup.add(tieClip);

  // Seamless Deltoid Shoulder Joints connecting torso directly to arms
  const leftDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), blazerMaterial);
  leftDeltoid.position.set(-0.29, 1.05, 0.02);
  torsoGroup.add(leftDeltoid);

  const rightDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), blazerMaterial);
  rightDeltoid.position.set(0.29, 1.05, 0.02);
  torsoGroup.add(rightDeltoid);

  // Left Arm (Seamlessly connected to deltoid at y = 1.05)
  const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.060, 0.30, 16), blazerMaterial);
  leftUpperArm.position.set(-0.31, 0.90, 0.05);
  leftUpperArm.rotation.set(0.32, 0, 0.15);
  torsoGroup.add(leftUpperArm);

  const leftElbow = new THREE.Mesh(new THREE.SphereGeometry(0.060, 14, 14), blazerMaterial);
  leftElbow.position.set(-0.30, 0.77, 0.16);
  torsoGroup.add(leftElbow);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.050, 0.34, 16), blazerMaterial);
  leftForearm.position.set(-0.28, 0.76, 0.32);
  leftForearm.rotation.set(1.22, -0.12, 0);
  torsoGroup.add(leftForearm);

  // Left Shirt Cuff & Luxury Wristwatch
  const leftCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.035, 16), shirtMaterial);
  leftCuff.position.set(-0.26, 0.77, 0.46);
  leftCuff.rotation.set(1.22, -0.12, 0);
  torsoGroup.add(leftCuff);

  const watchBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 16), watchMat);
  watchBezel.position.set(-0.255, 0.785, 0.46);
  watchBezel.rotation.x = Math.PI / 2;
  torsoGroup.add(watchBezel);

  // Left Hand resting on desk
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.034, 0.11), skinMaterial);
  leftHand.position.set(-0.25, 0.77, 0.53);
  torsoGroup.add(leftHand);

  // Right Arm (Seamlessly connected to deltoid)
  const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.060, 0.30, 16), blazerMaterial);
  rightUpperArm.position.set(0.31, 0.90, 0.05);
  rightUpperArm.rotation.set(0.32, 0, -0.15);
  torsoGroup.add(rightUpperArm);

  const rightElbow = new THREE.Mesh(new THREE.SphereGeometry(0.060, 14, 14), blazerMaterial);
  rightElbow.position.set(0.30, 0.77, 0.16);
  torsoGroup.add(rightElbow);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.050, 0.34, 16), blazerMaterial);
  rightForearm.position.set(0.28, 0.76, 0.32);
  rightForearm.rotation.set(1.22, 0.12, 0);
  torsoGroup.add(rightForearm);

  const rightCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.035, 16), shirtMaterial);
  rightCuff.position.set(0.26, 0.77, 0.46);
  rightCuff.rotation.set(1.22, 0.12, 0);
  torsoGroup.add(rightCuff);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.034, 0.11), skinMaterial);
  rightHand.position.set(0.25, 0.77, 0.53);
  torsoGroup.add(rightHand);

  avatarGroup.add(torsoGroup);

  // 4. Anatomically Sculpted Head & Organic Face Features
  const headGroup = new THREE.Group();
  headGroup.name = 'HeadGroup';
  headGroup.position.set(0, 1.34, 0.04);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.086, 0.16, 20), skinMaterial);
  neck.position.y = -0.06;
  headGroup.add(neck);

  // Organic Cranium (Smooth Sphere slightly oval)
  const craniumGeo = new THREE.SphereGeometry(0.122, 24, 20);
  craniumGeo.scale(1.0, 1.14, 1.02);
  const cranium = new THREE.Mesh(craniumGeo, skinMaterial);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Tapered Jaw and Chin
  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), skinMaterial);
  chin.position.set(0, -0.10, 0.05);
  headGroup.add(chin);

  // Sculpted Wedge Nose (smooth bridge and nostrils)
  const noseGroup = new THREE.Group();
  noseGroup.position.set(0, 0.015, 0.122);

  const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.016, 0.065, 8), skinMaterial);
  noseBridge.rotation.x = 0.22;
  noseGroup.add(noseBridge);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), skinMaterial);
  noseTip.position.set(0, -0.024, 0.015);
  noseGroup.add(noseTip);
  headGroup.add(noseGroup);

  // Inset Eyes (Realistic Sclera Spheres with Dark Iris)
  const eyeScleraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const eyeIrisMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  // Left Eye
  const leftEyeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), eyeScleraMat);
  leftEyeSphere.position.set(-0.048, 0.038, 0.104);
  headGroup.add(leftEyeSphere);

  const leftIris = new THREE.Mesh(new THREE.CircleGeometry(0.010, 16), eyeIrisMat);
  leftIris.position.set(-0.048, 0.038, 0.122);
  headGroup.add(leftIris);

  const leftPupil = new THREE.Mesh(new THREE.CircleGeometry(0.005, 12), eyePupilMat);
  leftPupil.position.set(-0.048, 0.038, 0.123);
  headGroup.add(leftPupil);

  // Right Eye
  const rightEyeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), eyeScleraMat);
  rightEyeSphere.position.set(0.048, 0.038, 0.104);
  headGroup.add(rightEyeSphere);

  const rightIris = new THREE.Mesh(new THREE.CircleGeometry(0.010, 16), eyeIrisMat);
  rightIris.position.set(0.048, 0.038, 0.122);
  headGroup.add(rightIris);

  const rightPupil = new THREE.Mesh(new THREE.CircleGeometry(0.005, 12), eyePupilMat);
  rightPupil.position.set(0.048, 0.038, 0.123);
  headGroup.add(rightPupil);

  // Natural Eyebrows
  const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.010, 0.010), hairMaterial);
  leftBrow.position.set(-0.048, 0.065, 0.114);
  leftBrow.rotation.z = 0.05;
  headGroup.add(leftBrow);

  const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.010, 0.010), hairMaterial);
  rightBrow.position.set(0.048, 0.065, 0.114);
  rightBrow.rotation.z = -0.05;
  headGroup.add(rightBrow);

  // Gentle Composed Friendly Mouth
  const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.054, 8), lipsMaterial);
  mouth.position.set(0, -0.052, 0.112);
  mouth.rotation.z = Math.PI / 2;
  mouth.scale.set(0.4, 1.0, 0.3);
  headGroup.add(mouth);

  // Anatomical Ears
  const leftEar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.014, 12), skinMaterial);
  leftEar.position.set(-0.122, 0.025, 0);
  leftEar.rotation.z = Math.PI / 2;
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.014, 12), skinMaterial);
  rightEar.position.set(0.122, 0.025, 0);
  rightEar.rotation.z = Math.PI / 2;
  headGroup.add(rightEar);

  // Stylized Executive Hairstyle
  const hairGroup = new THREE.Group();
  const hairTopGeo = new THREE.SphereGeometry(0.128, 20, 16);
  hairTopGeo.scale(1.0, 1.12, 1.04);
  const hairTop = new THREE.Mesh(hairTopGeo, hairMaterial);
  hairTop.position.set(0, 0.02, -0.01);
  hairGroup.add(hairTop);

  const hairPart = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.05), hairMaterial);
  hairPart.position.set(-0.02, 0.13, 0.09);
  hairPart.rotation.z = -0.12;
  hairGroup.add(hairPart);
  headGroup.add(hairGroup);

  // Modern Titanium Spectacles (Torus wireframes with Glass Lenses)
  const glassesGroup = new THREE.Group();
  glassesGroup.position.set(0, 0.038, 0.122);

  const leftRim = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0028, 8, 24), glassesFrameMat);
  leftRim.position.set(-0.048, 0, 0);
  glassesGroup.add(leftRim);

  const leftLens = new THREE.Mesh(new THREE.CircleGeometry(0.023, 24), glassesLensMat);
  leftLens.position.set(-0.048, 0, 0.001);
  glassesGroup.add(leftLens);

  const rightRim = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0028, 8, 24), glassesFrameMat);
  rightRim.position.set(0.048, 0, 0);
  glassesGroup.add(rightRim);

  const rightLens = new THREE.Mesh(new THREE.CircleGeometry(0.023, 24), glassesLensMat);
  rightLens.position.set(0.048, 0, 0.001);
  glassesGroup.add(rightLens);

  const frameBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.026, 8), glassesFrameMat);
  frameBridge.rotation.z = Math.PI / 2;
  glassesGroup.add(frameBridge);

  // Temple arms extending cleanly to ears
  const leftTemple = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.13), glassesFrameMat);
  leftTemple.position.set(-0.075, 0, -0.065);
  glassesGroup.add(leftTemple);

  const rightTemple = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.13), glassesFrameMat);
  rightTemple.position.set(0.075, 0, -0.065);
  glassesGroup.add(rightTemple);

  headGroup.add(glassesGroup);
  avatarGroup.add(headGroup);

  // 5. Sleek 3D Holographic Nameplate (1024x320)
  // Positioned directly above the head at y = 2.02, width = 1.25m, height = 0.39m
  // Never intersects with the presentation screen!
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 1024;
  badgeCanvas.height = 320;
  const ctx = badgeCanvas.getContext('2d');

  function drawBadge(name, title, category, rating, exp) {
    if (!ctx) return;
    ctx.clearRect(0, 0, 1024, 320);

    // Translucent rounded card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(14, 14, 996, 292, 24);
    ctx.fill();

    // Restrained Cyan-Teal Border
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Top Status Pill (Verified Mentor)
    ctx.fillStyle = 'rgba(13, 148, 136, 0.25)';
    ctx.beginPath();
    ctx.roundRect(40, 32, 210, 38, 19);
    ctx.fill();
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#2dd4bf';
    ctx.textAlign = 'center';
    ctx.fillText('✦ VERIFIED MENTOR', 145, 57);

    // Rating & Exp Pill on Right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(750, 32, 234, 38, 19);
    ctx.fill();

    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText(`★ ${rating}  •  ${exp}`, 867, 57);

    // Mentor Full Name
    ctx.font = 'bold 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(name, 40, 132);

    // Mentor Title & Category Subtitle
    ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${title}  •  ${category}`, 40, 178);

    // Separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 208);
    ctx.lineTo(984, 208);
    ctx.stroke();

    // Transparent honest representation disclosure
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Autonomous 3D Mentor Representation (Local)', 40, 250);

    ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Interactive 3D mentorship session view — no fabricated audio or sync', 40, 280);
  }

  drawBadge(mentorName, mentorTitle, mentorCategory, mentorRating, mentorExp);

  const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
  badgeTexture.colorSpace = THREE.SRGBColorSpace;
  badgeTexture.minFilter = THREE.LinearMipmapLinearFilter;
  badgeTexture.magFilter = THREE.LinearFilter;
  badgeTexture.generateMipmaps = true;

  const badgeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 0.39),
    new THREE.MeshBasicMaterial({
      map: badgeTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false, // Prevents transparent sorting artifacts in WebXR
    })
  );
  badgeMesh.position.set(0, 2.02, 0.10);
  avatarGroup.add(badgeMesh);

  // Position avatar seated at the mentor desk chair: x = 1.25, z = -2.1
  // Placed with 1.2m clear corridor from whiteboard at x = -1.55
  avatarGroup.position.set(1.25, 0, -2.1);
  avatarGroup.rotation.y = -0.22; // Gently facing toward student seat

  scene.add(avatarGroup);

  // Animation controller
  return {
    group: avatarGroup,
    badgeTexture,
    update: (elapsedTime) => {
      // Subtle rhythmic breathing sine wave
      const breathe = Math.sin(elapsedTime * 1.8) * 0.012;
      torsoGroup.scale.set(1 + breathe * 0.35, 1 + breathe, 1 + breathe * 0.35);

      // Subtle natural conversational head motion
      const headTilt = Math.sin(elapsedTime * 0.8) * 0.025 - 0.03;
      const headNod = Math.cos(elapsedTime * 1.2) * 0.012;
      headGroup.rotation.y = headTilt;
      headGroup.rotation.x = headNod;

      // Gentle badge hover
      badgeMesh.position.y = 2.02 + Math.sin(elapsedTime * 2.0) * 0.015;
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
