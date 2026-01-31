import axios from '@/core/src/http';

// 获取数据源列表（分页查询）
export const getDatasourceList = (params: any) => axios.get('/datasource', { params });

// 获取数据源详情
export const getDatasourceById = (id: string) => axios.get(`/datasource/${id}`);

// 创建数据源
export const createDatasource = (params: any) => axios.post('/datasource/create', params);

// 更新数据源
export const updateDatasource = (params: any) => axios.put('/datasource/update', params);

// 删除数据源
export const deleteDatasource = (id: string) => axios.delete(`/datasource/${id}`);

// 测试数据源连接
export const testConnection = (id: string) => axios.post(`/datasource/${id}/test`);

// 校验数据源连接
export const validateConnection = (params: any) => axios.post('/datasource/validate', params);

// 执行SQL查询
export const executeSqlQuery = (id: string, sql: string) => axios.post(`/datasource/${id}/query`, { sql });

// 采集数据源表结构
export const collectSchema = (id: string, schema?: string) => axios.get(`/datasource/${id}/schema`, { params: { schema } });

// 获取schema列表
export const getSchemas = (id: string) => axios.get(`/datasource/${id}/schemas`);

// 导出表结构（JSON文件）
export const exportSchema = (id: string, schema?: string) => axios.get(`/datasource/${id}/schema/export`, { params: { schema }, responseType: 'blob' });

// 导出表结构（Excel文件）
export const exportSchemaExcel = (id: string, schema?: string) => axios.get(`/datasource/${id}/schema/export/excel`, { params: { schema }, responseType: 'blob' });