import axios from '@/core/src/http';

export const getKnowledgeSourceList = (params: any) => axios.post('/knowledge-source/search', params);
export const getKnowledgeSourceById = (id: string) => axios.get(`/knowledge-source/get/${id}`);
export const createKnowledgeSource = (params: any) => axios.post('/knowledge-source/create', params);
export const updateKnowledgeSource = (params: any) => axios.put('/knowledge-source/update', params);
export const deleteKnowledgeSource = (id: string) => axios.delete(`/knowledge-source/delete/${id}`);
export const testConnection = (params: any) => axios.post('/knowledge-source/test-connection', params);
