import http from '@/utils/request';

// 统计数据接口
export interface DashboardStats {
  // 各学科知识点数量统计
  knowledgeStats: {
    subjectName: string;
    count: number;
  }[];
  
  // 各学科题目数量统计
  questionStats: {
    subjectName: string;
    count: number;
  }[];
}

/**
 * 获取仪表盘统计数据
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // 模拟数据，实际项目中应该调用真实的API
    // const response = await http.get('/api/dashboard/stats');
    // return response.data;
    
    // 返回模拟数据
    return {
      knowledgeStats: [
        { subjectName: '数学', count: 156 },
        { subjectName: '语文', count: 128 },
        { subjectName: '英语', count: 142 },
        { subjectName: '物理', count: 98 },
        { subjectName: '化学', count: 87 },
        { subjectName: '生物', count: 76 },
      ],
      questionStats: [
        { subjectName: '数学', count: 567 },
        { subjectName: '语文', count: 489 },
        { subjectName: '英语', count: 512 },
        { subjectName: '物理', count: 345 },
        { subjectName: '化学', count: 298 },
        { subjectName: '生物', count: 267 },
      ]
    };
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
    // 返回默认数据以避免页面显示错误
    return {
      knowledgeStats: [],
      questionStats: []
    };
  }
};