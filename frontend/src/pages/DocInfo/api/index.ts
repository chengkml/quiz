import axios from '@/core/src/http';

const base = '/quiz';

// 获取文档列表（分页查询）
const getDocInfoList = params => axios.get(`${base}/api/documents/page`, { params });

// 获取文档详情
const getDocInfoById = id => axios.get(`${base}/api/documents/${id}`);

// 创建文档
const createDocInfo = params => axios.post(`${base}/api/documents`, params);

// 更新文档
const updateDocInfo = params => axios.put(`${base}/api/documents`, params);

// 删除文档
const deleteDocInfo = id => axios.delete(`${base}/api/documents/${id}`);

// 上传文档文件
const uploadDocFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // 移除手动设置的 Content-Type，让浏览器自动设置，这样会包含正确的 boundary
    const response = await axios.post(`${base}/api/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // 添加响应类型配置
      responseType: 'json'
    });
    
    return response;
  } catch (error) {
    console.error('文件上传API错误:', error);
    throw error; // 重新抛出错误以便上层组件处理
  }
};

// 获取文档标题树
const getDocHeadingTree = id => axios.get(`${base}/api/documents/${id}/heading-tree`);

// 获取文档流程节点（分页查询）
const getDocProcessNodes = (docId, pageNum = 1, pageSize = 20, keyWord = '', headingId = '') => {
  return axios.get(`${base}/api/documents/${docId}/process-nodes/page`, {
    params: { pageNum, pageSize, keyWord, headingId }
  });
};

export {
  getDocInfoList,
  getDocInfoById,
  createDocInfo,
  updateDocInfo,
  deleteDocInfo,
  uploadDocFile,
  getDocHeadingTree,
  getDocProcessNodes
};