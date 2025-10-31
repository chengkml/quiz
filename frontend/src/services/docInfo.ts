import http from '@/utils/request';

// 获取文档详情
export const getDocInfoDetail = async (docId: string) => {
  return http.get(`/docinfo/${docId}`);
};

// 获取文档标题树
export const getDocHeadingTree = async (docId: string) => {
  return http.get(`/docinfo/${docId}/headings`);
};

// 根据标题获取文档内容
export const getDocContentByHeading = async (docId: string, headingId: string) => {
  return http.get(`/docinfo/${docId}/content`, { params: { headingId } });
};

// 其他文档信息相关的API函数
export const getAllDocInfo = async (params?: any) => {
  return http.get('/docinfo', { params });
};

export const createDocInfo = async (data: any) => {
  return http.post('/docinfo', data);
};

export const updateDocInfo = async (id: string, data: any) => {
  return http.put(`/docinfo/${id}`, data);
};

export const deleteDocInfo = async (id: string) => {
  return http.delete(`/docinfo/${id}`);
};

export const uploadDocFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/docinfo/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};