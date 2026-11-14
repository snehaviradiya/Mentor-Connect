import { useEffect, useRef, useState } from 'react';
import { registerUser } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import ProgressSteps from './ProgressSteps.jsx';
import { MOCK_CATEGORIES } from '../data/mockMentors.js';

const REGISTRATION_STEPS = ['Your details', 'Secure account', 'Finish'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegistrationModal({ onClose, onAuthenticated }) {
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(MOCK_CATEGORIES[0]);
  const [expertise, setExpertise] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [sessionSaveError, setSessionSaveError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (step === 0) nameInputRef.current?.focus();
      else if (step === 1) modalRef.current?.querySelector('#registration-password')?.focus();
      else modalRef.current?.querySelector('.registration-actions button[type="submit"], .registration-success button')?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), [href], textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((element) => element.getAttribute('aria-hidden') !== 'true');
        if (!focusableElements.length) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSubmitting, onClose, registeredUser, step]);

  const mentorDetailsComplete = role !== 'MENTOR' || (title.trim().length >= 3 && expertise.trim());
  const contactComplete = name.trim().length >= 2 && EMAIL_PATTERN.test(email.trim()) && mentorDetailsComplete;
  const passwordComplete = password.length >= 8 && password === confirmPassword;
  const progress = registeredUser ? 100 : step === 2 ? 85 : step * 50;

  const validateStep = () => {
    const nextErrors = {};
    if (step === 0) {
      if (name.trim().length < 2) nextErrors.name = 'Enter your name (at least 2 characters).';
      if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
      if (role === 'MENTOR') {
        if (title.trim().length < 3) nextErrors.title = 'Enter a professional title (at least 3 characters).';
        if (!expertise.trim()) nextErrors.expertise = 'List at least one area of expertise.';
      }
    } else if (step === 1) {
      if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
      if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    setErrors({});
    setServerError('');
    setStep((current) => Math.min(current + 1, REGISTRATION_STEPS.length - 1));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (isSubmitting || !validateStep()) return;
    setIsSubmitting(true);
    setServerError('');

    try {
      const registration = {
        name: name.trim(),
        email: email.trim(),
        password,
      };
      if (role === 'MENTOR') {
        registration.role = role;
        registration.title = title.trim();
        registration.category = category;
        registration.expertise = expertise.split(',').map((item) => item.trim()).filter(Boolean);
      }
      const response = await registerUser(registration);
      const user = response?.data?.user;
      const token = response?.data?.token;
      if (!user || !token) {
        throw new Error('The server returned an incomplete registration response.');
      }

      let sessionSaved = true;
      try {
        window.sessionStorage.setItem('mentor_connect_token', token);
        window.sessionStorage.setItem('mentor_connect_user', JSON.stringify(user));
      } catch (error) {
        console.error('Could not save registration session:', error);
        sessionSaved = false;
        setSessionSaveError(true);
      }
      if (sessionSaved) onAuthenticated?.(user);

      setRegisteredUser(user);
      setStep(REGISTRATION_STEPS.length - 1);
      toast.success('Your student account is ready.', 'Welcome to Mentor Connect');
    } catch (error) {
      const details = Array.isArray(error.details) ? error.details.join(' ') : '';
      const message = details || error.message || 'Unable to create your account. Please try again.';
      setServerError(message);
      toast.error(message, 'Registration Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        ref={modalRef}
        className="modal-container registration-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-title"
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title" id="registration-title">
              {registeredUser ? 'You’re all set!' : 'Create your account'}
            </h2>
            <p className="modal-subtitle">
              {registeredUser
                ? 'Your mentorship journey starts here.'
                : 'A few quick steps, then you’re ready to connect.'}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close registration"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <ProgressSteps
          steps={REGISTRATION_STEPS}
          currentStep={registeredUser ? 2 : step}
          progress={progress}
          label="Registration"
        />

        {registeredUser ? (
          <div className="registration-success" role="status">
            <span className="registration-success-icon" aria-hidden="true">✓</span>
            <h3>Welcome, {registeredUser.name}!</h3>
            <p>
              {sessionSaveError
                ? 'Your account was created, but this browser could not save the sign-in session.'
                : 'Your student account is ready. You can now explore mentors and plan a session.'}
            </p>
            <button type="button" className="btn-primary" onClick={onClose}>Start exploring</button>
          </div>
        ) : (
          <form
            className="registration-form"
            onSubmit={step < 2 ? handleNext : handleRegister}
            noValidate
          >
            {serverError && <p className="registration-error" role="alert">{serverError}</p>}

            {step === 0 && (
              <div className="registration-fields">
                <p className="registration-step-copy">First, tell us how to reach you.</p>
                <div className="form-group">
                  <label htmlFor="registration-role" className="form-label">Account type</label>
                  <select
                    id="registration-role"
                    className="form-input"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="MENTOR">Mentor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="registration-name" className="form-label">Full name</label>
                  <input
                    ref={nameInputRef}
                    id="registration-name"
                    className="form-input"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'registration-name-error' : undefined}
                  />
                  {errors.name && <p id="registration-name-error" className="field-error" role="alert">{errors.name}</p>}
                </div>
                {role === 'MENTOR' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="registration-title" className="form-label">Professional title</label>
                      <input
                        id="registration-title"
                        className="form-input"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        aria-invalid={Boolean(errors.title)}
                        aria-describedby={errors.title ? 'registration-title-error' : undefined}
                      />
                      {errors.title && <p id="registration-title-error" className="field-error" role="alert">{errors.title}</p>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="registration-category" className="form-label">Expertise category</label>
                      <select id="registration-category" className="form-input" value={category} onChange={(event) => setCategory(event.target.value)}>
                        {MOCK_CATEGORIES.filter((item) => item !== 'All').map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="registration-expertise" className="form-label">Areas of expertise</label>
                      <input
                        id="registration-expertise"
                        className="form-input"
                        placeholder="Comma-separated, e.g. React, TypeScript"
                        value={expertise}
                        onChange={(event) => setExpertise(event.target.value)}
                        aria-invalid={Boolean(errors.expertise)}
                        aria-describedby={errors.expertise ? 'registration-expertise-error' : undefined}
                      />
                      {errors.expertise && <p id="registration-expertise-error" className="field-error" role="alert">{errors.expertise}</p>}
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label htmlFor="registration-email" className="form-label">University email</label>
                  <input
                    id="registration-email"
                    type="email"
                    className="form-input"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'registration-email-error' : undefined}
                  />
                  {errors.email && <p id="registration-email-error" className="field-error" role="alert">{errors.email}</p>}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="registration-fields">
                <p className="registration-step-copy">Choose a password with at least 8 characters.</p>
                <div className="form-group">
                  <label htmlFor="registration-password" className="form-label">Password</label>
                  <input
                    id="registration-password"
                    type="password"
                    className="form-input"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'registration-password-error' : undefined}
                  />
                  {errors.password && <p id="registration-password-error" className="field-error" role="alert">{errors.password}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="registration-confirm-password" className="form-label">Confirm password</label>
                  <input
                    id="registration-confirm-password"
                    type="password"
                    className="form-input"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'registration-confirm-password-error' : undefined}
                  />
                  {errors.confirmPassword && <p id="registration-confirm-password-error" className="field-error" role="alert">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="registration-review">
                <p className="registration-step-copy">Review your details before creating your account.</p>
                <dl>
                  <div><dt>Name</dt><dd>{name.trim()}</dd></div>
                  <div><dt>Email</dt><dd>{email.trim()}</dd></div>
                  <div><dt>Account type</dt><dd>{role === 'MENTOR' ? 'Mentor' : 'Student'}</dd></div>
                  {role === 'MENTOR' && <div><dt>Professional title</dt><dd>{title}</dd></div>}
                </dl>
                <p className="registration-privacy-note">Your password is sent securely to the Mentor Connect API and is never displayed here.</p>
              </div>
            )}

            <div className="registration-actions">
              {step > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setServerError('');
                    setStep((current) => current - 1);
                  }}
                  disabled={isSubmitting}
                >
                  Back
                </button>
              )}
              {step < 2 ? (
                <button type="submit" className="btn-primary" disabled={step === 0 ? !contactComplete : !passwordComplete}>
                  Continue
                </button>
              ) : (
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account…' : 'Create account'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
