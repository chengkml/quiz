import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Checkbox,
    Drawer,
    Dropdown,
    Form,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Pagination,
    Space,
    Spin,
    Table,
    Tag,
} from '@arco-design/web-react';
import './style/index.less';
import {
    deleteUser,
    disableUser,
    enableUser,
    getActiveRoles,
    getUserRoles,
    registerUser,
    replaceUserRoles,
    resetPassword,
    searchUsers,
    updateUser,
} from './api';
import {IconDelete, IconEdit, IconList, IconMenu, IconPlus, IconRefresh, IconUser,} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';

const {Content} = Layout;

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
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
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
        {label: '启用', value: 'ENABLED'},
        {label: '禁用', value: 'DISABLED'},
    ];

    // 角色分配 Drawer 与数据
    const [assignRoleVisible, setAssignRoleVisible] = useState(false);
    const [assignRoleLoading, setAssignRoleLoading] = useState(false);
    const [roleOptions, setRoleOptions] = useState([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);

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
            align: 'center',
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
            render: (value) => {
                if (!value) return '--';

                const now = new Date();
                const date = new Date(value);
                const diffMs = now.getTime() - date.getTime();
                const diffSeconds = Math.floor(diffMs / 1000);
                const diffMinutes = Math.floor(diffSeconds / 60);
                const diffHours = Math.floor(diffMinutes / 60);
                const diffDays = Math.floor(diffHours / 24);

                // 今天
                if (diffDays === 0) {
                    if (diffSeconds < 60) {
                        return `${diffSeconds}秒前`;
                    } else if (diffMinutes < 60) {
                        return `${diffMinutes}分钟前`;
                    } else {
                        return `${diffHours}小时前`;
                    }
                }
                // 昨天
                else if (diffDays === 1) {
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `昨天 ${hours}:${minutes}`;
                }
                // 昨天之前
                else {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                }
            },
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
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="large" className="dropdown-demo table-btn-group">
                    <Dropdown
                        position="bl"
                        droplist={
                            <Menu
                                onClickMenuItem={(key, e) => {
                                    handleMenuClick(key, e, record);
                                }}
                                className="handle-dropdown-menu"
                            >
                                <Menu.Item key="edit">
                                    <IconEdit style={{marginRight: '5px'}}/>
                                    编辑
                                </Menu.Item>
                                <Menu.Item key="resetPassword">
                                    <IconRefresh style={{marginRight: '5px'}}/>
                                    重置密码
                                </Menu.Item>
                                <Menu.Item key="assignRoles">
                                    <IconMenu style={{marginRight: '5px'}}/>
                                    分配角色
                                </Menu.Item>
                                <Menu.Item key="toggleState">
                                    <IconUser style={{marginRight: '5px'}}/>
                                    {record.state === 'ENABLED' ? '禁用' : '启用'}
                                </Menu.Item>
                                <Menu.Item key="delete">
                                    <IconDelete style={{marginRight: '5px'}}/>
                                    删除
                                </Menu.Item>
                            </Menu>
                        }
                    >
                        <Button
                            type="text"
                            className="more-btn"
                            onClick={e => {
                                e.stopPropagation();
                            }}
                        >
                            <IconList/>
                        </Button>
                    </Dropdown>
                </Space>
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
                sortBy: 'create_date',
                sortDir: 'desc',
            };

            const response = await searchUsers(queryParams);
            const {content, totalElements} = response.data;

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
        setPagination(prev => ({...prev, current: 1}));
        fetchUsers(values);
    };

    // 重置搜索
    const handleReset = () => {
        const resetParams = {userId: '', name: '', state: ''};
        setSearchParams(resetParams);
        setPagination(prev => ({...prev, current: 1}));
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

    // 打开角色分配抽屉并加载数据
    const openAssignRoles = async (record) => {
        setCurrentUser(record);
        setAssignRoleVisible(true);
        setAssignRoleLoading(true);
        try {
            const [activeResp, userResp] = await Promise.all([
                getActiveRoles(),
                getUserRoles(record.userId),
            ]);
            const activeRoles = activeResp.data || [];
            const userRoles = userResp.data || [];
            setRoleOptions(activeRoles);
            setSelectedRoleIds(userRoles.map(r => r.id));
        } catch (error) {
            Message.error('加载角色数据失败');
            console.error('加载角色数据失败:', error);
        } finally {
            setAssignRoleLoading(false);
        }
    };

    // 保存角色分配
    const handleAssignRolesSave = async () => {
        if (!currentUser) return;
        setAssignRoleLoading(true);
        try {
            await replaceUserRoles(currentUser.userId, selectedRoleIds);
            Message.success('角色分配已保存');
            setAssignRoleVisible(false);
        } catch (error) {
            if (error.response?.data?.message) {
                Message.error(error.response.data.message);
            } else {
                Message.error('保存角色分配失败');
            }
            console.error('保存角色分配失败:', error);
        } finally {
            setAssignRoleLoading(false);
        }
    };

    // 处理菜单点击
    const handleMenuClick = (key, event, record) => {
        event.stopPropagation();
        if (key === 'edit') {
            handleEdit(record);
        } else if (key === 'resetPassword') {
            handleResetPassword(record);
        } else if (key === 'assignRoles') {
            openAssignRoles(record);
        } else if (key === 'toggleState') {
            handleToggleState(record);
        } else if (key === 'delete') {
            handleDelete(record);
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
            <Content>
                {/* 搜索表单 */}
                <FilterForm
                    onSearch={handleSearch}
                    onReset={handleReset}
                >
                    <Form.Item field='userId' label='用户ID'>
                        <Input
                            placeholder='请输入用户ID关键词'
                        />
                    </Form.Item>
                    <Form.Item field='name' label='用户名'>
                        <Input
                            placeholder='请输入用户名关键词'
                        />
                    </Form.Item>
                </FilterForm>

                {/* 操作按钮 */}
                <div className="action-buttons">
                    <Button
                        type="primary"
                        icon={<IconPlus/>}
                        onClick={handleAdd}
                    >
                        新增用户
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

                {/* 分配角色抽屉 */}
                <Drawer
                    title={`分配角色${currentUser ? ` - ${currentUser.userName || currentUser.userId}` : ''}`}
                    visible={assignRoleVisible}
                    onCancel={() => setAssignRoleVisible(false)}
                    onOk={handleAssignRolesSave}
                    okButtonProps={{loading: assignRoleLoading}}
                >
                    <Spin loading={assignRoleLoading} tip="加载中...">
                        <div style={{maxHeight: 360, overflow: 'auto', paddingRight: 8}}>
                            <Checkbox.Group
                                value={selectedRoleIds}
                                onChange={vals => setSelectedRoleIds(vals)}
                            >
                                <Space direction="vertical" size={12} style={{width: '100%'}}>
                                    {roleOptions && roleOptions.length > 0 ? (
                                        roleOptions.map(role => (
                                            <Checkbox key={role.id} value={role.id}>
                                                <Space>
                                                    <Tag color={role.state === 'ENABLED' ? 'green' : 'red'}>
                                                        {role.state === 'ENABLED' ? '启用' : '禁用'}
                                                    </Tag>
                                                    <span>{role.name}</span>
                                                    <span style={{color: 'var(--color-text-3)'}}>（{role.id}）</span>
                                                </Space>
                                            </Checkbox>
                                        ))
                                    ) : (
                                        <span style={{color: 'var(--color-text-3)'}}>暂无启用角色</span>
                                    )}
                                </Space>
                            </Checkbox.Group>
                        </div>
                    </Spin>
                </Drawer>

                {/* 分页 */}
                <div className="pagination-wrapper">
                    <Pagination
                        {...pagination}
                        onChange={handlePageChange}
                    />
                </div>
            </Content>

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
                            {required: true, message: '请输入用户ID'},
                            {max: 32, message: '用户ID长度不能超过32个字符'},
                        ]}
                    >
                        <Input placeholder="请输入用户ID"/>
                    </Form.Item>
                    <Form.Item
                        label="用户姓名"
                        field="userName"
                        rules={[
                            {required: true, message: '请输入用户姓名'},
                            {max: 128, message: '用户姓名长度不能超过128个字符'},
                        ]}
                    >
                        <Input placeholder="请输入用户姓名"/>
                    </Form.Item>
                    <Form.Item
                        label="密码"
                        field="password"
                        rules={[
                            {required: true, message: '请输入密码'},
                            {minLength: 6, message: '密码长度至少6个字符'},
                            {maxLength: 20, message: '密码长度不能超过20个字符'},
                        ]}
                    >
                        <Input.Password placeholder="请输入密码"/>
                    </Form.Item>
                    <Form.Item
                        label="邮箱"
                        field="email"
                        rules={[
                            {type: 'email', message: '请输入正确的邮箱格式'},
                            {max: 64, message: '邮箱长度不能超过64个字符'},
                        ]}
                    >
                        <Input placeholder="请输入邮箱"/>
                    </Form.Item>
                    <Form.Item
                        label="手机号"
                        field="phone"
                        rules={[
                            {max: 16, message: '手机号长度不能超过16个字符'},
                        ]}
                    >
                        <Input placeholder="请输入手机号"/>
                    </Form.Item>
                    <Form.Item
                        label="头像URL"
                        field="logo"
                        rules={[
                            {max: 256, message: '头像URL长度不能超过256个字符'},
                        ]}
                    >
                        <Input placeholder="请输入头像URL"/>
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
                        <Input disabled/>
                    </Form.Item>
                    <Form.Item
                        label="用户姓名"
                        field="userName"
                        rules={[
                            {max: 128, message: '用户姓名长度不能超过128个字符'},
                        ]}
                    >
                        <Input placeholder="请输入用户姓名"/>
                    </Form.Item>
                    <Form.Item
                        label="邮箱"
                        field="email"
                        rules={[
                            {type: 'email', message: '请输入正确的邮箱格式'},
                            {max: 64, message: '邮箱长度不能超过64个字符'},
                        ]}
                    >
                        <Input placeholder="请输入邮箱"/>
                    </Form.Item>
                    <Form.Item
                        label="手机号"
                        field="phone"
                        rules={[
                            {max: 16, message: '手机号长度不能超过16个字符'},
                        ]}
                    >
                        <Input placeholder="请输入手机号"/>
                    </Form.Item>
                    <Form.Item
                        label="头像URL"
                        field="logo"
                        rules={[
                            {max: 256, message: '头像URL长度不能超过256个字符'},
                        ]}
                    >
                        <Input placeholder="请输入头像URL"/>
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
                            {required: true, message: '请输入新密码'},
                            {minLength: 6, message: '密码长度至少6个字符'},
                            {maxLength: 20, message: '密码长度不能超过20个字符'},
                        ]}
                    >
                        <Input.Password placeholder="请输入新密码"/>
                    </Form.Item>
                </Form>
                <p style={{color: '#666', fontSize: '12px'}}>
                    为用户 "{currentUser?.userName}" 重置密码
                </p>
            </Modal>
        </div>
    );
}

export default UserManager;