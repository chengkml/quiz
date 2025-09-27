import { useState, useEffect, useCallback } from 'react';
import { Message } from '@arco-design/web-react';
import {
  TeamDto,
  TeamMemberDto,
  TeamTreeNode,
  TeamQueryParams,
  MemberQueryParams,
} from '../types/team';
import { teamService } from '../services/teamService';

// 团队树Hook
export const useTeamTree = () => {
  const [treeData, setTreeData] = useState<TeamTreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  // 转换团队数据为树节点
  const convertToTreeNode = (teams: TeamDto[]): TeamTreeNode[] => {
    return teams.map(team => ({
      key: team.teamId,
      title: team.label || team.teamName, // 优先显示label字段
      teamId: team.teamId,
      teamName: team.teamName,
      label: team.label,
      parentTeamId: team.parentTeamId,
      descr: team.descr,
      state: team.state,
      children: team.children ? convertToTreeNode(team.children) : undefined,
    }));
  };

  // 获取团队树
  const fetchTeamTree = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeamTree();
      if (response.success && response.data) {
        const treeNodes = convertToTreeNode(response.data);
        setTreeData(treeNodes);
      } else {
        Message.error(response.message || '获取团队树失败');
      }
    } catch (error) {
      console.error('获取团队树失败:', error);
      Message.error('获取团队树失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamTree();
  }, [fetchTeamTree]);

  return {
    treeData,
    loading,
    refresh: fetchTeamTree,
  };
};

// 团队列表Hook
export const useTeamList = (params: TeamQueryParams) => {
  const [data, setData] = useState<TeamDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchTeamList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeamList(params);
      if (response.success && response.data) {
        setData(response.data.list || []);
        setTotal(response.data.total || 0);
      } else {
        Message.error(response.message || '获取团队列表失败');
      }
    } catch (error) {
      console.error('获取团队列表失败:', error);
      Message.error('获取团队列表失败');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTeamList();
  }, [fetchTeamList]);

  return {
    data,
    total,
    loading,
    refresh: fetchTeamList,
  };
};

// 团队成员Hook
export const useTeamMembers = (teamName: string, params?: any) => {
  const [data, setData] = useState<TeamMemberDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchTeamMembers = useCallback(async () => {
    if (!teamName) {
      setData([]);
      setTotal(0);
      return;
    }

    try {
      setLoading(true);
      const response = await teamService.getTeamMembers(teamName, params);
      if (response.success && response.data) {
        setData(response.data.list || []);
        setTotal(response.data.total || 0);
      } else {
        Message.error(response.message || '获取团队成员失败');
      }
    } catch (error) {
      console.error('获取团队成员失败:', error);
      Message.error('获取团队成员失败');
    } finally {
      setLoading(false);
    }
  }, [teamName, params]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  return {
    data,
    total,
    loading,
    refresh: fetchTeamMembers,
  };
};

// 团队操作Hook
export const useTeamOperations = () => {
  // 删除团队
  const deleteTeam = async (teamId: string): Promise<boolean> => {
    try {
      const response = await teamService.deleteTeam(teamId);
      if (response.success) {
        Message.success('删除团队成功');
        return true;
      } else {
        Message.error(response.message || '删除团队失败');
        return false;
      }
    } catch (error) {
      console.error('删除团队失败:', error);
      Message.error('删除团队失败');
      return false;
    }
  };

  // 切换团队状态
  const toggleTeamState = async (teamId: string, state: string): Promise<boolean> => {
    try {
      const response = await teamService.toggleTeamState(teamId, state);
      if (response.success) {
        Message.success(`${state === '1' ? '启用' : '禁用'}团队成功`);
        return true;
      } else {
        Message.error(response.message || `${state === '1' ? '启用' : '禁用'}团队失败`);
        return false;
      }
    } catch (error) {
      console.error('切换团队状态失败:', error);
      Message.error('切换团队状态失败');
      return false;
    }
  };

  // 删除团队成员
  const deleteMember = async (memberId: string): Promise<boolean> => {
    try {
      const response = await teamService.deleteTeamMember(memberId);
      if (response.success) {
        Message.success('删除成员成功');
        return true;
      } else {
        Message.error(response.message || '删除成员失败');
        return false;
      }
    } catch (error) {
      console.error('删除成员失败:', error);
      Message.error('删除成员失败');
      return false;
    }
  };

  // 切换成员状态
  const toggleMemberState = async (memberId: string, state: string): Promise<boolean> => {
    try {
      const response = await teamService.toggleMemberState(memberId, state);
      if (response.success) {
        Message.success(`${state === '1' ? '启用' : '禁用'}成员成功`);
        return true;
      } else {
        Message.error(response.message || `${state === '1' ? '启用' : '禁用'}成员失败`);
        return false;
      }
    } catch (error) {
      console.error('切换成员状态失败:', error);
      Message.error('切换成员状态失败');
      return false;
    }
  };

  return {
    deleteTeam,
    toggleTeamState,
    deleteMember,
    toggleMemberState,
  };
};