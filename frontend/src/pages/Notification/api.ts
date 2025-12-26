// 异常通知日志相关接口
export function getErrorLogs(params: { page?: number; size?: number; keyWord?: string }) {
  return axios.get('/api/notification/log/error', { params });
}

export function retryErrorLog(id: number) {
  return axios.post(`/api/notification/log/retry/${id}`);
}
import axios from '@/core/src/http';

export interface SendNotificationPayload {
  userIds?: string[];
  title: string;
  content: string;
  type?: string;
  channel?: string;
}

export interface UserOption {
  userId: string;
  userName: string;
  email?: string;
  phone?: string;
  state?: string;
}

// 获取用户列表
export const getUserList = (params?: { name?: string; state?: string; page?: number; size?: number }) => 
  axios.get('/user/search', { params: { ...params, page: params?.page || 0, size: params?.size || 100 } }).then(res => res.data);

// 发送通知
export const sendNotification = (data: SendNotificationPayload) => {
  return axios.post('/notification/send', data).then(res => res.data);
};

