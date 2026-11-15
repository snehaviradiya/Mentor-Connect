/**
 * Mentor Connect VR Mentorship Room - Core Constants and Configuration
 * 
 * High-end architectural studio design following Milestone B/C:
 * Deep Navy, Warm Neutral, Restrained Teal, and Rich Walnut.
 */

export const ROOM_DIMENSIONS = {
  width: 14,    // X axis (-7 to +7)
  height: 4.2,  // Y axis (0 to 4.2)
  depth: 12,    // Z axis (-6 to +6)
};

export const BOUNDARY_LIMITS = {
  minX: -6.2,
  maxX: 6.2,
  minZ: -5.2,
  maxZ: 5.2,
  minY: 0.8,
  maxY: 3.5,
};

export const CAMERA_PRESETS = {
  DEFAULT: {
    label: 'Student View',
    position: [0.10, 1.48, 2.2],
    lookAt: [-0.60, 1.55, -2.3],
    description: 'First-person perspective seated at conference table facing presentation board and mentor',
  },
  WHITEBOARD: {
    label: 'Presentation View',
    position: [-1.55, 1.95, 0.45],
    lookAt: [-1.55, 1.95, -2.4],
    description: 'Optimized straight-on view for reading presentation slides and technical diagrams',
  },
  MENTOR_FOCUS: {
    label: 'Mentor View',
    position: [1.25, 1.48, 0.1],
    lookAt: [1.25, 1.42, -2.1],
    description: 'One-on-one direct discussion orientation facing the mentor desk',
  },
  ROOM_OVERVIEW: {
    label: 'Room Overview',
    position: [3.6, 2.8, 3.4],
    lookAt: [-0.6, 1.3, -1.2],
    description: 'Elevated perspective showing the complete architectural studio layout',
  },
};

export const THEME_COLORS = {
  navyDark: 0x0f172a,
  navyMedium: 0x1e293b,
  navyLight: 0x334155,
  tealAccent: 0x0d9488,
  tealHighlight: 0x14b8a6,
  amberAccent: 0xd97706,
  wallWarm: 0xf8fafc,
  wallSlate: 0xe2e8f0,
  woodWalnut: 0x1c1917,
  woodOakDark: 0x272422,
  floorWood: 0x18181b,
  ceilingWhite: 0xf8fafc,
  marbleGraphite: 0x1e2229,
  metalTitanium: 0x64748b,
  metalBronze: 0x475569,
  screenFrame: 0x090d16,
};

export const DEFAULT_SLIDES = [
  {
    id: 1,
    badge: 'SESSION AGENDA',
    title: 'Capstone Architecture & Mentorship Strategy',
    subtitle: 'Mentor Connect Immersive Studio',
    bullets: [
      '1. Reviewing full-stack web and WebXR capabilities',
      '2. Inspecting modular React architecture and service boundaries',
      '3. Responsive accessibility verification across mobile and desktop',
      '4. Interactive technical Q&A and next engineering milestones',
    ],
    footer: 'Use Prev / Next buttons or Spacebar to change slides',
  },
  {
    id: 2,
    badge: 'SYSTEM DESIGN',
    title: 'Client-Server & WebXR Separation of Concerns',
    subtitle: 'Clean boundaries without compromising performance',
    bullets: [
      '• UI Layer: Standard accessible HTML/CSS with Milestone B design tokens',
      '• 3D Layer: Three.js hardware-accelerated canvas with dynamic disposal',
      '• WebXR Layer: Declarative session manager with desktop fallback',
      '• Data Layer: Real-time authorized profile ingestion with zero false sync',
    ],
    footer: 'Engineered for smooth 60fps on modern mobile and desktop browsers',
  },
  {
    id: 3,
    badge: 'CODE STANDARDS',
    title: 'Engineering Best Practices & Testing',
    subtitle: 'Zero runtime exceptions, fully verified releases',
    bullets: [
      '✓ 100% passing automated Vitest suite across 16+ modules',
      '✓ Oxlint zero error conformance with clean code formatting',
      '✓ Native boundary checking preventing camera out-of-bounds clipping',
      '✓ Memory leak prevention via recursive geometry and texture disposal',
    ],
    footer: 'Mentor Connect Engineering Quality Assurance',
  },
  {
    id: 4,
    badge: 'CAPSTONE TARGET',
    title: 'Ready for Immersive Mentorship',
    subtitle: 'Accessible anywhere in standard browsers or WebXR headsets',
    bullets: [
      '• Desktop users: Navigate with WASD / Arrow keys and mouse look',
      '• VR Headset users: Click "Enter VR" for 6DoF stereo tracking',
      '• Instant return: One-click exit back to the standard web directory',
      '• Transparent state: Honest avatar representation with clear labeling',
    ],
    footer: 'Mentor Connect — Autonomous WebXR Mentorship Platform',
  },
];
