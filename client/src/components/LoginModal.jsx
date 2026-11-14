import { useState } from 'react';
import { loginUser } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function LoginModal({ onClose, onAuthenticated }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      const response = await loginUser({ email: email.trim(), password });
      const { token, user } = response?.data || {};
      if (!token || !user) throw new Error('The server returned an incomplete sign-in response.');
      window.sessionStorage.setItem('mentor_connect_token', token);
      window.sessionStorage.setItem('mentor_connect_user', JSON.stringify(user));
      onAuthenticated?.(user);
      toast.success(`Welcome back, ${user.name}.`, 'Signed In');
      onClose();
    } catch (requestError) {
      const details = Array.isArray(requestError.details) ? requestError.details.join(' ') : '';
      setError(details || requestError.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose();
    }}>
      <section className="modal-container" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <div className="modal-header">
          <div>
            <h2 className="modal-title" id="login-title">Sign in to Mentor Connect</h2>
            <p className="modal-subtitle">Use your student or mentor account.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting} aria-label="Close sign in">✕</button>
        </div>
        <form className="registration-form" onSubmit={handleSubmit}>
          {error && <p className="registration-error" role="alert">{error}</p>}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email</label>
            <input id="login-email" type="email" autoComplete="email" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" className="form-input" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <div className="registration-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
