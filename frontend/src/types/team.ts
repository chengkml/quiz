// 团队数据传输对象
export interface TeamDto {
  teamId: string;
  teamName: string;
  label: string;
  parentTeamId?: string;
  descr?: string;
  state: string; // '1' 生效, '0' 失效
  createTime?: string;
  updateTime?: string;
  children?: TeamDto[];
}

// 团队成员数据传输对象
export interface TeamMemberDto {
  memberId: string;
  userId: string;
  userName: string; // 用户名（从modo_user表获取）
  memberName: string;
  teamName: string;
  roleName: string; // 角色名称
  roleLabel: string; // 角色标签（从modo_user_role表获取）
  state: string; // '1' 生效, '0' 失效
  createDt?: string;
  createUser?: string;
  lastupd?: string;
  updateUser?: string;
  version?: number;
}

// 团队树节点
export interface TeamTreeNode {
  key: string;
  title: string;
  children?: TeamTreeNode[];
  teamId: string;
  teamName: string;
  label: string;
  parentTeamId?: string;
  descr?: string;
  state: string;
}

// API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: number;
}

// 分页参数
export interface PageParams {
  current: number;
  pageSize: number;
  total?: number;
}

// 团队查询参数
export interface TeamQueryParams extends PageParams {
  teamName?: string;
  state?: string;
  teamId?: string;
}

// 成员查询参数
export interface MemberQueryParams extends PageParams {
  teamId?: string;
  userName?: string;
  userRole?: string;
  state?: string;
}