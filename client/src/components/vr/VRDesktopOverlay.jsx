import { useState } from 'react';
import { CAMERA_PRESETS } from './VRRoomConstants.js';

/**
 * Desktop & Mobile 2D HUD overlay superimposed over the 3D/VR Canvas.
 * Provides controls guide, slide navigation, camera preset switches,
 * WebXR headset trigger, and exit back to normal website.
 */
export default function VRDesktopOverlay({
  currentSlide = 0,
  totalSlides = 4,
  onPrevSlide,
  onNextSlide,
  onSelectPreset,
  activePreset = 'DEFAULT',
  onResetCamera,
  onEnterVR,
  isVRSupported = false,
  isVRSessionActive = false,
  onExit,
  mentor = null,
}) {
  const [showCheatsheet, setShowCheatsheet] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="vr-overlay-container" aria-label="3D Mentorship Room Overlay">
      {/* 1. Top HUD Bar */}
      <header className="vr-top-hud">
        <div className="vr-hud-brand">
          <div className="vr-pulse-dot" aria-hidden="true" />
          <div className="vr-brand-info">
            <span className="vr-hud-title">3D Mentorship Room</span>
            <span className="vr-hud-subtitle">
              {mentor ? `${mentor.name} • ${mentor.category}` : 'Autonomous Mentorship Workspace'}
            </span>
          </div>
        </div>

        {/* Center: Slide Switcher */}
        <div className="vr-slide-hud-controls" role="group" aria-label="Presentation slide controls">
          <button
            type="button"
            className="vr-hud-btn vr-slide-btn"
            onClick={onPrevSlide}
            aria-label="Previous slide"
            title="Previous presentation slide"
          >
            ‹ Prev
          </button>
          <span className="vr-slide-counter" aria-live="polite">
            Slide {currentSlide + 1} / {totalSlides}
          </span>
          <button
            type="button"
            className="vr-hud-btn vr-slide-btn"
            onClick={onNextSlide}
            aria-label="Next slide"
            title="Next presentation slide"
          >
            Next ›
          </button>
        </div>

        {/* Right: Mode & Exit Actions */}
        <div className="vr-hud-actions">
          {isVRSupported ? (
            <button
              type="button"
              className="vr-hud-btn vr-enter-vr-btn"
              onClick={onEnterVR}
              title="Enter immersive VR with connected headset"
            >
              <span className="vr-btn-icon" aria-hidden="true">🥽</span>
              {isVRSessionActive ? 'VR Active' : 'Enter VR'}
            </button>
          ) : (
            <span
              className="vr-mode-badge"
              title="WebXR headset not detected; standard hardware-accelerated 3D mode active"
            >
              <span className="vr-status-dot" aria-hidden="true" />
              Desktop 3D Mode
            </span>
          )}

          <button
            type="button"
            className="vr-hud-btn vr-fullscreen-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen view'}
            title="Toggle full screen"
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>

          <button
            type="button"
            className="vr-hud-btn vr-exit-btn"
            onClick={onExit}
            aria-label="Exit 3D Room back to website"
            title="Return to standard web directory"
          >
            ✕ Exit 3D Room
          </button>
        </div>
      </header>

      {/* 2. Bottom Controls & Presets */}
      <footer className="vr-bottom-hud">
        {/* Left: Collapsible Cheatsheet */}
        <div className="vr-cheatsheet-wrapper">
          <button
            type="button"
            className="vr-cheatsheet-toggle"
            onClick={() => setShowCheatsheet((s) => !s)}
            aria-expanded={showCheatsheet}
          >
            <span>Navigation Guide</span>
            <span className="vr-toggle-chevron">{showCheatsheet ? '▼' : '▲'}</span>
          </button>

          {showCheatsheet && (
            <div className="vr-cheatsheet-card" role="region" aria-label="Controls Guide">
              <div className="vr-cheat-row">
                <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>Arrows</kbd>
                <span>Walk / Move</span>
              </div>
              <div className="vr-cheat-row">
                <kbd>Left-Click + Drag</kbd>
                <span>Look around</span>
              </div>
              <div className="vr-cheat-row">
                <kbd>Space</kbd> / <kbd>HUD</kbd>
                <span>Slide Next / Prev</span>
              </div>
              <div className="vr-cheat-row">
                <kbd>R</kbd>
                <span>Reset View</span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Camera Preset Switcher */}
        <div className="vr-presets-bar" role="group" aria-label="Camera preset positions">
          {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              className={`vr-preset-pill${activePreset === key ? ' active' : ''}`}
              onClick={() => onSelectPreset(key)}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className="vr-preset-pill vr-reset-pill"
            onClick={onResetCamera}
            title="Reset camera to default student view"
          >
            ↺ Reset
          </button>
        </div>

        {/* Right: Transparent Local Simulation Note */}
        <div className="vr-disclaimer-pill" title="No fabricated live audio or fake synchronization">
          <span>Local Simulation</span>
        </div>
      </footer>
    </div>
  );
}
