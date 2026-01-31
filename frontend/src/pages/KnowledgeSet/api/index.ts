import axios from '@/core/src/http';

export const getKnowledgeSetList = (params: any) => axios.post('/knowledge-set/search', params);
export const getKnowledgeSetById = (id: string) => axios.get(`/knowledge-set/get/${id}`);
export const createKnowledgeSet = (params: any) => axios.post('/knowledge-set/create', params);
export const updateKnowledgeSet = (params: any) => axios.put('/knowledge-set/update', params);
export const deleteKnowledgeSet = (id: string) => axios.delete(`/knowledge-set/delete/${id}`);

export const vectorSearch = (params: any) => axios.post('/vector/search', params);

export const getMyCreatedKnowledgeSets = (params: any) => axios.post('/knowledge-set/my-created', params);
export const getMyJoinedKnowledgeSets = (params: any) => axios.post('/knowledge-set/my-joined', params);
