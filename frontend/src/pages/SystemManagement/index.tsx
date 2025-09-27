import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Message,
  Popconfirm,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconSearch,
} from '@arco-design/web-react/icon';
import './style.less';

const FormItem = Form.Item;
const Option = Select.Option;

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createTime: string;
}

const SystemManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'administrator',
      status: 'active',
      createTime: '2024-01-15 10:30:00',
    },
    {
      id: '2',
      username: 'user1',
      email: 'user1@example.com',
      role: 'user',
      status: 'active',
      createTime: '2024-01-16 14:20:00',
    },
    {
      id: '3',
      username: 'user2',
      email: 'user2@example.com',
      role: 'user',
      status: 'inactive',
      createTime: '2024-01-17 09:15:00',
    },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [form] = Form.useForm();

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={role === 'administrator' ? 'red' : 'blue'}>
          {role === 'administrator' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'gray'}>
          {status === 'active' ? '激活' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      width: 150,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onOk={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<IconDelete />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 过滤数据
  const filteredUsers = users.filter(user => {
    const matchSearch = !searchText || 
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !statusFilter || user.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // 处理新增用户
  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑用户
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  // 处理删除用户
  const handleDelete = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
    Message.success('删除成功');
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      
      // 模拟API调用
      setTimeout(() => {
        if (editingUser) {
          // 编辑用户
          setUsers(users.map(user => 
            user.id === editingUser.id ? { ...user, ...values } : user
          ));
          Message.success('用户更新成功');
        } else {
          // 新增用户
          const newUser: User = {
            id: String(Date.now()),
            ...values,
            createTime: new Date().toLocaleString('zh-CN'),
          };
          setUsers([...users, newUser]);
          Message.success('用户创建成功');
        }
        
        setModalVisible(false);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <div className="system-management">
      <div className="page-header">
        <h2>系统管理</h2>
        <p>管理系统用户和权限设置</p>
      </div>

      <Card>
        {/* 搜索和筛选 */}
        <div className="table-toolbar">
          <Space>
            <Input
              placeholder="搜索用户名或邮箱"
              prefix={<IconSearch />}
              value={searchText}
              onChange={setSearchText}
              style={{ width: 250 }}
            />
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              allowClear
            >
              <Option value="active">激活</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Space>
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={handleAdd}
          >
            新增用户
          </Button>
        </div>

        {/* 用户表格 */}
        <Table
          columns={columns}
          data={filteredUsers}
          pagination={{
            pageSize: 10,
            showTotal: true,
            showJumper: true,
            showPageSize: true,
          }}
          rowKey="id"
        />
      </Card>

      {/* 用户编辑模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="用户名"
            field="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </FormItem>
          <FormItem
            label="邮箱"
            field="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </FormItem>
          <FormItem
            label="角色"
            field="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="administrator">管理员</Option>
              <Option value="user">普通用户</Option>
            </Select>
          </FormItem>
          <FormItem
            label="状态"
            field="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">激活</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemManagement;