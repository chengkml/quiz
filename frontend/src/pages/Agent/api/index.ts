import axios from '@/core/src/http';

// 智能体 CRUD
export const createAgent = (params: any) => axios.post('/agent/create', params);

export const updateAgent = (params: any) => axios.put('/agent/update', params);

export const deleteAgent = (id: string) => axios.delete(`/agent/delete/${id}`);

export const getAgent = (id: string) => axios.get(`/agent/get/${id}`);

export const searchAgents = (params: any) => axios.post('/agent/search', params);

export const listAgents = () => axios.get('/agent/list');

// 状态管理
export const enableAgent = (id: string) => axios.post(`/agent/${id}/enable`);

export const disableAgent = (id: string) => axios.post(`/agent/${id}/disable`);

export const duplicateAgent = (id: string) => axios.post(`/agent/${id}/duplicate`);

// 工具管理
export const getAgentTools = (agentId: string) => axios.get(`/agent/${agentId}/tools`);

export const updateAgentTools = (agentId: string, tools: any[]) =>
  axios.put(`/agent/${agentId}/tools`, { tools });

// 辅助接口 - 获取可用的MCP工具、提示词模板、LLM模型
export const listEnabledMcpTools = () => axios.get('/mcp/tool/list');

export const listPromptTemplates = () => axios.get('/prompt/template/list');

export const listLlmModels = () => axios.get('/llm-model/list');

export const listEnabledAgents = () => axios.get('/agent/list-enabled');

export default {
  createAgent,
  updateAgent,
  deleteAgent,
  getAgent,
  searchAgents,
  listAgents,
  enableAgent,
  disableAgent,
  duplicateAgent,
  getAgentTools,
  updateAgentTools,
  listEnabledMcpTools,
  listPromptTemplates,
  listLlmModels,
  listEnabledAgents,
};
