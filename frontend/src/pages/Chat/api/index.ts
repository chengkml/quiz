import http from '@/core/src/http';

export const sendChatCompletion = (data: any) =>
  http.post('/chat/completions', data);

export const getChatSessions = (params?: any) =>
  http.get('/chat/sessions', { params });

export const getChatMessages = (sessionId: string, params?: any) =>
  http.get(`/chat/sessions/${sessionId}/messages`, { params });

export default {
  sendChatCompletion,
  getChatSessions,
  getChatMessages,
};

