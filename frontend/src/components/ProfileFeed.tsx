import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Profile } from '../types';

interface ProfileFeedProps {
  onProfileAction?: () => void;
}

export default function ProfileFeed({ onProfileAction }: ProfileFeedProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionText, setQuestionText] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const response = await api.getFeed();
      setProfiles(response.profiles);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentProfile = profiles[currentIndex];

  const handleSkip = async () => {
    if (!currentProfile) return;
    try {
      await api.skipProfile(currentProfile.user_id);
      onProfileAction?.();
      moveToNext();
    } catch (error) {
      console.error('Failed to skip:', error);
    }
  };

  const handleMatch = async () => {
    if (!currentProfile) return;
    try {
      await api.matchProfile(currentProfile.user_id);
      onProfileAction?.();
      moveToNext();
    } catch (error) {
      console.error('Failed to match:', error);
    }
  };

  const handleAskQuestion = async () => {
    if (!currentProfile || !questionText.trim()) return;
    try {
      await api.askQuestion(currentProfile.user_id, questionText);
      setQuestionText('');
      setShowQuestionInput(false);
      onProfileAction?.();
      moveToNext();
    } catch (error) {
      console.error('Failed to ask question:', error);
    }
  };

  const moveToNext = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowQuestionInput(false);
      setQuestionText('');
    } else {
      // Reload feed when we reach the end
      loadFeed();
    }
  };

  if (isLoading) {
    return <div className="content-container"><div className="loading">Loading...</div></div>;
  }

  if (!currentProfile) {
    return (
      <div className="content-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', padding: '80px 16px' }}>
        <div className="glass-card liquidGlass-wrapper">
          <div className="liquidGlass-effect"></div>
          <div className="liquidGlass-tint"></div>
          <div className="liquidGlass-shine"></div>
          <div style={{ zIndex: 3, position: 'relative', textAlign: 'center', width: '100%' }}>
            <h2 style={{ margin: '0 0 10px 0' }}>No more profiles!</h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
              Check back later
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <div
        className="liquidGlass-wrapper"
        style={{
          display: 'inline-flex',
          padding: '0.5rem 1rem',
          borderRadius: '1rem',
          marginBottom: '1rem',
          cursor: 'default'
        }}
      >
        <div className="liquidGlass-effect"></div>
        <div className="liquidGlass-tint"></div>
        <div className="liquidGlass-shine"></div>
        <div
          style={{
            zIndex: 3,
            position: 'relative',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          Profile {currentIndex + 1} of {profiles.length}
        </div>
      </div>

      <div className="glass-card liquidGlass-wrapper">
        <div className="liquidGlass-effect"></div>
        <div className="liquidGlass-tint"></div>
        <div className="liquidGlass-shine"></div>
        <div style={{ zIndex: 3, position: 'relative' }}>
          {currentProfile.qa_pairs.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.8)' }}>
              This profile has no answers yet. Be the first to ask a question!
            </p>
          ) : (
            <div>
              {currentProfile.qa_pairs.map((qa) => (
                <div key={qa.question_id} className="qa-pair">
                  <div className="qa-question">{qa.question_text}</div>
                  <hr style={{
                    margin: '0.5rem 0',
                    border: 'none',
                    borderTop: '1px solid rgba(255, 255, 255, 0.3)'
                  }} />
                  <div className="qa-answer">{qa.answer_text}</div>
                  <div className="qa-date">
                    {new Date(qa.answered_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showQuestionInput && (
        <div className="glass-card-small liquidGlass-wrapper">
          <div className="liquidGlass-effect"></div>
          <div className="liquidGlass-tint"></div>
          <div className="liquidGlass-shine"></div>
          <div style={{ zIndex: 3, position: 'relative', width: '100%' }}>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question..."
              className="glass-textarea"
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}

      <div className="action-dock">
        <div className="dock liquidGlass-wrapper">
          <div className="liquidGlass-effect"></div>
          <div className="liquidGlass-tint"></div>
          <div className="liquidGlass-shine"></div>
          <div style={{ zIndex: 3, display: 'flex', gap: '8px' }}>
            {!showQuestionInput ? (
              <>
                <button
                  onClick={handleSkip}
                  className="button-small liquidGlass-wrapper"
                  style={{ border: 'none', background: 'rgba(220, 53, 69, 0.3)' }}
                >
                  <div className="liquidGlass-effect"></div>
                  <div className="liquidGlass-tint"></div>
                  <div className="liquidGlass-shine"></div>
                  <div className="liquidGlass-text" style={{ fontSize: '0.9rem' }}>Skip</div>
                </button>
                <button
                  onClick={() => {
                    setShowQuestionInput(true);
                    setTimeout(() => {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }, 100);
                  }}
                  className="button-small liquidGlass-wrapper"
                  style={{ border: 'none', background: 'rgba(255, 193, 7, 0.3)' }}
                >
                  <div className="liquidGlass-effect"></div>
                  <div className="liquidGlass-tint"></div>
                  <div className="liquidGlass-shine"></div>
                  <div className="liquidGlass-text" style={{ fontSize: '0.9rem' }}>Ask</div>
                </button>
                <button
                  onClick={handleMatch}
                  className="button-small liquidGlass-wrapper"
                  style={{ border: 'none', background: 'rgba(40, 167, 69, 0.3)' }}
                >
                  <div className="liquidGlass-effect"></div>
                  <div className="liquidGlass-tint"></div>
                  <div className="liquidGlass-shine"></div>
                  <div className="liquidGlass-text" style={{ fontSize: '0.9rem' }}>Match</div>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowQuestionInput(false)}
                  className="button-small liquidGlass-wrapper"
                  style={{ border: 'none', background: 'rgba(220, 53, 69, 0.3)' }}
                >
                  <div className="liquidGlass-effect"></div>
                  <div className="liquidGlass-tint"></div>
                  <div className="liquidGlass-shine"></div>
                  <div className="liquidGlass-text" style={{ fontSize: '0.9rem' }}>Cancel</div>
                </button>
                <button
                  onClick={handleAskQuestion}
                  disabled={!questionText.trim()}
                  className="button-small liquidGlass-wrapper"
                  style={{ border: 'none', background: 'rgba(40, 167, 69, 0.3)' }}
                >
                  <div className="liquidGlass-effect"></div>
                  <div className="liquidGlass-tint"></div>
                  <div className="liquidGlass-shine"></div>
                  <div className="liquidGlass-text" style={{ fontSize: '0.9rem' }}>Send</div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
