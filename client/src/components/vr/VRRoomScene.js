import * as THREE from 'three';
import { ROOM_DIMENSIONS, THEME_COLORS } from './VRRoomConstants.js';

/**
 * Creates and populates the 3D Mentorship Room scene.
 * Adheres to Milestone B/C design tokens: Deep Navy, Warm Neutral, Restrained Teal.
 */
export function buildMentorshipRoom(scene) {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'RoomStructure';

  // 1. Materials
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.floorSlate,
    roughness: 0.65,
    metalness: 0.1,
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.ceilingWhite,
    roughness: 0.9,
    metalness: 0.05,
  });

  const wallWarmMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.wallWarm,
    roughness: 0.85,
    metalness: 0.05,
  });

  const wallAccentNavy = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.navyDark,
    roughness: 0.7,
    metalness: 0.15,
  });

  const woodTableMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.tableWood,
    roughness: 0.45,
    metalness: 0.1,
  });

  const metalAluminum = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.3,
    metalness: 0.8,
  });

  const tealAccentMat = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.tealAccent,
    roughness: 0.4,
    metalness: 0.2,
  });

  const amberAccentMat = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.amberAccent,
    roughness: 0.5,
    metalness: 0.1,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    transmission: 0.85,
    opacity: 0.4,
    transparent: true,
    roughness: 0.1,
    ior: 1.5,
  });

  const { width, height, depth } = ROOM_DIMENSIONS;

  // 2. Floor with sub-grid panel lines
  const floorGeo = new THREE.PlaneGeometry(width, depth, 14, 12);
  const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0;
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // Decorative floor rug under meeting area
  const rugGeo = new THREE.PlaneGeometry(6.4, 5.2);
  const rugMat = new THREE.MeshStandardMaterial({
    color: 0x242a35,
    roughness: 0.95,
    metalness: 0.0,
  });
  const rugMesh = new THREE.Mesh(rugGeo, rugMat);
  rugMesh.rotation.x = -Math.PI / 2;
  rugMesh.position.set(0, 0.005, -0.6);
  rugMesh.receiveShadow = true;
  roomGroup.add(rugMesh);

  // 3. Ceiling
  const ceilingGeo = new THREE.PlaneGeometry(width, depth);
  const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMaterial);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.y = height;
  roomGroup.add(ceilingMesh);

  // Ceiling recessed LED panels
  const ledLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-2.5, 0, 2.5].forEach((xPos) => {
    [-2, 1].forEach((zPos) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.6), ledLightMat);
      panel.position.set(xPos, height - 0.02, zPos);
      roomGroup.add(panel);
    });
  });

  // 4. Back Wall (Navy Feature Wall behind Mentor)
  const backWallGeo = new THREE.PlaneGeometry(width, height);
  const backWall = new THREE.Mesh(backWallGeo, wallAccentNavy);
  backWall.position.set(0, height / 2, -depth / 2);
  roomGroup.add(backWall);

  // Back Wall Acoustic Slat Panels (Stylized architectural wood/teal slats)
  for (let i = -5.5; i <= 5.5; i += 0.45) {
    if (Math.abs(i) > 2.2) {
      const slatGeo = new THREE.BoxGeometry(0.12, 3.2, 0.04);
      const slatMat = i % 0.9 === 0 ? tealAccentMat : woodTableMaterial;
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.set(i, height / 2, -depth / 2 + 0.03);
      roomGroup.add(slat);
    }
  }

  // Mounted Brand Sign on Back Wall
  const signBackingGeo = new THREE.BoxGeometry(3.6, 0.7, 0.05);
  const signBacking = new THREE.Mesh(signBackingGeo, metalAluminum);
  signBacking.position.set(0, 3.2, -depth / 2 + 0.04);
  roomGroup.add(signBacking);

  // 5. Front Wall (behind student)
  const frontWallGeo = new THREE.PlaneGeometry(width, height);
  const frontWall = new THREE.Mesh(frontWallGeo, wallWarmMaterial);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, height / 2, depth / 2);
  roomGroup.add(frontWall);

  // 6. Left Wall (Whiteboard Wall)
  const leftWallGeo = new THREE.PlaneGeometry(depth, height);
  const leftWall = new THREE.Mesh(leftWallGeo, wallWarmMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-width / 2, height / 2, 0);
  roomGroup.add(leftWall);

  // 7. Right Wall (City/Campus Window Wall)
  const rightWallGeo = new THREE.PlaneGeometry(depth, height);
  const rightWall = new THREE.Mesh(rightWallGeo, wallWarmMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(width / 2, height / 2, 0);
  roomGroup.add(rightWall);

  // Window Cutout Glass on Right Wall
  const windowFrameGeo = new THREE.BoxGeometry(0.08, 2.6, 7.2);
  const windowFrame = new THREE.Mesh(windowFrameGeo, metalAluminum);
  windowFrame.position.set(width / 2 - 0.04, 2.1, 0);
  roomGroup.add(windowFrame);

  const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 2.4), glassMaterial);
  windowGlass.rotation.y = -Math.PI / 2;
  windowGlass.position.set(width / 2 - 0.05, 2.1, 0);
  roomGroup.add(windowGlass);

  // Window Backdrop Sky Canvas
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 256;
  const skyCtx = skyCanvas.getContext('2d');
  if (skyCtx) {
    const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 256);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.6, '#1e293b');
    skyGrad.addColorStop(1, '#0d9488');
    skyCtx.fillStyle = skyGrad;
    skyCtx.fillRect(0, 0, 512, 256);

    // Stylized distant architectural silhouettes
    skyCtx.fillStyle = '#090d16';
    for (let x = 0; x < 512; x += 36) {
      const bh = 50 + (x * 37) % 90;
      skyCtx.fillRect(x, 256 - bh, 30, bh);
    }
  }
  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  const skyBackdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 4.5),
    new THREE.MeshBasicMaterial({ map: skyTexture })
  );
  skyBackdrop.rotation.y = -Math.PI / 2;
  skyBackdrop.position.set(width / 2 + 1.2, 2.1, 0);
  roomGroup.add(skyBackdrop);

  // 8. Central Mentorship Table
  const tableGroup = new THREE.Group();
  tableGroup.name = 'ConferenceTable';

  // Table Top
  const tabletopGeo = new THREE.BoxGeometry(3.6, 0.08, 1.8);
  const tabletopMesh = new THREE.Mesh(tabletopGeo, woodTableMaterial);
  tabletopMesh.position.set(0, 0.74, -0.6);
  tabletopMesh.castShadow = true;
  tabletopMesh.receiveShadow = true;
  tableGroup.add(tabletopMesh);

  // Table Legs (Brushed Aluminum)
  const legPositions = [
    [-1.6, 0.36, -1.3],
    [1.6, 0.36, -1.3],
    [-1.6, 0.36, 0.1],
    [1.6, 0.36, 0.1],
  ];
  legPositions.forEach(([x, y, z]) => {
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.72, 16);
    const legMesh = new THREE.Mesh(legGeo, metalAluminum);
    legMesh.position.set(x, y, z);
    legMesh.castShadow = true;
    tableGroup.add(legMesh);
  });

  // Tabletop Laptop
  const laptopBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.015, 0.24),
    metalAluminum
  );
  laptopBase.position.set(-0.6, 0.79, -0.6);
  tableGroup.add(laptopBase);

  const laptopScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.22, 0.01),
    wallAccentNavy
  );
  laptopScreen.position.set(-0.6, 0.89, -0.72);
  laptopScreen.rotation.x = -0.25;
  tableGroup.add(laptopScreen);

  // Tabletop Notepad & Coffee Mug
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.005, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  );
  pad.position.set(0.6, 0.785, -0.5);
  pad.rotation.y = 0.15;
  tableGroup.add(pad);

  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.035, 0.09, 16),
    tealAccentMat
  );
  mug.position.set(0.85, 0.83, -0.7);
  tableGroup.add(mug);

  roomGroup.add(tableGroup);

  // 9. Chairs
  // Helper to build an ergonomic office chair
  const createChair = (colorHex) => {
    const chair = new THREE.Group();
    const fabricMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.8 });

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.52), fabricMat);
    seat.position.y = 0.48;
    chair.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.58, 0.06), fabricMat);
    back.position.set(0, 0.8, -0.23);
    chair.add(back);

    // Stem & Base
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 12), metalAluminum);
    stem.position.y = 0.24;
    chair.add(stem);

    const baseStar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 5), metalAluminum);
    baseStar.position.y = 0.04;
    chair.add(baseStar);

    return chair;
  };

  // Student Chair (facing table from front)
  const studentChair = createChair(THEME_COLORS.navyMedium);
  studentChair.position.set(0, 0, 0.8);
  studentChair.rotation.y = 0;
  roomGroup.add(studentChair);

  // Mentor Chair (facing table from back)
  const mentorChair = createChair(THEME_COLORS.navyDark);
  mentorChair.position.set(0, 0, -2.0);
  mentorChair.rotation.y = Math.PI;
  roomGroup.add(mentorChair);

  // 10. Credenza & Bookshelf along back wall
  const credenza = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.82, 0.55),
    woodTableMaterial
  );
  credenza.position.set(0, 0.41, -depth / 2 + 0.35);
  roomGroup.add(credenza);

  // Books and capstone plaque on credenza
  [-1.2, -0.6, 0.7, 1.3].forEach((bx, idx) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.25, 0.18),
      idx % 2 === 0 ? tealAccentMat : amberAccentMat
    );
    book.position.set(bx, 0.95, -depth / 2 + 0.35);
    roomGroup.add(book);
  });

  // 11. Indoor Potted Plant
  const plantGroup = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.22, 0.55, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  pot.position.y = 0.28;
  plantGroup.add(pot);

  // Plant foliage leaves
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  for (let l = 0; l < 7; l++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.85, 5), leafMat);
    const angle = (l / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.16, 0.7 + (l % 3) * 0.1, Math.sin(angle) * 0.16);
    leaf.rotation.z = Math.cos(angle) * 0.35;
    leaf.rotation.x = Math.sin(angle) * 0.35;
    plantGroup.add(leaf);
  }
  plantGroup.position.set(5.2, 0, -4.8);
  roomGroup.add(plantGroup);

  // 12. Lighting Setup
  // Soft ambient fill
  const ambientLight = new THREE.AmbientLight(0xf8fafc, 0.85);
  ambientLight.name = 'AmbientLight';
  roomGroup.add(ambientLight);

  // Main directional light
  const mainDirLight = new THREE.DirectionalLight(0xfffdf5, 1.1);
  mainDirLight.position.set(3, 3.8, 2);
  mainDirLight.castShadow = true;
  mainDirLight.shadow.mapSize.width = 1024;
  mainDirLight.shadow.mapSize.height = 1024;
  mainDirLight.shadow.camera.near = 0.5;
  mainDirLight.shadow.camera.far = 15;
  mainDirLight.name = 'MainDirLight';
  roomGroup.add(mainDirLight);

  // Spot light focused on table
  const tableSpot = new THREE.SpotLight(0xffffff, 1.2, 10, Math.PI / 4, 0.3);
  tableSpot.position.set(0, height - 0.2, -0.6);
  tableSpot.target = tabletopMesh;
  roomGroup.add(tableSpot);

  // Teal architectural accent wash on back wall
  const backAccentLight = new THREE.PointLight(THEME_COLORS.tealAccent, 1.5, 6);
  backAccentLight.position.set(0, 1.2, -depth / 2 + 0.6);
  roomGroup.add(backAccentLight);

  scene.add(roomGroup);
  return roomGroup;
}

/**
 * Deep recursive cleanup of Three.js objects, geometries, textures, and materials.
 */
export function disposeHierarchy(root) {
  if (!root) return;

  root.traverse((node) => {
    if (node.geometry) {
      node.geometry.dispose();
    }
    if (node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach((mat) => disposeMaterial(mat));
      } else {
        disposeMaterial(node.material);
      }
    }
  });

  if (root.parent) {
    root.parent.remove(root);
  }
}

function disposeMaterial(mat) {
  if (!mat) return;
  ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap'].forEach((key) => {
    if (mat[key] && typeof mat[key].dispose === 'function') {
      mat[key].dispose();
    }
  });
  mat.dispose();
}
