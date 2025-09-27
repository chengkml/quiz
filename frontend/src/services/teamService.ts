import axios from 'axios';
import {
  TeamDto,
  TeamMemberDto,
  ApiResponse,
  TeamQueryParams,
  MemberQueryParams,
} from '../types/team';

class TeamService {
  private baseURL = '/data_synth/api/team';

  // 获取团队树
  async getTeamTree(): Promise<ApiResponse<TeamDto[]>> {
    const response = await axios.get(`${this.baseURL}/tree`);
    return response.data;
  }

  // 获取团队列表
  async getTeamList(params: TeamQueryParams): Promise<ApiResponse<{
    list: TeamDto[];
    total: number;
  }>> {
    const response = await axios.get(`${this.baseURL}/list`, { params });
    return response.data;
  }

  // 创建团队
  async createTeam(team: Partial<TeamDto>): Promise<ApiResponse<TeamDto>> {
    const response = await axios.post(`${this.baseURL}/create`, team);
    return response.data;
  }

  // 更新团队
  async updateTeam(teamId: string, team: Partial<TeamDto>): Promise<ApiResponse<TeamDto>> {
    const response = await axios.post(`${this.baseURL}/${teamId}/update`, team);
    return response.data;
  }

  // 删除团队
  async deleteTeam(teamId: string): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/${teamId}/delete`);
    return response.data;
  }

  // 获取团队详情
  async getTeamDetail(teamId: string): Promise<ApiResponse<TeamDto>> {
    const response = await axios.get(`${this.baseURL}/${teamId}`);
    return response.data;
  }

  // 获取团队成员列表
  async getTeamMembers(teamName: string, params?: any): Promise<ApiResponse<{
    list: TeamMemberDto[];
    total: number;
  }>> {
    const response = await axios.get(`${this.baseURL}/name/${teamName}/members`, { params });
    return response.data;
  }

  // 创建团队成员
  async createTeamMember(member: Partial<TeamMemberDto>): Promise<ApiResponse<TeamMemberDto>> {
    const response = await axios.post(`${this.baseURL}/member/add`, member);
    return response.data;
  }

  // 更新团队成员角色
  async updateMemberRole(memberId: string, roleName: string): Promise<ApiResponse<TeamMemberDto>> {
    const response = await axios.post(`${this.baseURL}/member/${memberId}/role`, { roleName });
    return response.data;
  }

  // 更新团队成员（保留原方法名以兼容现有代码，但实际只能更新角色）
  async updateTeamMember(memberId: string, member: Partial<TeamMemberDto>): Promise<ApiResponse<TeamMemberDto>> {
    // 后端只支持更新角色，所以这里只提取角色信息
    const response = await axios.post(`${this.baseURL}/member/${memberId}/role`, { roleName: member.userRole });
    return response.data;
  }

  // 删除团队成员
  async deleteTeamMember(memberId: string): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/member/${memberId}/remove`);
    return response.data;
  }

  // 批量删除团队成员
  async batchDeleteTeamMembers(memberIds: string[]): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/member/batch-delete`, { memberIds });
    return response.data;
  }

  // 启用/禁用团队
  async toggleTeamState(teamId: string, state: string): Promise<ApiResponse<void>> {
    const response = await axios.put(`${this.baseURL}/${teamId}/state`, { state });
    return response.data;
  }

  // 启用/禁用团队成员
  async toggleMemberState(memberId: string, state: string): Promise<ApiResponse<void>> {
    const response = await axios.put(`${this.baseURL}/member/${memberId}/state`, { state });
    return response.data;
  }
}

export const teamService = new TeamService();