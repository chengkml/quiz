import http from '@/core/src/http';

export const sendChatCompletion = (data: any) =>
  http.post('/chat/completions', data);

export const getChatSessions = (params?: any) =>
  http.get('/chat/sessions', { params });

export const getChatMessages = (sessionId: string, params?: any) =>
  http.get(`/chat/sessions/${sessionId}/messages`, { params });

export const getLLMModelsByType = (type: string) =>
  http.get(`/llm-model/list-by-type/${type}`);

export const fetchStream = async (
  url: string,
  data: any,
  onMessage: (content: string, response: any) => void,
  onDone: () => void,
  onError: (err: any) => void
) => {
  try {
    const token = localStorage.getItem('token');
    // @ts-ignore
    const baseURL = typeof __API_BASE_PATH__ !== 'undefined' ? __API_BASE_PATH__ : '/api';
    
    const response = await fetch(`${baseURL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }
    
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        onDone();
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim().startsWith('data:')) {
            const jsonStr = line.trim().substring(5).trim();
            if (jsonStr) {
                try {
                    const resData = JSON.parse(jsonStr);
                    // data 是 ChatCompletionResponse
                    if (resData.messages && resData.messages.length > 0) {
                        onMessage(resData.messages[0].content, resData);
                    }
                } catch (e) {
                    console.error('JSON parse error', e);
                }
            }
        }
      }
    }
  } catch (err) {
    onError(err);
  }
};

export default {
  sendChatCompletion,
  getChatSessions,
  getChatMessages,
  getLLMModelsByType,
  fetchStream,
};
