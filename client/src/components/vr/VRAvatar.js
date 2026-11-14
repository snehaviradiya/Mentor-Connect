import * as THREE from 'three';
import { THEME_COLORS } from './VRRoomConstants.js';

/**
 * Creates a stylized, professional 3D mentor avatar representation.
 * Transparently identified as a local 3D representation without faking
 * live audio or pretending real-time synchronization.
 */
export function buildMentorAvatar(scene, mentorData = null) {
  const avatarGroup = new THREE.Group();
  avatarGroup.name = 'MentorAvatar';

  const mentorName = mentorData?.name || 'Prof. Rajesh Sharma';
  const mentorTitle = mentorData?.title || 'Lead Capstone Advisor';
  const mentorCategory = mentorData?.category || 'Software Architecture';

  // 1. Materials
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0ac69,
    roughness: 0.65,
    metalness: 0.05,
  });

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d1f14,
    roughness: 0.85,
    metalness: 0.0,
  });

  const blazerMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.navyDark,
    roughness: 0.7,
    metalness: 0.1,
  });

  const shirtMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.5,
    metalness: 0.0,
  });

  const tieMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.tealAccent,
    roughness: 0.4,
    metalness: 0.2,
  });

  const glassesFrameMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.2,
    metalness: 0.8,
  });

  // 2. Avatar Upper Body (Seated behind table at z = -1.9, y = 0.55)
  // Torso / Blazer
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'TorsoGroup';

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.65, 0.32),
    blazerMaterial
  );
  torso.position.y = 0.82;
  torso.castShadow = true;
  torsoGroup.add(torso);

  // Shirt collar / chest insert
  const shirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.32, 0.04),
    shirtMaterial
  );
  shirt.position.set(0, 0.94, 0.16);
  torsoGroup.add(shirt);

  // Teal Tie
  const tie = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.28, 0.02),
    tieMaterial
  );
  tie.position.set(0, 0.86, 0.18);
  torsoGroup.add(tie);

  // Arms resting forward onto the table
  // Left arm
  const leftShoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.065, 0.38, 12),
    blazerMaterial
  );
  leftShoulder.position.set(-0.35, 0.82, 0.05);
  leftShoulder.rotation.set(0.3, 0, 0.2);
  torsoGroup.add(leftShoulder);

  const leftForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.05, 0.36, 12),
    blazerMaterial
  );
  leftForearm.position.set(-0.3, 0.76, 0.26);
  leftForearm.rotation.set(1.1, -0.2, 0);
  torsoGroup.add(leftForearm);

  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.1),
    skinMaterial
  );
  leftHand.position.set(-0.28, 0.77, 0.44);
  torsoGroup.add(leftHand);

  // Right arm
  const rightShoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.065, 0.38, 12),
    blazerMaterial
  );
  rightShoulder.position.set(0.35, 0.82, 0.05);
  rightShoulder.rotation.set(0.3, 0, -0.2);
  torsoGroup.add(rightShoulder);

  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.05, 0.36, 12),
    blazerMaterial
  );
  rightForearm.position.set(0.3, 0.76, 0.26);
  rightForearm.rotation.set(1.1, 0.2, 0);
  torsoGroup.add(rightForearm);

  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.1),
    skinMaterial
  );
  rightHand.position.set(0.28, 0.77, 0.44);
  torsoGroup.add(rightHand);

  avatarGroup.add(torsoGroup);

  // 3. Head & Face
  const headGroup = new THREE.Group();
  headGroup.name = 'HeadGroup';
  headGroup.position.set(0, 1.28, 0.04);

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 0.14, 12),
    skinMaterial
  );
  neck.position.y = -0.06;
  headGroup.add(neck);

  // Head Base
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.3, 0.25),
    skinMaterial
  );
  head.castShadow = true;
  headGroup.add(head);

  // Stylized Hair
  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.12, 0.27),
    hairMaterial
  );
  hair.position.set(0, 0.14, -0.01);
  headGroup.add(hair);

  // Glasses Frame
  const glassLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.05, 0.02),
    glassesFrameMat
  );
  glassLeft.position.set(-0.06, 0.02, 0.13);
  headGroup.add(glassLeft);

  const glassRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.05, 0.02),
    glassesFrameMat
  );
  glassRight.position.set(0.06, 0.02, 0.13);
  headGroup.add(glassRight);

  const glassBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.015, 0.02),
    glassesFrameMat
  );
  glassBridge.position.set(0, 0.02, 0.13);
  headGroup.add(glassBridge);

  avatarGroup.add(headGroup);

  // 4. Floating Holographic Info Badge above Mentor
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 512;
  badgeCanvas.height = 180;
  const ctx = badgeCanvas.getContext('2d');
  if (ctx) {
    // Semi-transparent rounded background card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 160, 20);
    ctx.fill();

    // Teal border
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Mentor Name
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(mentorName, 256, 56);

    // Mentor Title & Specialization
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#14b8a6';
    ctx.fillText(`${mentorTitle} • ${mentorCategory}`, 256, 92);

    // Honest representation label
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Autonomous 3D Mentor Representation (Local)', 256, 136);
  }

  const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
  const badgeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.56),
    new THREE.MeshBasicMaterial({
      map: badgeTexture,
      transparent: true,
      side: THREE.DoubleSide,
    })
  );
  badgeMesh.position.set(0, 1.95, 0.1);
  avatarGroup.add(badgeMesh);

  // Set avatar position seated behind the table
  avatarGroup.position.set(0, 0, -1.9);

  scene.add(avatarGroup);

  // Animation controller
  return {
    group: avatarGroup,
    badgeTexture,
    update: (elapsedTime) => {
      // Subtle idle breathing sine wave
      const breathe = Math.sin(elapsedTime * 1.8) * 0.012;
      torsoGroup.scale.set(1 + breathe * 0.5, 1 + breathe, 1 + breathe * 0.5);

      // Subtle natural micro head motion
      const headTilt = Math.sin(elapsedTime * 0.9) * 0.025;
      const headNod = Math.cos(elapsedTime * 1.3) * 0.015;
      headGroup.rotation.y = headTilt;
      headGroup.rotation.x = headNod;

      // Gentle badge hover
      badgeMesh.position.y = 1.95 + Math.sin(elapsedTime * 2.0) * 0.02;
    },
    updateMentorData: (newMentor) => {
      if (!newMentor || !ctx) return;
      ctx.clearRect(0, 0, 512, 180);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(10, 10, 492, 160, 20);
      ctx.fill();

      ctx.strokeStyle = '#0d9488';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(newMentor.name || mentorName, 256, 56);

      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#14b8a6';
      ctx.fillText(`${newMentor.title || mentorTitle} • ${newMentor.category || mentorCategory}`, 256, 92);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Autonomous 3D Mentor Representation (Local)', 256, 136);

      badgeTexture.needsUpdate = true;
    },
  };
}
