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

    const processLine = (line: string) => {
        if (!line.trim()) return;
        console.log('[SSE] Processing line:', line);
        if (line.trim().startsWith('data:')) {
            const jsonStr = line.trim().substring(5).trim();
            if (jsonStr === '[DONE]') return;
            if (jsonStr) {
                try {
                    const resData = JSON.parse(jsonStr);
                    console.log('[SSE] Parsed data:', resData);
                    // data 是 ChatCompletionResponse
                    if (resData.messages && resData.messages.length > 0) {
                        console.log('[SSE] Calling onMessage with content:', resData.messages[0].content);
                        onMessage(resData.messages[0].content, resData);
                    }
                } catch (e) {
                    console.error('JSON parse error', e);
                }
            }
        }
    };

    while (true) {
      const { value, done } = await reader.read();
      console.log('[SSE] reader.read() done:', done, 'value length:', value?.length);
      if (done) {
        if (buffer.trim()) {
            const lines = buffer.split('\n');
            lines.forEach(processLine);
        }
        onDone();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        processLine(line);
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
