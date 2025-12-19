import axios from '@/core/src/http';

export interface SendNotificationPayload {
  channel: 'SMS' | 'BROWSER' | 'EMAIL';
  title?: string;
  content: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  contentHtml?: string;
  linkUrl?: string;
  attachments?: File[];
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
  // 如果包含附件，使用 multipart/form-data
  if (data.attachments && data.attachments.length > 0) {
    const formData = new FormData();
    formData.append('channel', data.channel);
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.contentHtml) formData.append('contentHtml', data.contentHtml);
    if (data.linkUrl) formData.append('linkUrl', data.linkUrl);
    formData.append('recipients', JSON.stringify(data.recipients || []));
    if (data.cc) formData.append('cc', JSON.stringify(data.cc));
    if (data.bcc) formData.append('bcc', JSON.stringify(data.bcc));
    data.attachments.forEach((file) => formData.append('files', file));
    return axios.post('/notification/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  }
  // 默认走 JSON
  return axios.post('/notification/send', data).then(res => res.data);
};
