import axios from '@/core/src/http';
import {
  SystemParamDto,
  SystemParamCreateDto,
  SystemParamUpdateDto,
  SystemParamQueryDto,
  PageResponse,
  ApiResponse
} from '@/types/systemParam';

/**
 * 创建参数
 */
export const createParam = (data: SystemParamCreateDto): Promise<ApiResponse<SystemParamDto>> =>
  axios.post('/api/system-param/create', data);

/**
 * 更新参数
 */
export const updateParam = (data: SystemParamUpdateDto): Promise<ApiResponse<SystemParamDto>> =>
  axios.put('/api/system-param/update', data);

/**
 * 删除参数
 */
export const deleteParam = (id: string): Promise<ApiResponse> =>
  axios.delete(`/api/system-param/delete/${id}`);

/**
 * 根据ID查询参数
 */
export const getParamById = (id: string): Promise<ApiResponse<SystemParamDto>> =>
  axios.get(`/api/system-param/${id}`);

/**
 * 根据参数键查询参数
 */
export const getParamByKey = (paramKey: string): Promise<ApiResponse<SystemParamDto>> =>
  axios.get(`/api/system-param/key/${paramKey}`);

/**
 * 根据参数键获取参数值
 */
export const getParamValue = (paramKey: string, defaultValue?: string): Promise<ApiResponse<string>> => {
  const params = defaultValue ? { defaultValue } : {};
  return axios.get(`/api/system-param/value/${paramKey}`, { params });
};

/**
 * 分页查询参数
 */
export const searchParams = (params: SystemParamQueryDto): Promise<PageResponse<SystemParamDto>> =>
  axios.get('/api/system-param/search', { params });

/**
 * 根据分类查询所有参数
 */
export const getParamsByCategory = (category: string): Promise<ApiResponse<SystemParamDto[]>> =>
  axios.get(`/api/system-param/category/${category}`);

/**
 * 批量更新参数
 */
export const batchUpdateParams = (data: SystemParamUpdateDto[]): Promise<ApiResponse> =>
  axios.put('/api/system-param/batch-update', data);

/**
 * 重置参数为默认值
 */
export const resetParamToDefault = (id: string): Promise<ApiResponse<SystemParamDto>> =>
  axios.put(`/api/system-param/reset/${id}`);

export default {
  createParam,
  updateParam,
  deleteParam,
  getParamById,
  getParamByKey,
  getParamValue,
  searchParams,
  getParamsByCategory,
  batchUpdateParams,
  resetParamToDefault
};
