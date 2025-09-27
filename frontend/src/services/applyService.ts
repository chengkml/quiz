import { ApiResponse, PageResponse } from '../types/common';
import {
  ApplyDto,
  ApplyQueryParams,
  ApplyCreateParams,
  ApplyUpdateParams,
  ApplyApprovalParams,
} from '../types/apply';

/**
 * 申请服务类
 */
export class ApplyService {
  private static readonly BASE_URL = '/data_synth/api/apply';

  /**
   * 获取申请列表
   */
  static async getApplies(params: ApplyQueryParams): Promise<ApiResponse<PageResponse<ApplyDto>>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.applyTitle) queryParams.append('title', params.applyTitle);
    if (params.applyUser) queryParams.append('applyUser', params.applyUser);
    if (params.modelId) queryParams.append('modelId', params.modelId);
    if (params.states && params.states.length > 0) queryParams.append('state', params.states[0]);

    const response = await fetch(`${this.BASE_URL}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 根据ID获取申请详情
   */
  static async getApplyById(applyId: string): Promise<ApiResponse<ApplyDto>> {
    const response = await fetch(`${this.BASE_URL}/${applyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 创建申请
   */
  static async createApply(params: ApplyCreateParams): Promise<ApiResponse<ApplyDto>> {
    const response = await fetch(`${this.BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 更新申请
   */
  static async updateApply(params: ApplyUpdateParams): Promise<ApiResponse<ApplyDto>> {
    const response = await fetch(`${this.BASE_URL}/${params.applyId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 删除申请
   */
  static async deleteApply(applyId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.BASE_URL}/${applyId}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 审批申请
   */
  static async approveApply(params: ApplyApprovalParams): Promise<ApiResponse<ApplyDto>> {
    const endpoint = params.result === 'Approved' ? 'approve' : 'reject';
    const queryParams = new URLSearchParams();
    if (params.comment) {
      queryParams.append('comment', params.comment);
    }

    const response = await fetch(`${this.BASE_URL}/${params.applyId}/${endpoint}?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 取消申请
   */
  static async cancelApply(applyId: string): Promise<ApiResponse<ApplyDto>> {
    const response = await fetch(`${this.BASE_URL}/${applyId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 重新提交申请
   */
  static async resubmitApply(applyId: string): Promise<ApiResponse<ApplyDto>> {
    const response = await fetch(`${this.BASE_URL}/${applyId}/resubmit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 获取申请列表（不分页）
   */
  static async getApplyList(params: ApplyQueryParams): Promise<ApiResponse<ApplyDto[]>> {
    const queryParams = new URLSearchParams();
    if (params.applyTitle) queryParams.append('title', params.applyTitle);
    if (params.applyUser) queryParams.append('applyUser', params.applyUser);
    if (params.modelId) queryParams.append('modelId', params.modelId);
    if (params.states && params.states.length > 0) queryParams.append('state', params.states[0]);
    if (params.keyword) queryParams.append('keyword', params.keyword);

    const endpoint = params.keyword ? '/search' : '';
    const response = await fetch(`${this.BASE_URL}${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 获取当前用户的申请列表
   */
  static async getMyApplies(currentUser: string, page: number = 0, size: number = 10, searchParams?: Partial<ApplyQueryParams>): Promise<ApiResponse<PageResponse<ApplyDto>>> {
    const queryParams = new URLSearchParams();
    queryParams.append('currentUser', currentUser);
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());
    
    // 添加搜索参数
    if (searchParams) {
      if (searchParams.applyTitle) queryParams.append('applyTitle', searchParams.applyTitle);
      if (searchParams.jobCode) queryParams.append('jobCode', searchParams.jobCode);
      if (searchParams.states && searchParams.states.length > 0) queryParams.append('state', searchParams.states[0].toString());
      if (searchParams.keyword) queryParams.append('modelName', searchParams.keyword);
      if (searchParams.applyType) queryParams.append('applyType', searchParams.applyType);
    }

    const response = await fetch(`${this.BASE_URL}/my?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 获取待审批的申请列表
   */
  static async getPendingApplies(page: number = 0, size: number = 10): Promise<ApiResponse<PageResponse<ApplyDto>>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());

    const response = await fetch(`${this.BASE_URL}/pending?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 获取申请统计信息
   */
  static async getApplyStatistics(): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.BASE_URL}/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 获取用户申请统计信息
   */
  static async getUserApplyStatistics(applyUser: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.BASE_URL}/statistics/user/${applyUser}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 获取模型申请统计信息
   */
  static async getModelApplyStatistics(modelId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.BASE_URL}/statistics/model/${modelId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 检查申请标题是否存在
   */
  static async checkApplyTitle(applyTitle: string): Promise<ApiResponse<boolean>> {
    const queryParams = new URLSearchParams();
    queryParams.append('applyTitle', applyTitle);

    const response = await fetch(`${this.BASE_URL}/check-title?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 获取申请人列表
   */
  static async getApplyUsers(): Promise<ApiResponse<string[]>> {
    const response = await fetch(`${this.BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 获取目标方式列表
   */
  static async getTargetTypes(): Promise<ApiResponse<string[]>> {
    const response = await fetch(`${this.BASE_URL}/target-types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 验证申请操作权限
   */
  static async getApplyPermissions(applyId: string, currentUser: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append('currentUser', currentUser);

    const response = await fetch(`${this.BASE_URL}/${applyId}/permissions?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}