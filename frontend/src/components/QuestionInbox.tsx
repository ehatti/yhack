import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Question } from '../types';

interface QuestionInboxProps {
  onQuestionAction?: () => void;
}

export default function QuestionInbox({ onQuestionAction }: QuestionInboxProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    setIsLoading(true);
    try {
      const response = await api.getQuestionInbox();
      setQuestions(response.questions);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to load inbox:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async () => {
    if (!currentQuestion || !answerText.trim()) return;
    try {
      await api.answerQuestion(currentQuestion.question_id, answerText);
      setAnswerText('');
      onQuestionAction?.();
      moveToNext();
    } catch (error) {
      console.error('Failed to answer question:', error);
    }
  };

  const handleDecline = async () => {
    if (!currentQuestion) return;
    try {
      await api.declineQuestion(currentQuestion.question_id);
      onQuestionAction?.();
      moveToNext();
    } catch (error) {
      console.error('Failed to decline question:', error);
    }
  };

  const moveToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswerText('');
    } else {
      // Reload inbox when we reach the end
      loadInbox();
    }
  };

  if (isLoading) {
    return <div className="content-container"><div className="loading">Loading...</div></div>;
  }

  if (!currentQuestion) {
    return (
      <div className="content-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', padding: '80px 16px' }}>
        <div className="glass-card liquidGlass-wrapper">
          <div className="liquidGlass-effect"></div>
          <div className="liquidGlass-tint"></div>
          <div className="liquidGlass-shine"></div>
          <div style={{ zIndex: 3, position: 'relative', textAlign: 'center', width: '100%' }}>
            <h2 style={{ margin: '0 0 10px 0' }}>No pending questions!</h2>
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
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="glass-card liquidGlass-wrapper">
        <div className="liquidGlass-effect"></div>
        <div className="liquidGlass-tint"></div>
        <div className="liquidGlass-shine"></div>
        <div style={{ zIndex: 3, position: 'relative', width: '100%' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '1.1rem', color: 'white', textAlign: 'left' }}>
            {currentQuestion.question_text}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '15px', textAlign: 'left' }}>
            Asked on {new Date(currentQuestion.created_at).toLocaleString()}
          </div>

          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Type your answer..."
            rows={5}
            className="glass-textarea"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div className="action-dock">
        <div className="dock liquidGlass-wrapper">
          <div className="liquidGlass-effect"></div>
          <div className="liquidGlass-tint"></div>
          <div className="liquidGlass-shine"></div>
          <div style={{ zIndex: 3, display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDecline}
              className="button-small liquidGlass-wrapper"
              style={{ border: 'none', background: 'rgba(220, 53, 69, 0.3)' }}
            >
              <div className="liquidGlass-effect"></div>
              <div className="liquidGlass-tint"></div>
              <div className="liquidGlass-shine"></div>
              <div className="liquidGlass-text" style={{ fontSize: '0.9rem' }}>Decline</div>
            </button>
            <button
              onClick={handleAnswer}
              disabled={!answerText.trim()}
              className="button-small liquidGlass-wrapper"
              style={{ border: 'none', background: 'rgba(40, 167, 69, 0.3)' }}
            >
              <div className="liquidGlass-effect"></div>
              <div className="liquidGlass-tint"></div>
              <div className="liquidGlass-shine"></div>
              <div className="liquidGlass-text" style={{ fontSize: '0.9rem' }}>Answer</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
