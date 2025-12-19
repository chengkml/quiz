import axios from '@/core/src/http';

// 获取用户消息列表
export const getMessageList = (params: { page: number; size: number }) => 
  axios.get('/system-message/list', { params });

// 获取未读消息列表
export const getUnreadMessages = (params: { page: number; size: number }) => 
  axios.get('/system-message/unread', { params });

// 获取未读消息数
export const getUnreadCount = () => 
  axios.get('/system-message/unread/count');

// 获取消息详情
export const getMessageDetail = (messageId: string) => 
  axios.get(`/system-message/${messageId}`);

// 标记消息为已读
export const markAsRead = (messageId: string) => 
  axios.put(`/system-message/${messageId}/read`);

// 标记所有消息为已读
export const markAllAsRead = () => 
  axios.put('/system-message/read-all');

// 删除消息
export const deleteMessage = (messageId: string) => 
  axios.delete(`/system-message/${messageId}`);

// 删除所有消息
export const deleteAllMessages = () => 
  axios.delete('/system-message/delete-all');

// 发送系统消息（管理员）
export const sendMessage = (params: {
  userIds?: string[];
  title: string;
  content: string;
  type?: string;
}) => axios.post('/system-message/send', params);

export default {
  getMessageList,
  getUnreadMessages,
  getUnreadCount,
  getMessageDetail,
  markAsRead,
  markAllAsRead,
  deleteMessage,
  deleteAllMessages,
  sendMessage,
};
