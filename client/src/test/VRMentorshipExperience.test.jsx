import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import * as THREE from 'three';
import { WebXRManager } from '../components/vr/webxrManager.js';
import { CAMERA_PRESETS, BOUNDARY_LIMITS, DEFAULT_SLIDES } from '../components/vr/VRRoomConstants.js';
import VRDesktopOverlay from '../components/vr/VRDesktopOverlay.jsx';
import { buildWhiteboard } from '../components/vr/VRWhiteboard.js';
import MentorProfile from '../components/MentorProfile.jsx';
import Navbar from '../components/Navbar.jsx';

describe('WebXRManager capability detection', () => {
  it('correctly reports WebXR availability when navigator.xr is absent', () => {
    expect(WebXRManager.isWebXRAvailable()).toBe(false);
  });

  it('safely handles checkSupport returning false when WebXR is not supported', async () => {
    const manager = new WebXRManager(null, null, null);
    const supported = await manager.checkSupport();
    expect(supported).toBe(false);
  });

  it('rejects startVRSession when renderer is not initialized', async () => {
    const manager = new WebXRManager(null, null, null);
    await expect(manager.startVRSession()).rejects.toThrow('Renderer not initialized');
  });

  it('manages session change subscriptions and unsubscribes cleanly', () => {
    const manager = new WebXRManager(null, null, null);
    const cb = vi.fn();
    const unsubscribe = manager.onSessionChange(cb);

    manager._notifySessionChange('started', { session: {} });
    expect(cb).toHaveBeenCalledWith('started', { session: {} });

    unsubscribe();
    manager._notifySessionChange('ended');
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('VRRoomConstants specifications', () => {
  it('defines valid boundary limits preventing camera clipping', () => {
    expect(BOUNDARY_LIMITS.minX).toBeLessThan(BOUNDARY_LIMITS.maxX);
    expect(BOUNDARY_LIMITS.minZ).toBeLessThan(BOUNDARY_LIMITS.maxZ);
    expect(BOUNDARY_LIMITS.minY).toBeGreaterThan(0);
  });

  it('includes all necessary camera presets with 3D coordinates', () => {
    ['DEFAULT', 'WHITEBOARD', 'MENTOR_FOCUS', 'ROOM_OVERVIEW'].forEach((key) => {
      expect(CAMERA_PRESETS[key]).toBeDefined();
      expect(CAMERA_PRESETS[key].position).toHaveLength(3);
      expect(CAMERA_PRESETS[key].lookAt).toHaveLength(3);
      expect(CAMERA_PRESETS[key].label).toBeTruthy();
    });
  });

  it('defines default presentation slides with technical agendas', () => {
    expect(DEFAULT_SLIDES.length).toBeGreaterThanOrEqual(4);
    DEFAULT_SLIDES.forEach((slide) => {
      expect(slide.title).toBeTruthy();
      expect(slide.bullets.length).toBeGreaterThan(0);
    });
  });
});

describe('VRDesktopOverlay HUD component', () => {
  const defaultProps = {
    currentSlide: 0,
    totalSlides: 4,
    onPrevSlide: vi.fn(),
    onNextSlide: vi.fn(),
    onSelectPreset: vi.fn(),
    activePreset: 'DEFAULT',
    onResetCamera: vi.fn(),
    onEnterVR: vi.fn(),
    isVRSupported: false,
    isVRSessionActive: false,
    onExit: vi.fn(),
    mentor: {
      name: 'Dr. Sarah Chen',
      title: 'Principal Distributed Systems Architect',
      category: 'Cloud Architecture',
    },
  };

  it('renders top HUD brand, title, and mentor context', () => {
    render(<VRDesktopOverlay {...defaultProps} />);

    expect(screen.getByText('3D Mentorship Room')).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Sarah Chen/i)).toBeInTheDocument();
  });

  it('shows Desktop 3D Mode status badge when WebXR is unsupported', () => {
    render(<VRDesktopOverlay {...defaultProps} isVRSupported={false} />);

    expect(screen.getByText('Desktop 3D Mode')).toBeInTheDocument();
    expect(screen.queryByText('Enter VR')).not.toBeInTheDocument();
  });

  it('shows Enter VR button when WebXR headset support is detected', () => {
    render(<VRDesktopOverlay {...defaultProps} isVRSupported={true} />);

    const enterVRBtn = screen.getByRole('button', { name: /Enter VR/i });
    expect(enterVRBtn).toBeInTheDocument();

    fireEvent.click(enterVRBtn);
    expect(defaultProps.onEnterVR).toHaveBeenCalled();
  });

  it('navigates slides when Prev and Next buttons are clicked', () => {
    render(<VRDesktopOverlay {...defaultProps} currentSlide={1} totalSlides={4} />);

    expect(screen.getByText('Slide 2 / 4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(defaultProps.onPrevSlide).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(defaultProps.onNextSlide).toHaveBeenCalled();
  });

  it('triggers camera preset selection and reset view', () => {
    render(<VRDesktopOverlay {...defaultProps} />);

    const whiteboardPresetBtn = screen.getByRole('button', { name: /Presentation View|Whiteboard View/i });
    fireEvent.click(whiteboardPresetBtn);
    expect(defaultProps.onSelectPreset).toHaveBeenCalledWith('WHITEBOARD');

    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);
    expect(defaultProps.onResetCamera).toHaveBeenCalled();
  });

  it('triggers onExit callback when Exit 3D Room button is clicked', () => {
    render(<VRDesktopOverlay {...defaultProps} />);

    const exitBtn = screen.getByRole('button', { name: 'Exit 3D Room back to website' });
    fireEvent.click(exitBtn);
    expect(defaultProps.onExit).toHaveBeenCalled();
  });

  it('renders transparent local simulation disclaimer badge', () => {
    render(<VRDesktopOverlay {...defaultProps} />);
    expect(screen.getByText('Local Simulation')).toBeInTheDocument();
  });

  it('navigates directly to specific slides via jump pills', () => {
    const handleGoToSlide = vi.fn();
    render(<VRDesktopOverlay {...defaultProps} onGoToSlide={handleGoToSlide} />);

    const pill3 = screen.getByRole('button', { name: 'Jump to slide 3' });
    expect(pill3).toBeInTheDocument();
    fireEvent.click(pill3);
    expect(handleGoToSlide).toHaveBeenCalledWith(2);
  });

  it('toggles real-time communication controls for mic, camera, screen share, and raise hand', async () => {
    render(<VRDesktopOverlay {...defaultProps} />);

    // Mic
    const micBtn = screen.getByRole('button', { name: /microphone/i });
    expect(micBtn).toBeInTheDocument();
    fireEvent.click(micBtn);

    // Camera
    const camBtn = screen.getByRole('button', { name: /video|camera/i });
    expect(camBtn).toBeInTheDocument();
    fireEvent.click(camBtn);

    // Screen Share
    const shareBtn = screen.getByRole('button', { name: /share screen/i });
    expect(shareBtn).toBeInTheDocument();
    fireEvent.click(shareBtn);

    // Raise hand
    const handBtn = screen.getByRole('button', { name: /raise hand/i });
    expect(handBtn).toBeInTheDocument();
    fireEvent.click(handBtn);

    expect(screen.getByText(/Hand Raised \(Local View\)/i)).toBeInTheDocument();
  });

  it('opens glassmorphic side drawer for live chat and agenda notes', () => {
    render(<VRDesktopOverlay {...defaultProps} />);

    const chatToggle = screen.getByRole('button', { name: /toggle session chat and notes/i });
    fireEvent.click(chatToggle);

    // Side panel open with chat
    expect(screen.getByRole('complementary', { name: /Live Session Chat and Agenda Notes/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type a question or message/i)).toBeInTheDocument();

    // Type and send chat message
    const input = screen.getByPlaceholderText(/Type a question or message/i);
    fireEvent.change(input, { target: { value: 'Can you explain the Three.js WebXR pipeline?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByText('Can you explain the Three.js WebXR pipeline?')).toBeInTheDocument();

    // Switch to Agenda & Notes tab
    const notesTab = screen.getByRole('tab', { name: /Agenda & Notes/i });
    fireEvent.click(notesTab);

    expect(screen.getByText(/Session Agenda Checklist/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Record architecture notes/i)).toBeInTheDocument();

    // Type notes and verify persistence
    const notesArea = screen.getByPlaceholderText(/Record architecture notes/i);
    fireEvent.change(notesArea, { target: { value: 'Remember to verify 60fps budget.' } });
    expect(notesArea.value).toBe('Remember to verify 60fps budget.');
  });

  it('displays session details and status badge when a booked session is passed', () => {
    const sampleSession = {
      id: 'sess-8891',
      date: '2026-11-20',
      timeSlot: '02:00 PM',
      sessionTopic: 'Distributed Systems & Capstone Defense',
      status: 'CONFIRMED',
      mentor: {
        name: 'Dr. Sarah Chen',
        category: 'Cloud Architecture',
      },
    };

    render(<VRDesktopOverlay {...defaultProps} session={sampleSession} />);

    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText(/Distributed Systems & Capstone Defense/i)).toBeInTheDocument();
  });
});

describe('MentorProfile VR Entry Point', () => {
  const sampleMentor = {
    id: 1,
    name: 'Dr. Sarah Chen',
    title: 'Principal Architect',
    category: 'Cloud Architecture',
    rating: 4.9,
    reviewCount: 38,
    hourlyRate: 80,
    bio: 'Experienced engineer mentoring students in system design.',
    skills: ['AWS', 'Kubernetes'],
    experience: '12+ years',
    education: 'Ph.D. Computer Science',
    reviews: [],
  };

  it('renders Enter 3D Mentorship Room button and passes callback', () => {
    const handleEnterVR = vi.fn();
    render(
      <MentorProfile
        mentor={sampleMentor}
        onBack={vi.fn()}
        onEnterVR={handleEnterVR}
      />
    );

    const vrBtn = screen.getByRole('button', { name: /Enter 3D Mentorship Room/i });
    expect(vrBtn).toBeInTheDocument();

    fireEvent.click(vrBtn);
    expect(handleEnterVR).toHaveBeenCalledWith(sampleMentor);
  });
});

describe('Navbar 3D / VR Room Navigation', () => {
  it('renders 3D / VR Room link in Navbar and handles tab selection', () => {
    const handleTabChange = vi.fn();
    render(<Navbar activeTab="discover" onTabChange={handleTabChange} />);

    const vrLink = screen.getByRole('button', { name: /3D \/ VR Room/i });
    expect(vrLink).toBeInTheDocument();

    fireEvent.click(vrLink);
    expect(handleTabChange).toHaveBeenCalledWith('vr-room');
  });
});

describe('Multi-user communication & permission handling', () => {
  const mockProps = {
    currentSlide: 0,
    totalSlides: 4,
    onPrevSlide: vi.fn(),
    onNextSlide: vi.fn(),
    onSelectPreset: vi.fn(),
    onResetCamera: vi.fn(),
    onEnterVR: vi.fn(),
    onExit: vi.fn(),
    mentor: { name: 'Dr. Sarah Chen', title: 'Principal Architect', category: 'Cloud Architecture' },
    session: null,
  };

  it('displays user-friendly notice when microphone permission is denied', async () => {
    const originalMediaDevices = navigator.mediaDevices;
    const notAllowedError = new Error('Permission denied');
    notAllowedError.name = 'NotAllowedError';

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(notAllowedError),
      },
    });

    render(<VRDesktopOverlay {...mockProps} />);
    const micBtn = screen.getByRole('button', { name: /microphone/i });
    fireEvent.click(micBtn);

    expect(await screen.findByText(/Microphone permission was denied/i)).toBeInTheDocument();

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: originalMediaDevices,
    });
  });

  it('displays user-friendly notice when camera device is not found', async () => {
    const originalMediaDevices = navigator.mediaDevices;
    const notFoundError = new Error('Requested device not found');
    notFoundError.name = 'NotFoundError';

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(notFoundError),
      },
    });

    render(<VRDesktopOverlay {...mockProps} />);
    const camBtn = screen.getByRole('button', { name: /video|camera/i });
    fireEvent.click(camBtn);

    expect(await screen.findByText(/No camera found on this device/i)).toBeInTheDocument();

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: originalMediaDevices,
    });
  });

  it('projects screen share to whiteboard and stops cleanly when native browser share ends', async () => {
    const originalMediaDevices = navigator.mediaDevices;
    const onScreenShareStart = vi.fn();
    const onScreenShareStop = vi.fn();

    const mockTrack = {
      stop: vi.fn(),
      onended: null,
    };
    const mockStream = {
      getTracks: () => [mockTrack],
      getVideoTracks: () => [mockTrack],
    };

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    render(
      <VRDesktopOverlay
        {...mockProps}
        onScreenShareStart={onScreenShareStart}
        onScreenShareStop={onScreenShareStop}
      />
    );

    const shareBtn = screen.getByRole('button', { name: /share screen/i });
    fireEvent.click(shareBtn);

    expect(await screen.findByText(/Sharing Screen — Projected to 3D presentation board/i)).toBeInTheDocument();
    expect(onScreenShareStart).toHaveBeenCalledWith(mockStream);

    // Trigger browser's native stop share event
    act(() => {
      mockTrack.onended();
    });

    expect(screen.queryByText(/Sharing Screen — Projected to 3D presentation board/i)).not.toBeInTheDocument();
    expect(onScreenShareStop).toHaveBeenCalled();

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: originalMediaDevices,
    });
  });

  it('displays truthful local hand-raise status and logs into personal session notes', () => {
    render(<VRDesktopOverlay {...mockProps} />);

    const handBtn = screen.getByRole('button', { name: /raise hand/i });
    fireEvent.click(handBtn);

    expect(screen.getByText(/Hand Raised \(Local View\) — Remote mentor notification requires backend real-time event support/i)).toBeInTheDocument();

    // Check personal notes in drawer
    const chatToggle = screen.getByRole('button', { name: /toggle session chat and notes/i });
    fireEvent.click(chatToggle);

    const notesTab = screen.getByRole('tab', { name: /Agenda & Notes/i });
    fireEvent.click(notesTab);

    const notesArea = screen.getByPlaceholderText(/Record architecture notes/i);
    expect(notesArea.value).toContain('✋ Question pending');
  });
});

describe('Authenticated Session Chat & Optimistic Rollback', () => {
  const sessionProps = {
    currentSlide: 0,
    totalSlides: 4,
    onPrevSlide: vi.fn(),
    onNextSlide: vi.fn(),
    onSelectPreset: vi.fn(),
    onResetCamera: vi.fn(),
    onEnterVR: vi.fn(),
    onExit: vi.fn(),
    mentor: { name: 'Dr. Sarah Chen' },
    session: {
      id: 'sess-auth-1',
      sessionTopic: 'Distributed Systems & WebXR Architecture',
      status: 'CONFIRMED',
    },
  };

  it('shows unauthenticated preview banner when no session is linked', () => {
    render(<VRDesktopOverlay {...sessionProps} session={null} />);
    const chatToggle = screen.getByRole('button', { name: /toggle session chat and notes/i });
    fireEvent.click(chatToggle);

    expect(screen.getByText(/Local 3D Preview: Live backend chat and synchronized meeting features are active during scheduled sessions/i)).toBeInTheDocument();
  });

  it('fetches meeting info and session messages using the stored session token', async () => {
    const originalFetch = global.fetch;
    window.sessionStorage.setItem('mentor_connect_token', 'student-auth-token-123');

    global.fetch = vi.fn().mockImplementation(async (url) => {
      if (url.includes('/meeting')) {
        return new Response(
          JSON.stringify({
            status: 'success',
            data: {
              meeting: {
                meetingUrl: 'https://meet.jit.si/mentor-connect-session-sess-auth-1',
                canJoin: true,
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('/messages')) {
        return new Response(
          JSON.stringify({
            status: 'success',
            data: {
              messages: [
                {
                  id: 'msg-remote-1',
                  content: 'Hi Asha! Welcome to our 3D capstone review.',
                  senderName: 'Dr. Sarah Chen',
                  senderRole: 'MENTOR',
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ status: 'success', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    render(<VRDesktopOverlay {...sessionProps} />);

    // Jitsi Call link should be displayed
    const jitsiLink = await screen.findByTitle(/Open synchronized Jitsi video call in new window/i);
    expect(jitsiLink).toBeInTheDocument();
    expect(jitsiLink).toHaveAttribute('href', 'https://meet.jit.si/mentor-connect-session-sess-auth-1');

    // Open chat drawer and check remote message
    const chatToggle = screen.getByRole('button', { name: /toggle session chat and notes/i });
    fireEvent.click(chatToggle);

    expect(await screen.findByText('Hi Asha! Welcome to our 3D capstone review.')).toBeInTheDocument();

    global.fetch = originalFetch;
    window.sessionStorage.removeItem('mentor_connect_token');
  });

  it('handles message send failure with honest rollback and failure indicator', async () => {
    const originalFetch = global.fetch;
    window.sessionStorage.setItem('mentor_connect_token', 'student-auth-token-123');

    global.fetch = vi.fn().mockImplementation(async (url, options) => {
      if (options?.method === 'POST') {
        return new Response(
          JSON.stringify({ status: 'error', message: 'Failed to persist message' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ status: 'success', data: { messages: [] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    render(<VRDesktopOverlay {...sessionProps} />);
    const chatToggle = screen.getByRole('button', { name: /toggle session chat and notes/i });
    fireEvent.click(chatToggle);

    const input = screen.getByPlaceholderText(/Type a question or message/i);
    fireEvent.change(input, { target: { value: 'Optimistic message testing' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    // Verify delivery failure indicator is rendered
    expect(await screen.findByText('⚠️ Not delivered')).toBeInTheDocument();
    expect(screen.getByText(/Message delivery failed/i)).toBeInTheDocument();

    // Verify dismiss button removes failed message
    const dismissBtn = screen.getByRole('button', { name: 'Dismiss' });
    fireEvent.click(dismissBtn);
    expect(screen.queryByText('Optimistic message testing')).not.toBeInTheDocument();

    global.fetch = originalFetch;
    window.sessionStorage.removeItem('mentor_connect_token');
  });
});

describe('VRWhiteboard 3D Screen Share Projection', () => {
  it('manages video texture projection lifecycle and cleans up safely', () => {
    const scene = new THREE.Scene();
    const whiteboard = buildWhiteboard(scene);

    expect(whiteboard.isScreenSharing()).toBe(false);

    const mockTrack = { stop: vi.fn() };
    const mockStream = {
      getTracks: () => [mockTrack],
      getVideoTracks: () => [mockTrack],
    };

    whiteboard.setScreenShareStream(mockStream);
    expect(whiteboard.isScreenSharing()).toBe(true);

    whiteboard.clearScreenShare();
    expect(whiteboard.isScreenSharing()).toBe(false);

    whiteboard.dispose();
  });
});
