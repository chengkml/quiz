import axios from '@/core/src/http';

const base = '/quiz';

// 获取数据源列表（分页查询）
export const getDatasourceList = (params) => axios.get(`${base}/api/datasource`, { params });

// 获取数据源详情
export const getDatasourceById = (id: string) => axios.get(`${base}/api/datasource/${id}`);

// 创建数据源
export const createDatasource = (params) => axios.post(`${base}/api/datasource/create`, params);

// 更新数据源
export const updateDatasource = (params) => axios.put(`${base}/api/datasource/update`, params);

// 删除数据源
export const deleteDatasource = (id: string) => axios.delete(`${base}/api/datasource/${id}`);

// 测试数据源连接
export const testConnection = (id: string) => axios.post(`${base}/api/datasource/${id}/test`);

// 采集数据源表结构
export const collectSchema = (id: string, schema?: string) => axios.get(`${base}/api/datasource/${id}/schema`, { params: { schema } });

// 获取schema列表
export const getSchemas = (id: string) => axios.get(`${base}/api/datasource/${id}/schemas`);