import axios from '@/core/src/http';

export const searchMcpServers = (params) => axios.post('/mcp/server/search', params);

export const createMcpServer = (params) => axios.post('/mcp/server/create', params);

export const updateMcpServer = (params) => axios.put('/mcp/server/update', params);

export const deleteMcpServer = (id: string) => axios.delete(`/mcp/server/delete/${id}`);

export const healthCheckMcpServer = (id: string) => axios.post(`/mcp/server/${id}/health-check`);

export const listDiscoveredTools = (id: string) => axios.get(`/mcp/server/${id}/discovered-tools`);

export const importMcpTools = (id: string, tools: any[]) =>
  axios.post(`/mcp/server/${id}/tools/import`, tools);

export default {
  searchMcpServers,
  createMcpServer,
  updateMcpServer,
  deleteMcpServer,
  healthCheckMcpServer,
  listDiscoveredTools,
  importMcpTools,
};

