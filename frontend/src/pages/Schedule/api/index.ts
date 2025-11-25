import axios from '@/core/src/http';

const base = '/quiz';

// 获取日程列表
export const getScheduleList = (params) => axios.post(`${base}/api/schedule/search`, params);

// 获取日程详情
export const getScheduleById = (id: string) => axios.get(`${base}/api/schedule/${id}`);

// 创建日程
export const createSchedule = (params) => axios.post(`${base}/api/schedule/create`, params);

// 更新日程
export const updateSchedule = (params) => axios.put(`${base}/api/schedule/update`, params);

// 删除日程
export const deleteSchedule = (id: string) => axios.delete(`${base}/api/schedule/${id}`);

// 根据日期范围获取日程
export const getSchedulesByDateRange = (startDate: string, endDate: string) => 
  axios.get(`${base}/api/schedule/range`, { params: { startDate, endDate } });

export default {
  getScheduleList,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDateRange,
};
