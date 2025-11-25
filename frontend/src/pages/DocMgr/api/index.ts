import axios from '@/core/src/http';

const base = '/quiz';

// 分页查询文档（POST search）
export const getDocList = (params) => axios.post(`${base}/api/doc/search`, params);

// 获取文档详情
export const getDocById = (id: string) => axios.get(`${base}/api/doc/${id}`);

// 创建文档
export const createDoc = (params) => axios.post(`${base}/api/doc/create`, params);

// 更新文档
export const updateDoc = (params) => axios.put(`${base}/api/doc/update`, params);

// 删除文档
export const deleteDoc = (id: string) => axios.delete(`${base}/api/doc/${id}`);

// 上传文档文件
export const uploadDocFile = (formData) => axios.post(`${base}/api/doc/upload`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export default {
  getDocList,
  getDocById,
  createDoc,
  updateDoc,
  deleteDoc,
  uploadDocFile,
};
