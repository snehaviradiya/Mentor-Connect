import * as THREE from 'three';
import { ROOM_DIMENSIONS, THEME_COLORS } from './VRRoomConstants.js';

/**
 * Creates and populates the 3D Mentorship Room scene.
 * Transformed into a luxury modern architectural studio with
 * realistic chevron wood parquet, acoustic fluted timber panels,
 * floor-to-ceiling twilight skyline panorama, boat-shaped graphite conference table,
 * ergonomic executive chairs, and cinematic physically-based lighting.
 */
export function buildMentorshipRoom(scene) {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'RoomStructure';

  const { width, height, depth } = ROOM_DIMENSIONS;

  // 1. Procedural High-Resolution Parquet Wood Floor Canvas (1024x1024)
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 1024;
  floorCanvas.height = 1024;
  const fCtx = floorCanvas.getContext('2d');
  if (fCtx) {
    // Rich dark espresso/walnut base
    fCtx.fillStyle = '#1c1917';
    fCtx.fillRect(0, 0, 1024, 1024);

    // Draw realistic parquet wood planks
    const plankW = 128;
    const plankH = 32;
    for (let y = 0; y < 1024; y += plankH) {
      for (let x = 0; x < 1024; x += plankW) {
        const offset = (Math.floor(y / plankH) % 2) * (plankW / 2);
        const px = (x + offset) % 1024;

        // Subtle plank tone variation
        const toneRand = Math.sin(px * 12.9898 + y * 78.233) * 0.5 + 0.5;
        const r = Math.floor(28 + toneRand * 14);
        const g = Math.floor(24 + toneRand * 12);
        const b = Math.floor(22 + toneRand * 10);
        fCtx.fillStyle = `rgb(${r},${g},${b})`;
        fCtx.fillRect(px, y, plankW - 2, plankH - 2);

        // Fine wood grain lines
        fCtx.strokeStyle = 'rgba(0,0,0,0.25)';
        fCtx.lineWidth = 1;
        fCtx.beginPath();
        fCtx.moveTo(px, y + plankH / 2);
        fCtx.lineTo(px + plankW - 2, y + plankH / 2);
        fCtx.stroke();
      }
    }
  }
  const floorTexture = new THREE.CanvasTexture(floorCanvas);
  floorTexture.colorSpace = THREE.SRGBColorSpace;
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(7, 6);

  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.38,
    metalness: 0.08,
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.ceilingWhite,
    roughness: 0.9,
    metalness: 0.02,
  });

  const wallWarmMaterial = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.wallWarm,
    roughness: 0.82,
    metalness: 0.04,
  });

  const wallAcousticDark = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.navyDark,
    roughness: 0.75,
    metalness: 0.12,
  });

  const woodWalnutMat = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.woodWalnut,
    roughness: 0.42,
    metalness: 0.05,
  });

  const metalTitaniumMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.28,
    metalness: 0.85,
  });

  const marbleGraphiteMat = new THREE.MeshStandardMaterial({
    color: THEME_COLORS.marbleGraphite,
    roughness: 0.3,
    metalness: 0.15,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    transmission: 0.9,
    opacity: 0.35,
    transparent: true,
    roughness: 0.08,
    ior: 1.52,
  });

  // 2. Floor Plane
  const floorGeo = new THREE.PlaneGeometry(width, depth);
  const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0;
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // Designer woven wool meeting area rug
  const rugGeo = new THREE.PlaneGeometry(6.6, 5.4);
  const rugMat = new THREE.MeshStandardMaterial({
    color: 0x1e2430,
    roughness: 0.95,
    metalness: 0.02,
  });
  const rugMesh = new THREE.Mesh(rugGeo, rugMat);
  rugMesh.rotation.x = -Math.PI / 2;
  rugMesh.position.set(0, 0.006, -0.6);
  rugMesh.receiveShadow = true;
  roomGroup.add(rugMesh);

  // Teal piping border around rug
  const rugBorderGeo = new THREE.PlaneGeometry(6.72, 5.52);
  const rugBorderMat = new THREE.MeshBasicMaterial({ color: THEME_COLORS.tealAccent });
  const rugBorderMesh = new THREE.Mesh(rugBorderGeo, rugBorderMat);
  rugBorderMesh.rotation.x = -Math.PI / 2;
  rugBorderMesh.position.set(0, 0.004, -0.6);
  roomGroup.add(rugBorderMesh);

  // 3. Ceiling with Architectural Cove Troughs
  const ceilingGeo = new THREE.PlaneGeometry(width, depth);
  const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMaterial);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.y = height;
  roomGroup.add(ceilingMesh);

  // Recessed perimeter ceiling cove with warm indirect LED glow
  const coveLightGeo = new THREE.BoxGeometry(width - 0.8, 0.08, depth - 0.8);
  const coveLightMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
  const coveLight = new THREE.Mesh(coveLightGeo, coveLightMat);
  coveLight.position.set(0, height - 0.04, 0);
  roomGroup.add(coveLight);

  // Recessed circular downlight fixtures with luminous lenses
  [-3, 0, 3].forEach((xPos) => {
    [-3, 0, 3].forEach((zPos) => {
      const downlightBezel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.04, 24),
        metalTitaniumMat
      );
      downlightBezel.position.set(xPos, height - 0.02, zPos);
      roomGroup.add(downlightBezel);

      const downlightLens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.045, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      downlightLens.position.set(xPos, height - 0.025, zPos);
      roomGroup.add(downlightLens);
    });
  });

  // 4. Back Wall (Luxury Feature Wall with Fluted Timber Slats)
  const backWallGeo = new THREE.PlaneGeometry(width, height);
  const backWall = new THREE.Mesh(backWallGeo, wallAcousticDark);
  backWall.position.set(0, height / 2, -depth / 2);
  roomGroup.add(backWall);

  // Vertical American Walnut Fluted Slats
  for (let x = -6.2; x <= 6.2; x += 0.28) {
    if (x < -3.8 || x > 2.6 || Math.abs(x - 0.6) < 0.2) {
      const slatGeo = new THREE.BoxGeometry(0.1, height - 0.4, 0.06);
      const slat = new THREE.Mesh(slatGeo, woodWalnutMat);
      slat.position.set(x, height / 2, -depth / 2 + 0.04);
      slat.castShadow = true;
      roomGroup.add(slat);
    }
  }

  // Floating Brushed Titanium Dimensional Brand Plate
  const brandPlate = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.75, 0.06),
    metalTitaniumMat
  );
  brandPlate.position.set(0.6, 3.4, -depth / 2 + 0.07);
  brandPlate.castShadow = true;
  roomGroup.add(brandPlate);

  // 5. Front Wall (Behind Student)
  const frontWallGeo = new THREE.PlaneGeometry(width, height);
  const frontWall = new THREE.Mesh(frontWallGeo, wallWarmMaterial);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, height / 2, depth / 2);
  roomGroup.add(frontWall);

  // 6. Left Wall (Acoustic Display Wall)
  const leftWallGeo = new THREE.PlaneGeometry(depth, height);
  const leftWall = new THREE.Mesh(leftWallGeo, wallWarmMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-width / 2, height / 2, 0);
  roomGroup.add(leftWall);

  // 7. Right Wall (Floor-to-Ceiling Panoramic Glass Wall)
  const rightWallGeo = new THREE.PlaneGeometry(depth, height);
  const rightWall = new THREE.Mesh(rightWallGeo, wallWarmMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(width / 2, height / 2, 0);
  roomGroup.add(rightWall);

  // Architectural bronze window mullion frame (8m wide x 3.2m tall)
  const windowFrameGeo = new THREE.BoxGeometry(0.1, 3.2, 8.4);
  const windowFrame = new THREE.Mesh(windowFrameGeo, metalTitaniumMat);
  windowFrame.position.set(width / 2 - 0.05, 2.0, 0);
  roomGroup.add(windowFrame);

  // Vertical window mullions
  [-2.8, 0, 2.8].forEach((mz) => {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.16, 0.08), metalTitaniumMat);
    mullion.position.set(width / 2 - 0.05, 2.0, mz);
    roomGroup.add(mullion);
  });

  const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 3.0), glassMaterial);
  windowGlass.rotation.y = -Math.PI / 2;
  windowGlass.position.set(width / 2 - 0.06, 2.0, 0);
  roomGroup.add(windowGlass);

  // High-Resolution Twilight Skyline Panorama Backdrop (2048x1024)
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2048;
  skyCanvas.height = 1024;
  const sCtx = skyCanvas.getContext('2d');
  if (sCtx) {
    // Rich twilight sky gradient
    const skyGrad = sCtx.createLinearGradient(0, 0, 0, 1024);
    skyGrad.addColorStop(0, '#060a12');     // Deep night sky
    skyGrad.addColorStop(0.45, '#0f172a');  // Deep twilight indigo
    skyGrad.addColorStop(0.75, '#1e293b');  // Atmospheric blue
    skyGrad.addColorStop(0.92, '#b45309');  // Warm horizon amber
    skyGrad.addColorStop(1, '#f59e0b');     // Distant horizon glow
    sCtx.fillStyle = skyGrad;
    sCtx.fillRect(0, 0, 2048, 1024);

    // Distant background skyscrapers layer (dim silhouette)
    sCtx.fillStyle = '#080d16';
    for (let x = 0; x < 2048; x += 48) {
      const bHeight = 180 + ((x * 47) % 260);
      const bWidth = 36 + ((x * 19) % 28);
      sCtx.fillRect(x, 1024 - bHeight, bWidth, bHeight);
    }

    // Midground skyscraper layer with illuminated warm windows
    for (let x = 12; x < 2048; x += 64) {
      const bHeight = 220 + ((x * 71) % 320);
      const bWidth = 44 + ((x * 23) % 24);
      sCtx.fillStyle = '#0d1320';
      sCtx.fillRect(x, 1024 - bHeight, bWidth, bHeight);

      // Glowing office windows dots
      sCtx.fillStyle = 'rgba(254, 240, 138, 0.85)';
      for (let wy = 1024 - bHeight + 20; wy < 1000; wy += 18) {
        for (let wx = x + 6; wx < x + bWidth - 6; wx += 10) {
          if ((wx * wy) % 5 !== 0) {
            sCtx.fillRect(wx, wy, 4, 8);
          }
        }
      }

      // Red rooftop aviation beacon
      if (bHeight > 420) {
        sCtx.fillStyle = '#ef4444';
        sCtx.beginPath();
        sCtx.arc(x + bWidth / 2, 1024 - bHeight - 4, 3, 0, Math.PI * 2);
        sCtx.fill();
      }
    }
  }
  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  skyTexture.colorSpace = THREE.SRGBColorSpace;
  const skyBackdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 6.5),
    new THREE.MeshBasicMaterial({ map: skyTexture })
  );
  skyBackdrop.rotation.y = -Math.PI / 2;
  skyBackdrop.position.set(width / 2 + 1.8, 2.4, 0);
  roomGroup.add(skyBackdrop);

  // 8. Boat-shaped Executive Conference Table (Sculptural graphite marble / walnut)
  const tableGroup = new THREE.Group();
  tableGroup.name = 'ConferenceTable';

  // Table Top: 3.6m long x 1.8m wide boat-shaped tabletop
  const tabletopGeo = new THREE.BoxGeometry(3.6, 0.09, 1.75);
  const tabletopMesh = new THREE.Mesh(tabletopGeo, marbleGraphiteMat);
  tabletopMesh.position.set(0, 0.74, -0.6);
  tabletopMesh.castShadow = true;
  tabletopMesh.receiveShadow = true;
  tableGroup.add(tabletopMesh);

  // Sculptural fluted matte black steel pedestals (dual bases)
  [-1.1, 1.1].forEach((px) => {
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.32, 0.69, 32),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.8 })
    );
    pedestal.position.set(px, 0.35, -0.6);
    pedestal.castShadow = true;
    tableGroup.add(pedestal);

    // Brushed titanium floor base ring
    const baseRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.4, 0.03, 32),
      metalTitaniumMat
    );
    baseRing.position.set(px, 0.015, -0.6);
    tableGroup.add(baseRing);
  });

  // Tabletop Props
  // 1) Designer Laptop with illuminated screen
  const laptopGroup = new THREE.Group();
  const laptopBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.012, 0.25),
    metalTitaniumMat
  );
  laptopBase.position.set(-0.55, 0.79, -0.55);
  laptopGroup.add(laptopBase);

  // Illuminated Code Screen
  const laptopScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.24, 0.01),
    new THREE.MeshStandardMaterial({
      color: 0x090d16,
      emissive: 0x0d9488,
      emissiveIntensity: 0.35,
    })
  );
  laptopScreen.position.set(-0.55, 0.90, -0.67);
  laptopScreen.rotation.x = -0.22;
  laptopGroup.add(laptopScreen);
  tableGroup.add(laptopGroup);

  // 2) Executive Leather Desk Blotter & Stylus Pen
  const blotter = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.006, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85 })
  );
  blotter.position.set(0.65, 0.788, -0.5);
  tableGroup.add(blotter);

  const stylus = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.16, 12),
    metalTitaniumMat
  );
  stylus.rotation.z = Math.PI / 2;
  stylus.position.set(0.65, 0.795, -0.36);
  tableGroup.add(stylus);

  // 3) Matte Ceramic Coffee Mug & Glass Tumbler
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.038, 0.095, 20),
    new THREE.MeshStandardMaterial({ color: THEME_COLORS.tealAccent, roughness: 0.35 })
  );
  mug.position.set(0.95, 0.835, -0.75);
  tableGroup.add(mug);

  const glassTumbler = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.03, 0.1, 16),
    glassMaterial
  );
  glassTumbler.position.set(-0.95, 0.835, -0.5);
  tableGroup.add(glassTumbler);

  roomGroup.add(tableGroup);

  // 9. Ergonomic Executive Chairs (Herman Miller / Eames Style)
  const createExecutiveChair = (seatColor, backColor) => {
    const chair = new THREE.Group();
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 });
    const seatMat = new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.65 });
    const backMeshMat = new THREE.MeshStandardMaterial({ color: backColor, roughness: 0.75 });

    // Contoured seat cushion
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.07, 0.54), seatMat);
    seat.position.y = 0.49;
    seat.castShadow = true;
    chair.add(seat);

    // Contoured ergonomic mesh backrest with lumbar curve
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.68, 0.05), backMeshMat);
    back.position.set(0, 0.84, -0.24);
    back.rotation.x = -0.08;
    back.castShadow = true;
    chair.add(back);

    // Chrome spine support
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.62, 12), chromeMat);
    spine.position.set(0, 0.72, -0.27);
    chair.add(spine);

    // Polished aluminum loop armrests
    [-0.28, 0.28].forEach((ax) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.32), chromeMat);
      arm.position.set(ax, 0.64, -0.06);
      chair.add(arm);
    });

    // Hydraulic center column
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.44, 16), chromeMat);
    cylinder.position.y = 0.24;
    chair.add(cylinder);

    // 5-Star castor base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 5), chromeMat);
    base.position.y = 0.04;
    chair.add(base);

    return chair;
  };

  // Student Chair (Front side of table, facing mentor and whiteboard)
  const studentChair = createExecutiveChair(THEME_COLORS.navyMedium, THEME_COLORS.navyDark);
  studentChair.position.set(0, 0, 1.0);
  studentChair.rotation.y = 0;
  roomGroup.add(studentChair);

  // Mentor Chair (Seated behind table)
  const mentorChair = createExecutiveChair(THEME_COLORS.navyDark, 0x090d16);
  mentorChair.position.set(0.95, 0, -2.1);
  mentorChair.rotation.y = Math.PI - 0.15;
  roomGroup.add(mentorChair);

  // 10. Low Scandinavian Credenza along the back wall
  const credenza = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.82, 0.52),
    woodWalnutMat
  );
  credenza.position.set(0.6, 0.41, -depth / 2 + 0.32);
  credenza.castShadow = true;
  roomGroup.add(credenza);

  // Credenza books and crystal Capstone award
  [-1.4, -0.8, 1.2, 1.8].forEach((bx, idx) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.28, 0.2),
      new THREE.MeshStandardMaterial({
        color: idx % 2 === 0 ? THEME_COLORS.tealAccent : THEME_COLORS.amberAccent,
        roughness: 0.5,
      })
    );
    book.position.set(bx + 0.6, 0.96, -depth / 2 + 0.32);
    roomGroup.add(book);
  });

  // Glowing Crystal Capstone Trophy
  const trophy = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.12),
    new THREE.MeshPhysicalMaterial({
      color: 0x5eead4,
      transmission: 0.85,
      roughness: 0.1,
      ior: 1.6,
      emissive: 0x0d9488,
      emissiveIntensity: 0.4,
    })
  );
  trophy.position.set(0.2, 0.98, -depth / 2 + 0.32);
  roomGroup.add(trophy);

  // 11. Sculptural Ceramic Floor Planter with Organic Foliage
  const planterGroup = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.25, 0.65, 24),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 })
  );
  pot.position.y = 0.33;
  pot.castShadow = true;
  planterGroup.add(pot);

  // Realistic curved monstera/ficus leaves
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x166534,
    roughness: 0.45,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  for (let l = 0; l < 9; l++) {
    const leafGeo = new THREE.SphereGeometry(0.24, 8, 8);
    leafGeo.scale(1.2, 0.1, 1.8);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const angle = (l / 9) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.22, 0.72 + (l % 3) * 0.12, Math.sin(angle) * 0.22);
    leaf.rotation.set(Math.sin(angle) * 0.4, angle, Math.cos(angle) * 0.4);
    planterGroup.add(leaf);
  }
  planterGroup.position.set(5.2, 0, -4.6);
  roomGroup.add(planterGroup);

  // 12. Lighting Setup (Cinematic Physically Based Lighting)
  // Warm natural ambient fill light
  const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.75);
  ambientLight.name = 'AmbientLight';
  roomGroup.add(ambientLight);

  // Studio Key Directional Light
  const mainDirLight = new THREE.DirectionalLight(0xfffdf5, 1.25);
  mainDirLight.position.set(3.5, 4.0, 2.5);
  mainDirLight.castShadow = true;
  mainDirLight.shadow.mapSize.width = 2048;
  mainDirLight.shadow.mapSize.height = 2048;
  mainDirLight.shadow.camera.near = 0.5;
  mainDirLight.shadow.camera.far = 16;
  mainDirLight.shadow.bias = -0.0004;
  mainDirLight.name = 'MainDirLight';
  roomGroup.add(mainDirLight);

  // Dedicated High-CRI Presentation Spotlight (Pointing directly at the presentation board!)
  const presSpotlight = new THREE.SpotLight(0xffffff, 1.5, 12, Math.PI / 4, 0.25);
  presSpotlight.position.set(-1.55, height - 0.2, 0.8);
  presSpotlight.target.position.set(-1.55, 1.95, -2.4);
  roomGroup.add(presSpotlight);
  roomGroup.add(presSpotlight.target);

  // Table Accent Spotlight
  const tableSpot = new THREE.SpotLight(0xffeedd, 1.1, 10, Math.PI / 3.5, 0.3);
  tableSpot.position.set(0, height - 0.2, -0.6);
  tableSpot.target = tabletopMesh;
  roomGroup.add(tableSpot);

  // Warm wall wash accent lighting on fluted slats
  const wallWashLight = new THREE.PointLight(0xffedd5, 1.2, 8);
  wallWashLight.position.set(0.6, 2.2, -depth / 2 + 0.8);
  roomGroup.add(wallWashLight);

  // Subtle teal architectural back-glow
  const tealAccentLight = new THREE.PointLight(THEME_COLORS.tealAccent, 1.4, 7);
  tealAccentLight.position.set(-3.0, 1.4, -depth / 2 + 0.6);
  roomGroup.add(tealAccentLight);

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
  ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'emissiveMap'].forEach((key) => {
    if (mat[key] && typeof mat[key].dispose === 'function') {
      mat[key].dispose();
    }
  });
  mat.dispose();
}
