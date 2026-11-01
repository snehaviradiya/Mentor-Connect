import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  // State & core toast functions ------------------------------------------------
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title = '', message = '', duration = 4500 }) => {
      const id = ++toastIdCounter;
      const newToast = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  // Domain‑specific helpers ------------------------------------------------------
  const bookingApproved = useCallback((message, title = 'Booking Approved') =>
    showToast({ type: 'success', title, message })
  , [showToast]);

  const upcomingSession = useCallback((message, title = 'Upcoming Session') =>
    showToast({ type: 'info', title, message })
  , [showToast]);

  const newMessage = useCallback((message, title = 'New Message') =>
    showToast({ type: 'info', title, message })
  , [showToast]);

  const bookingCancelled = useCallback((message, title = 'Booking Cancelled') =>
    showToast({ type: 'warning', title, message })
  , [showToast]);

  const mentorResponse = useCallback((message, title = 'Mentor Response') =>
    showToast({ type: 'info', title, message })
  , [showToast]);

  // Consolidated helpers object ---------------------------------------------------
  const helpers = useMemo(
    () => ({
      showToast,
      dismissToast,
      success: (message, title = 'Success') =>
        showToast({ type: 'success', title, message }),
      error: (message, title = 'Error') =>
        showToast({ type: 'error', title, message }),
      info: (message, title = 'Information') =>
        showToast({ type: 'info', title, message }),
      warning: (message, title = 'Warning') =>
        showToast({ type: 'warning', title, message }),
      // Specific notifications
      bookingApproved,
      upcomingSession,
      newMessage,
      bookingCancelled,
      mentorResponse,
    }),
    [showToast, dismissToast, bookingApproved, upcomingSession, newMessage, bookingCancelled, mentorResponse]
  );

  return (
    <ToastContext.Provider value={helpers}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="toast-container"
        aria-label="Notification center"
        tabIndex={-1}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item toast-${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            data-testid={`toast-${toast.type}`}
          >
            <div className="toast-icon" aria-hidden="true">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠️'}
              {toast.type === 'info' && 'ℹ️'}
            </div>
            <div className="toast-body">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful no‑op fallback for tests or components rendered outside provider
    return {
      showToast: () => {},
      dismissToast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
      bookingApproved: () => {},
      upcomingSession: () => {},
      newMessage: () => {},
      bookingCancelled: () => {},
      mentorResponse: () => {},
    };
  }
  return context;
}
