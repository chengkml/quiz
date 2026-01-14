import axios from '@/core/src/http';

export interface SysLogQueryParams {
  module?: string;
  action?: string;
  success?: boolean | string;
  requestUri?: string;
  pageNum?: number;
  pageSize?: number;
  sortColumn?: string;
  sortType?: 'asc' | 'desc';
}

export interface SysLogDto {
  id: string;
  module: string;
  action: string;
  requestUri?: string;
  requestMethod?: string;
  requestParams?: string;
  responseData?: string;
  success?: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  costTime?: number;
  createDate?: string;
  createUser?: string;
  createUserName?: string;
  updateDate?: string;
  updateUser?: string;
  updateUserName?: string;
}

export const searchSysLog = (params: SysLogQueryParams) => axios.post('/syslog/search', params);

export const getSysLogById = (id: string) => axios.get(`/syslog/get/${id}`);

export const deleteSysLog = (id: string) => axios.delete(`/syslog/delete/${id}`);

export default {
  searchSysLog,
  getSysLogById,
  deleteSysLog,
};

