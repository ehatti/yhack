import type * as T from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
  return localStorage.getItem('session_id');
}

export function setAuthToken(token: string) {
  localStorage.setItem('session_id', token);
}

export function clearAuthToken() {
  localStorage.removeItem('session_id');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Auth (public routes)
  requestMagicLink: (email: string) =>
    request<T.RequestMagicLinkResponse>('/public/auth/request-magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifySession: (session_id: string) =>
    request<T.VerifySessionResponse>('/public/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ session_id }),
    }),

  // Profile feed (protected routes)
  getFeed: () => request<T.FeedResponse>('/protected/feed'),

  getMyProfile: () => request<T.MyProfileResponse>('/protected/profile/me'),

  skipProfile: (user_id: string) =>
    request<T.SuccessResponse>(`/protected/profile/${user_id}/skip`, {
      method: 'POST',
    }),

  matchProfile: (user_id: string) =>
    request<T.SuccessResponse>(`/protected/profile/${user_id}/match`, {
      method: 'POST',
    }),

  askQuestion: (user_id: string, question_text: string) =>
    request<T.SuccessResponse>(`/protected/profile/${user_id}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question_text }),
    }),

  // Questions (protected routes)
  getQuestionInbox: () => request<T.QuestionInboxResponse>('/protected/questions/inbox'),

  answerQuestion: (question_id: string, answer_text: string) =>
    request<T.SuccessResponse>(`/protected/questions/${question_id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer_text }),
    }),

  declineQuestion: (question_id: string) =>
    request<T.SuccessResponse>(`/protected/questions/${question_id}/decline`, {
      method: 'POST',
    }),

  // Meetups (protected routes)
  getMyMatches: () => request<T.MatchesResponse>('/protected/meetups'),

  scheduleMeetup: (req: T.ScheduleMeetupRequest) =>
    request<T.ScheduleMeetupResponse>('/protected/meetups/schedule', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  getMatchInfo: (user_id: string) =>
    request<T.MatchInfo>(`/protected/users/${user_id}/info`),
};
