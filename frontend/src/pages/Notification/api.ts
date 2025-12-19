import { request } from '@/utils/request';

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
    return request.post('/notification/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  // 默认走 JSON
  return request.post('/notification/send', data);
};
