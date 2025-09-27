/**
 * 申请相关的类型定义
 */

/**
 * 模型信息DTO
 */
export interface ModelInfoDto {
  /**
   * 模型ID
   */
  modelId: string;

  /**
   * 模型名称
   */
  modelName: string;

  /**
   * 模型描述
   */
  modelDesc: string;

  /**
   * 模型状态
   */
  state: string;

  /**
   * 创建用户
   */
  createUser: string;

  /**
   * 创建时间
   */
  createTime: string;
}

/**
 * 合成模型申请信息DTO
 */
export interface ApplyDto {
  /**
   * 申请ID
   */
  applyId: string;

  /**
   * 申请标题
   */
  applyTitle: string;

  /**
   * 申请时间
   */
  applyTime: string;

  /**
   * 申请人
   */
  applyUser: string;

  /**
   * 申请理由
   */
  applyDescr: string;

  /**
   * 状态，默认待处理，可取值如Pending, Approved, Rejected
   */
  state: string;

  /**
   * 状态描述
   */
  stateDesc: string;

  /**
   * 模型ID
   */
  modelId: string;

  /**
   * 模型名称
   */
  modelName: string;

  /**
   * 目标方式
   */
  targetType: string;

  /**
   * 目标数据源
   */
  targetDataSource: string;

  /**
   * 参数配置，用于存储模型使用相关的参数配置信息
   */
  paramsConf: Record<string, any>;

  /**
   * 申请类型
   */
  applyType: string;

  /**
   * 周期类型
   */
  cycleType: string;

  /**
   * 作业代码
   */
  jobCode?: string;

  /**
   * 团队名称
   */
  teamName?: string;

  /**
   * 是否可以编辑
   */
  canEdit: boolean;

  /**
   * 是否可以删除
   */
  canDelete: boolean;

  /**
   * 是否可以审批
   */
  canApprove: boolean;

  /**
   * 是否可以取消
   */
  canCancel: boolean;

  /**
   * 关联的模型信息
   */
  modelInfo?: ModelInfoDto;
}

/**
 * 申请查询参数
 */
export interface ApplyQueryParams {
  /**
   * 申请ID
   */
  applyId?: string;

  /**
   * 申请标题（模糊查询）
   */
  applyTitle?: string;

  /**
   * 申请人
   */
  applyUser?: string;

  /**
   * 状态列表
   */
  states?: string[];

  /**
   * 模型ID
   */
  modelId?: string;

  /**
   * 模型名称（模糊查询）
   */
  modelName?: string;

  /**
   * 申请时间开始
   */
  applyTimeStart?: string;

  /**
   * 申请时间结束
   */
  applyTimeEnd?: string;

  /**
   * 目标方式
   */
  targetType?: string;

  /**
   * 作业代码
   */
  jobCode?: string;

  /**
   * 团队名称
   */
  teamName?: string;

  /**
   * 关键词搜索
   */
  keyword?: string;

  /**
   * 页码，从1开始
   */
  page: number;

  /**
   * 每页大小
   */
  size: number;

  /**
   * 排序字段
   */
  sortBy?: string;

  /**
   * 排序方向：asc, desc
   */
  sortDir?: string;
}

/**
 * 申请创建参数
 */
export interface ApplyCreateParams {
  /**
   * 申请标题
   */
  applyTitle: string;

  /**
   * 申请人
   */
  applyUser: string;

  /**
   * 申请理由
   */
  applyDescr: string;

  /**
   * 模型ID
   */
  modelId: string;

  /**
   * 模型名称
   */
  modelName?: string;

  /**
   * 目标方式
   */
  targetType: string;

  /**
   * 目标数据源
   */
  targetDataSource: string;

  /**
   * 参数配置，用于存储模型使用相关的参数配置信息
   */
  paramsConf: Record<string, any>;

  /**
   * 申请类型
   */
  applyType: string;

  /**
   * 周期类型
   */
  cycleType: string;

  /**
   * 作业代码
   */
  jobCode?: string;

  /**
   * 团队名称
   */
  teamName?: string;
}

/**
 * 申请更新参数
 */
export interface ApplyUpdateParams {
  /**
   * 申请ID
   */
  applyId: string;

  /**
   * 申请标题
   */
  applyTitle?: string;

  /**
   * 申请理由
   */
  applyDescr?: string;

  /**
   * 状态，可取值如Pending, Approved, Rejected
   */
  state?: string;

  /**
   * 目标方式
   */
  targetType?: string;

  /**
   * 目标数据源
   */
  targetDataSource?: string;

  /**
   * 参数配置，用于存储模型使用相关的参数配置信息
   */
  paramsConf?: Record<string, any>;

  /**
   * 申请类型
   */
  applyType?: string;

  /**
   * 周期类型
   */
  cycleType?: string;

  /**
   * 作业代码
   */
  jobCode?: string;

  /**
   * 团队名称
   */
  teamName?: string;

  /**
   * 审批意见
   */
  approvalComment?: string;
}

/**
 * 申请审批参数
 */
export interface ApplyApprovalParams {
  /**
   * 申请ID
   */
  applyId: string;

  /**
   * 审批结果：Approved, Rejected
   */
  result: string;

  /**
   * 审批意见
   */
  comment?: string;
}