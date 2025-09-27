import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Pagination,
  Message,
  Popconfirm,
  Tag,
  Space,
  Grid,
  Tooltip
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconEye,
  IconSearch,
  IconLock,
  IconUnlock,
  IconUser,
  IconSettings,
} from '@arco-design/web-react/icon';
import { RoleService } from '../../services/roleService';
import {
  RoleDto,
  RoleQueryParams,
  RoleStatsDto
} from '../../types/role';
import CreateRoleModal from './components/CreateRoleModal';
import EditRoleModal from './components/EditRoleModal';
import RoleDetailModal from './components/RoleDetailModal';
import RoleMenuConfigModal from './components/RoleMenuConfigModal';
import styles from './index.module.css';

const Row = Grid.Row;
const Col = Grid.Col;
const { Option } = Select;

const RoleManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState<RoleStatsDto | null>(null);
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [menuConfigModalVisible, setMenuConfigModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDto | null>(null);

  // 状态选项
  const stateOptions = [
    { label: '全部', value: '' },
    { label: '启用', value: '1' },
    { label: '禁用', value: '0' },
  ];

  // 角色类型选项
  const roleTypeOptions = [
    { label: '全部', value: '' },
    { label: '平台角色', value: 'plat-mgr' },
    { label: '团队角色', value: 'team-role' },
  ];

  // 获取角色列表
  const fetchRoles = useCallback(async (params?: Partial<RoleQueryParams>) => {
    setLoading(true);
    try {
      const queryParams: RoleQueryParams = {
        page: currentPage - 1, // 后端从0开始
        size: pageSize,
        sortBy: 'createDate',
        sortDir: 'desc',
        ...params,
      };
      
      const response = await RoleService.getRoles(queryParams);
      if (response.success) {
        setRoles(response.data);
        setTotal(response.totalElements);
      } else {
        Message.error('获取角色列表失败');
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
      Message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);


  // 初始化数据
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // 查询
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setCurrentPage(1);
    fetchRoles(values);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    setCurrentPage(1);
    fetchRoles();
  };

  // 刷新
  const handleRefresh = () => {
    const values = form.getFieldsValue();
    fetchRoles(values);
  };

  // 启用角色
  const handleEnableRole = async (role: RoleDto) => {
    try {
      const response = await RoleService.enableRole(role.roleId);
      if (response.success) {
        Message.success('启用角色成功');
        handleRefresh();
      } else {
        Message.error(response.message || '启用角色失败');
      }
    } catch (error) {
      console.error('启用角色失败:', error);
      Message.error('启用角色失败');
    }
  };

  // 禁用角色
  const handleDisableRole = async (role: RoleDto) => {
    try {
      const response = await RoleService.disableRole(role.roleId);
      if (response.success) {
        Message.success('禁用角色成功');
        handleRefresh();
      } else {
        Message.error(response.message || '禁用角色失败');
      }
    } catch (error) {
      console.error('禁用角色失败:', error);
      Message.error('禁用角色失败');
    }
  };

  // 删除角色
  const handleDeleteRole = async (role: RoleDto) => {
    try {
      const response = await RoleService.deleteRole(role.roleId);
      if (response.success) {
        Message.success('删除角色成功');
        handleRefresh();
      } else {
        Message.error(response.message || '删除角色失败');
      }
    } catch (error) {
      console.error('删除角色失败:', error);
      Message.error('删除角色失败');
    }
  };

  // 查看详情
  const handleViewDetail = (role: RoleDto) => {
    setSelectedRole(role);
    setDetailModalVisible(true);
  };

  // 编辑角色
  const handleEditRole = (role: RoleDto) => {
    setSelectedRole(role);
    setEditModalVisible(true);
  };

  // 配置菜单
  const handleConfigMenu = (role: RoleDto) => {
    setSelectedRole(role);
    setMenuConfigModalVisible(true);
  };

  // 分页变化
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // 渲染状态标签
  const renderStatus = (state: string) => {
    if (state === '1') {
      return <Tag color="green">启用</Tag>;
    } else {
      return <Tag color="red">禁用</Tag>;
    }
  };

  // 渲染角色类型
  const renderRoleType = (roleType: string) => {
    const typeMap: { [key: string]: { text: string; color: string } } = {
      'SYSTEM': { text: '系统角色', color: 'blue' },
      'BUSINESS': { text: '业务角色', color: 'orange' },
    };
    
    const type = typeMap[roleType] || { text: roleType, color: 'gray' };
    return <Tag color={type.color}>{type.text}</Tag>;
  };

  // 表格列定义
  const columns = [
    {
      title: '角色名称',
      dataIndex: 'roleName',
      width: 150,
    },
    {
      title: '角色类型',
      dataIndex: 'roleType',
      align: 'center',
      width: 120,
      render: (roleType: string) => renderRoleType(roleType),
    },
    {
      title: '状态',
      dataIndex: 'state',
      align: 'center',
      width: 80,
      render: (state: string) => renderStatus(state),
    },
    {
      title: '描述',
      dataIndex: 'roleDescr',
      render: (text: string) => (
        <div className={styles.description} title={text}>
          {text || '-'}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      width: 170,
      render: (createDt: string) => {
        if (!createDt) return '-';
        const date = new Date(createDt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      },
    },
    {
      title: '创建人',
      dataIndex: 'createUser',
      width: 100,
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: RoleDto) => (
        <Space size="small">
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleEditRole(record)}
            />
          </Tooltip>
          <Tooltip content="配置菜单">
            <Button
              type="text"
              size="small"
              icon={<IconSettings />}
              onClick={() => handleConfigMenu(record)}
            />
          </Tooltip>
          {record.state === '1' ? (
            <Popconfirm
              title="确定要禁用该用户吗？"
              onOk={() => handleDisableRole(record)}
            >
              <Tooltip content="禁用">
                <Button
                  type="text"
                  size="small"
                  status="warning"
                  icon={<IconLock />}
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确定要启用该用户吗？"
              onOk={() => handleEnableRole(record)}
            >
              <Tooltip content="启用">
                <Button
                  type="text"
                  size="small"
                  status="success"
                  icon={<IconUnlock />}
                />
              </Tooltip>
            </Popconfirm>
          )}
          <Tooltip content="删除">
            <Popconfirm
              title="确定要删除这个角色吗？"
              onOk={() => handleDeleteRole(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.roleManagement}>
      {/* 统计卡片 */}
      {stats && (
        <div className={styles.statsCards}>
          <Card className={`${styles.statsCard} ${styles.total}`}>
            <div className={styles.number}>{stats.totalCount}</div>
            <div className={styles.label}>总角色数</div>
          </Card>
          <Card className={`${styles.statsCard} ${styles.enabled}`}>
            <div className={styles.number}>{stats.enabledCount}</div>
            <div className={styles.label}>启用角色</div>
          </Card>
          <Card className={`${styles.statsCard} ${styles.disabled}`}>
            <div className={styles.number}>{stats.disabledCount}</div>
            <div className={styles.label}>禁用角色</div>
          </Card>
        </div>
      )}

      {/* 查询表单 */}
      <Card className={styles.queryForm}>
        <Form form={form} layout="horizontal">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item field="roleName" label="角色名称">
                <Input placeholder="请输入角色名称" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item field="roleType" label="角色类型">
                <Select placeholder="请选择角色类型" allowClear>
                  {roleTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item field="state" label="状态">
                <Select placeholder="请选择状态" allowClear>
                  {stateOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <div className={styles.buttonGroup}>
                <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
                  查询
                </Button>
                <Button onClick={handleReset}>
                  重置
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 角色表格 */}
      <Card className={styles.roleTable}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>角色列表</div>
          <div className={styles.tableActions}>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={() => setCreateModalVisible(true)}
            >
              新建角色
            </Button>
            <Button icon={<IconRefresh />} onClick={handleRefresh}>
              刷新
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          data={roles}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          rowKey="roleId"
        />
        
        {/* 分页 */}
        <div className={styles.paginationWrapper}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            showQuickJumper
            sizeOptions={[10, 20, 50, 100]}
            onChange={handlePageChange}
          />
        </div>
      </Card>

      {/* 新建角色模态框 */}
      <CreateRoleModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          handleRefresh();
        }}
      />

      {/* 编辑角色模态框 */}
      <EditRoleModal
        visible={editModalVisible}
        role={selectedRole}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedRole(null);
        }}
        onSuccess={() => {
          setEditModalVisible(false);
          setSelectedRole(null);
          handleRefresh();
        }}
      />

      {/* 角色详情模态框 */}
      <RoleDetailModal
        visible={detailModalVisible}
        role={selectedRole}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedRole(null);
        }}
      />

      {/* 角色菜单配置模态框 */}
      <RoleMenuConfigModal
        visible={menuConfigModalVisible}
        role={selectedRole}
        onCancel={() => {
          setMenuConfigModalVisible(false);
          setSelectedRole(null);
        }}
        onSuccess={() => {
          setMenuConfigModalVisible(false);
          setSelectedRole(null);
          Message.success('菜单权限配置成功');
        }}
      />
    </div>
  );
};

export default RoleManagement;