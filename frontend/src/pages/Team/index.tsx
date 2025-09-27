import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Select,
  Space,
  Message,
  Popconfirm,
  Tag,
  Grid,
  Pagination,
  Tooltip,
  Tree,
  Modal,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconEye,
  IconEyeInvisible,
  IconFolder,
  IconFile,
  IconSettings,
  IconSearch,
  IconExpand,
  IconShrink,
  IconUnlock,
  IconLock,
} from '@arco-design/web-react/icon';
import { TeamDto, TeamMemberDto, TeamQueryParams } from '../../types/team';
import { teamService } from '../../services/teamService';
import { RoleService } from '../../services/roleService';
import { RoleDto } from '../../types/role';
import CreateTeamModal from './components/CreateTeamModal';
import CreateMemberModal from './components/CreateMemberModal';
import EditTeamModal from './components/EditTeamModal';
import EditMemberModal from './components/EditMemberModal';
import TeamTree from './components/TeamTree';
import styles from './index.module.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;
const TreeNode = Tree.Node;

interface TeamMemberTableData extends TeamMemberDto {
  key: string;
}

const TeamManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberDto[]>([]);
  const [teamTree, setTeamTree] = useState<TeamDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [treeSearchValue, setTreeSearchValue] = useState('');
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createMemberModalVisible, setCreateMemberModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editMemberModalVisible, setEditMemberModalVisible] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<TeamDto | null>(null);
  const [currentMember, setCurrentMember] = useState<TeamMemberDto | null>(null);
  const [parentTeamId, setParentTeamId] = useState<string | undefined>(undefined);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // 状态选项
  const statusOptions = [
    { label: '全部', value: '' },
    { label: '生效', value: '1' },
    { label: '失效', value: '0' },
  ];

  // 获取团队树
  const fetchTeamTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const response = await teamService.getTeamTree();
      if (response.success) {
        setTeamTree(response.data);
        // 默认展开第一层
        const firstLevelKeys = response.data.map(item => item.teamId);
        setExpandedKeys(firstLevelKeys);
        
        // 如果没有选中的节点且有团队数据，自动选中第一个团队
        if (!selectedTreeNodeId && response.data.length > 0) {
          const firstTeamId = response.data[0].teamId;
          setSelectedTreeNodeId(firstTeamId);
        }
        
        return response.data; // 返回最新的团队数据
      } else {
        Message.error('获取团队树失败');
        return [];
      }
    } catch (error) {
      console.error('获取团队树失败:', error);
      Message.error('获取团队树失败');
      return [];
    } finally {
      setTreeLoading(false);
    }
  }, [selectedTreeNodeId]);

  // 获取角色列表
  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const response = await RoleService.getRoles({
        state: '1', // 只获取启用的角色
        roleType: 'team-role', // 只获取团队角色类型
        page: 0, // 后端分页从0开始
        size: 100
      });
      if (response.success) {
        setRoles(response.data || []);
      } else {
        Message.error('获取角色列表失败');
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
      Message.error('获取角色列表失败');
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // 根据teamId查找团队名称
  const findTeamNameById = useCallback((teamId: string, nodes: TeamDto[]): string => {
    for (const node of nodes) {
      if (node.teamId === teamId) {
        return node.teamName;
      }
      if (node.children && node.children.length > 0) {
        const found = findTeamNameById(teamId, node.children);
        if (found) return found;
      }
    }
    return '';
  }, []);

  // 获取团队成员列表
  const fetchTeamMembers = useCallback(async (params?: Partial<TeamQueryParams>) => {
    if (!selectedTreeNodeId) {
      setTeamMembers([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const teamName = findTeamNameById(selectedTreeNodeId, teamTree);
      if (!teamName) {
        Message.error('未找到对应的团队信息');
        return;
      }

      const queryParams = {
        page: currentPage - 1, // 后端从0开始
        size: pageSize,
        ...params,
      };
      
      const response = await teamService.getTeamMembers(teamName, queryParams);
      if (response.success) {
        setTeamMembers(response.data || []);
        setTotal(response.data.totalElements || 0);
      } else {
        Message.error('获取团队成员列表失败');
      }
    } catch (error) {
      console.error('获取团队成员列表失败:', error);
      Message.error('获取团队成员列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedTreeNodeId, teamTree, findTeamNameById]);

  // 初始化加载
  useEffect(() => {
    fetchTeamTree();
    fetchRoles();
  }, [fetchTeamTree, fetchRoles]);

  useEffect(() => {
    // 只有当selectedTreeNodeId存在时才获取成员列表
    if (selectedTreeNodeId) {
      fetchTeamMembers();
    }
  }, [fetchTeamMembers, selectedTreeNodeId]);

  // 查询
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setCurrentPage(1);
    fetchTeamMembers(values);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    setCurrentPage(1);
    setSelectedTreeNodeId('');
    fetchTeamMembers();
  };

  // 刷新
  const handleRefresh = () => {
    const values = form.getFieldsValue();
    fetchTeamMembers(values);
    fetchTeamTree();
  };

  // 分页变化
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
  };

  // 树节点选择
  const handleTreeSelect = (selectedKeys: string[]) => {
    const nodeId = selectedKeys[0] || '';
    setSelectedTreeNodeId(nodeId);
    setCurrentPage(1);
    const values = form.getFieldsValue();
    fetchTeamMembers(values);
  };

  // 团队树操作回调
  const handleTreeCreateTeam = (parentId?: string) => {
    setCurrentTeam(null);
    setParentTeamId(parentId);
    setCreateModalVisible(true);
  };

  const handleTreeEditTeam = (team: TeamDto) => {
    setCurrentTeam(team);
    setEditModalVisible(true);
  };

  const handleTreeDeleteTeam = (teamId: string) => {
    // 删除团队后，如果当前选中的是被删除的团队，需要重置为第一个团队
    if (selectedTreeNodeId === teamId) {
      // 先清空当前选中状态，避免在删除过程中触发成员查询
      setSelectedTreeNodeId('');
      setTeamMembers([]);
      setTotal(0);
      
      // 获取更新后的团队树，然后设置第一个团队为选中状态
      fetchTeamTree().then((updatedTeamTree) => {
        // 在团队树更新后，获取第一个团队的ID
        const getFirstTeamId = (nodes: TeamDto[]): string | null => {
          if (nodes && nodes.length > 0) {
            return nodes[0].teamId;
          }
          return null;
        };
        
        const firstTeamId = getFirstTeamId(updatedTeamTree);
        if (firstTeamId) {
          setSelectedTreeNodeId(firstTeamId);
          // selectedTreeNodeId变化会自动触发fetchTeamMembers
        }
        // 如果没有团队了，状态已经在上面清空了
      });
    } else {
      // 如果删除的不是当前选中的团队，只需要刷新团队树，不需要重新获取成员
      fetchTeamTree();
    }
  };

  // 展开全部
  const handleExpandAll = () => {
    const getAllKeys = (nodes: TeamDto[]): string[] => {
      let keys: string[] = [];
      nodes.forEach(node => {
        keys.push(node.teamId);
        if (node.children && node.children.length > 0) {
          keys = keys.concat(getAllKeys(node.children));
        }
      });
      return keys;
    };
    setExpandedKeys(getAllKeys(teamTree));
  };

  // 折叠全部
  const handleCollapseAll = () => {
    setExpandedKeys([]);
  };

  // 启用团队成员
  const handleEnableMember = async (member: TeamMemberDto) => {
    try {
      const response = await teamService.enableMember(member.memberId);
      if (response.success) {
        Message.success('启用成员成功');
        handleRefresh();
      } else {
        Message.error(response.message || '启用成员失败');
      }
    } catch (error) {
      console.error('启用成员失败:', error);
      Message.error('启用成员失败');
    }
  };

  // 禁用团队成员
  const handleDisableMember = async (member: TeamMemberDto) => {
    try {
      const response = await teamService.disableMember(member.memberId);
      if (response.success) {
        Message.success('禁用成员成功');
        handleRefresh();
      } else {
        Message.error(response.message || '禁用成员失败');
      }
    } catch (error) {
      console.error('禁用成员失败:', error);
      Message.error('禁用成员失败');
    }
  };

  // 删除团队成员
  const handleDeleteMember = async (member: TeamMemberDto) => {
    try {
      const response = await teamService.deleteTeamMember(member.memberId);
      if (response.success) {
        Message.success('删除成员成功');
        handleRefresh();
      } else {
        Message.error(response.message || '删除成员失败');
      }
    } catch (error) {
      console.error('删除成员失败:', error);
      Message.error('删除成员失败');
    }
  };

  // 编辑团队成员
  const handleEditMember = (member: TeamMemberDto) => {
    setCurrentMember(member);
    setEditMemberModalVisible(true);
  };

  // 模态框成功回调
  const handleModalSuccess = () => {
    setCreateModalVisible(false);
    setEditModalVisible(false);
    setEditMemberModalVisible(false);
    setCurrentTeam(null);
    setCurrentMember(null);
    fetchTeamMembers();
    fetchTeamTree();
  };

  // 渲染树节点
  const renderTreeNodes = (nodes: TeamDto[]): React.ReactNode => {
    return nodes.map(node => {
      const title = (
        <span className={styles.treeNodeTitle}>
          <IconFolder style={{ color: '#f7ba2a' }} />
          <span className={styles.treeNodeText}>{node.label || node.teamName}</span>
        </span>
      );
      
      if (node.children && node.children.length > 0) {
        return (
          <TreeNode key={node.teamId} title={title}>
            {renderTreeNodes(node.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={node.teamId} title={title} />;
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => {
        return (currentPage - 1) * pageSize + index + 1;
      },
    },

    {
      title: '用户ID',
      dataIndex: 'userId',
      width: 120,
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      width: 120,
    },

    {
      title: '角色名称',
      dataIndex: 'roleLabel',
      width: 120,
    },


  

    {
      title: '操作',
      dataIndex: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: TeamMemberDto) => (
        <Space>
          <Tooltip content="编辑">
              <Button
                 type="text"
                 size="small"
                 icon={<IconEdit />}
                 onClick={() => handleEditMember(record)}
               />
            </Tooltip>
          <Popconfirm
            title="确定要删除该成员吗？删除后不可恢复！"
            onOk={() => handleDeleteMember(record)}
          >
            <Tooltip content="删除">
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 转换数据格式
  const tableData: TeamMemberTableData[] = teamMembers.map(member => ({
    ...member,
    key: member.memberId,
  }));

  return (
    <div className={styles.teamManagement}>
      <Row gutter={16} className={styles.mainLayout}>
        {/* 左侧团队树 */}
        <Col span={4} className={styles.leftPanel}>
          <TeamTree
            teamTree={teamTree}
            selectedKeys={selectedTreeNodeId ? [selectedTreeNodeId] : []}
            onSelect={handleTreeSelect}
            onRefresh={fetchTeamTree}
            onCreateTeam={handleTreeCreateTeam}
            onEditTeam={handleTreeEditTeam}
            onDeleteTeam={handleTreeDeleteTeam}
          />
        </Col>

        {/* 右侧内容区 */}
        <Col span={20} className={styles.rightPanel}>
          {/* 过滤表单 */}
          <Card className={styles.filterCard}>
            <Form form={form} layout="horizontal" className={styles.filterForm}>
              <div className={styles.formRow}>
                <div className={styles.formItem}>
                  <FormItem field="userName" label="用户名" className={styles.arcoFormItem}>
                    <Input placeholder="请输入用户名" allowClear />
                  </FormItem>
                </div>
                <div className={styles.formItem}>
                  <FormItem field="roleName" label="角色名称" className={styles.arcoFormItem}>
                    <Select 
                      placeholder="请选择角色名称" 
                      allowClear
                      loading={rolesLoading}
                    >
                      {roles.map(role => (
                        <Select.Option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormItem>
                </div>

                <div className={styles.buttonGroup}>
                  <Button type="primary" onClick={handleSearch}>
                    查询
                  </Button>
                  <Button onClick={handleReset}>
                    重置
                  </Button>
                </div>
              </div>
            </Form>
          </Card>

          {/* 数据表格 */}
          <Card className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>团队成员列表</div>
              <div className={styles.tableActions}>
                <Button
                  type="primary"
                  icon={<IconPlus />}
                  onClick={() => setCreateMemberModalVisible(true)}
                >
                  新增成员
                </Button>
                <Button icon={<IconRefresh />} onClick={handleRefresh}>
                  刷新
                </Button>
              </div>
            </div>
            <Table
              columns={columns}
              data={tableData}
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
              rowKey="key"
            />
            
            {/* 分页 */}
            <div className={styles.paginationWrapper}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                showQuickJumper
                sizeCanChange
                sizeOptions={[10, 20, 50, 100]}
                onChange={handlePageChange}
                onPageSizeChange={handlePageChange}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 新增团队模态框 */}
      <CreateTeamModal
        visible={createModalVisible}
        teamTree={teamTree}
        parentTeamId={parentTeamId}
        onCancel={() => {
          setCreateModalVisible(false);
          setParentTeamId(undefined);
        }}
        onSuccess={handleModalSuccess}
      />
      
      {/* 编辑团队模态框 */}
      <EditTeamModal
        visible={editModalVisible}
        team={currentTeam}
        teamTree={teamTree}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentTeam(null);
        }}
        onSuccess={handleModalSuccess}
      />
      
      {/* 新增成员模态框 */}
      <CreateMemberModal
        visible={createMemberModalVisible}
        teamId={selectedTreeNodeId}
        teamName={findTeamNameById(selectedTreeNodeId, teamTree)}
        onCancel={() => setCreateMemberModalVisible(false)}
        onSuccess={() => {
          setCreateMemberModalVisible(false);
          fetchTeamMembers();
        }}
      />
      
      {/* 编辑成员模态框 */}
      <EditMemberModal
        visible={editMemberModalVisible}
        member={currentMember}
        onCancel={() => {
          setEditMemberModalVisible(false);
          setCurrentMember(null);
        }}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default TeamManagement;