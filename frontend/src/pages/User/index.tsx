import React, { useEffect, useRef, useState } from 'react';
import {
    Button,
    Form,
    Input,
    Layout,
    Message,
    Modal,
    Pagination,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
} from '@arco-design/web-react';
import './style/index.less';
import {
    searchUsers,
    registerUser,
    updateUser,
    deleteUser,
    enableUser,
    disableUser,
    resetPassword,
    checkUserId,
} from './api';
import {
    IconDelete,
    IconEdit,
    IconEye,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconUser,
} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';

const { Content } = Layout;
const { Option } = Select;

function UserManager() {
    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 对话框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);

    // 分页状态
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // 搜索条件
    const [searchParams, setSearchParams] = useState({
        userId: '',
        name: '',
        state: '',
    });

    // 当前操作的用户
    const [currentUser, setCurrentUser] = useState(null);

    // 表单引用
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [resetPasswordForm] = Form.useForm();

    // 容器引用
    const containerRef = useRef(null);

    // 用户状态选项
    const userStateOptions = [
        { label: '启用', value: 'ENABLED' },
        { label: '禁用', value: 'DISABLED' },
    ];

    // 表格列定义
    const columns = [
        {
            title: '用户ID',
            dataIndex: 'userId',
            key: 'userId',
            width: 120,
            fixed: 'left',
        },
        {
            title: '用户姓名',
            dataIndex: 'userName',
            key: 'userName',
            width: 120,
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            width: 180,
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
            width: 120,
        },
        {
            title: '状态',
            dataIndex: 'state',
            key: 'state',
            width: 80,
            render: (state) => (
                <Tag color={state === 'ENABLED' ? 'green' : 'red'}>
                    {state === 'ENABLED' ? '启用' : '禁用'}
                </Tag>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            key: 'createDate',
            width: 160,
            render: (date) => date ? new Date(date).toLocaleString() : '-',
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            key: 'createUserName',
            width: 100,
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip content="编辑">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconEdit />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip content="重置密码">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconRefresh />}
                            onClick={() => handleResetPassword(record)}
                        />
                    </Tooltip>
                    <Tooltip content={record.state === 'ENABLED' ? '禁用' : '启用'}>
                        <Button
                            type="text"
                            size="small"
                            icon={<IconUser />}
                            onClick={() => handleToggleState(record)}
                        />
                    </Tooltip>
                    <Tooltip content="删除">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconDelete />}
                            onClick={() => handleDelete(record)}
                            status="danger"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // 搜索表单配置
    const searchFormItems = [
        {
            label: '用户ID',
            field: 'userId',
            component: <Input placeholder="请输入用户ID" />,
        },
        {
            label: '用户姓名',
            field: 'name',
            component: <Input placeholder="请输入用户姓名" />,
        },
        {
            label: '状态',
            field: 'state',
            component: (
                <Select placeholder="请选择状态" allowClear>
                    {userStateOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
            ),
        },
    ];

    // 获取用户列表
    const fetchUsers = async (params = {}) => {
        setTableLoading(true);
        try {
            const queryParams = {
                ...searchParams,
                ...params,
                page: pagination.current - 1,
                size: pagination.pageSize,
                sortBy: 'createDate',
                sortDir: 'desc',
            };

            const response = await searchUsers(queryParams);
            const { content, totalElements } = response.data;

            setTableData(content || []);
            setPagination(prev => ({
                ...prev,
                total: totalElements || 0,
            }));
        } catch (error) {
            Message.error('获取用户列表失败');
            console.error('获取用户列表失败:', error);
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索处理
    const handleSearch = (values) => {
        setSearchParams(values);
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchUsers(values);
    };

    // 重置搜索
    const handleReset = () => {
        const resetParams = { userId: '', name: '', state: '' };
        setSearchParams(resetParams);
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchUsers(resetParams);
    };

    // 添加用户
    const handleAdd = () => {
        setAddModalVisible(true);
        addForm.resetFields();
    };

    // 编辑用户
    const handleEdit = (record) => {
        setCurrentUser(record);
        setEditModalVisible(true);
        editForm.setFieldsValue({
            userId: record.userId,
            userName: record.userName,
            email: record.email,
            phone: record.phone,
            logo: record.logo,
        });
    };

    // 删除用户
    const handleDelete = (record) => {
        setCurrentUser(record);
        setDeleteModalVisible(true);
    };

    // 重置密码
    const handleResetPassword = (record) => {
        setCurrentUser(record);
        setResetPasswordModalVisible(true);
        resetPasswordForm.resetFields();
    };

    // 切换用户状态
    const handleToggleState = async (record) => {
        try {
            if (record.state === 'ENABLED') {
                await disableUser(record.userId);
                Message.success('用户已禁用');
            } else {
                await enableUser(record.userId);
                Message.success('用户已启用');
            }
            fetchUsers();
        } catch (error) {
            Message.error('操作失败');
            console.error('切换用户状态失败:', error);
        }
    };

    // 确认添加用户
    const handleAddConfirm = async () => {
        try {
            const values = await addForm.validate();
            await registerUser(values);
            Message.success('用户创建成功');
            setAddModalVisible(false);
            fetchUsers();
        } catch (error) {
            if (error.response?.data?.message) {
                Message.error(error.response.data.message);
            } else {
                Message.error('创建用户失败');
            }
            console.error('创建用户失败:', error);
        }
    };

    // 确认编辑用户
    const handleEditConfirm = async () => {
        try {
            const values = await editForm.validate();
            await updateUser(values);
            Message.success('用户信息更新成功');
            setEditModalVisible(false);
            fetchUsers();
        } catch (error) {
            Message.error('更新用户信息失败');
            console.error('更新用户信息失败:', error);
        }
    };

    // 确认删除用户
    const handleDeleteConfirm = async () => {
        try {
            await deleteUser(currentUser.userId);
            Message.success('用户删除成功');
            setDeleteModalVisible(false);
            fetchUsers();
        } catch (error) {
            Message.error('删除用户失败');
            console.error('删除用户失败:', error);
        }
    };

    // 确认重置密码
    const handleResetPasswordConfirm = async () => {
        try {
            const values = await resetPasswordForm.validate();
            await resetPassword(currentUser.userId, values.newPassword);
            Message.success('密码重置成功');
            setResetPasswordModalVisible(false);
        } catch (error) {
            Message.error('重置密码失败');
            console.error('重置密码失败:', error);
        }
    };

    // 分页处理
    const handlePageChange = (current, pageSize) => {
        setPagination(prev => ({
            ...prev,
            current,
            pageSize,
        }));
    };

    // 计算表格高度
    const calculateTableHeight = () => {
        if (containerRef.current) {
            const containerHeight = containerRef.current.clientHeight;
            const headerHeight = 120; // 搜索表单和按钮区域高度
            const paginationHeight = 60; // 分页区域高度
            const padding = 40; // 内边距
            const calculatedHeight = containerHeight - headerHeight - paginationHeight - padding;
            setTableScrollHeight(Math.max(calculatedHeight, 200));
        }
    };

    // 初始化和窗口大小变化处理
    useEffect(() => {
        fetchUsers();
        calculateTableHeight();

        const handleResize = () => {
            calculateTableHeight();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 分页变化时重新获取数据
    useEffect(() => {
        fetchUsers();
    }, [pagination.current, pagination.pageSize]);

    return (
        <div className="user-manager" ref={containerRef}>
            <Layout>
                <Content>
                    {/* 搜索表单 */}
                    <FilterForm
                        items={searchFormItems}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        initialValues={searchParams}
                    />

                    {/* 操作按钮 */}
                    <div className="action-buttons">
                        <Button
                            type="primary"
                            icon={<IconPlus />}
                            onClick={handleAdd}
                        >
                            新增用户
                        </Button>
                        <Button
                            icon={<IconRefresh />}
                            onClick={() => fetchUsers()}
                        >
                            刷新
                        </Button>
                    </div>

                    {/* 用户表格 */}
                    <Table
                        columns={columns}
                        data={tableData}
                        loading={tableLoading}
                        pagination={false}
                        scroll={{
                            x: 1200,
                            y: tableScrollHeight,
                        }}
                        rowKey="userId"
                        size="small"
                    />

                    {/* 分页 */}
                    <div className="pagination-wrapper">
                        <Pagination
                            current={pagination.current}
                            pageSize={pagination.pageSize}
                            total={pagination.total}
                            onChange={handlePageChange}
                            showTotal={(total, range) =>
                                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                            }
                            showSizeChanger
                            pageSizeOptions={['10', '20', '50', '100']}
                        />
                    </div>
                </Content>
            </Layout>

            {/* 新增用户对话框 */}
            <Modal
                title="新增用户"
                visible={addModalVisible}
                onOk={handleAddConfirm}
                onCancel={() => setAddModalVisible(false)}
                okText="确定"
                cancelText="取消"
            >
                <Form form={addForm} layout="vertical">
                    <Form.Item
                        label="用户ID"
                        field="userId"
                        rules={[
                            { required: true, message: '请输入用户ID' },
                            { max: 32, message: '用户ID长度不能超过32个字符' },
                        ]}
                    >
                        <Input placeholder="请输入用户ID" />
                    </Form.Item>
                    <Form.Item
                        label="用户姓名"
                        field="userName"
                        rules={[
                            { required: true, message: '请输入用户姓名' },
                            { max: 128, message: '用户姓名长度不能超过128个字符' },
                        ]}
                    >
                        <Input placeholder="请输入用户姓名" />
                    </Form.Item>
                    <Form.Item
                        label="密码"
                        field="password"
                        rules={[
                            { required: true, message: '请输入密码' },
                            { minLength: 6, message: '密码长度至少6个字符' },
                            { maxLength: 20, message: '密码长度不能超过20个字符' },
                        ]}
                    >
                        <Input.Password placeholder="请输入密码" />
                    </Form.Item>
                    <Form.Item
                        label="邮箱"
                        field="email"
                        rules={[
                            { type: 'email', message: '请输入正确的邮箱格式' },
                            { max: 64, message: '邮箱长度不能超过64个字符' },
                        ]}
                    >
                        <Input placeholder="请输入邮箱" />
                    </Form.Item>
                    <Form.Item
                        label="手机号"
                        field="phone"
                        rules={[
                            { max: 16, message: '手机号长度不能超过16个字符' },
                        ]}
                    >
                        <Input placeholder="请输入手机号" />
                    </Form.Item>
                    <Form.Item
                        label="头像URL"
                        field="logo"
                        rules={[
                            { max: 256, message: '头像URL长度不能超过256个字符' },
                        ]}
                    >
                        <Input placeholder="请输入头像URL" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑用户对话框 */}
            <Modal
                title="编辑用户"
                visible={editModalVisible}
                onOk={handleEditConfirm}
                onCancel={() => setEditModalVisible(false)}
                okText="确定"
                cancelText="取消"
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item
                        label="用户ID"
                        field="userId"
                    >
                        <Input disabled />
                    </Form.Item>
                    <Form.Item
                        label="用户姓名"
                        field="userName"
                        rules={[
                            { max: 128, message: '用户姓名长度不能超过128个字符' },
                        ]}
                    >
                        <Input placeholder="请输入用户姓名" />
                    </Form.Item>
                    <Form.Item
                        label="邮箱"
                        field="email"
                        rules={[
                            { type: 'email', message: '请输入正确的邮箱格式' },
                            { max: 64, message: '邮箱长度不能超过64个字符' },
                        ]}
                    >
                        <Input placeholder="请输入邮箱" />
                    </Form.Item>
                    <Form.Item
                        label="手机号"
                        field="phone"
                        rules={[
                            { max: 16, message: '手机号长度不能超过16个字符' },
                        ]}
                    >
                        <Input placeholder="请输入手机号" />
                    </Form.Item>
                    <Form.Item
                        label="头像URL"
                        field="logo"
                        rules={[
                            { max: 256, message: '头像URL长度不能超过256个字符' },
                        ]}
                    >
                        <Input placeholder="请输入头像URL" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 删除确认对话框 */}
            <Modal
                title="删除用户"
                visible={deleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={() => setDeleteModalVisible(false)}
                okText="确定"
                cancelText="取消"
            >
                <p>确定要删除用户 "{currentUser?.userName}" 吗？此操作不可恢复。</p>
            </Modal>

            {/* 重置密码对话框 */}
            <Modal
                title="重置密码"
                visible={resetPasswordModalVisible}
                onOk={handleResetPasswordConfirm}
                onCancel={() => setResetPasswordModalVisible(false)}
                okText="确定"
                cancelText="取消"
            >
                <Form form={resetPasswordForm} layout="vertical">
                    <Form.Item
                        label="新密码"
                        field="newPassword"
                        rules={[
                            { required: true, message: '请输入新密码' },
                            { minLength: 6, message: '密码长度至少6个字符' },
                            { maxLength: 20, message: '密码长度不能超过20个字符' },
                        ]}
                    >
                        <Input.Password placeholder="请输入新密码" />
                    </Form.Item>
                </Form>
                <p style={{ color: '#666', fontSize: '12px' }}>
                    为用户 "{currentUser?.userName}" 重置密码
                </p>
            </Modal>
        </div>
    );
}

export default UserManager;