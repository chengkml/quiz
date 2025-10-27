import axios from '@/core/src/http';
import { MindMapData } from '../types';

const base = '/quiz';

// 获取思维导图列表（分页查询）
const getMindMapList = params => axios.get(`${base}/api/mindmap`, {params});

// 获取思维导图详情
const getMindMapById = id => axios.get(`${base}/api/mindmap/${id}`);

// 创建思维导图
const createMindMap = params => axios.post(`${base}/api/mindmap/create`, params);

// 更新思维导图
const updateMindMap = params => axios.put(`${base}/api/mindmap/update`, params);

// 删除思维导图
const deleteMindMap = async id => {
  console.log('调用删除接口，ID:', id);
  try {
    const response = await axios.delete(`${base}/api/mindmap/${id}`);
    console.log('删除接口响应:', response);
    return response;
  } catch (error) {
    console.error('删除接口调用失败:', error);
    throw error;
  }
};

// 获取当前用户的思维导图列表
const getUserMindMaps = () => axios.get(`${base}/api/mindmap/user/mine`);

// 获取共享的思维导图列表
const getSharedMindMaps = () => axios.get(`${base}/api/mindmap/shared`);

// 解析思维导图数据
const parseMindMapData = (mapData: string): MindMapData => {
  try {
    return JSON.parse(mapData);
  } catch (error) {
    // 返回默认的思维导图数据结构
    return {
      nodeData: {
        id: 'root',
        topic: '思维导图',
        root: true,
      },
      nodeChild: [],
    };
  }
};

// 格式化思维导图数据为字符串
const formatMindMapData = (data: MindMapData): string => {
  return JSON.stringify(data);
};

export {
  getMindMapList,
  getMindMapById,
  createMindMap,
  updateMindMap,
  deleteMindMap,
  getUserMindMaps,
  getSharedMindMaps,
  parseMindMapData,
  formatMindMapData
};