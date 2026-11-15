import { useState, useEffect, useRef, useCallback } from 'react';
import { CAMERA_PRESETS } from './VRRoomConstants.js';
import { fetchSessionMessages, sendSessionMessage, fetchMeetingInfo } from '../../services/api.js';

/**
 * Desktop & Mobile 2D HUD overlay superimposed over the 3D/VR Canvas.
 * Provides controls guide, slide navigation with direct jump pills,
 * camera preset switches, communication controls (mic, camera, screen share, raise hand),
 * interactive session chat and notes panel, WebXR headset trigger,
 * and exit back to normal website.
 */
export default function VRDesktopOverlay({
  currentSlide = 0,
  totalSlides = 4,
  onPrevSlide,
  onNextSlide,
  onGoToSlide,
  onSelectPreset,
  activePreset = 'DEFAULT',
  onResetCamera,
  onEnterVR,
  isVRSupported = false,
  isVRSessionActive = false,
  onExit,
  mentor = null,
  session = null,
  onScreenShareStart,
  onScreenShareStop,
}) {
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Communication states
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState(null);
  const [meetingInfo, setMeetingInfo] = useState(null);

  // Side panel state (Chat & Notes)
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState('chat'); // 'chat' | 'notes'
  const [unreadChat, setUnreadChat] = useState(false);

  // Media stream references
  const micStreamRef = useRef(null);
  const videoStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const videoPipRef = useRef(null);
  const chatEndRef = useRef(null);

  const mentorName = mentor?.name || session?.mentor?.name || 'Prof. Rajesh Sharma';

  // Chat message state
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: mentorName,
      content: `Welcome to the 3D Mentorship Room! I'm ready to review your capstone architecture and engineering milestones.`,
      time: '10:00 AM',
      isUser: false,
      status: 'sent',
    },
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Authenticated Token
  const token = typeof window !== 'undefined'
    ? window.sessionStorage?.getItem('mentor_connect_token')
    : null;

  // Agenda & Notes state
  const notesStorageKey = `vr_session_notes_${session?.id || 'demo'}`;
  const [sessionNotes, setSessionNotes] = useState(() => {
    try {
      return localStorage.getItem(notesStorageKey) || '';
    } catch {
      return '';
    }
  });

  const [agenda, setAgenda] = useState([
    { id: 1, text: 'Review WebXR & Three.js 3D room architecture', done: true },
    { id: 2, text: 'Presentation board walkthrough & slide technical topics', done: false },
    { id: 3, text: 'Verify real browser audio/video communication dock', done: false },
    { id: 4, text: 'Align on capstone delivery and verification milestones', done: false },
  ]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Helper for human-readable device error descriptions
  const getMediaErrorMessage = (err, deviceType) => {
    if (!err) return `${deviceType} access failed.`;
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return `${deviceType} permission was denied. Please grant access in your browser settings.`;
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return `No ${deviceType.toLowerCase()} found on this device.`;
    }
    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      return `${deviceType} is currently in use by another application or meeting.`;
    }
    if (err.name === 'OverconstrainedError') {
      return `${deviceType} does not satisfy requested hardware constraints.`;
    }
    return `${deviceType} error: ${err.message || 'Unable to access device'}`;
  };

  // Toggle Microphone
  const toggleMic = useCallback(async () => {
    // Check if an external Jitsi meeting API instance is registered
    if (typeof window !== 'undefined' && window.__jitsiMeetingApi?.executeCommand) {
      try {
        window.__jitsiMeetingApi.executeCommand('toggleAudio');
        return;
      } catch {
        // Fallback to native WebRTC getUserMedia
      }
    }

    if (isMicOn) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      setIsMicOn(false);
    } else {
      // Stop any prior tracks to prevent duplicate streams
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }

      try {
        if (navigator?.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = stream;
          setIsMicOn(true);

          const track = stream.getAudioTracks()[0];
          if (track) {
            track.onended = () => {
              micStreamRef.current = null;
              setIsMicOn(false);
            };
          }
        } else {
          setIsMicOn(true);
        }
      } catch (err) {
        console.warn('[VRDesktopOverlay] Microphone access unavailable:', err.name || err.message);
        setIsMicOn(false);
        setNoticeMessage(getMediaErrorMessage(err, 'Microphone'));
      }
    }
  }, [isMicOn]);

  // Toggle Camera
  const toggleVideo = useCallback(async () => {
    // Check if an external Jitsi meeting API instance is registered
    if (typeof window !== 'undefined' && window.__jitsiMeetingApi?.executeCommand) {
      try {
        window.__jitsiMeetingApi.executeCommand('toggleVideo');
        return;
      } catch {
        // Fallback to native WebRTC getUserMedia
      }
    }

    if (isVideoOn) {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
      }
      setIsVideoOn(false);
    } else {
      // Stop any prior tracks to prevent duplicate streams
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
      }

      try {
        if (navigator?.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240 },
          });
          videoStreamRef.current = stream;
          setIsVideoOn(true);

          const track = stream.getVideoTracks()[0];
          if (track) {
            track.onended = () => {
              videoStreamRef.current = null;
              setIsVideoOn(false);
            };
          }
        } else {
          setIsVideoOn(true);
        }
      } catch (err) {
        console.warn('[VRDesktopOverlay] Camera access unavailable:', err.name || err.message);
        setIsVideoOn(false);
        setNoticeMessage(getMediaErrorMessage(err, 'Camera'));
      }
    }
  }, [isVideoOn]);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      onScreenShareStop?.();
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      try {
        if (navigator?.mediaDevices?.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = stream;
          setIsScreenSharing(true);
          onScreenShareStart?.(stream);

          const track = stream.getVideoTracks()[0];
          if (track) {
            // Handles browser native "Stop sharing" button
            track.onended = () => {
              if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((t) => t.stop());
                screenStreamRef.current = null;
              }
              setIsScreenSharing(false);
              onScreenShareStop?.();
            };
          }
        } else {
          setIsScreenSharing(true);
        }
      } catch (err) {
        console.warn('[VRDesktopOverlay] Screen share error or cancelled:', err.name || err.message);
        setIsScreenSharing(false);
        onScreenShareStop?.();
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          setNoticeMessage(getMediaErrorMessage(err, 'Screen share'));
        }
      }
    }
  }, [isScreenSharing, onScreenShareStart, onScreenShareStop]);

  // Toggle Hand Raise (truthful local view)
  const toggleHandRaise = useCallback(() => {
    setIsHandRaised((prev) => {
      const next = !prev;
      if (next) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const autoNote = `\n[${timeStr}] ✋ Question pending (Hand raised in 3D workspace)`;
        setSessionNotes((current) => {
          const updated = current + autoNote;
          try {
            localStorage.setItem(notesStorageKey, updated);
          } catch {
            // ignore
          }
          return updated;
        });
      }
      return next;
    });
  }, [notesStorageKey]);

  // Toggle Side Panel
  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => {
      const next = !prev;
      if (next) setUnreadChat(false);
      return next;
    });
  }, []);

  // Connect video element to active camera stream
  useEffect(() => {
    if (isVideoOn && videoPipRef.current && videoStreamRef.current) {
      videoPipRef.current.srcObject = videoStreamRef.current;
    }
  }, [isVideoOn]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (isPanelOpen && panelTab === 'chat' && typeof chatEndRef.current?.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isPanelOpen, panelTab]);

  // Clean up all media tracks on unmount
  useEffect(() => {
    return () => {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
      if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
      onScreenShareStop?.();
    };
  }, [onScreenShareStop]);

  // Notice auto-dismiss timer
  useEffect(() => {
    if (!noticeMessage) return undefined;
    const timer = setTimeout(() => setNoticeMessage(null), 3800);
    return () => clearTimeout(timer);
  }, [noticeMessage]);

  // Fetch meeting info if real session is linked
  useEffect(() => {
    let isSubscribed = true;
    if (session?.id) {
      fetchMeetingInfo(session.id, token)
        .then((res) => {
          if (!isSubscribed) return;
          if (res?.data?.meeting) {
            setMeetingInfo(res.data.meeting);
          }
        })
        .catch(() => {
          // Graceful fallback for mock or offline session
        });
    }
    return () => {
      isSubscribed = false;
    };
  }, [session?.id, token]);

  // Fetch authenticated session messages & maintain periodic polling
  useEffect(() => {
    let isSubscribed = true;

    async function loadMessages() {
      if (!session?.id) return;
      try {
        const res = await fetchSessionMessages(session.id, token);
        if (!isSubscribed) return;
        const apiMsgs = res?.data?.messages;
        if (Array.isArray(apiMsgs) && apiMsgs.length > 0) {
          setMessages((prev) => {
            const formatted = apiMsgs.map((m) => ({
              id: m.id,
              sender: m.senderName || m.sender?.name || (m.senderRole === 'STUDENT' ? 'You' : mentorName),
              content: m.content,
              time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              isUser: m.senderRole === 'STUDENT',
              status: 'sent',
            }));

            // Alert user to unread message from mentor if drawer is closed
            const hasNewRemote = formatted.some(
              (newM) => !newM.isUser && !prev.some((p) => p.id === newM.id)
            );
            if (hasNewRemote) {
              setUnreadChat(true);
            }
            return formatted;
          });
        }
      } catch {
        // Retain existing messages gracefully on temporary network drops
      }
    }

    if (session?.id) {
      loadMessages();
      const interval = setInterval(loadMessages, 4000);
      return () => {
        isSubscribed = false;
        clearInterval(interval);
      };
    }

    return () => {
      isSubscribed = false;
    };
  }, [session?.id, mentorName, token]);

  // Send message handler with optimistic update and rollback on failure
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = messageInput.trim();
    if (!text || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      sender: 'You',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true,
      status: session?.id ? 'sending' : 'sent',
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessageInput('');

    if (session?.id) {
      setIsSending(true);
      try {
        const res = await sendSessionMessage(session.id, text, 'TEXT', token);
        if (res?.data?.message) {
          const sMsg = res.data.message;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? {
                    id: sMsg.id,
                    sender: sMsg.senderName || 'You',
                    content: sMsg.content,
                    time: new Date(sMsg.createdAt || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    isUser: true,
                    status: 'sent',
                  }
                : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m))
          );
        }
      } catch (err) {
        console.warn('[VRDesktopOverlay] Message dispatch error:', err.message);
        // Do NOT leave as successful: mark failed with clear status
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  status: 'failed',
                  error: err.message || 'Delivery failed',
                }
              : m
          )
        );
        setNoticeMessage(
          err.status === 401 || err.status === 403
            ? 'Unable to send message: Session unauthorized or expired authentication token.'
            : 'Message delivery failed. Please check your connection or retry.'
        );
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleRetryMessage = async (failedMsg) => {
    if (!session?.id || !failedMsg) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === failedMsg.id ? { ...m, status: 'sending' } : m))
    );
    try {
      const res = await sendSessionMessage(session.id, failedMsg.content, 'TEXT', token);
      if (res?.data?.message) {
        const sMsg = res.data.message;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === failedMsg.id
              ? {
                  id: sMsg.id,
                  sender: sMsg.senderName || 'You',
                  content: sMsg.content,
                  time: new Date(sMsg.createdAt || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  isUser: true,
                  status: 'sent',
                }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...m, status: 'failed' } : m))
      );
      setNoticeMessage('Retry failed. Please check network connection.');
    }
  };

  const handleDismissFailedMessage = (msgId) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  // Notes change handler
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setSessionNotes(val);
    try {
      localStorage.setItem(notesStorageKey, val);
    } catch {
      // ignore storage quota issues
    }
  };

  // Agenda toggle
  const toggleAgendaItem = (id) => {
    setAgenda((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  return (
    <div className="vr-overlay-container" aria-label="3D Mentorship Room Overlay">
      {/* 1. Top HUD Bar */}
      <header className="vr-top-hud">
        <div className="vr-hud-brand">
          <div className="vr-pulse-dot" aria-hidden="true" />
          <div className="vr-brand-info">
            <div className="vr-brand-title-row">
              <span className="vr-hud-title">3D Mentorship Room</span>
              {session?.status ? (
                <span className="vr-session-status-badge live">
                  {session.status}
                </span>
              ) : (
                <span className="vr-session-status-badge local">
                  LOCAL 3D SIMULATION
                </span>
              )}
              {meetingInfo?.meetingUrl && meetingInfo?.canJoin !== false && (
                <a
                  href={meetingInfo.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="vr-hud-meeting-link"
                  title="Open synchronized Jitsi video call in new window"
                >
                  🎥 Jitsi Call
                </a>
              )}
            </div>
            <span className="vr-hud-subtitle">
              {session
                ? `${session.sessionTopic || session.topic || 'Mentorship Session'} • ${mentorName}`
                : mentor
                ? `${mentor.name} • ${mentor.category}`
                : 'Autonomous Mentorship Workspace'}
            </span>
          </div>
        </div>

        {/* Center: Slide Switcher & Direct Jump Pills */}
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

          <div className="vr-slide-jump-pills" role="tablist" aria-label="Jump to slide">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`vr-slide-jump-pill${currentSlide === idx ? ' active' : ''}`}
                onClick={() => onGoToSlide && onGoToSlide(idx)}
                aria-label={`Jump to slide ${idx + 1}`}
                title={`Jump to slide ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

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

      {/* Floating Alerts & Status Banners */}
      <div className="vr-floating-alerts">
        {isHandRaised && (
          <div className="vr-hand-raised-banner" role="status">
            <span className="vr-hand-icon">✋</span>
            <span>Hand Raised (Local View) — Remote mentor notification requires backend real-time event support</span>
            <button
              type="button"
              className="vr-hand-dismiss-btn"
              onClick={() => setIsHandRaised(false)}
              aria-label="Lower hand"
            >
              ✕
            </button>
          </div>
        )}

        {isScreenSharing && (
          <div className="vr-screen-share-banner" role="status">
            <span className="vr-screen-share-pulse" />
            <span>Sharing Screen — Projected to 3D presentation board</span>
            <button
              type="button"
              className="vr-stop-share-btn"
              onClick={toggleScreenShare}
            >
              Stop Sharing
            </button>
          </div>
        )}

        {noticeMessage && (
          <div className="vr-notice-banner" role="alert">
            <span>{noticeMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Bottom Controls & Presets */}
      <footer className="vr-bottom-hud">
        {/* Left: Communication Controls Dock */}
        <div className="vr-comm-dock" role="toolbar" aria-label="Real-time communication controls">
          <button
            type="button"
            className={`vr-comm-btn${isMicOn ? ' active' : ' muted'}`}
            onClick={toggleMic}
            aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
            title={isMicOn ? 'Microphone active (Click to mute)' : 'Microphone muted (Click to unmute)'}
          >
            <span className="vr-comm-icon">{isMicOn ? '🎤' : '🎙️'}</span>
            <span className="vr-comm-label">{isMicOn ? 'Mute' : 'Mic'}</span>
            {isMicOn && <span className="vr-active-audio-dot" />}
          </button>

          <button
            type="button"
            className={`vr-comm-btn${isVideoOn ? ' active' : ' muted'}`}
            onClick={toggleVideo}
            aria-label={isVideoOn ? 'Stop video' : 'Start video'}
            title={isVideoOn ? 'Camera active (Click to stop)' : 'Camera off (Click to start)'}
          >
            <span className="vr-comm-icon">{isVideoOn ? '📹' : '📷'}</span>
            <span className="vr-comm-label">{isVideoOn ? 'Video On' : 'Camera'}</span>
          </button>

          <button
            type="button"
            className={`vr-comm-btn${isScreenSharing ? ' active' : ''}`}
            onClick={toggleScreenShare}
            aria-label={isScreenSharing ? 'Stop screen share' : 'Share screen'}
            title="Share your desktop screen"
          >
            <span className="vr-comm-icon">🖥️</span>
            <span className="vr-comm-label">{isScreenSharing ? 'Sharing' : 'Share'}</span>
          </button>

          <button
            type="button"
            className={`vr-comm-btn${isHandRaised ? ' active-amber' : ''}`}
            onClick={toggleHandRaise}
            aria-label="Raise hand"
            title={isHandRaised ? 'Lower your hand' : 'Raise hand to ask question'}
          >
            <span className="vr-comm-icon">✋</span>
            <span className="vr-comm-label">{isHandRaised ? 'Raised' : 'Raise Hand'}</span>
          </button>

          <button
            type="button"
            className={`vr-comm-btn vr-chat-toggle-btn${isPanelOpen ? ' active' : ''}`}
            onClick={togglePanel}
            aria-label="Toggle session chat and notes panel"
            title="Open live chat and agenda notes"
          >
            <span className="vr-comm-icon">💬</span>
            <span className="vr-comm-label">Chat & Notes</span>
            {unreadChat && !isPanelOpen && <span className="vr-unread-badge" />}
          </button>
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

        {/* Right: Cheatsheet toggle & Local simulation label */}
        <div className="vr-bottom-right-actions">
          <div className="vr-cheatsheet-wrapper">
            <button
              type="button"
              className="vr-cheatsheet-toggle"
              onClick={() => setShowCheatsheet((s) => !s)}
              aria-expanded={showCheatsheet}
              title="Toggle navigation keys and controls help"
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

          <div className="vr-disclaimer-pill" title="Hardware-accelerated 3D WebXR rendering with responsive client controls">
            <span>Local Simulation</span>
          </div>
        </div>
      </footer>

      {/* 3. Floating Miniature Self-View PiP */}
      {isVideoOn && (
        <div className="vr-self-view-pip" aria-label="Student video camera self view">
          <video
            ref={videoPipRef}
            autoPlay
            playsInline
            muted
            className="vr-pip-video"
          />
          <span className="vr-pip-badge">You</span>
        </div>
      )}

      {/* 4. Glassmorphic Side Drawer for Chat & Notes */}
      {isPanelOpen && (
        <aside className="vr-side-panel" aria-label="Live Session Chat and Agenda Notes">
          <div className="vr-panel-header">
            <div className="vr-panel-tabs" role="tablist">
              <button
                type="button"
                className={`vr-panel-tab${panelTab === 'chat' ? ' active' : ''}`}
                onClick={() => setPanelTab('chat')}
                role="tab"
                aria-selected={panelTab === 'chat'}
              >
                💬 Live Chat ({messages.length})
              </button>
              <button
                type="button"
                className={`vr-panel-tab${panelTab === 'notes' ? ' active' : ''}`}
                onClick={() => setPanelTab('notes')}
                role="tab"
                aria-selected={panelTab === 'notes'}
              >
                📝 Agenda & Notes
              </button>
            </div>
            <button
              type="button"
              className="vr-panel-close-btn"
              onClick={togglePanel}
              aria-label="Close panel"
              title="Close panel"
            >
              ✕
            </button>
          </div>

          {panelTab === 'chat' ? (
            <div className="vr-chat-view">
              {!session?.id && (
                <div className="vr-chat-unauthenticated-banner" role="status">
                  <span className="vr-chat-banner-icon" aria-hidden="true">ℹ️</span>
                  <span>Local 3D Preview: Live backend chat and synchronized meeting features are active during scheduled sessions.</span>
                </div>
              )}

              <div className="vr-chat-messages" role="log" aria-label="Session messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`vr-chat-message-row${msg.isUser ? ' user' : ' mentor'}${msg.status === 'failed' ? ' failed' : ''}`}
                  >
                    <div className="vr-msg-meta">
                      <span className="vr-msg-author">{msg.sender}</span>
                      <span className="vr-msg-time">{msg.time}</span>
                    </div>
                    <div className="vr-msg-bubble">{msg.content}</div>
                    {msg.status === 'sending' && (
                      <span className="vr-msg-status-text">Sending...</span>
                    )}
                    {msg.status === 'failed' && (
                      <div className="vr-msg-failed-row">
                        <span className="vr-msg-failed-label">⚠️ Not delivered</span>
                        <button
                          type="button"
                          className="vr-msg-retry-btn"
                          onClick={() => handleRetryMessage(msg)}
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          className="vr-msg-dismiss-btn"
                          onClick={() => handleDismissFailedMessage(msg.id)}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form className="vr-chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="vr-chat-input"
                  placeholder="Type a question or message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  aria-label="Chat message input"
                />
                <button
                  type="submit"
                  className="vr-chat-send-btn"
                  disabled={!messageInput.trim() || isSending}
                  aria-label="Send message"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          ) : (
            <div className="vr-notes-view">
              <div className="vr-agenda-section">
                <h4 className="vr-agenda-title">Session Agenda Checklist</h4>
                <div className="vr-agenda-items">
                  {agenda.map((item) => (
                    <label key={item.id} className="vr-agenda-item">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleAgendaItem(item.id)}
                      />
                      <span className={item.done ? 'done' : ''}>{item.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="vr-notes-section">
                <div className="vr-notes-header">
                  <h4 className="vr-notes-title">Personal Session Notes</h4>
                  <span className="vr-notes-autosave">Auto-saved</span>
                </div>
                <textarea
                  className="vr-notes-textarea"
                  placeholder="Record architecture notes, questions, and action items during your mentorship session..."
                  value={sessionNotes}
                  onChange={handleNotesChange}
                  aria-label="Session notes"
                />
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
