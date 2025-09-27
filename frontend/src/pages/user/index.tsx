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
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconLock,
  IconUnlock,
  IconUser,
  IconSettings,
} from '@arco-design/web-react/icon';
import { UserDto, UserQueryParams } from '../../types/user';
import { UserService } from '../../services/userService';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import AssignRolesModal from './components/AssignRolesModal';
import styles from './index.module.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;

const UserManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [assignRolesModalVisible, setAssignRolesModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);



  // 状态选项
  const stateOptions = [
    { label: '全部', value: '' },
    { label: '生效', value: '1' },
    { label: '失效', value: '0' },
  ];

  // 获取用户列表
  const fetchUsers = useCallback(async (params?: Partial<UserQueryParams>) => {
    setLoading(true);
    try {
      const queryParams: UserQueryParams = {
        page: currentPage - 1, // 后端从0开始
        size: pageSize,
        ...params,
      };
      
      const response = await UserService.getUsers(queryParams);
      if (response.success) {
        setUsers(response.data);
        setTotal(response.totalElements);
      } else {
        Message.error('获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      Message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // 初始化加载
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 查询
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setCurrentPage(1);
    fetchUsers(values);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    setCurrentPage(1);
    fetchUsers();
  };

  // 刷新
  const handleRefresh = () => {
    const values = form.getFieldsValue();
    fetchUsers(values);
  };

  // 启用用户
  const handleEnableUser = async (user: UserDto) => {
    try {
      const response = await UserService.enableUser(user.userId);
      if (response.success) {
        Message.success('启用用户成功');
        handleRefresh();
      } else {
        Message.error(response.message || '启用用户失败');
      }
    } catch (error) {
      console.error('启用用户失败:', error);
      Message.error('启用用户失败');
    }
  };

  // 禁用用户
  const handleDisableUser = async (user: UserDto) => {
    try {
      const response = await UserService.disableUser(user.userId);
      if (response.success) {
        Message.success('禁用用户成功');
        handleRefresh();
      } else {
        Message.error(response.message || '禁用用户失败');
      }
    } catch (error) {
      console.error('禁用用户失败:', error);
      Message.error('禁用用户失败');
    }
  };

  // 编辑用户
  const handleEditUser = (user: UserDto) => {
    setSelectedUser(user);
    setEditModalVisible(true);
  };

  // 重置密码
  const handleResetPassword = (user: UserDto) => {
    setSelectedUser(user);
    setResetPasswordModalVisible(true);
  };

  // 删除用户
  const handleDeleteUser = async (user: UserDto) => {
    try {
      const response = await UserService.deleteUser(user.id);
      if (response.success) {
        Message.success('删除用户成功');
        handleRefresh();
      } else {
        Message.error(response.message || '删除用户失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      Message.error('删除用户失败');
    }
  };

  // 角色配置
  const handleAssignRoles = (user: UserDto) => {
    setSelectedUser(user);
    setAssignRolesModalVisible(true);
  };

  // 分页变化
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // 表格列定义
  const columns = [
    {
      title: '用户账号',
      dataIndex: 'userId',
      width: 120,
    },
    {
      title: '用户姓名',
      dataIndex: 'userName',
      width: 100,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      render: (email: string) => email || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 120,
      render: (phone: string) => phone || '-',
    },

    {
      title: '角色',
      dataIndex: 'roles',
      render: (roles: any[]) => {
        if (!roles || roles.length === 0) return '-';
        return (
          <Space wrap>
            {roles.map((role, index) => (
              <Tag key={index} color="blue" size="small">
                {role.roleName}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'state',
      align: 'center',
      width: 80,
      render: (state: string) => {
        const stateText = state === '1' ? '生效' : '失效';
        const color = state === '1' ? 'green' : 'red';
        return (
          <Tag color={color} size="small">
            {stateText}
          </Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createDt',
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
      title: '操作',
      dataIndex: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: any, record: UserDto) => (
        <Space>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          {record.state === '1' ? (
            <Popconfirm
              title="确定要禁用该用户吗？"
              onOk={() => handleDisableUser(record)}
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
              onOk={() => handleEnableUser(record)}
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
          <Tooltip content="重置密码">
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<IconUser />}
              onClick={() => handleResetPassword(record)}
            />
          </Tooltip>
          <Tooltip content="角色配置">
            <Button
              type="text"
              size="small"
              icon={<IconSettings />}
              onClick={() => handleAssignRoles(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除该用户吗？"
            content="删除后将无法恢复，请谨慎操作！"
            onOk={() => handleDeleteUser(record)}
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

  return (
    <div className={styles.userManagement}>
      {/* 查询表单 */}
      <Card className={styles.queryForm}>
        <Form form={form}>
          <div className={styles.formRow}>
          <div className={styles.formItem}>
            <FormItem field="userId" label="用户账号" className={styles.arcoFormItem}>
              <Input placeholder="请输入用户账号" allowClear />
            </FormItem>
          </div>
          <div className={styles.formItem}>
            <FormItem field="name" label="用户姓名" className={styles.arcoFormItem}>
              <Input placeholder="请输入用户姓名" allowClear />
            </FormItem>
          </div>
          <div className={styles.formItem}>
            <FormItem field="state" label="状态" className={styles.arcoFormItem}>
              <Select placeholder="请选择状态" allowClear>
                {stateOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
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

      {/* 用户表格 */}
      <Card className={styles.userTable}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>用户列表</div>
          <div className={styles.tableActions}>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={() => setCreateModalVisible(true)}
            >
              新增用户
            </Button>
            <Button icon={<IconRefresh />} onClick={handleRefresh}>
              刷新
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          data={users}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          rowKey="id"
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

      {/* 新增用户模态框 */}
      <CreateUserModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          handleRefresh();
        }}

      />

      {/* 编辑用户模态框 */}
      <EditUserModal
        visible={editModalVisible}
        user={selectedUser}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setEditModalVisible(false);
          setSelectedUser(null);
          handleRefresh();
        }}

      />

      {/* 重置密码模态框 */}
      <ResetPasswordModal
        visible={resetPasswordModalVisible}
        user={selectedUser}
        onCancel={() => {
          setResetPasswordModalVisible(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setResetPasswordModalVisible(false);
          setSelectedUser(null);
        }}
      />

      {/* 角色配置模态框 */}
      <AssignRolesModal
        visible={assignRolesModalVisible}
        user={selectedUser}
        onCancel={() => {
          setAssignRolesModalVisible(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setAssignRolesModalVisible(false);
          setSelectedUser(null);
          handleRefresh();
        }}
      />
    </div>
  );
};

export default UserManagement;