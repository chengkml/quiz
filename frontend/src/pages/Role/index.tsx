import React, { useEffect, useRef, useState } from 'react';
import {
    Button,
    Dropdown,
    Form,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Pagination,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
} from '@arco-design/web-react';
import './style/index.less';
import {
    createRole,
    updateRole,
    deleteRole,
    getRoles,
    enableRole,
    disableRole,
    checkRoleName,
} from './api';
import {
    IconDelete,
    IconEdit,
    IconEye,
    IconList,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconUser,
} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';

const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

function RoleManager() {
    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 对话框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    // 分页状态
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // 搜索条件
    const [searchParams, setSearchParams] = useState({
        roleName: '',
        state: '',
    });

    // 当前操作的角色
    const [currentRole, setCurrentRole] = useState(null);

    // 表单引用
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();

    // 容器引用
    const containerRef = useRef(null);

    // 角色状态选项
    const roleStateOptions = [
        { label: '启用', value: 'ENABLED' },
        { label: '禁用', value: 'DISABLED' },
    ];

    // 表格列定义
    const columns = [
        {
            title: '角色ID',
            dataIndex: 'id',
            key: 'id',
            width: 120,
            fixed: 'left',
        },
        {
            title: '角色名称',
            dataIndex: 'name',
            key: 'name',
            width: 150,
        },
        {
            title: '角色描述',
            dataIndex: 'descr',
            key: 'descr',
            render: (descr) => descr || '-',
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
            render: (name) => name || '-',
        },
        {
            title: '更新时间',
            dataIndex: 'updateDate',
            key: 'updateDate',
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
                                <Menu.Item key="toggle">
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

    // FilterForm引用
    const filterFormRef = useRef(null);

    // 处理菜单点击
    const handleMenuClick = (key, event, record) => {
        event.stopPropagation();
        if (key === 'edit') {
            handleEdit(record);
        } else if (key === 'delete') {
            handleDelete(record);
        } else if (key === 'toggle') {
            handleToggleState(record);
        }
    };

    // 获取角色列表
    const fetchRoles = async (params = {}) => {
        setTableLoading(true);
        try {
            const queryParams = {
                roleName: searchParams.roleName || params.roleName,
                state: searchParams.state || params.state,
                page: pagination.current - 1,
                size: pagination.pageSize,
                sortBy: 'create_date',
                sortDir: 'desc',
            };

            const response = await getRoles(queryParams);
            const { content, totalElements } = response.data;

            setTableData(content || []);
            setPagination(prev => ({
                ...prev,
                total: totalElements || 0,
            }));
        } catch (error) {
            Message.error('获取角色列表失败');
            console.error('获取角色列表失败:', error);
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索处理
    const handleSearch = (values) => {
        setSearchParams(values);
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchRoles(values);
    };

    // 重置搜索
    const handleReset = () => {
        const resetParams = { roleName: '', state: '' };
        setSearchParams(resetParams);
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchRoles(resetParams);
    };

    // 添加角色
    const handleAdd = () => {
        setAddModalVisible(true);
        addForm.resetFields();
    };

    // 编辑角色
    const handleEdit = (record) => {
        setCurrentRole(record);
        setEditModalVisible(true);
        editForm.setFieldsValue({
            id: record.id,
            name: record.name,
            descr: record.descr,
        });
    };

    // 删除角色
    const handleDelete = (record) => {
        setCurrentRole(record);
        setDeleteModalVisible(true);
    };

    // 切换角色状态
    const handleToggleState = async (record) => {
        try {
            if (record.state === 'ENABLED') {
                await disableRole(record.id);
                Message.success('角色已禁用');
            } else {
                await enableRole(record.id);
                Message.success('角色已启用');
            }
            fetchRoles();
        } catch (error) {
            Message.error('操作失败');
            console.error('切换角色状态失败:', error);
        }
    };

    // 验证角色ID唯一性
    const validateRoleId = async (value, callback) => {
        if (!value) {
            return callback();
        }
        
        try {
            // 检查角色ID是否已存在（通过查询角色列表）
            const response = await getRoles({ 
                roleName: '', 
                state: '', 
                pageNum: 0, 
                pageSize: 1000 
            });
            
            const existingRole = response.data.content.find(role => role.id === value);
            if (existingRole) {
                callback('角色ID已存在');
            } else {
                callback();
            }
        } catch (error) {
            console.error('验证角色ID失败:', error);
            callback();
        }
    };

    // 验证角色名称唯一性
    const validateRoleName = async (value, callback) => {
        if (!value) {
            return callback();
        }
        
        try {
            const excludeRoleId = currentRole?.id || null;
            const response = await checkRoleName(value, excludeRoleId);
            if (response.data) {
                callback('角色名称已存在');
            } else {
                callback();
            }
        } catch (error) {
            console.error('验证角色名称失败:', error);
            callback();
        }
    };

    // 确认添加角色
    const handleAddConfirm = async () => {
        try {
            const values = await addForm.validate();
            await createRole(values);
            Message.success('角色创建成功');
            setAddModalVisible(false);
            fetchRoles();
        } catch (error) {
            if (error.response?.data?.message) {
                Message.error(error.response.data.message);
            } else {
                Message.error('创建角色失败');
            }
            console.error('创建角色失败:', error);
        }
    };

    // 确认编辑角色
    const handleEditConfirm = async () => {
        try {
            const values = await editForm.validate();
            await updateRole(values);
            Message.success('角色信息更新成功');
            setEditModalVisible(false);
            fetchRoles();
        } catch (error) {
            Message.error('更新角色信息失败');
            console.error('更新角色信息失败:', error);
        }
    };

    // 确认删除角色
    const handleDeleteConfirm = async () => {
        try {
            await deleteRole(currentRole.id);
            Message.success('角色删除成功');
            setDeleteModalVisible(false);
            fetchRoles();
        } catch (error) {
            Message.error('删除角色失败');
            console.error('删除角色失败:', error);
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
        fetchRoles();
        calculateTableHeight();

        const handleResize = () => {
            calculateTableHeight();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 分页变化时重新获取数据
    useEffect(() => {
        fetchRoles();
    }, [pagination.current, pagination.pageSize]);

    return (
        <div className="role-manager" ref={containerRef}>
            <Layout>
                <Content>
                    {/* 搜索表单 */}
                    <FilterForm
                        ref={filterFormRef}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        initialValues={searchParams}
                    >
                        <Form.Item field="roleName" label="角色名称">
                            <Input placeholder="请输入角色名称" />
                        </Form.Item>
                        <Form.Item field="state" label="状态">
                            <Select placeholder="请选择状态" allowClear>
                                {roleStateOptions.map(option => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </FilterForm>

                    {/* 操作按钮 */}
                    <div className="action-buttons">
                        <Button
                            type="primary"
                            icon={<IconPlus />}
                            onClick={handleAdd}
                        >
                            新增角色
                        </Button>
                    </div>

                    {/* 角色表格 */}
                    <Table
                        columns={columns}
                        data={tableData}
                        loading={tableLoading}
                        pagination={false}
                        scroll={{
                            x: 1200,
                            y: tableScrollHeight,
                        }}
                        rowKey="id"
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

            {/* 新增角色对话框 */}
            <Modal
                title="新增角色"
                visible={addModalVisible}
                onOk={handleAddConfirm}
                onCancel={() => setAddModalVisible(false)}
                okText="确定"
                cancelText="取消"
            >
                <Form form={addForm} layout="vertical">
                    <Form.Item
                        label="角色ID"
                        field="id"
                        rules={[
                            { required: true, message: '请输入角色ID' },
                            { max: 32, message: '角色ID长度不能超过32个字符' },
                            { 
                                pattern: /^[a-zA-Z0-9_-]+$/, 
                                message: '角色ID只能包含字母、数字、下划线和连字符' 
                            },
                            { validator: validateRoleId },
                        ]}
                    >
                        <Input placeholder="请输入角色ID（如：admin、user等）" />
                    </Form.Item>
                    <Form.Item
                        label="角色名称"
                        field="name"
                        rules={[
                            { required: true, message: '请输入角色名称' },
                            { max: 64, message: '角色名称长度不能超过64个字符' },
                            { validator: validateRoleName },
                        ]}
                    >
                        <Input placeholder="请输入角色名称" />
                    </Form.Item>
                    <Form.Item
                        label="角色描述"
                        field="descr"
                        rules={[
                            { max: 128, message: '角色描述长度不能超过128个字符' },
                        ]}
                    >
                        <TextArea 
                            placeholder="请输入角色描述" 
                            rows={3}
                            maxLength={128}
                            showWordLimit
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑角色对话框 */}
            <Modal
                title="编辑角色"
                visible={editModalVisible}
                onOk={handleEditConfirm}
                onCancel={() => setEditModalVisible(false)}
                okText="确定"
                cancelText="取消"
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item
                        label="角色ID"
                        field="id"
                    >
                        <Input disabled />
                    </Form.Item>
                    <Form.Item
                        label="角色名称"
                        field="name"
                        rules={[
                            { required: true, message: '请输入角色名称' },
                            { max: 64, message: '角色名称长度不能超过64个字符' },
                            { validator: validateRoleName },
                        ]}
                    >
                        <Input placeholder="请输入角色名称" />
                    </Form.Item>
                    <Form.Item
                        label="角色描述"
                        field="descr"
                        rules={[
                            { max: 128, message: '角色描述长度不能超过128个字符' },
                        ]}
                    >
                        <TextArea 
                            placeholder="请输入角色描述" 
                            rows={3}
                            maxLength={128}
                            showWordLimit
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 删除确认对话框 */}
            <Modal
                title="删除角色"
                visible={deleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={() => setDeleteModalVisible(false)}
                okText="确定"
                cancelText="取消"
            >
                <p>确定要删除角色 "{currentRole?.name}" 吗？此操作不可恢复。</p>
            </Modal>
        </div>
    );
}

export default RoleManager;