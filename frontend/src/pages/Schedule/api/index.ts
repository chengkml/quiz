import axios from '@/core/src/http';

const base = '/quiz';

// 获取日程列表（分页查询）
export const getScheduleList = (params) => axios.post(`${base}/api/calendar/search`, params);

// 获取日程详情
export const getScheduleById = (id: string) => axios.get(`${base}/api/calendar/${id}`);

// 创建日程
export const createSchedule = (params) => axios.post(`${base}/api/calendar/create`, params);

// 更新日程
export const updateSchedule = (params) => axios.put(`${base}/api/calendar/update`, params);

// 删除日程
export const deleteSchedule = (id: string) => axios.delete(`${base}/api/calendar/${id}`);

// 根据日期范围获取日程（使用查询接口限定时间范围）
export const getSchedulesByDateRange = (startDate: string, endDate: string) =>
  axios.post(`${base}/api/calendar/search`, {
    startTimeFrom: `${startDate}T00:00:00`,
    startTimeTo: `${endDate}T23:59:59`,
    pageNum: 0,
    pageSize: 500,
    sortColumn: 'start_time',
    sortType: 'asc',
  });

// 流式生成日程 - 前端通过 EventSource 连接该地址
export const streamGenerateEventUrl = (params: any) => {
  const qs = [];
  if (params.descr !== undefined) qs.push(`descr=${encodeURIComponent(params.descr)}`);
  return `${base}/api/calendar/generate/stream?${qs.join('&')}`;
};

export default {
  getScheduleList,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDateRange,
  streamGenerateEventUrl,
};
