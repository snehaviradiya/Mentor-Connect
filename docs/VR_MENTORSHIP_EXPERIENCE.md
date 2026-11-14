# Mentor Connect — Browser-Based 3D & WebXR Mentorship Experience

## Overview

Mentor Connect now includes a complete hardware-accelerated 3D and WebXR immersive mentorship environment. This platform feature allows students and mentors to meet in a virtual 3D room directly within their web browser, transition seamlessly into genuine 6DoF immersive VR when a WebXR-compatible headset is connected, or interact comfortably via Desktop 3D mode on standard laptops, tablets, and phones.

---

## Architectural Principles & Boundaries

1. **Clean Code-Splitting & Lazy Loading**
   - The 3D/VR engine is decoupled from the main website bundle using `React.lazy()` and `<Suspense>`.
   - The default website payload remains fast and lightweight; Three.js is loaded on demand when the user enters the 3D room.

2. **Zero Fake Synchronization or Invented Audio**
   - The 3D mentor representation is explicitly labeled as a "Visual Avatar Representation (Local)".
   - No fabricated real-time audio or fake speech synthesis is claimed; live communication remains powered by verified meeting services.

3. **Strict Teammate Ownership Protection**
   - No backend routes, controllers, or database schemas were modified.
   - Teammate-owned components (`StudentDashboard.jsx`, `SessionWorkspace.jsx`, `ResourceLibrary.jsx`) remain untouched.

4. **Milestone B/C Design System Adherence**
   - Color scheme: Deep Navy (`#0f172a`, `0x0f172a`), Restrained Teal (`#0d9488`, `0x0d9488`), Warm Neutrals (`#f8fafc`, `0xf1f5f9`), and Warm Amber (`#d97706`).
   - UI HUD matches the typography, borders, and accessible contrast of the main web application.

---

## Component Architecture

```
client/src/components/vr/
├── VRMentorshipRoom.jsx      # Top-level React container, lifecycle & canvas manager
├── VRRoomScene.js            # 3D architectural geometry, lighting, materials, and disposal
├── VRAvatar.js               # Stylized 3D mentor avatar with subtle idle animation and nameplate
├── VRWhiteboard.js           # Dynamic 2D canvas texture screen with interactive 3D buttons
├── VRNavigationControls.js   # First-person WASD/arrow walking, mouse drag look, collision boundaries
├── VRDesktopOverlay.jsx      # Responsive 2D HUD, cheatsheet, slide controls, and preset switcher
├── VRRoomConstants.js        # Room dimensions, boundary limits, camera presets, theme tokens
├── webxrManager.js           # WebXR Device API lifecycle, session negotiation, and controller rays
└── VRRoom.css                # Polished HUD overlay styles and responsive media queries
```

---

## User Interaction & Controls

### Desktop 3D Mode
- **Walk / Move**: `W`, `A`, `S`, `D` or Arrow keys
- **Look Around**: Left-Click + Drag on the 3D canvas
- **Cycle Slides**: Click interactive 3D buttons beneath whiteboard, click screen, or press `Spacebar`
- **Camera Presets**:
  - `Student Seat`: Seated across from mentor at central table
  - `Whiteboard View`: Close-up angle for presentation reading
  - `Mentor Focus`: Direct discussion orientation facing the mentor desk
  - `Room Overview`: Elevated perspective of the full architectural layout
- **Reset View**: Press `R` or click `↺ Reset`
- **Exit Room**: Click `✕ Exit 3D Room` or press `Escape` to return to the standard web directory

### Immersive VR Mode (WebXR Headsets)
- Automatically detected via `navigator.xr.isSessionSupported('immersive-vr')`.
- Clicking **"Enter VR"** requests an `immersive-vr` session with `local-floor` reference space.
- Includes 2.5m translucent controller pointer rays for targeting and selecting whiteboard slides.
- Automatic restoration of desktop mode upon session exit.

---

## Verification & Quality Assurance

- **Vitest Suite**: 105 passed across 16 test files (`npm --prefix client test`).
- **Oxlint**: 0 errors, 0 new warnings (`npm --prefix client run lint`).
- **Production Build**: Passes cleanly in Vite with code-split chunking (`npm --prefix client run build`).
- **Responsive Viewports**: Verified at 320px, 360px, 390px, 430px, 768px, 1024px, 1280px, and 1920px.
