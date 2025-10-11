import axios from 'axios';
import { 
  QuestionDto, 
  QuestionCreateDto, 
  QuestionUpdateDto, 
  QuestionQueryParams,
  PageResponse,
  ApiResponse,
  QuestionType
} from '../types/question';

// 配置axios实例
const api = axios.create({
  baseURL: '/quiz/api',
  timeout: 10000,
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权错误 - 清除所有用户相关信息
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('menuInfo');
      localStorage.removeItem('username');
      // 跳转到登录页面
      window.location.href = '/quiz/login';
    }
    return Promise.reject(error);
  }
);

export class QuestionService {
  
  /**
   * 创建题目
   */
  static async createQuestion(question: QuestionCreateDto): Promise<ApiResponse<QuestionDto>> {
    const response = await api.post('/questions', question);
    return response.data;
  }

  /**
   * 更新题目
   */
  static async updateQuestion(question: QuestionUpdateDto): Promise<ApiResponse<QuestionDto>> {
    const response = await api.put(`/questions/${question.id}`, question);
    return response.data;
  }

  /**
   * 删除题目
   */
  static async deleteQuestion(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  }

  /**
   * 根据ID获取题目
   */
  static async getQuestionById(id: string): Promise<ApiResponse<QuestionDto>> {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  }

  /**
   * 分页搜索题目
   */
  static async searchQuestions(params: QuestionQueryParams): Promise<PageResponse<QuestionDto>> {
    const response = await api.get('/questions/search', { params });
    return response.data;
  }

  /**
   * 根据类型获取题目
   */
  static async getQuestionsByType(type: QuestionType): Promise<ApiResponse<QuestionDto[]>> {
    const response = await api.get(`/questions/type/${type}`);
    return response.data;
  }

  /**
   * 根据难度等级获取题目
   */
  static async getQuestionsByDifficulty(level: number): Promise<ApiResponse<QuestionDto[]>> {
    const response = await api.get(`/questions/difficulty/${level}`);
    return response.data;
  }

  /**
   * 统计题目类型数量
   */
  static async countQuestionsByType(type: QuestionType): Promise<ApiResponse<number>> {
    const response = await api.get(`/questions/count/type/${type}`);
    return response.data;
  }

  /**
   * 统计难度等级数量
   */
  static async countQuestionsByDifficulty(level: number): Promise<ApiResponse<number>> {
    const response = await api.get(`/questions/count/difficulty/${level}`);
    return response.data;
  }

  /**
   * 获取所有题目类型统计
   */
  static async getTypeStatistics(): Promise<ApiResponse<Record<QuestionType, number>>> {
    const types = Object.values(QuestionType);
    const results: Record<QuestionType, number> = {} as Record<QuestionType, number>;
    
    for (const type of types) {
      try {
        const response = await this.countQuestionsByType(type);
        results[type] = response.data || 0;
      } catch (error) {
        results[type] = 0;
      }
    }
    
    return {
      success: true,
      data: results
    };
  }

  /**
   * 获取所有难度等级统计
   */
  static async getDifficultyStatistics(): Promise<ApiResponse<Record<number, number>>> {
    const levels = [1, 2, 3, 4, 5];
    const results: Record<number, number> = {};
    
    for (const level of levels) {
      try {
        const response = await this.countQuestionsByDifficulty(level);
        results[level] = response.data || 0;
      } catch (error) {
        results[level] = 0;
      }
    }
    
    return {
      success: true,
      data: results
    };
  }
}

export default QuestionService;