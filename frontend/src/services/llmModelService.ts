import http from '@/core/src/http';

export const getLLMModelsByType = (type: string) =>
  http.get(`/llm-model/list-by-type/${type}`);

export default {
  getLLMModelsByType,
};
