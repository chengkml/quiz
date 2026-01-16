import axios from '@/core/src/http';

export const searchMcpTools = (params) => axios.post('/mcp/tool/search', params);

export const createMcpTool = (params) => axios.post('/mcp/tool/create', params);

export const updateMcpTool = (params) => axios.put('/mcp/tool/update', params);

export const deleteMcpTool = (id: string) => axios.delete(`/mcp/tool/delete/${id}`);

export const enableMcpTool = (id: string) => axios.post(`/mcp/tool/${id}/enable`);

export const disableMcpTool = (id: string) => axios.post(`/mcp/tool/${id}/disable`);

export const cloneMcpToolConfig = (id: string, targetEnv: string) =>
  axios.put(`/mcp/tool/${id}/clone-config`, null, { params: { targetEnv } });

export const queryMcpToolMetrics = (id: string, params: any) =>
  axios.get(`/mcp/tool/${id}/metrics`, { params });

export const listRuntimeMcpTools = (env: string, appId?: string) =>
  axios.get('/runtime/mcp/tools', { params: { env, appId } });

export default {
  searchMcpTools,
  createMcpTool,
  updateMcpTool,
  deleteMcpTool,
  enableMcpTool,
  disableMcpTool,
  cloneMcpToolConfig,
  queryMcpToolMetrics,
  listRuntimeMcpTools,
};

