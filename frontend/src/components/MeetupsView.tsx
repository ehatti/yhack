import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Match } from '../types';

interface MeetupsViewProps {
  onMeetupAction?: () => void;
}

export default function MeetupsView({ onMeetupAction }: MeetupsViewProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const response = await api.getMyMatches();
      setMatches(response.matches);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [matchEmails, setMatchEmails] = useState<Record<string, string>>({});

  const handleSchedule = async (matchUserId: string) => {
    try {
      // Get matched user's email (fetch if not already cached)
      let email = matchEmails[matchUserId];
      if (!email) {
        const matchInfo = await api.getMatchInfo(matchUserId);
        email = matchInfo.email;
        setMatchEmails(prev => ({ ...prev, [matchUserId]: email }));
      }

      // Build minimal Google Calendar URL with just attendee
      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${encodeURIComponent('Meetup')}` +
        `&add=${encodeURIComponent(email)}`;

      // Open in new tab
      window.open(calendarUrl, '_blank');
    } catch (error) {
      console.error('Failed to open calendar:', error);
    }
  };

  // Fetch emails for all matches on load
  useEffect(() => {
    const fetchEmails = async () => {
      for (const match of matches) {
        try {
          const matchInfo = await api.getMatchInfo(match.user_id);
          setMatchEmails(prev => ({ ...prev, [match.user_id]: matchInfo.email }));
        } catch (error) {
          console.error('Failed to fetch email:', error);
        }
      }
    };
    if (matches.length > 0) {
      fetchEmails();
    }
  }, [matches]);

  if (isLoading) {
    return <div className="content-container"><div className="loading">Loading...</div></div>;
  }

  if (matches.length === 0) {
    return (
      <div className="content-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', padding: '80px 16px' }}>
        <div className="glass-card liquidGlass-wrapper">
          <div className="liquidGlass-effect"></div>
          <div className="liquidGlass-tint"></div>
          <div className="liquidGlass-shine"></div>
          <div style={{ zIndex: 3, position: 'relative', textAlign: 'center', width: '100%' }}>
            <h2 style={{ margin: '0 0 10px 0' }}>No matches yet!</h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
              Match with someone to schedule a meetup
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
          {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
        </div>
      </div>

      {matches.map((match) => (
        <div key={match.user_id} style={{ marginBottom: '1rem' }}>
          <div className="glass-card liquidGlass-wrapper">
            <div className="liquidGlass-effect"></div>
            <div className="liquidGlass-tint"></div>
            <div className="liquidGlass-shine"></div>
            <div style={{ zIndex: 3, position: 'relative', width: '100%' }}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '1rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1rem', wordBreak: 'break-word', flex: 1 }}>
                  {matchEmails[match.user_id] || 'Loading...'}
                </h3>
                <button
                  onClick={() => handleSchedule(match.user_id)}
                  className="button-small liquidGlass-wrapper"
                  style={{ border: 'none', background: 'rgba(40, 167, 69, 0.3)', flexShrink: 0 }}
                >
                  <div className="liquidGlass-effect"></div>
                  <div className="liquidGlass-tint"></div>
                  <div className="liquidGlass-shine"></div>
                  <div className="liquidGlass-text" style={{ fontSize: '0.9rem' }}>Schedule</div>
                </button>
              </div>

              {match.qa_pairs.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.8)' }}>
                  This match has no Q&A yet
                </p>
              ) : (
                <div>
                  {match.qa_pairs.map((qa) => (
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
        </div>
      ))}
    </div>
  );
}
