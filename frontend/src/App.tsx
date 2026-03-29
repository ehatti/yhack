import { useState, useEffect } from 'react';
import AuthFlow from './components/AuthFlow';
import ProfileFeed from './components/ProfileFeed';
import QuestionInbox from './components/QuestionInbox';
import MeetupsView from './components/MeetupsView';
import { api, clearAuthToken } from './api';

type View = 'feed' | 'inbox' | 'meetups';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('feed');
  const [profileCount, setProfileCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [meetupCount, setMeetupCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadCounts();
      // Refresh counts every 30 seconds
      const interval = setInterval(loadCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+Shift+L to reset auth cookie
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        clearAuthToken();
        setIsAuthenticated(false);
        console.log('Auth cookie cleared');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const loadCounts = async () => {
    try {
      const [feedResponse, inboxResponse, meetupsResponse] = await Promise.all([
        api.getFeed(),
        api.getQuestionInbox(),
        api.getMyMatches()
      ]);
      setProfileCount(feedResponse.profiles.length);
      setQuestionCount(inboxResponse.questions.length);
      setMeetupCount(meetupsResponse.matches.length);
    } catch (error) {
      console.error('Failed to load counts:', error);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    // Refresh counts when switching views
    loadCounts();
  };

  const decrementProfileCount = () => {
    setProfileCount(prev => Math.max(0, prev - 1));
  };

  const decrementQuestionCount = () => {
    setQuestionCount(prev => Math.max(0, prev - 1));
  };

  const decrementMeetupCount = () => {
    setMeetupCount(prev => Math.max(0, prev - 1));
  };

  if (!isAuthenticated) {
    return <AuthFlow onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div>
      {currentView === 'feed' && <ProfileFeed onProfileAction={decrementProfileCount} />}
      {currentView === 'inbox' && <QuestionInbox onQuestionAction={decrementQuestionCount} />}
      {currentView === 'meetups' && <MeetupsView onMeetupAction={decrementMeetupCount} />}

      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '15px',
        zIndex: 1001
      }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => handleViewChange('feed')}
            className="liquidGlass-wrapper"
            style={{
              border: 'none',
              padding: '15px',
              borderRadius: '1rem',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: currentView === 'feed' ? 'rgba(100, 150, 255, 0.4)' : 'rgba(255, 255, 255, 0.25)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.padding = '18px';
              e.currentTarget.style.width = '66px';
              e.currentTarget.style.height = '66px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.padding = '15px';
              e.currentTarget.style.width = '60px';
              e.currentTarget.style.height = '60px';
            }}
          >
            <div className="liquidGlass-effect"></div>
            <div className="liquidGlass-tint"></div>
            <div className="liquidGlass-shine"></div>
            <svg
              style={{ zIndex: 3, position: 'relative' }}
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          {profileCount > 0 && (
            <div className="badge">{profileCount}</div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => handleViewChange('inbox')}
            className="liquidGlass-wrapper"
            style={{
              border: 'none',
              padding: '15px',
              borderRadius: '1rem',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: currentView === 'inbox' ? 'rgba(100, 150, 255, 0.4)' : 'rgba(255, 255, 255, 0.25)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.padding = '18px';
              e.currentTarget.style.width = '66px';
              e.currentTarget.style.height = '66px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.padding = '15px';
              e.currentTarget.style.width = '60px';
              e.currentTarget.style.height = '60px';
            }}
          >
            <div className="liquidGlass-effect"></div>
            <div className="liquidGlass-tint"></div>
            <div className="liquidGlass-shine"></div>
            <svg
              style={{ zIndex: 3, position: 'relative' }}
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </button>
          {questionCount > 0 && (
            <div className="badge">{questionCount}</div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => handleViewChange('meetups')}
            className="liquidGlass-wrapper"
            style={{
              border: 'none',
              padding: '15px',
              borderRadius: '1rem',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: currentView === 'meetups' ? 'rgba(100, 150, 255, 0.4)' : 'rgba(255, 255, 255, 0.25)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.padding = '18px';
              e.currentTarget.style.width = '66px';
              e.currentTarget.style.height = '66px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.padding = '15px';
              e.currentTarget.style.width = '60px';
              e.currentTarget.style.height = '60px';
            }}
          >
            <div className="liquidGlass-effect"></div>
            <div className="liquidGlass-tint"></div>
            <div className="liquidGlass-shine"></div>
            <svg
              style={{ zIndex: 3, position: 'relative' }}
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
          {meetupCount > 0 && (
            <div className="badge">{meetupCount}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
