import axios from '@/core/src/http';

/**
 * 系统消息DTO
 */
export interface SystemMessageDto {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isRead: boolean;
  readDate?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  status: 'ACTIVE' | 'DELETED';
  senderId: string;
  linkUrl?: string;
  createDate: string;
  expireDate?: string;
}

/**
 * 发送系统消息请求DTO
 */
export interface SendSystemMessagePayload {
  userIds?: string[];
  title: string;
  content: string;
  type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  linkUrl?: string;
}

/**
 * 消息列表响应
 */
export interface MessageListResponse {
  content: SystemMessageDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * 获取用户消息列表
 */
export const getUserMessages = (page: number = 0, size: number = 20) =>
  axios.get('/system-message/list', { params: { page, size } }).then(res => res.data);

/**
 * 获取用户未读消息列表
 */
export const getUnreadMessages = (page: number = 0, size: number = 20) =>
  axios.get('/system-message/unread', { params: { page, size } }).then(res => res.data);

/**
 * 获取未读消息数
 */
export const getUnreadCount = () =>
  axios.get('/system-message/unread/count').then(res => res.data);

/**
 * 获取消息详情
 */
export const getMessageDetail = (messageId: string) =>
  axios.get(`/system-message/${messageId}`).then(res => res.data);

/**
 * 标记消息为已读
 */
export const markAsRead = (messageId: string) =>
  axios.put(`/system-message/${messageId}/read`).then(res => res.data);

/**
 * 标记所有消息为已读
 */
export const markAllAsRead = () =>
  axios.put('/system-message/read-all').then(res => res.data);

/**
 * 删除消息
 */
export const deleteMessage = (messageId: string) =>
  axios.delete(`/system-message/${messageId}`).then(res => res.data);

/**
 * 删除所有消息
 */
export const deleteAllMessages = () =>
  axios.delete('/system-message/delete-all').then(res => res.data);

/**
 * 发送系统消息（管理员接口）
 */
export const sendSystemMessage = (payload: SendSystemMessagePayload) =>
  axios.post('/system-message/send', payload).then(res => res.data);

/**
 * 实时获取消息发送日志（SSE）
 */
export const streamSendLogs = (jobId: string) => {
  const token = localStorage.getItem('token');
  const base = `/api/cron/job/logs/stream/${jobId}`;
  const url = token ? `${base}?token=${encodeURIComponent(token)}` : base;
  return new EventSource(url, { withCredentials: true });
};
