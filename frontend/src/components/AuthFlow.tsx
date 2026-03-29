import { useState, useEffect } from 'react';
import { api, setAuthToken } from '../api';

interface AuthFlowProps {
  onAuthenticated: () => void;
}

export default function AuthFlow({ onAuthenticated }: AuthFlowProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if we're being redirected back with a session_id
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId) {
      // Verify the session
      api.verifySession(sessionId)
        .then(() => {
          setAuthToken(sessionId);
          // Clear the URL
          window.history.replaceState({}, '', '/');
          onAuthenticated();
        })
        .catch(() => {
          setMessage('Invalid or expired login link');
        });
    }
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await api.requestMagicLink(email);
      setMessage('Check your email for a login link!');
      setEmail('');
    } catch (error) {
      setMessage('Failed to send login link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="content-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)' }}>
      <div className="glass-card liquidGlass-wrapper">
        <div className="liquidGlass-effect"></div>
        <div className="liquidGlass-tint"></div>
        <div className="liquidGlass-shine"></div>
        <div style={{ zIndex: 3, position: 'relative', width: '100%' }}>
          <h2 style={{ marginTop: 0, textAlign: 'center' }}>Sign In</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              className="glass-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="button-small liquidGlass-wrapper"
              style={{ border: 'none', background: 'rgba(100, 150, 255, 0.4)' }}
            >
              <div className="liquidGlass-effect"></div>
              <div className="liquidGlass-tint"></div>
              <div className="liquidGlass-shine"></div>
              <div className="liquidGlass-text" style={{ fontSize: '0.9rem' }}>
                {isLoading ? 'Sending...' : 'Send Login Link'}
              </div>
            </button>
          </form>
          {message && (
            <div
              className={`message ${message.includes('Failed') ? 'message-error' : 'message-success'}`}
              style={{ marginTop: '1rem' }}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
